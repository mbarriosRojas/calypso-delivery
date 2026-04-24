'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { TripStatusBadge } from '@/components/TripStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

const NEXT_STATUS: Record<string, { value: string; label: string; color: string }[]> = {
  PROG:  [{ value: 'TRANS', label: '🚛 Iniciar viaje', color: 'bg-blue-700 hover:bg-blue-800' }],
  TRANS: [
    { value: 'ENTG', label: '✅ Marcar entregado', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { value: 'NOV',  label: '⚠️ Reportar novedad', color: 'bg-amber-500 hover:bg-amber-600' },
  ],
  NOV: [
    { value: 'TRANS', label: '↩ Retomar viaje', color: 'bg-blue-700 hover:bg-blue-800' },
    { value: 'CANC',  label: '✖ Cancelar viaje',  color: 'bg-red-600 hover:bg-red-700' },
  ],
}

interface Location { name: string; city: string; address: string; lat: number | null; lng: number | null }

interface Trip {
  id: string; tripId: string; status: string; scheduledAt: string
  observations: string | null; merchandiseType: string | null
  statusHistory: Array<{ status: string; timestamp: string; observations: string }>
  driver: { driverId: string; name: string }
  vehicle: { plate: string; type: string }
  origin: Location
  destination: Location
}

function mapsUrl(origin: Location, destination: Location): string {
  const o = origin.lat && origin.lng
    ? `${origin.lat},${origin.lng}`
    : encodeURIComponent(`${origin.address}, ${origin.city}`)
  const d = destination.lat && destination.lng
    ? `${destination.lat},${destination.lng}`
    : encodeURIComponent(`${destination.address}, ${destination.city}`)
  return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=driving`
}

export default function TripDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [pageError, setPageError] = useState('')
  const [observations, setObservations] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    const session = getSession()
    if (!session) { router.push('/login'); return }
    api.get<{ data: Trip }>(`/api/trips/${id}`)
      .then((res) => setTrip(res.data))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error al cargar el viaje'
        if (msg.includes('Token') || msg.includes('expirado')) {
          router.push('/login')
        } else {
          setPageError(msg)
        }
      })
  }, [id, router])

  async function changeStatus(newStatus: string) {
    if (!trip) return
    if (newStatus === 'NOV' && !observations.trim()) {
      setActionError('Las observaciones son obligatorias al reportar una novedad')
      return
    }
    setLoading(true); setActionError('')
    try {
      const res = await api.patch<{ data: Trip }>(`/api/trips/${trip.id}/status`, { status: newStatus, observations })
      setTrip(res.data)
      setObservations('')
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al actualizar estado')
    } finally {
      setLoading(false)
    }
  }

  if (pageError) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <p className="text-slate-500 text-sm">{pageError}</p>
        <button onClick={() => router.push('/my-trips')} className="text-sm text-blue-600 underline">← Volver a mis viajes</button>
      </div>
    </div>
  )

  if (!trip) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-400">
        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm">Cargando viaje...</span>
      </div>
    </div>
  )

  const nextStatuses = NEXT_STATUS[trip.status] ?? []
  const needsChecklist = trip.status === 'PROG'
  const isFinished = trip.status === 'ENTG' || trip.status === 'CANC'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => router.push('/my-trips')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Mis viajes
          </button>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-500">{trip.tripId}</span>
            <TripStatusBadge status={trip.status} />
          </div>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4 pb-10">

        {/* Ruta card con botón de navegación */}
        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Ruta del viaje</span>
              <a
                href={mapsUrl(trip.origin, trip.destination)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Abrir en Maps
              </a>
            </div>
          </div>
          <CardContent className="pt-4 pb-4 space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <div className="w-px flex-1 bg-slate-200 my-1" />
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-semibold text-slate-800">{trip.origin.name}</p>
                  <p className="text-xs text-slate-400">{trip.origin.address}, {trip.origin.city}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{trip.destination.name}</p>
                  <p className="text-xs text-slate-400">{trip.destination.address}, {trip.destination.city}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info del viaje */}
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="pt-4 pb-4 grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Vehículo</p><p className="font-semibold text-slate-800 mt-0.5">{trip.vehicle?.plate}</p><p className="text-xs text-slate-400">{trip.vehicle?.type}</p></div>
            <div><p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Salida</p><p className="font-semibold text-slate-800 mt-0.5">{new Date(trip.scheduledAt).toLocaleDateString('es-CO')}</p><p className="text-xs text-slate-400">{new Date(trip.scheduledAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p></div>
            {trip.merchandiseType && (
              <div className="col-span-2"><p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Mercancía</p><p className="font-semibold text-slate-800 mt-0.5">{trip.merchandiseType}</p></div>
            )}
          </CardContent>
        </Card>

        {/* Checklist — solo en PROG */}
        {needsChecklist && (
          <Link href={`/my-trips/${id}/checklist`}>
            <Card className="border-amber-200 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors shadow-sm">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Completar checklist del vehículo</p>
                  <p className="text-xs text-amber-600 mt-0.5">Requerido antes de iniciar el viaje</p>
                </div>
                <svg className="w-4 h-4 text-amber-500 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Acciones */}
        {nextStatuses.length > 0 && !isFinished && (
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-700">Actualizar estado</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder={trip.status === 'TRANS' ? 'Observaciones (obligatorio para Novedad)...' : 'Observaciones opcionales...'}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3}
                className="text-sm border-slate-200 resize-none"
              />
              {actionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{actionError}</div>
              )}
              <div className="flex flex-col gap-2">
                {nextStatuses.map((ns) => (
                  <Button
                    key={ns.value}
                    onClick={() => changeStatus(ns.value)}
                    disabled={loading}
                    className={`w-full text-sm font-semibold text-white ${ns.color}`}
                  >
                    {loading ? 'Actualizando...' : ns.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isFinished && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-medium text-center ${trip.status === 'ENTG' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            {trip.status === 'ENTG' ? '✅ Viaje entregado exitosamente' : '✖ Viaje cancelado'}
          </div>
        )}

        {/* Historial */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-700">Historial</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {(trip.statusHistory ?? []).map((h, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                    {i < trip.statusHistory.length - 1 && <div className="w-px flex-1 bg-slate-100 my-1" />}
                  </div>
                  <div className="pb-3">
                    <TripStatusBadge status={h.status} />
                    <p className="text-xs text-slate-400 mt-1">{new Date(h.timestamp).toLocaleString('es-CO')}</p>
                    {h.observations && <p className="text-xs text-slate-600 mt-1 bg-slate-50 rounded px-2 py-1">{h.observations}</p>}
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
