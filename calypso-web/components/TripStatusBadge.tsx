// TripStatusBadge — maps trip status codes to semantic colour tokens
// aligned with the Calypso Delivery design system (navy/orange palette).

interface StatusConfig {
  label: string
  dot: string
  text: string
  bg: string
  border: string
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  // PROG — Programado: neutral blue-slate
  PROG: {
    label:  'Programado',
    dot:    'bg-slate-500',
    text:   'text-slate-700',
    bg:     'bg-slate-100',
    border: 'border-slate-200',
  },
  // TRANS — En tránsito: amber/warm-orange
  TRANS: {
    label:  'En tránsito',
    dot:    'bg-amber-500',
    text:   'text-amber-700',
    bg:     'bg-amber-50',
    border: 'border-amber-200',
  },
  // NOV — Novedad: red (alert)
  NOV: {
    label:  'Novedad',
    dot:    'bg-red-500',
    text:   'text-red-700',
    bg:     'bg-red-50',
    border: 'border-red-200',
  },
  // ENTG — Entregado: emerald (success)
  ENTG: {
    label:  'Entregado',
    dot:    'bg-emerald-500',
    text:   'text-emerald-700',
    bg:     'bg-emerald-50',
    border: 'border-emerald-200',
  },
  // CANC — Cancelado: grey (neutral/inactive)
  CANC: {
    label:  'Cancelado',
    dot:    'bg-slate-400',
    text:   'text-slate-500',
    bg:     'bg-slate-100',
    border: 'border-slate-200',
  },
}

const FALLBACK: StatusConfig = {
  label:  '',
  dot:    'bg-slate-400',
  text:   'text-slate-500',
  bg:     'bg-slate-100',
  border: 'border-slate-200',
}

export function TripStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { ...FALLBACK, label: status }

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'text-xs font-medium border whitespace-nowrap',
        cfg.bg,
        cfg.border,
        cfg.text,
      ].join(' ')}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} aria-hidden="true" />
      {cfg.label}
    </span>
  )
}
