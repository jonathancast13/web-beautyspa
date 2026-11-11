import { salon, whatsappUrl } from "@/config/salon";

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-rose-50 to-white">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <span className="inline-block rounded-full bg-rose-100 px-4 py-1 text-sm font-medium text-rose-700">
          Reserva 24/7 por WhatsApp
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
          {salon.name}
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">{salon.tagline}</p>

        <p className="mx-auto mt-2 max-w-2xl text-base text-neutral-500">
          Cuéntale a nuestro asistente qué servicio quieres y para qué día: te confirma la cita en
          cuanto encuentre un hueco libre.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={whatsappUrl(`¡Hola! Quiero reservar una cita en ${salon.name}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-full bg-rose-600 px-8 py-3 font-semibold text-white shadow-sm transition hover:bg-rose-700 sm:w-auto"
          >
            Reservar por WhatsApp
          </a>
          <a
            href="#servicios"
            className="w-full rounded-full border border-neutral-300 px-8 py-3 font-semibold text-neutral-700 transition hover:bg-neutral-100 sm:w-auto"
          >
            Ver servicios
          </a>
        </div>
      </div>
    </section>
  );
}
