import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AdminComponent } from './admin.component';
import { of, BehaviorSubject } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { DashboardApiService } from '../core/services/dashboard-api.service';
import { LoadingService } from '../core/services/ui/loading.service';
import { TokenStorageService } from '../core/services/auth/token-storage.service';
import { AuthService } from '../core/services/auth/auth.service';

class MockDashboardApiService { getContentStats = () => of({ totalEntradas: 0, totalComentarios: 0 }); }
class MockLoadingService { globalLoading$ = new BehaviorSubject<boolean>(false); }

describe('AdminComponent NG0100 mitigation', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let loading: MockLoadingService;

  beforeEach(async () => {
    loading = new MockLoadingService();
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AdminComponent],
      providers: [
        { provide: DashboardApiService, useClass: MockDashboardApiService },
        { provide: LoadingService, useValue: loading },
        { provide: TokenStorageService, useValue: { isLoggedIn: () => true } },
        { provide: AuthService, useValue: { isTokenValid: () => true } },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    TestBed.overrideTemplate(AdminComponent, '<div></div>');

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
  });

  it('no lanza NG0100 cuando globalLoading cambia tras la inicialización', fakeAsync(() => {
    expect(() => fixture.detectChanges()).not.toThrow();
    component.ngAfterViewInit();
    loading.globalLoading$.next(true);
    tick(0);
    expect(() => fixture.detectChanges()).not.toThrow();
  }));
});
