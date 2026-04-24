'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getSession, logout } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface Driver { id: string; driverId: string; name: string; status: string }
interface Vehicle { id: string; plate: string; type: string; brand: string; status: string }
interface Location { id: string; locationId: string; name: string; city: string }

const ERP_TYPES = ['FV', 'OC', 'NC', 'RC', 'ND']

export default function NewTripPage() {
  const router = useRouter()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    driverId: '', vehicleId: '', originId: '', destinationId: '',
    erpDocType: 'FV', erpDocNumber: '', scheduledAt: '',
  })

  useEffect(() => {
    const session = getSession()
    if (!session || session.user.role !== 'COORDINATOR') { router.push('/login'); return }
    Promise.all([
      api.get<{ data: Driver[] }>('/api/drivers'),
      api.get<{ data: Vehicle[] }>('/api/vehicles'),
      api.get<{ data: Location[] }>('/api/locations'),
    ]).then(([d, v, l]) => {
      setDrivers(d.data.filter((x) => x.status === 'ACTIVE'))
      setVehicles(v.data.filter((x) => x.status === 'AVAILABLE'))
      setLocations(l.data)
    })
  }, [router])

  function set(field: string, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? '' }))
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.driverId || !form.vehicleId || !form.originId || !form.destinationId || !form.erpDocNumber || !form.scheduledAt) {
      setError('Todos los campos son obligatorios'); return
    }
    if (form.originId === form.destinationId) {
      setError('El origen y destino no pueden ser el mismo'); return
    }
    setLoading(true); setError('')
    try {
      await api.post('/api/trips', form)
      router.push('/trips')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear el viaje')
    } finally {
      setLoading(false)
    }
  }

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

      <main className="p-6 max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/trips" className="text-blue-600 text-sm hover:underline">← Viajes</Link>
          <span className="text-gray-300">|</span>
          <h2 className="text-lg font-semibold">Nuevo viaje</h2>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Datos del viaje</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Conductor</Label>
                <Select value={form.driverId} onValueChange={(v) => set('driverId', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar conductor..." /></SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name} ({d.driverId})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Vehículo</Label>
                <Select value={form.vehicleId} onValueChange={(v) => set('vehicleId', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar vehículo..." /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.plate} — {v.brand} {v.type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Origen</Label>
                <Select value={form.originId} onValueChange={(v) => set('originId', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar origen..." /></SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name} — {l.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Destino</Label>
                <Select value={form.destinationId} onValueChange={(v) => set('destinationId', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar destino..." /></SelectTrigger>
                  <SelectContent>
                    {locations.filter((l) => l.id !== form.originId).map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name} — {l.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tipo doc. ERP</Label>
                  <Select value={form.erpDocType} onValueChange={(v) => set('erpDocType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ERP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Número documento</Label>
                  <Input
                    placeholder="Ej: 001-2025"
                    value={form.erpDocNumber}
                    onChange={(e) => set('erpDocNumber', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Fecha y hora de salida</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => set('scheduledAt', e.target.value)}
                />
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading} className="flex-1 bg-blue-700 hover:bg-blue-800">
                  {loading ? 'Creando...' : 'Crear viaje'}
                </Button>
                <Link href="/trips">
                  <Button type="button" variant="outline">Cancelar</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
