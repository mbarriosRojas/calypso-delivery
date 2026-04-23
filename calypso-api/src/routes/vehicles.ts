import { FastifyInstance } from 'fastify'
import { VehicleStatus, VehicleType } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { requireCoordinator } from '../middleware/auth'

export async function vehicleRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: requireCoordinator }, async (req, reply) => {
    const query = req.query as { status?: VehicleStatus }
    const vehicles = await prisma.vehicle.findMany({
      where: query.status ? { status: query.status } : undefined,
      include: { drivers: { select: { driverId: true, name: true } } },
      orderBy: { plate: 'asc' },
    })
    return reply.send({ data: vehicles })
  })

  fastify.get('/:id', { preHandler: requireCoordinator }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: { drivers: true },
    })
    if (!vehicle) return reply.status(404).send({ error: 'Vehículo no encontrado' })
    return reply.send({ data: vehicle })
  })

  fastify.post('/', { preHandler: requireCoordinator }, async (req, reply) => {
    const body = req.body as {
      plate: string; type: VehicleType; brand: string; model: string
      year: number; capacityKg: number; capacityM3?: number; soatExpiry: string
    }
    const vehicle = await prisma.vehicle.create({
      data: { ...body, soatExpiry: new Date(body.soatExpiry) },
    })
    return reply.status(201).send({ data: vehicle })
  })

  fastify.patch('/:id', { preHandler: requireCoordinator }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = req.body as Partial<{ status: VehicleStatus; soatExpiry: string }>
    const data: Record<string, unknown> = { ...body }
    if (body.soatExpiry) data.soatExpiry = new Date(body.soatExpiry)
    const vehicle = await prisma.vehicle.update({ where: { id }, data })
    return reply.send({ data: vehicle })
  })
}
