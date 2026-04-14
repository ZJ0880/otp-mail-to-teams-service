# Arquitectura tecnica

## Contexto

El sistema automatiza la consulta de OTP recibidos por correo reenviado para publicarlos en Teams y reducir tiempos operativos.

## Estilo de arquitectura

Se aplica una arquitectura por capas con enfoque hexagonal ligero:

- Capa de aplicacion: orquesta casos de uso.
- Capa de dominio: contratos y modelos de negocio.
- Capa de infraestructura: IMAP y Webhook Teams.

## Componentes

### Workflow

- `MailPollingService`: agenda el ciclo de lectura.
- `OtpProcessingService`: caso de uso principal.

### Mail

- `MailReaderPort`: contrato de lectura y acknowledge.
- `ImapMailReaderService`: implementacion IMAP via `imapflow`.

### OTP

- `OtpExtractorService`: extrae codigo usando regex configurables.
- `OtpValidatorService`: valida vigencia temporal del OTP.

### Teams

- `TeamsNotifierPort`: contrato de publicacion.
- `TeamsWebhookNotifierService`: envio HTTP al webhook.

## Reglas de negocio

- Se procesa solo correo no leido.
- Se puede restringir por remitente y/o palabras clave.
- El OTP debe cumplir regex y TTL.
- Solo tras procesar con exito el correo se marca como leido.
- Si falla un paso critico (por ejemplo Teams), el correo queda pendiente para reintento.

## Manejo de errores

- Errores de conexion IMAP o HTTP se registran con `Logger`.
- El polling evita ejecucion concurrente para no duplicar procesamiento.
- Fallos por mensaje no detienen el resto del lote.

## Trazabilidad

- Se usa `messageId` (o `uid`) como `traceId` por mensaje.
- Se registran eventos: ignorado, sin OTP, vencido, publicado, error.

## Extensibilidad

- Cambiar canal de salida (Slack, SMS) requiere nuevo adaptador de `TeamsNotifierPort`.
- Cambiar fuente de entrada (Graph API, Pub/Sub) requiere nuevo adaptador de `MailReaderPort`.
- Reglas de parseo pueden evolucionar sin tocar infraestructura.
