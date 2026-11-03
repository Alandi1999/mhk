const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;

/**
 * Relative wait time in es-AR ("hace 2 días"). Pure: callers pass `now` so the
 * result is deterministic and can be computed on the server. Future timestamps
 * (clock skew) read as "hace instantes"; an invalid date yields "".
 */
export function formatWait(from: string | Date, now: Date): string {
  const elapsed = now.getTime() - new Date(from).getTime();
  if (Number.isNaN(elapsed)) return "";
  if (elapsed < MINUTE) return "hace instantes";
  if (elapsed < HOUR) return `hace ${Math.floor(elapsed / MINUTE)} min`;
  if (elapsed < DAY) return `hace ${Math.floor(elapsed / HOUR)} h`;
  if (elapsed < MONTH) {
    const days = Math.floor(elapsed / DAY);
    return days === 1 ? "hace 1 día" : `hace ${days} días`;
  }
  const months = Math.floor(elapsed / MONTH);
  return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
}
