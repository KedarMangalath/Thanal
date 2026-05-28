import { analyzeRoute, distanceMeters, type LatLng } from "@thanal/shared";

export type RailStation = LatLng & {
  code: string;
  name: string;
  aliases: string[];
};

const coastalLine: RailStation[] = [
  { code: "TVC", name: "Thiruvananthapuram Central", aliases: ["trivandrum", "tvm"], lat: 8.4875, lng: 76.9525 },
  { code: "VAK", name: "Varkala Sivagiri", aliases: ["varkala"], lat: 8.7341, lng: 76.7256 },
  { code: "QLN", name: "Kollam Junction", aliases: ["quilon"], lat: 8.8865, lng: 76.5951 },
  { code: "KPY", name: "Karunagappalli", aliases: ["karunagappally"], lat: 9.0542, lng: 76.5354 },
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

const kottayamLine: RailStation[] = [
  { code: "TVC", name: "Thiruvananthapuram Central", aliases: ["trivandrum", "tvm"], lat: 8.4875, lng: 76.9525 },
  { code: "VAK", name: "Varkala Sivagiri", aliases: ["varkala"], lat: 8.7341, lng: 76.7256 },
  { code: "QLN", name: "Kollam Junction", aliases: ["quilon"], lat: 8.8865, lng: 76.5951 },
  { code: "KYJ", name: "Kayamkulam Junction", aliases: ["kayamkulam"], lat: 9.1816, lng: 76.5009 },
  { code: "CNGR", name: "Chengannur", aliases: ["chengannur"], lat: 9.3186, lng: 76.6154 },
  { code: "TRVL", name: "Tiruvalla", aliases: ["thiruvalla"], lat: 9.3835, lng: 76.5743 },
  { code: "CGY", name: "Changanassery", aliases: ["changanasseri"], lat: 9.4426, lng: 76.5401 },
  { code: "KTYM", name: "Kottayam", aliases: ["kottayam"], lat: 9.5916, lng: 76.5222 },
  { code: "ERN", name: "Ernakulam Town", aliases: ["ernakulam north", "kochi"], lat: 9.9911, lng: 76.2862 },
  { code: "AWY", name: "Aluva", aliases: ["aluva"], lat: 10.1076, lng: 76.3511 },
  { code: "TCR", name: "Thrissur", aliases: ["trichur"], lat: 10.5167, lng: 76.2070 },
  { code: "SRR", name: "Shoranur Junction", aliases: ["shoranur"], lat: 10.7611, lng: 76.2707 },
  { code: "TIR", name: "Tirur", aliases: ["tirur"], lat: 10.9139, lng: 75.9213 },
  { code: "CLT", name: "Kozhikode", aliases: ["calicut"], lat: 11.2456, lng: 75.7817 },
  { code: "CAN", name: "Kannur", aliases: ["cannanore"], lat: 11.8745, lng: 75.3704 },
  { code: "KGQ", name: "Kasaragod", aliases: ["kasaragod"], lat: 12.4996, lng: 74.9869 }
];

const railCorridors = [
  { id: "coastal", label: "Coastal rail route", serviceHint: "Alappuzha-side trains", stations: coastalLine },
  { id: "kottayam", label: "Kottayam rail route", serviceHint: "Kottayam-side trains", stations: kottayamLine }
];

const keralaStations = Array.from(
  new Map(railCorridors.flatMap((corridor) => corridor.stations).map((station) => [station.code, station])).values()
);

export function searchRailStations(query: string) {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];

  return keralaStations
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
  const nearest = nearestRailStation(input.start);
  const target = nearestRailStation(input.end);
  const options = railCorridors
    .map((corridor) => buildCorridorOption(corridor, nearest.code, target.code, input))
    .filter((option) => option !== null);
  const recommended = options
    .map((option) => ({
      option,
      score:
        option.analysis.directSunMinutesBySide.left +
        option.analysis.directSunMinutesBySide.right +
        option.analysis.glareWindows.length * 8 +
        option.analysis.totalDurationMinutes * 0.1
    }))
    .sort((a, b) => a.score - b.score)[0]?.option;

  return {
    source: "kerala-seeded-rail-corridors",
    from: nearest,
    to: target,
    options,
    recommendedOptionId: recommended?.id,
    coordinates: recommended?.coordinates ?? [],
    stations: recommended?.stations ?? [],
    analysis: recommended?.analysis,
    confidence: nearest.code === target.code ? "low" : options.length > 1 ? "medium" : "low"
  };
}

function nearestRailStation(point: LatLng) {
  return keralaStations.reduce((best, station) => {
    const distance = distanceMeters(point, station);
    return distance < best.distance ? { station, distance } : best;
  }, { station: keralaStations[0], distance: Number.POSITIVE_INFINITY }).station;
}

function buildCorridorOption(
  corridor: (typeof railCorridors)[number],
  fromCode: string,
  toCode: string,
  input: { departureTime: Date; averageSpeedKmh?: number }
) {
  const fromIndex = corridor.stations.findIndex((station) => station.code === fromCode);
  const toIndex = corridor.stations.findIndex((station) => station.code === toCode);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return null;

  const low = Math.min(fromIndex, toIndex);
  const high = Math.max(fromIndex, toIndex);
  const stations = corridor.stations.slice(low, high + 1);
  const orderedStations = fromIndex <= toIndex ? stations : [...stations].reverse();
  const coordinates = orderedStations.map(({ lat, lng }) => ({ lat, lng }));
  const analysis = analyzeRoute(coordinates, {
    departureTime: input.departureTime,
    averageSpeedKmh: input.averageSpeedKmh ?? 48
  });

  return {
    id: `rail-${corridor.id}`,
    label: corridor.label,
    serviceHint: corridor.serviceHint,
    stations: orderedStations,
    coordinates,
    analysis
  };
}
