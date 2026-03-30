import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ContactComponent } from './contact.component';
import { TranslationService } from '../../../../core/services/translation.service';
import { BehaviorSubject } from 'rxjs';
import { ToastService } from '../../../../core/services/ui/toast.service';

describe('ContactComponent', () => {
  let component: ContactComponent;
  let fixture: ComponentFixture<ContactComponent>;

  const translationServiceMock = {
    translations$: new BehaviorSubject({}),
    translate: (key: string) => key,
    instant: (key: string) => key,
  };

  const toastServiceMock = {
    showSuccess: () => undefined,
    showError: () => undefined,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        { provide: TranslationService, useValue: translationServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('buildMailtoHref incluye subject y body', () => {
    component.model.name = 'Pepe';
    component.model.email = 'pepe@example.com';
    component.model.phone = '123';
    component.model.message = 'Hola';

    const href = component.buildMailtoHref();
    expect(href.startsWith('mailto:')).toBeTrue();
    expect(href).toContain('subject=');
    expect(href).toContain('body=');
  });
});
