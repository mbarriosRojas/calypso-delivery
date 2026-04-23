# Calypso API

Backend de la plataforma logística Calypso Delivery.

## Stack
- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Fastify 4
- **ORM**: Prisma 5
- **DB**: PostgreSQL (Supabase)
- **Auth**: JWT (@fastify/jwt)

## Setup

```bash
cp .env.example .env
# Editar .env con tus credenciales de Supabase

npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Usuarios de prueba

| Rol | Email | Password |
|-----|-------|----------|
| Coordinador | coordinador@calypso.app | Calypso2025! |
| Conductor | cmendoza@logistica.app | Calypso2025! |

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/login | Login — devuelve JWT |
| GET | /api/trips | Lista viajes (filtros: status, date) |
| POST | /api/trips | Crear viaje (COORDINATOR) |
| PATCH | /api/trips/:id/status | Cambiar estado |
| GET | /api/trips/:id/checklist | Ver checklist |
| POST | /api/trips/:id/checklist | Completar checklist |
| GET | /api/drivers | Lista conductores |
| GET | /api/vehicles | Lista vehículos |
| GET | /api/locations | Lista puntos con coordenadas GPS |
| POST | /api/webhooks/ventas | Webhook pedido.creado |
| GET | /health | Health check |
