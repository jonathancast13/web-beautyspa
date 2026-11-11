import Image from "next/image";
import { salon } from "@/config/salon";

/** Galería de trabajos del salón. Las fotos y textos salen de salon.ts. */
export default function Gallery() {
  return (
    <section id="galeria" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="text-center text-3xl font-bold text-neutral-900">Nuestros trabajos</h2>
      <p className="mt-3 text-center text-neutral-500">
        Algunos diseños recientes. ¿Te gusta alguno? Pídelo por WhatsApp.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {salon.photos.gallery.map((photo) => (
          <div
            key={photo.src}
            className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-sm transition hover:shadow-md"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover object-top transition duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
