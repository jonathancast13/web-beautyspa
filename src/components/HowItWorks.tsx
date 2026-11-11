import { salon, whatsappUrl } from "@/config/salon";

const STEPS = [
  {
    title: "Escribe por WhatsApp",
    text: "Pulsa el botón y ábrenos un chat. Nuestro asistente está disponible 24/7.",
  },
  {
    title: "Dinos qué necesitas",
    text: "Tu nombre, el servicio y el día. El asistente te muestra los huecos libres.",
  },
  {
    title: "Recibe tu confirmación",
    text: "Si el horario está libre, la cita queda guardada en la agenda al momento.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-neutral-50">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold text-neutral-900">¿Cómo funciona?</h2>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold text-neutral-900">{step.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={whatsappUrl(`¡Hola! Quiero reservar una cita en ${salon.name}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-rose-600 px-8 py-3 font-semibold text-white shadow-sm transition hover:bg-rose-700"
          >
            Empezar mi reserva
          </a>
        </div>
      </div>
    </section>
  );
}
