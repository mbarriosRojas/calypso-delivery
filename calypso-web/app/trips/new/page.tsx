'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Layout } from '@/components/Layout'
import Link from 'next/link'

interface Driver { id: string; driverId: string; name: string; status: string }
interface Vehicle { id: string; plate: string; type: string; brand: string; status: string }
interface Location { id: string; locationId: string; name: string; city: string }

const ERP_TYPES = [
  { value: 'REQ', label: 'REQ — Requisición' },
  { value: 'TRB', label: 'TRB — Traslado' },
  { value: 'PED', label: 'PED — Pedido' },
  { value: 'FET', label: 'FET — Factura de entrega' },
  { value: 'OCN', label: 'OCN — Orden de compra' },
]

const MERCHANDISE_TYPES = [
  'Alimentos', 'Bebidas', 'Electrónicos', 'Ferretería',
  'Materiales de construcción', 'Medicamentos', 'Papelería',
  'Productos químicos', 'Ropa y textiles', 'Otro',
]

export default function NewTripPage() {
  const router = useRouter()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    driverId: '', vehicleId: '', originId: '', destinationId: '',
    erpDocType: 'REQ', erpDocNumber: '', scheduledAt: '', merchandiseType: '',
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
      setError('Todos los campos obligatorios deben completarse'); return
    }
    if (form.originId === form.destinationId) {
      setError('El origen y destino no pueden ser el mismo'); return
    }
    setLoading(true); setError('')
    try {
      await api.post('/api/trips', {
        ...form,
        merchandiseType: form.merchandiseType || null,
      })
      router.push('/trips')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear el viaje')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/trips" className="text-sm hover:underline" style={{ color: 'var(--calypso-orange)' }}>← Viajes</Link>
          <span className="text-slate-300">|</span>
          <h2 className="text-xl font-bold text-slate-900">Nuevo viaje</h2>
        </div>

        <Card className="shadow-sm border-slate-100">
          <CardHeader className="pb-2"><CardTitle className="text-base text-slate-700">Datos del viaje</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Conductor */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Conductor *</Label>
                <Select value={form.driverId} onValueChange={(v) => set('driverId', v)}>
                  <SelectTrigger className="border-slate-200"><SelectValue placeholder="Seleccionar conductor activo..." /></SelectTrigger>
                  <SelectContent>
                    {drivers.length === 0 && <SelectItem value="_" disabled>Sin conductores activos</SelectItem>}
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name} ({d.driverId})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehículo */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vehículo *</Label>
                <Select value={form.vehicleId} onValueChange={(v) => set('vehicleId', v)}>
                  <SelectTrigger className="border-slate-200"><SelectValue placeholder="Seleccionar vehículo disponible..." /></SelectTrigger>
                  <SelectContent>
                    {vehicles.length === 0 && <SelectItem value="_" disabled>Sin vehículos disponibles</SelectItem>}
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.plate} — {v.brand} {v.type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ruta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Origen *</Label>
                  <Select value={form.originId} onValueChange={(v) => set('originId', v)}>
                    <SelectTrigger className="border-slate-200"><SelectValue placeholder="Origen..." /></SelectTrigger>
                    <SelectContent>
                      {locations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.name} — {l.city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Destino *</Label>
                  <Select value={form.destinationId} onValueChange={(v) => set('destinationId', v)}>
                    <SelectTrigger className="border-slate-200"><SelectValue placeholder="Destino..." /></SelectTrigger>
                    <SelectContent>
                      {locations.filter((l) => l.id !== form.originId).map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.name} — {l.city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Documento ERP */}
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo doc. ERP *</Label>
                  <Select value={form.erpDocType} onValueChange={(v) => set('erpDocType', v)}>
                    <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ERP_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Número documento *</Label>
                  <Input
                    placeholder="Ej: 001-2025"
                    value={form.erpDocNumber}
                    onChange={(e) => set('erpDocNumber', e.target.value)}
                    className="border-slate-200"
                  />
                </div>
              </div>

              {/* Tipo de mercancía */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo de mercancía</Label>
                <Select value={form.merchandiseType} onValueChange={(v) => set('merchandiseType', v)}>
                  <SelectTrigger className="border-slate-200"><SelectValue placeholder="Seleccionar tipo (opcional)..." /></SelectTrigger>
                  <SelectContent>
                    {MERCHANDISE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha salida */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha y hora de salida *</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => set('scheduledAt', e.target.value)}
                  className="border-slate-200"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 font-semibold"
                  style={{ backgroundColor: 'var(--calypso-orange)', color: 'white' }}
                >
                  {loading ? 'Creando viaje...' : 'Crear viaje'}
                </Button>
                <Link href="/trips">
                  <Button type="button" variant="outline" className="border-slate-200">Cancelar</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
