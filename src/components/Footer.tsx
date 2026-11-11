import { salon } from "@/config/salon";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-10 text-center text-sm text-neutral-500">
        <p className="font-semibold text-neutral-800">{salon.name}</p>
        <p className="mt-1">
          {salon.address} · {salon.phoneForHumans}
        </p>
        <p className="mt-4">© {new Date().getFullYear()} {salon.name}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
