import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SessionExpiredComponent } from './session-expired.component';
import { Router } from '@angular/router';
import { SessionManagerService } from '../../core/services/auth/session-manager.service';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { RouteTrackerService } from '../../core/services/auth/route-tracker.service';
import { PostLoginRedirectService } from '../services/auth/post-login-redirect.service';
import { UnsavedWorkService } from '../services/utils/unsaved-work.service';
import { TemporaryStorageService } from '../../core/services/ui/temporary-storage.service';
import { ActiveTabService } from '../services/ui/active-tab.service';
import { LoggerService } from '../services/logger.service';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { of, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

describe('SessionExpiredComponent', () => {
  let component: SessionExpiredComponent;
  let fixture: ComponentFixture<SessionExpiredComponent>;
  let routerMock: any;
  let sessionManagerMock: any;
  let tokenStorageMock: any;
  let routeTrackerMock: any;
  let postLoginRedirectMock: any;
  let unsavedWorkServiceMock: any;
  let temporaryStorageMock: any;
  let activeTabServiceMock: any;
  let loggerMock: any;

  beforeEach(async () => {
    routerMock = {
      navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true)),
      url: '/some/path',
      currentNavigation: jasmine.createSpy('currentNavigation').and.returnValue(null),
      events: of(),
      getCurrentNavigation: jasmine.createSpy('getCurrentNavigation').and.returnValue(null)
    };

    sessionManagerMock = {
      sessionExpired$: new Subject(),
      sessionRestored$: new Subject()
    };

    tokenStorageMock = {
      signOut: jasmine.createSpy('signOut'),
      getToken: jasmine.createSpy('getToken').and.returnValue('mock-token'),
      getUser: jasmine.createSpy('getUser').and.returnValue({ name: 'test' })
    };

    activeTabServiceMock = {
      clearCurrentTab: jasmine.createSpy('clearCurrentTab')
    };

    loggerMock = {
      info: jasmine.createSpy('info'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error')
    };

    // Mocks for other services to satisfy DI
    routeTrackerMock = {};
    postLoginRedirectMock = {
      saveLastValidRoute: jasmine.createSpy('saveLastValidRoute')
    };
    unsavedWorkServiceMock = {};
    temporaryStorageMock = {};

    await TestBed.configureTestingModule({
      declarations: [ SessionExpiredComponent ],
      imports: [ TranslateModule.forRoot() ],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: SessionManagerService, useValue: sessionManagerMock },
        { provide: TokenStorageService, useValue: tokenStorageMock },
        { provide: RouteTrackerService, useValue: routeTrackerMock },
        { provide: PostLoginRedirectService, useValue: postLoginRedirectMock },
        { provide: UnsavedWorkService, useValue: unsavedWorkServiceMock },
        { provide: TemporaryStorageService, useValue: temporaryStorageMock },
        { provide: ActiveTabService, useValue: activeTabServiceMock },
        { provide: LoggerService, useValue: loggerMock },
        ChangeDetectorRef
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionExpiredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('goToLogin should call signOut, clearCurrentTab and navigate to login', fakeAsync(() => {
    component.goToLogin();
    
    // Wait for setTimeout (component uses 500ms)
    tick(500);
    
    expect(tokenStorageMock.signOut).toHaveBeenCalled();
    expect(activeTabServiceMock.clearCurrentTab).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  }));

  it('goToHome should call signOut, clearCurrentTab and navigate to home', fakeAsync(() => {
    component.goToHome();
    
    // Wait for setTimeout
    tick(300);
    
    expect(tokenStorageMock.signOut).toHaveBeenCalled();
    expect(activeTabServiceMock.clearCurrentTab).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/'], { replaceUrl: true });
  }));
});
