import { TripStatus } from '@prisma/client'

// Máquina de estados — transiciones válidas
const VALID_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  PROG: ['TRANS'],
  TRANS: ['ENTG', 'NOV'],
  NOV: ['TRANS', 'CANC'],
  ENTG: [],
  CANC: [],
}

export function isValidTransition(from: TripStatus, to: TripStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getValidNextStatuses(current: TripStatus): TripStatus[] {
  return VALID_TRANSITIONS[current] ?? []
}

// Ítems del checklist con sus reglas
export const CHECKLIST_TEMPLATE = [
  { item: 'Nivel de combustible', category: 'Mecánico', responseType: 'PERCENTAGE', blocksExit: true, blockCondition: 'lt_20' },
  { item: 'Estado de llantas', category: 'Mecánico', responseType: 'OK_ISSUE', blocksExit: true, blockCondition: 'issue' },
  { item: 'Frenos', category: 'Seguridad', responseType: 'OK_ISSUE', blocksExit: true, blockCondition: 'issue' },
  { item: 'Luces delanteras y traseras', category: 'Seguridad', responseType: 'OK_ISSUE', blocksExit: true, blockCondition: 'issue' },
  { item: 'Documentos del vehículo vigentes', category: 'Legal', responseType: 'YES_NO', blocksExit: true, blockCondition: 'no' },
  { item: 'SOAT vigente', category: 'Legal', responseType: 'YES_NO', blocksExit: true, blockCondition: 'no' },
  { item: 'Extintor presente y vigente', category: 'Seguridad', responseType: 'YES_NO', blocksExit: true, blockCondition: 'no' },
  { item: 'Botiquín presente', category: 'Seguridad', responseType: 'YES_NO', blocksExit: false, blockCondition: null },
  { item: 'Carrocería sin daños visibles', category: 'Estado físico', responseType: 'OK_ISSUE_PHOTO', blocksExit: false, blockCondition: null },
  { item: 'Cinturón de seguridad funcionando', category: 'Seguridad', responseType: 'OK_ISSUE', blocksExit: true, blockCondition: 'issue' },
]

export function evaluateChecklistItem(item: typeof CHECKLIST_TEMPLATE[0], value: string): boolean {
  if (!item.blocksExit) return false
  switch (item.blockCondition) {
    case 'lt_20': return parseInt(value) < 20
    case 'issue': return value.toUpperCase() === 'ISSUE'
    case 'no': return value.toUpperCase() === 'NO'
    default: return false
  }
}

export function isChecklistBlocking(
  items: Array<{ item: string; value: string | null; blocksExit: boolean; isBlocked: boolean }>
): { blocked: boolean; blockedItems: string[] } {
  const blockedItems = items
    .filter((i) => i.blocksExit && i.isBlocked)
    .map((i) => i.item)
  return { blocked: blockedItems.length > 0, blockedItems }
}

// Generador de IDs
export function generateTripId(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
  return `VJE-${date}-${seq}`
}
