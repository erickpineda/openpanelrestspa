import { ListadoEntradasComponent } from './listado-entradas.component';
import { fakeAsync, tick } from '@angular/core/testing';
import { Entrada } from '../../../core/models/entrada.model';

describe('ListadoEntradasComponent Navigation Fix', () => {
  let component: ListadoEntradasComponent;
  let mockRouter: any;
  let mockCdr: any;

  beforeEach(() => {
    mockRouter = { navigate: jasmine.createSpy('navigate') };
    mockCdr = { markForCheck: () => {}, detectChanges: () => {} };
    // Other mocks...
    const mockCommon = {} as any;
    const mockEntradaService = {} as any;
    const mockBusquedaService = {} as any;
    const mockToast = {} as any;
    const mockErrorBoundary = {} as any;
    const mockLogger = {} as any;
    const mockCatalog = {} as any;
    const mockZone = { run: (fn: any) => fn() } as any;

    component = new ListadoEntradasComponent(
      mockCommon,
      mockEntradaService,
      mockBusquedaService,
      mockToast,
      mockErrorBoundary,
      mockLogger,
      mockRouter,
      mockCatalog,
      mockCdr,
      mockZone
    );
  });

  it('should close preview and wait before navigating in onEditarDesdePreview', fakeAsync(() => {
    // Arrange
    component.previewEntrada = { idEntrada: 123 } as Entrada;
    spyOn(component, 'closePreview').and.callThrough();

    // Act
    component.onEditarDesdePreview();

    // Assert 1: closePreview called immediately
    expect(component.closePreview).toHaveBeenCalled();
    // Navigate NOT called yet
    expect(mockRouter.navigate).not.toHaveBeenCalled();

    // Wait for timeout (350ms as per implementation)
    tick(350);

    // Assert 2: navigate called with correct ID
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/control/entradas/editar', 123]);
  }));
});
