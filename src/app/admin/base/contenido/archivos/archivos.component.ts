import { Component, OnInit } from '@angular/core';
import { FileStorageService } from '../../../../core/services/file-storage.service';
import { MediaItem } from '../../../../core/models/media-item.model';
import { saveAs } from 'file-saver';
import { ToastService } from '../../../../core/services/ui/toast.service';

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
  uploading = false;

  // Patrón de toolbar/búsqueda
  showAdvanced: boolean = false;
  basicSearchText: string = '';

  constructor(private fileStorage: FileStorageService, private toast: ToastService) {}

  ngOnInit(): void { this.load(); }

  load(pageNo = this.pageNo): void {
    this.loading = true; this.error = null;
    this.hasFilters = !!this.filtroNombre || !!this.filtroMime || !!this.fechaDesde || !!this.fechaHasta;
    this.fileStorage.listarFicheros().subscribe({
      next: (fs) => {
        const base = (fs || []).filter(i => i.tipo !== 'image');
        const filtered = this.applyFilters(base);
        const { pageItems, totalPages } = this.paginate(filtered, pageNo, this.pageSize);
        this.items = pageItems; this.totalPages = totalPages; this.updateNavState(); this.loading = false;
      },
      error: () => { this.error = 'Error cargando archivos'; this.loading = false; }
    });
  }

  search(): void { this.pageNo = 0; this.load(); }
  reset(): void { this.filtroNombre = ''; this.filtroMime=''; this.fechaDesde=''; this.fechaHasta=''; this.basicSearchText=''; this.pageNo = 0; this.load(); }
  prev(): void { if (this.canPrev) { this.pageNo--; this.load(); } }
  next(): void { if (this.canNext) { this.pageNo++; this.load(); } }

  // Handlers toolbar
  toggleAdvanced(): void { this.showAdvanced = !this.showAdvanced; }
  onBasicSearchTextChange(text: string): void { this.basicSearchText = text || ''; this.filtroNombre = this.basicSearchText; this.search(); }
  onPageSizeChange(size: number): void { this.pageSize = Number(size) || this.pageSize; this.pageNo = 0; this.search(); }

  openUpload(input: HTMLInputElement): void { if (this.uploading) return; input.value = ''; input.click(); }
  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    if (!input?.files || input.files.length === 0) return;
    const file = input.files[0];
    this.uploading = true;
    this.fileStorage.uploadFile(file).subscribe({
      next: () => { this.uploading = false; this.toast.showSuccess('Archivo subido', 'Archivos'); this.pageNo = 0; this.load(); },
      error: () => { this.uploading = false; this.toast.showError('Error subiendo archivo', 'Archivos'); }
    });
  }

  private updateNavState(): void {
    this.canPrev = this.pageNo > 0;
    this.canNext = this.totalPages ? this.pageNo < this.totalPages - 1 : false;
  }

  download(item: MediaItem): void {
    if (!item) return;
    const filename = (item.nombre && item.nombre.trim()) ? item.nombre!.trim() : 'archivo';
    if (item.url) {
      try {
        const a = document.createElement('a');
        a.href = item.url!;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch { window.open(item.url!, '_blank'); }
      return;
    }
    if (item.uuid) {
      this.fileStorage.descargarFichero(item.uuid).subscribe({
        next: (blob) => { try { saveAs(blob, filename); } catch {} },
        error: () => { this.toast.showError('Error descargando archivo', 'Archivos'); }
      });
    }
  }

  private applyFilters(list: MediaItem[]): MediaItem[] {
    let res = list;
    if (this.filtroNombre) res = res.filter(i => (i.nombre || '').toLowerCase().includes(this.filtroNombre.toLowerCase()));
    if (this.filtroMime) res = res.filter(i => (i.mime || '').toLowerCase().includes(this.filtroMime.toLowerCase()));
    // FechaDesde/FechaHasta: si se proveen en formato ISO o yyyy-MM-dd, comparar
    const d = this.fechaDesde ? new Date(this.fechaDesde) : null;
    const h = this.fechaHasta ? new Date(this.fechaHasta) : null;
    if (d) res = res.filter(i => i.fechaCreacion ? new Date(i.fechaCreacion) >= d : true);
    if (h) res = res.filter(i => i.fechaCreacion ? new Date(i.fechaCreacion) <= h : true);
    return res;
  }

  private paginate(list: MediaItem[], pageNo: number, pageSize: number): { pageItems: MediaItem[]; totalPages: number } {
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    const start = pageNo * pageSize;
    const pageItems = list.slice(start, start + pageSize);
    return { pageItems, totalPages };
  }
}
