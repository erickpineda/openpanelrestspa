import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AdminComponent } from './admin.component';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { IconSetService } from '@coreui/icons-angular';
import { DashboardApiService } from '../core/services/dashboard-api.service';
import { BadgeCounterService } from '../core/services/ui/badge-counter.service';
import { TranslationService } from '../core/services/translation.service';
import { LanguageService } from '../core/services/language.service';
import { ComentarioService } from '../core/services/data/comentario.service';
import { TemporaryStorageService } from '../core/services/ui/temporary-storage.service';
import { LoggerService } from '../core/services/logger.service';
import { LoadingService } from '../core/services/ui/loading.service';
import { ToastService } from '../core/services/ui/toast.service';
import { TokenStorageService } from '../core/services/auth/token-storage.service';
import { AuthService } from '../core/services/auth/auth.service';
import { SidebarStateService } from '../core/services/ui/sidebar-state.service';
import { NavigationService } from '../core/services/ui/navigation.service';
import { UserRole } from '../shared/types/navigation.types';

fdescribe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminComponent],
      providers: [
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy('navigate'),
            url: '/admin/dashboard',
            events: of({})
          }
        },
        { provide: Title, useValue: {} },
        { provide: IconSetService, useValue: { icons: {} } },
        {
          provide: TemporaryStorageService,
          useValue: {
            entriesChanged$: of([]),
            getAllTemporaryEntries: () => [],
            clearAllTemporaryEntries: jasmine.createSpy('clearAllTemporaryEntries')
          }
        },
        {
          provide: LoggerService,
          useValue: {
            debug: () => {},
            info: () => {},
            error: () => {},
            warn: () => {}
          }
        },
        { provide: LoadingService, useValue: { globalLoading$: of(false) } },
        { provide: ToastService, useValue: { toasts$: of([]) } },
        {
          provide: DashboardApiService,
          useValue: { getContentStats: () => of({ totalEntradas: 0 }) },
        },
        {
          provide: TokenStorageService,
          useValue: {
            isLoggedIn: () => true,
            getUserRole: () => UserRole.ADMINISTRADOR,
            getToken: () => 'mock-token'
          }
        },
        { provide: AuthService, useValue: { isTokenValid: () => true } },
        {
          provide: SidebarStateService,
          useValue: {
            updateNavItems: jasmine.createSpy('updateNavItems')
          }
        },
        {
          provide: NavigationService,
          useValue: {
            setNavigationItems: jasmine.createSpy('setNavigationItems'),
            getNavigationItems: () => of([])
          }
        },
        {
          provide: BadgeCounterService,
          useValue: { initializeCounters: jasmine.createSpy('initializeCounters') }
        },
        {
          provide: TranslationService,
          useValue: {
            translate: (key: string) => key,
            translations$: of({})
          }
        },
        { provide: LanguageService, useValue: {} },
        {
          provide: ComentarioService,
          useValue: {
            listarSafeSinGlobalLoader: () => of([])
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    TestBed.overrideTemplate(AdminComponent, '<div></div>');

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize navigation service with items', () => {
    const navigationService = TestBed.inject(NavigationService);
    expect(navigationService.setNavigationItems).toHaveBeenCalled();
  });
});
