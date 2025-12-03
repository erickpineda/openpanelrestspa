import { Component, OnInit } from '@angular/core';
import { ImagenesService } from '../../../../core/services/data/imagenes.service';
import { MediaItem } from '../../../../core/models/media-item.model';

@Component({
  selector: 'app-imagenes',
  templateUrl: './imagenes.component.html',
  styleUrls: ['./imagenes.component.scss']
})
export class ImagenesComponent implements OnInit {
  loading = false;
  error: string | null = null;
  items: MediaItem[] = [];
  pageNo = 0;
  pageSize = 10;
  totalPages = 0;
  filtroNombre = '';
  filtroMime = '';
  fechaDesde = '';
  fechaHasta = '';

  // Patrón de toolbar/búsqueda
  showAdvanced: boolean = false;
  basicSearchText: string = '';

  constructor(private imagenes: ImagenesService) {}

  ngOnInit(): void { this.load(); }

  load(pageNo = this.pageNo): void {
    this.loading = true; this.error = null;
    const hasFilters = !!this.filtroNombre || !!this.filtroMime || !!this.fechaDesde || !!this.fechaHasta;
    if (!hasFilters) {
      this.imagenes.listarSafe(pageNo, this.pageSize).subscribe({
        next: (list: MediaItem[]) => { this.items = Array.isArray(list) ? list : []; this.totalPages = 0; this.loading = false; },
        error: () => { this.error = 'Error cargando imágenes'; this.loading = false; }
      });
    } else {
      const payload = { nombre: this.filtroNombre, tipoMime: this.filtroMime, fechaDesde: this.fechaDesde, fechaHasta: this.fechaHasta } as any;
      this.imagenes.buscarSafe(payload, pageNo, this.pageSize).subscribe({
        next: (resp) => { this.items = resp?.elements || []; this.totalPages = Number(resp?.totalPages || 0); this.loading = false; },
        error: () => { this.error = 'Error buscando imágenes'; this.loading = false; }
      });
    }
  }

  search(): void { this.pageNo = 0; this.load(); }
  reset(): void { this.filtroNombre = ''; this.filtroMime=''; this.fechaDesde=''; this.fechaHasta=''; this.basicSearchText=''; this.pageNo = 0; this.load(); }
  prev(): void { if (this.pageNo > 0) { this.pageNo--; this.load(); } }
  next(): void { if (this.totalPages ? this.pageNo < this.totalPages - 1 : true) { this.pageNo++; this.load(); } }

  // Handlers toolbar
  toggleAdvanced(): void { this.showAdvanced = !this.showAdvanced; }
  onBasicSearchTextChange(text: string): void { this.basicSearchText = text || ''; this.filtroNombre = this.basicSearchText; this.search(); }
  onPageSizeChange(size: number): void { this.pageSize = Number(size) || this.pageSize; this.pageNo = 0; this.search(); }
}
