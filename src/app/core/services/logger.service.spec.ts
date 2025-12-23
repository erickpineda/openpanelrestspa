import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';
import { LoggerBufferService } from './logger-buffer.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let buffer: jasmine.SpyObj<LoggerBufferService>;

  beforeEach(() => {
    buffer = jasmine.createSpyObj<LoggerBufferService>('LoggerBufferService', [
      'record',
    ]);

    TestBed.configureTestingModule({
      providers: [
        LoggerService,
        { provide: LoggerBufferService, useValue: buffer },
      ],
    });
    service = TestBed.inject(LoggerService);
  });

  it('no emite logs por debajo del nivel mínimo', () => {
    (service as any).minLevel = 'warn';
    const debugSpy = spyOn(console, 'debug');

    service.debug('d');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(buffer.record).not.toHaveBeenCalled();
  });

  it('emite logs y registra en buffer cuando el nivel lo permite', () => {
    (service as any).minLevel = 'debug';
    const warnSpy = spyOn(console, 'warn');

    service.warn('w', { a: 1 });

    expect(warnSpy).toHaveBeenCalled();
    expect(buffer.record).toHaveBeenCalledWith('warn', 'w', [{ a: 1 }]);
  });

  it('en modo producción envía errores al tracking service', () => {
    (service as any).minLevel = 'debug';
    (service as any).isProduction = true;
    const errSpy = spyOn(console, 'error');
    const trackingSpy = spyOn<any>(service, 'sendToTrackingService');

    service.error('e', new Error('x'));

    expect(errSpy).toHaveBeenCalled();
    expect(trackingSpy).toHaveBeenCalled();
  });

  it('no rompe si el buffer falla al registrar', () => {
    (service as any).minLevel = 'debug';
    buffer.record.and.callFake(() => {
      throw new Error('no');
    });
    spyOn(console, 'info');

    expect(() => service.info('i')).not.toThrow();
  });
});
