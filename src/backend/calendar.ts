/**
 * Integración con Google Calendar (cuenta de servicio).
 *
 * - getAvailableSlots: horarios libres de un día, descontando lo ocupado.
 * - createBookingEvent: crea la cita SOLO tras volver a comprobar que está libre.
 *
 * Reglas anti-duplicados del plan (sección 10):
 *  1. Se revisa la disponibilidad antes de ofrecer un hueco.
 *  2. Se vuelve a revisar justo antes de escribir.
 *  3. No se confirma nada al cliente hasta que Calendar acepta.
 *  4. Cada solicitud lleva su request_id: si el evento ya existe, no se crea otro.
 *  5. Un conflicto (409) se trata como "no disponible".
 */

import { google, type calendar_v3 } from "googleapis";
import { salon, type Service } from "@/config/salon";
import { getBackendEnv } from "./env";
import {
  addDays,
  dateFromMs,
  localToUtcMs,
  minutesToTime,
  timeToMinutes,
  weekdayOf,
  type DateParts,
} from "./time";

export type Slot = { label: string; startMs: number; endMs: number; startIso: string };

export type CreateBookingResult =
  | { ok: true; eventId: string }
  | { ok: false; reason: "ocupado" | "error" };

/** Conexión perezosa: solo se usa cuando llega un mensaje de WhatsApp. */
function calendarApi(): { calendar: calendar_v3.Calendar; calendarId: string } {
  const env = getBackendEnv();
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: env.googleServiceAccountEmail,
      private_key: env.googlePrivateKey,
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return { calendar: google.calendar({ version: "v3", auth }), calendarId: env.googleCalendarId };
}

// ---------- Disponibilidad ----------

/** Huecos libres de un día para una duración dada (sin incluir lo ocupado). */
export async function getAvailableSlots(
  date: DateParts,
  durationMinutes: number,
): Promise<Slot[]> {
  const ranges = salon.hours[weekdayOf(date)] ?? [];
  if (ranges.length === 0) return [];

  const busy = await getBusyIntervals(date);
  const earliest = Date.now() + salon.minAdvanceMinutes * 60_000;
  const durationMs = durationMinutes * 60_000;
  const slots: Slot[] = [];

  for (const range of ranges) {
    const from = timeToMinutes(range.from);
    const to = timeToMinutes(range.to);

    for (let minutes = from; minutes + durationMinutes <= to; minutes += salon.slotStepMinutes) {
      const startMs = localToUtcMs(date, minutes, salon.timezone);
      if (startMs < earliest) continue;

      const endMs = startMs + durationMs;
      const overlaps = busy.some((block) => block.startMs < endMs && startMs < block.endMs);
      if (overlaps) continue;

      slots.push({
        label: minutesToTime(minutes),
        startMs,
        endMs,
        startIso: new Date(startMs).toISOString(),
      });
    }
  }

  return slots;
}

/** Eventos existentes de un día (también bloqueos de día completo). */
async function getBusyIntervals(date: DateParts): Promise<Array<{ startMs: number; endMs: number }>> {
  const { calendar, calendarId } = calendarApi();
  const dayStartMs = localToUtcMs(date, 0, salon.timezone);
  const dayEndMs = localToUtcMs(addDays(date, 1), 0, salon.timezone);

  const response = await calendar.events.list({
    calendarId,
    timeMin: new Date(dayStartMs).toISOString(),
    timeMax: new Date(dayEndMs).toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  const intervals: Array<{ startMs: number; endMs: number }> = [];

  for (const item of response.data.items ?? []) {
    if (item.status === "cancelled") continue;

    // Evento de día completo (usa "date" en lugar de "dateTime")
    if (item.start?.date && item.end?.date) {
      const [year, month, day] = item.start.date.split("-").map(Number);
      intervals.push({
        startMs: localToUtcMs({ year, month, day }, 0, salon.timezone),
        endMs: localToUtcMs(addDays({ year, month, day }, 1), 0, salon.timezone),
      });
      continue;
    }

    if (item.start?.dateTime && item.end?.dateTime) {
      const startMs = Date.parse(item.start.dateTime);
      const endMs = Date.parse(item.end.dateTime);
      if (!Number.isNaN(startMs) && !Number.isNaN(endMs)) {
        intervals.push({ startMs, endMs });
      }
    }
  }

  return intervals;
}

// ---------- Escritura ----------

export type CreateBookingInput = {
  requestId: string;
  service: Service;
  startMs: number;
};

/**
 * Crea el evento en Google Calendar.
 * Nunca confirma dos veces: primero busca si el request_id ya tiene evento.
 */
export async function createBookingEvent(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const { calendar, calendarId } = calendarApi();

  // 4) ¿Este request_id ya tiene evento? Entonces no duplicamos.
  const existing = await findEventByRequestId(calendar, calendarId, input.requestId);
  if (existing) return { ok: true, eventId: existing };

  // 2) Revisar justo antes de escribir
  const date = dateFromMs(input.startMs);
  const slots = await getAvailableSlots(date, input.service.durationMinutes);
  const stillFree = slots.some((slot) => slot.startMs === input.startMs);
  if (!stillFree) return { ok: false, reason: "ocupado" };

  // 3) Escribir el evento (solo aquí se puede confirmar al cliente)
  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `Cita: ${input.service.name}`,
        description: `Solicitud de cita de ${salon.name}. request_id: ${input.requestId}`,
        start: {
          dateTime: new Date(input.startMs).toISOString(),
          timeZone: salon.timezone,
        },
        end: {
          dateTime: new Date(input.startMs + input.service.durationMinutes * 60_000).toISOString(),
          timeZone: salon.timezone,
        },
        extendedProperties: {
          private: { requestId: input.requestId },
        },
      },
    });

    if (!response.data.id) return { ok: false, reason: "error" };
    return { ok: true, eventId: response.data.id };
  } catch (error) {
    // 5) Conflicto (409): otro proceso ocupó el hueco → no disponible
    if (isConflict(error)) {
      const lateExisting = await findEventByRequestId(calendar, calendarId, input.requestId);
      if (lateExisting) return { ok: true, eventId: lateExisting };
      return { ok: false, reason: "ocupado" };
    }
    throw error;
  }
}

/** Busca un evento por el request_id guardado en propiedades privadas. */
async function findEventByRequestId(
  calendar: calendar_v3.Calendar,
  calendarId: string,
  requestId: string,
): Promise<string | null> {
  const response = await calendar.events.list({
    calendarId,
    privateExtendedProperty: [`requestId=${requestId}`],
    maxResults: 1,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items?.[0]?.id ?? null;
}

function isConflict(error: unknown): boolean {
  const status = (error as { response?: { status?: number }; code?: number })?.response?.status
    ?? (error as { code?: number })?.code;
  return status === 409;
}


