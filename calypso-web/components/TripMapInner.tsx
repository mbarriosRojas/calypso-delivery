'use client'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'

// Fix default marker icons (Leaflet + webpack issue)
const redIcon = L.divIcon({ className: '', html: '<div style="width:16px;height:16px;border-radius:50%;background:#DC2626;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })
const greenIcon = L.divIcon({ className: '', html: '<div style="width:16px;height:16px;border-radius:50%;background:#16A34A;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })
const blueIcon = L.divIcon({ className: '', html: '<div style="width:20px;height:20px;border-radius:50%;background:#1B4FD8;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>', iconSize: [20, 20], iconAnchor: [10, 10] })

interface Location { locationId: string; name: string; city: string; lat: number | null; lng: number | null }
interface Trip { tripId: string; status: string; driver?: { name: string }; origin: Location; destination: Location }
interface Props { locations: Location[]; trips: Trip[] }

export default function TripMapInner({ locations, trips }: Props) {
  const validLocations = locations.filter((l) => l.lat && l.lng)
  const center: [number, number] = validLocations.length > 0
    ? [validLocations[0].lat!, validLocations[0].lng!]
    : [4.6097, -74.0817]

  const activeTrips = trips.filter((t) => t.status === 'TRANS')
  const originIds = new Set(trips.map((t) => t.origin.locationId))
  const destinationIds = new Set(trips.map((t) => t.destination.locationId))

  return (
    <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validLocations.map((loc) => {
        const icon = activeTrips.some(t => t.origin.locationId === loc.locationId || t.destination.locationId === loc.locationId)
          ? blueIcon
          : originIds.has(loc.locationId) ? redIcon : greenIcon
        return (
          <Marker key={loc.locationId} position={[loc.lat!, loc.lng!]} icon={icon}>
            <Popup>
              <strong>{loc.name}</strong><br />
              {loc.city}<br />
              <span style={{ fontSize: '11px', color: '#666' }}>{loc.locationId}</span>
            </Popup>
          </Marker>
        )
      })}
      {activeTrips.map((trip) => {
        const o = trip.origin; const d = trip.destination
        if (!o.lat || !o.lng || !d.lat || !d.lng) return null
        return (
          <Polyline
            key={trip.tripId}
            positions={[[o.lat, o.lng], [d.lat, d.lng]]}
            color="#1B4FD8"
            dashArray="6 4"
            weight={2}
          />
        )
      })}
    </MapContainer>
  )
}
