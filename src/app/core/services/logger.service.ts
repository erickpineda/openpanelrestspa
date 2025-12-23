import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.dev.es';
import { LoggerBufferService } from './logger-buffer.service';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private isProduction = environment.mock;

  // Niveles de log
  private levels = ['debug', 'info', 'warn', 'error'] as const;
  private minLevel: (typeof this.levels)[number] = this.isProduction
    ? 'warn'
    : 'debug';
  constructor(private buffer: LoggerBufferService) {}

  private shouldLog(level: (typeof this.levels)[number]): boolean {
    const levelIndex = this.levels.indexOf(level);
    const minLevelIndex = this.levels.indexOf(this.minLevel);
    return levelIndex >= minLevelIndex;
  }

  log(
    level: (typeof this.levels)[number],
    message: string,
    ...args: any[]
  ): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        console.debug(prefix, message, ...args);
        break;
      case 'info':
        console.info(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'error':
        console.error(prefix, message, ...args);
        break;
    }
    try {
      this.buffer.record(level, message, args);
    } catch {}

    // En producción, enviar errores a servicio de tracking
    if (this.isProduction && level === 'error') {
      this.sendToTrackingService(message, args);
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, error?: any): void {
    this.log('error', message, error);
  }

  private sendToTrackingService(message: string, error: any): void {
    // Integrar con servicio de tracking como Sentry, LogRocket, etc.
    // Ejemplo:
    // if (typeof window !== 'undefined' && (window as any).Sentry) {
    //   (window as any).Sentry.captureException(error);
    // }
  }
}
