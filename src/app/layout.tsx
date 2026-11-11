import type { Metadata } from "next";
import "./globals.css";
import { salon } from "@/config/salon";

export const metadata: Metadata = {
  title: `${salon.name} | Salón de uñas y reservas por WhatsApp`,
  description:
    "Reserva tu cita en nuestro salón de uñas en menos de un minuto por WhatsApp: servicios, precios y confirmación al instante.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-white text-neutral-800 antialiased">{children}</body>
    </html>
  );
}
