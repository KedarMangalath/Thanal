import type { LatLng, SpeedCamera, Washroom, RouteAnalysis } from "@thanal/shared";
import { MapPin, X } from "lucide-react";
import L from "leaflet";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents, Popup } from "react-leaflet";
import type { MapLayer } from "./LayerToggle";
import CommunityModal from "./CommunityModal";
import ReportModal from "./ReportModal";

type MapPickerProps = {
  waypoints: (LatLng | null)[];
  route: LatLng[];
  routes?: Array<{ id: string; coordinates: LatLng[] }>;
  activeRouteId?: string | null;
  layer?: MapLayer;
  theme?: "light" | "dark";
  speedCameras?: SpeedCamera[];
  washrooms?: Washroom[];
  analysis?: RouteAnalysis;
  onPick: (point: LatLng) => void;
  isReportingMode?: boolean;
  setIsReportingMode?: (val: boolean) => void;
  reportLocation?: LatLng | null;
  setReportLocation?: (val: LatLng | null) => void;
  showReportModal?: boolean;
  setShowReportModal?: (val: boolean) => void;
};

const TILE_URLS: Record<MapLayer | "standardDark", string> = {
  standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  standardDark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  terrain: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
};

const TILE_ATTRIBUTION: Record<MapLayer | "standardDark", string> = {
  standard: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  standardDark: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  satellite: '&copy; <a href="https://www.esri.com">Esri</a>',
  terrain: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
};

const ROUTE_COLORS = ["#0D9488", "#6366F1", "#D97706"];

