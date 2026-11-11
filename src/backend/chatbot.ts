/**
 * Lógica del chatbot de WhatsApp.
 *
 * Cada mensaje avanza la conversación un paso:
 *   bienvenida → nombre → servicio → fecha → hora → confirmacion → confirmada
 *
 * El estado vive en Supabase (la webhook de Meta no tiene memoria),
 * y nunca se confirma una cita sin que Google Calendar haya guardado el evento.
 */

import { salon, serviceListText, type Service } from "@/config/salon";
import { createBookingEvent, getAvailableSlots } from "./calendar";
import {
  createBookingRequest,
  createConversation,
  findBookingRequest,
  findConversation,
  updateBookingRequest,
  updateConversation,
  type Conversation,
  type OfferedSlot,
} from "./store";
import { dateFromMs, formatDate, isPast, parseDate, timeFromMs, today, type DateParts } from "./time";
import type { IncomingMessage } from "./whatsapp";

/** Respuesta que se va a guardar y enviar. */
type Draft = { reply: string; nextState: Conversation["state"]; patch: Partial<Conversation> };

const CANCEL_WORDS = new RegExp(/^(cancelar|cancela|abortar|salir)$/i);
const YES_WORDS = new RegExp(/^(sí|si|confirmar|vale|ok)$/i);
const NO_WORDS = new RegExp(/^(no|nop|cambiar)$/i);
const OTHER_DAY_WORDS = new RegExp(/^(otro día|otro dia|otra fecha|cambiar día|cambiar dia)$/i);
const NEW_BOOKING_WORDS = new RegExp(/^(otra cita|otra|otra reserva|nueva cita)$/i);

/** Punto de entrada: procesa un mensaje y devuelve la respuesta a enviar. */
export async function handleIncomingMessage(message: IncomingMessage): Promise<string> {
  const conversation =
    (await findConversation(message.phone)) ?? (await createConversation(message.phone));
  const text = message.text.trim();

  // Meta reintenta los webhooks que no respondieron 200:
  // si ya contestamos este mismo mensaje, devolvemos la misma respuesta
  // (evita crear dos citas por un mismo "sí").
  if (conversation.last_wamid === message.wamid && conversation.last_reply) {
    return conversation.last_reply;
  }

  const draft = CANCEL_WORDS.test(text)
    ? cancelDraft()
    : await replyForState(conversation, text);

  await updateConversation(message.phone, {
    ...draft.patch,
    state: draft.nextState,
    last_wamid: message.wamid,
    last_reply: draft.reply,
  });

  return draft.reply;
}

async function replyForState(conversation: Conversation, text: string): Promise<Draft> {
  switch (conversation.state) {
    case "bienvenida":
      return greet();
    case "nombre":
      return saveName(text);
    case "servicio":
      return saveService(conversation, text);
    case "fecha":
      return checkDate(conversation, text);
    case "hora":
      return checkTime(conversation, text);
    case "confirmacion":
      return confirmBooking(conversation, text);
    case "confirmada":
      return afterConfirmed(text);
    default:
      return greet();
  }
}

// ---------- Pasos de la conversación ----------

function greet(): Draft {
  return {
    reply:
      `¡Hola! 👋 Soy la asistente de ${salon.name}. ` +
      `Te ayudo a reservar tu cita en menos de un minuto, a cualquier hora.\n\n` +
      `¿Me dices tu nombre?`,
    nextState: "nombre",
    patch: {},
  };
}

function saveName(text: string): Draft {
  const name = text.replace(/\s+/g, " ").trim();

  if (name.length < 2 || name.length > 40) {
    return {
      reply: "No he entendido el nombre ✍️ Escríbelo otra vez, por favor.",
      nextState: "nombre",
      patch: {},
    };
  }

  const pretty = name.charAt(0).toUpperCase() + name.slice(1);
  return {
    reply:
      `¡Encantada, ${pretty}! 🌸\n\n` +
      `Estos son nuestros servicios:\n\n${serviceListText()}\n\n` +
      `Responde con el número del servicio que quieres.`,
    nextState: "servicio",
    patch: { customer_name: pretty },
  };
}

