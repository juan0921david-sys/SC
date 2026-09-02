# Diseño del sistema de cobro

## Propósito y alcance

Sistema de cobro para una empresa real, construido inicialmente como monolito modular. Tendrá una aplicación web para administración y una aplicación móvil para trabajadores/cobradores. Ambas consumirán la misma API REST; ninguna se conectará directamente a PostgreSQL ni a Supabase.

El sistema administrará clientes, solicitudes y créditos aprobados, cuotas, pagos, abonos, mora, calendario, historial, comprobantes, reportes y auditoría.

## Arquitectura

```text
React + Vite (administración) ─┐
                               ├─ API REST Node.js + Express ─ PostgreSQL en Supabase
React Native + Expo (cobradores)┘
```

- La API concentra autenticación, autorización, validaciones, reglas de negocio, cálculos y auditoría.
- PostgreSQL en Supabase será infraestructura de datos y respaldos; las aplicaciones no usarán sus credenciales ni ejecutarán reglas directamente allí.
- La API se versionará como `/api/v1/...`.
- Los valores monetarios se almacenarán como enteros en pesos COP, nunca como punto flotante.
- Fechas y vencimientos se interpretarán en la zona horaria de Colombia.
- Operaciones financieras críticas usarán transacciones: aprobar un crédito, registrar un pago, reversar o ajustar un movimiento.

## Módulos internos

- `auth`: inicio de sesión, sesiones y tokens.
- `users`: cuentas internas y roles.
- `clients`: identidad e historial de clientes.
- `guarantors`: codeudores.
- `credit-applications`: solicitud, revisión y aprobación.
- `credits`: condiciones aprobadas y estado del crédito.
- `installments`: generación, estado y saldos de cuotas.
- `payments`: recepción, distribución y reversión de pagos.
- `calendar`: consultas de vencimientos y atrasos.
- `receipts`: comprobantes recuperables.
- `reports`: consultas agregadas de operación.
- `audit`: trazabilidad transversal.
- `shared`: validaciones, errores y utilidades comunes.

Cada módulo tendrá rutas, servicios y acceso a datos propios. La comunicación entre módulos será por interfaces internas, evitando consultas y lógica dispersa.

## Roles y seguridad

Las cuentas se crearán inicialmente fuera de la aplicación por el propietario o desarrollo. La base de autorización queda preparada para ampliar la gestión de usuarios después.

### Trabajador

- Inicia sesión y consulta clientes, créditos, cuotas, saldos, historial y calendario autorizado.
- Crea solicitudes de crédito, con cliente nuevo o existente.
- Registra pagos y abonos.
- Consulta y genera comprobantes de pagos.
- No aprueba solicitudes, no cambia condiciones aprobadas, no edita pagos registrados y no accede a funciones administrativas.

### Administrador

- Consulta toda la operación.
- Revisa solicitudes, corrige sus datos y las aprueba o rechaza.
- Gestiona créditos, calendario, historial, comprobantes, reportes y configuración futura permitida.
- Corrige información financiera solo mediante ajustes o reversiones auditables; no sobrescribe silenciosamente pagos, cuotas ni créditos aprobados.

### Controles obligatorios

- Contraseñas con hash robusto.
- Tokens de sesión de corta duración y renovación segura.
- Autorización aplicada en cada endpoint.
- Límite de intentos de inicio de sesión y validación estricta de entradas.
- Registros de auditoría sin contraseñas, tokens ni secretos.
- Claves de idempotencia al registrar pagos para prevenir duplicados por reintentos de red.

## Flujo de cliente y crédito

Un cliente y un crédito son entidades diferentes: un cliente puede conservar varios créditos e historial. En la experiencia inicial, no habrá un formulario aislado para crear clientes: un cliente nuevo siempre se registra dentro de una solicitud de crédito.

1. El trabajador crea una solicitud con datos del cliente, condiciones del crédito y codeudor cuando corresponda.
2. La solicitud puede estar en `borrador` o `pendiente`.
3. Un administrador puede corregir sus datos sin obligar al trabajador a crearla de nuevo.
4. El administrador la `aprueba` o `rechaza`, guardando usuario, fecha y observación.
5. Solo al aprobar se crea un crédito `activo`, se congelan sus condiciones y se generan cuotas y calendario.

Una solicitud aprobada conserva quién la creó, revisó, corrigió y aprobó.

## Datos mínimos y cálculo del crédito

Datos mínimos de una solicitud:

- Cliente: nombre completo y cédula única.
- Crédito: valor prestado, tasa de interés, frecuencia, número de cuotas y fecha del primer vencimiento.
- Codeudor cuando aplique.

Frecuencias: diaria, semanal, quincenal y mensual.

Reglas iniciales:

- El interés es fijo al crear el crédito: `valor prestado × tasa`.
- Total programado: `valor prestado + interés fijo`.
- Cada cuota base resulta de dividir el total programado entre el número de cuotas.
- Los pesos sobrantes de la división se agregan a las primeras cuotas para que la suma sea exacta.
- La frecuencia y fecha inicial generan los vencimientos.
- Tasa, frecuencia, número de cuotas, fechas y valores quedan congelados tras la aprobación. Un cambio futuro requerirá reestructuración o ajuste auditable; no se editan las cuotas existentes.

