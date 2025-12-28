import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  args?: any[];
}

@Injectable({ providedIn: 'root' })
export class LoggerBufferService {
  private readonly max = 500;
  private entries: LogEntry[] = [];
  private subject = new BehaviorSubject<LogEntry[]>([]);

  record(level: LogEntry['level'], message: string, args: any[] = []): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      args,
    };
    this.entries.unshift(entry);
    if (this.entries.length > this.max) this.entries = this.entries.slice(0, this.max);
    this.subject.next(this.entries.slice());
  }

  getEntries(): Observable<LogEntry[]> {
    return this.subject.asObservable();
  }

  clear(): void {
    this.entries = [];
    this.subject.next([]);
  }
}
