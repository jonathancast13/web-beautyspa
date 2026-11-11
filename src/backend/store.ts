/**
 * Acceso a Supabase (PostgreSQL).
 *
 * Aquí se guarda todo lo que el chatbot necesita recordar:
 *  - "conversations": en qué paso está cada conversación y qué respuesta ya dimos.
 *  - "booking_requests": el estado de cada solicitud de cita (RF-8 del plan).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getBackendEnv } from "./env";

export type ChatState =
  | "bienvenida"
  | "nombre"
  | "servicio"
  | "fecha"
  | "hora"
  | "confirmacion"
  | "confirmada";

/** Un hueco ofrecido al cliente en un momento concreto. */
export type OfferedSlot = { label: string; startIso: string };

export type Conversation = {
  phone: string;
  state: ChatState;
  customer_name: string | null;
  service_id: string | null;
  requested_date: string | null;
  request_id: string | null;
  offered_slots: OfferedSlot[] | null;
  last_wamid: string | null;
  last_reply: string | null;
  updated_at?: string;
};

export type BookingStatus = "iniciada" | "pendiente" | "confirmada" | "no_disponible" | "error";

export type BookingRequest = {
  request_id: string;
  conversation_id: string;
  customer_name: string | null;
  customer_phone: string;
  service: string | null;
  requested_start: string | null;
  duration_minutes: number | null;
  status: BookingStatus;
  calendar_event_id: string | null;
  created_at?: string;
};

let client: SupabaseClient | null = null;

/** Cliente de Supabase con la service role key (solo en servidor). */
function db(): SupabaseClient {
  if (!client) {
    const env = getBackendEnv();
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

// ---------- Conversaciones ----------

export async function findConversation(phone: string): Promise<Conversation | null> {
  const { data, error } = await db()
    .from("conversations")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer la conversación: ${error.message}`);
  return data as Conversation | null;
}

export async function createConversation(phone: string): Promise<Conversation> {
  const { data, error } = await db().from("conversations").insert({ phone }).select("*").single();

  if (error) {
    // Otra petición lo creó a la vez: lo leemos en lugar de fallar
    if (error.code === "23505") {
      const existing = await findConversation(phone);
      if (existing) return existing;
    }
    throw new Error(`No se pudo crear la conversación: ${error.message}`);
  }

  return data as Conversation;
}

export async function updateConversation(
  phone: string,
  patch: Partial<Conversation>,
): Promise<void> {
  const { error } = await db()
    .from("conversations")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("phone", phone);

  if (error) throw new Error(`No se pudo guardar la conversación: ${error.message}`);
}

// ---------- Solicitudes de cita ----------

export async function findBookingRequest(requestId: string): Promise<BookingRequest | null> {
  const { data, error } = await db()
    .from("booking_requests")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer la solicitud: ${error.message}`);
  return data as BookingRequest | null;
}

/** Crea una solicitud nueva y devuelve su identificador (RF-8). */
export async function createBookingRequest(input: {
  conversationId: string;
  customerName: string | null;
  customerPhone: string;
  service: string;
  durationMinutes: number;
}): Promise<string> {
  const { data, error } = await db()
    .from("booking_requests")
    .insert({
      conversation_id: input.conversationId,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      service: input.service,
      duration_minutes: input.durationMinutes,
      status: "iniciada",
    })
    .select("request_id")
    .single();

  if (error) throw new Error(`No se pudo crear la solicitud: ${error.message}`);
  return data.request_id as string;
}

export async function updateBookingRequest(
  requestId: string,
  patch: Partial<BookingRequest>,
): Promise<void> {
  const { error } = await db().from("booking_requests").update(patch).eq("request_id", requestId);

  if (error) throw new Error(`No se pudo actualizar la solicitud: ${error.message}`);
}
