import { Injectable } from '@angular/core';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  track(event: string, params?: Record<string, unknown>): void {
    const w = window as Window;
    w.dataLayer = Array.isArray(w.dataLayer) ? w.dataLayer : [];
    w.dataLayer.push({ event, ...(params ?? {}) });
  }
}

