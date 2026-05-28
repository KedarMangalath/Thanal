import {
  analyzeRoute,
  calculateComfortScore,
  type ComfortScore as ComfortScoreType,
  type LatLng,
  type RouteAnalysis,
  type WeatherSnapshot
} from "@thanal/shared";
import { Bike, Bus, Clock, CloudRain, LocateFixed, MapPin, Navigation, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import ComfortScore from "./components/ComfortScore";
import MapPicker from "./components/MapPicker";
import RainWindow from "./components/RainWindow";
import SunTimeline from "./components/SunTimeline";

type OsrmRoute = {
  geometry: {
    coordinates: [number, number][];
  };
  distance: number;
  duration: number;
};

const SAMPLE_START: LatLng = { lat: 8.5241, lng: 76.9366 };
const SAMPLE_END: LatLng = { lat: 10.5276, lng: 76.2144 };

function toDateTimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function App() {
  const [start, setStart] = useState<LatLng | null>(SAMPLE_START);
  const [end, setEnd] = useState<LatLng | null>(SAMPLE_END);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [departureTime, setDepartureTime] = useState(toDateTimeLocal(new Date()));
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Tap the map to adjust start and destination.");

  const comfort = useMemo<ComfortScoreType | null>(() => {
    return weather ? calculateComfortScore(weather) : null;
  }, [weather]);

  async function analyzeTrip() {
    if (!start || !end) {
      setStatus("Choose both start and destination points.");
      return;
    }

    setIsLoading(true);
    setStatus("Fetching road route and checking the sun angle.");

    try {
      const osrm = await fetchRoute(start, end);
      const coordinates = osrm.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
      const routeAnalysis = analyzeRoute(coordinates, {
        departureTime: new Date(departureTime),
        averageSpeedKmh: Math.max(18, (osrm.distance / osrm.duration) * 3.6)
      });

      setRoute(coordinates);
      setAnalysis(routeAnalysis);
      setWeather(await fetchWeather(start));
      setStatus("Route analyzed.");
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
      setAnalysis(null);
      setStatus("Start set. Tap the destination.");
      return;
    }

    setEnd(point);
    setStatus("Destination set. Analyze when ready.");
  }

  function useSampleRoute() {
    setStart(SAMPLE_START);
    setEnd(SAMPLE_END);
    setRoute([]);
    setAnalysis(null);
    setStatus("Sample Thiruvananthapuram to Thrissur route ready.");
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="map-region">
          <MapPicker start={start} end={end} route={route} onPick={handleMapPick} />
        </div>

        <aside className="control-panel">
          <div className="brand-row">
            <span className="brand-mark">
              <Sun size={22} />
            </span>
            <div>
              <h1>Thanal</h1>
              <p>Sun-aware travel for Kerala routes</p>
            </div>
          </div>

          <div className="mode-tabs" aria-label="Travel mode">
            <button className="active" type="button">
              <Bus size={16} />
              Bus
            </button>
            <button type="button">
              <Bike size={16} />
              Ride
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

          <div className="point-list">
            <PointRow label="Start" point={start} />
            <PointRow label="Destination" point={end} />
          </div>

          <div className="action-row">
            <button className="secondary" type="button" onClick={useSampleRoute}>
              <LocateFixed size={16} />
              Sample
            </button>
            <button className="primary" type="button" onClick={analyzeTrip} disabled={isLoading}>
              <Navigation size={16} />
              {isLoading ? "Analyzing" : "Analyze"}
            </button>
          </div>

          <p className="status-line">{status}</p>

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
              {weather ? <RainWindow probability={weather.precipitationProbability ?? 0} /> : null}
            </>
          ) : (
            <section className="empty-state">
              <MapPin size={22} />
              <p>Tap two map points, set your departure time, and run the sun analysis.</p>
            </section>
          )}
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

async function fetchRoute(start: LatLng, end: LatLng): Promise<OsrmRoute> {
  const url = new URL(
    `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}`
  );
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("steps", "false");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("OSRM could not return a route.");
  }

  const data = await response.json();
  if (!data.routes?.[0]) {
    throw new Error("No road route found between those points.");
  }

  return data.routes[0];
}

async function fetchWeather(point: LatLng): Promise<WeatherSnapshot> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(point.lat));
  url.searchParams.set("longitude", String(point.lng));
  url.searchParams.set(
    "hourly",
    "temperature_2m,relative_humidity_2m,uv_index,precipitation_probability"
  );
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  if (!response.ok) {
    return {
      temperatureC: 32,
      relativeHumidity: 78,
      uvIndex: 7,
      precipitationProbability: 20
    };
  }

  const data = await response.json();
  const hour = new Date().getHours();

  return {
    temperatureC: data.hourly.temperature_2m[hour] ?? 32,
    relativeHumidity: data.hourly.relative_humidity_2m[hour] ?? 78,
    uvIndex: data.hourly.uv_index[hour] ?? 7,
    precipitationProbability: data.hourly.precipitation_probability[hour] ?? 20
  };
}
