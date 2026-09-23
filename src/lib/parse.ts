/** Converte "72,5" ou "72.5" em número; retorna NaN se inválido. */
export function parseNum(s: string): number {
  const n = Number(s.replace(/\s/g, '').replace(',', '.'));
  return s.trim() === '' ? NaN : n;
}

export function validTime(s: string): boolean {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(s.trim());
}
