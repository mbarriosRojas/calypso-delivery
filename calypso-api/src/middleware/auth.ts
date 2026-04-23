import { FastifyRequest, FastifyReply } from 'fastify'

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'Token inválido o expirado' })
  }
}

export async function requireCoordinator(req: FastifyRequest, reply: FastifyReply) {
  await authenticate(req, reply)
  const user = req.user as { role: string }
  if (user.role !== 'COORDINATOR') {
    reply.status(403).send({ error: 'Acceso restringido a coordinadores' })
  }
}

export async function requireDriver(req: FastifyRequest, reply: FastifyReply) {
  await authenticate(req, reply)
  const user = req.user as { role: string }
  if (user.role !== 'DRIVER') {
    reply.status(403).send({ error: 'Acceso restringido a conductores' })
  }
}
