'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getSession, logout } from '@/lib/auth'
import { TripStatusBadge } from '@/components/TripStatusBadge'
import { TripMap } from '@/components/TripMap'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Layout } from '@/components/Layout'
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

// ── Metric card ────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  count: number
  colorClass: string
  borderClass: string
  icon: React.ReactNode
}

function MetricCard({ label, count, colorClass, borderClass, icon }: MetricCardProps) {
  return (
    <div className={`bg-white rounded-xl border-l-4 ${borderClass} shadow-sm p-5 flex items-center gap-4`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass} bg-opacity-10`}
           style={{ backgroundColor: 'currentColor' }}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0`}
             style={{ backgroundColor: 'inherit' }}>
        </div>
      </div>
      <div className="flex items-center gap-4 w-full">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 opacity-90`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className={`metric-number ${colorClass}`}>{count}</p>
        </div>
      </div>
    </div>
  )
}

// ── Simpler metric card ────────────────────────────────────────────────────

interface SimpleMetricProps {
  label: string
  count: number
  accentBg: string
  accentText: string
  iconPath: string
}

function SimpleMetric({ label, count, accentBg, accentText, iconPath }: SimpleMetricProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide leading-none">{label}</p>
          <p className={`mt-2 text-4xl font-bold tracking-tight leading-none ${accentText}`}>{count}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accentBg}`}>
          <svg className={`w-5 h-5 ${accentText}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d={iconPath} />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

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

  // Kept for compatibility — not used in JSX but preserves the import
  void logout

  const counts = {
    PROG:  trips.filter(t => t.status === 'PROG').length,
    TRANS: trips.filter(t => t.status === 'TRANS').length,
    NOV:   trips.filter(t => t.status === 'NOV').length,
    ENTG:  trips.filter(t => t.status === 'ENTG').length,
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-slate-400">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm">Cargando operaciones...</span>
          </div>
        </div>
      </Layout>
    )
  }

  const metrics = [
    {
      label: 'Programados',
      count: counts.PROG,
      accentBg: 'bg-slate-100',
      accentText: 'text-slate-700',
      iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      label: 'En tránsito',
      count: counts.TRANS,
      accentBg: 'bg-amber-50',
      accentText: 'text-amber-600',
      iconPath: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v7a1 1 0 001 1h4m6 0h2m0 0a2 2 0 104 0m-4 0a2 2 0 114 0M9 16a2 2 0 100 4 2 2 0 000-4z',
    },
    {
      label: 'Novedades',
      count: counts.NOV,
      accentBg: 'bg-red-50',
      accentText: 'text-red-600',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    },
    {
      label: 'Entregados',
      count: counts.ENTG,
      accentBg: 'bg-emerald-50',
      accentText: 'text-emerald-600',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ]

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-7">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Panel de operación</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Link href="/trips/new">
            <Button
              className="text-sm font-semibold h-9 px-4 shadow-sm"
              style={{ backgroundColor: 'var(--calypso-orange)', color: 'white' }}
            >
              + Nuevo viaje
            </Button>
          </Link>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <SimpleMetric key={m.label} {...m} />
          ))}
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Mapa de operaciones</h3>
              <p className="text-xs text-slate-400 mt-0.5">Visualización en tiempo real de rutas activas</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>Origen
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>Destino
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>Activo
              </span>
            </div>
          </div>
          <div className="p-4">
            <TripMap locations={locations} trips={trips} />
          </div>
        </div>

        {/* Recent trips table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Viajes recientes</h3>
            <Link href="/trips">
              <span className="text-xs font-medium text-[var(--calypso-orange)] hover:underline cursor-pointer">
                Ver todos →
              </span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['ID Viaje', 'Conductor', 'Ruta', 'Estado', 'Fecha'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {trips.slice(0, 8).map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/trips/${trip.id}`}>
                        <span className="font-mono text-xs font-medium text-[var(--calypso-orange)] hover:underline cursor-pointer">
                          {trip.tripId}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-700 font-medium">{trip.driver?.name ?? '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-500">{trip.origin.city}</span>
                      <span className="text-xs text-slate-400 mx-1.5">→</span>
                      <span className="text-xs text-slate-500">{trip.destination.city}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <TripStatusBadge status={trip.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(trip.scheduledAt).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trips.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm">No hay viajes registrados</div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  )
}
