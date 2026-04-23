import { FastifyInstance } from 'fastify'
import { AppointmentStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { requireCoordinator, authenticate } from '../middleware/auth'

export async function appointmentRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: authenticate }, async (req, reply) => {
    const query = req.query as { status?: AppointmentStatus; date?: string }
    const where: Record<string, unknown> = {}
    if (query.status) where.status = query.status
    if (query.date) {
      const d = new Date(query.date)
      where.scheduledAt = { gte: new Date(d.setHours(0,0,0,0)), lte: new Date(d.setHours(23,59,59,999)) }
    }
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        trip: { select: { tripId: true, driver: { select: { name: true } } } },
        location: { select: { name: true, city: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    })
    return reply.send({ data: appointments })
  })

  fastify.post('/', { preHandler: requireCoordinator }, async (req, reply) => {
    const body = req.body as {
      tripId: string; locationId: string; scheduledAt: string; duration: number
    }
    const count = await prisma.appointment.count()
    const appointmentId = `CIT-${String(count + 1).padStart(3, '0')}`

    const appointment = await prisma.appointment.create({
      data: { ...body, appointmentId, scheduledAt: new Date(body.scheduledAt) },
    })
    return reply.status(201).send({ data: appointment })
  })

  fastify.patch('/:id/status', { preHandler: requireCoordinator }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { status, confirmedBy } = req.body as { status: AppointmentStatus; confirmedBy?: string }
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status, confirmedBy },
    })
    return reply.send({ data: appointment })
  })
}
