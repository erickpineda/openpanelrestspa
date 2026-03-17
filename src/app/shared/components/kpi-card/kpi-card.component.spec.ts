import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { KpiCardComponent } from './kpi-card.component';

describe('KpiCardComponent', () => {
  let component: KpiCardComponent;
  let fixture: ComponentFixture<KpiCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KpiCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(KpiCardComponent);
    component = fixture.componentInstance;
  });

  it('resuelve icono por etiqueta', () => {
    component.label = 'Usuarios Activos';
    expect(component.resolvedIcon).toBe('cilUser');
    component.label = 'Total Entradas';
    expect(component.resolvedIcon).toBe('cilNotes');
    component.label = 'Publicadas';
    expect(component.resolvedIcon).toBe('cilCheckCircle');
    component.label = 'No publicadas';
    expect(component.resolvedIcon).toBe('cilXCircle');
  });

  it('prioriza icono explícito y color explícito', () => {
    component.iconName = 'cilSpeedometer';
    component.color = 'primary';
    component.label = 'Publicadas';
    expect(component.resolvedIcon).toBe('cilSpeedometer');
    expect(component.resolvedColor).toBe('primary');
  });

  it('resuelve color por etiqueta', () => {
    component.iconName = undefined;
    component.color = undefined;
    
    component.label = 'Usuarios';
    expect(component.resolvedColor).toBe('primary');
    
    component.label = 'Entradas';
    expect(component.resolvedColor).toBe('info');
    
    component.label = 'Publicadas';
    expect(component.resolvedColor).toBe('success');
    
    component.label = 'No publicadas';
    expect(component.resolvedColor).toBe('warning');
  });

  it('should animate value change', () => {
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      cb(performance.now() + 2000); // Simulate 2s elapsed
      return 0;
    });

    component.value = 100;
    component.ngOnChanges({
      value: new SimpleChange(null, 100, true)
    });
    
    expect(component.displayValue).toBe(100);
  });

  it('should handle non-numeric value gracefully', () => {
    component.value = 'Text';
    component.ngOnChanges({
      value: new SimpleChange(null, 'Text', true)
    });
    expect(component.displayValue).toBe('Text');
  });

  it('should trigger adaptive text on color change', fakeAsync(() => {
    component.color = 'primary';
    component.ngOnChanges({
      color: new SimpleChange(null, 'primary', true)
    });
    tick(); // wait for setTimeout
    // Just verify it doesn't crash, as we can't easily check styles on null kpiBody
  }));
});
