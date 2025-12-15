import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RolesListComponent } from './listado-roles.component';
import { RolService } from '../../../../core/services/data/rol.service';
import { PrivilegioService } from '../../../../core/services/data/privilegio.service';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { SearchUtilService } from '../../../../core/services/utils/search-util.service';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Rol } from '../../../../core/models/rol.model';
import { Privilegio } from '../../../../core/models/privilegio.model';

import { OPConstants } from '../../../../shared/constants/op-global.constants';

describe('RolesListComponent', () => {
  let component: RolesListComponent;
  let fixture: ComponentFixture<RolesListComponent>;
  let rolServiceSpy: jasmine.SpyObj<RolService>;
  let privilegioServiceSpy: jasmine.SpyObj<PrivilegioService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let searchUtilSpy: jasmine.SpyObj<SearchUtilService>;

  const mockPrivilegios: Privilegio[] = [
    { idPrivilegio: 1, nombre: 'P1', codigo: 'P1', descripcion: 'D1' },
    { idPrivilegio: 2, nombre: 'P2', codigo: 'P2', descripcion: 'D2' }
  ];

  beforeEach(async () => {
    const rSpy = jasmine.createSpyObj('RolService', ['listarPaginaSinGlobalLoader', 'crear', 'actualizar', 'borrar', 'obtenerPorCodigos', 'actualizarPrivilegios']);
    const pSpy = jasmine.createSpyObj('PrivilegioService', ['listarSafe']);
    const tSpy = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError', 'showWarning']);
    const lSpy = jasmine.createSpyObj('LoggerService', ['error']);
    const sSpy = jasmine.createSpyObj('SearchUtilService', ['buildRequest']);

    await TestBed.configureTestingModule({
      declarations: [ RolesListComponent ],
      providers: [
        { provide: RolService, useValue: rSpy },
        { provide: PrivilegioService, useValue: pSpy },
        { provide: ToastService, useValue: tSpy },
        { provide: LoggerService, useValue: lSpy },
        { provide: SearchUtilService, useValue: sSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    rolServiceSpy = TestBed.inject(RolService) as jasmine.SpyObj<RolService>;
    privilegioServiceSpy = TestBed.inject(PrivilegioService) as jasmine.SpyObj<PrivilegioService>;
    toastSpy = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    loggerSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    searchUtilSpy = TestBed.inject(SearchUtilService) as jasmine.SpyObj<SearchUtilService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RolesListComponent);
    component = fixture.componentInstance;
    
    // Setup default returns
    rolServiceSpy.listarPaginaSinGlobalLoader.and.returnValue(of({ elements: [], totalElements: 0 } as any));
    privilegioServiceSpy.listarSafe.and.returnValue(of(mockPrivilegios));
    rolServiceSpy.obtenerPorCodigos.and.returnValue(of({ elements: [], totalElements: 0 }));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Restrictions for PROPIETARIO Role', () => {
    const propRol = new Rol();
    propRol.idRol = 1; // Keep ID for consistency with model
    propRol.codigo = OPConstants.Roles.PROPIETARIO_CODE; // Updated to match PROPI code
    propRol.nombre = 'Propietario';
    propRol.privilegios = [];

    it('should identify PROPIETARIO as a protected role', () => {
      expect(component.isProtectedRole(propRol)).toBeTrue();
    });

    it('should prevent deletion of PROPIETARIO role', () => {
      component.delete(propRol);
      expect(toastSpy.showWarning).toHaveBeenCalledWith(jasmine.stringMatching(/no se puede eliminar/i), jasmine.any(String));
      expect(component.rolToDelete).toBeNull(); 
    });

    it('should ensure PROPIETARIO has all privileges when opening edit', () => {
      component.privilegios = mockPrivilegios;
      component.openEdit(propRol);
      
      expect(component.editRol?.privilegios.length).toBe(mockPrivilegios.length);
      expect(component.editRol?.privilegios).toEqual(mockPrivilegios);
    });

    it('should prevent removing privileges via togglePrivilegio', () => {
      component.editRol = { ...propRol, privilegios: [...mockPrivilegios] };
      const privToRemove = mockPrivilegios[0];
      
      component.togglePrivilegio(privToRemove, false); // Try to uncheck
      
      expect(component.editRol.privilegios.length).toBe(mockPrivilegios.length);
      expect(component.editRol.privilegios).toContain(privToRemove);
    });

    it('should prevent unchecking all privileges', () => {
      component.editRol = { ...propRol, privilegios: [...mockPrivilegios] };
      component.toggleAllPrivilegios(false); // Try to uncheck all
      
      expect(component.editRol.privilegios.length).toBe(mockPrivilegios.length);
    });

    it('should enforce all privileges on saveEdit even if modified', () => {
      component.editRol = { ...propRol, privilegios: [] }; // Simulate empty privileges
      component.isEditing = true;
      
      rolServiceSpy.actualizar.and.returnValue(of({}));
      rolServiceSpy.actualizarPrivilegios.and.returnValue(of({}));

      component.saveEdit();

      // Check that it was saved with all privileges
      expect(component.editRol.privilegios.length).toBe(mockPrivilegios.length);
      // Verify update call
      expect(rolServiceSpy.actualizar).toHaveBeenCalled();
      // Verify privileges update call uses all codes
      const expectedCodes = mockPrivilegios.map(p => p.codigo);
      expect(rolServiceSpy.actualizarPrivilegios).toHaveBeenCalledWith(propRol.codigo, expectedCodes);
    });
  });

  describe('Restrictions for ADMIN Role', () => {
    const adminRol = new Rol();
    adminRol.idRol = 2; // Keep ID for consistency with model
    adminRol.codigo = OPConstants.Roles.ADMIN_CODE;
    adminRol.nombre = 'Administrador';
    adminRol.privilegios = [];

    it('should identify ADMIN as a protected role', () => {
      expect(component.isProtectedRole(adminRol)).toBeTrue();
    });

    it('should prevent deletion of ADMIN role', () => {
      component.delete(adminRol);
      expect(toastSpy.showWarning).toHaveBeenCalledWith(jasmine.stringMatching(/no se puede eliminar/i), jasmine.any(String));
    });

    it('should prevent saving ADMIN role with no privileges', () => {
      component.editRol = { ...adminRol, privilegios: [] };
      component.isEditing = true;

      component.saveEdit();

      expect(toastSpy.showWarning).toHaveBeenCalledWith(jasmine.stringMatching(/no puede quedar sin privilegios/i), jasmine.any(String));
      expect(rolServiceSpy.actualizar).not.toHaveBeenCalled();
    });

    it('should allow saving ADMIN role with at least one privilege', () => {
      component.editRol = { ...adminRol, privilegios: [mockPrivilegios[0]] };
      component.isEditing = true;

      rolServiceSpy.actualizar.and.returnValue(of({}));
      rolServiceSpy.actualizarPrivilegios.and.returnValue(of({}));

      component.saveEdit();

      expect(rolServiceSpy.actualizar).toHaveBeenCalled();
    });
  });
});
