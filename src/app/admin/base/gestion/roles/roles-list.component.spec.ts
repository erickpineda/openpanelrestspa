import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RolesListComponent } from './roles-list.component';
import { RolService } from '../../../../core/services/data/rol.service';
import { PrivilegioService } from '../../../../core/services/data/privilegio.service';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('RolesListComponent', () => {
  let component: RolesListComponent;
  let fixture: ComponentFixture<RolesListComponent>;
  let rolServiceSpy: jasmine.SpyObj<RolService>;
  let privilegioServiceSpy: jasmine.SpyObj<PrivilegioService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(async () => {
    const rSpy = jasmine.createSpyObj('RolService', ['listarPaginaSinGlobalLoader', 'crear', 'actualizar', 'borrar']);
    const pSpy = jasmine.createSpyObj('PrivilegioService', ['listarSafe']);
    const tSpy = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError', 'showWarning']);
    const lSpy = jasmine.createSpyObj('LoggerService', ['error']);

    await TestBed.configureTestingModule({
      declarations: [ RolesListComponent ],
      providers: [
        { provide: RolService, useValue: rSpy },
        { provide: PrivilegioService, useValue: pSpy },
        { provide: ToastService, useValue: tSpy },
        { provide: LoggerService, useValue: lSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    rolServiceSpy = TestBed.inject(RolService) as jasmine.SpyObj<RolService>;
    privilegioServiceSpy = TestBed.inject(PrivilegioService) as jasmine.SpyObj<PrivilegioService>;
    toastSpy = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    loggerSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RolesListComponent);
    component = fixture.componentInstance;
    
    // Setup default returns
    rolServiceSpy.listarPaginaSinGlobalLoader.and.returnValue(of({ elements: [], totalElements: 0 }));
    privilegioServiceSpy.listarSafe.and.returnValue(of([]));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load roles on init', () => {
    expect(rolServiceSpy.listarPaginaSinGlobalLoader).toHaveBeenCalled();
    expect(privilegioServiceSpy.listarSafe).toHaveBeenCalled();
  });
});
