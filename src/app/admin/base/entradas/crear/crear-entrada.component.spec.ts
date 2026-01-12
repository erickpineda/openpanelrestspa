import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearEntradaComponent } from './crear-entrada.component';
import { EntradaFacadeService } from '../entrada-form/srv/entrada-facade.service';
import { ValidationEntradaFormsService } from '../entrada-form/srv/validation-entrada-forms.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { UntypedFormBuilder } from '@angular/forms';

describe('CrearEntradaComponent', () => {
  let component: CrearEntradaComponent;
  let fixture: ComponentFixture<CrearEntradaComponent>;
  let mockFacade: any;
  let mockValidation: any;

  beforeEach(async () => {
    mockFacade = {
      loadInitData: jasmine.createSpy('loadInitData').and.returnValue(Promise.resolve({ tipos: [], estados: [], categorias: [] })),
      crearEntrada: jasmine.createSpy('crearEntrada').and.returnValue(of({})),
      getUsuarioSesion: jasmine.createSpy('getUsuarioSesion').and.returnValue(Promise.resolve({ idUsuario: 1 }))
    };

    mockValidation = {
      buildForm: jasmine.createSpy('buildForm').and.returnValue(new UntypedFormBuilder().group({}))
    };

    await TestBed.configureTestingModule({
      declarations: [ CrearEntradaComponent ],
      imports: [ TranslateModule.forRoot() ],
      providers: [
        { provide: EntradaFacadeService, useValue: mockFacade },
        { provide: ValidationEntradaFormsService, useValue: mockValidation },
        { provide: Router, useValue: { navigateByUrl: jasmine.createSpy('navigateByUrl') } },
        { provide: ToastService, useValue: { showInfo: jasmine.createSpy('showInfo') } },
        { provide: LoggerService, useValue: { error: jasmine.createSpy('error') } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CrearEntradaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show preview modal when onPreviewEmit is called', () => {
    component.onPreviewEmit({});
    expect(component.modalPreviaVisible).toBeTrue();
  });

  it('should call onGuardar when publishing from preview', () => {
    spyOn(component, 'onGuardar');
    component.entradaParaPrevia = { titulo: 'Test' } as any;
    component.onPublicarDesdePreview();
    expect(component.onGuardar).toHaveBeenCalledWith(component.entradaParaPrevia as any);
    expect(component.modalPreviaVisible).toBeFalse();
  });
});
