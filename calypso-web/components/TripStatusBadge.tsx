import { Badge } from '@/components/ui/badge'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PROG:  { label: 'Programado',   className: 'bg-gray-100 text-gray-700' },
  TRANS: { label: 'En tránsito',  className: 'bg-blue-100 text-blue-700' },
  ENTG:  { label: 'Entregado',    className: 'bg-green-100 text-green-700' },
  NOV:   { label: 'Novedad',      className: 'bg-yellow-100 text-yellow-700' },
  CANC:  { label: 'Cancelado',    className: 'bg-red-100 text-red-700' },
}

export function TripStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return <Badge className={`${cfg.className} border-0 font-medium`}>{cfg.label}</Badge>
}
