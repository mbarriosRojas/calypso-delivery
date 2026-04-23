'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getSession, logout } from '@/lib/auth'
import { TripStatusBadge } from '@/components/TripStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Trip {
  id: string; tripId: string; status: string; scheduledAt: string; erpDocNumber: string
  driver: { driverId: string; name: string }
  vehicle: { plate: string; type: string }
  origin: { name: string; city: string }
  destination: { name: string; city: string }
}

const STATUSES = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PROG', label: 'Programados' },
  { value: 'TRANS', label: 'En tránsito' },
  { value: 'NOV', label: 'Novedad' },
  { value: 'ENTG', label: 'Entregados' },
  { value: 'CANC', label: 'Cancelados' },
]

export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    if (!session || session.user.role !== 'COORDINATOR') { router.push('/login'); return }
    const url = filter === 'ALL' ? '/api/trips' : `/api/trips?status=${filter}`
    api.get<{ data: Trip[] }>(url).then((r) => setTrips(r.data)).finally(() => setLoading(false))
  }, [filter, router])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">🚚 Calypso Delivery</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/dashboard" className="text-gray-600 hover:text-blue-700">Dashboard</Link>
          <Link href="/trips" className="font-medium text-blue-700">Viajes</Link>
          <Link href="/drivers" className="text-gray-600 hover:text-blue-700">Conductores</Link>
          <Link href="/vehicles" className="text-gray-600 hover:text-blue-700">Vehículos</Link>
          <button onClick={logout} className="text-gray-400 hover:text-red-600">Salir</button>
        </nav>
      </header>
      <main className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Viajes</h2>
          <Link href="/trips/new">
            <Button className="bg-blue-700 hover:bg-blue-800">+ Nuevo viaje</Button>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={(v) => { if (v) setFilter(v) }}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-400">{trips.length} viajes</span>
        </div>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <p className="text-center text-gray-400 py-8">Cargando...</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500 text-xs uppercase bg-gray-50">
                    {['ID Viaje', 'Conductor', 'Ruta', 'Doc ERP', 'Estado', 'Fecha salida', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => (
                    <tr key={trip.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">{trip.tripId}</td>
                      <td className="px-4 py-3">{trip.driver?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{trip.origin.city} → {trip.destination.city}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{trip.erpDocNumber}</td>
                      <td className="px-4 py-3"><TripStatusBadge status={trip.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(trip.scheduledAt).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-3">
                        <Link href={`/trips/${trip.id}`} className="text-xs text-blue-600 hover:underline">Ver</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
