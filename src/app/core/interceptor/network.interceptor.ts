import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { finalize, delay, switchMap } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class NetworkInterceptor implements HttpInterceptor {
  private excludedUrls = [
    'assets/',
    'i18n/'
  ];

  private artificialDelay = true;
  private delayMs = 0;
  private quickRequestThreshold = 300; // Peticiones menores a 300ms no activan loader

  constructor(private loadingService: LoadingService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const shouldSkip = this.excludedUrls.some(url => request.url.includes(url));
    
    if (shouldSkip) {
      return next.handle(request);
    }

    const requestStartTime = Date.now();
    let showLoader = false;
    let loaderTimeout: any;

    // Programar mostrar loader después del threshold
    loaderTimeout = setTimeout(() => {
      showLoader = true;
      this.loadingService.setLoading(true, request.url);
    }, this.quickRequestThreshold);

    let observable = next.handle(request);
    
    if (this.artificialDelay) {
      observable = observable.pipe(delay(this.delayMs));
    }

    return observable.pipe(
      finalize(() => {
        clearTimeout(loaderTimeout);
        
        const requestDuration = Date.now() - requestStartTime;
        
        if (showLoader || requestDuration >= this.quickRequestThreshold) {
          // Si se mostró el loader o la petición fue lenta, ocultarlo
          this.loadingService.setLoading(false, request.url);
        }
        // Si fue una petición rápida y no se mostró el loader, no hacer nada
      })
    );
  }
}