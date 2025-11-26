import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import {
  SummaryDTO,
  ActivityPointDTO,
  TopItemDTO,
  StorageDTO,
  ContentStatsDTO
} from '../../shared/models/dashboard.models';
import { environment } from '../../../environments/environment.dev.es';
import { OPConstants } from '../../shared/constants/op-global.constants';

interface CacheEntry {
  ts: number;
  value: any;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardApiService {
  // Construir base siguiendo convención usada en otros servicios: host + uri + ruta específica
  private base = `${environment.backend.host}${environment.backend.uri}/dashboard`;
  private cache = new Map<string, CacheEntry>();

  // Defaults (según contrato)
  private ttlSummary = 60 * 1000; // ms
  private ttlSeries = 300 * 1000;
  private ttlTop = 600 * 1000;

  constructor(private http: HttpClient) {}

  private getCached<T>(key: string, ttl: number, getter: () => Observable<T>): Observable<T> {
    const now = Date.now();
    const entry = this.cache.get(key);
    if (entry && now - entry.ts < ttl) {
      return of(entry.value as T);
    }
    const obs$ = getter().pipe(
      tap(v => this.cache.set(key, { ts: Date.now(), value: v })),
      shareReplay(1)
    );
    // store a placeholder subscription-less value after resolved via tap, so return obs$ directly
    return obs$;
  }

  getSummary(force = false): Observable<SummaryDTO> {
    const key = 'dashboard:summary';
    if (force) {
      this.cache.delete(key);
    }
    return this.getCached<SummaryDTO>(key, this.ttlSummary, () =>
      this.http.get<any>(`${this.base}/summary`).pipe(map(r => r && r.data ? r.data as SummaryDTO : r))
    );
  }

  getRecentActivity(page = 0, size = 5): Observable<any> {
    const p = Math.max(0, Number(page) || 0);
    const sRaw = Number(size) || 5;
    const s = Math.max(1, Math.min(200, sRaw));
    const params = new HttpParams().set('page', String(p)).set('size', String(s));
    return this.http.get<any>(`${this.base}/recent-activity`, { params }).pipe(map(r => r && r.data ? r.data : r));
  }

  getSeriesActivity(days = 30, force = false, granularity: 'hour' | 'day' | 'week' | 'month' = 'day'): Observable<ActivityPointDTO[]> {
    const dRaw = Number(days) || 30;
    const d = Math.max(1, Math.min(365, dRaw));
    const key = `dashboard:series:activity:days:${d}:gran:${granularity}`;
    if (force) this.cache.delete(key);
    const params = new HttpParams().set('days', String(d)).set('granularity', granularity);
    return this.getCached<ActivityPointDTO[]>(key, this.ttlSeries, () =>
      this.http.get<any>(`${this.base}/series/activity`, { params }).pipe(
        map(r => (r && r.data ? r.data as ActivityPointDTO[] : r))
      )
    );
  }

  // Propuesto: nueva serie separando publicadas vs no publicadas
  getSeriesEntriesSplitEstado(days = 30, granularity: 'hour' | 'day' | 'week' | 'month' = 'day', force = false): Observable<{ date: string, publicadas: number, noPublicadas: number }[]> {
    const dRaw = Number(days) || 30;
    const d = Math.max(1, Math.min(365, dRaw));
    const key = `dashboard:series:entries:split:estado:days:${d}:gran:${granularity}`;
    if (force) this.cache.delete(key);
    const params = new HttpParams().set('days', String(d)).set('granularity', granularity).set('split', 'estado');
    return this.getCached<any[]>(key, this.ttlSeries, () =>
      this.http.get<any>(`${this.base}/series/entries`, { params }).pipe(
        map(r => (r && r.data ? r.data : r))
      )
    );
  }

  getSeriesEntriesSplitEstadoNombre(days = 30, granularity: 'hour' | 'day' | 'week' | 'month' = 'day', force = false): Observable<any[]> {
    const dRaw = Number(days) || 30;
    const d = Math.max(1, Math.min(365, dRaw));
    const key = `dashboard:series:entries:split:estadoNombre:days:${d}:gran:${granularity}`;
    if (force) this.cache.delete(key);
    const params = new HttpParams().set('days', String(d)).set('granularity', granularity).set('split', 'estadoNombre');
    return this.getCached<any[]>(key, this.ttlSeries, () =>
      this.http.get<any>(`${this.base}/series/entries`, { params }).pipe(
        map(r => (r && r.data ? r.data : r))
      )
    );
  }

  getTop(type: 'users' | 'categories' | 'tags' = 'users', limit = 10, force = false, startDate?: string, endDate?: string): Observable<TopItemDTO[]> {
    const t = type === 'categories' ? 'categories' : 'users';
    const tt = type === 'tags' ? 'tags' : t;
    const lRaw = Number(limit) || 10;
    const l = Math.max(1, Math.min(200, lRaw));
    const key = `dashboard:top:type:${tt}:limit:${l}:start:${startDate || ''}:end:${endDate || ''}`;
    if (force) this.cache.delete(key);
    return this.getCached<TopItemDTO[]>(key, this.ttlTop, () => {
      let params = new HttpParams().set('type', t).set('limit', String(l));
      if (type === 'tags') params = params.set('type', 'tags');
      if (startDate) params = params.set('startDate', startDate);
      if (endDate) params = params.set('endDate', endDate);
      return this.http
        .get<any>(`${this.base}/top`, { params })
        .pipe(map(r => (r && r.data ? r.data as TopItemDTO[] : r)));
    });
  }

  getStorage(): Observable<StorageDTO> {
    return this.http.get<any>(`${this.base}/storage`).pipe(map(r => (r && r.data ? r.data as StorageDTO : r)));
  }

  getContentStats(): Observable<ContentStatsDTO> {
    const key = 'dashboard:content-stats';
    return this.getCached<ContentStatsDTO>(key, this.ttlSeries, () =>
      this.http.get<any>(`${this.base}/content-stats`).pipe(map(r => (r && r.data ? r.data as ContentStatsDTO : r)))
    );
  }

  // Invalidar cache desde SPA si es necesario
  evictSummary() { this.cache.delete('dashboard:summary'); }
  evictSeries(days?: number) {
    if (days) this.cache.delete(`dashboard:series:activity:days:${days}`);
    else {
      // delete any key that starts with dashboard:series:activity
      Array.from(this.cache.keys()).forEach(k => { if (k.startsWith('dashboard:series:activity')) this.cache.delete(k); });
    }
  }
  evictTop(type?: string) {
    if (type) {
      Array.from(this.cache.keys()).forEach(k => { if (k.startsWith(`dashboard:top:type:${type}`)) this.cache.delete(k); });
    } else {
      Array.from(this.cache.keys()).forEach(k => { if (k.startsWith('dashboard:top:type:')) this.cache.delete(k); });
    }
  }
}