async function saveService(conversation: Conversation, text: string): Promise<Draft> {
  const service = findService(text);

  if (!service) {
    return {
      reply:
        `No encuentro ese servicio 🤔 Responde con un número del 1 al ${salon.services.length}:\n\n` +
        serviceListText(),
      nextState: "servicio",
      patch: {},
    };
  }

  // Elegir servicio = empezar una solicitud nueva (RF-8)
  const requestId = await createBookingRequest({
    conversationId: conversation.phone,
    customerName: conversation.customer_name,
    customerPhone: conversation.phone,
    service: service.name,
    durationMinutes: service.durationMinutes,
  });

  return {
    reply:
      `Perfecto: ${service.name} (${service.durationMinutes} min · ${service.price}).\n\n` +
      `¿Para qué día quieres la cita? Indícalo con formato dd/mm/aaaa ` +
      `(ejemplo: ${exampleDate()}).`,
    nextState: "fecha",
    patch: { service_id: service.id, request_id: requestId, requested_date: null, offered_slots: null },
  };
}

async function checkDate(conversation: Conversation, text: string): Promise<Draft> {
  const service = currentService(conversation);
  if (!service) return restartServiceDraft();

  const date = parseDate(text);
  if (!date) {
    return {
      reply: `No he leído la fecha 📅 Escríbela así: ${exampleDate()} (día/mes/año).`,
      nextState: "fecha",
      patch: {},
    };
  }

  if (isPast(date)) {
    return {
      reply: "Esa fecha ya pasó ⏰ ¿Qué día a partir de hoy te va bien? (dd/mm/aaaa)",
      nextState: "fecha",
      patch: {},
    };
  }

  return offerSlots(date, service, "");
}

async function checkTime(conversation: Conversation, text: string): Promise<Draft> {
  if (OTHER_DAY_WORDS.test(text)) {
    return {
      reply: "Perfecto. ¿Para qué día quieres la cita? (dd/mm/aaaa)",
      nextState: "fecha",
      patch: { requested_date: null, offered_slots: null },
    };
  }

  const service = currentService(conversation);
  if (!service) return restartServiceDraft();

  const slots = conversation.offered_slots ?? [];
  if (!conversation.requested_date || slots.length === 0) {
    return {
      reply: "Primero dime el día de la cita (dd/mm/aaaa) 🙂",
      nextState: "fecha",
      patch: {},
    };
  }

  const pick = pickSlot(text, slots);

  if (pick.kind === "invalid") {
    return {
      reply:
        `No he entendido la hora ⏰.\n\nResponde con el número de la lista o con la hora ` +
        `(ejemplo: ${slots[0].label}):\n\n${offeredList(slots)}`,
      nextState: "hora",
      patch: {},
    };
  }

  if (pick.kind === "not-free") {
    return {
      reply:
        `La ${pick.label} no está disponible el ${conversation.requested_date} 😔\n\n` +
        `Huecos libres ahora:\n\n${offeredList(slots)}\n\n` +
        `¿Cuál te viene mejor?`,
      nextState: "hora",
      patch: {},
    };
  }

  // Hueco elegido: la solicitud pasa a "pendiente" hasta que se confirme
  await updateBookingRequestOf(conversation, {
    status: "pendiente",
    requested_start: pick.slot.startIso,
    duration_minutes: service.durationMinutes,
  });

  return {
    reply:
      `¡Muy bien! Este es el resumen de tu cita:\n\n` +
      `📌 ${service.name}\n` +
      `📅 ${conversation.requested_date} a las ${pick.slot.label}\n` +
      `⏱ ${service.durationMinutes} min · ${service.price}\n\n` +
      `¿Confirmo? Responde "sí" o "no".`,
    nextState: "confirmacion",
    patch: {},
  };
}

