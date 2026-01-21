import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UntypedFormGroup } from '@angular/forms';
import { Entrada } from '@app/core/models/entrada.model';
import { Categoria } from '@app/core/models/categoria.model';
import { parseAllowedDate } from '@shared/utils/date-utils';

@Component({
  selector: 'app-previa-entrada',
  templateUrl: './previa-entrada.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PreviaEntradaComponent implements OnChanges {
  @Input() form?: UntypedFormGroup;
  @Input() entrada?: Entrada;
  @Input() categoriasMeta?: Categoria[] = [];
  @Input() mostrarBotonesAccion = true;
  @Input() mostrarTitulo = true;

  @Output() cerrar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<void>();
  @Output() publicar = new EventEmitter<Entrada>();

  tituloMostrar = '';
  contenidoSeguro: SafeHtml = '';
  categoriasMostrar: { codigo?: string; nombre?: string }[] = [];
  imagenMostrar: string | null = null;
  usernameMostrar: string = '';
  fechaMostrar: Date | null = null;
  esFechaProgramada: boolean = false;
  esFechaPublicada: boolean = false;
  estadoTooltip: string = '';
  estadoIcon: string = '';
  estadoColor: string = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['form'] || changes['entrada'] || changes['categoriasMeta']) {
      this.refreshPreview();
    }
  }

  private refreshPreview(): void {
    if (this.form && this.form.get('titulo')) {
      this.tituloMostrar = this.form.get('titulo')?.value || '';
    } else if (this.entrada && this.entrada.titulo) {
      this.tituloMostrar = this.entrada.titulo;
    } else {
      this.tituloMostrar = '';
    }

    if (this.form && this.form.get('imagenDestacada')) {
      const val = this.form.get('imagenDestacada')?.value;
      this.imagenMostrar = typeof val === 'string' ? val : null;
    } else if (this.entrada && this.entrada.imagenDestacada) {
      this.imagenMostrar = this.entrada.imagenDestacada;
    } else {
      this.imagenMostrar = null;
    }

    if (this.entrada && this.entrada.usernameCreador) {
      this.usernameMostrar = this.entrada.usernameCreador;
    } else {
      this.usernameMostrar = '';
    }

    this.resolveEstado();
    this.resolveFecha();

    const contenidoRaw =
      this.form && this.form.get('contenido')
        ? this.form.get('contenido')?.value
        : this.entrada
          ? this.entrada.contenido
          : '';

    this.contenidoSeguro = this.sanitizeHtml(contenidoRaw);
    this.categoriasMostrar = this.resolveCategorias();
  }

  private resolveFecha(): void {
    const entrada = this.entrada;
    this.esFechaProgramada = false;
    this.esFechaPublicada = false;

    if (!entrada) {
      this.fechaMostrar = new Date();
      return;
    }

    const nombreEstado = entrada.estadoEntrada?.nombre?.toUpperCase();

    if (nombreEstado === 'PROGRAMADA' && entrada.fechaPublicacionProgramada) {
      const parsed = parseAllowedDate(entrada.fechaPublicacionProgramada);
      this.fechaMostrar = parsed || new Date();
      this.esFechaProgramada = true;
    } else if (nombreEstado === 'PUBLICADA' && entrada.fechaPublicacion) {
      const parsed = parseAllowedDate(entrada.fechaPublicacion);
      this.fechaMostrar = parsed || new Date();
      this.esFechaPublicada = true;
    } else if (entrada.fechaPublicacion) {
      const parsed = parseAllowedDate(entrada.fechaPublicacion);
      this.fechaMostrar = parsed || new Date();
    } else {
      this.fechaMostrar = new Date();
    }
  }

  private resolveEstado(): void {
    const entrada = this.entrada;
    if (!entrada) {
      this.estadoTooltip = '';
      this.estadoIcon = '';
      this.estadoColor = '';
      return;
    }

    const nombreEstado = entrada.estadoEntrada?.nombre?.toUpperCase();

    switch (nombreEstado) {
      case 'PUBLICADA':
        this.estadoColor = 'success';
        this.estadoIcon = 'cilCheckCircle';
        this.estadoTooltip = 'Publicada';
        break;
      case 'NO PUBLICADA':
        this.estadoColor = 'danger';
        this.estadoIcon = 'cilXCircle';
        this.estadoTooltip = 'No Publicada';
        break;
      case 'GUARDADA':
      case 'BORRADOR':
        this.estadoColor = 'secondary';
        this.estadoIcon = 'cilSave';
        this.estadoTooltip = 'Guardada';
        break;
      case 'PENDIENTE REVISION':
        this.estadoColor = 'warning';
        this.estadoIcon = 'cilWarning';
        this.estadoTooltip = 'Pendiente Revisión';
        break;
      case 'EN REVISION':
        this.estadoColor = 'info';
        this.estadoIcon = 'cilZoom';
        this.estadoTooltip = 'En Revisión';
        break;
      case 'REVISADA':
        this.estadoColor = 'primary';
        this.estadoIcon = 'cilTask';
        this.estadoTooltip = 'Revisada';
        break;
      case 'HISTORICA':
        this.estadoColor = 'dark';
        this.estadoIcon = 'cilHistory';
        this.estadoTooltip = 'Histórica';
        break;
      case 'PROGRAMADA':
        this.estadoColor = 'info';
        this.estadoIcon = 'cilCalendar';
        this.estadoTooltip = 'Programada';
        break;
      default:
        this.estadoColor = 'secondary';
        this.estadoIcon = 'cilFile';
        this.estadoTooltip = entrada.estadoEntrada?.nombre || 'Archivada';
        break;
    }
  }

  private resolveCategorias(): Categoria[] {
    if (this.entrada && Array.isArray(this.entrada.categorias) && this.entrada.categorias.length) {
      return this.entrada.categorias;
    }

    const formCats = this.form?.get('categorias')?.value;
    if (!formCats) return [];

    if (Array.isArray(formCats) && formCats.length > 0) {
      if (typeof formCats[0] === 'object' && 'nombre' in formCats[0]) {
        return formCats;
      }

      if (this.categoriasMeta && this.categoriasMeta.length) {
        // Asumimos que si no son objetos, son códigos
        const codes = formCats.map((x: any) => String(x));
        return this.categoriasMeta.filter((c) => codes.includes(c.codigo));
      }
    }

    return [];
  }

  private sanitizeHtml(html: string | null | undefined): SafeHtml {
    if (!html) return '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  onCerrar(): void {
    this.cerrar.emit();
  }

  onEditar(): void {
    this.editar.emit();
  }

  onPublicar(): void {
    const payload: Entrada = {
      ...(this.entrada || {}),
      ...(this.form ? this.form.value : {}),
    } as Entrada;
    this.publicar.emit(payload);
  }
}
