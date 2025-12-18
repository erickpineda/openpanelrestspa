import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardApiService } from './dashboard-api.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DashboardApiService force param', () => {
  let service: DashboardApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()] });
    service = TestBed.inject(DashboardApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds force=true to summary when forced', () => {
    service.getSummary(true).subscribe();
    const req = httpMock.expectOne(r => r.url.endsWith('/dashboard/summary'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('force')).toBe('true');
    req.flush({ data: {} });
  });

  it('adds force=true to series activity when forced', () => {
    service.getSeriesActivity(30, true, 'day').subscribe();
    const req = httpMock.expectOne(r => r.url.endsWith('/dashboard/series/activity'));
    expect(req.request.params.get('force')).toBe('true');
    req.flush({ data: [] });
  });

  it('adds force=true to top when forced', () => {
    service.getTop('users', 10, true).subscribe();
    const req = httpMock.expectOne(r => r.url.endsWith('/dashboard/top'));
    expect(req.request.params.get('force')).toBe('true');
    req.flush({ data: [] });
  });
});

