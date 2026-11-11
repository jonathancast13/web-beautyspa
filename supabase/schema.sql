-- ============================================================
-- Destellos Nailsss · Esquema inicial (Supabase / PostgreSQL)
-- Pega todo este archivo en el SQL Editor de Supabase y ejecútalo.
-- ============================================================

-- Conversaciones de WhatsApp: en qué paso está cada charla.
-- También guarda la última respuesta enviada para no duplicar
-- mensajes si Meta reintenta la webhook.
create table if not exists conversations (
  phone text primary key,                 -- teléfono del cliente (wa_id)
  state text not null default 'bienvenida',
  customer_name text,
  service_id text,
  requested_date text,                    -- "15/11/2026"
  request_id uuid,                        -- solicitud de cita asociada
  offered_slots jsonb,                    -- huecos mostrados al cliente
  last_wamid text,                        -- último mensaje atendido (antiduplicados)
  last_reply text,                        -- respuesta a ese mensaje
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Solicitudes de cita (modelo mínimo de la sección 11 del plan).
create table if not exists booking_requests (
  request_id uuid primary key default gen_random_uuid(),
  conversation_id text not null,
  customer_name text,
  customer_phone text not null,
  service text,
  requested_start timestamptz,
  duration_minutes int,
  status text not null default 'iniciada'
    check (status in ('iniciada', 'pendiente', 'confirmada', 'no_disponible', 'error')),
  calendar_event_id text,                 -- id del evento en Google Calendar
  created_at timestamptz not null default now()
);

create index if not exists booking_requests_status_idx
  on booking_requests (status);
create index if not exists booking_requests_conversation_idx
  on booking_requests (conversation_id);

-- Seguridad: el backend usa la service role key (bypass RLS) y no se
-- publica ninguna tabla. Sin políticas, nadie puede leerlas desde el cliente.
alter table conversations enable row level security;
alter table booking_requests enable row level security;
