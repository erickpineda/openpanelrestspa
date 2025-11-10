import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpEventType
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { LoadingService } from '../services/ui/loading.service';

@Injectable()
export class NetworkInterceptor implements HttpInterceptor {
  // URLs que NO deben activar el loading global
  private excludedUrls = [
    'assets/',
    'i18n/',
    'sockjs-node/',
    '.json'
  ];

  // URLs que son consideradas "rápidas" (no activan loading inmediatamente)
  private quickUrls = [
    '/api/auth/verify',
    '/api/user/profile'
  ];

  constructor(private loadingService: LoadingService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const shouldSkip = this.excludedUrls.some(url => request.url.includes(url));
    const isQuickRequest = this.quickUrls.some(url => request.url.includes(url));
    
    let showLoader = false;
    let loaderTimeout: any;

    if (!shouldSkip) {
      // Para peticiones rápidas, esperar un poco antes de mostrar el loader
      const delay = isQuickRequest ? 300 : 0;
      
      loaderTimeout = setTimeout(() => {
        showLoader = true;
        this.loadingService.setGlobalLoading(true);
      }, delay);
    }

    return next.handle(request).pipe(
      tap(event => {
        // Si la petición es muy rápida, cancelar el timeout
        if (event.type === HttpEventType.Response && loaderTimeout) {
          clearTimeout(loaderTimeout);
          if (!showLoader) {
            // Petición completada antes de mostrar loader, no hacer nada
            return;
          }
        }
      }),
      finalize(() => {
        if (loaderTimeout) {
          clearTimeout(loaderTimeout);
        }
        
        if (showLoader) {
          this.loadingService.setGlobalLoading(false);
        }
      })
    );
  }
}