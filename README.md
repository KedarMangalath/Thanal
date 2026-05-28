# Thanal

Thanal is a sun and comfort-aware travel assistant for Kerala commuters. It helps bus passengers choose the shaded side, warns riders about glare and rain risk, and scores routes by heat, UV, humidity, and exposure.

The name means shade in Malayalam.

## Current Features

- Web route planner with Leaflet and OpenStreetMap tiles
- Tap-to-select start and destination points
- Place search through the backend Nominatim proxy
- OSRM road routing with route polyline display
- SunCalc-based segment analysis for sun side, seat recommendation, glare, and timeline exposure
- Open-Meteo weather lookup for UV, humidity, temperature, and rain probability
- Comfort score from weather conditions
- Saved commutes on web and mobile through the backend
- Mobile Expo app with Home, Bus, Ride, and Saved tabs
- Backend routes for routing, weather, places, saved routes, and community reports

## Prerequisites

- Node.js. This project currently runs on Node `24.x`.
- npm
- Git
- Expo Go on your Android or iOS device for mobile testing
- Internet access for OSRM, Open-Meteo, Nominatim, and map tiles

No paid API keys are required.

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
    services/      OSRM integration helpers
    db/            SQLite schema and connection

packages/
  shared/          Route, sun, glare, geospatial, and comfort logic
  web/             React + Vite web app
  mobile/          Expo React Native app

docs/              Screenshots and demo assets
```

## Notes

- The backend uses Node's built-in `node:sqlite` module to avoid native npm compilation on Windows and Node 24.
- If the backend cannot reach OSRM, saved commute refresh falls back to direct-line route analysis instead of failing.
- `better-sqlite3` was intentionally avoided for now because Node 24 did not have a prebuilt binary on this machine and required Visual Studio C++ build tools.

## One-Line Pitch

Thanal is a travel comfort assistant for Kerala commuters: it tells you which side of the bus to sit on to avoid the sun, warns riders about glare and incoming rain, and uses real solar astronomy plus live weather data to make routes more comfortable.
