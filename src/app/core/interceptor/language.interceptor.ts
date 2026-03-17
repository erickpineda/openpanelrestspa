import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LanguageService } from '../services/language.service';

@Injectable()
export class LanguageInterceptor implements HttpInterceptor {
  constructor(private languageService: LanguageService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Solo agregar el parámetro a llamadas API
    if (request.url.includes('/api/')) {
      const currentLang = this.languageService.getCurrentLanguage();

      // Clonar la petición y agregar el parámetro
      const modifiedRequest = request.clone({
        params: request.params.set('lang', currentLang),
      });

      return next.handle(modifiedRequest);
    }

    return next.handle(request);
  }
}
