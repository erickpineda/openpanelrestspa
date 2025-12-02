import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { DashboardApiService } from '../../../../core/services/dashboard-api.service';
import { SummaryDTO, ActivityPointDTO, TopItemDTO, StorageDTO, ContentStatsDTO } from '../../../../shared/models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardFacadeService {
  constructor(private api: DashboardApiService) {}

  refreshAll(
    seriesDays: number,
    granularity: 'hour' | 'day' | 'week' | 'month',
    topLimit: number,
    force: boolean,
    topStartDate?: string,
    topEndDate?: string
  ): Observable<[
    SummaryDTO,
    ActivityPointDTO[],
    TopItemDTO[],
    TopItemDTO[],
    TopItemDTO[],
    StorageDTO,
    ContentStatsDTO
  ]> {
    const summary$ = this.api.getSummary(force);
    const series$ = this.api.getSeriesActivity(seriesDays, force, granularity);
    const topUsers$ = this.api.getTop('users', topLimit, force, topStartDate, topEndDate);
    const topCategories$ = this.api.getTop('categories', topLimit, force, topStartDate, topEndDate);
    const topTags$ = this.api.getTop('tags', topLimit, force, topStartDate, topEndDate);
    const storage$ = this.api.getStorage();
    const contentStats$ = this.api.getContentStats();
    return forkJoin([
      summary$,
      series$,
      topUsers$,
      topCategories$,
      topTags$,
      storage$,
      contentStats$
    ]);
  }

  getSeries(days: number, force: boolean, granularity: 'hour' | 'day' | 'week' | 'month'): Observable<ActivityPointDTO[]> {
    return this.api.getSeriesActivity(days, force, granularity);
  }

  getTop(type: 'users' | 'categories' | 'tags', limit: number, force = false, startDate?: string, endDate?: string): Observable<TopItemDTO[]> {
    return this.api.getTop(type, limit, force, startDate, endDate);
  }

  getStorage(): Observable<StorageDTO> {
    return this.api.getStorage();
  }

  getContentStats(): Observable<ContentStatsDTO> {
    return this.api.getContentStats();
  }

  getRecentActivity(page = 0, size = 5): Observable<any> {
    return this.api.getRecentActivity(page, size);
  }

  getSeriesEntriesSplitEstado(days: number, granularity: 'hour' | 'day' | 'week' | 'month', force = false): Observable<any[]> {
    return this.api.getSeriesEntriesSplitEstado(days, granularity, force);
  }

  getSeriesEntriesSplitEstadoNombre(days: number, granularity: 'hour' | 'day' | 'week' | 'month', force = false): Observable<any[]> {
    return this.api.getSeriesEntriesSplitEstadoNombre(days, granularity, force);
  }

  evictSeries(days?: number) { this.api.evictSeries(days); }
  evictTop(type?: string) { this.api.evictTop(type); }
  evictContentStats() { this.api.evictContentStats(); }
  evictSummary() { this.api.evictSummary(); }
}

