export type LatLng = {
  lat: number;
  lng: number;
};

export type TravelMode = "bus" | "bike" | "walk" | "train";

export type VehicleSide = "left" | "right" | "front" | "behind" | "none";

export type SeatSide = "left" | "right" | "either";

export type RoutePoint = LatLng & {
  timestamp?: string;
};

export type RouteSegmentExposure = {
  segmentIndex: number;
  start: LatLng;
  end: LatLng;
  startTime: string;
  endTime: string;
  distanceMeters: number;
  headingDegrees: number;
  sunAzimuthDegrees: number;
  sunAltitudeDegrees: number;
  sunSide: VehicleSide;
  recommendedSeat: SeatSide;
  directSunMinutes: number;
  glareRisk: boolean;
};

export type SpeedCamera = {
  id: number;
  lat: number;
  lng: number;
  source: string;
  verified: boolean;
  status: string;
};

export type Washroom = {
  id: number;
  lat: number;
  lng: number;
  type: "public" | "fuel_station";
  status: "good" | "bad" | "unverified";
  upvotes: number;
  downvotes: number;
  image_url: string | null;
  description: string | null;
};

export type RouteAnalysis = {
  departureTime: string;
  totalDistanceMeters: number;
  totalDurationMinutes: number;
  directSunMinutesBySide: Record<"left" | "right", number>;
  recommendedSeat: SeatSide;
  glareWindows: RouteSegmentExposure[];
  timeline: RouteSegmentExposure[];
  speedCameras?: SpeedCamera[];
  shadeCoverPercent?: number;
  washrooms?: Washroom[];
};

export type WeatherSnapshot = {
  temperatureC: number;
  relativeHumidity: number;
  uvIndex: number;
  precipitationProbability?: number;
  rainTimeline?: RainBucket[];
};

export type RainBucket = {
  time: string;
  probability: number;
  precipitationMm?: number;
};

export type ComfortScore = {
  score: number;
  label: "good" | "warm" | "harsh" | "avoid";
  factors: {
    heat: number;
    humidity: number;
    uv: number;
    rain: number;
  };
};
