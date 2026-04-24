'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { getSession, logout } from '@/lib/auth'
import { TripStatusBadge } from '@/components/TripStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

interface Trip {
  id: string; tripId: string; status: string; scheduledAt: string
  erpDocType: string; erpDocNumber: string; observations: string | null
  statusHistory: Array<{ status: string; timestamp: string; observations: string }>
  driver: { driverId: string; name: string }
  vehicle: { plate: string; type: string; brand: string }
  origin: { name: string; city: string; address: string }
  destination: { name: string; city: string; address: string }
}

const COORDINATOR_NEXT: Record<string, { value: string; label: string }[]> = {
  PROG: [{ value: 'CANC', label: 'Cancelar viaje' }],
  NOV:  [{ value: 'CANC', label: 'Cancelar viaje' }],
}

export default function TripDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [observations, setObservations] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const session = getSession()
    if (!session || session.user.role !== 'COORDINATOR') { router.push('/login'); return }
    api.get<{ data: Trip }>(`/api/trips/${id}`).then((r) => setTrip(r.data))
  }, [id, router])

  async function changeStatus(newStatus: string) {
    if (!trip) return
    setLoading(true); setError('')
    try {
      const res = await api.patch<{ data: Trip }>(`/api/trips/${trip.id}/status`, { status: newStatus, observations })
      setTrip(res.data)
      setObservations('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado')
    } finally {
      setLoading(false)
    }
  }

  if (!trip) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  const nextStatuses = COORDINATOR_NEXT[trip.status] ?? []

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

      <main className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/trips" className="text-blue-600 text-sm hover:underline">← Viajes</Link>
          <span className="text-gray-300">|</span>
          <span className="font-mono text-sm font-semibold">{trip.tripId}</span>
          <TripStatusBadge status={trip.status} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Información del viaje</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><p className="text-xs text-gray-400">Conductor</p><p className="font-medium">{trip.driver?.name ?? '—'}</p><p className="text-xs text-gray-400 font-mono">{trip.driver?.driverId}</p></div>
              <div><p className="text-xs text-gray-400">Vehículo</p><p className="font-medium">{trip.vehicle?.plate} — {trip.vehicle?.brand} {trip.vehicle?.type}</p></div>
              <div><p className="text-xs text-gray-400">Documento ERP</p><p className="font-medium">{trip.erpDocType} {trip.erpDocNumber}</p></div>
              <div><p className="text-xs text-gray-400">Salida programada</p><p className="font-medium">{new Date(trip.scheduledAt).toLocaleString('es-CO')}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Ruta</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Origen</p>
                <p className="font-medium">{trip.origin.name}</p>
                <p className="text-xs text-gray-500">{trip.origin.address}, {trip.origin.city}</p>
              </div>
              <div className="text-center text-gray-300 text-lg">↓</div>
              <div>
                <p className="text-xs text-gray-400">Destino</p>
                <p className="font-medium">{trip.destination.name}</p>
                <p className="text-xs text-gray-500">{trip.destination.address}, {trip.destination.city}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {nextStatuses.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Acciones</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Observaciones..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={2}
                className="text-sm"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2">
                {nextStatuses.map((ns) => (
                  <Button
                    key={ns.value}
                    onClick={() => changeStatus(ns.value)}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-sm"
                  >
                    {ns.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Historial de estados</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(trip.statusHistory ?? []).map((h, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                    {i < trip.statusHistory.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
                  </div>
                  <div className="pb-2">
                    <TripStatusBadge status={h.status} />
                    <p className="text-xs text-gray-400 mt-1">{new Date(h.timestamp).toLocaleString('es-CO')}</p>
                    {h.observations && <p className="text-xs text-gray-600 mt-1">{h.observations}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
