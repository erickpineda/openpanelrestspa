import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GlobalErrorHandlerService } from '../errors/global-error/global-error-handler.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private errorHandler: GlobalErrorHandlerService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.errorHandler.handleError(error);
        return throwError(() => new Error(error.error?.error?.message || error.message));
      })
    );
  }
}
