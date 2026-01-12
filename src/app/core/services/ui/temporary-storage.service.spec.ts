import { TemporaryStorageService } from './temporary-storage.service';

describe('TemporaryStorageService', () => {
  const STORAGE_KEY = 'temporary-entries';
  const NOTIF_KEY = 'recovery-notification-shown';

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NOTIF_KEY);
  });

  it('saveTemporaryEntry should store entry and return id', () => {
    const logSpy = jasmine.createSpyObj('LoggerService', ['info']);
    const service = new TemporaryStorageService(logSpy as any);

    const id = service.saveTemporaryEntry({
      formData: { a: 1 },
      timestamp: 't',
      formType: 'entrada',
      title: 'x',
      description: 'd',
    });
    expect(id).toContain('temp_');

    const entry = service.getTemporaryEntry(id);
    expect(entry?.id).toBe(id);
    expect(entry?.formType).toBe('entrada');
  });

  it('getTemporaryEntriesByType should filter entries', () => {
    const logSpy = jasmine.createSpyObj('LoggerService', ['info']);
    const service = new TemporaryStorageService(logSpy as any);

    service.saveTemporaryEntry({
      formData: {},
      timestamp: 't1',
      formType: 'entrada',
    });
    service.saveTemporaryEntry({
      formData: {},
      timestamp: 't2',
      formType: 'pagina',
    });
    expect(service.getTemporaryEntriesByType('entrada').length).toBe(1);
    expect(service.getAllTemporaryEntries().length).toBe(2);
  });

  it('removeTemporaryEntry should delete entry', () => {
    const logSpy = jasmine.createSpyObj('LoggerService', ['info']);
    const service = new TemporaryStorageService(logSpy as any);

    const id = service.saveTemporaryEntry({
      formData: {},
      timestamp: 't',
      formType: 'entrada',
    });
    service.removeTemporaryEntry(id);
    expect(service.getTemporaryEntry(id)).toBeNull();
  });

  it('clearTemporaryEntriesByType should delete matching entries only', () => {
    const logSpy = jasmine.createSpyObj('LoggerService', ['info']);
    const service = new TemporaryStorageService(logSpy as any);

    service.saveTemporaryEntry({
      formData: {},
      timestamp: 't1',
      formType: 'entrada',
    });
    service.saveTemporaryEntry({
      formData: {},
      timestamp: 't2',
      formType: 'pagina',
    });
    service.clearTemporaryEntriesByType('entrada');
    expect(service.getTemporaryEntriesByType('entrada').length).toBe(0);
    expect(service.getTemporaryEntriesByType('pagina').length).toBe(1);
  });

  it('clearAllTemporaryEntries should clear storage', () => {
    const logSpy = jasmine.createSpyObj('LoggerService', ['info']);
    const service = new TemporaryStorageService(logSpy as any);
    service.saveTemporaryEntry({
      formData: {},
      timestamp: 't',
      formType: 'entrada',
    });
    service.clearAllTemporaryEntries();
    expect(service.getAllTemporaryEntries().length).toBe(0);
  });

  it('recovery notification flags should be set and cleared', () => {
    const logSpy = jasmine.createSpyObj('LoggerService', ['info']);
    const service = new TemporaryStorageService(logSpy as any);
    expect(service.isRecoveryNotificationShown('f1')).toBeFalse();

    service.setRecoveryNotificationShown('f1');
    expect(service.isRecoveryNotificationShown('f1')).toBeTrue();

    service.clearRecoveryNotification('f1');
    expect(service.isRecoveryNotificationShown('f1')).toBeFalse();
  });
});
