import { TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ListadoComentariosComponent } from './listado-comentarios.component';
import { Router } from '@angular/router';
import { ComentarioService } from '../../../core/services/data/comentario.service';
import { UsuarioService } from '../../../core/services/data/usuario.service';
import { EntradaService } from '../../../core/services/data/entrada.service';
import { CommonFunctionalityService } from '../../../shared/services/common-functionality.service';
import { LoggerService } from '../../../core/services/logger.service';

describe('ListadoComentariosComponent Spinner', () => {
  let component: ListadoComentariosComponent;
  let fixture: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListadoComentariosComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [CommonModule],
      providers: [
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: ComentarioService, useValue: { listarPagina: () => ({ pipe: () => ({ subscribe: () => {} }) }) } },
        { provide: UsuarioService, useValue: {} },
        { provide: EntradaService, useValue: {} },
        { provide: CommonFunctionalityService, useValue: { truncateText: (s: string, n: number) => s } },
        { provide: LoggerService, useValue: { error: () => {}, warn: () => {}, info: () => {}, debug: () => {} } },
      ]
    });
    fixture = TestBed.createComponent(ListadoComentariosComponent);
    component = fixture.componentInstance;
  });

  it('muestra spinner cuando cargando=true', () => {
    component.cargando = true;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('c-spinner')).toBeTruthy();
  });

  it('oculta spinner cuando cargando=false', () => {
    (component as any).ngOnInit = () => {};
    component.cargando = false;
    component.pagedComentarios = [{ idComentario: 1, contenido: 'X' } as any];
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('table')).toBeTruthy();
  });
});
