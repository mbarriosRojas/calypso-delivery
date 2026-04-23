import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'

export async function locationRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: authenticate }, async (_req, reply) => {
    const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } })
    return reply.send({ data: locations })
  })
}
