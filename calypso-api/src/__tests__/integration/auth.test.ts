import { buildApp } from '../../index'

describe('POST /api/auth/login', () => {
  let app: ReturnType<typeof buildApp>

  beforeAll(async () => {
    app = buildApp()
    await app.ready()
  })

  afterAll(() => app.close())

  it('devuelve JWT con rol correcto para coordinador', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'coordinador@calypso.app', password: 'Calypso2025!' },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.token).toBeDefined()
    expect(body.user.role).toBe('COORDINATOR')
  })

  it('devuelve 401 con credenciales incorrectas', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'coordinador@calypso.app', password: 'wrong' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('devuelve 401 con email inexistente', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'noexiste@calypso.app', password: 'Calypso2025!' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('devuelve 401 sin token en ruta protegida', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/trips' })
    expect(res.statusCode).toBe(401)
  })
})
