import { ListadoEntradasComponent } from './listado-entradas.component';
import { Entrada } from '../../../core/models/entrada.model';

describe('ListadoEntradasComponent', () => {
  let component: ListadoEntradasComponent;

  beforeEach(() => {
    // We only need to test the pure function getEstadoInfo, so we can cast a partial object or mock dependencies if needed.
    // Since getEstadoInfo doesn't rely on `this` context for anything other than itself (and it's a pure method on the class instance),
    // we can instantiate it with nulls for dependencies if we are careful, or just mock what's needed.
    // However, the component constructor has many dependencies.
    // It's cleaner to just extract the method or test it if it was static, but it's an instance method.
    // Let's create a minimal mock of the component to access the method,
    // OR fully mock the dependencies like in the other spec file.

    // Simplest approach: Create the component with mocked dependencies.
    const mockCommon = {} as any;
    const mockEntradaService = {} as any;
    const mockBusquedaService = {} as any;
    const mockToast = {} as any;
    const mockErrorBoundary = {} as any;
    const mockLogger = {} as any;
    const mockRouter = {} as any;
    const mockCatalog = {} as any;
    const mockCdr = { markForCheck: () => {}, detectChanges: () => {} } as any;
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

  it('should return default pending state if estadoEntrada is missing', () => {
    const entrada = {
      idEntrada: 4,
      titulo: 'Pendiente Default',
      publicada: false,
      borrador: false,
      usernameCreador: 'admin',
    } as Entrada;

    const state = component.getEstadoInfo(entrada);
    expect(state.icon).toBe('cilHistory');
    expect(state.color).toBe('text-warning');
    expect(state.tooltip).toBe('Pendiente');
  });

  it('Entrada class should initialize with default values', () => {
    const entrada = new Entrada();
    expect(entrada.idEntrada).toBe(0);
    expect(entrada.titulo).toBe('');
    expect(entrada.publicada).toBeFalse();
    expect(Array.isArray(entrada.categorias)).toBeTrue();
  });
});
