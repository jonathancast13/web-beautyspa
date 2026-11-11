import Image from "next/image";
import { salon, whatsappUrl } from "@/config/salon";

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-rose-50 to-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 sm:py-20 lg:grid-cols-2">
        {/* Texto */}
        <div className="text-center lg:text-left">

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
            {salon.name}
          </h1>

          <p className="mt-4 text-lg text-neutral-600">{salon.tagline}</p>

          <p className="mt-2 text-base text-neutral-500">
            Cuéntale a nuestro asistente qué servicio quieres y para qué día: te confirma la cita en
            cuanto encuentre un hueco libre.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
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

        {/* Imagen (vertical 3:4, recorte mínimo) */}
        <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-3xl shadow-xl lg:max-w-none">
          <Image
            src={salon.photos.hero.src}
            alt={salon.photos.hero.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-top"
            priority
          />
        </div>
      </div>
    </section>
  );
}
