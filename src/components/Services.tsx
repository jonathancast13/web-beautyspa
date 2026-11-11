import { salon } from "@/config/salon";

/**
 * Carta de servicios agrupada por categoría (los datos están en salon.ts).
 * Sin descripciones: solo nombre, duración y precio.
 */
export default function Services() {
  return (
    <section id="servicios" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="text-center text-3xl font-bold text-neutral-900">Servicios y precios</h2>
      <p className="mt-3 text-center text-neutral-500">
        La duración de cada servicio es la que usa el asistente para reservar tu cita.
      </p>

      <div className="mt-10 space-y-12">
        {salon.serviceCategories.map((category) => {
          const services = salon.services.filter((service) => service.category === category.id);

          return (
            <div key={category.id}>
              <div className="border-b border-neutral-200 pb-3">
                <h3 className="text-xl font-semibold text-neutral-900">{category.title}</h3>
                {category.note && (
                  <p className="mt-1 text-sm text-neutral-500">{category.note}</p>
                )}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <article
                    key={service.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-neutral-200 p-5 shadow-sm transition hover:border-rose-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-semibold text-neutral-900">{service.name}</h4>
                      <span className="whitespace-nowrap font-bold text-rose-600">
                        {service.price}
                      </span>
                    </div>

                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                      {service.durationMinutes} minutos
                    </p>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
