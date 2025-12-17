import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilComponent } from './perfil.component';
import { UsuarioService } from '../../../../core/services/data/usuario.service';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { FileStorageService } from '../../../../core/services/file-storage.service';
import { of, throwError } from 'rxjs';

describe('PerfilComponent', () => {
  let component: PerfilComponent;
  let fixture: ComponentFixture<PerfilComponent>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['obtenerDatosSesionActualSafe', 'actualizarParcial']);
    toastSpy = jasmine.createSpyObj('ToastService', ['showError', 'showSuccess']);

    await TestBed.configureTestingModule({
      declarations: [PerfilComponent],
      providers: [
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: FileStorageService, useValue: {} }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PerfilComponent);
    component = fixture.componentInstance;
  });

  it('debe ocultar el spinner tras carga exitosa', () => {
    usuarioServiceSpy.obtenerDatosSesionActualSafe.and.returnValue(of({ idUsuario: 1, username: 'test' } as any));
    component.ngOnInit();
    expect(component.loading).toBeFalse();
    expect(component.usuario?.username).toBe('test');
  });

  it('debe ocultar el spinner y mostrar error ante fallo', () => {
    usuarioServiceSpy.obtenerDatosSesionActualSafe.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.loading).toBeFalse();
    expect(toastSpy.showError).toHaveBeenCalled();
  });
});
