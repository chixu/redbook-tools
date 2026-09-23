export function todayIso() {
  const date = new Date();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDaysIso(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function shortDate(isoDate: string) {
  const [, month, day] = isoDate.split("-");
  return `${Number(month)}-${Number(day)}`;
}

export function previousIsoDates(today: string, count: number) {
  return Array.from({ length: count }, (_, index) => addDaysIso(today, -(index + 1))).reverse();
}

export function isPastDate(isoDate: string, today: string) {
  return isoDate < today;
}
