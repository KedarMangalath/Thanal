import { analyzeRoute, distanceMeters, type LatLng } from "@thanal/shared";

export type RailStation = LatLng & {
  code: string;
  name: string;
  aliases: string[];
};

const keralaMainline: RailStation[] = [
  { code: "TVC", name: "Thiruvananthapuram Central", aliases: ["trivandrum", "tvm"], lat: 8.4875, lng: 76.9525 },
  { code: "QLN", name: "Kollam Junction", aliases: ["quilon"], lat: 8.8865, lng: 76.5951 },
  { code: "KYJ", name: "Kayamkulam Junction", aliases: ["kayamkulam"], lat: 9.1816, lng: 76.5009 },
  { code: "ALLP", name: "Alappuzha", aliases: ["alleppey"], lat: 9.4981, lng: 76.3388 },
  { code: "ERS", name: "Ernakulam Junction", aliases: ["ernakulam south", "kochi"], lat: 9.9698, lng: 76.2917 },
  { code: "AWY", name: "Aluva", aliases: ["aluva"], lat: 10.1076, lng: 76.3511 },
  { code: "TCR", name: "Thrissur", aliases: ["trichur"], lat: 10.5167, lng: 76.2070 },
  { code: "SRR", name: "Shoranur Junction", aliases: ["shoranur"], lat: 10.7611, lng: 76.2707 },
  { code: "PGT", name: "Palakkad Junction", aliases: ["palghat"], lat: 10.7867, lng: 76.6548 },
  { code: "TIR", name: "Tirur", aliases: ["tirur"], lat: 10.9139, lng: 75.9213 },
  { code: "CLT", name: "Kozhikode", aliases: ["calicut"], lat: 11.2456, lng: 75.7817 },
  { code: "CAN", name: "Kannur", aliases: ["cannanore"], lat: 11.8745, lng: 75.3704 },
  { code: "KGQ", name: "Kasaragod", aliases: ["kasaragod"], lat: 12.4996, lng: 74.9869 }
];

export function searchRailStations(query: string) {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];

  return keralaMainline
    .filter((station) =>
      [station.code, station.name, ...station.aliases].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    )
    .slice(0, 8);
}

export function planRailRoute(input: {
  start: LatLng;
  end: LatLng;
  departureTime: Date;
  averageSpeedKmh?: number;
}) {
  const from = nearestRailStation(input.start);
  const to = nearestRailStation(input.end);
  const fromIndex = keralaMainline.findIndex((station) => station.code === from.code);
  const toIndex = keralaMainline.findIndex((station) => station.code === to.code);
  const low = Math.min(fromIndex, toIndex);
  const high = Math.max(fromIndex, toIndex);
  const stations = keralaMainline.slice(low, high + 1);
  const orderedStations = fromIndex <= toIndex ? stations : [...stations].reverse();
  const coordinates = orderedStations.map(({ lat, lng }) => ({ lat, lng }));
  const analysis = analyzeRoute(coordinates, {
    departureTime: input.departureTime,
    averageSpeedKmh: input.averageSpeedKmh ?? 48
  });

  return {
    source: "kerala-mainline-starter",
    from,
    to,
    stations: orderedStations,
    coordinates,
    analysis,
    confidence: from.code === to.code ? "low" : "medium"
  };
}

function nearestRailStation(point: LatLng) {
  return keralaMainline.reduce((best, station) => {
    const distance = distanceMeters(point, station);
    return distance < best.distance ? { station, distance } : best;
  }, { station: keralaMainline[0], distance: Number.POSITIVE_INFINITY }).station;
}
