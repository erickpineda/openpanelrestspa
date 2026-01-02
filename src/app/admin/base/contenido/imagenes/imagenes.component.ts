import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { FileStorageService } from '../../../../core/services/file-storage.service';
import { MediaItem } from '../../../../core/models/media-item.model';
import { saveAs } from 'file-saver';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-imagenes',
  templateUrl: './imagenes.component.html',
  styleUrls: ['./imagenes.component.scss'],
  standalone: false,
})
export class ImagenesComponent implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  items: MediaItem[] = [];
  preview: { [uuid: string]: string } = {};
  pageNo = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  numberOfElements = 0;
  private hasFilters = false;
  private destroy$ = new Subject<void>();
  filtroNombre = '';
  filtroMime = '';
  fechaDesde = '';
  fechaHasta = '';
  uploading = false;
  previewModalVisible = false;
  confirmationModalVisible = false;
  itemToDelete: MediaItem | null = null;
  previewItem: MediaItem | null = null;
  previewZoom = 1;
  private readonly minZoom = 0.5;
  private readonly maxZoom = 4;
  isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  dragScrollLeft = 0;
  dragScrollTop = 0;
  private pinchActive = false;
  private pinchStartDist = 0;
  private pinchStartZoom = 1;
  private previewNaturalWidth = 0;
  private previewNaturalHeight = 0;

  // Patrón de toolbar/búsqueda
  showAdvanced: boolean = false;
  basicSearchText: string = '';

  @Input() mode: 'admin' | 'selector' = 'admin';
  @Output() selectItem = new EventEmitter<MediaItem>();

  constructor(
    private fileStorage: FileStorageService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }
  ngOnDestroy(): void {
    this.clearPreviews();
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(pageNo = this.pageNo): void {
    this.loading = true;
    this.error = null;
    this.hasFilters =
      !!this.filtroNombre || !!this.filtroMime || !!this.fechaDesde || !!this.fechaHasta;

    this.fileStorage
      .listarFicheros(true)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (fs) => {
          const base = (fs || []).filter((i) => i.tipo === 'image');
          const filtered = this.applyFilters(base);
          const { pageItems, totalPages } = this.paginate(filtered, pageNo, this.pageSize);
          this.items = pageItems;
          this.totalPages = totalPages;
          this.totalElements = filtered.length;
          this.numberOfElements = pageItems.length;
          this.buildPreviews(pageItems);
        },
        error: (err) => {
          this.error = 'Error al cargar imágenes';
          this.toast.showError(this.error);
          console.error(err);
        },
      });
  }

  deleteItem(media: MediaItem): void {
    if (!media.uuid) return;
    this.itemToDelete = media;
    this.confirmationModalVisible = true;
  }

  confirmDelete(): void {
    if (!this.itemToDelete || !this.itemToDelete.uuid) return;
    
    this.loading = true;
    this.fileStorage.deleteMedia(this.itemToDelete.uuid)
      .pipe(finalize(() => {
        this.loading = false;
        this.itemToDelete = null;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Archivo eliminado correctamente');
          this.load();
        },
        error: (err) => {
          console.error(err);
          this.toast.showError('Error al eliminar el archivo');
        }
      });
  }

  cancelDelete(): void {
    this.confirmationModalVisible = false;
    this.itemToDelete = null;
  }

  search(): void {
    this.pageNo = 0;
    this.load();
  }
  reset(): void {
    this.filtroNombre = '';
    this.filtroMime = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.basicSearchText = '';
    this.pageNo = 0;
    this.load();
  }

  onPageChange(page: number): void {
    const safePage = Math.max(0, Math.min(Number(page) || 0, Math.max(0, this.totalPages - 1)));
    if (safePage === this.pageNo) return;
    this.pageNo = safePage;
    this.load();
  }

  // Handlers toolbar
  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }
  onBasicSearchTextChange(text: string): void {
    this.basicSearchText = text || '';
    this.filtroNombre = this.basicSearchText;
    this.search();
  }
  onPageSizeChange(size: number): void {
    this.pageSize = Number(size) || this.pageSize;
    this.pageNo = 0;
    this.search();
  }

  download(item: MediaItem): void {
    if (!item) return;
    const filename = item.nombre && item.nombre.trim() ? item.nombre!.trim() : 'imagen';
    if (item.uuid) {
      this.fileStorage.obtenerDatosFichero(item.uuid).subscribe({
        next: (datos: any) => {
          try {
            const b64: string | undefined = datos?.contenido;
            const mime: string = datos?.tipo || item.mime || 'application/octet-stream';
            if (!b64) {
              this.toast.showError('Contenido no disponible', 'Imágenes');
              return;
            }
            const byteChars = atob(b64);
            const byteNums = new Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
            const blob = new Blob([new Uint8Array(byteNums)], { type: mime });
            saveAs(blob, filename);
          } catch {
            this.toast.showError('Error procesando descarga', 'Imágenes');
          }
        },
        error: () => {
          this.toast.showError('Error descargando imagen', 'Imágenes');
        },
      });
      return;
    }
    if (item.url) {
      try {
        const a = document.createElement('a');
        a.href = item.url!;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        window.open(item.url!, '_blank');
      }
    }
  }

  openUpload(input: HTMLInputElement): void {
    if (this.uploading) return;
    input.value = '';
    input.click();
  }
  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    if (!input?.files || input.files.length === 0) return;
    const file = input.files[0];
    this.uploading = true;
    this.fileStorage.uploadFile(file).subscribe({
      next: () => {
        this.uploading = false;
        this.toast.showSuccess('Imagen subida', 'Imágenes');
        this.pageNo = 0;
        this.load();
      },
      error: () => {
        this.uploading = false;
        this.toast.showError('Error subiendo imagen', 'Imágenes');
      },
    });
  }

  private buildPreviews(list: MediaItem[]): void {
    this.clearPreviews();
    for (const item of list) {
      if (!item?.uuid) continue;
      if (item?.mime && !String(item.mime).startsWith('image/')) continue;
      this.fileStorage
        .obtenerDatosFichero(item.uuid, true)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (datos: any) => {
            try {
              const b64: string | undefined = datos?.contenido;
              const mime: string = datos?.tipo || item.mime || 'application/octet-stream';
              if (!b64) return;
              const byteChars = atob(b64);
              const byteNums = new Array(byteChars.length);
              for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
              const blob = new Blob([new Uint8Array(byteNums)], { type: mime });
              const url = URL.createObjectURL(blob);
              this.preview[item.uuid!] = url;
              this.cdr.detectChanges();
            } catch {}
          },
          error: () => {},
        });
    }
  }

  private clearPreviews(): void {
    try {
      Object.values(this.preview).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
    } catch {}
    this.preview = {};
  }

  private applyFilters(list: MediaItem[]): MediaItem[] {
    let res = list;
    if (this.filtroNombre)
      res = res.filter((i) =>
        (i.nombre || '').toLowerCase().includes(this.filtroNombre.toLowerCase())
      );
    if (this.filtroMime)
      res = res.filter((i) => (i.mime || '').toLowerCase().includes(this.filtroMime.toLowerCase()));
    const d = this.fechaDesde ? new Date(this.fechaDesde) : null;
    const h = this.fechaHasta ? new Date(this.fechaHasta) : null;
    if (d) res = res.filter((i) => (i.fechaCreacion ? new Date(i.fechaCreacion) >= d : true));
    if (h) res = res.filter((i) => (i.fechaCreacion ? new Date(i.fechaCreacion) <= h : true));
    return res;
  }

  private paginate(
    list: MediaItem[],
    pageNo: number,
    pageSize: number
  ): { pageItems: MediaItem[]; totalPages: number } {
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    const start = pageNo * pageSize;
    const pageItems = list.slice(start, start + pageSize);
    return { pageItems, totalPages };
  }
  openPreview(item: MediaItem): void {
    if (!item) return;
    this.previewItem = item;
    this.previewModalVisible = true;
    this.previewZoom = 1;
    // Asegurar que la preview esté construida
    if (item.uuid && !this.preview[item.uuid]) {
      this.buildPreviews([item]);
    }
  }

  closePreview(): void {
    this.previewModalVisible = false;
    this.previewItem = null;
    this.previewZoom = 1;
  }

  getPreviewUrl(item: MediaItem | null): string | null {
    const uid = item?.uuid;
    return uid ? this.preview[uid] || null : null;
  }

  getPreviewUrlForModal(): string | null {
    return this.getPreviewUrl(this.previewItem);
  }

  onPreviewWheel(event: WheelEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const delta = event.deltaY;
    const step = 0.1;
    const prev = this.previewZoom;
    let next = prev;
    if (delta < 0) {
      next = Math.min(this.maxZoom, prev + step);
    } else {
      next = Math.max(this.minZoom, prev - step);
    }
    if (next === prev) return;
    this.previewZoom = next;
  }

  zoomIn(): void {
    const step = 0.25;
    this.previewZoom = Math.min(this.maxZoom, this.previewZoom + step);
  }

  zoomOut(): void {
    const step = 0.25;
    this.previewZoom = Math.max(this.minZoom, this.previewZoom - step);
  }

  canZoomIn(): boolean {
    return !!this.getPreviewUrlForModal() && this.previewZoom < this.maxZoom;
  }
  canZoomOut(): boolean {
    return !!this.getPreviewUrlForModal() && this.previewZoom > this.minZoom;
  }
  zoomPercent(): number {
    return Math.round(this.previewZoom * 100);
  }

  @ViewChild('previewScroll') previewScroll?: ElementRef<HTMLDivElement>;
  @ViewChild('previewImg') previewImg?: ElementRef<HTMLImageElement>;

  toggleZoom(): void {
    const targetZoom = this.previewZoom < 2 ? 2 : 1;
    this.previewZoom = targetZoom;
    setTimeout(() => {
      const el = this.previewScroll?.nativeElement;
      if (!el) return;
      el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
      el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2);
    }, 0);
  }

  onPreviewMouseDown(event: MouseEvent): void {
    if (!this.getPreviewUrlForModal()) return;
    const el = this.previewScroll?.nativeElement;
    if (!el) return;
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragScrollLeft = el.scrollLeft;
    this.dragScrollTop = el.scrollTop;
    event.preventDefault();
  }

  onPreviewMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const el = this.previewScroll?.nativeElement;
    if (!el) return;
    const dx = event.clientX - this.dragStartX;
    const dy = event.clientY - this.dragStartY;
    el.scrollLeft = this.dragScrollLeft - dx;
    el.scrollTop = this.dragScrollTop - dy;
    event.preventDefault();
  }

  onPreviewMouseUp(): void {
    this.isDragging = false;
  }
  onPreviewMouseLeave(): void {
    this.isDragging = false;
  }

  onPreviewTouchStart(event: TouchEvent): void {
    if (!this.getPreviewUrlForModal()) return;
    const el = this.previewScroll?.nativeElement;
    if (!el) return;
    if (event.touches.length === 1) {
      const t = event.touches[0];
      this.isDragging = true;
      this.dragStartX = t.clientX;
      this.dragStartY = t.clientY;
      this.dragScrollLeft = el.scrollLeft;
      this.dragScrollTop = el.scrollTop;
    } else if (event.touches.length === 2) {
      const d = this.getTouchDist(event);
      if (d > 0) {
        this.pinchActive = true;
        this.pinchStartDist = d;
        this.pinchStartZoom = this.previewZoom;
        this.isDragging = false;
      }
    }
    event.preventDefault();
  }

  onPreviewTouchMove(event: TouchEvent): void {
    const el = this.previewScroll?.nativeElement;
    if (!el) return;
    if (this.pinchActive && event.touches.length === 2) {
      const d = this.getTouchDist(event);
      if (d > 0) {
        const factor = d / this.pinchStartDist;
        const next = Math.min(this.maxZoom, Math.max(this.minZoom, this.pinchStartZoom * factor));
        this.previewZoom = next;
      }
    } else if (this.isDragging && event.touches.length === 1) {
      const t = event.touches[0];
      const dx = t.clientX - this.dragStartX;
      const dy = t.clientY - this.dragStartY;
      el.scrollLeft = this.dragScrollLeft - dx;
      el.scrollTop = this.dragScrollTop - dy;
    }
    event.preventDefault();
  }

  onPreviewTouchEnd(): void {
    this.isDragging = false;
    this.pinchActive = false;
  }

  private getTouchDist(event: TouchEvent): number {
    if (event.touches.length < 2) return 0;
    const a = event.touches[0];
    const b = event.touches[1];
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  onPreviewImageLoad(ev: Event): void {
    const img = ev.target as HTMLImageElement | null;
    if (!img) return;
    this.previewNaturalWidth = img.naturalWidth;
    this.previewNaturalHeight = img.naturalHeight;
  }

  resetZoom(): void {
    this.previewZoom = 1;
    setTimeout(() => {
      const el = this.previewScroll?.nativeElement;
      if (!el) return;
      el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
      el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2);
    }, 0);
  }

  fitWidth(): void {
    this.resetZoom();
  }

  fitHeight(): void {
    const el = this.previewScroll?.nativeElement;
    const imgEl = this.previewImg?.nativeElement;
    if (!el || !imgEl) {
      this.resetZoom();
      return;
    }
    const natW = imgEl.naturalWidth || this.previewNaturalWidth;
    const natH = imgEl.naturalHeight || this.previewNaturalHeight;
    if (!natW || !natH) {
      this.resetZoom();
      return;
    }
    const contW = el.clientWidth;
    const contH = el.clientHeight;
    const targetZoom = (contH / natH) * (natW / contW);
    this.previewZoom = Math.min(this.maxZoom, Math.max(this.minZoom, targetZoom));
    setTimeout(() => {
      el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
      el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2);
    }, 0);
  }

  parseFecha(fechaStr: string | undefined | null): Date | null {
    if (!fechaStr) return null;
    // Formato esperado: "dd-MM-yyyy HH:mm:ss"
    const partes = fechaStr.split(' ');
    if (partes.length !== 2) return null;

    const [dia, mes, anio] = partes[0].split('-').map(Number);
    const [hora, min, seg] = partes[1].split(':').map(Number);

    if (!dia || !mes || !anio) return null;

    // Mes en Date es 0-indexado
    return new Date(anio, mes - 1, dia, hora || 0, min || 0, seg || 0);
  }

  onSelect(item: MediaItem): void {
    this.selectItem.emit(item);
  }

  trackByMediaItem(index: number, item: MediaItem): string {
    return item?.uuid || item?.url || `${item?.nombre || ''}-${item?.fechaCreacion || ''}`;
  }
}
