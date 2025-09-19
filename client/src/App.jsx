import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const defaultZoom = 13;

function FitToBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds, map]);
  return null;
}

const blueIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function decodePolyline(encoded) {
  // Google polyline decoding
  let points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

export default function App() {
  const [userPos, setUserPos] = useState(null);
  const [originInput, setOriginInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [routePoints, setRoutePoints] = useState([]);
  const [bounds, setBounds] = useState(null);
  const [status, setStatus] = useState('A obter localização...');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('Geolocalização não suportada.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(coords);
        setOriginInput(`${coords.lat},${coords.lng}`);
        setStatus('');
      },
      () => setStatus('Permita acesso à localização para centrar o mapa.')
    );
  }, []);

  const fetchRoute = async (origin, destination) => {
    if (!origin || !destination) return;
    try {
      setStatus('A calcular rota...');
      const res = await axios.get('/api/directions', {
        params: {
          origin,
          destination,
          mode: 'driving',
          traffic_model: 'best_guess',
          alternatives: false
        }
      });
      const route = res.data.routes?.[0];
      if (route) {
        const poly = route.overview_polyline?.points;
        const pts = poly ? decodePolyline(poly) : [];
        setRoutePoints(pts);
        if (pts.length) {
          const latlngs = pts.map(([la, ln]) => L.latLng(la, ln));
          const b = L.latLngBounds(latlngs);
          setBounds(b);
        }
        setStatus('');
      } else {
        setRoutePoints([]);
        setStatus('Sem rota encontrada.');
      }
    } catch (e) {
      setStatus('Erro ao obter direções.');
    }
  };

  const onPlan = async (e) => {
    e.preventDefault();
    await fetchRoute(originInput, destInput);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchRoute(originInput, destInput), 30000);
  };

  useEffect(() => () => intervalRef.current && clearInterval(intervalRef.current), []);

  const mapCenter = useMemo(() => userPos || { lat: 38.7223, lng: -9.1393 }, [userPos]);

  return (
    <div className="map-container">
      <div className="controls">
        <form onSubmit={onPlan}>
          <div>
            <input
              type="text"
              placeholder="Origem (lat,lng ou endereço)"
              value={originInput}
              onChange={e => setOriginInput(e.target.value)}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Destino (lat,lng ou endereço)"
              value={destInput}
              onChange={e => setDestInput(e.target.value)}
            />
          </div>
          <button type="submit">Traçar rota</button>
          <div>{status}</div>
        </form>
      </div>

      <MapContainer center={mapCenter} zoom={defaultZoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        {userPos && <Marker position={userPos} icon={blueIcon} />}
        {routePoints.length > 0 && (
          <Polyline positions={routePoints} color="#1976d2" weight={5} opacity={0.8} />
        )}
        {bounds && <FitToBounds bounds={bounds} />}
      </MapContainer>
    </div>
  );
}

