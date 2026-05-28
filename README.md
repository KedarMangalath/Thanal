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
- Train mode with station search, route options, and rail-side sun analysis
- SunCalc-based segment analysis for sun side, seat recommendation, glare, and timeline exposure
- Open-Meteo weather lookup for UV, humidity, temperature, and rain probability
- Real rain-window strip from hourly forecast data
- Comfort score from weather conditions
- Saved commutes on web and mobile through the backend
- Backend routes for routing, rail, weather, places, saved routes, and community reports

## Tech Stack

| Layer | Tech |
|---|---|
| Mobile | React Native with Expo SDK 54 |
| Web | React + Vite |
| Maps | Leaflet, React Native Maps, OpenStreetMap |
| Road Routing | OSRM public API |
| Rail Routing | Kerala railway station route engine |
| Place Search | Nominatim proxy |
| Sun Math | SunCalc.js |
| Weather | Open-Meteo |
| Backend | Node.js + Express |
| Database | SQLite through Node `node:sqlite` |

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
