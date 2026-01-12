import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements HttpInterceptor {
  // Timeouts específicos por tipo de endpoint
  private timeouts = new Map<string, number>([
    ['/api/v1/fileStorage/subirFichero', 60000], // 1 minuto para uploads
    ['/api/v1/reports', 120000], // 2 minutos para reportes
    ['/api/v1/export', 180000], // 3 minutos para exports
    ['/api/v1/import', 300000], // 5 minutos para imports
  ]);

  private defaultTimeout = 30000; // 30 segundos por defecto

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const customTimeout = this.getCustomTimeout(request);

    return next.handle(request).pipe(timeout(customTimeout));
  }

  private getCustomTimeout(request: HttpRequest<unknown>): number {
    for (const [endpoint, timeout] of this.timeouts) {
      if (request.url.includes(endpoint)) {
        return timeout;
      }
    }
    return this.defaultTimeout;
  }
}
