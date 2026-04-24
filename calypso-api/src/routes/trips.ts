import { FastifyInstance } from 'fastify'
import { TripStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { authenticate, requireCoordinator } from '../middleware/auth'
import { isValidTransition, generateTripId } from '../services/trip.service'

export async function tripRoutes(fastify: FastifyInstance) {
  // GET /api/trips — Coordinador ve todos, Conductor solo los suyos
  fastify.get('/', { preHandler: authenticate }, async (req, reply) => {
    const user = req.user as { role: string; driverDbId: string | null }
    const query = req.query as { status?: string; driverId?: string; date?: string }

    const where: Record<string, unknown> = {}
    if (query.status) where.status = query.status
    if (query.date) {
      const d = new Date(query.date)
      where.scheduledAt = {
        gte: new Date(d.setHours(0, 0, 0, 0)),
        lte: new Date(d.setHours(23, 59, 59, 999)),
      }
    }

    // Conductor solo ve sus viajes
    if (user.role === 'DRIVER') {
      if (!user.driverDbId) return reply.status(403).send({ error: 'Conductor sin perfil asignado' })
      where.driverId = user.driverDbId
    } else if (query.driverId) {
      where.driver = { driverId: query.driverId }
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        driver: { select: { driverId: true, name: true } },
        vehicle: { select: { plate: true, type: true } },
        origin: { select: { locationId: true, name: true, city: true, lat: true, lng: true } },
        destination: { select: { locationId: true, name: true, city: true, lat: true, lng: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    })

    return reply.send({ data: trips })
  })

  // GET /api/trips/:id
  fastify.get('/:id', { preHandler: authenticate }, async (req, reply) => {
    const user = req.user as { role: string; driverDbId: string | null }
    const { id } = req.params as { id: string }

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        driver: { select: { driverId: true, name: true } },
        vehicle: { select: { plate: true, type: true, brand: true } },
        origin: true,
        destination: true,
        checklist: true,
        appointments: true,
      },
    })

    if (!trip) return reply.status(404).send({ error: 'Viaje no encontrado' })

    // Conductor solo puede ver sus viajes
    if (user.role === 'DRIVER' && trip.driverId !== user.driverDbId) {
      return reply.status(404).send({ error: 'Viaje no encontrado' })
    }

    return reply.send({ data: trip })
  })

  // POST /api/trips — solo Coordinador
  fastify.post('/', { preHandler: requireCoordinator }, async (req, reply) => {
    const body = req.body as {
      driverId: string
      vehicleId: string
      originId: string
      destinationId: string
      erpDocType: string
      erpDocNumber: string
      scheduledAt: string
      merchandiseType?: string
    }

    const tripId = generateTripId()

    const trip = await prisma.trip.create({
      data: {
        tripId,
        driverId: body.driverId,
        vehicleId: body.vehicleId,
        originId: body.originId,
        destinationId: body.destinationId,
        erpDocType: body.erpDocType as never,
        erpDocNumber: body.erpDocNumber,
        scheduledAt: new Date(body.scheduledAt),
        merchandiseType: body.merchandiseType ?? null,
        statusHistory: JSON.stringify([
          { status: 'PROG', timestamp: new Date().toISOString(), observations: 'Viaje creado' },
        ]),
      },
    })

    return reply.status(201).send({ data: trip })
  })

  // PATCH /api/trips/:id/status
  fastify.patch('/:id/status', { preHandler: authenticate }, async (req, reply) => {
    const user = req.user as { role: string; driverDbId: string | null }
    const { id } = req.params as { id: string }
    const { status, observations } = req.body as { status: TripStatus; observations?: string }

    const trip = await prisma.trip.findUnique({ where: { id } })
    if (!trip) return reply.status(404).send({ error: 'Viaje no encontrado' })

    // Conductor solo puede actualizar sus propios viajes
    if (user.role === 'DRIVER' && trip.driverId !== user.driverDbId) {
      return reply.status(404).send({ error: 'Viaje no encontrado' })
    }

    if (!isValidTransition(trip.status, status)) {
      return reply.status(422).send({
        error: `Transición inválida: ${trip.status} → ${status}`,
        currentStatus: trip.status,
      })
    }

    const history = Array.isArray(trip.statusHistory) ? trip.statusHistory as unknown[] : []
    const newHistory = [
      ...history,
      { status, timestamp: new Date().toISOString(), observations: observations ?? '' },
    ]

    const updated = await prisma.trip.update({
      where: { id },
      data: { status, observations, statusHistory: JSON.stringify(newHistory) },
    })

    return reply.send({ data: updated })
  })
}
