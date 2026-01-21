import { parseAllowedDate, formatForBackend, isAllowedDateString, formatForDateTimeLocal } from './date-utils';

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

    it('should return null for invalid Date object', () => {
      expect(parseAllowedDate(new Date('invalid'))).toBeNull();
    });

    it('should return Date for valid number timestamp', () => {
      const d = new Date(2023, 0, 1);
      expect(parseAllowedDate(d.getTime())).toEqual(d);
    });

    it('should parse ISO format yyyy-MM-dd', () => {
      const d = parseAllowedDate('2023-01-20');
      expect(d).toBeTruthy();
      expect(d?.getFullYear()).toBe(2023);
      expect(d?.getMonth()).toBe(0); // Jan is 0
      expect(d?.getDate()).toBe(20);
    });

    it('should parse ISO format yyyy-MM-dd HH:mm:ss', () => {
      const d = parseAllowedDate('2023-01-20 14:30:45');
      expect(d).toBeTruthy();
      expect(d?.getFullYear()).toBe(2023);
      expect(d?.getHours()).toBe(14);
      expect(d?.getMinutes()).toBe(30);
      expect(d?.getSeconds()).toBe(45);
    });

    it('should parse ES format dd-MM-yyyy', () => {
      const d = parseAllowedDate('20-01-2023');
      expect(d).toBeTruthy();
      expect(d?.getFullYear()).toBe(2023);
      expect(d?.getMonth()).toBe(0);
      expect(d?.getDate()).toBe(20);
    });

    it('should parse ES format dd-MM-yyyy HH:mm:ss', () => {
      const d = parseAllowedDate('20-01-2023 14:30:45');
      expect(d).toBeTruthy();
      expect(d?.getFullYear()).toBe(2023);
      expect(d?.getHours()).toBe(14);
    });

    it('should fall back to native Date parsing', () => {
      const d = parseAllowedDate('2023/01/20');
      expect(d).toBeTruthy();
      expect(d?.getFullYear()).toBe(2023);
    });
  });

  describe('formatForBackend', () => {
    it('should format as yyyy-MM-dd HH:mm:ss by default', () => {
      const d = new Date(2023, 0, 20, 14, 30, 45);
      expect(formatForBackend(d)).toBe('2023-01-20 14:30:45');
    });

    it('should format as yyyy-MM-dd when withTime=false', () => {
      const d = new Date(2023, 0, 20, 14, 30, 45);
      expect(formatForBackend(d, false)).toBe('2023-01-20');
    });

    it('should return null for invalid input', () => {
      expect(formatForBackend(null as any)).toBeNull();
    });
  });

  describe('isAllowedDateString', () => {
    it('should return true for valid patterns', () => {
      expect(isAllowedDateString('2023-01-01')).toBeTrue();
      expect(isAllowedDateString('01-01-2023')).toBeTrue();
      expect(isAllowedDateString('2023-01-01 12:00:00')).toBeTrue();
    });

    it('should return false for invalid patterns', () => {
      expect(isAllowedDateString('invalid')).toBeFalse();
      expect(isAllowedDateString(null)).toBeFalse();
    });
  });

  describe('formatForDateTimeLocal', () => {
    it('should format as yyyy-MM-ddTHH:mm', () => {
      const d = new Date(2023, 0, 20, 14, 5); // 14:05
      expect(formatForDateTimeLocal(d)).toBe('2023-01-20T14:05');
    });

    it('should return null for invalid input', () => {
      expect(formatForDateTimeLocal(null)).toBeNull();
    });
  });
});
