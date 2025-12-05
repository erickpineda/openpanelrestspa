import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { TemasService } from '../../../../core/services/data/temas.service';
import { Tema } from '../../../../core/models/tema.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-temas',
  templateUrl: './temas.component.html',
  styleUrls: ['./temas.component.scss']
})
export class TemasComponent implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  temas: Tema[] = [];
  modalVisible = false;
  editItem: Tema | null = null;
  form: FormGroup;
  private destroy$ = new Subject<void>();

  // Patrón de toolbar/búsqueda/paginación
  basicSearchText: string = '';
  showAdvanced: boolean = false;
  filtroNombre: string = '';
  filtroActivo: boolean | null = null;
  pageSize: number = 10;
  pageNo: number = 0;
  totalElements: number = 0;
  filteredTemas: Tema[] = [];
  pagedTemas: Tema[] = [];

  constructor(
    private temasService: TemasService, 
    private fb: FormBuilder, 
    private toast: ToastService, 
    private log: LoggerService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      activo: ['false', Validators.required],
      esquemaColor: ['', Validators.maxLength(50)]
    });
  }

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  load(): void {
    this.loading = true; 
    this.error = null;
    
    this.temasService.listarTemasSafeSinGlobalLoader()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { 
          this.loading = false; 
          this.cdr.detectChanges(); 
        })
      )
      .subscribe({
        next: (list: Tema[]) => { 
          this.temas = Array.isArray(list) ? list : []; 
          this.totalElements = this.temas.length; 
          this.search(); 
        },
        error: (err) => { 
          this.error = 'Error cargando temas'; 
          this.log.error('temas listar', err); 
        }
      });
  }

  openNew(): void {
    this.editItem = null;
    this.form.reset({ nombre: '', activo: 'false', esquemaColor: '' });
    this.modalVisible = true;
  }

  openEdit(item: Tema): void {
    this.editItem = { ...item };
    this.form.reset({
      nombre: item.nombre || '',
      activo: String(item.activo ? 'true' : 'false'),
      esquemaColor: item.esquemaColor || ''
    });
    this.modalVisible = true;
  }

  closeModal(): void { this.modalVisible = false; this.editItem = null; }

  save(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const payload: Tema = {
      nombre: this.form.value.nombre,
      activo: this.form.value.activo === 'true',
      esquemaColor: this.form.value.esquemaColor
    };
    const op = this.editItem?.id ? this.temasService.actualizarSafe(this.editItem.id, payload) : this.temasService.crearSafe(payload);
    op.subscribe({
      next: () => { this.toast.showSuccess('Tema guardado', 'Temas'); this.loading = false; this.modalVisible = false; this.load(); },
      error: (err) => { this.toast.showError('Error guardando', 'Temas'); this.log.error('temas guardar', err); this.loading = false; }
    });
  }

  delete(item: Tema): void {
    if (!item.id) return;
    if (!confirm('¿Eliminar tema?')) return;
    this.loading = true;
    this.temasService.eliminarSafe(item.id).subscribe({
      next: () => { this.toast.showSuccess('Tema eliminado', 'Temas'); this.loading = false; this.load(); },
      error: (err) => { this.toast.showError('Error eliminando', 'Temas'); this.log.error('temas eliminar', err); this.loading = false; }
    });
  }

  // ===== Toolbar / Búsqueda / Paginación =====
  toggleAdvanced(): void { this.showAdvanced = !this.showAdvanced; }
  onBasicSearchTextChange(text: string): void { this.basicSearchText = text || ''; this.pageNo = 0; this.search(); }
  onPageSizeChange(size: number): void { this.pageSize = Number(size) || 10; this.pageNo = 0; this.updatePage(); }

  search(): void {
    const term = (this.basicSearchText || '').toLowerCase();
    const nombre = (this.filtroNombre || '').toLowerCase();
    const activo = this.filtroActivo;
    const base = this.temas || [];
    this.filteredTemas = base.filter(t => {
      const n = (t.nombre || '').toLowerCase();
      const mBasic = !term || n.includes(term);
      const mNombre = !nombre || n.includes(nombre);
      const mActivo = activo === null || t.activo === activo;
      return mBasic && mNombre && mActivo;
    });
    this.totalElements = this.filteredTemas.length;
    this.pageNo = 0;
    this.updatePage();
  }

  reset(): void {
    this.basicSearchText = '';
    this.filtroNombre = '';
    this.filtroActivo = null;
    this.pageNo = 0;
    this.search();
  }

  prev(): void { if (this.pageNo > 0) { this.pageNo--; this.updatePage(); } }
  next(): void { if (this.pageNo < this.getTotalPages() - 1) { this.pageNo++; this.updatePage(); } }
  getTotalPages(): number { return Math.max(1, Math.ceil(this.totalElements / this.pageSize)); }

  private updatePage(): void {
    const start = this.pageNo * this.pageSize;
    const end = start + this.pageSize;
    this.pagedTemas = this.filteredTemas.slice(start, end);
  }
}
