# MEMORY.md - Destellos Nailsss

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- MVP completo y verificado: landing (hero a dos columnas, servicios, cómo funciona, galería de 4 fotos, horario, FAQ, botón WhatsApp) + webhook de Meta con chatbot de 7 estados + Google Calendar + Supabase.
- Imágenes reales del salón en `public/images/` (hero + 4 galería, todas 1200×1600), rutas y alt en `photos` de `salon.ts`.
- `npm run build` pasa (compila + lint + typecheck). Webhook probado: GET devuelve challenge, POST sin firma ⇒ 401, firma válida ⇒ 200.
- Pendiente de credenciales reales: sin `.env.local` no se puede probar el flujo completo (Calendar/Supabase/Meta).

## Decisiones (y por qué)

- Meta Cloud API directa y Google Calendar con cuenta de servicio: el plan pedía webhooks de Meta; la cuenta de servicio es más estable que OAuth para un MVP.
- Estructura `src/app` (frontend) + `src/backend` (lógica): Next.js exige `app/` dentro de `src/`; monorepo frontend/backend habría complicado Vercel.
- Placeholders centralizados en `src/config/salon.ts`: el salón aún no ha dado servicios, precios ni horarios reales.
- Estado de la conversación en Supabase: la webhook de Meta no tiene memoria entre mensajes.
- Idempotencia por `request_id` + `last_wamid/last_reply` en lugar de tabla de mensajes: cubre los reintentos de Meta con menos tablas.
- Tailwind v4 con `@tailwindcss/postcss` (patrón actual de create-next-app).
- Hero opción A (dos columnas) en lugar de fondo full: la foto es vertical 3:4 y a pantalla completa se recortaba en escritorio.
- Imágenes en `public/images/` (no `src/assets`): más simple y visible; el tradeoff es que un archivo que falta da 404 silencioso en vez de romper el build.

## Aprendizajes y errores a evitar

- Puerto 3000 ocupado por otro proyecto de la máquina: usar `-p 3007`.
- En PowerShell el HMAC se prueba con `[System.Security.Cryptography.HMACSHA256]::new($key)`, no `New-Object`.
- `extractIncomingMessages` debe aceptar `unknown` (el JSON de Meta no tipado rompía el typecheck).
- `Date` local del servidor ≠ hora del salón: siempre `src/backend/time.ts`.
- Al copiar imágenes con nombres parecidos (`galeria.jpg` + `galeria-1.jpg`), renombrar en secuencia limpia (`galeria-1..4`) para evitar colisiones.

## Próximos pasos

- Recoger datos reales del salón y rellenar `src/config/salon.ts`.
- Crear proyecto Supabase + cuenta de servicio Google + app Meta, y completar `.env.local`.
- Probar el flujo completo con ngrok y desplegar en Vercel.
