# Thanal — Sun & Comfort-Aware Travel Assistant

> *Thanal* means shade in Malayalam. Because sometimes the best feature a navigation app can have is knowing when to get out of the sun.

Thanal is a Kerala-first travel comfort assistant. It tells commuters which side of a bus or train to sit on to avoid harsh sun, warns riders about glare and rain risk, and scores a route by heat, UV, humidity, and exposure.

## The Story

I came across an app called Veyil while planning a long bus trip from Thiruvananthapuram to my hometown Perinthalmanna. The idea immediately clicked — it tells you which side of the bus to sit on to avoid the sun. Brilliant concept, especially for Kerala where the sun is genuinely brutal for most of the year. I used it, trusted it, sat on the recommended side, and spent the next four hours getting absolutely cooked through the window while the other side stayed perfectly shaded. That was enough motivation.

Thanal is my attempt at building this properly — a travel companion that actually understands what it means to travel in Kerala. The heat, the monsoon, the narrow shaded roads, the flooding underpasses, the temple processions blocking highways. Not a generic global app that happens to have Kerala on its map.

## Current Features

- Web route planner with Leaflet and OpenStreetMap tiles
- Expo Go mobile app using Expo SDK 54
- Tap-to-select start and destination points
- Place search through the backend Nominatim proxy
- OSRM road routing with route polyline display
- SunCalc-based segment analysis for sun side, seat recommendation, glare, and timeline exposure
- Open-Meteo weather lookup for UV, humidity, temperature, and rain probability
- Real rain-window strip from hourly forecast data
- Comfort score from weather conditions
- Saved commutes on web and mobile through the backend
- Backend routes for routing, weather, places, saved routes, and community reports

## Railway Mode Plan

Train journeys need the same sun-side logic, but the routing source changes. Roads come from OSRM. Rail journeys should come from railway track geometry and station sequences.

### Goal

Given a train journey, departure time, and boarding/deboarding stations, Thanal should answer:

- Sit left, sit right, or either
- Which stretches get direct sun
- When glare may hit the window or forward-facing seats
- How the recommendation changes if the train is delayed
- What confidence level the app has in the result

### Railway Data Strategy

The MVP should not depend on unofficial live Indian Railways APIs. Public train-status APIs are inconsistent, and official NTES/IRCTC developer access is not reliably available for small public projects. For a portfolio-ready build, the reliable path is:

- Use OpenStreetMap railway geometry for tracks and stations
- Use OpenRailwayMap/OSM tagging concepts for rail infrastructure reference
- Use Overpass queries or pre-cached OSM extracts for railway lines in Kerala first
- Build a station graph from `railway=station`, `railway=halt`, and `railway=rail` data
- Route between selected stations along the rail graph
- Add train-number support later through a curated schedule dataset or optional provider adapter

Useful references:

