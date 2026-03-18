import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { formatForBackend } from '../../shared/utils/date-utils';

@Injectable()
export class DateInterceptor implements HttpInterceptor {
  // Regex para detectar strings que parecen fechas ISO, datetime-local o formato backend (espacio)
  // Ejemplos:
  // 2025-01-01T12:00 (datetime-local)
  // 2025-01-01T12:00:00.000Z (ISO)
  // 2025-01-01 (date)
  // 2025-01-01 12:00:00 (backend)
  private dateRegex =
    /^\d{4}-\d{2}-\d{2}([T\s]\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Solo interceptar peticiones que envían datos (POST, PUT, PATCH)
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
      // Ignorar FormData (complicado de clonar/modificar y suele manejarse manualmente)
      if (request.body instanceof FormData) {
        return next.handle(request);
      }

      const modifiedBody = this.processBody(request.body);
      const modifiedRequest = request.clone({
        body: modifiedBody,
      });

      return next.handle(modifiedRequest);
    }

    return next.handle(request);
  }

  private processBody(body: any): any {
    if (!body) return body;

    if (Array.isArray(body)) {
      return body.map((item) => this.processBody(item));
    }

    if (typeof body === 'object' && !(body instanceof Date)) {
      const newBody = { ...body };
      for (const key of Object.keys(newBody)) {
        newBody[key] = this.processBody(newBody[key]);
      }
      return newBody;
    }

    // Si es un objeto Date, formatearlo
    if (body instanceof Date) {
      return formatForBackend(body);
    }

    // Si es un string que parece una fecha, intentar formatearlo
    if (typeof body === 'string' && this.dateRegex.test(body)) {
      // Intentar formatear. Si formatForBackend devuelve null, dejamos el valor original
      const formatted = formatForBackend(body);
      return formatted || body;
    }

    return body;
  }
}
