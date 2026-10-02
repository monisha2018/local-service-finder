import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { Provider } from "../../types";

const DEFAULT_ICON = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const YOU_ICON = new L.DivIcon({
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#630ED4;border:3px solid white;box-shadow:0 0 0 2px rgba(99,14,212,0.4)"></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [JSON.stringify(points)]);
  return null;
}

interface ProviderMapProps {
  providers: Provider[];
  userLocation?: { lat: number; lng: number } | null;
  height?: string;
}

export default function ProviderMap({ providers, userLocation, height = "100%" }: ProviderMapProps) {
  const navigate = useNavigate();

  const providerPoints = providers
    .filter((p) => p.location?.coordinates)
    .map((p) => [p.location!.coordinates[1], p.location!.coordinates[0]] as [number, number]);

  const allPoints: [number, number][] = userLocation ? [[userLocation.lat, userLocation.lng], ...providerPoints] : providerPoints;

  const center: [number, number] = allPoints[0] || [13.0827, 80.2707];

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom={true} style={{ height, width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToMarkers points={allPoints} />

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={YOU_ICON}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {providers.map((p) => {
        if (!p.location?.coordinates) return null;
        const [lng, lat] = p.location.coordinates;
        return (
          <Marker key={p._id} position={[lat, lng]} icon={DEFAULT_ICON}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <p style={{ fontWeight: 600, marginBottom: 2 }}>{p.userId?.name}</p>
                <p style={{ fontSize: 12, color: "#4A4455", marginBottom: 6 }}>
                  {p.profession} · ★ {p.rating.toFixed(1)}
                </p>
                <button
                  onClick={() => navigate(`/providers/${p._id}`)}
                  style={{ fontSize: 12, fontWeight: 600, color: "#630ED4", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  View Profile →
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}