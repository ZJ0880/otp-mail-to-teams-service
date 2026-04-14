# Runbook

## Preparacion inicial

### Correo dedicado

1. Crear buzon para OTP
2. Activar IMAP
3. Generar app password (si Gmail + 2FA)
4. Configurar regla de reenvio de OTP

### Teams

1. Crear canal operativo
2. Configurar Incoming Webhook
3. Guardar URL en `TEAMS_WEBHOOK_URL`

## Arranque

```bash
npm install
npm run build
npm start
```

## Diagnostico

**No procesa correos:**
- Validar `MAIL_HOST`, `MAIL_PORT`, credenciales
- Confirmar que `MAIL_MAILBOX` existe

**No publica a Teams:**
- Validar `TEAMS_WEBHOOK_URL`
- Revisar conectividad HTTPS saliente

**No extrae OTP:**
- Ajustar `OTP_REGEX_PATTERNS` 
- Revisar contenido real del correo

## Seguridad

- Rotar credenciales periodicamente
- Limitar acceso al canal Teams
- No loguear OTP
- Ejecutar con reinicio automatico (systemd/Docker)

1. Todos los casos A deben fallar en validacion con mensaje claro.
2. Casos B y C deben registrar evento esperado sin comportamiento silencioso.
3. Flujo feliz debe seguir funcionando tras restaurar configuracion valida.
