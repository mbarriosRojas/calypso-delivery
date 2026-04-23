'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getSession, logout } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Vehicle {
  id: string; plate: string; type: string; brand: string; model: string
  year: number; capacityKg: number; soatExpiry: string; status: string
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  ON_ROUTE: 'bg-blue-100 text-blue-700',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700',
  RETIRED: 'bg-gray-100 text-gray-500',
}
const STATUS_LABELS: Record<string, string> = { AVAILABLE: 'Disponible', ON_ROUTE: 'En ruta', MAINTENANCE: 'Mantenimiento', RETIRED: 'Dado de baja' }
const TYPE_LABELS: Record<string, string> = { MOTO: '🏍 Moto', VAN: '🚐 Van', TRUCK_2: '🚛 Camión 2 ejes', TRUCK_3: '🚚 Camión 3 ejes' }

export default function VehiclesPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  useEffect(() => {
    const session = getSession()
    if (!session || session.user.role !== 'COORDINATOR') { router.push('/login'); return }
    api.get<{ data: Vehicle[] }>('/api/vehicles').then((r) => setVehicles(r.data))
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">🚚 Calypso Delivery</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/dashboard" className="text-gray-600 hover:text-blue-700">Dashboard</Link>
          <Link href="/trips" className="text-gray-600 hover:text-blue-700">Viajes</Link>
          <Link href="/drivers" className="text-gray-600 hover:text-blue-700">Conductores</Link>
          <Link href="/vehicles" className="font-medium text-blue-700">Vehículos</Link>
          <button onClick={logout} className="text-gray-400 hover:text-red-600">Salir</button>
        </nav>
      </header>
      <main className="p-6 max-w-5xl mx-auto space-y-4">
        <h2 className="text-2xl font-semibold">Flota de vehículos</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const soatExpiry = new Date(v.soatExpiry)
            const daysToSoat = Math.floor((soatExpiry.getTime() - Date.now()) / 86400000)
            return (
              <Card key={v.id}>
                <CardContent className="pt-4 pb-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold font-mono">{v.plate}</p>
                      <p className="text-xs text-gray-500">{TYPE_LABELS[v.type]}</p>
                    </div>
                    <Badge className={`${STATUS_COLORS[v.status]} border-0`}>{STATUS_LABELS[v.status]}</Badge>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>{v.brand} {v.model} {v.year}</p>
                    <p>Cap: {v.capacityKg.toLocaleString()} kg</p>
                    <p>SOAT: {soatExpiry.toLocaleDateString('es-CO')}
                      {daysToSoat < 30 && <span className="text-orange-500 ml-1">⚠ {daysToSoat}d</span>}
                    </p>
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
