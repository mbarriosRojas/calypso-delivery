import { PrismaClient, DriverStatus, VehicleType, VehicleStatus, LocationType, TripStatus, ErpDocType, AppointmentStatus, CreditNoteStatus, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Calypso Delivery database...')

  // Users
  const passwordHash = await bcrypt.hash('Calypso2025!', 10)

  const coordinator = await prisma.user.upsert({
    where: { email: 'coordinador@calypso.app' },
    update: {},
    create: {
      email: 'coordinador@calypso.app',
      passwordHash,
      role: UserRole.COORDINATOR,
    },
  })

  // Vehicles
  const [vABC, vXYZ, vMNO, vPQR, vLMN] = await Promise.all([
    prisma.vehicle.upsert({
      where: { plate: 'ABC-123' },
      update: {},
      create: { plate: 'ABC-123', type: VehicleType.TRUCK_2, brand: 'Chevrolet', model: 'NPR', year: 2020, capacityKg: 3500, capacityM3: 18, soatExpiry: new Date('2025-08-31'), status: VehicleStatus.ON_ROUTE },
    }),
    prisma.vehicle.upsert({
      where: { plate: 'XYZ-456' },
      update: {},
      create: { plate: 'XYZ-456', type: VehicleType.VAN, brand: 'Renault', model: 'Master', year: 2022, capacityKg: 500, capacityM3: 3, soatExpiry: new Date('2025-12-15'), status: VehicleStatus.AVAILABLE },
    }),
    prisma.vehicle.upsert({
      where: { plate: 'MNO-789' },
      update: {},
      create: { plate: 'MNO-789', type: VehicleType.TRUCK_3, brand: 'Kenworth', model: 'T370', year: 2019, capacityKg: 10000, capacityM3: 45, soatExpiry: new Date('2025-09-30'), status: VehicleStatus.MAINTENANCE },
    }),
    prisma.vehicle.upsert({
      where: { plate: 'PQR-321' },
      update: {},
      create: { plate: 'PQR-321', type: VehicleType.MOTO, brand: 'Honda', model: 'CB190', year: 2023, capacityKg: 30, capacityM3: 0.1, soatExpiry: new Date('2026-02-28'), status: VehicleStatus.AVAILABLE },
    }),
    prisma.vehicle.upsert({
      where: { plate: 'LMN-654' },
      update: {},
      create: { plate: 'LMN-654', type: VehicleType.VAN, brand: 'Ford', model: 'Transit', year: 2021, capacityKg: 700, capacityM3: 3, soatExpiry: new Date('2025-11-15'), status: VehicleStatus.ON_ROUTE },
    }),
  ])

  // Drivers
  const [d001, d002, d003, d004, d005] = await Promise.all([
    prisma.driver.upsert({
      where: { driverId: 'DRV-001' },
      update: {},
      create: { driverId: 'DRV-001', name: 'Carlos Mendoza Ríos', cedula: '10234567', licenseCategory: 'C2', licenseExpiry: new Date('2026-03-15'), status: DriverStatus.ACTIVE, vehicleId: vABC.id },
    }),
    prisma.driver.upsert({
      where: { driverId: 'DRV-002' },
      update: {},
      create: { driverId: 'DRV-002', name: 'Andrés Felipe Torres', cedula: '80456123', licenseCategory: 'B1', licenseExpiry: new Date('2025-11-30'), status: DriverStatus.ACTIVE },
    }),
    prisma.driver.upsert({
      where: { driverId: 'DRV-003' },
      update: {},
      create: { driverId: 'DRV-003', name: 'Luis Eduardo Gómez', cedula: '52789034', licenseCategory: 'C1', licenseExpiry: new Date('2027-07-22'), status: DriverStatus.ACTIVE, vehicleId: vLMN.id },
    }),
    prisma.driver.upsert({
      where: { driverId: 'DRV-004' },
      update: {},
      create: { driverId: 'DRV-004', name: 'Martina Salcedo Vera', cedula: '43123890', licenseCategory: 'B1', licenseExpiry: new Date('2025-06-01'), status: DriverStatus.SUSPENDED },
    }),
    prisma.driver.upsert({
      where: { driverId: 'DRV-005' },
      update: {},
      create: { driverId: 'DRV-005', name: 'Pedro Infante Castro', cedula: '17654321', licenseCategory: 'C3', licenseExpiry: new Date('2028-01-10'), status: DriverStatus.ACTIVE },
    }),
  ])

  // Driver user (linked to DRV-001)
  await prisma.user.upsert({
    where: { email: 'cmendoza@logistica.app' },
    update: {},
    create: {
      email: 'cmendoza@logistica.app',
      passwordHash,
      role: UserRole.DRIVER,
      driverId: d001.id,
    },
  })

  // Locations
  const [p001, p002, p003, p004, p005, p006] = await Promise.all([
    prisma.location.upsert({
      where: { locationId: 'PNT-001' },
      update: {},
      create: { locationId: 'PNT-001', name: 'Bodega Central Calypso', type: LocationType.OWN_WAREHOUSE, city: 'Bogotá', address: 'Cra 68 #13-45, Zona Industrial', schedule: 'Lun-Sáb 6am-8pm', contactName: 'Jorge Rueda', lat: 4.6350, lng: -74.1077 },
    }),
    prisma.location.upsert({
      where: { locationId: 'PNT-002' },
      update: {},
      create: { locationId: 'PNT-002', name: 'Bodega Norte Medellín', type: LocationType.OWN_WAREHOUSE, city: 'Medellín', address: 'Cl 98 #52-10, Autopista Norte', schedule: 'Lun-Vie 7am-6pm', contactName: 'Ana Ospina', lat: 6.2907, lng: -75.5559 },
    }),
    prisma.location.upsert({
      where: { locationId: 'PNT-003' },
      update: {},
      create: { locationId: 'PNT-003', name: 'Centro Distrib. Cali Sur', type: LocationType.CLIENT_WAREHOUSE, city: 'Cali', address: 'Av. Simón Bolívar #23-55', schedule: 'Lun-Sáb 8am-5pm', contactName: 'Raúl Muñoz', lat: 3.4372, lng: -76.5225 },
    }),
    prisma.location.upsert({
      where: { locationId: 'PNT-004' },
      update: {},
      create: { locationId: 'PNT-004', name: 'Punto Venta Chapinero', type: LocationType.STORE, city: 'Bogotá', address: 'Cl 57 #13-20, Local 4', schedule: 'Lun-Dom 9am-8pm', contactName: 'Claudia Vera', lat: 4.6482, lng: -74.0634 },
    }),
    prisma.location.upsert({
      where: { locationId: 'PNT-005' },
      update: {},
      create: { locationId: 'PNT-005', name: 'Bodega Proveedor Textil SA', type: LocationType.CLIENT_WAREHOUSE, city: 'Bogotá', address: 'Cra 30 #1A-52 Puente Aranda', schedule: 'Lun-Vie 7am-4pm', contactName: 'Hernán Pinto', lat: 4.6097, lng: -74.1011 },
    }),
    prisma.location.upsert({
      where: { locationId: 'PNT-006' },
      update: {},
      create: { locationId: 'PNT-006', name: 'Almacén Distribuidora Costa', type: LocationType.CLIENT_WAREHOUSE, city: 'Barranquilla', address: 'Cra 46 #72-15, Galapa', schedule: 'Lun-Sáb 7:30am-5pm', contactName: 'Sandra Díaz', lat: 10.9685, lng: -74.7813 },
    }),
  ])

  // Trips
  const makeHistory = (status: TripStatus) => JSON.stringify([
    { status: 'PROG', timestamp: new Date().toISOString(), observations: 'Viaje creado' },
    ...(status !== 'PROG' ? [{ status, timestamp: new Date().toISOString(), observations: '' }] : []),
  ])

  const [t001, t002, t003, t004, t005] = await Promise.all([
    prisma.trip.upsert({
      where: { tripId: 'VJE-20250415-001' },
      update: {},
      create: { tripId: 'VJE-20250415-001', driverId: d001.id, vehicleId: vABC.id, originId: p001.id, destinationId: p003.id, erpDocType: ErpDocType.PED, erpDocNumber: 'PED-7821', scheduledAt: new Date('2025-04-15T06:30:00'), status: TripStatus.ENTG, statusHistory: makeHistory(TripStatus.ENTG) },
    }),
    prisma.trip.upsert({
      where: { tripId: 'VJE-20250415-002' },
      update: {},
      create: { tripId: 'VJE-20250415-002', driverId: d003.id, vehicleId: vLMN.id, originId: p002.id, destinationId: p006.id, erpDocType: ErpDocType.TRB, erpDocNumber: 'TRB-3310', scheduledAt: new Date('2025-04-15T08:00:00'), status: TripStatus.TRANS, statusHistory: makeHistory(TripStatus.TRANS) },
    }),
    prisma.trip.upsert({
      where: { tripId: 'VJE-20250415-003' },
      update: {},
      create: { tripId: 'VJE-20250415-003', driverId: d002.id, vehicleId: vXYZ.id, originId: p005.id, destinationId: p001.id, erpDocType: ErpDocType.REQ, erpDocNumber: 'REQ-1145', scheduledAt: new Date('2025-04-15T14:00:00'), status: TripStatus.PROG, statusHistory: makeHistory(TripStatus.PROG) },
    }),
    prisma.trip.upsert({
      where: { tripId: 'VJE-20250414-004' },
      update: {},
      create: { tripId: 'VJE-20250414-004', driverId: d005.id, vehicleId: vPQR.id, originId: p001.id, destinationId: p004.id, erpDocType: ErpDocType.FET, erpDocNumber: 'FET-9901', scheduledAt: new Date('2025-04-14T11:00:00'), status: TripStatus.NOV, statusHistory: makeHistory(TripStatus.NOV), observations: 'Accidente menor en vía' },
    }),
    prisma.trip.upsert({
      where: { tripId: 'VJE-20250413-005' },
      update: {},
      create: { tripId: 'VJE-20250413-005', driverId: d001.id, vehicleId: vABC.id, originId: p003.id, destinationId: p002.id, erpDocType: ErpDocType.OCN, erpDocNumber: 'OCN-0045', scheduledAt: new Date('2025-04-13T07:00:00'), status: TripStatus.ENTG, statusHistory: makeHistory(TripStatus.ENTG) },
    }),
  ])

  // Appointments
  await Promise.all([
    prisma.appointment.upsert({
      where: { appointmentId: 'CIT-001' },
      update: {},
      create: { appointmentId: 'CIT-001', tripId: t001.id, locationId: p003.id, scheduledAt: new Date('2025-04-15T10:00:00'), duration: 60, status: AppointmentStatus.COMPLETED, confirmedBy: 'DRV-001 vía WhatsApp' },
    }),
    prisma.appointment.upsert({
      where: { appointmentId: 'CIT-002' },
      update: {},
      create: { appointmentId: 'CIT-002', tripId: t002.id, locationId: p006.id, scheduledAt: new Date('2025-04-15T15:30:00'), duration: 30, status: AppointmentStatus.CONFIRMED, confirmedBy: 'DRV-003 vía WhatsApp' },
    }),
    prisma.appointment.upsert({
      where: { appointmentId: 'CIT-003' },
      update: {},
      create: { appointmentId: 'CIT-003', tripId: t003.id, locationId: p001.id, scheduledAt: new Date('2025-04-15T16:00:00'), duration: 30, status: AppointmentStatus.PENDING },
    }),
    prisma.appointment.upsert({
      where: { appointmentId: 'CIT-004' },
      update: {},
      create: { appointmentId: 'CIT-004', tripId: t004.id, locationId: p004.id, scheduledAt: new Date('2025-04-14T13:00:00'), duration: 30, status: AppointmentStatus.NO_SHOW, confirmedBy: 'DRV-005 vía WhatsApp' },
    }),
    prisma.appointment.upsert({
      where: { appointmentId: 'CIT-005' },
      update: {},
      create: { appointmentId: 'CIT-005', tripId: t005.id, locationId: p002.id, scheduledAt: new Date('2025-04-13T09:30:00'), duration: 60, status: AppointmentStatus.COMPLETED, confirmedBy: 'DRV-001 vía WhatsApp' },
    }),
  ])

  // Credit Notes
  await Promise.all([
    prisma.creditNote.upsert({
      where: { ncId: 'NC-2025-001' },
      update: {},
      create: { ncId: 'NC-2025-001', tripId: t005.id, reason: 'Mercancía dañada en tránsito', amount: 450000, status: CreditNoteStatus.APPROVED, requestedBy: 'coordinador@calypso.app' },
    }),
    prisma.creditNote.upsert({
      where: { ncId: 'NC-2025-002' },
      update: {},
      create: { ncId: 'NC-2025-002', tripId: t004.id, reason: 'Entrega incompleta', amount: 210000, status: CreditNoteStatus.REVIEWING, requestedBy: 'coordinador@calypso.app' },
    }),
    prisma.creditNote.upsert({
      where: { ncId: 'NC-2025-003' },
      update: {},
      create: { ncId: 'NC-2025-003', tripId: t001.id, reason: 'Producto equivocado entregado', amount: 890000, status: CreditNoteStatus.PENDING, requestedBy: 'coordinador@calypso.app' },
    }),
  ])

  console.log('✅ Seed completado exitosamente')
  console.log('📧 Usuarios de prueba:')
  console.log('   Coordinador: coordinador@calypso.app / Calypso2025!')
  console.log('   Conductor:   cmendoza@logistica.app  / Calypso2025!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
