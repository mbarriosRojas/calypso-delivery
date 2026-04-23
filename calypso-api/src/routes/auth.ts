import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

export async function authRoutes(fastify: FastifyInstance) {
  // Rate limit más estricto para login
  fastify.post('/login', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
      },
    },
  }, async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { driver: true },
    })

    // Comparación en tiempo constante — no revela si el email existe
    const dummyHash = '$2a$10$dummy.hash.to.prevent.timing.attacks.dummy'
    const passwordMatch = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash)

    if (!user || !passwordMatch) {
      return reply.status(401).send({ error: 'Credenciales incorrectas' })
    }

    const token = fastify.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        driverId: user.driverId ?? null,
        driverDbId: user.driver?.id ?? null,
      },
      { expiresIn: '8h' }
    )

    return reply.send({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        driverCode: user.driver?.driverId ?? null,
      },
    })
  })
}
