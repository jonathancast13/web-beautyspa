/**
 * Conexión con la API de WhatsApp de Meta (Cloud API).
 *
 * - verifySignature: comprueba que el webhook viene de Meta (X-Hub-Signature-256).
 * - extractIncomingMessages: saca los mensajes de texto de la petición.
 * - sendTextMessage: envía la respuesta al cliente.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { getBackendEnv } from "./env";

export type IncomingMessage = { wamid: string; phone: string; text: string };

type WebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<Record<string, unknown>>;
      };
    }>;
  }>;
};

/** ¿La firma del webhook coincide con el secreto de la app de Meta? */
export function isValidSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!appSecret || !signatureHeader || !signatureHeader.startsWith("sha256=")) return false;

  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signatureHeader);

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

/** Extrae los mensajes entrantes (texto o botones) de la petición de Meta. */
export function extractIncomingMessages(payload: unknown): IncomingMessage[] {
  const messages: IncomingMessage[] = [];
  const webhook = payload as WebhookPayload | null;
  if (!webhook) return messages;

  for (const entry of webhook.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        const text = extractText(message);
        const phone = message.from ? String(message.from) : "";
        const wamid = message.id ? String(message.id) : "";

        if (text && phone && wamid) {
          messages.push({ wamid, phone, text });
        }
      }
    }
  }

  return messages;
}

function extractText(message: Record<string, unknown>): string | null {
  if (message.type === "text") {
    const text = message.text as { body?: string } | undefined;
    return text?.body ?? null;
  }

  // Respuesta de botón o de lista: usamos su título como texto
  if (message.type === "interactive") {
    const interactive = message.interactive as
      | { button_reply?: { title?: string }; list_reply?: { title?: string } }
      | undefined;
    return interactive?.button_reply?.title ?? interactive?.list_reply?.title ?? null;
  }

  return null;
}

/** Envía un mensaje de texto por WhatsApp. Lanza error si Meta lo rechaza. */
export async function sendTextMessage(to: string, body: string): Promise<void> {
  const env = getBackendEnv();
  const url = `https://graph.facebook.com/v21.0/${env.whatsappPhoneId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.whatsappToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { preview_url: false, body },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Meta rechazó el mensaje (${response.status}): ${detail}`);
  }
}
