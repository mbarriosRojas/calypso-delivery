'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { getSession, logout } from '@/lib/auth'
import { TripStatusBadge } from '@/components/TripStatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface Driver {
  id: string; driverId: string; name: string; cedula: string
  licenseCategory: string; licenseExpiry: string; status: string
  phone?: string; email?: string
  vehicle: { id: string; plate: string; type: string; brand: string } | null
  trips: Array<{
    id: string; tripId: string; status: string; scheduledAt: string
    origin: { name: string }; destination: { name: string }
  }>
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Activo', INACTIVE: 'Inactivo', SUSPENDED: 'Suspendido' }

const NEXT_STATUS: Record<string, { value: string; label: string; color: string }[]> = {
  ACTIVE:    [{ value: 'INACTIVE', label: 'Desactivar', color: 'bg-gray-500 hover:bg-gray-600' }, { value: 'SUSPENDED', label: 'Suspender', color: 'bg-red-600 hover:bg-red-700' }],
  INACTIVE:  [{ value: 'ACTIVE', label: 'Activar', color: 'bg-green-600 hover:bg-green-700' }, { value: 'SUSPENDED', label: 'Suspender', color: 'bg-red-600 hover:bg-red-700' }],
  SUSPENDED: [{ value: 'ACTIVE', label: 'Activar', color: 'bg-green-600 hover:bg-green-700' }],
}

export default function DriverProfilePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [driver, setDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (!session || session.user.role !== 'COORDINATOR') { router.push('/login'); return }
    api.get<{ data: Driver }>(`/api/drivers/${id}`).then((r) => setDriver(r.data))
  }, [id, router])

  async function changeStatus(newStatus: string) {
    if (!driver) return
    setLoading(true)
    try {
      const res = await api.patch<{ data: Driver }>(`/api/drivers/${driver.id}`, { status: newStatus })
      setDriver((prev) => prev ? { ...prev, status: res.data.status } : prev)
    } finally {
      setLoading(false)
    }
  }

  if (!driver) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  const licenseExpiry = new Date(driver.licenseExpiry)
  const daysToExpiry = Math.floor((licenseExpiry.getTime() - Date.now()) / 86400000)
  const nextStatuses = NEXT_STATUS[driver.status] ?? []
  const totalTrips = driver.trips.length
  const completedTrips = driver.trips.filter((t) => t.status === 'ENTG').length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">🚚 Calypso Delivery</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/dashboard" className="text-gray-600 hover:text-blue-700">Dashboard</Link>
          <Link href="/trips" className="text-gray-600 hover:text-blue-700">Viajes</Link>
          <Link href="/drivers" className="font-medium text-blue-700">Conductores</Link>
          <Link href="/vehicles" className="text-gray-600 hover:text-blue-700">Vehículos</Link>
          <button onClick={logout} className="text-gray-400 hover:text-red-600">Salir</button>
        </nav>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/drivers" className="text-blue-600 text-sm hover:underline">← Conductores</Link>
          <span className="text-gray-300">|</span>
          <span className="font-mono text-sm font-semibold">{driver.driverId}</span>
          <Badge className={`${STATUS_COLORS[driver.status]} border-0`}>{STATUS_LABELS[driver.status]}</Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Perfil del conductor</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-2xl font-bold">{driver.name}</p>
                <p className="text-gray-400 font-mono text-xs">{driver.driverId}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-gray-400">Cédula</p><p className="font-medium">{driver.cedula}</p></div>
                <div><p className="text-gray-400">Categoría licencia</p><p className="font-medium">{driver.licenseCategory}</p></div>
                <div className="col-span-2">
                  <p className="text-gray-400">Vencimiento licencia</p>
                  <p className={`font-medium ${daysToExpiry < 30 ? 'text-orange-600' : daysToExpiry < 0 ? 'text-red-600' : ''}`}>
                    {licenseExpiry.toLocaleDateString('es-CO')}
                    {daysToExpiry < 30 && daysToExpiry >= 0 && <span className="ml-2 text-orange-500">⚠ {daysToExpiry} días</span>}
                    {daysToExpiry < 0 && <span className="ml-2 text-red-600">⚠ VENCIDA</span>}
                  </p>
                </div>
                {driver.phone && <div><p className="text-gray-400">Teléfono</p><p className="font-medium">{driver.phone}</p></div>}
                {driver.email && <div><p className="text-gray-400">Email</p><p className="font-medium">{driver.email}</p></div>}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Vehículo asignado</CardTitle></CardHeader>
              <CardContent className="text-sm">
                {driver.vehicle ? (
                  <div>
                    <p className="font-semibold">{driver.vehicle.plate}</p>
                    <p className="text-gray-500 text-xs">{driver.vehicle.brand} — {driver.vehicle.type}</p>
                  </div>
                ) : (
                  <p className="text-gray-400 text-xs">Sin vehículo asignado</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Estadísticas</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-700">{totalTrips}</p>
                  <p className="text-xs text-gray-400">Viajes totales</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{completedTrips}</p>
                  <p className="text-xs text-gray-400">Entregados</p>
                </div>
              </CardContent>
            </Card>

            {nextStatuses.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Cambiar estado</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {nextStatuses.map((ns) => (
                    <Button
                      key={ns.value}
                      onClick={() => changeStatus(ns.value)}
                      disabled={loading}
                      className={`${ns.color} text-white text-sm`}
                    >
                      {ns.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Historial de viajes recientes</CardTitle></CardHeader>
          <CardContent className="p-0">
            {driver.trips.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">Sin viajes registrados</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500 text-xs uppercase bg-gray-50">
                    {['ID', 'Ruta', 'Fecha', 'Estado'].map((h) => (
                      <th key={h} className="text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {driver.trips.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-blue-600">
                        <Link href={`/trips/${t.id}`} className="hover:underline">{t.tripId}</Link>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">{t.origin.name} → {t.destination.name}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">{new Date(t.scheduledAt).toLocaleDateString('es-CO')}</td>
                      <td className="px-4 py-2"><TripStatusBadge status={t.status} /></td>
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
