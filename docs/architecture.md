# Arquitectura

## Componentes principales

- **MailPollingService**: ciclos periodicos de lectura
- **ImapMailReaderService**: conexion IMAP a Gmail
- **OtpExtractorService**: extrae OTP con regex
- **OtpValidatorService**: valida TTL
- **TeamsWebhookNotifierService**: envia a Teams via webhook

## Reglas clave

- Procesa solo correos no leidos
- Filtra por remitente y palabras clave (opcional)
- OTP debe cumplir regex y TTL
- Se marca como leido solo si se procesa exitosamente
- Si falla Teams, reintentar en siguiente ciclo

## Manejo de errores

- Errores IMAP o HTTP se registran sin detener el polling
- Fallos por mensaje no detienen el lote
- Trazabilidad por `messageId` / `uid`
