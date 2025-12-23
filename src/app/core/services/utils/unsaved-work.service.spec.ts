import { UnsavedWorkService } from './unsaved-work.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';

describe('UnsavedWorkService', () => {
  let service: UnsavedWorkService;
  let log: jasmine.SpyObj<any>;

  beforeEach(() => {
    log = jasmine.createSpyObj('LoggerService', ['info']);
    spyOn(window, 'addEventListener').and.callFake(() => {});
    service = new UnsavedWorkService(log);
  });

  it('registerForm y updateFormValue actualizan estado de cambios', (done) => {
    const emissions: boolean[] = [];
    service.unsavedWork$.subscribe((v) => emissions.push(v));

    service.registerForm('f1', { a: 1 });
    service.updateFormValue('f1', { a: 2 });

    expect(service.hasUnsavedWork()).toBeTrue();
    expect((window as any).__UNSAVED_WORK__).toBeTrue();
    expect(emissions.length).toBeGreaterThan(0);
    done();
  });

  it('markFormAsSaved y unregisterForm limpian estado', () => {
    service.registerForm('f1', { a: 1 });
    service.updateFormValue('f1', { a: 2 });
    expect(service.hasUnsavedWork()).toBeTrue();

    service.markFormAsSaved('f1');
    expect(service.hasUnsavedWork()).toBeFalse();

    service.unregisterForm('f1');
    expect(service.hasUnsavedWork()).toBeFalse();
  });

  it('emite SAVE_FORM_DATA cuando se dispara evento de guardado', () => {
    const dispatchSpy = spyOn(window, 'dispatchEvent').and.callThrough();

    service.registerForm('f1', { a: 1 });
    service.updateFormValue('f1', { a: 2 });

    (service as any).saveAllUnsavedWork();

    const calls = dispatchSpy.calls
      .allArgs()
      .map((a) => a[0] as Event)
      .filter((e) => e.type === OPConstants.Events.SAVE_FORM_DATA);
    expect(calls.length).toBe(1);
    expect((calls[0] as CustomEvent).detail.forms).toEqual(['f1']);
  });

  it('cleanupStorage elimina clave de formularios sin guardar', () => {
    localStorage.setItem(OPConstants.Storage.UNSAVED_FORMS_KEY, 'x');
    service.cleanupStorage();
    expect(
      localStorage.getItem(OPConstants.Storage.UNSAVED_FORMS_KEY),
    ).toBeNull();
  });
});
