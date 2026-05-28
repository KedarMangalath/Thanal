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
  MapPin,
  Navigation,
  Route,
  Search,
  Sparkles,
  Train,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import brandLogoUrl from "../../../assets/Thanal_Logo.png";
import brandTextUrl from "../../../assets/Thanal_text_png.png";
import ComfortScore from "./components/ComfortScore";
import MapPicker from "./components/MapPicker";
import RainWindow from "./components/RainWindow";
import SunTimeline from "./components/SunTimeline";
import {
  askAssistant,
  deleteSavedRoute,
  fetchRailRoute,
  fetchRouteOptions,
  fetchSavedRoutes,
  fetchWeather,
  saveRoute,
  searchPlaces,
  searchRailStations,
  type PlaceResult,
  type RouteOption,
  type SavedRoute
} from "./services/api";

type TravelMode = "bus" | "bike" | "walk" | "train";
type FlowStage = "entry" | "routes" | "map";

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
  const [mode, setMode] = useState<TravelMode>("bus");
  const [flowStage, setFlowStage] = useState<FlowStage>("entry");
  const [status, setStatus] = useState("Choose mode, start, destination, and departure time.");
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeTarget, setPlaceTarget] = useState<"start" | "end">("start");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("Which route should I pick?");
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

  function resetAnalysis(nextStage: FlowStage = "entry") {
    setRoute([]);
    setRouteOptions([]);
    setSelectedRouteId(null);
    setAnalysis(null);
    setWeather(null);
    setAssistantAnswer("");
    setFlowStage(nextStage);
  }

  async function analyzeTrip() {
    if (!start || !end) {
      setStatus("Choose both start and destination first.");
      return;
    }

    setIsLoading(true);
    setStatus(mode === "train" ? "Finding rail options." : "Finding road options.");

    try {
      const departure = new Date(departureTime);
      if (mode === "train") {
        const rail = await fetchRailRoute({ start, end, departureTime: departure.toISOString() });
        const option =
          rail.options.find((candidate) => candidate.id === rail.recommendedOptionId) ?? rail.options[0];

        setRoute(option?.coordinates ?? rail.coordinates);
        setRouteOptions(rail.options);
        setSelectedRouteId(option?.id ?? rail.recommendedOptionId);
        setAnalysis(option?.analysis ?? rail.analysis);
        setWeather(await fetchWeather(start));
        setFlowStage("routes");
        setStatus(`${rail.options.length} rail option${rail.options.length === 1 ? "" : "s"} found. Pick one.`);
        return;
      }

      const response = await fetchRouteOptions({
        start,
        end,
        departureTime: departure.toISOString()
      });
      const option =
        response.options.find((candidate) => candidate.id === response.recommendedOptionId) ??
        response.options[0];

      setRoute(option?.coordinates ?? []);
      setRouteOptions(response.options);
      setSelectedRouteId(option?.id ?? response.recommendedOptionId);
      setAnalysis(option?.analysis ?? null);
      setWeather(await fetchWeather(start));
      setFlowStage("routes");
      setStatus(`${response.options.length} route option${response.options.length === 1 ? "" : "s"} found. Pick one.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not analyze this route.");
    } finally {
      setIsLoading(false);
    }
  }

  function pickRouteOption(option: RouteOption, openMap = false) {
    setSelectedRouteId(option.id);
    setRoute(option.coordinates);
    setAnalysis(option.analysis);
    if (openMap) {
      setFlowStage("map");
      setStatus("Map opened with your selected route.");
    }
  }

  function handleMapPick(point: LatLng) {
    if (!start || (start && end)) {
      setStart(point);
      setEnd(null);
      resetAnalysis("entry");
      setStatus("Start changed. Choose destination again.");
      return;
    }

    setEnd(point);
    resetAnalysis("entry");
    setStatus("Destination changed. Analyze again.");
  }

  function clearRoute() {
    setStart(null);
    setEnd(null);
    resetAnalysis("entry");
    setStatus("Route cleared. Search a start and destination.");
  }

  async function saveCurrentRoute() {
    if (!start || !end) {
      setStatus("Choose both start and destination before saving.");
      return;
    }

    try {
      const saved = await saveRoute({
        name: `${modeLabel(mode)} route ${new Date(departureTime).toLocaleTimeString([], {
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
      setStatus(mode === "train" ? "Searching railway stations." : "Searching places.");
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
      setPlaceTarget("end");
    } else {
      setEnd(point);
    }

    resetAnalysis("entry");
    setPlaceResults([]);
    setPlaceQuery("");
    setStatus(`${placeTarget === "start" ? "Start" : "Destination"} set.`);
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
      <section className={`journey-shell stage-${flowStage}`}>
        <aside className="control-panel flow-panel">
          <Header />

          <div className="mode-tabs" aria-label="Travel mode">
            <ModeButton active={mode === "bus"} icon={<Bus size={16} />} label="Car/Bus" onClick={() => setMode("bus")} />
            <ModeButton active={mode === "bike"} icon={<Bike size={16} />} label="Bike" onClick={() => setMode("bike")} />
            <ModeButton active={mode === "train"} icon={<Train size={16} />} label="Train" onClick={() => setMode("train")} />
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
              <button className={placeTarget === "start" ? "active" : ""} type="button" onClick={() => setPlaceTarget("start")}>
                Start
              </button>
              <button className={placeTarget === "end" ? "active" : ""} type="button" onClick={() => setPlaceTarget("end")}>
                End
              </button>
            </div>
            <div className="search-row">
              <input
                aria-label="Place search"
                placeholder={mode === "train" ? "Search railway station" : "Search place"}
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
                  <button className="place-result" key={place.place_id} type="button" onClick={() => selectPlace(place)}>
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
            <button className="primary analyze-button" type="button" onClick={analyzeTrip} disabled={isLoading}>
              <Navigation size={16} />
              {isLoading ? "Analyzing" : "Find routes"}
            </button>
          </div>

          <p className="status-line">{status}</p>

          {flowStage === "entry" ? <IntroState mode={mode} /> : null}
          {flowStage === "routes" ? (
            <RouteOptionList options={routeOptions} selectedRouteId={selectedRouteId} onSelect={(option) => pickRouteOption(option, true)} title="Pick your route" />
          ) : null}

          <AssistantCard
            answer={assistantAnswer}
            isLoading={isAssistantLoading}
            message={assistantMessage}
            onAsk={runAssistant}
            onMessageChange={setAssistantMessage}
          />

          {flowStage !== "map" ? (
            <SavedRoutes
              routes={savedRoutes}
              onLoad={(saved) => {
                setStart({ lat: saved.startLat, lng: saved.startLng });
                setEnd({ lat: saved.endLat, lng: saved.endLng });
                setMode(saved.mode);
                if (saved.departureTime) setDepartureTime(toDateTimeLocal(new Date(saved.departureTime)));
                resetAnalysis("entry");
                setStatus(`${saved.name} loaded. Find routes when ready.`);
              }}
              onRemove={removeSavedRoute}
            />
          ) : null}
        </aside>

        {flowStage === "map" ? (
          <section className="map-stage">
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
            <aside className="result-panel">
              <div className="result-panel-head">
                <button className="secondary" type="button" onClick={() => setFlowStage("routes")}>
                  Change route
                </button>
                <button className="secondary" type="button" onClick={clearRoute}>
                  New trip
                </button>
              </div>
              <RouteOptionList options={routeOptions} selectedRouteId={selectedRouteId} onSelect={(option) => pickRouteOption(option)} compact title="Route options" />
              <ResultDetails analysis={analysis} comfort={comfort} weather={weather} />
            </aside>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function Header() {
  return (
    <div className="brand-row">
      <span className="brand-mark">
        <img alt="" src={brandLogoUrl} />
      </span>
      <div>
        <img alt="Thanal" className="brand-wordmark" src={brandTextUrl} />
        <p>Sun-aware travel for Kerala routes</p>
      </div>
    </div>
  );
}

function ModeButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={active ? "active" : ""} type="button" onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function IntroState({ mode }: { mode: TravelMode }) {
  return (
    <section className="empty-state intro-state">
      <MapPin size={22} />
      <p>
        {mode === "train"
          ? "Search two railway stations first. Thanal will show rail route choices before opening the map."
          : "Search start and destination first. Thanal will show route choices before opening the map."}
      </p>
    </section>
  );
}

function RouteOptionList({
  compact = false,
  onSelect,
  options,
  selectedRouteId,
  title
}: {
  compact?: boolean;
  onSelect: (option: RouteOption) => void;
  options: RouteOption[];
  selectedRouteId: string | null;
  title: string;
}) {
  if (options.length === 0) return null;

  return (
    <section className={`route-options ${compact ? "compact" : ""}`}>
      <div className="section-heading">
        <span>
          <Route size={16} />
          {title}
        </span>
        <strong>{options.length}</strong>
      </div>
      {options.map((option) => (
        <button
          className={`route-option ${selectedRouteId === option.id ? "active" : ""}`}
          key={option.id}
          type="button"
          onClick={() => onSelect(option)}
        >
          <span>{option.label}</span>
          <strong>{Math.round(option.analysis.totalDurationMinutes)} min</strong>
          <small>
            {(option.analysis.totalDistanceMeters / 1000).toFixed(1)} km -{" "}
            {formatSeat(option.analysis.recommendedSeat)}
          </small>
          {option.serviceHint ? <em>{option.serviceHint}</em> : null}
        </button>
      ))}
    </section>
  );
}

function AssistantCard({
  answer,
  isLoading,
  message,
  onAsk,
  onMessageChange
}: {
  answer: string;
  isLoading: boolean;
  message: string;
  onAsk: () => void;
  onMessageChange: (value: string) => void;
}) {
  return (
    <section className="assistant-card">
      <div className="section-heading">
        <span>
          <Sparkles size={16} />
          Ask Thanal AI
        </span>
      </div>
      <div className="assistant-row">
        <input
          aria-label="Ask Thanal"
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onAsk();
          }}
        />
        <button className="primary icon-button" type="button" onClick={onAsk}>
          <Sparkles size={17} />
        </button>
      </div>
      {isLoading ? <p className="assistant-answer">Thinking with route tools...</p> : null}
      {answer ? <p className="assistant-answer">{answer}</p> : null}
    </section>
  );
}

function ResultDetails({
  analysis,
  comfort,
  weather
}: {
  analysis: RouteAnalysis | null;
  comfort: ComfortScoreType | null;
  weather: WeatherSnapshot | null;
}) {
  if (!analysis) return null;

  return (
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
      {weather ? <RainWindow probability={weather.precipitationProbability ?? 0} timeline={weather.rainTimeline} /> : null}
    </>
  );
}

function SavedRoutes({
  onLoad,
  onRemove,
  routes
}: {
  onLoad: (route: SavedRoute) => void;
  onRemove: (id: number) => void;
  routes: SavedRoute[];
}) {
  if (routes.length === 0) return null;

  return (
    <section className="result-card saved-list">
      <div className="section-heading">
        <span>Saved commutes</span>
        <strong>{routes.length}</strong>
      </div>
      {routes.slice(0, 3).map((saved) => (
        <div className="saved-route" key={saved.id}>
          <button className="saved-route-main" type="button" onClick={() => onLoad(saved)}>
            <span>{saved.name}</span>
            <small>{saved.mode.toUpperCase()}</small>
          </button>
          <button
            aria-label={`Delete ${saved.name}`}
            className="saved-route-delete"
            type="button"
            onClick={() => onRemove(saved.id)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </section>
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

function modeLabel(mode: TravelMode) {
  if (mode === "bike") return "Bike";
  if (mode === "train") return "Train";
  if (mode === "walk") return "Walk";
  return "Car";
}

function formatSeat(seat: RouteAnalysis["recommendedSeat"]): string {
  if (seat === "either") return "Either side";
  return seat === "left" ? "Sit left" : "Sit right";
}
