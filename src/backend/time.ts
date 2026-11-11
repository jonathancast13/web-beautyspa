/**
 * Utilidades de fecha y hora.
 *
 * Todas las operaciones se hacen contra la zona horaria del salón,
 * para que "las 10:00" signifique siempre las 10:00 del salón.
 */

import { salon } from "@/config/salon";

export type DateParts = { year: number; month: number; day: number };

/** Fecha de hoy (en la zona horaria del salón) como números enteros. */
export function today(): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: salon.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const [year, month, day] = parts.split("-").map(Number);
  return { year, month, day };
}

/** Convierte un texto como "15/11/2026" en fecha. Devuelve null si no vale. */
export function parseDate(text: string): DateParts | null {
  const match = text.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Comprueba que la fecha existe de verdad (el 30/02 no vale)
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

/** Formatea una fecha como "15/11/2026". */
export function formatDate(date: DateParts): string {
  return `${pad(date.day)}/${pad(date.month)}/${date.year}`;
}

/** ¿La fecha es anterior a hoy (en el salón)? */
export function isPast(date: DateParts): boolean {
  const key = (d: DateParts) => d.year * 10000 + d.month * 100 + d.day;
  return key(date) < key(today());
}

/** Día de la semana de una fecha: 0 = domingo ... 6 = sábado. */
export function weekdayOf(date: DateParts): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

/** Suma días a una fecha (para calcular el final de un día). */
export function addDays(date: DateParts, days: number): DateParts {
  const value = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() };
}

/** "10:30" → 630 (minutos desde medianoche). */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** 630 → "10:30". */
export function minutesToTime(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** Milisegundos UTC → fecha en la zona horaria del salón. */
export function dateFromMs(ms: number): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: salon.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));

  const [year, month, day] = parts.split("-").map(Number);
  return { year, month, day };
}

/** "HH:MM" de un instante UTC en la zona horaria del salón. */
export function timeFromMs(ms: number): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: salon.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ms));

  return parts.replace(".", ":");
}

/**
 * Convierte una hora local del salón (fecha + minutos desde medianoche)
 * en un instante UTC en milisegundos.
 */
export function localToUtcMs(date: DateParts, minutesOfDay: number, timeZone: string): number {
  const naiveUtc = Date.UTC(date.year, date.month - 1, date.day, 0, minutesOfDay);
  // Ajuste en dos pasos para sobrevivir a los cambios de hora (horario de verano)
  const first = naiveUtc - offsetMs(timeZone, naiveUtc);
  return naiveUtc - offsetMs(timeZone, first);
}

/** Diferencia (ms) entre la hora local de la zona y UTC en un instante dado. */
function offsetMs(timeZone: string, utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );

  return asUtc - utcMs;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
