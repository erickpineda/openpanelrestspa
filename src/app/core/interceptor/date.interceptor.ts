import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { formatForBackend } from '../../shared/utils/date-utils';

const dateRegex = /^\d{4}-\d{2}-\d{2}([T\s]\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

const processBody = (body: any): any => {
  if (!body) return body;

  if (Array.isArray(body)) {
    return body.map((item) => processBody(item));
  }

  if (typeof body === 'object' && !(body instanceof Date)) {
    const newBody = { ...body };
    for (const key of Object.keys(newBody)) {
      newBody[key] = processBody(newBody[key]);
    }
    return newBody;
  }

  if (body instanceof Date) {
    return formatForBackend(body);
  }

  if (typeof body === 'string' && dateRegex.test(body)) {
    const formatted = formatForBackend(body);
    return formatted || body;
  }

  return body;
};

export const dateInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    if (req.body instanceof FormData) {
      return next(req);
    }

    const modifiedBody = processBody(req.body);
    const modifiedRequest = req.clone({
      body: modifiedBody,
    });

    return next(modifiedRequest);
  }

  return next(req);
};
