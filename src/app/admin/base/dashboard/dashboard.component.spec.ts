import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('parsea fechas del backend', () => {
    const d = component as any;
    const res = d.parseBackendDate('15-11-2025 13:45:00');
    expect(res).toBeTruthy();
    expect(res?.getFullYear()).toBe(2025);
    expect(res?.getMonth()).toBe(10);
    expect(res?.getDate()).toBe(15);
    const res2 = d.parseBackendDate('15-11-2025');
    expect(res2?.getMonth()).toBe(10);
  });

  it('formatea etiquetas por día', () => {
    const label = (component as any).formatLabelFromDate('15-11-2025', 'day');
    expect(label).toBe('2025-11-15');
  });

  it('formatea rango semanal', () => {
    const label = (component as any).formatLabelFromDate('2025-11-15', 'week');
    expect(label).toMatch(/^\d{2}\/\d{2}\/\d{4} - \d{2}\/\d{2}\/\d{4}$/);
  });

  it('formatea mensual con nombre de mes', () => {
    const label = (component as any).formatLabelFromDate('2025-01-05', 'month', false);
    expect(label).toBe('Enero 2025');
  });

  it('formatea mensual abreviado en móvil', () => {
    const label = (component as any).formatLabelFromDate('2025-01-05', 'month', true);
    expect(label).toBe('Ene 2025');
  });
});
  it('inicializa coherente: 30 días y granularidad diaria', () => {
    expect(component.seriesDays).toBe(30);
    expect(component.seriesGranularity).toBe('day');
    expect(Array.isArray(component.data.labels)).toBeTrue();
    expect(component.data.labels.length).toBe(30);
  });

  it('actualiza granularidad al modificar filtros', () => {
    component.changeSeriesGranularity('week');
    expect(component.seriesGranularity).toBe('week');
    component.changeSeriesGranularity('month');
    expect(component.seriesGranularity).toBe('month');
    component.changeSeriesGranularity('day');
    expect(component.seriesGranularity).toBe('day');
  });
