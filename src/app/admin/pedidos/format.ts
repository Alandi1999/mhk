const dateFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatOrderDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}
