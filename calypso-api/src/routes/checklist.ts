import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { CHECKLIST_TEMPLATE, evaluateChecklistItem, isChecklistBlocking } from '../services/trip.service'

export async function checklistRoutes(fastify: FastifyInstance) {
  // POST /api/trips/:id/checklist
  fastify.post('/:id/checklist', { preHandler: authenticate }, async (req, reply) => {
    const user = req.user as { role: string; driverDbId: string | null }
    const { id } = req.params as { id: string }
    const { items } = req.body as {
      items: Array<{ item: string; value: string; photoUrl?: string }>
    }

    const trip = await prisma.trip.findUnique({ where: { id } })
    if (!trip) return reply.status(404).send({ error: 'Viaje no encontrado' })

    if (user.role === 'DRIVER' && trip.driverId !== user.driverDbId) {
      return reply.status(404).send({ error: 'Viaje no encontrado' })
    }

    // Evaluar cada ítem contra las reglas del template
    const evaluated = items.map((submitted) => {
      const template = CHECKLIST_TEMPLATE.find((t) => t.item === submitted.item)
      if (!template) return { ...submitted, blocksExit: false, isBlocked: false, category: 'Otro', responseType: 'TEXT' }
      const isBlocked = evaluateChecklistItem(template, submitted.value)
      return {
        item: template.item,
        category: template.category,
        responseType: template.responseType,
        value: submitted.value,
        photoUrl: submitted.photoUrl ?? null,
        blocksExit: template.blocksExit,
        isBlocked,
      }
    })

    const { blocked, blockedItems } = isChecklistBlocking(evaluated)

    // Guardar ítems
    await prisma.checklistItem.deleteMany({ where: { tripId: id } })
    await prisma.checklistItem.createMany({
      data: evaluated.map((e) => ({ ...e, tripId: id })),
    })

    if (blocked) {
      return reply.status(422).send({
        error: 'Checklist con ítems bloqueantes — el viaje no puede iniciar',
        blockedItems,
        canDepart: false,
      })
    }

    return reply.status(201).send({ message: 'Checklist completado', canDepart: true })
  })

  // GET /api/trips/:id/checklist
  fastify.get('/:id/checklist', { preHandler: authenticate }, async (req, reply) => {
    const user = req.user as { role: string; driverDbId: string | null }
    const { id } = req.params as { id: string }

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { checklist: true },
    })
    if (!trip) return reply.status(404).send({ error: 'Viaje no encontrado' })

    if (user.role === 'DRIVER' && trip.driverId !== user.driverDbId) {
      return reply.status(404).send({ error: 'Viaje no encontrado' })
    }

    // Si no hay checklist, devolver template vacío
    if (trip.checklist.length === 0) {
      return reply.send({ data: CHECKLIST_TEMPLATE.map((t) => ({ ...t, value: null, isBlocked: false })) })
    }

    return reply.send({ data: trip.checklist })
  })
}
