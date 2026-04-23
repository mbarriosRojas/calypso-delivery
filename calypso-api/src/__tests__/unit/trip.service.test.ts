import { isValidTransition, evaluateChecklistItem, isChecklistBlocking, generateTripId, CHECKLIST_TEMPLATE } from '../../services/trip.service'
import { TripStatus } from '@prisma/client'

describe('Máquina de estados del viaje', () => {
  it('PROG → TRANS es válido', () => {
    expect(isValidTransition(TripStatus.PROG, TripStatus.TRANS)).toBe(true)
  })
  it('TRANS → ENTG es válido', () => {
    expect(isValidTransition(TripStatus.TRANS, TripStatus.ENTG)).toBe(true)
  })
  it('TRANS → NOV es válido', () => {
    expect(isValidTransition(TripStatus.TRANS, TripStatus.NOV)).toBe(true)
  })
  it('NOV → TRANS es válido', () => {
    expect(isValidTransition(TripStatus.NOV, TripStatus.TRANS)).toBe(true)
  })
  it('NOV → CANC es válido', () => {
    expect(isValidTransition(TripStatus.NOV, TripStatus.CANC)).toBe(true)
  })
  it('ENTG → TRANS es inválido', () => {
    expect(isValidTransition(TripStatus.ENTG, TripStatus.TRANS)).toBe(false)
  })
  it('CANC → cualquier estado es inválido', () => {
    expect(isValidTransition(TripStatus.CANC, TripStatus.PROG)).toBe(false)
    expect(isValidTransition(TripStatus.CANC, TripStatus.TRANS)).toBe(false)
  })
  it('PROG → ENTG sin pasar por TRANS es inválido', () => {
    expect(isValidTransition(TripStatus.PROG, TripStatus.ENTG)).toBe(false)
  })
})

describe('Lógica de bloqueo del checklist', () => {
  const combustibleItem = CHECKLIST_TEMPLATE.find(t => t.item === 'Nivel de combustible')!
  const frenosItem = CHECKLIST_TEMPLATE.find(t => t.item === 'Frenos')!
  const botiquinItem = CHECKLIST_TEMPLATE.find(t => t.item === 'Botiquín presente')!

  it('combustible < 20% bloquea salida', () => {
    expect(evaluateChecklistItem(combustibleItem, '15')).toBe(true)
    expect(evaluateChecklistItem(combustibleItem, '10')).toBe(true)
    expect(evaluateChecklistItem(combustibleItem, '0')).toBe(true)
  })
  it('combustible >= 20% no bloquea', () => {
    expect(evaluateChecklistItem(combustibleItem, '20')).toBe(false)
    expect(evaluateChecklistItem(combustibleItem, '80')).toBe(false)
  })
  it('frenos en Novedad bloquea salida', () => {
    expect(evaluateChecklistItem(frenosItem, 'ISSUE')).toBe(true)
  })
  it('frenos OK no bloquea', () => {
    expect(evaluateChecklistItem(frenosItem, 'OK')).toBe(false)
  })
  it('botiquín ausente NO bloquea (no es crítico)', () => {
    expect(evaluateChecklistItem(botiquinItem, 'NO')).toBe(false)
  })

  it('isChecklistBlocking detecta ítems bloqueantes', () => {
    const items = [
      { item: 'Nivel de combustible', value: '10', blocksExit: true, isBlocked: true },
      { item: 'Frenos', value: 'OK', blocksExit: true, isBlocked: false },
    ]
    const result = isChecklistBlocking(items)
    expect(result.blocked).toBe(true)
    expect(result.blockedItems).toContain('Nivel de combustible')
  })

  it('isChecklistBlocking retorna false cuando todo está OK', () => {
    const items = [
      { item: 'Nivel de combustible', value: '80', blocksExit: true, isBlocked: false },
      { item: 'Frenos', value: 'OK', blocksExit: true, isBlocked: false },
    ]
    const result = isChecklistBlocking(items)
    expect(result.blocked).toBe(false)
    expect(result.blockedItems).toHaveLength(0)
  })
})

describe('Generador de IDs de viaje', () => {
  it('genera ID con formato VJE-YYYYMMDD-###', () => {
    const id = generateTripId()
    expect(id).toMatch(/^VJE-\d{8}-\d{3}$/)
  })
  it('usa la fecha actual', () => {
    const id = generateTripId()
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    expect(id).toContain(today)
  })
})
