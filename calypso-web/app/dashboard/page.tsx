'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getSession, logout } from '@/lib/auth'
import { TripStatusBadge } from '@/components/TripStatusBadge'
import { TripMap } from '@/components/TripMap'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Trip {
  id: string; tripId: string; status: string; scheduledAt: string
  driver: { driverId: string; name: string }
  vehicle: { plate: string; type: string }
  origin: { locationId: string; name: string; city: string; lat: number | null; lng: number | null }
  destination: { locationId: string; name: string; city: string; lat: number | null; lng: number | null }
}

interface Location {
  locationId: string; name: string; city: string; lat: number | null; lng: number | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    if (!session) { router.push('/login'); return }
    if (session.user.role !== 'COORDINATOR') { router.push('/my-trips'); return }

    Promise.all([
      api.get<{ data: Trip[] }>('/api/trips'),
      api.get<{ data: Location[] }>('/api/locations'),
    ]).then(([tripsRes, locsRes]) => {
      setTrips(tripsRes.data)
      setLocations(locsRes.data)
    }).finally(() => setLoading(false))
  }, [router])

  const counts = {
    PROG: trips.filter(t => t.status === 'PROG').length,
    TRANS: trips.filter(t => t.status === 'TRANS').length,
    NOV: trips.filter(t => t.status === 'NOV').length,
    ENTG: trips.filter(t => t.status === 'ENTG').length,
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Cargando...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">🚚 Calypso Delivery</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/dashboard" className="font-medium text-blue-700">Dashboard</Link>
          <Link href="/trips" className="text-gray-600 hover:text-blue-700">Viajes</Link>
          <Link href="/drivers" className="text-gray-600 hover:text-blue-700">Conductores</Link>
          <Link href="/vehicles" className="text-gray-600 hover:text-blue-700">Vehículos</Link>
          <button onClick={logout} className="text-gray-400 hover:text-red-600">Salir</button>
        </nav>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Panel de operación</h2>

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Programados', count: counts.PROG, color: 'text-gray-700', bg: 'bg-gray-50' },
            { label: 'En tránsito', count: counts.TRANS, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Novedades', count: counts.NOV, color: 'text-yellow-700', bg: 'bg-yellow-50' },
            { label: 'Entregados hoy', count: counts.ENTG, color: 'text-green-700', bg: 'bg-green-50' },
          ].map(({ label, count, color, bg }) => (
            <Card key={label} className={`${bg} border-0`}>
              <CardContent className="pt-5 pb-4">
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`text-3xl font-bold ${color}`}>{count}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mapa */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-700">Mapa de operaciones</CardTitle>
            <p className="text-xs text-gray-400">🔴 Origen &nbsp;🟢 Destino &nbsp;🔵 Viaje activo</p>
          </CardHeader>
          <CardContent>
            <TripMap locations={locations} trips={trips} />
          </CardContent>
        </Card>

        {/* Tabla de viajes recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold text-gray-700">Viajes recientes</CardTitle>
            <Link href="/trips">
              <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-xs">+ Nuevo viaje</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500 text-xs uppercase">
                    <th className="text-left py-2 pr-4">ID</th>
                    <th className="text-left py-2 pr-4">Conductor</th>
                    <th className="text-left py-2 pr-4">Ruta</th>
                    <th className="text-left py-2 pr-4">Estado</th>
                    <th className="text-left py-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.slice(0, 8).map((trip) => (
                    <tr key={trip.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 pr-4 font-mono text-xs text-blue-600">
                        <Link href={`/trips/${trip.id}`}>{trip.tripId}</Link>
                      </td>
                      <td className="py-2 pr-4">{trip.driver?.name ?? '—'}</td>
                      <td className="py-2 pr-4 text-xs text-gray-600">
                        {trip.origin.city} → {trip.destination.city}
                      </td>
                      <td className="py-2 pr-4"><TripStatusBadge status={trip.status} /></td>
                      <td className="py-2 text-xs text-gray-500">
                        {new Date(trip.scheduledAt).toLocaleDateString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
