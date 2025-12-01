import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListadoCategoriasComponent } from './listado-categorias.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CategoriaService } from '../../../core/services/data/categoria.service';
import { of, throwError } from 'rxjs';

describe('ListadoCategoriasComponent spinner finalize', () => {
  let component: ListadoCategoriasComponent;
  let fixture: ComponentFixture<ListadoCategoriasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListadoCategoriasComponent],
      providers: [
        { provide: CategoriaService, useValue: { listarSinGlobalLoader: () => of([]) } },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    TestBed.overrideTemplate(ListadoCategoriasComponent, '<div></div>');
    fixture = TestBed.createComponent(ListadoCategoriasComponent);
    component = fixture.componentInstance;
  });

  it('apaga cargando tras éxito', () => {
    component.obtenerListaCategorias();
    expect(component.cargando).toBeFalse();
  });

  it('apaga cargando tras error', () => {
    const svc = TestBed.inject(CategoriaService);
    spyOn(svc, 'listarSinGlobalLoader').and.returnValue(throwError(() => ({ status: 500 })));
    component.obtenerListaCategorias();
    expect(component.cargando).toBeFalse();
  });
});

