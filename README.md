# Thanal

Thanal is a sun and comfort-aware travel assistant for Kerala commuters. It helps bus passengers choose the shaded side, warns riders about glare and rain windows, and scores routes by heat, UV, humidity, and exposure.

## Prerequisites

- Node.js LTS is recommended. This machine has Node `24.15.0`; web and backend should be fine, but Expo may prefer the current LTS release if mobile tooling complains.
- npm, already available on this machine.
- Git, already available on this machine.
- Expo Go on your Android or iOS device for mobile testing.
- Internet access for installing npm packages and calling OSRM, Open-Meteo, Nominatim, and OpenStreetMap tiles.
- Optional: a Google Places API key later, only if we decide Nominatim is not good enough for local place search.

## Quick Start

```powershell
npm install
npm run dev:web
npm run dev:backend
npm run dev:mobile
```

## Project Structure

```text
packages/
  shared/   Shared route, sun, glare, and comfort logic
  web/      React + Vite web app
  mobile/   Expo React Native app
backend/    Express API and SQLite storage
docs/       Screenshots and demo assets
```
