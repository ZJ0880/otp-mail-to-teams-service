# OTP Mail to Teams Service

Servicio backend en NestJS que lee correos reenviados con OTP desde una cuenta dedicada, extrae el codigo vigente y lo publica en Microsoft Teams usando Incoming Webhook.

## Caracteristicas

- Lectura automatica de correos no leidos por IMAP.
- Filtrado por remitentes y palabras clave de asunto.
- Extraccion de OTP por patrones regex configurables.
- Validacion de vigencia por TTL.
- Publicacion en Teams via webhook.
- Logs por ciclo y por mensaje para trazabilidad.
- Arquitectura basada en puertos y adaptadores para facilitar pruebas y cambios.

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

- `src/config`: validacion y acceso tipado de configuracion.
- `src/mail`: puerto de lectura y adaptador IMAP.
- `src/otp`: extraccion y validacion de OTP.
- `src/teams`: puerto de notificacion y adaptador webhook.
- `src/workflow`: orquestacion del caso de uso y polling.

## Flujo funcional

1. `MailPollingService` ejecuta ciclos periodicos.
2. `ImapMailReaderService` obtiene mensajes no leidos.
3. `OtpProcessingService` filtra, extrae y valida OTP.
4. `TeamsWebhookNotifierService` envia mensaje a Teams.
5. Si el proceso de un correo termina (relevante o no), se marca como leido.
6. Si falla el envio a Teams, no se marca como leido para reintento en el siguiente ciclo.

## Seguridad recomendada

- Usa contrasena de aplicacion en Gmail (no la principal).
- Restringe webhook por canal dedicado y controla miembros del canal.
- No publiques OTP en logs.
- Maneja secretos con Azure Key Vault / GitHub Secrets / gestor equivalente.

## Principios de diseno aplicados

- **SRP**: cada servicio tiene una responsabilidad clara.
- **OCP**: puertos para cambiar IMAP o Teams sin tocar logica de negocio.
- **LSP/ISP**: contratos pequenos por dominio (`MailReaderPort`, `TeamsNotifierPort`).
- **DIP**: el workflow depende de interfaces, no de implementaciones concretas.

## Proximos pasos sugeridos

- Agregar store de idempotencia por `messageId`.
- Agregar metricas (Prometheus/OpenTelemetry).
- Agregar pruebas de integracion con servidor IMAP de test.
