# Historias de Usuario — Calypso Delivery
> Plataforma logística marca blanca · Hackathon Builders Lab 2025

---

## Rol: Coordinador Logístico

### HU-01 · Login
**Como** coordinador, **quiero** iniciar sesión con email y contraseña **para** acceder al panel de administración.
- Criterio: credenciales incorrectas muestran error sin revelar si el email existe
- Criterio: 5 intentos fallidos bloquean el acceso por 15 minutos

### HU-02 · Dashboard de operación
**Como** coordinador, **quiero** ver un dashboard con métricas en tiempo real **para** monitorear el estado de la flota.
- Criterio: muestra conteo de viajes por estado (Programado, En tránsito, Novedad, Entregado hoy)
- Criterio: muestra mapa con marcadores de puntos de recogida y entrega
- Criterio: marcadores diferenciados por color: rojo=origen, verde=destino, azul=viaje activo

### HU-03 · Crear viaje
**Como** coordinador, **quiero** crear un nuevo viaje asignando conductor, vehículo y puntos **para** programar operaciones logísticas.
- Criterio: ID autogenerado con formato VJE-YYYYMMDD-###
- Criterio: solo permite asignar conductores en estado Activo
- Criterio: solo permite asignar vehículos en estado Disponible
- Criterio: tipo de documento ERP requerido (REQ/TRB/PED/FET/OCN)

### HU-04 · Listar y filtrar viajes
**Como** coordinador, **quiero** ver todos los viajes con filtros por estado, conductor y fecha **para** gestionar la operación diaria.
- Criterio: filtros por estado, conductor y rango de fechas
- Criterio: tabla muestra ID, conductor, origen→destino, estado, fecha de salida

### HU-05 · Ver detalle de viaje
**Como** coordinador, **quiero** ver el detalle completo de un viaje incluyendo historial de estados **para** hacer seguimiento de incidencias.
- Criterio: muestra todos los cambios de estado con timestamp y observaciones
- Criterio: muestra el checklist completado si existe

### HU-06 · Cambiar estado de viaje
**Como** coordinador, **quiero** cambiar el estado de un viaje **para** reflejar novedades o completar operaciones.
- Criterio: solo permite transiciones válidas (PROG→TRANS, TRANS→ENTG, TRANS→NOV, NOV→TRANS, NOV→CANC)
- Criterio: requiere campo de observaciones al registrar Novedad o Cancelación

### HU-07 · Gestionar conductores
**Como** coordinador, **quiero** crear y administrar perfiles de conductores **para** mantener el registro operativo de la flota humana.
- Criterio: ID autogenerado DRV-###
- Criterio: requiere cédula, licencia (categoría + vencimiento), estado
- Criterio: muestra historial de viajes realizados por el conductor

### HU-08 · Gestionar vehículos
**Como** coordinador, **quiero** registrar y administrar la flota de vehículos **para** asignarlos a viajes según capacidad y disponibilidad.
- Criterio: soporta tipos Moto, Van, Camión 2 ejes, Camión 3 ejes
- Criterio: muestra estado actual: Disponible, En ruta, En mantenimiento, Dado de baja
- Criterio: alerta visual cuando SOAT vence en menos de 30 días

### HU-09 · Gestionar citas logísticas
**Como** coordinador, **quiero** agendar citas de recepción en bodegas externas **para** evitar congestión en puntos de entrega.
- Criterio: slots de 30 o 60 minutos según tipo de carga
- Criterio: respeta horario configurado de cada bodega
- Criterio: al confirmar, notifica al conductor
- Criterio: si conductor no llega en 15 min de gracia → estado "No presentado"
- Criterio: solo coordinador puede reasignar cita cancelada

### HU-10 · Gestionar notas crédito
**Como** coordinador, **quiero** registrar solicitudes de notas crédito **para** gestionar reclamaciones por mercancía dañada o no entregada.
- Criterio: flujo: Pendiente → En revisión → Aprobada/Rechazada
- Criterio: requiere evidencia fotográfica y referencia al viaje

---

## Rol: Conductor

### HU-11 · Login conductor
**Como** conductor, **quiero** iniciar sesión desde mi celular **para** acceder a mis viajes del día.
- Criterio: vista mobile-first optimizada para pantallas de 375px+
- Criterio: solo ve SUS propios viajes, nunca los de otros conductores

### HU-12 · Ver mis viajes del día
**Como** conductor, **quiero** ver la lista de mis viajes programados para hoy **para** planificar mi jornada.
- Criterio: muestra origen, destino, hora de salida y estado
- Criterio: ordena por hora de salida ascendente

### HU-13 · Completar checklist del vehículo
**Como** conductor, **quiero** completar el checklist de inspección de mi vehículo **para** certificar que está en condiciones de operar.
- Criterio: 10 ítems con sus tipos de respuesta (OK/Novedad, Sí/No, Porcentaje)
- Criterio: si combustible < 20% o cualquier ítem crítico falla → no puede iniciar el viaje
- Criterio: muestra en rojo los ítems que bloquean la salida
- Criterio: permite adjuntar foto para "Carrocería sin daños visibles"
- Criterio: checklist debe completarse ANTES de que el viaje pase a "En tránsito"

### HU-14 · Actualizar estado de mi viaje
**Como** conductor, **quiero** actualizar el estado de mi viaje desde el campo **para** informar al coordinador del progreso.
- Criterio: solo puede actualizar sus propios viajes
- Criterio: campo de observaciones obligatorio al reportar Novedad
- Criterio: transiciones válidas respetadas igual que en el sistema

---

## Reglas transversales

- **Separación de roles**: el Conductor no ve ni accede a datos del Coordinador y viceversa
- **Seguridad**: todos los endpoints privados requieren JWT válido con rol correcto
- **IDs**: siempre UUIDs en la API (nunca IDs secuenciales expuestos)
- **Auditoría**: todo cambio de estado de viaje queda registrado con timestamp y usuario
