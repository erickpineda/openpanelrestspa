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

  if (Array.isArray(input)) {
    // Soporte para array [yyyy, MM, dd, HH, mm, ss]
    if (input.length >= 3) {
      const yyyy = input[0];
      const MM = input[1];
      const dd = input[2];
      const HH = input[3] || 0;
      const mm = input[4] || 0;
      const ss = input[5] || 0;
      const d = new Date(yyyy, MM - 1, dd, HH, mm, ss);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
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

  // El contrato nuevo fija Europe/Madrid y formatos dd-MM-yyyy / dd-MM-yyyy HH:mm:ss.
  return withTime ? formatDateTimeMadrid(d) : formatDateMadrid(d);
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

  const parts = getMadridParts(d);
  return `${parts.yyyy}-${parts.MM}-${parts.dd}T${parts.HH}:${parts.mm}`;
}

/**
 * Formatea un Date a 'dd-MM-yyyy' asumiendo zona Europe/Madrid.
 * (No incluye offset/Z; el backend lo interpreta como hora local Madrid).
 */
export function formatDateMadrid(input: string | Date | number | null | undefined): string | null {
  const d = parseAllowedDate(input as any);
  if (!d) return null;
  const parts = getMadridParts(d);
  return `${parts.dd}-${parts.MM}-${parts.yyyy}`;
}

/**
 * Formatea un Date a 'dd-MM-yyyy HH:mm:ss' asumiendo zona Europe/Madrid.
 * (No incluye offset/Z; el backend lo interpreta como hora local Madrid).
 */
export function formatDateTimeMadrid(
  input: string | Date | number | null | undefined
): string | null {
  const d = parseAllowedDate(input as any);
  if (!d) return null;
  const parts = getMadridParts(d);
  return `${parts.dd}-${parts.MM}-${parts.yyyy} ${parts.HH}:${parts.mm}:${parts.ss}`;
}

/**
 * Serializa el value proveniente de `<input type="date">` (yyyy-MM-dd)
 * a `dd-MM-yyyy` para el backend.
 */
export function serializeDateInputToBackend(value: string | null | undefined): string | null {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const yyyy = m[1];
  const MM = m[2];
  const dd = m[3];
  return `${dd}-${MM}-${yyyy}`;
}

/**
 * Serializa el value proveniente de `<input type="datetime-local">` (yyyy-MM-ddTHH:mm)
 * a `dd-MM-yyyy HH:mm:ss` para el backend (Europe/Madrid).
 */
export function serializeDateTimeLocalInputToBackend(
  value: string | null | undefined
): string | null {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const yyyy = m[1];
  const MM = m[2];
  const dd = m[3];
  const HH = m[4];
  const mm = m[5];
  const ss = m[6] ?? '00';
  return `${dd}-${MM}-${yyyy} ${HH}:${mm}:${ss}`;
}

function getMadridParts(d: Date): {
  yyyy: string;
  MM: string;
  dd: string;
  HH: string;
  mm: string;
  ss: string;
} {
  // Intl + formatToParts evita problemas de timezone en runtime.
  const fmt = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return {
    yyyy: get('year'),
    MM: get('month'),
    dd: get('day'),
    HH: get('hour'),
    mm: get('minute'),
    ss: get('second'),
  };
}
