import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListadoCategoriasComponent } from './listado-categorias.component';

describe('ListadoCategoriasComponent Spinner', () => {
  let component: ListadoCategoriasComponent;
  let fixture: any;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      listarPaginaSinGlobalLoader: jasmine.createSpy('listarPaginaSinGlobalLoader').and.returnValue({ pipe: () => ({ subscribe: () => {} }) }),
      buscarSinGlobalLoader: jasmine.createSpy('buscarSinGlobalLoader').and.returnValue({ pipe: () => ({ subscribe: () => {} }) }),
    };
    TestBed.configureTestingModule({
      declarations: [ListadoCategoriasComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [CommonModule],
      providers: [
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: CategoriaService, useValue: mockService },
        { provide: LoggerService, useValue: { error: () => {}, warn: () => {}, info: () => {}, debug: () => {} } },
        { provide: SearchUtilService, useValue: { buildSingle: () => ({}) } },
      ]
    });
    fixture = TestBed.createComponent(ListadoCategoriasComponent);
    component = fixture.componentInstance;
  });

  it('muestra spinner cuando cargando=true', () => {
    component.cargando = true;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('c-spinner')).toBeTruthy();
  });

  it('oculta spinner cuando cargando=false', async () => {
    // Evitar que obtenerListaCategorias se ejecute y ponga cargando=true
    spyOn(component, 'obtenerListaCategorias');
    
    // Configurar estado inicial
    component.cargando = false;
    component.pagedCategorias = [{ idCategoria: 1, nombre: 'A', descripcion: '' } as any];
    
    // IMPORTANTE: Primero detectChanges() para que Angular procese los bindings
    fixture.detectChanges();
    await fixture.whenStable();
    
    const el: HTMLElement = fixture.nativeElement;
    
    // Verificar que el componente realmente tiene cargando en false
    expect(component.cargando).toBeFalse();

    // Verificar que el spinner NO está presente
    expect(el.querySelector('c-spinner')).toBeNull();
  });

  it('usa listarPaginaSinGlobalLoader en paginación', () => {
    (component as any).ngOnInit = () => {};
    component.pageNo = 0; component.pageSize = 5;
    (component as any).obtenerListaCategorias();
    expect(mockService.listarPaginaSinGlobalLoader).toHaveBeenCalledWith(0, 5);
  });
});
import { Router } from '@angular/router';
import { CategoriaService } from '../../../core/services/data/categoria.service';
import { LoggerService } from '../../../core/services/logger.service';
import { SearchUtilService } from '../../../core/services/utils/search-util.service';
