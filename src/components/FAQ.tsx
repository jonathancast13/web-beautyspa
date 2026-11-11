import { salon } from "@/config/salon";

export default function FAQ() {
  return (
    <section className="bg-neutral-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold text-neutral-900">Preguntas frecuentes</h2>

        <div className="mt-8 space-y-3">
          {salon.faq.map((item) => (
            <details key={item.question} className="group rounded-xl border border-neutral-200 bg-white px-5 py-4">
              <summary className="cursor-pointer list-none font-medium text-neutral-800">
                {item.question}
              </summary>
              <p className="mt-2 text-sm text-neutral-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
