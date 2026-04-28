import {
  formatForBackend,
  formatForDateTimeLocal,
  isAllowedDateString,
  parseAllowedDate,
  serializeDateInputToBackend,
  serializeDateTimeLocalInputToBackend,
} from './date-utils';

describe('DateUtils', () => {
  describe('parseAllowedDate', () => {
    it('should return null for null/undefined/empty input', () => {
      expect(parseAllowedDate(null)).toBeNull();
      expect(parseAllowedDate(undefined)).toBeNull();
      expect(parseAllowedDate('')).toBeNull();
      expect(parseAllowedDate('   ')).toBeNull();
    });

    it('should return Date for valid Date object', () => {
      const d = new Date(2023, 0, 1);
      expect(parseAllowedDate(d)).toEqual(d);
    });

    it('should parse ISO local datetime and legacy ES datetime', () => {
      const iso = parseAllowedDate('2026-04-24T10:15:00');
      const legacy = parseAllowedDate('24-04-2026 10:15:00');

      expect(iso).toBeTruthy();
      expect(legacy).toBeTruthy();
      expect(iso?.getFullYear()).toBe(2026);
      expect(legacy?.getFullYear()).toBe(2026);
    });

    it('should fall back to native parsing for ISO with timezone', () => {
      const d = parseAllowedDate('2026-04-24T10:15:00Z');
      expect(d).toBeTruthy();
    });
  });

  describe('formatForBackend', () => {
    it('should format datetime as ISO local by default', () => {
      const d = new Date(2023, 0, 20, 14, 30, 45);
      expect(formatForBackend(d)).toBe('2023-01-20T14:30:45');
    });

    it('should format date as yyyy-MM-dd when withTime=false', () => {
      const d = new Date(2023, 0, 20, 14, 30, 45);
      expect(formatForBackend(d, false)).toBe('2023-01-20');
    });
  });

  describe('serializers', () => {
    it('should serialize date inputs without converting to legacy format', () => {
      expect(serializeDateInputToBackend('2026-04-24')).toBe('2026-04-24');
    });

    it('should serialize datetime-local inputs as ISO local', () => {
      expect(serializeDateTimeLocalInputToBackend('2026-04-24T10:15')).toBe(
        '2026-04-24T10:15:00'
      );
    });
  });

  describe('isAllowedDateString', () => {
    it('should return true for final and legacy patterns', () => {
      expect(isAllowedDateString('2026-04-24')).toBeTrue();
      expect(isAllowedDateString('2026-04-24T10:15:00')).toBeTrue();
      expect(isAllowedDateString('24-04-2026 10:15:00')).toBeTrue();
    });

    it('should return false for invalid patterns', () => {
      expect(isAllowedDateString('invalid')).toBeFalse();
      expect(isAllowedDateString(null)).toBeFalse();
    });
  });

  describe('formatForDateTimeLocal', () => {
    it('should format as yyyy-MM-ddTHH:mm', () => {
      const d = new Date(2023, 0, 20, 14, 5);
      expect(formatForDateTimeLocal(d)).toBe('2023-01-20T14:05');
    });
  });
});
