# AGENTS.md - Destellos Nailsss

Landing page para un salón de uñas con chatbot de reservas por WhatsApp 24/7.
Pensada para desplegarse en Vercel; el backend valida disponibilidad en Google Calendar y registra todo en Supabase.

## Stack y estructura

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4; React 19. Backend: Supabase (PostgreSQL), Google Calendar API (cuenta de servicio), WhatsApp Cloud API de Meta.
- `src/app/` + `src/components/` — frontend (landing única en `page.tsx`).
- `src/app/api/whatsapp/route.ts` — único adaptador delgado del webhook (GET verificación + POST mensajes); toda la lógica está en `src/backend/` (chatbot, calendar, store, whatsapp, time, env).
- `src/config/salon.ts` — datos del salón (servicios, precios, horarios, teléfono, zona horaria). Solo son placeholders.
- `supabase/schema.sql` — esquema inicial; no hay sistema de migraciones.

## Comandos

- `npm install` — npm (existe `package-lock.json`; no usar pnpm/yarn).
- `npm run dev` — servidor local. El puerto 3000 suele estar ocupado: `npm run dev -- -p 3007`.
- `npm run build` — única verificación automática (compila + lint + typecheck). No hay tests.
- Probar el webhook sin WhatsApp: `GET /api/whatsapp?hub.mode=subscribe&hub.verify_token=<valor>&hub.challenge=x` debe devolver `x`.

## Convenciones

- Comentarios y textos al usuario en español; código y nombres en inglés.
- Datos del salón (servicios, horarios, textos, FAQ) siempre en `src/config/salon.ts`: nunca hardcodearlos en componentes (archivo de referencia).
- Fechas y horas: usar siempre `src/backend/time.ts` (`localToUtcMs`, `dateFromMs`), nunca `Date` local del servidor.
- Separación frontend/backend: la ruta del webhook solo delega; la lógica va en `src/backend/`.
- Imágenes en `public/images/` (nombres en inglés) usando `next/image`, nunca `<img>`; rutas y `alt` (en español) centralizados en `photos` de `src/config/salon.ts`.

## Reglas de dominio / trampas conocidas

- Nunca confirmar una cita sin que Google Calendar haya aceptado el evento (RF-5/RF-7). Error o 409 ⇒ "no disponible" o "error", jamás "confirmada".
- Anti-duplicados: revalidar antes de escribir, buscar el evento por `request_id` antes de crear otro, y reutilizar `last_wamid/last_reply` ante reintentos de Meta.
- Credenciales solo en servidor (nunca `NEXT_PUBLIC_`, salvo el número de WhatsApp); `.env.example` es la fuente de verdad de las 9 variables y `env.ts` lista las que falten.
- `route.ts` exporta `runtime = "nodejs"`: crypto, Supabase y googleapis no funcionan en Edge.
- La clave privada de Google llega con `\n` escapados; normalizarla en `env.ts` (no duplicar ese código).
- Los servicios de `src/config/salon.ts` alimentan a la vez la landing, el chatbot (nombres deben ser únicos: `findService` identifica por nombre) y la duración de las citas en Google Calendar.

## Forma de trabajar

- Tamaño de cambios: pequeños y por capas (frontend / backend / datos), un aspecto por cambio.
- Si un cambio toca el flujo de reserva, revisar antes las reglas de dominio de arriba.
- Al terminar: resumir lo creado, pasos para probarlo y decisiones tomadas por cuenta propia para que el usuario las revise.

## Límites

- ✅ Siempre: editar `src/config/salon.ts`, comentarios en español, mantener la separación frontend/backend.
- ✅ Siempre: añadir/actualizar imágenes en `public/images/`.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ Pregunta antes: dependencias nuevas, nuevas tablas/columnas de Supabase, cambios en el esquema de datos, cambiar la versión de la Graph API o el proveedor de WhatsApp.
- 🚫 Nunca: tocar `supabase/schema.sql` una vez ejecutado en producción (crear migración nueva), subir `.env.local`, saltarse la comprobación de disponibilidad antes de crear el evento.

## Verificación

- `npm run build` debe pasar (compila + lint + typecheck).
- Landing: `npm run dev -- -p 3007` y comprobar que carga la home.
- Webhook: GET de verificación devuelve el challenge; POST sin firma o con firma mala ⇒ 401, con firma válida ⇒ 200.
- Flujo completo (solo con credenciales reales): mensaje → cita creada en Calendar y fila `confirmada` en Supabase.

## Memoria

- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su
porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).