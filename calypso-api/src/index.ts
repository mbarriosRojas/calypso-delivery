import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import 'dotenv/config'

import { authRoutes } from './routes/auth'
import { tripRoutes } from './routes/trips'
import { driverRoutes } from './routes/drivers'
import { vehicleRoutes } from './routes/vehicles'
import { checklistRoutes } from './routes/checklist'
import { appointmentRoutes } from './routes/appointments'
import { locationRoutes } from './routes/locations'
import { webhookRoutes } from './routes/webhooks'

export function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
  })

  fastify.register(helmet, { contentSecurityPolicy: false })

  fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    keyGenerator: (req) => req.ip,
  })

  fastify.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  })

  fastify.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'changeme-in-production-min-32-chars!!',
  })

  fastify.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } })

  // Public routes
  fastify.register(authRoutes, { prefix: '/api/auth' })
  fastify.register(webhookRoutes, { prefix: '/api/webhooks' })

  // Protected routes
  fastify.register(tripRoutes, { prefix: '/api/trips' })
  fastify.register(driverRoutes, { prefix: '/api/drivers' })
  fastify.register(vehicleRoutes, { prefix: '/api/vehicles' })
  fastify.register(checklistRoutes, { prefix: '/api/trips' })
  fastify.register(appointmentRoutes, { prefix: '/api/appointments' })
  fastify.register(locationRoutes, { prefix: '/api/locations' })

  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  return fastify
}

async function start() {
  const app = buildApp()
  try {
    await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' })
    console.log(`🚀 Calypso API running on port ${process.env.PORT ?? 3000}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
