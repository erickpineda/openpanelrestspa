import { ErrorBoundaryService } from './error-boundary.service';

describe('ErrorBoundaryService', () => {
  it('registerBoundary and getBoundary should return the registered boundary', () => {
    const service = new ErrorBoundaryService();
    const boundary = { captureError: jasmine.createSpy('captureError') } as any;

    service.registerBoundary('b1', boundary);
    expect(service.getBoundary('b1')).toBe(boundary);
  });

  it('unregisterBoundary should remove boundary', () => {
    const service = new ErrorBoundaryService();
    const boundary = { captureError: jasmine.createSpy('captureError') } as any;

    service.registerBoundary('b1', boundary);
    service.unregisterBoundary('b1');
    expect(service.getBoundary('b1')).toBeUndefined();
  });

  it('reportErrorToBoundary should call captureError when boundary exists', () => {
    const service = new ErrorBoundaryService();
    const boundary = { captureError: jasmine.createSpy('captureError') } as any;
    service.registerBoundary('b1', boundary);

    service.reportErrorToBoundary('b1', new Error('x'), 'Comp');
    expect(boundary.captureError).toHaveBeenCalled();
  });

  it('reportErrorToBoundary should warn when boundary is missing', () => {
    const service = new ErrorBoundaryService();
    const warnSpy = spyOn(console, 'warn');

    service.reportErrorToBoundary('missing', new Error('x'), 'Comp');
    expect(warnSpy).toHaveBeenCalled();
  });
});
