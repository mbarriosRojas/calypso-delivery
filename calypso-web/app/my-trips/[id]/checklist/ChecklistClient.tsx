'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

interface ChecklistTemplate {
  item: string; category: string; responseType: string; blocksExit: boolean
  value: string | null; isBlocked: boolean
}

export default function ChecklistPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [items, setItems] = useState<ChecklistTemplate[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [blocked, setBlocked] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get<{ data: ChecklistTemplate[] }>(`/api/trips/${id}/checklist`)
      .then((res) => setItems(res.data))
  }, [id])

  function renderInput(item: ChecklistTemplate) {
    switch (item.responseType) {
      case 'PERCENTAGE':
        return (
          <input
            type="number" min="0" max="100"
            value={values[item.item] ?? ''}
            onChange={(e) => setValues(v => ({ ...v, [item.item]: e.target.value }))}
            className="border rounded px-2 py-1 w-24 text-sm"
            placeholder="0-100"
            aria-label={`${item.item} porcentaje`}
          />
        )
      case 'YES_NO':
        return (
          <div className="flex gap-3">
            {['SÍ', 'NO'].map((opt) => (
              <label key={opt} className="flex items-center gap-1 cursor-pointer text-sm">
                <input
                  type="radio" name={item.item} value={opt === 'SÍ' ? 'YES' : 'NO'}
                  checked={values[item.item] === (opt === 'SÍ' ? 'YES' : 'NO')}
                  onChange={() => setValues(v => ({ ...v, [item.item]: opt === 'SÍ' ? 'YES' : 'NO' }))}
                />
                {opt}
              </label>
            ))}
          </div>
        )
      default:
        return (
          <div className="flex gap-3">
            {['OK', 'ISSUE'].map((opt) => (
              <label key={opt} className="flex items-center gap-1 cursor-pointer text-sm">
                <input
                  type="radio" name={item.item} value={opt}
                  checked={values[item.item] === opt}
                  onChange={() => setValues(v => ({ ...v, [item.item]: opt }))}
                />
                {opt === 'ISSUE' ? 'Novedad' : 'OK'}
              </label>
            ))}
          </div>
        )
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = items.map((item) => ({ item: item.item, value: values[item.item] ?? '' }))
      await api.post(`/api/trips/${id}/checklist`, { items: payload })
      router.push(`/my-trips/${id}`)
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('bloqueantes')) {
        // Parsear ítems bloqueantes del mensaje
        setBlocked([])
      }
      setError(err instanceof Error ? err.message : 'Error al guardar checklist')
    } finally {
      setLoading(false)
    }
  }

  const categories = [...new Set(items.map(i => i.category))]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-4">
        <button onClick={() => router.back()} className="text-blue-600 text-sm">← Volver</button>
        <h1 className="text-lg font-bold mt-1">Checklist del vehículo</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto space-y-4 pb-24">
        {categories.map((cat) => (
          <Card key={cat}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-600">{cat}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {items.filter(i => i.category === cat).map((item) => {
                const isBlocking = blocked.includes(item.item) || (item.blocksExit && values[item.item] && (
                  (item.responseType === 'PERCENTAGE' && parseInt(values[item.item]) < 20) ||
                  (item.responseType === 'YES_NO' && values[item.item] === 'NO') ||
                  (item.responseType !== 'PERCENTAGE' && item.responseType !== 'YES_NO' && values[item.item] === 'ISSUE')
                ))
                return (
                  <div key={item.item} className={`p-3 rounded-lg ${isBlocking ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                    <Label className={`text-sm font-medium ${isBlocking ? 'text-red-700' : 'text-gray-700'}`}>
                      {item.item}
                      {item.blocksExit && <span className="ml-1 text-xs text-red-500">*</span>}
                    </Label>
                    <div className="mt-2">{renderInput(item)}</div>
                    {isBlocking && <p className="text-xs text-red-600 mt-1">⚠ Este ítem bloquea la salida</p>}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}

        {error && <p className="text-sm text-red-600 bg-red-50 rounded p-3">{error}</p>}
        <p className="text-xs text-gray-400">* Ítems que bloquean la salida si fallan</p>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar checklist'}
          </Button>
        </div>
      </form>
    </div>
  )
}
