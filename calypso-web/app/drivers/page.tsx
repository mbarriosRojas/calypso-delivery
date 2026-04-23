'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getSession, logout } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Driver {
  id: string; driverId: string; name: string; cedula: string
  licenseCategory: string; licenseExpiry: string; status: string
  vehicle: { plate: string; type: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Activo', INACTIVE: 'Inactivo', SUSPENDED: 'Suspendido' }

export default function DriversPage() {
  const router = useRouter()
  const [drivers, setDrivers] = useState<Driver[]>([])

  useEffect(() => {
    const session = getSession()
    if (!session || session.user.role !== 'COORDINATOR') { router.push('/login'); return }
    api.get<{ data: Driver[] }>('/api/drivers').then((r) => setDrivers(r.data))
  }, [router])

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
      <main className="p-6 max-w-5xl mx-auto space-y-4">
        <h2 className="text-2xl font-semibold">Conductores</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {drivers.map((d) => {
            const licenseExpiry = new Date(d.licenseExpiry)
            const daysToExpiry = Math.floor((licenseExpiry.getTime() - Date.now()) / 86400000)
            return (
              <Card key={d.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{d.driverId}</p>
                    </div>
                    <Badge className={`${STATUS_COLORS[d.status]} border-0`}>{STATUS_LABELS[d.status]}</Badge>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Cédula: {d.cedula}</p>
                    <p>Licencia: {d.licenseCategory} — vence {licenseExpiry.toLocaleDateString('es-CO')}
                      {daysToExpiry < 30 && <span className="text-orange-500 ml-1">⚠ {daysToExpiry}d</span>}
                    </p>
                    <p>Vehículo: {d.vehicle ? `${d.vehicle.plate} (${d.vehicle.type})` : 'Sin asignar'}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
