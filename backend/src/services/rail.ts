import { analyzeRoute, distanceMeters, type LatLng } from "@thanal/shared";
import fs from "fs";
import path from "path";
import createGraph from "ngraph.graph";
import { aStar } from "ngraph.path";

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

let allIndianStations: RailStation[] = [];
try {
  const dataPath = path.join(process.cwd(), "src", "stations.json");
  const rawData = fs.readFileSync(dataPath, "utf-8");
  const geojson = JSON.parse(rawData);
  allIndianStations = geojson.features
    .filter((f: any) => f.geometry && f.geometry.type === "Point" && f.properties && f.properties.name)
    .map((f: any) => ({
      code: f.properties.code,
      name: f.properties.name,
      aliases: [],
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0]
    }));
} catch (e) {
  console.warn("Failed to load all-India stations.json, falling back to Kerala corridors only.", e);
}

// Build Railway Graph
const railGraph = createGraph();
let pathFinder: any = null;

try {
  const trackPath = path.join(process.cwd(), "src", "rail-tracks.json");
  if (fs.existsSync(trackPath)) {
    const lines = JSON.parse(fs.readFileSync(trackPath, "utf-8")) as LatLng[][];
    for (const line of lines) {
      for (let i = 0; i < line.length; i++) {
        const p1 = line[i];
        const id1 = `${p1.lat.toFixed(5)},${p1.lng.toFixed(5)}`;
        railGraph.addNode(id1, p1);
        if (i > 0) {
          const p0 = line[i - 1];
          const id0 = `${p0.lat.toFixed(5)},${p0.lng.toFixed(5)}`;
          const dist = distanceMeters(p0, p1);
          railGraph.addLink(id0, id1, { weight: dist });
          railGraph.addLink(id1, id0, { weight: dist }); // undirected
        }
      }
    }
    pathFinder = aStar(railGraph, {
      distance(fromNode, toNode, link) {
        return link.data.weight;
      },
      heuristic(fromNode, toNode) {
        return distanceMeters(fromNode.data, toNode.data);
      }
    });
    console.log(`Built rail routing graph with ${railGraph.getNodesCount()} nodes.`);
  }
} catch (e) {
  console.warn("Failed to load rail-tracks.json", e);
}

function findClosestTrackNode(point: LatLng): string | null {
  if (railGraph.getNodesCount() === 0) return null;
  let bestId: string | null = null;
  let bestDist = Infinity;
  railGraph.forEachNode((node) => {
    const d = distanceMeters(point, node.data);
    if (d < bestDist) {
      bestDist = d;
      bestId = node.id as string;
    }
  });
  return bestId;
}

function routeAlongTracks(waypoints: LatLng[]): LatLng[] {
  if (!pathFinder || waypoints.length < 2) return waypoints;
  
  const fullPath: LatLng[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const startId = findClosestTrackNode(waypoints[i]);
    const endId = findClosestTrackNode(waypoints[i + 1]);
    
    if (startId && endId) {
      const pathNodes = pathFinder.find(startId, endId);
      if (pathNodes && pathNodes.length > 0) {
        // ngraph returns path from end to start, so we reverse it
        const segment = pathNodes.reverse().map((n: any) => n.data as LatLng);
        // Avoid duplicating intermediate waypoint coordinate
        if (i > 0) segment.shift(); 
        fullPath.push(...segment);
        continue;
      }
    }
    // Fallback to straight line if no route
    if (i === 0) fullPath.push(waypoints[i]);
    fullPath.push(waypoints[i + 1]);
  }
  return fullPath;
}

export function searchRailStations(query: string) {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];

  const sourceList = allIndianStations.length > 0 ? allIndianStations : keralaStations;

  return sourceList
    .filter((station) =>
      station.code.toLowerCase().includes(normalized) ||
      station.name.toLowerCase().includes(normalized)
    )
    .slice(0, 10);
}

export function planRailRoute(input: {
  start: LatLng;
  end: LatLng;
  departureTime: Date;
  averageSpeedKmh?: number;
  timeType?: string;
}) {
  const nearest = nearestRailStation(input.start);
  const target = nearestRailStation(input.end);
  const options = railCorridors
    .map((corridor) => buildCorridorOption(corridor, nearest.code, target.code, input))
    .filter((option) => option !== null) as NonNullable<ReturnType<typeof buildCorridorOption>>[];

  if (options.length === 0) {
    const coordinates = [nearest, target];
    const speedKmh = input.averageSpeedKmh ?? 60;
    let durationMinutes = (distanceMeters(nearest, target) / 1000) / speedKmh * 60;
    
    let routeDepartureTime = input.departureTime;
    if (input.timeType === "arrive") {
      routeDepartureTime = new Date(input.departureTime.getTime() - durationMinutes * 60000);
    }
    
    const analysis = analyzeRoute(coordinates, {
      departureTime: routeDepartureTime,
      averageSpeedKmh: speedKmh
    });
    options.push({
      id: `rail-proxy-${nearest.code}-${target.code}`,
      label: `Direct proxy route`,
      serviceHint: `Assumed straight-line path for sun analysis`,
      stations: [nearest, target],
      coordinates,
      analysis
    });
  }

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
  const sourceList = allIndianStations.length > 0 ? allIndianStations : keralaStations;
  return sourceList.reduce((best, station) => {
    const distance = distanceMeters(point, station);
    return distance < best.distance ? { station, distance } : best;
  }, { station: sourceList[0], distance: Number.POSITIVE_INFINITY }).station;
}

function buildCorridorOption(
  corridor: (typeof railCorridors)[number],
  fromCode: string,
  toCode: string,
  input: { departureTime: Date; averageSpeedKmh?: number; timeType?: string; }
) {
  const fromIndex = corridor.stations.findIndex((station) => station.code === fromCode);
  const toIndex = corridor.stations.findIndex((station) => station.code === toCode);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return null;

  const low = Math.min(fromIndex, toIndex);
  const high = Math.max(fromIndex, toIndex);
  const stations = corridor.stations.slice(low, high + 1);
  const orderedStations = fromIndex <= toIndex ? stations : [...stations].reverse();
  
  const rawCoordinates = orderedStations.map(({ lat, lng }) => ({ lat, lng }));
  const coordinates = routeAlongTracks(rawCoordinates);

  const speedKmh = input.averageSpeedKmh ?? 48;
  let durationMinutes = 0;
  for (let i = 1; i < coordinates.length; i++) {
    durationMinutes += (distanceMeters(coordinates[i-1], coordinates[i]) / 1000) / speedKmh * 60;
  }

  let routeDepartureTime = input.departureTime;
  if (input.timeType === "arrive") {
    routeDepartureTime = new Date(input.departureTime.getTime() - durationMinutes * 60000);
  }

  const analysis = analyzeRoute(coordinates, {
    departureTime: routeDepartureTime,
    averageSpeedKmh: speedKmh
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
