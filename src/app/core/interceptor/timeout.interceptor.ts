import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout as rxjsTimeout } from 'rxjs/operators';

const timeouts = new Map<string, number>([
  ['/api/v1/fileStorage/subirFichero', 60000],
  ['/api/v1/reports', 120000],
  ['/api/v1/export', 180000],
  ['/api/v1/import', 300000],
]);
const defaultTimeout = 30000;

export const timeoutInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  let customTimeout = defaultTimeout;
  for (const [endpoint, timeoutValue] of timeouts) {
    if (req.url.includes(endpoint)) {
      customTimeout = timeoutValue;
      break;
    }
  }

  return next(req).pipe(rxjsTimeout(customTimeout));
};
