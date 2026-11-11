/**
 * Webhook de WhatsApp (Meta Cloud API).
 *
 * GET  → verificación del webhook desde la consola de Meta.
 * POST → recibe los mensajes entrantes, ejecuta el chatbot y responde.
 */

import { type NextRequest, NextResponse } from "next/server";
import { handleIncomingMessage } from "@/backend/chatbot";
import { getBackendEnv } from "@/backend/env";
import { extractIncomingMessages, isValidSignature, sendTextMessage } from "@/backend/whatsapp";

// Necesita Node.js (no Edge): usa crypto, Supabase y Google APIs.
export const runtime = "nodejs";

/** Meta comprueba que somos nosotros antes de enviarnos mensajes. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token && token === expectedToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verificación incorrecta" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // 1) La firma debe coincidir con el secreto de la app de Meta
  let appSecret: string;
  try {
    appSecret = getBackendEnv().whatsappAppSecret;
  } catch (error) {
    console.error("[api/whatsapp]", error);
    return NextResponse.json({ error: "Servidor sin configurar" }, { status: 500 });
  }

  const signature = request.headers.get("x-hub-signature-256");
  if (!isValidSignature(rawBody, signature, appSecret)) {
    return NextResponse.json({ error: "Firma no válida" }, { status: 401 });
  }

  // 2) Procesamos cada mensaje y respondemos
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const messages = extractIncomingMessages(payload);

  for (const message of messages) {
    try {
      const reply = await handleIncomingMessage(message);
      await sendTextMessage(message.phone, reply);
    } catch (error) {
      // Devolvemos 500 para que Meta reintente el mensaje
      console.error("[api/whatsapp] Error procesando mensaje", error);
      return NextResponse.json({ error: "No se pudo procesar" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
