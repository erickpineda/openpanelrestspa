import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsuariosListComponent } from './listado-usuarios.component';
import { UsuarioService } from '../../../../core/services/data/usuario.service';
import { RolService } from '../../../../core/services/data/rol.service';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { SearchUtilService } from '../../../../core/services/utils/search-util.service';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { OPConstants } from '../../../../shared/constants/op-global.constants';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('UsuariosListComponent', () => {
  let component: UsuariosListComponent;
  let fixture: ComponentFixture<UsuariosListComponent>;
  let mockUsuarioService: any;
  let mockRolService: any;
  let mockToastService: any;

  beforeEach(async () => {
    mockUsuarioService = {
      buscarSinGlobalLoader: jasmine.createSpy('buscarSinGlobalLoader').and.returnValue(of({ elements: [], totalElements: 0 })),
      crear: jasmine.createSpy('crear').and.returnValue(of({})),
      actualizar: jasmine.createSpy('actualizar').and.returnValue(of({})),
      actualizarParcial: jasmine.createSpy('actualizarParcial').and.returnValue(of({})),
      eliminar: jasmine.createSpy('eliminar').and.returnValue(of({})),
      borrar: jasmine.createSpy('borrar').and.returnValue(of({}))
    };

    mockRolService = {
      obtenerTodos: jasmine.createSpy('obtenerTodos').and.returnValue(of([])),
      listarPagina: jasmine.createSpy('listarPagina').and.returnValue(of({ elements: [], totalElements: 0 }))
    };

    mockToastService = {
      showSuccess: jasmine.createSpy('showSuccess'),
      showError: jasmine.createSpy('showError'),
      showWarning: jasmine.createSpy('showWarning')
    };

    await TestBed.configureTestingModule({
      declarations: [ UsuariosListComponent ],
      imports: [ FormsModule ],
      providers: [
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: RolService, useValue: mockRolService },
        { provide: ToastService, useValue: mockToastService },
        { provide: LoggerService, useValue: { log: () => {}, error: () => {} } },
        { provide: SearchUtilService, useValue: { buildCriteria: () => [] } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsuariosListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize roles with codes', () => {
    expect(component.PROPIETARIO_ROLE_CODE).toBe(OPConstants.Roles.PROPIETARIO);
  });

  it('should prevent deleting owner', () => {
    const ownerUser = { idUsuario: 1, rolCodigo: OPConstants.Roles.PROPIETARIO, username: 'admin' } as any;
    component.delete(ownerUser);
    expect(mockToastService.showWarning).toHaveBeenCalledWith('No se puede eliminar al usuario Propietario', 'Acción no permitida');
    expect(component.showDeleteModal).toBeFalse();
  });

  it('should allow deleting non-owner', () => {
    const user = { idUsuario: 2, rolCodigo: 'USER', username: 'user' } as any;
    component.delete(user);
    expect(component.userToDelete).toEqual(user);
    expect(component.showDeleteModal).toBeTrue();
  });

  it('should validate form based on rolCodigo', () => {
    component.editUser = { idUsuario: 1, username: 'test', email: 'test@test.com', rolCodigo: '' } as any;
    // Assuming isEmailValid returns true for test@test.com or mocking it if it's a component method
    // isEmailValid is private or public in component? It's used in template so likely public.
    // Let's assume it works or spy on it if needed. But it's a simple regex usually.
    
    expect(component.isUserFormValid()).toBeFalse(); // Missing rolCodigo

    component.editUser!.rolCodigo = 'ADMIN';
    expect(component.isUserFormValid()).toBeTrue();
  });
  
  it('should use partial update for existing users', () => {
    const user = { idUsuario: 1, rolCodigo: 'USER', username: 'test' } as any;
    component.openEdit(user);
    
    // Modify user
    if (component.editUser) {
      component.editUser.username = 'test_modified';
    }
    
    component.saveEdit();
    
    expect(mockUsuarioService.actualizarParcial).toHaveBeenCalled();
    expect(mockUsuarioService.actualizar).not.toHaveBeenCalled();
    expect(mockUsuarioService.crear).not.toHaveBeenCalled();
  });
  
  it('should use create for new users', () => {
    component.openCreate();
    component.saveEdit();
    
    expect(mockUsuarioService.crear).toHaveBeenCalled();
    expect(mockUsuarioService.actualizarParcial).not.toHaveBeenCalled();
  });
});
