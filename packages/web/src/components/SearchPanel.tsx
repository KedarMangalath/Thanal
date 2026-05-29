import type { LatLng } from "@thanal/shared";
import { ArrowUpDown, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { searchPlaces, searchRailStations, type PlaceResult } from "../services/api";

type WaypointData = { point: LatLng | null; name: string };

type SearchPanelProps = {
  mode: "bus" | "bike" | "walk" | "train";
  waypoints: WaypointData[];
  onWaypointChange: (index: number, point: LatLng | null, name: string) => void;
  onAddWaypoint: () => void;
  onRemoveWaypoint: (index: number) => void;
  onSwap: (i: number, j: number) => void;
};

export default function SearchPanel({
  mode,
  waypoints,
  onWaypointChange,
  onAddWaypoint,
  onRemoveWaypoint,
  onSwap
}: SearchPanelProps) {
  return (
    <div className="place-inputs">
      <div className="place-dots">
        {waypoints.map((_, i) => (
          <div key={`dot-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className={i === 0 ? "dot-start" : i === waypoints.length - 1 ? "dot-end" : "dot-mid"} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: i === 0 ? "var(--accent)" : i === waypoints.length - 1 ? "var(--warning)" : "var(--border)"
            }} />
            {i < waypoints.length - 1 && <span className="dot-line" style={{ flex: 1, minHeight: 40 }} />}
          </div>
        ))}
      </div>
      <div className="place-fields">
        {waypoints.map((wp, i) => (
          <div key={`field-${i}`} style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
            <PlaceInput
              mode={mode}
              placeholder={i === 0 ? (mode === "train" ? "Boarding station" : "From") : i === waypoints.length - 1 ? (mode === "train" ? "Destination station" : "To") : "Stop"}
              selectedName={wp.name}
              onClear={() => onWaypointChange(i, null, "")}
              onSelect={(p, n) => onWaypointChange(i, p, n)}
            />
            {waypoints.length > 2 && (
              <button type="button" onClick={() => onRemoveWaypoint(i)} className="remove-waypoint" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          {waypoints.length < 5 && (
            <button type="button" onClick={onAddWaypoint} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
              + Add stop
            </button>
          )}
          {waypoints.length === 2 && (
            <button
              aria-label="Swap"
              className="swap-button"
              type="button"
              onClick={() => onSwap(0, 1)}
            >
              <ArrowUpDown size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PlaceInput({
  mode,
  placeholder,
  selectedName,
  onClear,
  onSelect
}: {
  mode: "bus" | "bike" | "walk" | "train";
  placeholder: string;
  selectedName: string;
  onClear: () => void;
  onSelect: (point: LatLng, name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const displayValue = selectedName || query;
  const isSelected = Boolean(selectedName);

  const searcher = mode === "train" ? searchRailStations : searchPlaces;

  const doSearch = useCallback(
    async (term: string) => {
      if (term.trim().length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      try {
        const places = await searcher(term);
        setResults(places);
        setShowDropdown(true);
        setActiveIndex(-1);
      } catch {
        setResults([]);
        setShowDropdown(true);
      }
    },
    [searcher]
  );

  function handleChange(value: string) {
    setQuery(value);

    if (isSelected) {
      onClear();
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 250);
  }

  function handleSelect(place: PlaceResult) {
    const point: LatLng = { lat: Number(place.lat), lng: Number(place.lon) };
    const name = shortName(place.display_name);
    onSelect(point, name);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!showDropdown) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (event.key === "Escape") {
      setShowDropdown(false);
    }
  }

  function handleFocus() {
    if (isSelected) {
      setQuery(selectedName);
      onClear();
    }
    if (results.length > 0) {
      setShowDropdown(true);
    }
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    onClear();
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="place-field-wrapper" ref={wrapperRef}>
      <input
        aria-label={placeholder}
        className={`place-input ${isSelected ? "has-value" : ""}`}
        placeholder={placeholder}
        value={isSelected ? selectedName : query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
      />
      {(isSelected || query) && (
        <button
          className="place-clear visible"
          type="button"
          onClick={handleClear}
        >
          <X size={14} />
        </button>
      )}
      {showDropdown && (
        <div className="search-dropdown">
          {results.length > 0 ? (
            results.map((place, index) => (
              <button
                className={`search-result ${index === activeIndex ? "active" : ""}`}
                key={place.place_id}
                style={index === activeIndex ? { background: "var(--surface-hover)" } : undefined}
                type="button"
                onClick={() => handleSelect(place)}
              >
                <span className="search-result-name">{shortName(place.display_name)}</span>
                <span className="search-result-detail">{place.display_name}</span>
              </button>
            ))
          ) : (
            <div className="search-result" style={{ color: "var(--text-muted)", cursor: "default" }}>
              No places found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function shortName(displayName: string) {
  return displayName.split(",").slice(0, 2).join(",").trim();
}
