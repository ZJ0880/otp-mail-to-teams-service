# Runbook

## Preparacion inicial

### Correo OTP

1. Crear el buzón dedicado para OTP.
2. Activar IMAP en el proveedor.
3. Configurar credenciales del buzón en `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER` y `MAIL_PASSWORD`.
4. Definir `MAIL_MAILBOX`, filtros y expresiones OTP si aplica.

### Teams

1. Crear canal operativo
2. Configurar Incoming Webhook
3. Guardar URL en `TEAMS_WEBHOOK_URL`

### Aprobaciones

1. Configurar `APP_ADMIN_PANEL_BASE_URL` con la URL publica del backend que expone `/api/approvals`.
2. Configurar `APP_APPROVAL_LINK_SECRET` con secreto fuerte.
3. Definir `APP_APPROVAL_LINK_TTL_MINUTES` segun politica de seguridad.

## Arranque

```bash
npm install
npm run build
npm start
```

## Diagnostico

**No crea solicitudes:**
- Validar token JWT y rol de usuario (`ADMIN` o `OPERATOR`).
- Revisar que exista un perfil de credenciales por defecto.

**No procesa correos OTP:**
- Validar `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER` y `MAIL_PASSWORD`.
- Confirmar que `APP_ENABLE_POLLING=true` cuando se espera el ciclo automatico.
- Revisar filtros de remitente/asunto y la expresion OTP.

**No publica a Teams:**
- Validar `TEAMS_WEBHOOK_URL`
- Revisar conectividad HTTPS saliente
- Revisar logs de `RequestApprovalNotifierService`

**No funcionan enlaces de aprobacion:**
- Validar `APP_APPROVAL_LINK_SECRET`
- Verificar expiracion (`APP_APPROVAL_LINK_TTL_MINUTES`)
- Confirmar `APP_ADMIN_PANEL_BASE_URL` publico/accesible

## Seguridad

- Rotar credenciales periodicamente
- Limitar acceso al canal Teams
- No loguear secretos ni tokens
- Ejecutar con reinicio automatico (systemd/Docker)
