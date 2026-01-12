import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoggerService } from '../../../../core/services/logger.service';
import { LoggerBufferService, LogEntry } from '../../../../core/services/logger-buffer.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-mantenimiento-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
  standalone: false,
})
export class LogsComponent implements OnInit, OnDestroy {
  loading = false;
  entries: LogEntry[] = [];
  filtered: LogEntry[] = [];
  paginated: LogEntry[] = [];
  filter = '';
  pageNo = 1;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  private sub?: Subscription;
  private interval: any;

  constructor(
    private logger: LoggerService,
    private buffer: LoggerBufferService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.sub = this.buffer.getEntries().subscribe((list) => {
      this.entries = list;
      this.applyFilter();
      this.loading = false;
    });
    this.interval = setInterval(() => {}, 60000);
    this.logger.info('Mantenimiento/Logs inicializado');
  }

  ngOnDestroy(): void {
    if (this.interval) {
      try {
        clearInterval(this.interval);
      } catch {}
    }
    if (this.sub) {
      try {
        this.sub.unsubscribe();
      } catch {}
    }
  }

  search(): void {
    this.pageNo = 1;
    this.applyFilter();
  }
  clear(): void {
    this.buffer.clear();
  }
  sample(): void {
    this.logger.debug('Ejemplo debug');
    this.logger.info('Ejemplo info');
    this.logger.warn('Ejemplo warn');
    this.logger.error('Ejemplo error');
  }

  onPageChange(page: number): void {
    this.pageNo = page;
    this.updatePaginated();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageNo = 1;
    this.updatePaginated();
  }

  private applyFilter(): void {
    const f = (this.filter || '').toLowerCase();
    if (!f) {
      this.filtered = [...this.entries];
    } else {
      this.filtered = this.entries.filter(
        (e) => e.message.toLowerCase().includes(f) || e.level.toLowerCase().includes(f)
      );
    }
    this.totalElements = this.filtered.length;
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);
    // Ensure pageNo is valid
    if (this.pageNo > this.totalPages && this.totalPages > 0) {
      this.pageNo = this.totalPages;
    } else if (this.totalPages === 0) {
      this.pageNo = 1;
    }
    this.updatePaginated();
  }

  private updatePaginated(): void {
    const start = (this.pageNo - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginated = this.filtered.slice(start, end);
  }

  trackByLogEntry(index: number, e: LogEntry): string {
    return `${e?.timestamp || ''}-${e?.level || ''}-${e?.message?.substring(0, 50) || ''}`;
  }
}
