# OTP Mail to Teams Service

Servicio backend en NestJS que lee correos reenviados con OTP desde una cuenta dedicada, extrae el codigo vigente y lo publica en Microsoft Teams usando Incoming Webhook.

## Caracteristicas

- Lectura automatica de correos IMAP (Gmail).
- Filtrado por remitentes y palabras clave de asunto.
- Extraccion de OTP con regex configurables.
- Validacion de vigencia (TTL).
- Publicacion en Teams via webhook.
- Logs en cada ciclo y mensaje.

## Requisitos

- Node.js 20+
- Cuenta de correo dedicada con acceso IMAP.
- Webhook de Microsoft Teams habilitado.

## Instalacion

```bash
npm install
```

## Configuracion

1. Duplica `.env.example` a `.env`.
2. Ajusta valores reales de correo, regex y webhook.

Variables clave:

- `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_MAILBOX`
- `MAIL_ALLOWED_FROM` (csv opcional)
- `MAIL_SUBJECT_KEYWORDS` (csv opcional)
- `OTP_REGEX_PATTERNS` (regex separadas por `||`)
- `OTP_TTL_MINUTES`
- `APP_POLLING_INTERVAL_SECONDS`
- `TEAMS_WEBHOOK_URL`
- `TEAMS_MESSAGE_TEMPLATE` con placeholders `{otp}`, `{from}`, `{subject}`, `{receivedAt}`

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
  config/       - env y configuracion tipada
  mail/         - lectura IMAP
  otp/          - extraccion y validacion
  teams/        - webhook de Teams
  workflow/     - orquestacion y polling
```

## Flujo

1. Poll periodico para traer correos no leidos.
2. Filtra por remitente y palabras clave.
3. Extrae OTP del asunto o cuerpo.
4. Valida vigencia (TTL).
5. Envia a Teams.
6. Marca como leido.

## Seguridad

- Usa app password de Gmail (no la principal).
- Webhook en canal privado de Teams.
- No loguear OTP.
- Maneja secretos en gestor seguro (Vault, .env local, Secrets).