async function confirmBooking(conversation: Conversation, text: string): Promise<Draft> {
  const service = currentService(conversation);
  if (!service) return restartServiceDraft();

  if (NO_WORDS.test(text)) {
    return offerAnotherSlot(conversation, service, "Sin problema 😊");
  }

  if (!YES_WORDS.test(text)) {
    return {
      reply: `Responde "sí" para confirmar la cita o "no" para elegir otro horario.`,
      nextState: "confirmacion",
      patch: {},
    };
  }

  // El horario elegido está guardado en la solicitud pendiente
  const requestId = conversation.request_id;
  const request = requestId ? await findBookingRequest(requestId) : null;
  const startMs = request?.requested_start ? Date.parse(request.requested_start) : NaN;

  if (!requestId || Number.isNaN(startMs)) {
    return restartServiceDraft();
  }

  // Si ya estaba confirmada (reintento), no repetimos: devolvemos la confirmación
  if (request?.status === "confirmada" && request.calendar_event_id) {
    const startMs = request.requested_start ? Date.parse(request.requested_start) : NaN;
    return confirmedDraft(service, conversation, startMs);
  }

  try {
    const result = await createBookingEvent({ requestId, service, startMs });

    if (!result.ok) {
      await updateBookingRequest(requestId, { status: "no_disponible" });
      return offerAnotherSlot(
        conversation,
        service,
        "Justo acaban de ocupar ese horario 😖 tu cita NO quedó confirmada.",
      );
    }

    await updateBookingRequest(requestId, {
      status: "confirmada",
      calendar_event_id: result.eventId,
    });

    return confirmedDraft(service, conversation, startMs);
  } catch (error) {
    console.error("[chatbot] Error creando el evento", error);
    await safeUpdateStatus(requestId, "error");

    return {
      reply:
        `⚠️ Tu cita NO quedó confirmada: ha habido un problema técnico y no he podido ` +
        `guardarla en la agenda.\n\n` +
        `Puedes responder "sí" para reintentar o "no" para elegir otro horario. ` +
        `También puedes llamarnos al ${salon.phoneForHumans}.`,
      nextState: "confirmacion",
      patch: {},
    };
  }
}

function afterConfirmed(text: string): Draft {
  if (NEW_BOOKING_WORDS.test(text)) {
    return {
      reply: `¡Vamos con otra cita! ✨ Elige el servicio:\n\n${serviceListText()}`,
      nextState: "servicio",
      patch: { service_id: null, requested_date: null, offered_slots: null, request_id: null },
    };
  }

  return {
    reply:
      `Tu cita sigue confirmada ✅\n\n` +
      `Si quieres reservar otra, escribe "otra cita". ` +
      `Si necesitas cambiarla o cancelarla, escríbenos aquí indicando tu nombre.`,
    nextState: "confirmada",
    patch: {},
  };
}

// ---------- Auxiliares ----------

/** Consulta la agenda y propone huecos libres para una fecha. */
async function offerSlots(date: DateParts, service: Service, intro: string): Promise<Draft> {
  const dateLabel = formatDate(date);
  const prefix = intro ? `${intro}\n\n` : "";

  try {
    const slots = await getAvailableSlots(date, service.durationMinutes);

    if (slots.length === 0) {
      return {
        reply:
          `${prefix}El día ${dateLabel} no tiene huecos libres de ${service.durationMinutes} min.\n\n` +
          `¿Prefieres otro día? (dd/mm/aaaa)`,
        nextState: "fecha",
        patch: { requested_date: null, offered_slots: null },
      };
    }

    const offered = slots.slice(0, 8).map(toOfferedSlot);
    return {
      reply:
        `${prefix}¡Genial! El ${dateLabel} hay ${slots.length} hueco(s):\n\n` +
        `${offeredList(offered)}\n\n` +
        `¿A qué hora vienes? Responde con el número o con la hora ` +
        `(ejemplo: ${offered[0].label}).`,
      nextState: "hora",
      patch: { requested_date: dateLabel, offered_slots: offered },
    };
  } catch (error) {
    console.error("[chatbot] Error consultando la agenda", error);
    return {
      reply:
        `${prefix}No puedo consultar la agenda ahora mismo ⏳.\n\n` +
        `Vuelve a indicar el día (dd/mm/aaaa) para reintentar, o llámanos al ${salon.phoneForHumans}.`,
      nextState: "fecha",
      patch: {},
    };
  }
}

