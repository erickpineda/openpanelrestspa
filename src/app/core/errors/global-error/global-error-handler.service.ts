import { Injectable, ErrorHandler, Injector, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoggerService } from 'src/app/core/services/logger.service';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  constructor(private injector: Injector) { }

  handleError(error: any) {
    let status: number = -1;
    let message: string;
    let router = this.injector.get(Router);
    console.log('URL: ' + router.url);

    let loggerService = this.injector.get(LoggerService);
    loggerService.log(error);

    if (error instanceof HttpErrorResponse) {
      //Backend returns unsuccessful response codes such as 404, 500 etc.
      status = error.status;
      message = this.getServerErrorMessage(error);
    } else {
      //A client-side or network error occurred.	          
      console.error('An error occurred:', error.message);
      message = error.message;
    }

    console.error('Status code:', status);
    console.error('Message error:', message);

    if (status == 500) {
      router.navigate(['/error']);
    }

  }

  private getServerErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 404: {
        return `Not Found: ${error.message}`;
      }
      case 403: {
        return `Access Denied: ${error.message}`;
      }
      case 500: {
        return `Internal Server Error: ${error.message}`;
      }
      default: {
        return `Unknown Server Error: ${error.message}`;
      }
    }
  }
}
