import { FastifyInstance } from 'fastify'
import { DriverStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
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
    const body = req.body as Partial<{ status: DriverStatus; vehicleId: string; licenseExpiry: string; name: string; cedula: string; licenseCategory: string }>
    const data: Record<string, unknown> = { ...body }
    if (body.licenseExpiry) data.licenseExpiry = new Date(body.licenseExpiry)
    const driver = await prisma.driver.update({ where: { id }, data })
    return reply.send({ data: driver })
  })

  // POST /api/drivers/:id/user — crear cuenta de acceso para un conductor
  fastify.post('/:id/user', { preHandler: requireCoordinator }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { email, password } = req.body as { email: string; password: string }

    const driver = await prisma.driver.findUnique({ where: { id } })
    if (!driver) return reply.status(404).send({ error: 'Conductor no encontrado' })

    const existing = await prisma.user.findFirst({ where: { driverId: id } })
    if (existing) return reply.status(409).send({ error: 'El conductor ya tiene una cuenta de acceso' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash, role: 'DRIVER', driverId: id },
    })
    return reply.status(201).send({ data: { id: user.id, email: user.email, role: user.role } })
  })

  // PATCH /api/drivers/:id/user — actualizar email o contraseña
  fastify.patch('/:id/user', { preHandler: requireCoordinator }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { email, password } = req.body as { email?: string; password?: string }

    const user = await prisma.user.findFirst({ where: { driverId: id } })
    if (!user) return reply.status(404).send({ error: 'Este conductor no tiene cuenta de acceso' })

    const data: Record<string, unknown> = {}
    if (email) data.email = email.toLowerCase()
    if (password) data.passwordHash = await bcrypt.hash(password, 10)

    const updated = await prisma.user.update({ where: { id: user.id }, data })
    return reply.send({ data: { id: updated.id, email: updated.email, role: updated.role } })
  })
}
