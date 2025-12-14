import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ListadoPaginasComponent } from './listado-paginas.component';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { BusquedaService } from '../../../core/services/srv-busqueda/busqueda.service';
import { EntradaService } from '../../../core/services/data/entrada.service';
import { CommonFunctionalityService } from '../../../shared/services/common-functionality.service';
import { ToastService } from '../../../core/services/ui/toast.service';
import { ErrorBoundaryService } from '../../../core/errors/error-boundary/error-boundary.service';
import { LoggerService } from '../../../core/services/logger.service';
import { EntradaCatalogService } from '../../../core/services/data/entrada-catalog.service';

class MockBusquedaService {
  iniciarBusqueda(fnSearch: any, fnResults: any) {}
  triggerBusqueda() {}
  searchNow() { return of({ elements: [], totalPages: 0 }); }
  limpiarBusqueda() {}
}

class MockEntradaService {
  obtenerDefinicionesBuscadorSafe() { return of({ filterKeySegunClazzNamePermitido: ['titulo'], operationPermitido: { titulo: ['EQUALS'] } }); }
  buscarSafe() { return of({ elements: [{ idEntrada: 1, categorias: [], tipoEntrada: { nombre: 'Página' } }], totalPages: 1 }); }
  borrar() { return of({}); }
}

class MockCommonFuncService { transformaFecha(date: Date, fmt: string, val: boolean) { return '2020-01-01'; } }
class MockToastService { showSuccess(){} showError(){} showInfo(){} }
class MockErrorBoundaryService { registerBoundary(){} unregisterBoundary(){} reportErrorToBoundary(){} }
class MockLoggerService { error(){} warn(){} info(){} }
class MockEntradaCatalogService { obtenerCatalogosEntrada(){ return of({}); } }

describe('ListadoPaginasComponent', () => {
  let component: ListadoPaginasComponent;
  let fixture: ComponentFixture<ListadoPaginasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [ListadoPaginasComponent],
      providers: [
        { provide: BusquedaService, useClass: MockBusquedaService },
        { provide: EntradaService, useClass: MockEntradaService },
        { provide: CommonFunctionalityService, useClass: MockCommonFuncService },
        { provide: ToastService, useClass: MockToastService },
        { provide: ErrorBoundaryService, useClass: MockErrorBoundaryService },
        { provide: LoggerService, useClass: MockLoggerService },
        { provide: EntradaCatalogService, useClass: MockEntradaCatalogService },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    TestBed.overrideTemplate(ListadoPaginasComponent, '<div></div>');

    fixture = TestBed.createComponent(ListadoPaginasComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('no lanza errores al procesar resultados y al cambiar visibilidad del modal', fakeAsync(() => {
    expect(() => fixture.detectChanges()).not.toThrow();
    (component as any).procesarResultadosBusqueda({ elements: [{ idEntrada: 1, categorias: [], tipoEntrada: { nombre: 'Página' } }], totalPages: 1 });
    tick(0);
    expect(() => fixture.detectChanges()).not.toThrow();
    component.onVisibleModalChange(true);
    component.onVisibleModalChange(false);
    tick(0);
    expect(() => fixture.detectChanges()).not.toThrow();
  }));

  it('should filter by TipoEntrada Página when searching', fakeAsync(() => {
    const mockSearch = jasmine.createSpy('searchSpy').and.returnValue(of({ elements: [], totalPages: 0 }));
    (component as any).entradaService.buscarSafe = mockSearch;
    
    fixture.detectChanges();
    (component as any).realizarBusquedaPaginas('test', 0).subscribe();
    
    tick(0);
    expect(mockSearch).toHaveBeenCalled();
    const callArgs = mockSearch.calls.mostRecent().args[0];
    expect(callArgs.searchCriteriaList).toContain(jasmine.objectContaining({
      filterKey: 'tipoEntrada.nombre',
      value: 'Página',
      operation: 'EQUAL'
    }));
  }));
});