/** Propone huecos de nuevo tras un "no" o un conflicto. */
async function offerAnotherSlot(
  conversation: Conversation,
  service: Service,
  intro: string,
): Promise<Draft> {
  const date = conversation.requested_date ? parseDate(conversation.requested_date) : null;

  if (!date) {
    return {
      reply: `${intro}\n\n¿Para qué día quieres la cita? (dd/mm/aaaa)`,
      nextState: "fecha",
      patch: { requested_date: null, offered_slots: null },
    };
  }

  return offerSlots(date, service, intro);
}

function confirmedDraft(
  service: Service,
  conversation: Conversation,
  startMs: number,
): Draft {
  const when = Number.isNaN(startMs)
    ? conversation.requested_date ?? ""
    : `${formatDate(dateFromMs(startMs))} a las ${timeFromMs(startMs)}`;

  return {
    reply:
      `✅ ¡Cita confirmada, ${conversation.customer_name ?? ""}!\n\n` +
      `📌 ${service.name}\n` +
      `📅 ${when}\n` +
      `⏱ ${service.durationMinutes} min · ${service.price}\n` +
      `📍 ${salon.address}\n\n` +
      `Te esperamos. Si necesitas cambiar o cancelar, escríbenos por WhatsApp indicando tu nombre.`,
    nextState: "confirmada",
    patch: {},
  };
}

function cancelDraft(): Draft {
  return {
    reply:
      `Reserva cancelada. ✨\n\nSi quieres empezar otra vez, dime tu nombre:`,
    nextState: "nombre",
    patch: {
      customer_name: null,
      service_id: null,
      requested_date: null,
      request_id: null,
      offered_slots: null,
    },
  };
}

function restartServiceDraft(): Draft {
  return {
    reply:
      `Parece que se perdió tu selección 🙈 Empecemos por el servicio:\n\n` +
      serviceListText(),
    nextState: "servicio",
    patch: { requested_date: null, offered_slots: null },
  };
}

// ---------- Selección y utilidades ----------

function findService(text: string): Service | null {
  const option = Number(text);
  if (Number.isInteger(option) && option >= 1 && option <= salon.services.length) {
    return salon.services[option - 1];
  }

  const lower = text.toLowerCase();
  return (
    salon.services.find((service) => service.name.toLowerCase().includes(lower)) ??
    salon.services.find((service) => lower.includes(service.name.toLowerCase())) ??
    null
  );
}

function currentService(conversation: Conversation): Service | null {
  return salon.services.find((service) => service.id === conversation.service_id) ?? null;
}

type SlotPick =
  | { kind: "slot"; slot: OfferedSlot }
  | { kind: "not-free"; label: string }
  | { kind: "invalid" };

/** Acepta "17:00", "17.00" o el número de la lista ofrecida. */
function pickSlot(text: string, slots: OfferedSlot[]): SlotPick {
  const hourMatch = text.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (hourMatch) {
    const label = `${hourMatch[1].padStart(2, "0")}:${hourMatch[2]}`;
    const slot = slots.find((item) => item.label === label);
    if (slot) return { kind: "slot", slot };
    return { kind: "not-free", label };
  }

  const option = Number(text);
  if (Number.isInteger(option) && option >= 1 && option <= slots.length) {
    return { kind: "slot", slot: slots[option - 1] };
  }

  return { kind: "invalid" };
}

function toOfferedSlot(slot: { label: string; startIso: string }): OfferedSlot {
  return { label: slot.label, startIso: slot.startIso };
}

function offeredList(slots: OfferedSlot[]): string {
  return slots.map((slot, index) => `${index + 1}. ${slot.label}`).join("\n");
}

function exampleDate(): string {
  return formatDate(today());
}

/** Actualiza la solicitud sin romper la conversación si falla. */
async function updateBookingRequestOf(
  conversation: Conversation,
  patch: Parameters<typeof updateBookingRequest>[1],
): Promise<void> {
  if (!conversation.request_id) return;
  await updateBookingRequest(conversation.request_id, patch);
}

async function safeUpdateStatus(
  requestId: string | null,
  status: Parameters<typeof updateBookingRequest>[1]["status"],
): Promise<void> {
  if (!requestId) return;
  try {
    await updateBookingRequest(requestId, { status });
  } catch (error) {
    console.error("[chatbot] No se pudo guardar el estado", error);
  }
}
