import { salon } from "@/config/salon";

const DAYS = [
  { index: 1, name: "Lunes" },
  { index: 2, name: "Martes" },
  { index: 3, name: "Miércoles" },
  { index: 4, name: "Jueves" },
  { index: 5, name: "Viernes" },
  { index: 6, name: "Sábado" },
  { index: 0, name: "Domingo" },
];

function formatRanges(dayIndex: number): string {
  const ranges = salon.hours[dayIndex] ?? [];
  if (ranges.length === 0) return "Cerrado";
  return ranges.map((range) => `${range.from} – ${range.to}`).join("  ·  ");
}

export default function Schedule() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h2 className="text-center text-3xl font-bold text-neutral-900">Horario y contacto</h2>

      <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200">
        <table className="w-full text-left text-sm">
          <tbody>
            {DAYS.map((day) => (
              <tr key={day.index} className="border-b border-neutral-100 last:border-b-0">
                <th scope="row" className="px-5 py-3 font-medium text-neutral-800">
                  {day.name}
                </th>
                <td className="px-5 py-3 text-neutral-600">{formatRanges(day.index)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-center text-sm text-neutral-500">
        📍 {salon.address} · ☎️ {salon.phoneForHumans}
        <br />
        Puedes enviar tu solicitud a cualquier hora: la cita se confirma solo si el horario está
        libre en la agenda.
      </p>
    </section>
  );
}
