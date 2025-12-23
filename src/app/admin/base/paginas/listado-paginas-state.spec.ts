import { ListadoPaginasComponent } from './listado-paginas.component';
import { Entrada } from '../../../core/models/entrada.model';

describe('ListadoPaginasComponent', () => {
  let component: ListadoPaginasComponent;
  let mockCommon: any;
  let mockToast: jasmine.SpyObj<any>;
  let mockRouter: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockCommon = {
      transformaFecha: (fecha: Date) => `fmt-${fecha.getFullYear()}`,
    } as any;
    const mockEntradaService = {} as any;
    const mockBusquedaService = {} as any;
    mockToast = jasmine.createSpyObj('ToastService', ['showError', 'showInfo']);
    const mockErrorBoundary = {} as any;
    const mockLogger = {} as any;
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    const mockCatalog = {} as any;
    const mockCdr = { markForCheck: () => {}, detectChanges: () => {} } as any;
    const mockZone = { run: (fn: any) => fn() } as any;

    component = new ListadoPaginasComponent(
      mockCommon,
      mockEntradaService,
      mockBusquedaService,
      mockToast,
      mockErrorBoundary,
      mockLogger,
      mockRouter,
      mockCatalog,
      mockCdr,
      mockZone,
    );
  });

  it('should return published state correctly', () => {
    const entrada = {
      idEntrada: 1,
      titulo: 'Test',
      publicada: true,
      borrador: false,
      usernameCreador: 'admin',
    } as Entrada;

    const state = component.getEstadoInfo(entrada);
    expect(state.icon).toBe('cilCheckCircle');
    expect(state.color).toBe('text-success');
    expect(state.tooltip).toBe('Publicada');
  });

  it('should return draft state correctly', () => {
    const entrada = {
      idEntrada: 2,
      titulo: 'Borrador',
      publicada: false,
      borrador: true,
      usernameCreador: 'admin',
    } as Entrada;

    const state = component.getEstadoInfo(entrada);
    expect(state.icon).toBe('cilFile');
    expect(state.color).toBe('text-warning');
    expect(state.tooltip).toBe('Borrador');
  });

  it('should return pending state correctly', () => {
    const entrada = {
      idEntrada: 3,
      titulo: 'Pendiente',
      publicada: false,
      borrador: false,
      usernameCreador: 'admin',
      estadoEntrada: {
        idEstadoEntrada: 1,
        nombre: 'Pendiente de revisión',
        descripcion: '',
      },
    } as Entrada;

    const state = component.getEstadoInfo(entrada);
    expect(state.icon).toBe('cilHistory');
    expect(state.color).toBe('text-warning');
    expect(state.tooltip).toBe('Pendiente de revisión');
  });

  it('trackByEntradaId should return entrada id', () => {
    const entrada = { idEntrada: 10 } as Entrada;
    expect(component.trackByEntradaId(0, entrada)).toBe(10);
  });

  it('checkFechaPublicacion should format when date exists', () => {
    const res = component.checkFechaPublicacion(new Date('2025-01-01'));
    expect(res).toBe('fmt-2025');
  });

  it('checkFechaPublicacion should return fallback when date is missing', () => {
    const res = component.checkFechaPublicacion(undefined as any);
    expect(res).toBe('No publicada');
  });

  it('toggleModal should clear entradaABorrar when closing', () => {
    component.entradaABorrar = { idEntrada: 1 } as any;
    component.toggleModal();
    expect(component.visible).toBeTrue();
    component.toggleModal();
    expect(component.visible).toBeFalse();
    expect(component.entradaABorrar).toBeNull();
  });

  it('onVisibleModalChange should clear entradaABorrar when hiding', () => {
    component.entradaABorrar = { idEntrada: 1 } as any;
    component.onVisibleModalChange(true);
    expect(component.visible).toBeTrue();
    expect(component.entradaABorrar).not.toBeNull();

    component.onVisibleModalChange(false);
    expect(component.visible).toBeFalse();
    expect(component.entradaABorrar).toBeNull();
  });

  it('closePreview should reset preview state', () => {
    component.previewVisible = true;
    component.previewEntrada = { idEntrada: 7 } as any;

    component.closePreview();
    expect(component.previewVisible).toBeFalse();
    expect(component.previewEntrada).toBeUndefined();
  });

  it('onPreviewVisibleChange should clear previewEntrada when hiding', () => {
    component.previewEntrada = { idEntrada: 7 } as any;
    component.onPreviewVisibleChange(false);
    expect(component.previewVisible).toBeFalse();
    expect(component.previewEntrada).toBeUndefined();
  });

  it('onEditarDesdePreview should navigate and close preview', () => {
    component.previewVisible = true;
    component.previewEntrada = { idEntrada: 7 } as any;

    component.onEditarDesdePreview();

    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/admin/control/paginas/editar',
      7,
    ]);
    expect(component.previewVisible).toBeFalse();
    expect(component.previewEntrada).toBeUndefined();
  });

  it('onEditarDesdePreview should not navigate without idEntrada', () => {
    component.previewEntrada = { idEntrada: null } as any;

    component.onEditarDesdePreview();

    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('onPublicarDesdePreview should close preview and notify', () => {
    component.previewVisible = true;
    component.previewEntrada = { idEntrada: 7 } as any;

    component.onPublicarDesdePreview({ idEntrada: 7 } as any);

    expect(component.previewVisible).toBeFalse();
    expect(component.previewEntrada).toBeUndefined();
    expect(mockToast.showInfo).toHaveBeenCalled();
  });
});
