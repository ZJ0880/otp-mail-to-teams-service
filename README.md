# OTP Mail to Teams Service

Servicio backend en NestJS para gestionar solicitudes de credenciales con enfoque hexagonal, aprobacion y auditoria.

## Caracteristicas

- Autenticacion JWT con roles (`ADMIN`, `OPERATOR`, `VIEWER`).
- Gestion de usuarios (listar, registrar, cambiar rol, desactivar).
- Solicitudes de credenciales con metadata (email, plataforma, curso, motivo).
- Flujo de aprobacion y rechazo con token firmado y expiracion.
- Endpoints publicos, administrativos e integracion para ejecutar decisiones.
- Auditoria de eventos de creacion y decision de solicitudes.

## Requisitos

- Node.js 20+
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
- `TEAMS_WEBHOOK_URL`
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
  contexts/
    admin-auth/          - autenticacion y sesion administrativa
    credential-requests/ - dominio, application, adapters e infraestructura
  config/       - env y configuracion tipada
  database/     - prisma y acceso base
  security/     - cifrado y hashing
  observability/ - salud y metricas
```

## Flujo

1. Un actor crea una solicitud en `/api/public/credential-requests`.
2. Un administrador lista y revisa en `/api/admin/credential-requests`.
3. El administrador decide con `/api/admin/credential-requests/:id/approve` o `/api/admin/credential-requests/:id/reject`.
4. Integraciones pueden ejecutar decision por token en `/api/integrations/approvals/:token/execute`.
5. Cada cambio queda auditado en la bitacora de eventos.

## Seguridad

- Webhook en canal privado de Teams.
- No loguear OTP, secretos ni tokens.
- Usa secreto independiente para links de aprobacion.
- Maneja secretos en gestor seguro (Vault, .env local, Secrets).
