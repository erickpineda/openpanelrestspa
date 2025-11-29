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
  pageSize = 12;
  totalPages = 0;
  filtroNombre = '';
  filtroMime = '';
  fechaDesde = '';
  fechaHasta = '';

  constructor(private archivos: ArchivosService) {}

  ngOnInit(): void { this.load(); }

  load(pageNo = this.pageNo): void {
    this.loading = true; this.error = null;
    const hasFilters = !!this.filtroNombre;
    if (!hasFilters) {
      this.archivos.listarSafe(pageNo, this.pageSize).subscribe({
        next: (list: MediaItem[]) => { this.items = Array.isArray(list) ? list : []; this.totalPages = 0; this.loading = false; },
        error: () => { this.error = 'Error cargando archivos'; this.loading = false; }
      });
    } else {
      const payload = { nombre: this.filtroNombre, tipoMime: this.filtroMime, fechaDesde: this.fechaDesde, fechaHasta: this.fechaHasta } as any;
      this.archivos.buscarSafe(payload, pageNo, this.pageSize).subscribe({
        next: (resp) => { this.items = resp?.elements || []; this.totalPages = Number(resp?.totalPages || 0); this.loading = false; },
        error: () => { this.error = 'Error buscando archivos'; this.loading = false; }
      });
    }
  }

  search(): void { this.pageNo = 0; this.load(); }
  reset(): void { this.filtroNombre = ''; this.pageNo = 0; this.load(); }
  prev(): void { if (this.pageNo > 0) { this.pageNo--; this.load(); } }
  next(): void { if (this.totalPages ? this.pageNo < this.totalPages - 1 : true) { this.pageNo++; this.load(); } }
}
