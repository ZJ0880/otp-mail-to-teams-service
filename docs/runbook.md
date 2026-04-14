# Runbook operativo

## Preparacion de cuenta de correo

1. Crear buzon dedicado para OTP.
2. Activar IMAP en la cuenta.
3. Generar password de aplicacion (si usa Gmail con 2FA).
4. Configurar regla de reenvio automatica de OTP hacia este buzon.

## Preparacion de Teams

1. Crear canal o chat operativo para OTP.
2. Configurar Incoming Webhook.
3. Guardar URL en `TEAMS_WEBHOOK_URL`.

## Arranque del servicio

```bash
npm install
npm run build
npm start
```

## Verificacion funcional

1. Enviar correo de prueba con OTP de 6 digitos.
2. Confirmar que llega al buzon dedicado como no leido.
3. Verificar publicacion en Teams.
4. Verificar que correo queda marcado como leido.

## Diagnostico rapido

- Si no procesa correos:
  - validar `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, credenciales.
  - validar que `MAIL_MAILBOX` exista.
- Si procesa pero no publica:
  - validar `TEAMS_WEBHOOK_URL`.
  - revisar bloqueo de red saliente HTTPS.
- Si no extrae OTP:
  - ajustar `OTP_REGEX_PATTERNS`.
  - revisar contenido real del correo reenviado.

## Operacion segura

- Rotar credenciales periodicamente.
- Limitar acceso al canal de Teams.
- No incluir OTP en logs ni en alertas abiertas.
- Ejecutar como servicio de sistema con reinicio automatico.

## Checklist QA de errores y entradas invalidas

Ejecuta cada caso de prueba de forma aislada (uno por uno), vuelve al valor correcto y continua con el siguiente.

Comando base para cada validacion:

```bash
npm run start:dev
```

### A. Validacion de variables de entorno al arranque

1. Caso: `MAIL_PORT=abc`
  Resultado esperado: arranque bloqueado con error de validacion (`MAIL_PORT` invalido).
2. Caso: `MAIL_SECURE=talvez`
  Resultado esperado: arranque bloqueado con error de validacion (`MAIL_SECURE` invalido).
3. Caso: `OTP_TTL_MINUTES=0`
  Resultado esperado: arranque bloqueado por rango invalido (minimo 1).
4. Caso: `APP_POLLING_INTERVAL_SECONDS=2`
  Resultado esperado: arranque bloqueado por rango invalido (minimo 5).
5. Caso: `TEAMS_WEBHOOK_URL=hola`
  Resultado esperado: arranque bloqueado por URL invalida.
6. Caso: `MAIL_PASSWORD=` (vacio)
  Resultado esperado: arranque bloqueado por valor requerido ausente.

### B. Errores operativos durante procesamiento

1. Caso: `MAIL_PASSWORD` incorrecto
  Resultado esperado: error de autenticacion IMAP, sin caida silenciosa.
2. Caso: `TEAMS_WEBHOOK_URL` apuntando a dominio caido
  Resultado esperado: error de envio, el mensaje no debe marcarse como leido para reintento.
3. Caso: `OTP_REGEX_PATTERNS=(`
  Resultado esperado: falla por regex invalida al intentar compilar patron.

### C. Casos de negocio y filtrado

1. Caso: correo sin OTP
  Resultado esperado: log `No OTP found in message` y correo marcado como leido.
2. Caso: OTP vencido (enviar correo y esperar mas que `OTP_TTL_MINUTES`)
  Resultado esperado: log `OTP expired` y correo marcado como leido.
3. Caso: filtro de remitente restrictivo (`MAIL_ALLOWED_FROM` con dominio no coincidente)
  Resultado esperado: log `Message ignored by filter`.

### D. Evidencia recomendada por caso

1. Captura de consola con logs Nest (inicio, ciclo, resultado).
2. Estado del correo (leido/no leido) despues del procesamiento.
3. Evidencia de webhook (mensaje recibido o error).

### E. Criterio de salida de QA

1. Todos los casos A deben fallar en validacion con mensaje claro.
2. Casos B y C deben registrar evento esperado sin comportamiento silencioso.
3. Flujo feliz debe seguir funcionando tras restaurar configuracion valida.
