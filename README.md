# Thanal - Sun & Comfort-Aware Travel Assistant

> *Thanal* means shade in Malayalam. Because sometimes the best feature a navigation app can have is knowing when to get out of the sun.

Thanal is a travel comfort assistant. It tells commuters which side of a bus or train to sit on to avoid harsh sun, shows multiple road or rail route options, warns riders about glare and rain risk, and scores a route by heat, UV, humidity, and exposure.

## The Story

I came across a really neat app called **Veyil** while planning a long train journey from Shoranur to Trivandrum. The concept immediately clicked—it helps you figure out which side of the bus to sit on to avoid the sun. It's a brilliant idea, especially for Kerala where the sun gets quite harsh! However, since the app focuses on bus travel and didn't have train routes mapped, it couldn't help me on the rail tracks, and I ended up getting a bit cooked on my side of the window. 

That train ride got me thinking: what if we built a travel companion that could map out train routes too, and factor in not just the sun's position, but real-time UV indexes, monsoon rain forecasts, and community-sourced updates like clean washrooms and road safety?

That was the spark behind **Thanal**. It's built with love for Kerala commuters to keep travel comfortable, safe, and shade-aware.

## Current Features

- **Search-First Flow**: Redesigned mobile home screen starts with a clean route search panel, keeping the map clean and distraction-free.
- **Collapsible Route Summary**: After searching, the map displays route options with a bottom summary card. Swipe/tap the up chevron to expand route details or tap the down chevron to collapse it back.
- **Community Contributions**: Dedicated reporting/pin-drop flow to add public and petrol pump washrooms. Contribution mode displays a pulsing notification banner and auto-opens pin drop popups showing lat/lng.
- **Washroom Pin Drop & Reviews**: Added uploader details forms to capture "Public Washroom" and "Petrol Pump Washroom" reviews/descriptions. Coordinates are automatically reverse-geocoded to street addresses.
- **Color-Coded Accuracy Map Pins**: Existing washrooms show dynamic status-colored rings (green for clean, red for dirty) along with upvote/downvote accuracy percentages. Speed cameras are color-coded by verification status.
- **App Feedback & Deep Linking**: Added a dedicated top-level "Feedback" tab in settings with a shortcut link directly in the search panel.
- **Road & Rail Routing**: OSRM road routing options, train station search, and custom Kerala rail corridor engine.
- **Comfort & Weather Analytics**: SunCalc relative sun side calculation, glare alerts, Open-Meteo UV, humidity, temperature, and rain timelines.

## Tech Stack & Resources Used

| Layer | Technology | Details / Purpose |
|---|---|---|
| **Mobile** | React Native | Powered by Expo SDK 54 for cross-platform mobile views. |
| **Web** | React + Vite | Fast, interactive web views with responsive mobile overrides. |
| **Maps** | Leaflet | Map rendering with custom OpenStreetMap tile layers. |
| **Road Routing** | OSRM API | Open Source Routing Machine to calculate driving directions and coordinates. |
| **Place Search** | Nominatim proxy | OpenStreetMap place lookup and reverse-geocoding coordinates to addresses. |
| **Sun Math** | SunCalc.js | Calculates solar position (azimuth, altitude) based on date, time, and coordinates. |
| **Weather** | Open-Meteo | Pulls hourly forecasts for UV Index, relative humidity, temperature, and rain probability. |
| **GenAI** | Gemini API | Optional Google Gemini integrations for smart travel route explanations. |
| **Backend** | Node.js + Express | Handles place proxies, rail engines, feedback routing, and saved commutes. |
| **Database** | SQLite | Serverless database using Node's native `node:sqlite` module to avoid compilation issues. |

## Prerequisites

- Node.js. This project currently runs on Node `24.x`.
- npm
- Git
- Expo Go 54 on Android or iOS for mobile testing
- Internet access for OSRM, Open-Meteo, Nominatim, Gemini, and map tiles
- Optional: `GEMINI_API_KEY` in `backend/.env` for AI answers

## Setup

```powershell
npm install
```

Create `backend/.env` if you want Gemini responses:

```text
GEMINI_API_KEY=your_key_here
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
    services/      OSRM, rail, and API helpers
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
- If Gemini is not configured or unavailable, the assistant returns a deterministic route-tool summary instead of failing the flow.
- Train mode currently uses the bundled Kerala rail corridor engine. Official NTES live train status is available for users, but Thanal does not depend on unofficial scraped IRCTC/NTES APIs.
- `better-sqlite3` was intentionally avoided for now because Node 24 did not have a prebuilt binary on this machine and required Visual Studio C++ build tools.

## One-Line Pitch

Thanal is a travel comfort assistant for Kerala commuters: it tells you which side of the bus or train to sit on to avoid the sun, warns riders about glare and incoming rain, and uses real solar astronomy plus live weather data to make routes more comfortable.
