import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { ComentariosPublicComponent } from './comentarios-public.component';
import { ComentarioService } from '@app/core/services/data/comentario.service';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { PublicCommentsUxService } from '../services/public-comments-ux.service';

describe('ComentariosPublicComponent', () => {
  let component: ComentariosPublicComponent;
  let fixture: ComponentFixture<ComentariosPublicComponent>;

  const tokenStorageMock = {
    getToken: () => null,
    getUser: () => null,
  };

  const comentarioServiceMock = {
    listarPorIdEntrada: () =>
      of({ elements: [], totalElements: 0, totalPages: 0, hasMore: false } as any),
    crear: () => of({} as any),
    obtenerRecuentosPorIdEntradaCached: () => of(null),
  };

  it('muestra contador sincronizado por defecto (sin total)', async () => {
    await TestBed.configureTestingModule({
      declarations: [ComentariosPublicComponent],
      providers: [
        { provide: ComentarioService, useValue: comentarioServiceMock },
        { provide: TokenStorageService, useValue: tokenStorageMock },
        {
          provide: PublicCommentsUxService,
          useValue: { strategy: 'SYNCED', useRecuentosEndpoint: false, pendingNoticeTtlMs: 1000 },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ComentariosPublicComponent);
    component = fixture.componentInstance;
    component.idEntrada = 1;
    component.totalComentarios = 24;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Comentarios');
    expect(fixture.nativeElement.textContent).toContain('(0)');
    expect(fixture.nativeElement.textContent).not.toContain('/ 24');
  });

  it('muestra (visibles / total) y mensaje de moderación en estrategia TOTAL_WITH_MESSAGE', async () => {
    await TestBed.configureTestingModule({
      declarations: [ComentariosPublicComponent],
      providers: [
        {
          provide: ComentarioService,
          useValue: {
            ...comentarioServiceMock,
            listarPorIdEntrada: () =>
              of({ elements: [], totalElements: 0, totalPages: 0, hasMore: false } as any),
            obtenerRecuentosPorIdEntradaCached: () => of(null),
          },
        },
        { provide: TokenStorageService, useValue: tokenStorageMock },
        {
          provide: PublicCommentsUxService,
          useValue: { strategy: 'TOTAL_WITH_MESSAGE', useRecuentosEndpoint: false, pendingNoticeTtlMs: 1000 },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ComentariosPublicComponent);
    component = fixture.componentInstance;
    component.idEntrada = 1;
    component.totalComentarios = 24;
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('(0 / 24)');
    expect(text).toContain('en espera de moderación');
  });
});
