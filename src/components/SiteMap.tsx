import { MapContainer, TileLayer, Marker, Circle, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Self-contained SVG pin so we don't depend on Leaflet's default marker
// image files (which break under bundling).
const pinIcon = L.divIcon({
  className: "",
  iconSize: [32, 42],
  iconAnchor: [16, 40],
  html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 1C8 1 2 7 2 15c0 10 14 26 14 26s14-16 14-26C30 7 24 1 16 1z" fill="#1A6BFF" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="15" r="5.5" fill="#fff"/></svg>`,
});

// Read-only map: site pin, geofence radius, and (optionally) the worker's
// current position.
export default function SiteMap({
  latitude,
  longitude,
  radius,
  userLat,
  userLng,
}: {
  latitude: number;
  longitude: number;
  radius: number;
  userLat?: number;
  userLng?: number;
}) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={17}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      attributionControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Circle
        center={[latitude, longitude]}
        radius={radius}
        pathOptions={{ color: "#1A6BFF", weight: 2, fillColor: "#1A6BFF", fillOpacity: 0.15 }}
      />
      <Marker position={[latitude, longitude]} icon={pinIcon} />
      {userLat != null && userLng != null && (
        <CircleMarker
          center={[userLat, userLng]}
          radius={6}
          pathOptions={{ color: "#fff", weight: 2, fillColor: "#22C55E", fillOpacity: 1 }}
        />
      )}
    </MapContainer>
  );
}
