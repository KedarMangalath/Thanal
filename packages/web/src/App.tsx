import {
  calculateComfortScore,
  type ComfortScore as ComfortScoreType,
  type LatLng,
  type RouteAnalysis,
  type WeatherSnapshot
} from "@thanal/shared";
import {
  Bike,
  BookmarkPlus,
  Bus,
  Clock,
  Sparkles,
  MapPin,
  Navigation,
  Route,
  Search,
  Train,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import brandLogoUrl from "../../../assets/Thanal_Logo.png";
import brandTextUrl from "../../../assets/Thanal_text_png.png";
import ComfortScore from "./components/ComfortScore";
import MapPicker from "./components/MapPicker";
import RainWindow from "./components/RainWindow";
import SunTimeline from "./components/SunTimeline";
import {
  fetchRouteOptions,
  fetchRailRoute,
  fetchSavedRoutes,
  fetchWeather,
  askAssistant,
  deleteSavedRoute,
  saveRoute,
  searchPlaces,
  searchRailStations,
  type PlaceResult,
  type RouteOption,
  type SavedRoute
} from "./services/api";

function toDateTimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function App() {
  const [start, setStart] = useState<LatLng | null>(null);
  const [end, setEnd] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [departureTime, setDepartureTime] = useState(toDateTimeLocal(new Date()));
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"bus" | "bike" | "walk" | "train">("bus");
  const [status, setStatus] = useState("Tap the map to adjust start and destination.");
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeTarget, setPlaceTarget] = useState<"start" | "end">("start");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("Which option is most comfortable?");
  const [assistantAnswer, setAssistantAnswer] = useState("");
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  const comfort = useMemo<ComfortScoreType | null>(() => {
    return weather ? calculateComfortScore(weather) : null;
  }, [weather]);

  useEffect(() => {
    fetchSavedRoutes()
      .then(setSavedRoutes)
      .catch(() => setSavedRoutes([]));
  }, []);

  async function analyzeTrip() {
    if (!start || !end) {
      setStatus("Choose both start and destination points.");
      return;
    }

    setIsLoading(true);
    setStatus(
      mode === "train"
        ? "Finding the rail route and checking the sun angle."
        : "Fetching road route and checking the sun angle."
    );

    try {
      const departure = new Date(departureTime);
      if (mode === "train") {
        const rail = await fetchRailRoute({ start, end, departureTime: departure.toISOString() });
        const option = rail.options[0];

        setRoute(option?.coordinates ?? rail.coordinates);
        setRouteOptions(rail.options);
        setSelectedRouteId(option?.id ?? rail.recommendedOptionId);
        setAnalysis(option?.analysis ?? rail.analysis);
        setWeather(await fetchWeather(start));
        setStatus(`${rail.options.length} train route option${rail.options.length === 1 ? "" : "s"} found.`);
        return;
      }

      const response = await fetchRouteOptions({
        start,
        end,
        departureTime: departure.toISOString()
      });
      const option = response.options[0];

      setRoute(option?.coordinates ?? []);
      setRouteOptions(response.options);
      setSelectedRouteId(option?.id ?? response.recommendedOptionId);
      setAnalysis(option?.analysis ?? null);
      setWeather(await fetchWeather(start));
      setStatus(`${response.options.length} road route option${response.options.length === 1 ? "" : "s"} found.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not analyze this route.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleMapPick(point: LatLng) {
    if (!start || (start && end)) {
      setStart(point);
      setEnd(null);
      setRoute([]);
      setRouteOptions([]);
      setSelectedRouteId(null);
      setAnalysis(null);
      setStatus("Start set. Tap the destination.");
      return;
    }

    setEnd(point);
    setRouteOptions([]);
    setSelectedRouteId(null);
    setStatus("Destination set. Analyze when ready.");
  }

  function clearRoute() {
    setStart(null);
    setEnd(null);
    setRoute([]);
    setRouteOptions([]);
    setSelectedRouteId(null);
    setAnalysis(null);
    setWeather(null);
    setStatus("Route cleared. Search or tap a start point.");
  }

  async function saveCurrentRoute() {
    if (!start || !end) {
      setStatus("Choose both start and destination before saving.");
      return;
    }

    try {
      const saved = await saveRoute({
        name: `Bus route ${new Date(departureTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })}`,
        mode,
        start,
        end,
        departureTime: new Date(departureTime).toISOString()
      });

      setSavedRoutes((current) => [saved, ...current]);
      setStatus("Commute saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save commute.");
    }
  }

  async function runPlaceSearch() {
    if (placeQuery.trim().length < 2) {
      setStatus("Type at least two characters to search.");
      return;
    }

    try {
      setStatus(mode === "train" ? "Searching railway stations." : "Searching places in India.");
      setPlaceResults(
        mode === "train" ? await searchRailStations(placeQuery) : await searchPlaces(placeQuery)
      );
    } catch (error) {
      setPlaceResults([]);
      setStatus(error instanceof Error ? error.message : "Place search failed.");
    }
  }

  function selectPlace(place: PlaceResult) {
    const point = { lat: Number(place.lat), lng: Number(place.lon) };
    if (placeTarget === "start") {
      setStart(point);
    } else {
      setEnd(point);
    }

    setRoute([]);
    setRouteOptions([]);
    setSelectedRouteId(null);
    setAnalysis(null);
    setPlaceResults([]);
    setPlaceQuery("");
    setStatus(`${placeTarget === "start" ? "Start" : "Destination"} set from search.`);
  }

  async function removeSavedRoute(id: number) {
    try {
      await deleteSavedRoute(id);
      setSavedRoutes((current) => current.filter((saved) => saved.id !== id));
      setStatus("Saved commute deleted.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete commute.");
    }
  }

  async function runAssistant() {
    setIsAssistantLoading(true);
    setAssistantAnswer("");

    try {
      const response = await askAssistant({
        message: assistantMessage,
        mode,
        start,
        end,
        departureTime: new Date(departureTime).toISOString()
      });
      setAssistantAnswer(`${response.answer}\n\nModel: ${response.model}. Tools: ${response.toolTrace.length}.`);
    } catch (error) {
      setAssistantAnswer(error instanceof Error ? error.message : "Assistant failed.");
    } finally {
      setIsAssistantLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="map-region">
          <MapPicker
            start={start}
            end={end}
            route={route}
            routes={routeOptions}
            activeRouteId={selectedRouteId}
            onPick={handleMapPick}
          />
        </div>

        <aside className="control-panel">
          <div className="brand-row">
            <span className="brand-mark">
              <img alt="" src={brandLogoUrl} />
            </span>
            <div>
              <img alt="Thanal" className="brand-wordmark" src={brandTextUrl} />
              <p>Sun-aware travel for Kerala routes</p>
            </div>
          </div>

          <div className="mode-tabs" aria-label="Travel mode">
            <button
              className={mode === "bus" ? "active" : ""}
              type="button"
              onClick={() => setMode("bus")}
            >
              <Bus size={16} />
              Bus
            </button>
            <button
              className={mode === "bike" ? "active" : ""}
              type="button"
              onClick={() => setMode("bike")}
            >
              <Bike size={16} />
              Ride
            </button>
            <button
              className={mode === "train" ? "active" : ""}
              type="button"
              onClick={() => setMode("train")}
            >
              <Train size={16} />
              Train
            </button>
          </div>

          <label className="field">
            <span>
              <Clock size={16} />
              Departure
            </span>
            <input
              type="datetime-local"
              value={departureTime}
              onChange={(event) => setDepartureTime(event.target.value)}
            />
          </label>

          <section className="search-panel">
            <div className="segmented-control" aria-label="Search target">
              <button
                className={placeTarget === "start" ? "active" : ""}
                type="button"
                onClick={() => setPlaceTarget("start")}
              >
                Start
              </button>
              <button
                className={placeTarget === "end" ? "active" : ""}
                type="button"
                onClick={() => setPlaceTarget("end")}
              >
                End
              </button>
            </div>
            <div className="search-row">
              <input
                aria-label="Place search"
                placeholder="Search place"
                value={placeQuery}
                onChange={(event) => setPlaceQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void runPlaceSearch();
                }}
              />
              <button className="secondary icon-button" type="button" onClick={runPlaceSearch}>
                <Search size={17} />
              </button>
            </div>
            {placeResults.length > 0 ? (
              <div className="place-results">
                {placeResults.map((place) => (
                  <button
                    className="place-result"
                    key={place.place_id}
                    type="button"
                    onClick={() => selectPlace(place)}
                  >
                    {place.display_name}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <div className="point-list">
            <PointRow label="Start" point={start} />
            <PointRow label="Destination" point={end} />
          </div>

          <div className="action-row">
            <button className="secondary" type="button" onClick={clearRoute}>
              Clear
            </button>
            <button className="secondary" type="button" onClick={saveCurrentRoute}>
              <BookmarkPlus size={16} />
              Save
            </button>
            <button className="primary" type="button" onClick={analyzeTrip} disabled={isLoading}>
              <Navigation size={16} />
              {isLoading ? "Analyzing" : "Analyze"}
            </button>
          </div>

          <p className="status-line">{status}</p>

          {routeOptions.length > 0 ? (
            <section className="route-options">
              <div className="section-heading">
                <span>
                  <Route size={16} />
                  Route options
                </span>
                <strong>{routeOptions.length}</strong>
              </div>
              {routeOptions.map((option) => (
                <button
                  className={`route-option ${selectedRouteId === option.id ? "active" : ""}`}
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelectedRouteId(option.id);
                    setRoute(option.coordinates);
                    setAnalysis(option.analysis);
                  }}
                >
                  <span>{option.label}</span>
                  <strong>{Math.round(option.analysis.totalDurationMinutes)} min</strong>
                  <small>
                    {(option.analysis.totalDistanceMeters / 1000).toFixed(1)} km ·{" "}
                    {formatSeat(option.analysis.recommendedSeat)}
                  </small>
                </button>
              ))}
            </section>
          ) : null}

          <section className="assistant-card">
            <div className="section-heading">
              <span>
                <Sparkles size={16} />
                Ask Thanal
              </span>
            </div>
            <div className="assistant-row">
              <input
                aria-label="Ask Thanal"
                value={assistantMessage}
                onChange={(event) => setAssistantMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void runAssistant();
                }}
              />
              <button className="primary icon-button" type="button" onClick={runAssistant}>
                <Sparkles size={17} />
              </button>
            </div>
            {isAssistantLoading ? <p className="assistant-answer">Thinking with route tools...</p> : null}
            {assistantAnswer ? <p className="assistant-answer">{assistantAnswer}</p> : null}
          </section>

          {analysis ? (
            <>
              <section className="result-card recommendation">
                <span>Recommended seat</span>
                <strong>{formatSeat(analysis.recommendedSeat)}</strong>
                <small>
                  {Math.round(analysis.directSunMinutesBySide.left)} min sun on left,{" "}
                  {Math.round(analysis.directSunMinutesBySide.right)} min sun on right
                </small>
              </section>

              <SunTimeline analysis={analysis} />

              <section className="result-grid">
                <div className="metric-tile">
                  <span>Distance</span>
                  <strong>{(analysis.totalDistanceMeters / 1000).toFixed(1)} km</strong>
                </div>
                <div className="metric-tile">
                  <span>Duration</span>
                  <strong>{Math.round(analysis.totalDurationMinutes)} min</strong>
                </div>
              </section>

              {analysis.glareWindows.length > 0 ? (
                <section className="result-card alert">
                  <span>Glare warning</span>
                  <strong>{analysis.glareWindows.length} route segments</strong>
                  <small>Sun is close to the forward heading on parts of this route.</small>
                </section>
              ) : null}

              {comfort ? <ComfortScore comfort={comfort} /> : null}
              {weather ? (
                <RainWindow
                  probability={weather.precipitationProbability ?? 0}
                  timeline={weather.rainTimeline}
                />
              ) : null}
            </>
          ) : (
            <section className="empty-state">
              <MapPin size={22} />
              <p>
                {mode === "train"
                  ? "Search two railway stations, set your departure time, and run the sun analysis."
                  : "Tap two map points, set your departure time, and run the sun analysis."}
              </p>
            </section>
          )}

          {savedRoutes.length > 0 ? (
            <section className="result-card saved-list">
              <div className="section-heading">
                <span>Saved commutes</span>
                <strong>{savedRoutes.length}</strong>
              </div>
              {savedRoutes.slice(0, 3).map((saved) => (
                <div className="saved-route" key={saved.id}>
                  <button
                    className="saved-route-main"
                    type="button"
                    onClick={() => {
                      setStart({ lat: saved.startLat, lng: saved.startLng });
                      setEnd({ lat: saved.endLat, lng: saved.endLng });
                      if (saved.departureTime) {
                        setDepartureTime(toDateTimeLocal(new Date(saved.departureTime)));
                      }
                      setRoute([]);
                      setAnalysis(null);
                      setStatus(`${saved.name} loaded.`);
                    }}
                  >
                    <span>{saved.name}</span>
                    <small>{saved.mode.toUpperCase()}</small>
                  </button>
                  <button
                    aria-label={`Delete ${saved.name}`}
                    className="saved-route-delete"
                    type="button"
                    onClick={() => void removeSavedRoute(saved.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </section>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function PointRow({ label, point }: { label: string; point: LatLng | null }) {
  return (
    <div className="point-row">
      <span>{label}</span>
      <strong>{point ? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : "Not set"}</strong>
    </div>
  );
}

function formatSeat(seat: RouteAnalysis["recommendedSeat"]): string {
  if (seat === "either") return "Either side";
  return seat === "left" ? "Sit left" : "Sit right";
}
