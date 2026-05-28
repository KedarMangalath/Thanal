import type { LatLng } from "@thanal/shared";
import MapView, { Marker, Polyline } from "react-native-maps";
import { StyleSheet } from "react-native";

type Props = {
  start: LatLng | null;
  end: LatLng | null;
  route: LatLng[];
  onPick: (point: LatLng) => void;
};

export default function MapPicker({ start, end, route, onPick }: Props) {
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
      {route.length > 1 ? (
        <Polyline
          coordinates={route.map((point) => ({
            latitude: point.lat,
            longitude: point.lng
          }))}
          strokeColor="#0f766e"
          strokeWidth={5}
        />
      ) : null}
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
