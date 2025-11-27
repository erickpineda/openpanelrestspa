import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      imports: [HttpClientTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
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
    expect(label).toBe('15/11/2025');
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

  it('formatea mensual desde YYYY-MM', () => {
    const label = (component as any).formatLabelFromDate('2025-02', 'month', false);
    expect(label).toBe('Febrero 2025');
  });

  it('formatea mensual desde YYYYMM', () => {
    const label = (component as any).formatLabelFromDate('202503', 'month', false);
    expect(label).toBe('Marzo 2025');
  });

  it('formatea mensual desde MM-YYYY', () => {
    const label = (component as any).formatLabelFromDate('04-2025', 'month', false);
    expect(label).toBe('Abril 2025');
  });

  it('formatea mensual desde MM/YYYY', () => {
    const label = (component as any).formatLabelFromDate('05/2025', 'month', false);
    expect(label).toBe('Mayo 2025');
  });

  it('formatea mensual desde DD-MM-YYYY', () => {
    const label = (component as any).formatLabelFromDate('15-06-2025', 'month', false);
    expect(label).toBe('Junio 2025');
  });
  it('inicializa coherente: 30 días y granularidad diaria', async () => {
    await (component as any).ngOnInit();
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

  it('colorForLabel es determinista por etiqueta', () => {
    const c = component as any;
    const a = c.colorForLabel('PUBLICADA', 0);
    const b = c.colorForLabel('PUBLICADA', 0);
    expect(a).toBe(b);
    const c1 = c.colorForLabel('NO PUBLICADA', 0);
    expect(a).not.toBe(c1);
  });

  it('CSV de serie incluye date_raw', () => {
    component.data = {
      labels: ['01/02/2025','02/02/2025'],
      datasets: [
        { label: 'Entradas', data: [1,2] },
        { label: 'Comentarios', data: [3,4] }
      ]
    } as any;
    (component as any).dataRawLabels = ['2025-02-01','2025-02-02'];
    const spy = spyOn(component as any, 'saveCsv');
    component.downloadCsvSeries();
    expect(spy).toHaveBeenCalledTimes(1);
    const args = (spy.calls.mostRecent().args);
    const csv = String(args[1]);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toContain('date,date_raw');
    expect(lines[1]).toContain('01/02/2025');
    expect(lines[1]).toContain('2025-02-01');
  });

  it('CSV de split nominal incluye date_raw', () => {
    (component as any).seriesEntriesSplitEstadoNombreData = {
      labels: ['01/02/2025','02/02/2025'],
      datasets: [
        { label: 'PUBLICADA', data: [1,2] },
        { label: 'NO PUBLICADA', data: [0,1] }
      ],
      _rawLabels: ['2025-02-01','2025-02-02']
    };
    const spy = spyOn(component as any, 'saveCsv');
    component.downloadCsvSeriesSplitEstadoNombre();
    expect(spy).toHaveBeenCalledTimes(1);
    const args = (spy.calls.mostRecent().args);
    const csv = String(args[1]);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toContain('date,date_raw');
    expect(lines[1]).toContain('01/02/2025');
    expect(lines[1]).toContain('2025-02-01');
  });
});
