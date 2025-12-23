import { CommonFunctionalityService } from './common-functionality.service';

describe('CommonFunctionalityService', () => {
  it('transformaFecha should parse string date when flag is false', () => {
    const routerSpy = jasmine.createSpyObj('Router', [
      'navigateByUrl',
      'navigate',
    ]);
    const datePipeSpy = jasmine.createSpyObj('DatePipe', ['transform']);
    datePipeSpy.transform.and.returnValue('ok');

    const service = new CommonFunctionalityService(
      routerSpy as any,
      datePipeSpy as any,
    );

    const fakeDate = {
      toString: () => '01-02-2025 03:04:05',
    } as any;

    const res = service.transformaFecha(fakeDate, 'dd/MM/yyyy', false);
    expect(res).toBe('ok');
    expect(datePipeSpy.transform).toHaveBeenCalled();
  });

  it('transformaFecha should use Date directly when flag is true', () => {
    const routerSpy = jasmine.createSpyObj('Router', [
      'navigateByUrl',
      'navigate',
    ]);
    const datePipeSpy = jasmine.createSpyObj('DatePipe', ['transform']);
    datePipeSpy.transform.and.returnValue('ok2');

    const service = new CommonFunctionalityService(
      routerSpy as any,
      datePipeSpy as any,
    );

    const date = new Date('2025-01-01T00:00:00.000Z');
    const res = service.transformaFecha(date, 'dd/MM/yyyy', true);
    expect(res).toBe('ok2');
    expect(datePipeSpy.transform).toHaveBeenCalledWith(date, 'dd/MM/yyyy');
  });

  it('transformaFecha should return empty string when fecha is missing', () => {
    const routerSpy = jasmine.createSpyObj('Router', [
      'navigateByUrl',
      'navigate',
    ]);
    const datePipeSpy = jasmine.createSpyObj('DatePipe', ['transform']);

    const service = new CommonFunctionalityService(
      routerSpy as any,
      datePipeSpy as any,
    );

    const res = service.transformaFecha(undefined as any, 'dd/MM/yyyy', true);
    expect(res).toBe('');
  });

  it('acortarTexto should shorten when exceeding maxLength', () => {
    const routerSpy = jasmine.createSpyObj('Router', [
      'navigateByUrl',
      'navigate',
    ]);
    const datePipeSpy = jasmine.createSpyObj('DatePipe', ['transform']);

    const service = new CommonFunctionalityService(
      routerSpy as any,
      datePipeSpy as any,
    );

    const res = service.acortarTexto('123456', 3);
    expect(res).toBe('123...');
  });

  it('acortarTexto should return original when within maxLength', () => {
    const routerSpy = jasmine.createSpyObj('Router', [
      'navigateByUrl',
      'navigate',
    ]);
    const datePipeSpy = jasmine.createSpyObj('DatePipe', ['transform']);

    const service = new CommonFunctionalityService(
      routerSpy as any,
      datePipeSpy as any,
    );

    const res = service.acortarTexto('123', 3);
    expect(res).toBe('123');
  });

  it('reloadComponent should navigate using current url when self is true', (done) => {
    const routerSpy = jasmine.createSpyObj('Router', [
      'navigateByUrl',
      'navigate',
    ]);
    Object.defineProperty(routerSpy, 'url', { value: 'admin', writable: true });
    routerSpy.navigateByUrl.and.returnValue(Promise.resolve(true));
    routerSpy.navigate.and.returnValue(Promise.resolve(true));
    spyOn(console, 'log');

    const datePipeSpy = jasmine.createSpyObj('DatePipe', ['transform']);

    const service = new CommonFunctionalityService(
      routerSpy as any,
      datePipeSpy as any,
    );

    service.reloadComponent(true);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/', {
      skipLocationChange: true,
    });
    setTimeout(() => {
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
      done();
    }, 0);
  });

  it('reloadComponent should navigate using provided url when self is false', (done) => {
    const routerSpy = jasmine.createSpyObj('Router', [
      'navigateByUrl',
      'navigate',
    ]);
    Object.defineProperty(routerSpy, 'url', {
      value: 'ignored',
      writable: true,
    });
    routerSpy.navigateByUrl.and.returnValue(Promise.resolve(true));
    routerSpy.navigate.and.returnValue(Promise.resolve(true));
    spyOn(console, 'log');

    const datePipeSpy = jasmine.createSpyObj('DatePipe', ['transform']);

    const service = new CommonFunctionalityService(
      routerSpy as any,
      datePipeSpy as any,
    );

    service.reloadComponent(false, 'dest');
    setTimeout(() => {
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dest']);
      done();
    }, 0);
  });

  it('reloadPage should call window.location.reload', () => {
    const routerSpy = jasmine.createSpyObj('Router', [
      'navigateByUrl',
      'navigate',
    ]);
    const datePipeSpy = jasmine.createSpyObj('DatePipe', ['transform']);

    const service = new CommonFunctionalityService(
      routerSpy as any,
      datePipeSpy as any,
    );

    expect(service.reloadPage).toEqual(jasmine.any(Function));
  });
});
