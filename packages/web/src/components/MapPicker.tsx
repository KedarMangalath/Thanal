import type { LatLng } from "@thanal/shared";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMapEvents } from "react-leaflet";

type MapPickerProps = {
  start: LatLng | null;
  end: LatLng | null;
  route: LatLng[];
  onPick: (point: LatLng) => void;
};

const center: [number, number] = [9.9312, 76.2673];

const startIcon = new L.DivIcon({
  className: "marker-pin marker-start",
  html: "<span>S</span>",
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const endIcon = new L.DivIcon({
  className: "marker-pin marker-end",
  html: "<span>E</span>",
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

export default function MapPicker({ start, end, route, onPick }: MapPickerProps) {
  return (
    <MapContainer center={center} zoom={8} className="map-canvas" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onPick={onPick} />
      {route.length > 1 ? (
        <Polyline
          positions={route.map((point) => [point.lat, point.lng])}
          pathOptions={{ color: "#0f766e", weight: 6, opacity: 0.86 }}
        />
      ) : null}
      {start ? <Marker position={[start.lat, start.lng]} icon={startIcon} /> : null}
      {end ? <Marker position={[end.lat, end.lng]} icon={endIcon} /> : null}
    </MapContainer>
  );
}

function MapClickHandler({ onPick }: { onPick: (point: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    }
  });

  return null;
}
