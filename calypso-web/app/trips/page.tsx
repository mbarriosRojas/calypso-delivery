'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getSession, logout } from '@/lib/auth'
import { TripStatusBadge } from '@/components/TripStatusBadge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Layout } from '@/components/Layout'
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
  { value: 'ALL',  label: 'Todos los estados' },
  { value: 'PROG', label: 'Programados'        },
  { value: 'TRANS',label: 'En tránsito'        },
  { value: 'NOV',  label: 'Novedad'            },
  { value: 'ENTG', label: 'Entregados'         },
  { value: 'CANC', label: 'Cancelados'         },
]

// Pill filter button
function FilterPill({
  label,
  active,
  onClick,
  color,
}: {
  label: string
  active: boolean
  onClick: () => void
  color: string
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
        active
          ? `${color} shadow-sm`
          : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  // Kept for compatibility
  void logout

  useEffect(() => {
    const session = getSession()
    if (!session || session.user.role !== 'COORDINATOR') { router.push('/login'); return }
    setLoading(true)
    const url = filter === 'ALL' ? '/api/trips' : `/api/trips?status=${filter}`
    api.get<{ data: Trip[] }>(url).then((r) => setTrips(r.data)).finally(() => setLoading(false))
  }, [filter, router])

  const pillColors: Record<string, string> = {
    ALL:  'bg-slate-800 text-white',
    PROG: 'bg-blue-100 text-blue-700 border border-blue-200',
    TRANS:'bg-amber-100 text-amber-700 border border-amber-200',
    NOV:  'bg-red-100 text-red-700 border border-red-200',
    ENTG: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    CANC: 'bg-slate-100 text-slate-600 border border-slate-200',
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Viajes</h2>
            <p className="text-sm text-slate-500 mt-0.5">{trips.length} {trips.length === 1 ? 'registro' : 'registros'} encontrados</p>
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

        {/* Filter row — pills on desktop, Select on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Desktop pills */}
          <div className="hidden sm:flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <FilterPill
                key={s.value}
                label={s.label}
                active={filter === s.value}
                onClick={() => setFilter(s.value)}
                color={pillColors[s.value]}
              />
            ))}
          </div>

          {/* Mobile select */}
          <div className="sm:hidden">
            <Select value={filter} onValueChange={(v) => { if (v) setFilter(v) }}>
              <SelectTrigger className="w-52 h-9 text-sm border-slate-300 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-sm">Cargando viajes...</span>
            </div>
          ) : trips.length === 0 ? (
            <div className="py-16 text-center">
              <svg className="mx-auto w-10 h-10 text-slate-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-slate-400">No hay viajes con ese estado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['ID Viaje', 'Conductor', 'Ruta', 'Doc ERP', 'Estado', 'Fecha salida', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {trips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold text-[var(--calypso-orange)]">
                          {trip.tripId}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-700 font-medium">{trip.driver?.name ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-600 font-medium">{trip.origin.city}</span>
                          <svg className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                          <span className="text-slate-600 font-medium">{trip.destination.city}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-400 font-mono">{trip.erpDocNumber || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <TripStatusBadge status={trip.status} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(trip.scheduledAt).toLocaleString('es-CO', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link href={`/trips/${trip.id}`}>
                          <span className="text-xs font-medium text-slate-400 group-hover:text-[var(--calypso-orange)] transition-colors cursor-pointer">
                            Ver →
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}
