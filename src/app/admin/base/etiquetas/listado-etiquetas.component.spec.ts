import { TestBed } from '@angular/core/testing';
import { EtiquetasListComponent } from './listado-etiquetas.component';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { EtiquetaService } from '../../../core/services/data/etiqueta.service';

class MockEtiquetaService {
  private dataset: any[] = Array.from({ length: 8 }, (_, i) => ({
    idEtiqueta: i + 1,
    nombre: `Etiqueta ${i + 1}`,
    frecuencia: 0,
    descripcion: `Desc ${i + 1}`,
    colorHex: '#4ECDC4',
  }));

  listarPaginaSinGlobalLoader(pageNo: number, pageSize: number) {
    const start = pageNo * pageSize;
    const end = start + pageSize;
    const slice = this.dataset.slice(start, end);
    const totalElements = this.dataset.length;
    const totalPages = Math.ceil(totalElements / pageSize);
    return of({ data: { elements: slice, totalElements, totalPages } });
  }

  buscarSinGlobalLoader() {
    return of({ data: { elements: [], totalElements: 0, totalPages: 0 } });
  }
}

describe('EtiquetasListComponent - paginación', () => {
  let component: EtiquetasListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: EtiquetaService, useClass: MockEtiquetaService }, FormBuilder],
    });
    component = new EtiquetasListComponent(
      TestBed.inject(EtiquetaService),
      TestBed.inject(FormBuilder),
      { showError: () => {}, showSuccess: () => {} } as any,
      {
        error: () => {},
        info: () => {},
        warn: () => {},
        debug: () => {},
      } as any,
      { buildRequest: () => ({}) } as any,
      { detectChanges: () => {} } as any
    );
  });

  it('muestra exactamente 5 etiquetas por página', () => {
    component.pageSize = 5;
    component.pageNo = 0;
    component.loadEtiquetas();
    expect(component.pagedEtiquetas.length).toBe(5);
  });

  it('desactiva botón "Siguiente" al llegar al final', () => {
    component.pageSize = 5;
    component.pageNo = 1; // segunda página (última, 3 elementos)
    component.loadEtiquetas();
    expect(component.pagedEtiquetas.length).toBe(3);
    expect(component.isNextDisabled()).toBeTrue();
  });

  it('no muestra páginas vacías al alcanzar el final', () => {
    component.pageSize = 5;
    component.pageNo = 2; // más allá del final
    component.loadEtiquetas();
    expect(component.pageNo).toBe(1);
    expect(component.etiquetas.length).toBe(3);
  });

  it('la navegación entre páginas funciona correctamente', () => {
    component.pageSize = 5;
    component.pageNo = 0;
    component.loadEtiquetas();
    expect(component.etiquetas.length).toBe(5);
    component.onNext();
    expect(component.pageNo).toBe(1);
    component.loadEtiquetas();
    expect(component.pagedEtiquetas.length).toBe(3);
    expect(component.isNextDisabled()).toBeTrue();
    component.onPrev();
    expect(component.pageNo).toBe(0);
  });
});
