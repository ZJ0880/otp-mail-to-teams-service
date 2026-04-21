# OTP Mail to Teams Service

Servicio backend en NestJS que mantiene el flujo de correo OTP hacia Teams y, ademas, gestiona solicitudes de acceso/ticket con aprobacion y auditoria.

## Caracteristicas

- Autenticacion JWT con roles (`ADMIN`, `OPERATOR`, `VIEWER`).
- Gestion de usuarios (listar, registrar, cambiar rol, desactivar).
- Lectura IMAP de correos con polling, filtros y extraccion de OTP.
- Solicitudes de ticket con metadata (persona, email, plataforma, curso).
- Tarjetas de Teams con enlaces de aprobacion firmados y expirables.
- Endpoint de aprobacion para acciones `approve` / `reject` / `details`.
- Auditoria de eventos sobre solicitudes y acciones.

## Requisitos

- Node.js 20+
- Cuenta de correo con IMAP habilitado para el flujo OTP.
- Webhook de Microsoft Teams habilitado.
- PostgreSQL y Redis disponibles (por docker compose o infraestructura propia).

## Instalacion

```bash
npm install
```

## Configuracion

1. Duplica `.env.example` a `.env`.
2. Ajusta valores reales de base de datos, auth y Teams.

Variables clave:

- `DATABASE_URL`
- `REDIS_URL`
- `APP_JWT_SECRET`, `AUTH_TOKEN_TTL_MINUTES`, `AUTH_JWT_ISSUER`, `AUTH_JWT_AUDIENCE`
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_MAILBOX`
- `MAIL_ALLOWED_FROM`, `MAIL_SUBJECT_KEYWORDS`, `OTP_REGEX_PATTERNS`, `OTP_TTL_MINUTES`
- `APP_ENABLE_POLLING`, `APP_POLLING_INTERVAL_SECONDS`
- `TEAMS_WEBHOOK_URL`, `TEAMS_MESSAGE_TEMPLATE`
- `APP_ADMIN_PANEL_BASE_URL`, `APP_APPROVAL_LINK_SECRET`, `APP_APPROVAL_LINK_TTL_MINUTES`

## Ejecucion

Desarrollo:

```bash
npm run start:dev
```

Build + produccion:

```bash
npm run build
npm start
```

## Calidad

```bash
npm run lint
npm test
```

## Estructura

```
src/
  auth/         - autenticacion, roles, usuarios
  config/       - env y configuracion tipada
  database/     - prisma y repositorios
  security/     - cifrado y hashing
  settings/     - perfiles y validaciones
  teams/        - notificacion y adaptive cards
  workflow/     - solicitudes, aprobacion y auditoria
```

## Flujo

1. Un usuario autenticado crea una solicitud en `/api/tickets/requests`.
2. La solicitud queda en estado `pending` y se envia una tarjeta a Teams con enlaces firmados.
3. El aprobador abre `/api/approvals/:token`, revisa detalles y ejecuta `approve` o `reject`.
4. El estado se actualiza y queda trazado en auditoria.
5. En paralelo, el polling de correo sigue leyendo IMAP, extrayendo OTP y publicando a Teams cuando `APP_ENABLE_POLLING=true`.

## Seguridad

- Webhook en canal privado de Teams.
- No loguear OTP, secretos ni tokens.
- Usa secreto independiente para links de aprobacion.
- Maneja secretos en gestor seguro (Vault, .env local, Secrets).
