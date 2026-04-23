import { IncomingMessage, ServerResponse } from 'http'
import 'dotenv/config'
import { buildApp } from '../src/index'

let app: ReturnType<typeof buildApp> | null = null

async function getApp() {
  if (!app) {
    app = buildApp()
    await app.ready()
  }
  return app
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const server = await getApp()
  server.server.emit('request', req, res)
}
