import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild
} from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, UntypedFormArray } from '@angular/forms';
import { Subject, Observable, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  catchError,
  map,
  takeUntil,
  filter
} from 'rxjs/operators';
import { EtiquetaService } from '@app/core/services/data/etiqueta.service';
import { Etiqueta } from '@app/core/models/etiqueta.model';
import { ToastService } from '@app/core/services/ui/toast.service';
import { SearchUtilService } from '@app/core/services/utils/search-util.service';
import { HttpContext } from '@angular/common/http';
import { SKIP_GLOBAL_NOTIFY } from '@app/core/interceptor/network.interceptor';

@Component({
  selector: 'app-entrada-etiquetas',
  templateUrl: './entrada-etiquetas.component.html',
  styleUrls: ['./entrada-etiquetas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class EntradaEtiquetasComponent implements OnInit, OnDestroy {
  @Input() parentForm!: UntypedFormGroup;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchControl = new UntypedFormControl('');
  suggestions: Etiqueta[] = [];
  loading = false;
  showSuggestions = false;
  activeIndex = -1;
  errorMsg: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private etiquetaService: EtiquetaService,
    private toast: ToastService,
    private cdRef: ChangeDetectorRef,
    private searchUtil: SearchUtilService
  ) {}

  get etiquetasArray(): UntypedFormArray {
    return this.parentForm.get('etiquetas') as UntypedFormArray;
  }

  get enabled(): boolean {
    return this.parentForm.enabled;
  }

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged(),
      tap((term) => {
        this.errorMsg = null;
        if (term && term.length >= 2) {
            this.loading = true;
            this.showSuggestions = true;
        } else {
            this.showSuggestions = false;
        }
        this.cdRef.markForCheck();
      }),
      switchMap(term => {
        if (!term || typeof term !== 'string' || term.length < 2) {
          return of([]);
        }
        const criteria = [
          { filterKey: 'nombre', value: term, operation: 'CONTAINS' }
        ];
        const searchRequest = this.searchUtil.buildRequest('Etiqueta', criteria, 'AND');
        return this.etiquetaService.buscarSinGlobalLoader(searchRequest, 0, 10).pipe(
          map(response => {
            const data = response?.data ?? response;
            const raw = (data?.elements ?? (data as any)?.items ?? (data as any)?.content ?? []) as any[];
            const list = Array.isArray(raw) ? raw : [];
            return list.map((e: any) => ({
              codigo: e?.codigo ?? e?.code ?? '',
              nombre: e?.nombre ?? e?.name ?? e?.texto ?? e?.title ?? e?.codigo ?? '',
              frecuencia: e?.frecuencia ?? e?.frequency ?? 0,
              descripcion: e?.descripcion ?? e?.description ?? '',
              colorHex: e?.colorHex ?? e?.color ?? '#6c757d'
            })) as Etiqueta[];
          }),
          catchError(() => {
            this.errorMsg = 'Error al cargar sugerencias';
            this.cdRef.markForCheck();
            return of([]);
          })
        );
      }),
      tap((results) => {
        this.loading = false;
        this.suggestions = results;
        this.activeIndex = -1; // Resetear índice al recibir nuevos resultados
        // Asegurarnos de mostrar sugerencias si hay resultados y el input sigue activo
        if (this.suggestions.length > 0 && this.searchControl.value.length >= 2) {
            this.showSuggestions = true;
        }
        this.cdRef.markForCheck();
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addEtiqueta(etiqueta: Etiqueta): void {
    if (this.hasEtiqueta(etiqueta)) {
      this.clearSearch();
      return;
    }
    const nameFromInput = (this.searchControl.value || '').trim();
    if (!etiqueta?.nombre || etiqueta.nombre.trim().length === 0) {
      etiqueta.nombre = nameFromInput || etiqueta.codigo;
    }
    if (etiqueta.nombre && this.hasEtiquetaByNombre(etiqueta.nombre)) {
      this.toast.showWarning('La etiqueta ya está seleccionada');
      this.clearSearch();
      return;
    }
    etiqueta.colorHex = etiqueta.colorHex || '#6c757d';

    this.etiquetasArray.push(new UntypedFormControl(etiqueta));
    this.clearSearch();
    this.cdRef.markForCheck();
  }

  removeEtiqueta(index: number): void {
    if (!this.enabled) return;
    this.etiquetasArray.removeAt(index);
    this.cdRef.markForCheck();
  }

  hasEtiqueta(etiqueta: Etiqueta): boolean {
    const values = this.etiquetasArray.value as Etiqueta[];
    return values.some(e => e.codigo === etiqueta.codigo);
  }
  private normalizeName(s: string): string {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }
  hasEtiquetaByNombre(nombre: string): boolean {
    const n = this.normalizeName(nombre);
    const values = this.etiquetasArray.value as Etiqueta[];
    return values.some(e => this.normalizeName(e.nombre) === n);
  }
  isSelected(tag: Etiqueta): boolean {
    return this.hasEtiqueta(tag) || this.hasEtiquetaByNombre(tag.nombre);
  }
  private normalizeColorHex(color?: string): string {
    if (!color) return '';
    const c = color.trim();
    if (/^#?[0-9a-fA-F]{6}$/.test(c)) {
      return c.startsWith('#') ? c : `#${c}`;
    }
    if (/^#?[0-9a-fA-F]{3}$/.test(c)) {
      const x = c.replace('#','');
      const r = x[0]+x[0], g = x[1]+x[1], b = x[2]+x[2];
      return `#${r}${g}${b}`;
    }
    return c;
  }
  private hexToRgba(color: string, alpha: number): string {
    const c = color.startsWith('#') ? color.substring(1) : color;
    if (c.length === 3) {
      const r = parseInt(c[0]+c[0],16);
      const g = parseInt(c[1]+c[1],16);
      const b = parseInt(c[2]+c[2],16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (c.length === 6) {
      const r = parseInt(c.substring(0,2),16);
      const g = parseInt(c.substring(2,4),16);
      const b = parseInt(c.substring(4,6),16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }
  private toAlphaColor(color: string, alpha: number): string | null {
    const c = color.trim();
    if (c.startsWith('#')) {
      return this.hexToRgba(c, alpha);
    }
    const rgb = c.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (rgb) {
      const r = Number(rgb[1]), g = Number(rgb[2]), b = Number(rgb[3]);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    const hsl = c.match(/^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i);
    if (hsl) {
      const h = Number(hsl[1]), s = Number(hsl[2]), l = Number(hsl[3]);
      return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
    }
    return null;
  }
  getChipStyle(index: number): { [key: string]: string } {
    const e = this.getEtiquetaValue(index);
    const col = (e?.colorHex || '#6c757d').trim();
    const bg = this.toAlphaColor(col, 0.12);
    return {
      'border-left': `3px solid ${col}`,
      ...(bg ? { 'background-color': bg } : {})
    };
  }

  createEtiqueta(): void {
    const term = this.searchControl.value;
    if (!term || term.length < 2) return;

    // Verificar si ya existe exactamente en las sugerencias para evitar duplicados por error
    const existing = this.suggestions.find(s => s.nombre.toLowerCase() === term.toLowerCase());
    if (existing) {
        this.addEtiqueta(existing);
        return;
    }
    // Evitar duplicado por nombre ya seleccionado
    if (this.hasEtiquetaByNombre(term)) {
      this.toast.showWarning('La etiqueta ya está seleccionada');
      this.clearSearch();
      return;
    }

    // Generar un código simple basado en el nombre
    // Limpiar caracteres especiales y espacios
    let codigo = term.toUpperCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
        .replace(/[^A-Z0-9]/g, ''); // Solo letras y números

    if (codigo.length < 3) {
        codigo = 'TAG' + Date.now().toString().slice(-6);
    } else {
        codigo = codigo.substring(0, 15);
    }
    
    // Generar color aleatorio pastel para nuevas etiquetas
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 70%, 80%)`;
    // Convertir a hex aproximado o usar un color fijo si el backend lo requiere hex estricto
    // Por simplicidad usaremos un color por defecto o permitiremos que el backend asigne
    
    const newEtiqueta: Etiqueta = {
      codigo: codigo,
      nombre: term,
      descripcion: 'Creada desde entrada',
      frecuencia: 0,
      colorHex: '#6c757d' // Gris por defecto
    };

    this.loading = true;
    this.cdRef.markForCheck();

    const context = new HttpContext().set(SKIP_GLOBAL_NOTIFY, true);
    this.etiquetaService.crear(newEtiqueta, context).subscribe({
      next: (created) => {
        if (!created?.nombre) created.nombre = term;
        created.colorHex = created?.colorHex || '#6c757d';
        this.addEtiqueta(created);
        this.toast.showSuccess('Etiqueta creada correctamente');
        this.loading = false;
        this.cdRef.markForCheck();
      },
      error: (err) => {
        const backendMsg =
          err?.error?.error?.details?.[0] ||
          err?.error?.error?.message ||
          err?.error?.result?.message ||
          err?.message;
        const finalMsg = backendMsg
          ? String(backendMsg).replace(/^\w+?\s*:\s*/, '')
          : 'Error al crear la etiqueta';
        this.toast.showError(finalMsg, 'Error de Validación');
        this.loading = false;
        this.cdRef.markForCheck();
      }
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.showSuggestions) {
        if (event.key === 'ArrowDown' && this.suggestions.length > 0) {
            this.showSuggestions = true;
            this.cdRef.markForCheck();
        }
        return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % this.suggestions.length;
      this.cdRef.markForCheck();
      this.scrollToActive();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = (this.activeIndex - 1 + this.suggestions.length) % this.suggestions.length;
      this.cdRef.markForCheck();
      this.scrollToActive();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.activeIndex >= 0 && this.suggestions[this.activeIndex]) {
        this.addEtiqueta(this.suggestions[this.activeIndex]);
      } else {
        this.onEnterKey(event);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.showSuggestions = false;
      this.activeIndex = -1;
      this.cdRef.markForCheck();
    } else if (event.key === 'Tab') {
      if (this.activeIndex >= 0 && this.suggestions[this.activeIndex]) {
          event.preventDefault();
          this.addEtiqueta(this.suggestions[this.activeIndex]);
      } else {
          this.showSuggestions = false;
      }
    }
  }

  private scrollToActive(): void {
      const listGroup = document.querySelector('.suggestions-dropdown');
      const activeItem = listGroup?.querySelector('.list-group-item.active');
      if (activeItem) {
          activeItem.scrollIntoView({ block: 'nearest' });
      }
  }

  onEnterKey(event: Event): void {
      event.preventDefault();
      // Si hay una coincidencia exacta en las sugerencias, úsala
      const term = this.searchControl.value;
      if (term) {
          const exactMatch = this.suggestions.find(s => s.nombre.toLowerCase() === term.toLowerCase());
          if (exactMatch) {
              this.addEtiqueta(exactMatch);
          } else {
              this.createEtiqueta();
          }
      }
  }

  private clearSearch(): void {
    this.searchControl.setValue('');
    this.showSuggestions = false;
    if (this.searchInput) {
        this.searchInput.nativeElement.focus();
    }
  }

  onBlur(): void {
    // Retraso para permitir click en sugerencias
    setTimeout(() => {
      this.showSuggestions = false;
      this.cdRef.markForCheck();
    }, 200);
  }

  onFocus(): void {
      const val = this.searchControl.value;
      if (val && val.length >= 2) {
          this.showSuggestions = true;
          this.cdRef.markForCheck();
      }
  }

  getEtiquetaValue(index: number): Etiqueta | null {
      const control = this.etiquetasArray.at(index);
      return control ? control.value : null;
  }
}
