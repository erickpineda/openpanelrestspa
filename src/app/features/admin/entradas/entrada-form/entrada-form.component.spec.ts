import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormBuilder, ReactiveFormsModule, UntypedFormArray } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';

import { EntradaFormComponent } from './entrada-form.component';
import { ValidationEntradaFormsService } from './srv/validation-entrada-forms.service';
import { FileStorageService } from '@app/core/services/file-storage.service';
import { TemporaryStorageService } from '@app/core/services/ui/temporary-storage.service';
import { ActiveTabService } from '@app/core/services/ui/active-tab.service';
import { LoggerService } from '@app/core/services/logger.service';
import { TranslationService } from '@app/core/services/translation.service';
import { ToastService } from '@app/core/services/ui/toast.service';
import { EntradaFormStateService } from '../services/entrada-form-state.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

describe('EntradaFormComponent', () => {
  let component: EntradaFormComponent;
  let fixture: ComponentFixture<EntradaFormComponent>;
  let fb: UntypedFormBuilder;

  // Mocks
  const routerMock = {
    navigate: jasmine.createSpy('navigate')
  };

  const vfMock = {
    getCategoriasArray: jasmine.createSpy('getCategoriasArray').and.returnValue({
      length: 0,
      removeAt: jasmine.createSpy('removeAt'),
      push: jasmine.createSpy('push'),
      value: []
    } as any)
  };

  const fileStorageMock = {};
  const temporaryStorageMock = {};
  const activeTabServiceMock = {
    registerActiveFeature: jasmine.createSpy('registerActiveFeature'),
    unregisterActiveFeature: jasmine.createSpy('unregisterActiveFeature')
  };
  const loggerMock = {
    debug: jasmine.createSpy('debug'),
    info: jasmine.createSpy('info'),
    error: jasmine.createSpy('error')
  };
  const translationServiceMock = {
    translations$: new BehaviorSubject({}),
    translate: (key: string) => key,
    instant: (key: string) => key
  };
  const toastServiceMock = {};
  const entradaFormStateServiceMock = {
    state$: new Subject(),
    currentState: {
      isFullWidth: false,
      isFullScreen: false,
      showBackToTop: false,
      showRecoveryNotification: false,
      temporaryData: null
    },
    checkForTemporaryData: jasmine.createSpy('checkForTemporaryData'),
    toggleFullWidth: jasmine.createSpy('toggleFullWidth'),
    toggleFullScreen: jasmine.createSpy('toggleFullScreen'),
    removeCurrentTemporaryEntry: jasmine.createSpy('removeCurrentTemporaryEntry')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntradaFormComponent],
      imports: [ReactiveFormsModule, TranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        UntypedFormBuilder,
        { provide: Router, useValue: routerMock },
        { provide: ValidationEntradaFormsService, useValue: vfMock },
        { provide: FileStorageService, useValue: fileStorageMock },
        { provide: TemporaryStorageService, useValue: temporaryStorageMock },
        { provide: ActiveTabService, useValue: activeTabServiceMock },
        { provide: LoggerService, useValue: loggerMock },
        { provide: TranslationService, useValue: translationServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: EntradaFormStateService, useValue: entradaFormStateServiceMock }
      ]
    })
    .overrideComponent(EntradaFormComponent, {
      set: { providers: [{ provide: EntradaFormStateService, useValue: entradaFormStateServiceMock }] }
    })
    .compileComponents();

    fb = TestBed.inject(UntypedFormBuilder);
    fixture = TestBed.createComponent(EntradaFormComponent);
    component = fixture.componentInstance;
    
    // Initialize form with form builder to avoid errors
    component.form = fb.group({
      titulo: [''],
      slug: [''],
      subtitulo: [''],
      contenido: [''],
      imagenDestacada: [null],
      estadoEntrada: [null],
      tipoEntrada: [null],
      fechaPublicacionProgramada: [null],
      publicada: [false],
      privado: [false],
      permitirComentario: [false],
      resumen: [''],
      notas: [''],
      password: [''],
      fechaPublicacion: [null],
      categorias: fb.array([])
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Reset functionality', () => {
    it('openResetConfirm should set resetConfirmVisible to true even if form is pristine', () => {
      // Arrange
      component.form.markAsPristine();
      component.resetConfirmVisible = false;

      // Act
      component.openResetConfirm();

      // Assert
      expect(component.resetConfirmVisible).toBeTrue();
    });

    it('onReset should reset the form and clear categories', () => {
      // Arrange
      // Mock categories array behavior
      const removeAtSpy = jasmine.createSpy('removeAt');
      const categoriasArrayMock = {
        length: 2,
        removeAt: removeAtSpy,
        value: [1, 2] // Simulate items
      };
      
      // Override the getter to return our mock that has items initially
      Object.defineProperty(categoriasArrayMock, 'length', {
        get: function() { return this.value.length; }
      });
      
      // We need to simulate the while loop behavior
      removeAtSpy.and.callFake(() => {
        categoriasArrayMock.value.shift();
      });

      vfMock.getCategoriasArray.and.returnValue(categoriasArrayMock as any);

      spyOn(component.form, 'reset');
      spyOn(component.form, 'patchValue');
      spyOn(component.form, 'markAsPristine');
      spyOn(component.form, 'markAsUntouched');

      // Act
      component.onReset();

      // Assert
      expect(component.form.reset).toHaveBeenCalled();
      // Expect categories to be cleared (removeAt called twice)
      expect(removeAtSpy).toHaveBeenCalledTimes(2);
      expect(component.form.patchValue).toHaveBeenCalledWith({ imagenDestacada: null });
      expect(component.form.markAsPristine).toHaveBeenCalled();
      expect(component.form.markAsUntouched).toHaveBeenCalled();
    });
  });

  describe('Form submission', () => {
    it('should strip data URI prefix from imagenDestacada on submit', () => {
      // Arrange
      const base64Content = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      const dataUri = `data:image/png;base64,${base64Content}`;
      
      component.form.patchValue({
        titulo: 'Test Entry',
        imagenDestacada: dataUri,
        contenido: 'Content'
      });
      
      spyOn(component.submitForm, 'emit');

      // Act
      component.onSubmit();

      // Assert
      expect(component.submitForm.emit).toHaveBeenCalled();
      const emittedData = (component.submitForm.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.imagenDestacada).toBe(base64Content);
    });

    it('should keep imagenDestacada as is if it is a URL', () => {
      // Arrange
      const url = 'http://example.com/image.jpg';
      
      component.form.patchValue({
        titulo: 'Test Entry',
        imagenDestacada: url,
        contenido: 'Content'
      });
      
      spyOn(component.submitForm, 'emit');

      // Act
      component.onSubmit();

      // Assert
      expect(component.submitForm.emit).toHaveBeenCalled();
      const emittedData = (component.submitForm.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.imagenDestacada).toBe(url);
    });
  });
});
