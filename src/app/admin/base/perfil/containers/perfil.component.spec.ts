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
  let fileStorageSpy: jasmine.SpyObj<FileStorageService>;

  beforeEach(async () => {
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', [
      'obtenerDatosSesionActualSafe',
      'actualizarParcial',
    ]);
    toastSpy = jasmine.createSpyObj('ToastService', [
      'showError',
      'showSuccess',
    ]);
    fileStorageSpy = jasmine.createSpyObj('FileStorageService', ['uploadFile']);

    await TestBed.configureTestingModule({
      declarations: [PerfilComponent],
      providers: [
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: FileStorageService, useValue: fileStorageSpy },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PerfilComponent);
    component = fixture.componentInstance;
  });

  it('debe ocultar el spinner tras carga exitosa', () => {
    usuarioServiceSpy.obtenerDatosSesionActualSafe.and.returnValue(
      of({ idUsuario: 1, username: 'test' } as any),
    );
    component.ngOnInit();
    expect(component.loading).toBeFalse();
    expect(component.usuario?.username).toBe('test');
  });

  it('debe ocultar el spinner y mostrar error ante fallo', () => {
    usuarioServiceSpy.obtenerDatosSesionActualSafe.and.returnValue(
      throwError(() => new Error('fail')),
    );
    component.ngOnInit();
    expect(component.loading).toBeFalse();
    expect(toastSpy.showError).toHaveBeenCalled();
  });

  it('onSave should do nothing when usuario is null', () => {
    component.usuario = null;
    component.onSave({ username: 'x' } as any);
    expect(usuarioServiceSpy.actualizarParcial).not.toHaveBeenCalled();
  });

  it('onSave should call actualizarParcial and show success', () => {
    component.usuario = { idUsuario: 7 } as any;
    usuarioServiceSpy.actualizarParcial.and.returnValue(of({} as any));
    spyOn(component, 'cargarPerfil');

    component.onSave({ username: 'x' } as any);

    expect(usuarioServiceSpy.actualizarParcial).toHaveBeenCalledWith(7, {
      username: 'x',
    } as any);
    expect(toastSpy.showSuccess).toHaveBeenCalled();
    expect(component.cargarPerfil).toHaveBeenCalled();
  });

  it('onSave should show error when actualizarParcial fails', () => {
    component.usuario = { idUsuario: 7 } as any;
    usuarioServiceSpy.actualizarParcial.and.returnValue(
      throwError(() => new Error('fail')),
    );

    component.onSave({ username: 'x' } as any);
    expect(toastSpy.showError).toHaveBeenCalled();
  });

  it('triggerFileInput should click the input', () => {
    const el = { click: jasmine.createSpy('click') } as any;
    component.triggerFileInput(el);
    expect(el.click).toHaveBeenCalled();
  });

  it('onFileSelected should upload file and call onSave when url exists', () => {
    const file = new File(['x'], 'x.txt', { type: 'text/plain' });
    component.usuario = { idUsuario: 7 } as any;
    spyOn(component, 'onSave');
    fileStorageSpy.uploadFile.and.returnValue(of({ ruta: '/img.png' } as any));

    component.onFileSelected({ target: { files: [file] } } as any);

    expect(fileStorageSpy.uploadFile).toHaveBeenCalledWith(file, 'perfil');
    expect(component.onSave).toHaveBeenCalled();
  });

  it('onFileSelected should show success when url is missing', () => {
    const file = new File(['x'], 'x.txt', { type: 'text/plain' });
    component.usuario = { idUsuario: 7 } as any;
    fileStorageSpy.uploadFile.and.returnValue(of({} as any));

    component.onFileSelected({ target: { files: [file] } } as any);

    expect(toastSpy.showSuccess).toHaveBeenCalledWith('Imagen subida', 'Éxito');
  });

  it('onFileSelected should show error when upload fails', () => {
    const file = new File(['x'], 'x.txt', { type: 'text/plain' });
    component.usuario = { idUsuario: 7 } as any;
    fileStorageSpy.uploadFile.and.returnValue(throwError(() => new Error('x')));

    component.onFileSelected({ target: { files: [file] } } as any);

    expect(toastSpy.showError).toHaveBeenCalledWith(
      'Error al subir imagen',
      'Error',
    );
  });
});