- [OpenStreetMap railway tagging](https://wiki.openstreetmap.org/wiki/Open_Rail_Map)
- [OpenRailwayMap API notes](https://wiki.openstreetmap.org/wiki/OpenRailwayMap/API)
- [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API)

### Railway MVP Flow

1. User chooses `Train` mode.
2. User searches boarding station and destination station.
3. Backend resolves station coordinates through local station index or Nominatim.
4. Backend computes rail route using cached Kerala railway graph.
5. Shared route-analysis engine receives rail coordinates exactly like bus coordinates.
6. Sun side, exposure timeline, glare warning, comfort score, and rain window render in the same UI.

This keeps the core math reusable: bus, bike, walk, and train all become "a timestamped polyline plus travel speed".

### Train Number Flow

Train-number support should be phase two:

1. User enters train number.
2. Backend resolves station sequence and approximate schedule.
3. User selects boarding and deboarding station from that train's stops.
4. Backend builds only that sub-route.
5. If live delay is available, adjust segment timestamps.
6. If live data is unavailable, show scheduled-time confidence instead of pretending precision.

## GenAI Integration Plan

GenAI should make Thanal smarter and more resume-worthy, but it should not replace deterministic route and sun calculations. The AI agent should orchestrate tools, explain tradeoffs, and handle messy user intent. The physics stays in code.

### AI Agent Role

The agent can use tool calls like:

- `searchPlaces(query)`
- `findRailStations(query)`
- `getRoadRoute(start, end, mode)`
- `getRailRoute(fromStation, toStation, trainNumber?)`
- `getWeather(point, time)`
- `analyzeSunExposure(route, departureTime, mode)`
- `getCommunityRisks(route)`
- `saveCommute(route)`

Example user prompts:

- "I am taking the Jan Shatabdi from Ernakulam to Kozhikode at 5pm. Which side should I sit?"
- "I have to leave Thrissur around 4:30. Bus or train, whichever avoids sun better."
- "Explain why right side is bad after Shoranur."
- "Remind me daily if my evening commute has rain or direct sun."

### Best AI Features

- Natural-language trip planner: parse messy commute requests into structured route inputs.
- Agentic comfort advisor: compare bus/train/bike/walk options using sun, rain, UV, time, and confidence.
- Explanation generator: turn segment math into human-readable advice.
- Delay-aware re-analysis: if train delay is known, recompute sun side because sun angle changes with time.
- Data-quality assistant: detect missing rail geometry, suspicious station matches, or low-confidence route snaps.
- Community report summarizer: combine flood reports, road damage, station access issues, and festival disruptions into short alerts.

### AI Safety Rule

The AI can explain and choose workflows, but final seat-side recommendation must come from deterministic geometry + solar astronomy. This prevents hallucinated advice and makes the architecture interview-friendly.

## Implementation Roadmap

### Phase 1 — Railway Core

- Add `train` to shared `TravelMode`
- Add rail station search endpoint
- Create SQLite tables for railway stations, rail edges, train services, and train stops
- Build a Kerala rail graph from OSM/Overpass data
- Add backend `/api/rail/route` endpoint
- Reuse existing `analyzeRoute` for train sun exposure
- Add Train tab on web and mobile

### Phase 2 — Better Railway Coverage

- Cache rail graph locally so the app works without hammering Overpass
- Add station aliases and Malayalam/English name matching
- Add train-number search from a curated dataset or provider adapter
- Add delay offset input when live status is unavailable
- Add confidence scoring: high for graph-matched railway route, medium for station-to-station estimate, low for missing data

### Phase 3 — GenAI Agent

- Add backend AI service with tool-calling
- Add `/api/assistant/plan` endpoint
- Let the agent call route, weather, rail, community, and sun-analysis tools
- Add chat-style "Ask Thanal" panel in web
- Add mobile assistant card for saved commutes
- Log tool traces for portfolio demo and debugging

### Phase 4 — Kerala Intelligence Layer

- Flood-prone roads and underpasses
- Station access comfort notes
- Festival/procession disruption calendar
- Monsoon road condition reports
- Saved commute notifications with daily AI-generated summaries

## Tech Stack

| Layer | Tech |
|---|---|
| Mobile | React Native with Expo SDK 54 |
| Web | React + Vite |
| Maps | Leaflet, React Native Maps, OpenStreetMap |
| Road Routing | OSRM public API |
| Rail Routing | OSM/OpenRailwayMap/Overpass-derived local graph |
| Place Search | Nominatim proxy |
| Sun Math | SunCalc.js |
| Weather | Open-Meteo |
| Backend | Node.js + Express |
| Database | SQLite through Node `node:sqlite` |
| AI | Tool-calling GenAI agent over deterministic route/weather/sun tools |

## Prerequisites

- Node.js. This project currently runs on Node `24.x`.
- npm
- Git
- Expo Go 54 on Android or iOS for mobile testing
- Internet access for OSRM, Open-Meteo, Nominatim, and map tiles

No paid API keys are required for the current app. GenAI integration can be added behind an optional API key.

## Setup

```powershell
npm install
```

## Run Locally

Start the backend:

```powershell
npm.cmd run dev:backend
```

Start the web app:

```powershell
npm.cmd run dev:web
```

Open:

```text
http://127.0.0.1:5173/
```

Start the Expo app:

```powershell
npm.cmd run dev:mobile
```

For Expo Go on a physical phone, change `packages/mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "http://YOUR_LAN_IP:4010"
    }
  }
}
```

For example: `http://192.168.1.20:4010`.

## Validation

```powershell
npm.cmd run typecheck
npm.cmd run test -w @thanal/shared
npm.cmd run build -w @thanal/web
```

## Project Structure

```text
backend/
  src/
    routes/        Express route handlers
    services/      OSRM and future rail integration helpers
    db/            SQLite schema and connection

packages/
  shared/          Route, sun, glare, geospatial, and comfort logic
  web/             React + Vite web app
  mobile/          Expo React Native app

assets/            Thanal logo and brand images
docs/              Screenshots and demo assets
```

## Notes

- The backend uses Node's built-in `node:sqlite` module to avoid native npm compilation on Windows and Node 24.
- If the backend cannot reach OSRM, saved commute refresh falls back to direct-line route analysis instead of failing.
- `better-sqlite3` was intentionally avoided for now because Node 24 did not have a prebuilt binary on this machine and required Visual Studio C++ build tools.

## One-Line Pitch

Thanal is a travel comfort assistant for Kerala commuters: it tells you which side of the bus or train to sit on to avoid the sun, warns riders about glare and incoming rain, and uses real solar astronomy plus live weather data to make routes more comfortable.
