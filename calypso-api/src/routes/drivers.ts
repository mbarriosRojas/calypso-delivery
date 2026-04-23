import { FastifyInstance } from 'fastify'
import { DriverStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { requireCoordinator, authenticate } from '../middleware/auth'

export async function driverRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: requireCoordinator }, async (req, reply) => {
    const query = req.query as { status?: DriverStatus }
    const drivers = await prisma.driver.findMany({
      where: query.status ? { status: query.status } : undefined,
      include: { vehicle: { select: { plate: true, type: true } } },
      orderBy: { name: 'asc' },
    })
    return reply.send({ data: drivers })
  })

  fastify.get('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        vehicle: true,
        trips: {
          orderBy: { scheduledAt: 'desc' },
          take: 20,
          include: { origin: { select: { name: true } }, destination: { select: { name: true } } },
        },
      },
    })
    if (!driver) return reply.status(404).send({ error: 'Conductor no encontrado' })
    return reply.send({ data: driver })
  })

  fastify.post('/', { preHandler: requireCoordinator }, async (req, reply) => {
    const body = req.body as {
      name: string; cedula: string; licenseCategory: string
      licenseExpiry: string; status?: DriverStatus
    }
    const count = await prisma.driver.count()
    const driverId = `DRV-${String(count + 1).padStart(3, '0')}`

    const driver = await prisma.driver.create({
      data: { ...body, driverId, licenseExpiry: new Date(body.licenseExpiry) },
    })
    return reply.status(201).send({ data: driver })
  })

  fastify.patch('/:id', { preHandler: requireCoordinator }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = req.body as Partial<{ status: DriverStatus; vehicleId: string; licenseExpiry: string }>
    const data: Record<string, unknown> = { ...body }
    if (body.licenseExpiry) data.licenseExpiry = new Date(body.licenseExpiry)
    const driver = await prisma.driver.update({ where: { id }, data })
    return reply.send({ data: driver })
  })
}
