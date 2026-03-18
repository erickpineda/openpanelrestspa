import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { OpPaginationComponent } from './op-pagination.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '@app/core/services/translation.service';

describe('OpPaginationComponent', () => {
  let component: OpPaginationComponent;
  let fixture: ComponentFixture<OpPaginationComponent>;

  const translationServiceMock = {
    translations$: new BehaviorSubject({}),
    translate: (key: string) => key,
    instant: (key: string) => key,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OpPaginationComponent],
      imports: [TranslatePipe],
      providers: [{ provide: TranslationService, useValue: translationServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(OpPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('actualizarPaginasVisibles calcula rango al inicio y al final', () => {
    component.totalPages = 10;
    component.currentPage = 0;
    component.paginasRange = 4;
    component.actualizarPaginasVisibles();
    expect(component.paginasVisibles).toEqual([0, 1, 2, 3]);

    component.currentPage = 9;
    component.actualizarPaginasVisibles();
    expect(component.paginasVisibles).toEqual([6, 7, 8, 9]);
  });

  it('ngOnChanges actualiza páginas visibles cuando cambian inputs', () => {
    component.totalPages = 3;
    component.currentPage = 1;
    component.paginasRange = 4;

    const spy = spyOn(component, 'actualizarPaginasVisibles');
    component.ngOnChanges({
      totalPages: new SimpleChange(0, 3, true),
    } as any);
    expect(spy).toHaveBeenCalled();
  });

  it('cambiarPagina emite solo si está dentro de límites', () => {
    component.totalPages = 3;
    component.currentPage = 1;
    const emitSpy = spyOn(component.pageChange, 'emit');

    component.cambiarPagina(1);
    expect(emitSpy).toHaveBeenCalledWith(2);

    emitSpy.calls.reset();
    component.currentPage = 2;
    component.cambiarPagina(1);
    expect(emitSpy).not.toHaveBeenCalled();

    component.currentPage = 0;
    component.cambiarPagina(-1);
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
