import { Component, OnInit } from '@angular/core';
import { ArchivosService } from '../../../../core/services/data/archivos.service';
import { MediaItem } from '../../../../core/models/media-item.model';

@Component({
  selector: 'app-archivos',
  templateUrl: './archivos.component.html',
  styleUrls: ['./archivos.component.scss']
})
export class ArchivosComponent implements OnInit {
  loading = false;
  error: string | null = null;
  items: MediaItem[] = [];
  pageNo = 0;
  pageSize = 10;
  totalPages = 0;
  canPrev = false;
  canNext = false;
  private hasFilters = false;
  filtroNombre = '';
  filtroMime = '';
  fechaDesde = '';
  fechaHasta = '';

  // Patrón de toolbar/búsqueda
  showAdvanced: boolean = false;
  basicSearchText: string = '';

  constructor(private archivos: ArchivosService) {}

  ngOnInit(): void { this.load(); }

  load(pageNo = this.pageNo): void {
    this.loading = true; this.error = null;
    this.hasFilters = !!this.filtroNombre || !!this.filtroMime || !!this.fechaDesde || !!this.fechaHasta;
    if (!this.hasFilters) {
      this.archivos.listarSafe(pageNo, this.pageSize).subscribe({
        next: (list: MediaItem[]) => { this.items = Array.isArray(list) ? list : []; this.totalPages = 0; this.updateNavState(); this.loading = false; },
        error: () => { this.error = 'Error cargando archivos'; this.loading = false; }
      });
    } else {
      const payload = { nombre: this.filtroNombre, tipoMime: this.filtroMime, fechaDesde: this.fechaDesde, fechaHasta: this.fechaHasta } as any;
      this.archivos.buscarSafe(payload, pageNo, this.pageSize).subscribe({
        next: (resp) => { this.items = resp?.elements || []; this.totalPages = Number(resp?.totalPages || 0); this.updateNavState(); this.loading = false; },
        error: () => { this.error = 'Error buscando archivos'; this.loading = false; }
      });
    }
  }

  search(): void { this.pageNo = 0; this.load(); }
  reset(): void { this.filtroNombre = ''; this.filtroMime=''; this.fechaDesde=''; this.fechaHasta=''; this.basicSearchText=''; this.pageNo = 0; this.load(); }
  prev(): void { if (this.canPrev) { this.pageNo--; this.load(); } }
  next(): void { if (this.canNext) { this.pageNo++; this.load(); } }

  // Handlers toolbar
  toggleAdvanced(): void { this.showAdvanced = !this.showAdvanced; }
  onBasicSearchTextChange(text: string): void { this.basicSearchText = text || ''; this.filtroNombre = this.basicSearchText; this.search(); }
  onPageSizeChange(size: number): void { this.pageSize = Number(size) || this.pageSize; this.pageNo = 0; this.search(); }

  private updateNavState(): void {
    this.canPrev = this.pageNo > 0;
    if (this.hasFilters) {
      this.canNext = this.totalPages ? this.pageNo < this.totalPages - 1 : false;
    } else {
      const count = this.items.length;
      this.canNext = count === this.pageSize;
    }
  }
}
