/**
 * Utilidades puras para manejo de fechas normalizadas con el backend.
 * Formatos soportados por el backend:
 * - 'yyyy-MM-dd HH:mm:ss'
 * - 'dd-MM-yyyy HH:mm:ss'
 * - 'yyyy-MM-dd'
 * - 'dd-MM-yyyy'
 */

export function parseAllowedDate(input: string | Date | number | null | undefined): Date | null {
  if (!input && input !== 0) return null;
  
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  
  const s = String(input).trim();
  if (!s) return null;
  
  // Intento 1: Parseo nativo directo (ISO)
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  
  // Regex para formatos específicos (yyyy-MM-dd o dd-MM-yyyy con/sin hora)
  const rIso = /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/;
  const rEs = /^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/;
  
  let m = s.match(rIso);
  if (m) {
    const yyyy = Number(m[1]);
    const MM = Number(m[2]);
    const dd = Number(m[3]);
    const HH = Number(m[4] || 0);
    const mm = Number(m[5] || 0);
    const ss = Number(m[6] || 0);
    d = new Date(yyyy, MM - 1, dd, HH, mm, ss);
    return isNaN(d.getTime()) ? null : d;
  }
  
  m = s.match(rEs);
  if (m) {
    const dd = Number(m[1]);
    const MM = Number(m[2]);
    const yyyy = Number(m[3]);
    const HH = Number(m[4] || 0);
    const mm = Number(m[5] || 0);
    const ss = Number(m[6] || 0);
    d = new Date(yyyy, MM - 1, dd, HH, mm, ss);
    return isNaN(d.getTime()) ? null : d;
  }
  
  return null;
}

export function formatForBackend(input: string | Date, withTime: boolean = true): string | null {
  const d = parseAllowedDate(input);
  if (!d) return null;
  
  const p = (n: number) => (n < 10 ? '0' + n : String(n));
  const yyyy = d.getFullYear();
  const MM = p(d.getMonth() + 1);
  const dd = p(d.getDate());
  
  if (!withTime) return `${yyyy}-${MM}-${dd}`;
  
  const HH = p(d.getHours());
  const mm = p(d.getMinutes());
  const ss = p(d.getSeconds());
  
  return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
}

export function isAllowedDateString(input: string | null | undefined): boolean {
  if (!input) return false;
  const s = String(input).trim();
  if (!s) return false;
  
  const rIso = /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/;
  const rEs = /^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/;
  
  return rIso.test(s) || rEs.test(s);
}

export function formatForDateTimeLocal(input: string | Date | null): string | null {
  const d = parseAllowedDate(input);
  if (!d) return null;

  const p = (n: number) => (n < 10 ? '0' + n : String(n));
  const yyyy = d.getFullYear();
  const MM = p(d.getMonth() + 1);
  const dd = p(d.getDate());
  const HH = p(d.getHours());
  const mm = p(d.getMinutes());

  return `${yyyy}-${MM}-${dd}T${HH}:${mm}`;
}
