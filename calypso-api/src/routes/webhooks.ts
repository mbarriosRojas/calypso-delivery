import { FastifyInstance } from 'fastify'
import { ErpDocType } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { generateTripId } from '../services/trip.service'

export async function webhookRoutes(fastify: FastifyInstance) {
  // Webhook de integración con app de ventas
  fastify.post('/ventas', async (req, reply) => {
    const body = req.body as {
      event: string
      id_pedido: string
      punto_entrega: string
      fecha_entrega_deseada: string
    }

    if (body.event !== 'pedido.creado') {
      return reply.status(400).send({ error: 'Evento no soportado' })
    }

    // Buscar punto de entrega por locationId
    const destination = await prisma.location.findFirst({
      where: { locationId: body.punto_entrega },
    })
    if (!destination) {
      return reply.status(422).send({ error: `Punto de entrega ${body.punto_entrega} no encontrado` })
    }

    // Usar primera bodega propia como origen por defecto
    const origin = await prisma.location.findFirst({
      where: { type: 'OWN_WAREHOUSE' },
    })
    if (!origin) return reply.status(422).send({ error: 'No hay bodega de origen configurada' })

    const tripId = generateTripId()

    const trip = await prisma.trip.create({
      data: {
        tripId,
        originId: origin.id,
        destinationId: destination.id,
        erpDocType: ErpDocType.PED,
        erpDocNumber: body.id_pedido,
        scheduledAt: new Date(body.fecha_entrega_deseada),
        // Requiere asignación manual de conductor y vehículo
        driverId: (await prisma.driver.findFirst({ where: { status: 'ACTIVE' } }))!.id,
        vehicleId: (await prisma.vehicle.findFirst({ where: { status: 'AVAILABLE' } }))!.id,
        statusHistory: JSON.stringify([
          { status: 'PROG', timestamp: new Date().toISOString(), observations: `Creado desde webhook: ${body.id_pedido}` },
        ]),
      },
    })

    return reply.status(201).send({ data: { tripId: trip.tripId, id: trip.id } })
  })
}
