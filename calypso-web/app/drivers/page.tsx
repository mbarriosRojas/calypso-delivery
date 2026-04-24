'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getSession, logout } from '@/lib/auth'
import { Layout } from '@/components/Layout'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Driver {
  id: string; driverId: string; name: string; cedula: string
  licenseCategory: string; licenseExpiry: string; status: string
  vehicle: { plate: string; type: string } | null
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  ACTIVE:    { label: 'Activo',     dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  INACTIVE:  { label: 'Inactivo',   dot: 'bg-slate-400',   text: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200'   },
  SUSPENDED: { label: 'Suspendido', dot: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50 border-red-200'       },
}

function DriverCard({ d }: { d: Driver }) {
  const licenseExpiry = new Date(d.licenseExpiry)
  const daysToExpiry = Math.floor((licenseExpiry.getTime() - Date.now()) / 86400000)
  const status = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.INACTIVE
  const expiryWarning = daysToExpiry >= 0 && daysToExpiry < 30

  // Build initials from name
  const nameParts = d.name.trim().split(' ')
  const avatarInitials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : d.name.slice(0, 2).toUpperCase()

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Card top strip */}
      <div className="h-1.5 bg-gradient-to-r from-[var(--calypso-navy)] to-[var(--calypso-navy-light)]" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-[var(--calypso-navy)] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{avatarInitials}</span>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm leading-tight">{d.name}</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{d.driverId}</p>
            </div>
          </div>

          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-slate-100" />

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[10px]">Cédula</p>
            <p className="text-slate-700 font-mono mt-0.5">{d.cedula}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[10px]">Licencia</p>
            <p className="text-slate-700 font-semibold mt-0.5">{d.licenseCategory}</p>
          </div>
          <div className="col-span-2">
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[10px]">Vencimiento licencia</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-slate-700">{licenseExpiry.toLocaleDateString('es-CO')}</p>
              {expiryWarning && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[10px] font-semibold">
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {daysToExpiry}d restantes
                </span>
              )}
              {daysToExpiry < 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-[10px] font-semibold">
                  Vencida
                </span>
              )}
            </div>
          </div>
          <div className="col-span-2">
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[10px]">Vehículo asignado</p>
            {d.vehicle ? (
              <div className="flex items-center gap-2 mt-0.5">
                <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="10" rx="2" />
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
                <p className="text-slate-700 font-mono font-medium">{d.vehicle.plate}</p>
                <span className="text-slate-400">·</span>
                <p className="text-slate-500">{d.vehicle.type}</p>
              </div>
            ) : (
              <p className="text-slate-400 italic mt-0.5">Sin asignar</p>
            )}
          </div>
        </div>

        {/* Footer link */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
          <Link href={`/drivers/${d.id}`}>
            <span className="text-xs font-semibold text-[var(--calypso-orange)] hover:underline cursor-pointer">
              Ver perfil completo →
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function DriversPage() {
  const router = useRouter()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)

  // Kept for compatibility
  void logout

  useEffect(() => {
    const session = getSession()
    if (!session || session.user.role !== 'COORDINATOR') { router.push('/login'); return }
    api.get<{ data: Driver[] }>('/api/drivers').then((r) => setDrivers(r.data)).finally(() => setLoading(false))
  }, [router])

  const activeCount   = drivers.filter((d) => d.status === 'ACTIVE').length
  const expiringSoon  = drivers.filter((d) => {
    const days = Math.floor((new Date(d.licenseExpiry).getTime() - Date.now()) / 86400000)
    return days >= 0 && days < 30
  }).length

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Conductores</h2>
            <p className="text-sm text-slate-500 mt-0.5">{drivers.length} conductores en total</p>
          </div>
          {/* Summary pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {activeCount} activos
            </span>
            {expiringSoon > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium">
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {expiringSoon} licencias por vencer
              </span>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm">Cargando conductores...</span>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {drivers.map((d) => (
              <DriverCard key={d.id} d={d} />
            ))}
            {drivers.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 text-sm">
                No hay conductores registrados
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  )
}
