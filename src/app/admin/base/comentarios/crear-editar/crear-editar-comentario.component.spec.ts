import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { CrearEditarComentario } from './crear-editar-comentario.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonFunctionalityService } from '../../../../shared/services/common-functionality.service';
import { EntradaService } from '../../../../core/services/data/entrada.service';
import { ComentarioService } from '../../../../core/services/data/comentario.service';
import { UsuarioService } from '../../../../core/services/data/usuario.service';
import { TokenStorageService } from '../../../../core/services/auth/token-storage.service';

describe('CrearEditarComentario Cancel', () => {
  let component: CrearEditarComentario;
  let fixture: ComponentFixture<CrearEditarComentario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [CrearEditarComentario],
      providers: [
        { provide: CommonFunctionalityService, useValue: {} },
        { provide: EntradaService, useValue: {} },
        { provide: ComentarioService, useValue: {} },
        { provide: UsuarioService, useValue: {} },
        { provide: TokenStorageService, useValue: { getUser: () => ({ id: 1 }) } },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    TestBed.overrideTemplate(CrearEditarComentario, '<button id="cancel" (click)="cancelar()"></button>');
    fixture = TestBed.createComponent(CrearEditarComentario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('navega al listado al cancelar', () => {
    const router = TestBed.inject(Router);
    const spy = spyOn(router as any, 'navigate').and.returnValue(Promise.resolve(true));
    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('#cancel') as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalledWith(['/admin/control/comentarios']);
  });
});
