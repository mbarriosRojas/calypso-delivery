'use client'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { saveSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await api.login(email, password)
      saveSession(token, user)
      router.push(user.role === 'COORDINATOR' ? '/dashboard' : '/my-trips')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--calypso-surface)]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-[var(--calypso-navy)] px-12 py-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--calypso-orange)] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 3h15v13H1z" />
              <path d="M16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Calypso Delivery</span>
        </div>

        {/* Center quote */}
        <div className="space-y-4">
          <p className="text-slate-200 text-3xl font-semibold leading-snug">
            Logística inteligente,<br />entregas puntuales.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Gestiona tus viajes, conductores y vehículos desde un único panel de control en tiempo real.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex gap-8">
          {[
            { value: '99.2%', label: 'Entregas a tiempo' },
            { value: '24/7',  label: 'Soporte operativo' },
            { value: '100%',  label: 'Trazabilidad' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-[var(--calypso-orange)] text-xl font-bold">{stat.value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[var(--calypso-navy)] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 3h15v13H1z" />
                <path d="M16 8h4l3 3v5h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <span className="font-semibold text-slate-800 text-base">Calypso Delivery</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Iniciar sesión</h2>
            <p className="text-slate-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-10 border-slate-300 focus:border-[var(--calypso-orange)] focus:ring-[var(--calypso-orange)] bg-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-10 border-slate-300 focus:border-[var(--calypso-orange)] focus:ring-[var(--calypso-orange)] bg-white placeholder:text-slate-400"
              />
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 btn-calypso text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: 'var(--calypso-orange)', color: 'white' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Ingresando...
                </span>
              ) : 'Ingresar'}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Cuentas de prueba</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-200 text-slate-600 text-[10px] font-bold">C</span>
                <p className="text-xs text-slate-500 font-mono">coordinador@calypso.app / Calypso2025!</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-200 text-slate-600 text-[10px] font-bold">D</span>
                <p className="text-xs text-slate-500 font-mono">cmendoza@logistica.app / Calypso2025!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
