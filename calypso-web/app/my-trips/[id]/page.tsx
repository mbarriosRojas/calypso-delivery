'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { TripStatusBadge } from '@/components/TripStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

const NEXT_STATUS: Record<string, { value: string; label: string }[]> = {
  PROG:  [{ value: 'TRANS', label: 'Iniciar viaje' }],
  TRANS: [{ value: 'ENTG', label: 'Marcar entregado' }, { value: 'NOV', label: 'Reportar novedad' }],
  NOV:   [{ value: 'TRANS', label: 'Retomar viaje' }, { value: 'CANC', label: 'Cancelar viaje' }],
}

interface Trip {
  id: string; tripId: string; status: string; scheduledAt: string; observations: string | null
  statusHistory: Array<{ status: string; timestamp: string; observations: string }>
  driver: { driverId: string; name: string }
  vehicle: { plate: string; type: string }
  origin: { name: string; city: string; address: string }
  destination: { name: string; city: string; address: string }
}

export default function TripDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [observations, setObservations] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<{ data: Trip }>(`/api/trips/${id}`).then((res) => setTrip(res.data))
  }, [id])

  async function changeStatus(newStatus: string) {
    if (!trip) return
    if (newStatus === 'NOV' && !observations.trim()) {
      setError('Las observaciones son obligatorias al reportar una novedad')
      return
    }
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

  if (!trip) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Cargando...</p></div>

  const nextStatuses = NEXT_STATUS[trip.status] ?? []
  const needsChecklist = trip.status === 'PROG'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-4">
        <button onClick={() => router.back()} className="text-blue-600 text-sm">← Mis viajes</button>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-lg font-bold font-mono">{trip.tripId}</h1>
          <TripStatusBadge status={trip.status} />
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4 pb-8">
        <Card>
          <CardContent className="pt-4 space-y-3 text-sm">
            <div><p className="text-xs text-gray-400">Conductor</p><p className="font-medium">{trip.driver?.name}</p></div>
            <div><p className="text-xs text-gray-400">Vehículo</p><p className="font-medium">{trip.vehicle?.plate} — {trip.vehicle?.type}</p></div>
            <div>
              <p className="text-xs text-gray-400">Origen</p>
              <p className="font-medium">{trip.origin.name}</p>
              <p className="text-gray-500 text-xs">{trip.origin.address}, {trip.origin.city}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Destino</p>
              <p className="font-medium">{trip.destination.name}</p>
              <p className="text-gray-500 text-xs">{trip.destination.address}, {trip.destination.city}</p>
            </div>
            <div><p className="text-xs text-gray-400">Salida programada</p><p className="font-medium">{new Date(trip.scheduledAt).toLocaleString('es-CO')}</p></div>
          </CardContent>
        </Card>

        {needsChecklist && (
          <Link href={`/my-trips/${id}/checklist`}>
            <Card className="bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-blue-700 font-semibold">✅ Completar checklist del vehículo</p>
                <p className="text-blue-500 text-xs mt-1">Requerido antes de iniciar el viaje</p>
              </CardContent>
            </Card>
          </Link>
        )}

        {nextStatuses.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Actualizar estado</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Observaciones (requerido para Novedad)..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={2}
                className="text-sm"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2 flex-wrap">
                {nextStatuses.map((ns) => (
                  <Button
                    key={ns.value}
                    onClick={() => changeStatus(ns.value)}
                    disabled={loading}
                    className={`flex-1 text-sm ${ns.value === 'CANC' ? 'bg-red-600 hover:bg-red-700' : ns.value === 'NOV' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-blue-700 hover:bg-blue-800'}`}
                  >
                    {ns.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Historial</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(trip.statusHistory ?? []).map((h, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
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
