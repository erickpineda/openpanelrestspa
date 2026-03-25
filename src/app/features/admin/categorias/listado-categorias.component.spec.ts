import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ListadoCategoriasComponent } from './listado-categorias.component';
import { CategoriaService } from '@app/core/services/data/categoria.service';
import { LoggerService } from '@app/core/services/logger.service';
import { SearchUtilService } from '@app/core/services/utils/search-util.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '@app/core/services/translation.service';

describe('ListadoCategoriasComponent Spinner', () => {
  let component: ListadoCategoriasComponent;
  let fixture: any;
  let mockService: any;

  const translationServiceMock = {
    translations$: new BehaviorSubject({}),
    translate: (key: string) => key,
    instant: (key: string) => key,
  };

  beforeEach(() => {
    mockService = {
      listarPaginaSinGlobalLoader: jasmine
        .createSpy('listarPaginaSinGlobalLoader')
        .and.returnValue({ pipe: () => ({ subscribe: () => {} }) }),
      buscarSinGlobalLoader: jasmine
        .createSpy('buscarSinGlobalLoader')
        .and.returnValue({ pipe: () => ({ subscribe: () => {} }) }),
    };
    TestBed.configureTestingModule({
      declarations: [ListadoCategoriasComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [CommonModule, TranslatePipe],
      providers: [
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: CategoriaService, useValue: mockService },
        {
          provide: LoggerService,
          useValue: {
            error: () => {},
            warn: () => {},
            info: () => {},
            debug: () => {},
          },
        },
        { provide: SearchUtilService, useValue: { buildSingle: () => ({}) } },
        { provide: TranslationService, useValue: translationServiceMock },
      ],
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

  it('oculta spinner cuando cargando=false', () => {
    spyOn(component, 'obtenerListaCategorias');
    component.cargando = false;
    component.pagedCategorias = [{ codigo: 'A', nombre: 'A', descripcion: '' } as any];
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(component.cargando).toBeFalse();
    expect(el.querySelector('c-spinner')).toBeNull();
  });

  it('usa listarPaginaSinGlobalLoader en paginación', () => {
    (component as any).ngOnInit = () => {};
    component.pageNo = 0;
    component.pageSize = 5;
    (component as any).obtenerListaCategorias();
    expect(mockService.listarPaginaSinGlobalLoader).toHaveBeenCalledWith(0, 5);
  });
});
