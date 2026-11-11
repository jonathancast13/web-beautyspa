/**
 * Configuración central del salón.
 *
 * Es el ÚNICO archivo que hay que editar para adaptar la web y el chatbot
 * a los datos reales: servicios, precios, horarios y contacto.
 * (Los valores de abajo son de ejemplo: sustitúyelos por los del salón.)
 */

export type Service = {
  id: string;
  /** Clave de la categoría a la que pertenece (ver serviceCategories) */
  category: string;
  name: string;
  durationMinutes: number;
  price: string;
};

export type ServiceCategory = {
  id: string;
  title: string;
  /** Nota opcional bajo el título (p. ej. precio variable) */
  note?: string;
};

export type OpeningSlot = { from: string; to: string };

export type FaqItem = { question: string; answer: string };

export const salon = {
  name: "Destellos Nailsss",
  tagline: "Salón de uñas",

  /** Número del chatbot: dígitos con prefijo de país y sin "+" */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "34665828207",

  /** Teléfono visible por si alguien quiere llamar al salón a mano */
  phoneForHumans: "+34 665 82 82 07",

  address: "Carrer Asturias 8, Catarroja (Valencia)",

  /** Zona horaria del salón (formato IANA) */
  timezone: "Europe/Madrid",

  /** Minutos mínimos de antelación para poder reservar */
  minAdvanceMinutes: 60,

  /** Cada cuántos minutos se pueden encajar las citas */
  slotStepMinutes: 30,

  /**
   * Grupos de la carta: la landing pinta un bloque por categoría.
   * IMPORTANTE: el array `services` debe ir agrupado en este mismo orden,
   * porque la lista numerada del chatbot se genera recorriendolo.
   */
  serviceCategories: [
    { id: "semipermanente", title: "Manicura semipermanente" },
    { id: "gel", title: "Gel 💅", note: "El precio varía según el largo de las uñas" },
    { id: "acrilico", title: "Acrílico / Acrigel 💅", note: "El precio varía según el largo de las uñas" },
  ] as ServiceCategory[],

  /** Catálogo de servicios: la duración se usa para buscar huecos libres */
  services: [
    // — Manicura semipermanente —
    {
      id: "retiro-semipermanente",
      category: "semipermanente",
      name: "Retiro semipermanente",
      durationMinutes: 15,
      price: "6 €",
    },
    {
      id: "esencial-semipermanente",
      category: "semipermanente",
      name: "Esencial semipermanente",
      durationMinutes: 45,
      price: "15 €",
    },
    {
      id: "basica-semipermanente",
      category: "semipermanente",
      name: "Básica semipermanente",
      durationMinutes: 60,
      price: "18 €",
    },
    {
      id: "completa-semipermanente",
      category: "semipermanente",
      name: "Completa semipermanente",
      durationMinutes: 70,
      price: "21 €",
    },
    {
      id: "base-rubber",
      category: "semipermanente",
      name: "Base rubber",
      durationMinutes: 80,
      price: "23 €",
    },
    {
      id: "manicura-tradicional",
      category: "semipermanente",
      name: "Manicura tradicional",
      durationMinutes: 40,
      price: "12 €",
    },
    // — Gel —
    {
      id: "reconstruccion-gel",
      category: "gel",
      name: "Reconstrucción gel",
      durationMinutes: 15,
      price: "3 €",
    },
    {
      id: "retirar-gel",
      category: "gel",
      name: "Retirar gel",
      durationMinutes: 30,
      price: "7 €",
    },
    {
      id: "relleno-gel",
      category: "gel",
      name: "Relleno gel",
      durationMinutes: 90,
      price: "26 €",
    },
    {
      id: "puesta-gel-tip",
      category: "gel",
      name: "Puesta Gel tip",
      durationMinutes: 120,
      price: "30 €",
    },
    // — Acrílico / Acrigel —
    {
      id: "retirar-acrilico",
      category: "acrilico",
      name: "Retirar acrílico",
      durationMinutes: 35,
      price: "8 €",
    },
    {
      id: "reconstruccion-acrilico",
      category: "acrilico",
      name: "Reconstrucción acrílico",
      durationMinutes: 15,
      price: "3 €",
    },
    {
      id: "relleno-acrilico",
      category: "acrilico",
      name: "Relleno acrílico",
      durationMinutes: 100,
      price: "26 €",
    },
    {
      id: "puesta-acrilico",
      category: "acrilico",
      name: "Puesta de acrílico",
      durationMinutes: 120,
      price: "34 €",
    },
  ] as Service[],

  /**
   * Horario reservable por día de la semana.
   * Claves: 0 = domingo, 1 = lunes ... 6 = sábado.
   * Deja el array vacío ([]) los días cerrados.
   */
  hours: {
    0: [],
    1: [
      { from: "10:00", to: "14:00" },
      { from: "16:30", to: "20:00" },
    ],
    2: [
      { from: "10:00", to: "14:00" },
      { from: "16:30", to: "20:00" },
    ],
    3: [
      { from: "10:00", to: "14:00" },
      { from: "16:30", to: "20:00" },
    ],
    4: [
      { from: "10:00", to: "14:00" },
      { from: "16:30", to: "20:00" },
    ],
    5: [
      { from: "10:00", to: "14:00" },
      { from: "16:30", to: "20:00" },
    ],
    6: [{ from: "10:00", to: "14:00" }],
  } as Record<number, OpeningSlot[]>,

  /** Preguntas frecuentes que se muestran en la landing */
  faq: [
    {
      question: "¿Tengo que registrarme para reservar?",
      answer: "No. Solo pulsa el botón de WhatsApp y el asistente te pide los datos mínimos: nombre, servicio y día.",
    },
    {
      question: "¿Puedo reservar de noche o el domingo?",
      answer: "Sí, puedes enviar la solicitud a cualquier hora. La cita queda confirmada solo si el horario está libre en la agenda.",
    },
    {
      question: "¿Y si mi horario preferido está ocupado?",
      answer: "El asistente te avisa al momento y te muestra los huecos libres restantes para que elijas otro.",
    },
    {
      question: "¿Cómo cancelo o cambio una cita?",
      answer: "Escríbenos por WhatsApp indicando tu nombre y te lo cambiamos enseguida.",
    },
  ] as FaqItem[],

  /** Imágenes de la landing (archivos en public/images/) */
  photos: {
    hero: {
      src: "/images/hero.jpg",
      alt: "Manicura con diseño en rojos y rosa sobre fondo blanco de pelo suave",
    },
    gallery: [
      {
        src: "/images/galeria-1.jpg",
        alt: "Uñas puntiagudas con diseño de corazones en rojo y negro",
      },
      {
        src: "/images/galeria-2.jpg",
        alt: "Manicura de fantasía con conejo y motivos de Navidad en lila",
      },
      {
        src: "/images/galeria-3.jpg",
        alt: "Uñas cortas con esmalte magenta y detalles en blanco, negro y dorado",
      },
      {
        src: "/images/galeria-4.jpg",
        alt: "Diseño de uñas con carita sonriente, arcoíris, nubes y estampado vaca",
      },
    ],
  },
};

/** Enlace directo a una conversación de WhatsApp con un mensaje de bienvenida. */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${salon.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Lista de servicios numerada para el chatbot de WhatsApp, agrupada
 * por categoría. El número debe coincidir con el índice plano del array
 * `services` (por eso van agrupados en el mismo orden).
 */
export function serviceListText(): string {
  const lines: string[] = [];
  let number = 0;

  for (const category of salon.serviceCategories) {
    lines.push(`— ${category.title} —`);

    for (const service of salon.services) {
      if (service.category !== category.id) continue;
      number += 1;
      lines.push(`${number}. ${service.name} (${service.durationMinutes} min · ${service.price})`);
    }
  }

  return lines.join("\n");
}
