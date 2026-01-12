import { of } from 'rxjs';
import { DashboardFacadeService } from './dashboard-facade.service';

describe('DashboardFacadeService', () => {
  it('refreshAll should call api and return forkJoin results', (done) => {
    const apiSpy = jasmine.createSpyObj('DashboardApiService', [
      'getSummary',
      'getSeriesActivity',
      'getTop',
      'getStorage',
      'getContentStats',
      'getRecentActivity',
      'getSeriesEntriesSplitEstado',
      'getSeriesEntriesSplitEstadoNombre',
      'evictSeries',
      'evictTop',
      'evictContentStats',
      'evictSummary',
    ]);

    apiSpy.getSummary.and.returnValue(of({} as any));
    apiSpy.getSeriesActivity.and.returnValue(of([] as any));
    apiSpy.getTop.and.returnValue(of([] as any));
    apiSpy.getStorage.and.returnValue(of({} as any));
    apiSpy.getContentStats.and.returnValue(of({} as any));

    const service = new DashboardFacadeService(apiSpy as any);

    service.refreshAll(30, 'day', 10, true, '2025-01-01', '2025-01-31').subscribe((res) => {
      expect(apiSpy.getSummary).toHaveBeenCalledWith(true);
      expect(apiSpy.getSeriesActivity).toHaveBeenCalledWith(30, true, 'day');
      expect(apiSpy.getTop).toHaveBeenCalled();
      expect(apiSpy.getStorage).toHaveBeenCalled();
      expect(apiSpy.getContentStats).toHaveBeenCalled();
      expect(Array.isArray(res)).toBeTrue();
      expect(res.length).toBe(7);
      done();
    });
  });

  it('proxy methods should delegate to api', () => {
    const apiSpy = jasmine.createSpyObj('DashboardApiService', [
      'getSummary',
      'getSeriesActivity',
      'getTop',
      'getStorage',
      'getContentStats',
      'getRecentActivity',
      'getSeriesEntriesSplitEstado',
      'getSeriesEntriesSplitEstadoNombre',
      'evictSeries',
      'evictTop',
      'evictContentStats',
      'evictSummary',
    ]);
    apiSpy.getSeriesActivity.and.returnValue(of([] as any));
    apiSpy.getTop.and.returnValue(of([] as any));
    apiSpy.getStorage.and.returnValue(of({} as any));
    apiSpy.getContentStats.and.returnValue(of({} as any));
    apiSpy.getRecentActivity.and.returnValue(of({} as any));
    apiSpy.getSeriesEntriesSplitEstado.and.returnValue(of([] as any));
    apiSpy.getSeriesEntriesSplitEstadoNombre.and.returnValue(of([] as any));

    const service = new DashboardFacadeService(apiSpy as any);

    service.getSeries(7, false, 'week').subscribe(() => {});
    expect(apiSpy.getSeriesActivity).toHaveBeenCalledWith(7, false, 'week');

    service.getTop('users', 5, true).subscribe(() => {});
    expect(apiSpy.getTop).toHaveBeenCalledWith('users', 5, true, undefined, undefined);

    service.getTop('tags', 1).subscribe(() => {});
    expect(apiSpy.getTop).toHaveBeenCalledWith('tags', 1, false, undefined, undefined);

    service.getStorage().subscribe(() => {});
    expect(apiSpy.getStorage).toHaveBeenCalled();

    service.getContentStats().subscribe(() => {});
    expect(apiSpy.getContentStats).toHaveBeenCalled();

    service.getRecentActivity(1, 2).subscribe(() => {});
    expect(apiSpy.getRecentActivity).toHaveBeenCalledWith(1, 2);
    service.getRecentActivity().subscribe(() => {});
    expect(apiSpy.getRecentActivity).toHaveBeenCalledWith(0, 5);

    service.getSeriesEntriesSplitEstado(7, 'day', true).subscribe(() => {});
    expect(apiSpy.getSeriesEntriesSplitEstado).toHaveBeenCalledWith(7, 'day', true);

    service.getSeriesEntriesSplitEstadoNombre(7, 'day', true).subscribe(() => {});
    expect(apiSpy.getSeriesEntriesSplitEstadoNombre).toHaveBeenCalledWith(7, 'day', true);
  });

  it('evict methods should call api', () => {
    const apiSpy = jasmine.createSpyObj('DashboardApiService', [
      'evictSeries',
      'evictTop',
      'evictContentStats',
      'evictSummary',
    ]);
    const service = new DashboardFacadeService(apiSpy as any);
    service.evictSeries(7);
    service.evictTop('users');
    service.evictContentStats();
    service.evictSummary();
    expect(apiSpy.evictSeries).toHaveBeenCalledWith(7);
    expect(apiSpy.evictTop).toHaveBeenCalledWith('users');
    expect(apiSpy.evictContentStats).toHaveBeenCalled();
    expect(apiSpy.evictSummary).toHaveBeenCalled();
  });
});
