import { ListadoPaginasComponent } from './listado-paginas.component';
import { Entrada } from '../../../core/models/entrada.model';

describe('ListadoPaginasComponent', () => {
  let component: ListadoPaginasComponent;

  beforeEach(() => {
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
        mockZone
    );
  });

  it('should return published state correctly', () => {
    const entrada = {
        idEntrada: 1,
        titulo: 'Test',
        publicada: true,
        borrador: false,
        usernameCreador: 'admin'
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
        usernameCreador: 'admin'
    } as Entrada;

    const state = component.getEstadoInfo(entrada);
    expect(state.icon).toBe('cilEye');
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
        estadoEntrada: { idEstadoEntrada: 1, nombre: 'Pendiente de revisión', descripcion: '' }
    } as Entrada;

    const state = component.getEstadoInfo(entrada);
    expect(state.icon).toBe('cilHistory');
    expect(state.color).toBe('text-warning');
    expect(state.tooltip).toBe('Pendiente de revisión');
  });
});
