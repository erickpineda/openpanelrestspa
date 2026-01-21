import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AdminComponent } from './admin.component';
import { of } from 'rxjs';
import { DashboardApiService } from '../core/services/dashboard-api.service';
import { TokenStorageService } from '../core/services/auth/token-storage.service';
import { AuthService } from '../core/services/auth/auth.service';
import { AuthSyncService } from '../core/services/auth/auth-sync.service';
import { LoggerService } from '../core/services/logger.service';
import { RouteTrackerService } from '../core/services/auth/route-tracker.service';
import { GlobalErrorHandlerService } from '../core/errors/global-error/global-error-handler.service';
import { UiAnomalyMonitorService } from '../core/services/ui/ui-anomaly-monitor.service';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminComponent],
      providers: [
        {
          provide: DashboardApiService,
          useValue: { getContentStats: () => of({ totalEntradas: 0 }) },
        },
        { 
          provide: TokenStorageService, 
          useValue: { 
            isLoggedIn: () => true,
            getUserRole: () => 'ADMIN'
          } 
        },
        { provide: AuthService, useValue: { isTokenValid: () => true } },
        { provide: AuthSyncService, useValue: {} },
        { 
          provide: LoggerService, 
          useValue: { 
            debug: () => {}, 
            info: () => {}, 
            error: () => {}, 
            warn: () => {} 
          } 
        },
        { provide: RouteTrackerService, useValue: {} },
        { provide: GlobalErrorHandlerService, useValue: {} },
        { provide: UiAnomalyMonitorService, useValue: {} }
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
});