const startIcon = new L.DivIcon({
  className: "marker-pin marker-start",
  html: "<span>S</span>",
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const endIcon = new L.DivIcon({
  className: "marker-pin marker-end",
  html: "<span>E</span>",
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

function createWaypointIcon(index: number) {
  return new L.DivIcon({
    className: `marker-pin marker-waypoint marker-${index}`,
    html: `<span>${index + 1}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

const cameraIcon = new L.DivIcon({
  className: "marker-pin marker-camera",
  html: "<span>📸</span>",
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const washroomIcon = new L.DivIcon({
  className: "marker-pin marker-washroom",
  html: "<span>🚽</span>",
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function createWashroomIcon(w: Washroom) {
  const isGood = w.status === "good";
  const isBad = w.status === "bad";
  const color = isGood ? "#22c55e" : isBad ? "#ef4444" : "#9ca3af";
  const label = w.type === 'fuel_station' ? '⛽' : '🚽';
  
  const totalVotes = w.upvotes + w.downvotes;
  const accuracy = totalVotes > 0 ? Math.round((w.upvotes / totalVotes) * 100) : 0;
  
  return new L.DivIcon({
    className: "custom-washroom-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: var(--surface);
        border: 3px solid ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 6px rgba(0,0,0,0.16);
        position: relative;
        font-size: 16px;
        color: var(--text-primary);
      ">
        <span>${label}</span>
        ${totalVotes > 0 ? `
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: ${color};
            color: #fff;
            font-size: 8px;
            font-weight: bold;
            padding: 1px 4px;
            border-radius: 6px;
            border: 1px solid var(--surface);
          ">
            ${accuracy}%
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

function createCameraIcon(cam: SpeedCamera) {
  const color = cam.verified ? "var(--success)" : "var(--warning)";
  return new L.DivIcon({
    className: "custom-camera-marker",
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: var(--surface);
        border: 2px solid ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        font-size: 13px;
      ">
        📸
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

const EMPTY_WASHROOMS: Washroom[] = [];

export default function MapPicker({
  waypoints,
  route,
  routes = [],
  activeRouteId,
  layer = "standard",
  theme = "light",
  speedCameras = [],
  washrooms = EMPTY_WASHROOMS,
  analysis,
  onPick,
  isReportingMode = false,
  setIsReportingMode,
  reportLocation = null,
  setReportLocation,
  showReportModal = false,
  setShowReportModal
}: MapPickerProps) {
  const [selectedWashroom, setSelectedWashroom] = useState<Washroom | null>(null);
  const [localWashrooms, setLocalWashrooms] = useState<Washroom[]>(washrooms);
  const [reportedCameras, setReportedCameras] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLocalWashrooms(washrooms);
  }, [washrooms]);

  const visibleRoutes =
    routes.length > 0
      ? routes
      : route.length > 1
        ? [{ id: "route", coordinates: route }]
        : [];

  return (
    <>
    {isReportingMode && (
      <div className="contribution-toast">
        <span className="pulse-dot" style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%', display: 'inline-block' }} />
        <span>
          <span className="desktop-only">Contribution Mode Active — </span>
          <span>Tap map to drop a washroom pin</span>
        </span>
        <button 
          onClick={() => setIsReportingMode?.(false)} 
          style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '8px', opacity: 0.8 }}
          aria-label="Cancel contribution"
        >
          <X size={16} />
        </button>
      </div>
    )}
    <MapContainer
      center={[10.0, 76.3]}
      zoom={8}
      className="map-canvas"
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        key={`${layer}-${theme}`}
        attribution={layer === "standard" && theme === "dark" ? TILE_ATTRIBUTION.standardDark : TILE_ATTRIBUTION[layer]}
        url={layer === "standard" && theme === "dark" ? TILE_URLS.standardDark : TILE_URLS[layer]}
      />
      <MapEffects waypoints={waypoints} route={route} />
      <MapClickHandler 
        onPick={(pt) => {
          if (isReportingMode) {
            setReportLocation?.(pt);
            setIsReportingMode?.(false);
            setShowReportModal?.(false);
          } else {
            onPick(pt);
          }
        }} 
      />
      
      {waypoints.map((wp, index) => {
        if (!wp) return null;
        return (
          <Marker 
            key={`wp-${index}`} 
            position={[wp.lat, wp.lng]} 
            icon={index === 0 ? startIcon : index === waypoints.length - 1 ? endIcon : createWaypointIcon(index)} 
          />
        );
      })}

      {visibleRoutes.map((candidate, index) => {
        const isActive = !activeRouteId || candidate.id === activeRouteId;
        const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
        return (
          <Polyline
            key={candidate.id}
            positions={candidate.coordinates.map((p) => [p.lat, p.lng])}
            pathOptions={{
              color: isActive ? color : "#94A3B8",
              weight: isActive ? 6 : 3,
              opacity: isActive ? 0.9 : 0.4,
              dashArray: isActive ? undefined : "8 6"
            }}
          />
        );
      })}

      {analysis?.glareWindows.map((gw, idx) => (
        <Polyline
          key={`glare-${idx}`}
          positions={[[gw.start.lat, gw.start.lng], [gw.end.lat, gw.end.lng]]}
          pathOptions={{
            color: "var(--warning)",
            weight: 6,
            className: "glare-pulse",
            lineCap: "round"
          }}
        />
      ))}

      {speedCameras.map((cam, idx) => (
        <Marker 
          key={`cam-${cam.id || idx}`} 
          position={[cam.lat, cam.lng]} 
          icon={createCameraIcon(cam)} 
        >
          <Popup>
            <div style={{ textAlign: "center" }}>
              <strong style={{ display: "block", marginBottom: "8px" }}>AI Speed Camera</strong>
              {cam.verified ? (
                <span style={{ display: "inline-block", background: "var(--success)", color: "#fff", fontSize: "10px", padding: "2px 8px", borderRadius: "12px", marginBottom: "12px", fontWeight: 600 }}>Verified</span>
              ) : (
                <span style={{ display: "inline-block", background: "var(--warning)", color: "#fff", fontSize: "10px", padding: "2px 8px", borderRadius: "12px", marginBottom: "12px", fontWeight: 600 }}>Unverified</span>
              )}
              <button 
                className="secondary-btn" 
                style={{ fontSize: "12px", padding: "4px 8px" }}
                disabled={reportedCameras.has(cam.id)}
                onClick={() => {
                  fetch(`http://localhost:4010/api/community/speed-camera/${cam.id}/report`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "incorrect_location" })
                  }).then(() => {
                    setReportedCameras(prev => new Set(prev).add(cam.id));
                  });
                }}
              >
                {reportedCameras.has(cam.id) ? "Reported!" : "Report Incorrect"}
              </button>
            </div>
          </Popup>
        </Marker>
      ))}

      {localWashrooms.map((w, idx) => (
        <Marker 
          key={`washroom-${w.id || idx}`} 
          position={[w.lat, w.lng]} 
          icon={createWashroomIcon(w)}
          eventHandlers={{ click: () => setSelectedWashroom(w) }}
        />
      ))}

      {reportLocation && (
        <Marker 
          position={[reportLocation.lat, reportLocation.lng]} 
          icon={new L.DivIcon({
            className: "marker-pin marker-report",
            html: "<span>📍</span>",
            iconSize: [28, 28],
            iconAnchor: [14, 28]
          })} 
          eventHandlers={{
            add: (e) => {
              e.target.openPopup();
            }
          }}
        >
          <Popup autoPan={false}>
            <div style={{ textAlign: 'center', padding: '6px', minWidth: '150px' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '13px' }}>Contribute Location</p>
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                {reportLocation.lat.toFixed(4)}, {reportLocation.lng.toFixed(4)}
              </p>
              <button 
                className="primary-btn" 
                style={{ fontSize: '12px', padding: '6px 12px', width: '100%' }}
                onClick={() => setShowReportModal?.(true)}
              >
                Add Details
              </button>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
    {selectedWashroom && (
      <CommunityModal 
        washroom={selectedWashroom} 
        onClose={() => setSelectedWashroom(null)}
        onVote={(id, vote) => {
          setLocalWashrooms(current => current.map(cw => {
            if (cw.id === id) {
              return { 
                ...cw, 
                upvotes: vote === 'up' ? cw.upvotes + 1 : cw.upvotes,
                downvotes: vote === 'down' ? cw.downvotes + 1 : cw.downvotes
              };
            }
            return cw;
          }));
        }}
      />
    )}
    {reportLocation && showReportModal && (
      <ReportModal 
        location={reportLocation} 
        onClose={() => setShowReportModal?.(false)}
        onSubmit={() => {
          setShowReportModal?.(false);
          setReportLocation?.(null);
        }}
      />
    )}

    {/* Floating action button for reporting */}
    <div className="desktop-only" style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 1000 }}>
      {isReportingMode ? (
        <div style={{ background: 'var(--surface)', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--accent)' }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>Tap on the map to drop pin</span>
          <button className="icon-btn" onClick={() => setIsReportingMode?.(false)} style={{ padding: '4px' }}><X size={14} /></button>
        </div>
      ) : (
        <button 
          onClick={() => {
            setIsReportingMode?.(true);
            setReportLocation?.(null);
          }}
          style={{ 
            background: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--border)', 
            padding: '8px 16px', borderRadius: '24px', fontSize: '13px', fontWeight: 600, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' 
          }}
        >
          <MapPin size={14} /> Contribute Location
        </button>
      )}
    </div>
    </>
  );
}

function MapClickHandler({ onPick }: { onPick: (point: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    }
  });
  return null;
}

function MapEffects({
  waypoints,
  route
}: {
  waypoints: (LatLng | null)[];
  route: LatLng[];
}) {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    if (route.length > 1) {
      const bounds = L.latLngBounds(route.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      const validPoints = waypoints.filter((wp): wp is LatLng => wp !== null);
      if (validPoints.length === 1) {
        map.setView([validPoints[0].lat, validPoints[0].lng], 13);
      } else if (validPoints.length > 1) {
        const bounds = L.latLngBounds(validPoints.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [map, route, waypoints]);

  return null;
}

function GeolocateOnMount() {
  const map = useMap();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.flyTo([position.coords.latitude, position.coords.longitude], 11, {
            animate: true,
            duration: 1
          });
        },
        () => {
          /* User denied or unavailable — keep default Kerala center */
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    }
  }, [map]);

  return null;
}
