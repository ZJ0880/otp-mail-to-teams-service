# Arquitectura

## Componentes principales

- **MailPollingService**: ejecuta el ciclo de lectura IMAP y coordina el procesamiento OTP.
- **ImapMailReaderService**: obtiene correos y los adapta al dominio.
- **OtpExtractorService**: extrae OTP con regex.
- **OtpValidatorService**: valida vigencia del OTP.
- **TeamsWebhookNotifierService**: adapta envios a Teams y tarjetas de aprobacion.
- **TicketRequestsService**: crea/lista/detalla solicitudes y registra auditoria.
- **RequestApprovalNotifierService**: construye y envia tarjetas de aprobacion a Teams.
- **ApprovalLinkService**: firma y valida tokens de aprobacion expirables.
- **ApprovalActionService**: ejecuta acciones approve/reject/details.
- **AuthModule**: login JWT y control de acceso por rol.
- **SettingsModule**: perfiles de configuracion por usuario y validaciones.

## Reglas clave

- Toda solicitud nueva inicia en estado `PENDING`.
- Solo `ADMIN` y `OPERATOR` pueden crear solicitudes.
- `VIEWER` puede consultar, pero no crear ni modificar.
- Los enlaces de aprobacion deben ser firmados y con TTL.
- Las acciones de aprobacion registran auditoria.
- El flujo OTP por correo sigue habilitado cuando `APP_ENABLE_POLLING=true`.

## Manejo de errores

- Errores de validacion retornan `400` con mensaje explicito.
- Errores de permisos retornan `401/403` segun guard/rol.
- Errores de token de aprobacion retornan `400/404`.
- Errores de IMAP o parseo de correo se registran sin detener el polling.
- Fallos de envio a Teams se registran con contexto y permiten diagnostico.
