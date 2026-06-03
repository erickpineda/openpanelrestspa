import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LanguageService } from '../services/language.service';

export const languageInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const languageService = inject(LanguageService);

  if (req.url.includes('/api/')) {
    const currentLang = languageService.getCurrentLanguage();
    const modifiedRequest = req.clone({
      params: req.params.set('lang', currentLang),
    });
    return next(modifiedRequest);
  }

  return next(req);
};
