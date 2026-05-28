import type { LatLng } from "@thanal/shared";
import MapView, { Marker, Polyline } from "react-native-maps";
import { StyleSheet } from "react-native";

type Props = {
  start: LatLng | null;
  end: LatLng | null;
  route: LatLng[];
  routes?: Array<{ id: string; coordinates: LatLng[] }>;
  activeRouteId?: string | null;
  onPick: (point: LatLng) => void;
};

export default function MapPicker({ start, end, route, routes = [], activeRouteId, onPick }: Props) {
  const visibleRoutes = routes.length > 0 ? routes : route.length > 1 ? [{ id: "route", coordinates: route }] : [];

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 9.9312,
        longitude: 76.2673,
        latitudeDelta: 3.8,
        longitudeDelta: 3.8
      }}
      onPress={(event) =>
        onPick({
          lat: event.nativeEvent.coordinate.latitude,
          lng: event.nativeEvent.coordinate.longitude
        })
      }
    >
      {visibleRoutes.map((candidate) => {
        const isActive = !activeRouteId || candidate.id === activeRouteId;
        return (
        <Polyline
          key={candidate.id}
          coordinates={candidate.coordinates.map((point) => ({
            latitude: point.lat,
            longitude: point.lng
          }))}
          strokeColor={isActive ? "#5b35f0" : "#8fb8ff"}
          strokeWidth={isActive ? 6 : 4}
        />
        );
      })}
      {start ? (
        <Marker
          coordinate={{ latitude: start.lat, longitude: start.lng }}
          title="Start"
          pinColor="#0f766e"
        />
      ) : null}
      {end ? (
        <Marker
          coordinate={{ latitude: end.lat, longitude: end.lng }}
          title="Destination"
          pinColor="#f97316"
        />
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    borderRadius: 8,
    height: 320,
    overflow: "hidden",
    width: "100%"
  }
});
