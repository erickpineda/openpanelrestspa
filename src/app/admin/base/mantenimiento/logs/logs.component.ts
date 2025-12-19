import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoggerService } from '../../../../core/services/logger.service';
import { LoggerBufferService, LogEntry } from '../../../../core/services/logger-buffer.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-mantenimiento-logs',
    templateUrl: './logs.component.html',
    styleUrls: ['./logs.component.scss'],
    standalone: false
})
export class LogsComponent implements OnInit, OnDestroy {
  loading = false;
  entries: LogEntry[] = [];
  filtered: LogEntry[] = [];
  filter = '';
  private sub?: Subscription;
  private interval: any;

  constructor(private logger: LoggerService, private buffer: LoggerBufferService) {}

  ngOnInit(): void {
    this.loading = true;
    this.sub = this.buffer.getEntries().subscribe(list => {
      this.entries = list;
      this.applyFilter();
      this.loading = false;
    });
    this.interval = setInterval(() => {}, 60000);
    this.logger.info('Mantenimiento/Logs inicializado');
  }

  ngOnDestroy(): void {
    if (this.interval) {
      try { clearInterval(this.interval); } catch {}
    }
    if (this.sub) { try { this.sub.unsubscribe(); } catch {} }
  }

  search(): void { this.applyFilter(); }
  clear(): void { this.buffer.clear(); }
  sample(): void {
    this.logger.debug('Ejemplo debug');
    this.logger.info('Ejemplo info');
    this.logger.warn('Ejemplo warn');
    this.logger.error('Ejemplo error');
  }
  private applyFilter(): void {
    const f = (this.filter || '').toLowerCase();
    if (!f) { this.filtered = this.entries; return; }
    this.filtered = this.entries.filter(e => 
      e.message.toLowerCase().includes(f) || e.level.toLowerCase().includes(f));
  }

  trackByLogEntry(index: number, e: LogEntry): string {
    return `${e?.timestamp || ''}-${e?.level || ''}-${e?.message?.substring(0,50) || ''}`;
  }
}
