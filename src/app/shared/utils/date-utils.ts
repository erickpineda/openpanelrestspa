/**
 * Utilidades puras para manejo de fechas normalizadas con el backend.
 * Formatos soportados por el backend:
 * - 'yyyy-MM-ddTHH:mm:ss'
 * - ISO-8601 con offset/Z
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

  let d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  const rIso = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+\-]\d{2}:\d{2})?)?$/;
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

  return withTime ? formatDateTimeIsoLocal(d) : formatDateIso(d);
}

export function isAllowedDateString(input: string | null | undefined): boolean {
  if (!input) return false;
  const s = String(input).trim();
  if (!s) return false;

  const rIso = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+\-]\d{2}:\d{2})?)?$/;
  const rEs = /^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/;

  return rIso.test(s) || rEs.test(s);
}

export function formatForDateTimeLocal(input: string | Date | null): string | null {
  const d = parseAllowedDate(input);
  if (!d) return null;

  const parts = getLocalParts(d);
  return `${parts.yyyy}-${parts.MM}-${parts.dd}T${parts.HH}:${parts.mm}`;
}

export function formatDateIso(input: string | Date | number | null | undefined): string | null {
  const d = parseAllowedDate(input as any);
  if (!d) return null;
  const parts = getLocalParts(d);
  return `${parts.yyyy}-${parts.MM}-${parts.dd}`;
}

export function formatDateTimeIsoLocal(
  input: string | Date | number | null | undefined
): string | null {
  const d = parseAllowedDate(input as any);
  if (!d) return null;
  const parts = getLocalParts(d);
  return `${parts.yyyy}-${parts.MM}-${parts.dd}T${parts.HH}:${parts.mm}:${parts.ss}`;
}

export function serializeDateInputToBackend(value: string | null | undefined): string | null {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

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
  return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}`;
}

function getLocalParts(d: Date): {
  yyyy: string;
  MM: string;
  dd: string;
  HH: string;
  mm: string;
  ss: string;
} {
  return {
    yyyy: String(d.getFullYear()),
    MM: String(d.getMonth() + 1).padStart(2, '0'),
    dd: String(d.getDate()).padStart(2, '0'),
    HH: String(d.getHours()).padStart(2, '0'),
    mm: String(d.getMinutes()).padStart(2, '0'),
    ss: String(d.getSeconds()).padStart(2, '0'),
  };
}
