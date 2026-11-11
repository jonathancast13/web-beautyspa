/**
 * Configuración central del salón.
 *
 * Es el ÚNICO archivo que hay que editar para adaptar la web y el chatbot
 * a los datos reales: servicios, precios, horarios y contacto.
 * (Los valores de abajo son de ejemplo: sustitúyelos por los del salón.)
 */

export type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: string;
};

export type OpeningSlot = { from: string; to: string };

export type FaqItem = { question: string; answer: string };

export const salon = {
  name: "Destellos Nailsss",
  tagline: "Salón de uñas",

  /** Número del chatbot: dígitos con prefijo de país y sin "+" */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "34645245806",

  /** Teléfono visible por si alguien quiere llamar al salón a mano */
  phoneForHumans: "+34 600 00 00 00",

  address: "Carrer Asturias 8, Catarroja (Valencia)",

  /** Zona horaria del salón (formato IANA) */
  timezone: "Europe/Madrid",

  /** Minutos mínimos de antelación para poder reservar */
  minAdvanceMinutes: 60,

  /** Cada cuántos minutos se pueden encajar las citas */
  slotStepMinutes: 30,

  /** Catálogo de servicios: la duración se usa para buscar huecos libres */
  services: [
    {
      id: "manicura-clasica",
      name: "Manicura clásica",
      description: "Perfilado, cutículas y esmalte tradicional.",
      durationMinutes: 25,
      price: "18 €",
    },
    {
      id: "semipermanente",
      name: "Esmalte semipermanente",
      description: "Color duradero de unas 3 semanas con acabado brillante.",
      durationMinutes: 50,
      price: "28 €",
    },
    {
      id: "acrilicas",
      name: "Uñas acrílicas",
      description: "Extensiones con relleno y diseño a elegir.",
      durationMinutes: 90,
      price: "45 €",
    },
    {
      id: "gel",
      name: "Uñas de gel",
      description: "Fortalecimiento y alargamiento con gel.",
      durationMinutes: 75,
      price: "40 €",
    },
    {
      id: "pedicura",
      name: "Pedicura spa",
      description: "Exfoliación, hidratación y esmalte de pies.",
      durationMinutes: 45,
      price: "25 €",
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

/** Lista de servicios numerada, igual que la ve el chatbot en WhatsApp. */
export function serviceListText(): string {
  return salon.services
    .map((service, index) => `${index + 1}. ${service.name} (${service.durationMinutes} min · ${service.price})`)
    .join("\n");
}
