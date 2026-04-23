'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getSession, logout } from '@/lib/auth'
import { TripStatusBadge } from '@/components/TripStatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Trip {
  id: string; tripId: string; status: string; scheduledAt: string
  origin: { name: string; city: string }
  destination: { name: string; city: string }
}

export default function MyTripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const session = typeof window !== 'undefined' ? getSession() : null

  useEffect(() => {
    if (!session) { router.push('/login'); return }
    if (session.user.role !== 'DRIVER') { router.push('/dashboard'); return }

    const today = new Date().toISOString().slice(0, 10)
    api.get<{ data: Trip[] }>(`/api/trips?date=${today}`)
      .then((res) => setTrips(res.data))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Cargando viajes...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-blue-700">🚚 Calypso</h1>
          <p className="text-xs text-gray-500">{session?.user.email}</p>
        </div>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-red-600">Salir</button>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Mis viajes de hoy</h2>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

        {trips.length === 0 ? (
          <Card><CardContent className="pt-8 pb-8 text-center text-gray-400">No tienes viajes programados para hoy</CardContent></Card>
        ) : (
          trips.map((trip) => (
            <Link key={trip.id} href={`/my-trips/${trip.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-xs text-blue-600">{trip.tripId}</span>
                    <TripStatusBadge status={trip.status} />
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">📍</span>
                      <span className="text-gray-700">{trip.origin.name} — {trip.origin.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">📍</span>
                      <span className="text-gray-700">{trip.destination.name} — {trip.destination.city}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Salida: {new Date(trip.scheduledAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </main>
    </div>
  )
}
