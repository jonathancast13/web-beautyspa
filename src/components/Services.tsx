import { salon } from "@/config/salon";

export default function Services() {
  return (
    <section id="servicios" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="text-center text-3xl font-bold text-neutral-900">Servicios</h2>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {salon.services.map((service) => (
          <article
            key={service.id}
            className="flex flex-col rounded-2xl border border-neutral-200 p-6 shadow-sm transition hover:border-rose-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-neutral-900">{service.name}</h3>
              <span className="whitespace-nowrap font-bold text-rose-600">{service.price}</span>
            </div>

            <p className="mt-2 flex-1 text-sm text-neutral-600">{service.description}</p>

            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-neutral-400">
              {service.durationMinutes} minutos
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
