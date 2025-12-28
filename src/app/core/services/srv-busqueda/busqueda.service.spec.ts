import { of } from 'rxjs';
import { BusquedaService } from './busqueda.service';

describe('BusquedaService', () => {
  it('searchNow should return empty when no searchFunction registered', (done) => {
    const service = new BusquedaService();

    service.searchNow('x', 1).subscribe((res) => {
      expect(res.elements).toEqual([]);
      expect(res.totalPages).toBe(0);
      done();
    });
  });

  it('iniciarBusqueda should debounce and call callback when elements exist', (done) => {
    const service = new BusquedaService();
    const callback = jasmine.createSpy('callback');
    const searchFn = jasmine
      .createSpy('searchFn')
      .and.returnValue(of({ elements: [{ idEntrada: 1 } as any], totalPages: 2 }));

    service.iniciarBusqueda(searchFn as any, callback, 0);
    service.triggerBusqueda('abc');
    setTimeout(() => {
      expect(searchFn).toHaveBeenCalledWith('abc');
      expect(callback).toHaveBeenCalledWith({
        elements: [{ idEntrada: 1 } as any],
        totalPages: 2,
      });
      done();
    }, 0);
  });

  it('iniciarBusqueda should not call callback when elements is missing', (done) => {
    const service = new BusquedaService();
    const callback = jasmine.createSpy('callback');
    const searchFn = jasmine
      .createSpy('searchFn')
      .and.returnValue(of({ elements: undefined as any, totalPages: 0 }));

    service.iniciarBusqueda(searchFn as any, callback, 0);
    service.triggerBusqueda('abc');
    setTimeout(() => {
      expect(callback).not.toHaveBeenCalled();
      done();
    }, 0);
  });

  it('limpiarBusqueda should unsubscribe previous subscription', (done) => {
    const service = new BusquedaService();
    const callback = jasmine.createSpy('callback');
    const searchFn = jasmine
      .createSpy('searchFn')
      .and.returnValue(of({ elements: [], totalPages: 0 }));

    service.iniciarBusqueda(searchFn as any, callback, 0);
    service.triggerBusqueda('x');
    setTimeout(() => {
      service.limpiarBusqueda();
      service.triggerBusqueda('y');
      setTimeout(() => {
        expect(searchFn).toHaveBeenCalledTimes(1);
        done();
      }, 0);
    }, 0);
  });

  it('searchNow should call registered function with page', (done) => {
    const service = new BusquedaService();
    const searchFn = jasmine
      .createSpy('searchFn')
      .and.returnValue(of({ elements: [], totalPages: 1 }));
    service.iniciarBusqueda(searchFn as any, () => {}, 0);

    service.searchNow('term', 3).subscribe(() => {
      expect(searchFn).toHaveBeenCalledWith('term', 3);
      done();
    });
  });
});
