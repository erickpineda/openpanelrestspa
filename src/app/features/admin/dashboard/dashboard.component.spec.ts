import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { DashboardConfigService } from './srv/dashboard-config.service';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { LoggerService } from '@app/core/services/logger.service';
import { DashboardFacadeService } from './srv/dashboard-facade.service';
import { DashboardExportService } from './srv/dashboard-export.service';
import { DashboardChartService } from './srv/dashboard-chart.service';
import { LoadingService } from '@app/core/services/ui/loading.service';
import { ToastService } from '@app/core/services/ui/toast.service';
import { AuthSyncService } from '@app/core/services/auth/auth-sync.service';
import { of } from 'rxjs';
import { TranslationService } from '@app/core/services/translation.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      config: {
        seriesDays: 99,
        seriesGranularity: 'week',
        topLimit: 50,
        topPeriodDays: 60,
        recentSize: 15,
        estadoNominalChartType: 'line',
        estadoNominalStacked: false,
      },
    };

    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      imports: [TranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: DashboardConfigService, useValue: mockConfigService },
        { provide: ChangeDetectorRef, useValue: { detectChanges: () => {} } },
        { provide: LoggerService, useValue: { debug: () => {}, error: () => {} } },
        {
          provide: TranslationService,
          useValue: {
            instant: (key: string) => key,
            translations$: of({}),
            translate: (key: string) => of(key),
          },
        },
        {
          provide: DashboardFacadeService,
          useValue: {
            getSummary: () => of({}),
            getSeriesActivity: () => of([]),
            getTop: () => of([]),
            getStorage: () => of({}),
            getContentStats: () => of({}),
            getRecentActivity: () => of([]),
            refreshAll: () => of([{}, [], [], [], [], {}, {}]),
            refreshTopWidgets: () => of([[], [], []]),
            getSeriesEntriesSplitEstado: () => of([]),
            getSeriesEntriesSplitEstadoNombre: () => of([]),
            evictSummary: () => {},
            evictSeries: () => {},
            evictTop: () => {},
            evictContentStats: () => {},
          },
        },
        { provide: DashboardExportService, useValue: {} },
        {
          provide: DashboardChartService,
          useValue: {
            generateMainSeriesChart: () => ({ labels: [], datasets: [] }),
            generateEmptyMainSeriesChart: () => ({ labels: [], datasets: [] }),
            generateContentStatsChart: () => ({ labels: [], datasets: [] }),
            transformSplitEstado: () => ({ labels: [], datasets: [] }),
            transformSplitEstadoNombre: () => ({ labels: [], datasets: [] }),
            getEtatNominalOptions: () => ({}),
            calculateKpiPublicadas: () => 0,
            calculateKpiNoPublicadas: () => 0,
            calculateSumSeries: () => 0,
            calculateContentEstadoRows: () => [],
            formatBytes: () => '0 B',
            getPeriodDates: () => ({ startDate: '2023-01-01', endDate: '2023-01-02' }),
          },
        },
        {
          provide: LoadingService,
          useValue: {
            setGlobalLoading: () => {},
            registerRetryHandler: () => {},
            forceStopLoading: () => {},
          },
        },
        {
          provide: ToastService,
          useValue: { showSuccess: () => {}, showError: () => {}, showWarning: () => {} },
        },
        { provide: AuthSyncService, useValue: { notifyChanged: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    // We don't call fixture.detectChanges() immediately to avoid ngOnInit running before we check constructor logic if we wanted,
    // but constructor runs on createComponent.
  });

  it('should initialize configuration from DashboardConfigService', () => {
    expect(component.seriesDays).toBe(99);
    expect(component.seriesGranularity).toBe('week');
    expect(component.topLimit).toBe(50);
    expect(component.topPeriodDays).toBe(60);
    expect(component.recentSize).toBe(15);
    expect(component.estadoNominalChartType).toBe('line');
    expect(component.estadoNominalStacked).toBe(false);
  });

  it('should initialize settings object correctly from config', () => {
    expect(component.settings.seriesDays).toBe(99);
    expect(component.settings.seriesGranularity).toBe('week');
    expect(component.settings.topLimit).toBe(50);
    expect(component.settings.topPeriodDays).toBe(60);
  });

  it('should reset settings to configuration values', () => {
    // Change settings
    component.settings.seriesDays = 123;
    component.settings.seriesGranularity = 'month';

    // Reset
    component.resetSettings();

    // Verify
    expect(component.settings.seriesDays).toBe(99); // 99 is from mockConfigService
    expect(component.settings.seriesGranularity).toBe('week');
    expect(component.settings.topLimit).toBe(50);
    expect(component.settings.topPeriodDays).toBe(60);
  });
});
