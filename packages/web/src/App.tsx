import {
  calculateComfortScore,
  type ComfortScore as ComfortScoreType,
  type LatLng,
  type RouteAnalysis,
  type WeatherSnapshot
} from "@thanal/shared";
import { Bath, Bike, BookmarkPlus, Bus, Camera, ChevronDown, ChevronRight, ChevronUp, Clock, MapPin, Train, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import brandLogoUrl from "../../../assets/Thanal_text_png.png";
import ComfortScore from "./components/ComfortScore";
import LayerToggle, { type MapLayer } from "./components/LayerToggle";
import LoadingDots from "./components/LoadingDots";
import MapPicker from "./components/MapPicker";
import RainWindow from "./components/RainWindow";
import SearchPanel from "./components/SearchPanel";
import SunTimeline from "./components/SunTimeline";
import SunTrajectoryChart from "./components/SunTrajectoryChart";
import ThemeToggle, { useTheme } from "./components/ThemeToggle";
import TripInsight from "./components/TripInsight";
import SettingsModal, { type Language } from "./components/SettingsModal";
import CookiePrompt from "./components/CookiePrompt";
import AdminDashboard from "./components/AdminDashboard";
import WelcomeTour from "./components/WelcomeTour";
import {
  deleteSavedRoute,
  fetchRailRoute,
  fetchRouteOptions,
  fetchSavedRoutes,
  fetchWeather,
  reverseGeocode,
  saveRoute,
  type RouteOption,
  type SavedRoute
} from "./services/api";

type TravelMode = "bus" | "bike" | "walk" | "train";

function toDateTimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();

  // Location state
  const [waypoints, setWaypoints] = useState<{ point: LatLng | null; name: string }[]>([
    { point: null, name: "" },
    { point: null, name: "" }
  ]);

  const start = waypoints[0]?.point ?? null;
  const end = waypoints[waypoints.length - 1]?.point ?? null;
  const startName = waypoints[0]?.name ?? "";
  const endName = waypoints[waypoints.length - 1]?.name ?? "";

  // Feature Toggles
  const [features, setFeatures] = useState({
    cameras: localStorage.getItem("thanal_feat_cameras") === "true", // OFF by default
    washrooms: localStorage.getItem("thanal_feat_washrooms") === "true", // OFF by default
    rain: localStorage.getItem("thanal_feat_rain") !== "false",
    sun: localStorage.getItem("thanal_feat_sun") !== "false"
  });

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(`thanal_feat_${key}`, String(next[key]));
      return next;
    });
  };

  // Route state
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // UI state
  const [mode, setMode] = useState<TravelMode>("train");
  const [departureTime, setDepartureTime] = useState(toDateTimeLocal(new Date()));
  const [timeType, setTimeType] = useState<"depart" | "arrive">("depart");
  const [mapLayer, setMapLayer] = useState<MapLayer>("standard");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [status, setStatus] = useState("");
  const [language, setLanguage] = useState<Language>("english");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"preferences" | "saved" | "about" | "feedback">("preferences");
  const [mobileView, setMobileView] = useState<"search" | "map" | "details">("search");

  function openSettings(tab: "preferences" | "saved" | "about" | "feedback" = "preferences") {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  }
  const [reportLocation, setReportLocation] = useState<LatLng | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  
  const sidebarRef = useRef<HTMLElement>(null);
  
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(() => {
    const saved = localStorage.getItem("thanal_cookie_consent");
    return saved ? saved === "true" : null;
  });

  const handleCookieConsentChange = (consent: boolean) => {
    setCookieConsent(consent);
    localStorage.setItem("thanal_cookie_consent", String(consent));
  };

  const comfort = useMemo<ComfortScoreType | null>(
    () => (weather ? calculateComfortScore(weather) : null),
    [weather]
  );

  // Auto-analyze trigger ref to prevent double-fire
  const analyzeTriggered = useRef(false);

  const [isAdminOpen, setIsAdminOpen] = useState(() => window.location.hash === "#admin");
  const [isReportingMode, setIsReportingMode] = useState(false);

  useEffect(() => {
    const handleRouting = () => {
      setIsAdminOpen(window.location.hash === "#admin" || window.location.pathname === "/admin");
    };
    handleRouting(); // check on mount
    window.addEventListener("hashchange", handleRouting);
    window.addEventListener("popstate", handleRouting);
    return () => {
      window.removeEventListener("hashchange", handleRouting);
      window.removeEventListener("popstate", handleRouting);
    };
  }, []);

  // Load saved routes on mount
  useEffect(() => {
    fetchSavedRoutes().then(setSavedRoutes).catch(() => setSavedRoutes([]));
  }, []);

  // Auto-analyze when inputs change
  useEffect(() => {
    if (waypoints.filter(w => w.point !== null).length >= 2) {
      void analyzeTrip();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waypoints, mode, departureTime, timeType]);

  function resetAnalysis() {
    setRoute([]);
    setRouteOptions([]);
    setSelectedRouteId(null);
    setAnalysis(null);
    setWeather(null);
    setShowAnalysis(false);
    setStatus("");
    setReportLocation(null);
    setShowReportModal(false);
  }

  function resetAll() {
    resetAnalysis();
    setWaypoints([
      { name: "", point: null },
      { name: "", point: null }
    ]);
    setMobileView("search");
    setIsReportingMode(false);
    setReportLocation(null);
    setShowReportModal(false);
  }

  useEffect(() => {
    if ((isLoading || routeOptions.length > 0) && mobileView === "map") {
      setTimeout(() => {
        sidebarRef.current?.scrollTo({ top: sidebarRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [isLoading, routeOptions.length, mobileView]);

  async function analyzeTrip() {
    const validPoints = waypoints.map(w => w.point).filter((p): p is LatLng => p !== null);
    if (validPoints.length < 2) return;

    setIsLoading(true);
    setStatus(mode === "train" ? "Finding rail routes…" : "Finding routes…");

    try {
      const departure = new Date(departureTime);

      if (mode === "train") {
        const rail = await fetchRailRoute({ 
          start: validPoints[0], 
          end: validPoints[validPoints.length - 1], 
          departureTime: departure.toISOString(),
          timeType
        });
        const option = rail.options.find((c) => c.id === rail.recommendedOptionId) ?? rail.options[0];

        setRoute(option?.coordinates ?? rail.coordinates);
        setRouteOptions(rail.options);
        setSelectedRouteId(option?.id ?? rail.recommendedOptionId);
        setAnalysis(option?.analysis ?? rail.analysis);
        setWeather(await fetchWeather(validPoints[0]));
        setStatus(`${rail.options.length} rail route${rail.options.length === 1 ? "" : "s"} found`);
      } else {
        const response = await fetchRouteOptions({ 
          waypoints: validPoints, 
          departureTime: departure.toISOString(),
          timeType 
        });
        const option = response.options.find((c) => c.id === response.recommendedOptionId) ?? response.options[0];

        setRoute(option?.coordinates ?? []);
        setRouteOptions(response.options);
        setSelectedRouteId(option?.id ?? response.recommendedOptionId);
        setAnalysis(option?.analysis ?? null);
        setWeather(await fetchWeather(validPoints[0]));
        setStatus(`${response.options.length} route${response.options.length === 1 ? "" : "s"} found`);
      }
      setMobileView("map");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not analyze route");
    } finally {
      setIsLoading(false);
    }
  }

  function pickRoute(option: RouteOption) {
    setSelectedRouteId(option.id);
    setRoute(option.coordinates);
    setAnalysis(option.analysis);
    setShowAnalysis(true);
    setMobileView("details");
  }

  function handleWaypointChange(index: number, point: LatLng | null, name: string) {
    const next = [...waypoints];
    next[index] = { point, name };
    setWaypoints(next);
    resetAnalysis();
  }

  function handleAddWaypoint() {
    if (waypoints.length >= 5) return;
    setWaypoints([...waypoints.slice(0, -1), { point: null, name: "" }, waypoints[waypoints.length - 1]]);
    resetAnalysis();
  }

  function handleRemoveWaypoint(index: number) {
    if (waypoints.length <= 2) return;
    const next = [...waypoints];
    next.splice(index, 1);
    setWaypoints(next);
    resetAnalysis();
  }

  function handleSwap(i: number, j: number) {
    const next = [...waypoints];
    const temp = next[i];
    next[i] = next[j];
    next[j] = temp;
    setWaypoints(next);
    resetAnalysis();
  }

  async function handleMapPick(point: LatLng) {
    if (waypoints.every(w => w.point !== null)) return; // all full

    const name = await reverseGeocode(point).catch(() => `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`);
    const emptyIndex = waypoints.findIndex(w => w.point === null);
    
    if (emptyIndex !== -1) {
      handleWaypointChange(emptyIndex, point, name);
      if (emptyIndex === 0) setStatus("Start set. Tap destination on map or search.");
    }
  }

  async function saveCurrentRoute() {
    if (!start || !end) return;
    try {
      const saved = await saveRoute({
        name: `${startName || "Start"} → ${endName || "End"}`,
        mode,
        start,
        end,
        departureTime: new Date(departureTime).toISOString()
      });
      setSavedRoutes((current) => [saved, ...current]);
      setStatus("Commute saved");
    } catch {
      setStatus("Could not save commute");
    }
  }

  async function removeSavedRoute(id: number) {
    try {
      await deleteSavedRoute(id);
      setSavedRoutes((current) => current.filter((s) => s.id !== id));
    } catch {
      setStatus("Could not delete commute");
    }
  }

  function loadSavedRoute(saved: SavedRoute) {
    setWaypoints([
      { point: { lat: saved.startLat, lng: saved.startLng }, name: saved.name.split("→")[0]?.trim() || "Saved start" },
      { point: { lat: saved.endLat, lng: saved.endLng }, name: saved.name.split("→")[1]?.trim() || "Saved end" }
    ]);
    setMode(saved.mode);
    if (saved.departureTime) setDepartureTime(toDateTimeLocal(new Date(saved.departureTime)));
    resetAnalysis();
  }

  const hasRoutes = routeOptions.length > 0;
  const activeRoute = routeOptions.find(r => r.id === selectedRouteId);

  return (
    <main className={`app-shell 
      ${showAnalysis && analysis ? "has-analysis" : ""} 
      ${hasRoutes ? "has-routes" : ""}
      mobile-view-${mobileView} 
      ${isReportingMode ? "reporting-mode" : ""} 
      ${reportLocation ? "has-report-pin" : ""}
      ${theme}
    `}>
      {/* Map (always fills viewport) */}
      <div className="map-layer">
        <MapPicker
          waypoints={waypoints.map(w => w.point)}
          route={route}
          routes={routeOptions}
          activeRouteId={selectedRouteId}
          layer={mapLayer}
          theme={theme}
          onPick={handleMapPick}
          isReportingMode={isReportingMode}
          setIsReportingMode={setIsReportingMode}
          reportLocation={reportLocation}
          setReportLocation={setReportLocation}
          showReportModal={showReportModal}
          setShowReportModal={setShowReportModal}
          speedCameras={features.cameras ? activeRoute?.analysis.speedCameras : undefined}
          analysis={activeRoute?.analysis}
        />
      </div>

      {/* Floating sidebar */}
      <aside className="sidebar" id="tutorial-search" ref={sidebarRef}>
        {/* Search card */}
        <div className="glass-card search-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <div style={{ height: '32px', display: 'flex', alignItems: 'center' }}>
                <img alt="Thanal" src={brandLogoUrl} style={{ height: '72px', width: 'auto', objectFit: 'contain', marginLeft: '-14px' }} />
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                Beat the heat. Grab the shady seat.
              </div>
            </div>
          </div>

          <SearchPanel
            mode={mode}
            waypoints={waypoints}
            onWaypointChange={handleWaypointChange}
            onAddWaypoint={handleAddWaypoint}
            onRemoveWaypoint={handleRemoveWaypoint}
            onSwap={handleSwap}
          />

          <div className="mode-time-bar">
            <div className="mode-pills">
              <ModeButton active={mode === "train"} icon={<Train size={14} />} label="Train" onClick={() => { setMode("train"); }} />
              <ModeButton active={mode === "bike"} icon={<Bike size={14} />} label="Bike" onClick={() => { setMode("bike"); }} />
              <ModeButton active={mode === "bus"} icon={<Bus size={14} />} label="Car/Bus" onClick={() => { setMode("bus"); }} />
            </div>
            <label className="departure-compact" title="Time config">
              <select 
                value={timeType} 
                onChange={e => setTimeType(e.target.value as "depart" | "arrive")}
                className="time-type-select"
              >
                <option value="depart">Depart at</option>
                <option value="arrive">Arrive by</option>
              </select>
              <DatePicker
                selected={new Date(departureTime)}
                onChange={(date: Date | null) => {
                  if (date) setDepartureTime(toDateTimeLocal(date));
                }}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMM d, h:mm aa"
                className="custom-datepicker-input"
              />
            </label>
          </div>

          {start && end && (
            <button
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "4px 10px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                fontSize: "var(--font-size-sm)",
                cursor: "pointer",
                minHeight: "32px"
              }}
              onClick={saveCurrentRoute}
            >
              <BookmarkPlus size={13} />
              Save commute
            </button>
          )}
          <button 
            className="secondary-btn" 
            onClick={() => {
              setMobileView("map");
              setIsReportingMode(true);
            }}
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              background: 'var(--accent-soft)', 
              color: 'var(--accent)', 
              border: '1px solid var(--accent)', 
              borderRadius: 'var(--radius-md)', 
              fontWeight: 600, 
              marginTop: '12px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Community Contribution
          </button>
          
          {/* Quick-toggle checkboxes for map layers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Show:</span>
            <button
              type="button"
              className={`toggle-btn ${features.cameras ? "active" : ""}`}
              onClick={() => toggleFeature("cameras")}
            >
              <Camera size={13} />
              Cameras
            </button>
            <button
              type="button"
              className={`toggle-btn ${features.washrooms ? "active" : ""}`}
              onClick={() => toggleFeature("washrooms")}
            >
              <Bath size={13} />
              Washrooms
            </button>
          </div>
        </div>
        

        {/* Status */}
        {status && (
          <p className="status-line">
            {isLoading && <span className="pulse-dot" style={{ width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%' }} />}
            {status}
          </p>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="glass-card">
            <LoadingDots />
          </div>
        )}

        {/* Trip Insight (Desktop) */}
        {hasRoutes && !isLoading && (
          <div className="desktop-only" style={{ width: '100%' }}>
            <TripInsight
              mode={mode}
              start={start}
              end={end}
              departureTime={new Date(departureTime).toISOString()}
              analysis={analysis}
              weather={weather}
              language={language}
            />
          </div>
        )}

        {/* Route cards */}
        {hasRoutes && !isLoading && (
          <div className="glass-card route-cards">
            <div className="route-cards-header">
              <span className="route-cards-title">Routes</span>
              <span className="route-cards-count">{routeOptions.length}</span>
            </div>
            {routeOptions.map((option, index) => (
              <button
                className={`route-card ${selectedRouteId === option.id ? "active" : ""}`}
                key={option.id}
                type="button"
                onClick={() => pickRoute(option)}
              >
                <div
                  className="route-color-bar"
                  style={{ background: ["var(--route-1)", "var(--route-2)", "var(--route-3)"][index % 3] }}
                />
                <div className="route-card-info">
                  <div className="route-card-label">{option.label}</div>
                  <div className="route-card-meta">
                    <span>{(option.analysis.totalDistanceMeters / 1000).toFixed(1)} km</span>
                    {timeType === "arrive" && option.analysis.departureTime && (
                      <span> · Leave at: {new Date(option.analysis.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    {option.serviceHint && <span> · {option.serviceHint}</span>}
                  </div>
                </div>
                <div className="route-card-duration">{Math.round(option.analysis.totalDurationMinutes)} min</div>
                <div className="route-card-seat">{formatSeat(option.analysis.recommendedSeat)}</div>
                <div style={{ marginLeft: 'var(--space-sm)', color: 'var(--text-muted)' }}>
                  <ChevronRight size={18} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Saved commutes */}

        {/* Empty state */}
        {!hasRoutes && !isLoading && !start && !end && (
          <div className="glass-card empty-state">
            <MapPin size={18} />
            <span>Search or tap the map to set start and destination</span>
          </div>
        )}

        <div className="sidebar-footer">
          <button 
            type="button"
            onClick={() => openSettings("feedback")}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
          >
            Found a bug or have a suggestion? Let us know
          </button>
        </div>
      </aside>

      {/* Mobile Details Screen — must be outside sidebar so it isn't hidden */}
      {analysis && mobileView === "details" && (
        <div className="mobile-details-screen">
          <div className="mobile-details-header">
            <button className="icon-btn" onClick={() => setMobileView("map")} title="Collapse details">
              <ChevronDown size={22} />
            </button>
            <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 600 }}>Route Details</h2>
            <div style={{ width: 36 }} /> {/* spacer */}
          </div>
          
          <div className="mobile-details-body">
            {/* Route Selection List for Mobile */}
            {routeOptions.length > 1 && (
              <div className="glass-card route-cards" style={{ marginBottom: '16px' }}>
                <div className="route-cards-header">
                  <span className="route-cards-title">Route Options</span>
                  <span className="route-cards-count">{routeOptions.length}</span>
                </div>
                {routeOptions.map((option, index) => (
                  <button
                    className={`route-card ${selectedRouteId === option.id ? "active" : ""}`}
                    key={option.id}
                    type="button"
                    onClick={() => pickRoute(option)}
                  >
                    <div
                      className="route-color-bar"
                      style={{ background: ["var(--route-1)", "var(--route-2)", "var(--route-3)"][index % 3] }}
                    />
                    <div className="route-card-info">
                      <div className="route-card-label">{option.label}</div>
                      <div className="route-card-meta">
                        <span>{(option.analysis.totalDistanceMeters / 1000).toFixed(1)} km</span>
                        {timeType === "arrive" && option.analysis.departureTime && (
                          <span> · Leave at: {new Date(option.analysis.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                        {option.serviceHint && <span> · {option.serviceHint}</span>}
                      </div>
                    </div>
                    <div className="route-card-duration">{Math.round(option.analysis.totalDurationMinutes)} min</div>
                    <div className="route-card-seat">{formatSeat(option.analysis.recommendedSeat)}</div>
                  </button>
                ))}
              </div>
            )}
            {/* Bike Mode specific layout */}
            {mode === "bike" && (
              <>
                {comfort && <ComfortScore comfort={comfort} />}
                {features.rain && weather && <RainWindow probability={weather.precipitationProbability ?? 0} timeline={weather.rainTimeline} />}
                <TripInsight
                  mode={mode}
                  start={start}
                  end={end}
                  departureTime={new Date(departureTime).toISOString()}
                  analysis={analysis}
                  weather={weather}
                  language={language}
                />
                <div className="metric-row">
                  <div className="metric-item">
                    <div className="metric-label">Distance</div>
                    <div className="metric-value">{(analysis.totalDistanceMeters / 1000).toFixed(1)} km</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">Duration</div>
                    <div className="metric-value">{Math.round(analysis.totalDurationMinutes)} min</div>
                  </div>
                </div>
                {analysis.glareWindows && analysis.glareWindows.length > 0 && (
                  <div className="glare-alert">
                    <div className="glare-alert-title">⚠ Glare warning</div>
                    <div className="glare-alert-body">
                      Sun is close to forward heading on {analysis.glareWindows.length} segment{analysis.glareWindows.length > 1 ? "s" : ""}.
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Car/Bus/Train Mode specific layout */}
            {mode !== "bike" && (
              <>
                <div className="seat-hero">
                  <div className="seat-hero-label">Recommended seat</div>
                  <div className="seat-hero-value">{formatSeat(analysis.recommendedSeat)}</div>
                  <div className="seat-hero-detail">
                    {Math.round(analysis.directSunMinutesBySide?.left ?? 0)} min sun left · {Math.round(analysis.directSunMinutesBySide?.right ?? 0)} min sun right
                  </div>
                </div>
                <TripInsight
                  mode={mode}
                  start={start}
                  end={end}
                  departureTime={new Date(departureTime).toISOString()}
                  analysis={analysis}
                  weather={weather}
                  language={language}
                />
                {features.sun && <SunTimeline analysis={analysis} />}
                <SunTrajectoryChart analysis={analysis} />
                <div className="metric-row">
                  <div className="metric-item">
                    <div className="metric-label">Distance</div>
                    <div className="metric-value">{(analysis.totalDistanceMeters / 1000).toFixed(1)} km</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">Duration</div>
                    <div className="metric-value">{Math.round(analysis.totalDurationMinutes)} min</div>
                  </div>
                </div>
                {analysis.glareWindows && analysis.glareWindows.length > 0 && (
                  <div className="glare-alert">
                    <div className="glare-alert-title">⚠ Glare warning</div>
                    <div className="glare-alert-body">
                      Sun is close to forward heading on {analysis.glareWindows.length} segment{analysis.glareWindows.length > 1 ? "s" : ""}.
                    </div>
                  </div>
                )}
                {comfort && <ComfortScore comfort={comfort} />}
                {features.rain && weather && <RainWindow probability={weather.precipitationProbability ?? 0} timeline={weather.rainTimeline} />}
              </>
            )}
          </div>
        </div>
      )}

      {/* Desktop Right Sidebar */}
      {showAnalysis && analysis && (
        <aside className="right-sidebar desktop-only">
          <div className="glass-card analysis-panel">
            {/* Seat recommendation hero */}
            <div className="seat-hero">
              <div className="seat-hero-label">Recommended seat</div>
              <div className="seat-hero-value">{formatSeat(analysis.recommendedSeat)}</div>
              <div className="seat-hero-detail">
                {Math.round(analysis.directSunMinutesBySide.left)} min sun left · {Math.round(analysis.directSunMinutesBySide.right)} min sun right
              </div>
            </div>

            {features.sun && <SunTimeline analysis={analysis} />}
            <SunTrajectoryChart analysis={analysis} />

            <div className="metric-row">
              <div className="metric-item">
                <div className="metric-label">Distance</div>
                <div className="metric-value">{(analysis.totalDistanceMeters / 1000).toFixed(1)} km</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Duration</div>
                <div className="metric-value">{Math.round(analysis.totalDurationMinutes)} min</div>
              </div>
            </div>

            {analysis.glareWindows.length > 0 && (
              <div className="glare-alert">
                <div className="glare-alert-title">⚠ Glare warning</div>
                <div className="glare-alert-body">
                  Sun is close to forward heading on {analysis.glareWindows.length} segment{analysis.glareWindows.length > 1 ? "s" : ""}.
                </div>
              </div>
            )}

            {comfort && <ComfortScore comfort={comfort} />}
            {features.rain && weather && <RainWindow probability={weather.precipitationProbability ?? 0} timeline={weather.rainTimeline} />}
          </div>
        </aside>
      )}

      {/* Map-only controls & Overlays */}
      {mobileView === "map" && hasRoutes && (
        <div className="mobile-route-summary-sheet" onClick={() => {
          setShowAnalysis(true);
          setMobileView("details");
        }}>
          <div className="sheet-drag-handle" />
          <div className="sheet-content" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="sheet-title">{routeOptions.length} route{routeOptions.length > 1 ? "s" : ""} found</span>
              <span className="sheet-subtitle">Tap to view options and details</span>
            </div>
            <ChevronUp size={20} style={{ color: 'var(--text-secondary)' }} />
          </div>
        </div>
      )}

      {mobileView === "map" && hasRoutes && !isReportingMode && (
        <button 
          className="top-report-btn glass-btn"
          onClick={() => {
            setIsReportingMode(true);
            setMobileView("map");
          }}
        >
          Contribute Location
        </button>
      )}

      {/* Map controls (floating top-right) */}
      <div className="map-controls">
        <LayerToggle active={mapLayer} onChange={setMapLayer} />
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <button 
          id="tutorial-menu-btn"
          className="glass-btn" 
          onClick={() => openSettings("preferences")}
          style={{ width: "36px", height: "36px", padding: 0 }}
          aria-label="Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {mobileView === "map" && (
        <button 
          className="mobile-back-btn" 
          onClick={resetAll}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back
        </button>
      )}

      <SettingsModal  
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        language={language}
        onLanguageChange={setLanguage}
        cookieConsent={cookieConsent === true}
        onCookieConsentChange={handleCookieConsentChange}
        savedRoutes={savedRoutes}
        onLoadRoute={loadSavedRoute}
        onDeleteRoute={removeSavedRoute}
        features={features}
        onToggleFeature={toggleFeature}
        initialTab={settingsTab}
      />

      {cookieConsent === null && (
        <CookiePrompt 
          onAccept={() => handleCookieConsentChange(true)} 
          onDecline={() => handleCookieConsentChange(false)} 
        />
      )}

      {isAdminOpen && (
        <AdminDashboard onClose={() => { window.location.hash = ""; }} />
      )}

      <WelcomeTour setIsSettingsOpen={(val) => { if (val) openSettings("preferences"); else setIsSettingsOpen(false); }} />
    </main>
  );
}

function ModeButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={`mode-pill ${active ? "active" : ""}`} type="button" onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function formatSeat(seat: RouteAnalysis["recommendedSeat"]): string {
  if (seat === "either") return "Either side";
  return seat === "left" ? "Sit left" : "Sit right";
}
