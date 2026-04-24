'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Layout } from '@/components/Layout'
import Link from 'next/link'

const LICENSE_CATEGORIES = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']

export default function NewDriverPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'driver' | 'user'>('driver')
  const [createdDriverId, setCreatedDriverId] = useState('')
  const [createdDriverName, setCreatedDriverName] = useState('')

  const [driverForm, setDriverForm] = useState({
    name: '', cedula: '', licenseCategory: 'C1', licenseExpiry: '',
  })
  const [userForm, setUserForm] = useState({ email: '', password: '', confirmPassword: '' })

  useEffect(() => {
    const session = getSession()
    if (!session || session.user.role !== 'COORDINATOR') router.push('/login')
  }, [router])

  function setD(field: string, value: string | null) {
    setDriverForm((prev) => ({ ...prev, [field]: value ?? '' }))
  }

  async function handleDriverSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!driverForm.name || !driverForm.cedula || !driverForm.licenseExpiry) {
      setError('Nombre, cédula y vencimiento de licencia son obligatorios'); return
    }
    setLoading(true); setError('')
    try {
      const res = await api.post<{ data: { id: string; name: string } }>('/api/drivers', driverForm)
      setCreatedDriverId(res.data.id)
      setCreatedDriverName(res.data.name)
      setStep('user')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear el conductor')
    } finally {
      setLoading(false)
    }
  }

  async function handleUserSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!userForm.email || !userForm.password) {
      setError('Email y contraseña son obligatorios'); return
    }
    if (userForm.password !== userForm.confirmPassword) {
      setError('Las contraseñas no coinciden'); return
    }
    if (userForm.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres'); return
    }
    setLoading(true); setError('')
    try {
      await api.post(`/api/drivers/${createdDriverId}/user`, {
        email: userForm.email,
        password: userForm.password,
      })
      router.push('/drivers')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  async function skipUser() {
    router.push('/drivers')
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/drivers" className="text-sm hover:underline" style={{ color: 'var(--calypso-orange)' }}>← Conductores</Link>
          <span className="text-slate-300">|</span>
          <h2 className="text-xl font-bold text-slate-900">Nuevo conductor</h2>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6">
          {['Datos del conductor', 'Cuenta de acceso'].map((label, i) => {
            const current = i === 0 ? step === 'driver' : step === 'user'
            const done = i === 0 && step === 'user'
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className="w-8 h-px bg-slate-200" />}
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    done ? 'bg-emerald-500 text-white' : current ? 'text-white' : 'bg-slate-100 text-slate-400'
                  }`} style={current ? { backgroundColor: 'var(--calypso-orange)' } : {}}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm ${current ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>{label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {step === 'driver' && (
          <Card className="shadow-sm border-slate-100">
            <CardHeader className="pb-2"><CardTitle className="text-base text-slate-700">Información del conductor</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleDriverSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre completo *</Label>
                  <Input value={driverForm.name} onChange={(e) => setD('name', e.target.value)} placeholder="Ej: Carlos Mendoza" className="border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cédula *</Label>
                  <Input value={driverForm.cedula} onChange={(e) => setD('cedula', e.target.value)} placeholder="Ej: 1020304050" className="border-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoría licencia *</Label>
                    <Select value={driverForm.licenseCategory} onValueChange={(v) => setD('licenseCategory', v)}>
                      <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LICENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vencimiento licencia *</Label>
                    <Input type="date" value={driverForm.licenseExpiry} onChange={(e) => setD('licenseExpiry', e.target.value)} className="border-slate-200" />
                  </div>
                </div>
                {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={loading} className="flex-1 font-semibold" style={{ backgroundColor: 'var(--calypso-orange)', color: 'white' }}>
                    {loading ? 'Guardando...' : 'Continuar →'}
                  </Button>
                  <Link href="/drivers"><Button type="button" variant="outline" className="border-slate-200">Cancelar</Button></Link>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'user' && (
          <Card className="shadow-sm border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-700">Cuenta de acceso para {createdDriverName}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">El conductor necesita una cuenta para iniciar sesión en la app. Puedes omitir este paso y crearlo después desde el perfil del conductor.</p>
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email *</Label>
                  <Input type="email" value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} placeholder="conductor@empresa.com" className="border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contraseña *</Label>
                  <Input type="password" value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} placeholder="Mín. 8 caracteres" className="border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Confirmar contraseña *</Label>
                  <Input type="password" value={userForm.confirmPassword} onChange={(e) => setUserForm((p) => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repetir contraseña" className="border-slate-200" />
                </div>
                {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={loading} className="flex-1 font-semibold" style={{ backgroundColor: 'var(--calypso-orange)', color: 'white' }}>
                    {loading ? 'Creando cuenta...' : 'Crear cuenta y finalizar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={skipUser} className="border-slate-200">Omitir</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
