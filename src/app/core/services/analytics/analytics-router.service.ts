import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AnalyticsService } from './analytics.service';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsRouterService {
  private started = false;

  constructor(
    private router: Router,
    private analytics: AnalyticsService
  ) {}

  start(): void {
    if (this.started) return;
    this.started = true;

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.analytics.track('page_view', {
        page_path: this.router.url,
        page_title: document.title,
      });
    });
  }
}