## Cuotas, pagos, abonos y mora

Cada cuota contiene número, vencimiento, valor base, saldo base, mora pendiente y estado.

- Un pago es un registro inmutable con consecutivo, fecha/hora, cliente, crédito, trabajador receptor y monto en COP.
- Un pago o abono se dirige a una cuota y reduce primero su saldo base.
- La mora no tiene interés. Se acumula a razón de $10.000 COP por cada día completo de atraso mientras exista saldo base pendiente.
- El día de vencimiento no genera mora. Si la cuota vence un lunes y se paga un miércoles, corresponde una mora de $10.000 COP por un día de atraso.
- Un abono no mueve el vencimiento: si deja saldo al terminar la fecha de vencimiento, empieza a generar mora desde el día siguiente.
- Valor exigible: saldo base pendiente + mora acumulada.
- Una cuota cuya base se pagó pero mantiene mora sigue con mora pendiente; solo está totalmente pagada cuando ambos saldos son cero.
- Un pago no se elimina ni se edita. Errores se corrigen mediante una reversión o ajuste vinculado al movimiento original, con motivo y autor.

### Excedentes

Si el cliente entrega más que el total exigible para una cuota, el excedente se aplica automáticamente, en orden, a las siguientes cuotas pendientes del mismo crédito. Por ejemplo, si una cuota de $280.000 recibe $380.000, $100.000 se abonan a la siguiente cuota; si esta era de $280.000, queda con saldo base de $180.000.

La distribución se guarda de forma explícita para cada cuota. Si no existen cuotas pendientes, el importe queda como saldo a favor del crédito, visible a administración.

## Calendario, historial, comprobantes y reportes

- El calendario es una vista derivada de cuotas; no será una fuente independiente de verdad. Permitirá consultar vencimientos de hoy, próximos, atrasados y pagados.
- Un día del calendario mostrará cliente, cédula, crédito, saldo base, mora y total exigible.
- Los créditos pagados no se eliminan: quedan cerrados y consultables en el historial del cliente.
- Cada pago produce un comprobante con consecutivo único y recuperable. Incluye empresa, fecha/hora, cliente, cédula, crédito, trabajador, monto recibido, distribución entre cuotas/base/mora y saldo restante.
- La primera versión generará un documento descargable y compartible. El formato final (PDF, imagen o ambos) se definirá durante su entrega.
- Reportes iniciales: cartera pendiente, cobros por día/período, mora y recaudo por trabajador. Son consultas de solo lectura sobre los mismos datos operativos.

## Modelo lógico de datos

- `users`: cuentas, rol y estado.
- `clients`: identidad permanente.
- `guarantors`: codeudores.
- `credit_applications`: propuesta de cliente y crédito con su estado.
- `credit_application_reviews`: correcciones, decisiones y observaciones de administración.
- `credits`: crédito aprobado y condiciones congeladas.
- `installments`: cuotas del crédito.
- `payments`: dinero recibido por operación.
- `payment_allocations`: distribución de cada pago entre cuotas y conceptos.
- `payment_reversals` y `financial_adjustments`: cambios financieros trazables.
- `receipts`: información y generación recuperable del comprobante.
- `audit_logs`: bitácora transversal.

```text
Cliente 1 ── N Solicitudes ── 0..1 Crédito aprobado ── N Cuotas
Cliente 1 ── N Créditos
Crédito 1 ── N Pagos ── N Aplicaciones de pago ── N Cuotas
Pago 1 ── 1 Comprobante
```

## Errores y calidad

- Errores coherentes para autenticación requerida, permiso insuficiente, validación, estado inválido, conflicto concurrente e incidencias internas.
- La interfaz no asumirá que una operación se guardó si la API no lo confirma.
- Validaciones de servidor: cédula única, montos positivos, cuota y crédito válidos, estado autorizado, fecha correcta y pago no duplicado.
- Pruebas de cálculos de cuotas y mora, reglas de negocio, endpoints, transacciones y flujos completos.
- Casos mínimos: abonos, mora, excedentes, reversión, aprobación y límites de permisos.

## Orden de implementación

1. Repositorio, API modular, PostgreSQL y autenticación con roles fijos.
2. Solicitudes, aprobación administrativa, clientes y créditos.
3. Generación de cuotas y consultas de calendario.
4. Pagos, abonos, mora, excedentes y auditoría financiera.
5. Comprobantes e historial completo.
6. Reportes, configuración y gestión futura de usuarios.
7. Aplicación móvil sobre los mismos endpoints: búsqueda, consulta y cobro.

## Pendientes deliberados

- Información completa del cliente y del codeudor más allá de nombre y cédula.
- Reglas exactas para cuándo es obligatorio un codeudor.
- Formato final del comprobante descargable.
- Gestión de usuarios y permisos granulares desde la interfaz.
- Reestructuración formal de créditos aprobados.
