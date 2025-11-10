import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.dev.es';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private isProduction = environment.production;

  log(message: string, ...args: any[]): void {
    if (!this.isProduction) {
      console.log(`[LOG] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (!this.isProduction) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: any): void {
    if (!this.isProduction) {
      console.error(`[ERROR] ${message}`, error);
    }
    // En producción, enviar a servicio de tracking
  }

  debug(message: string, ...args: any[]): void {
    if (!this.isProduction) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}
