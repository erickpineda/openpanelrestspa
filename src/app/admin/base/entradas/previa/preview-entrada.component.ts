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
import { Entrada } from '../../../../core/models/entrada.model';
import { Categoria } from '../../../../core/models/categoria.model';

@Component({
  selector: 'app-previa-entrada',
  templateUrl: './preview-entrada.component.html',
  styleUrls: ['./preview-entrada.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PreviaEntradaComponent implements OnChanges {
  @Input() form?: UntypedFormGroup;
  @Input() entrada?: Entrada;
  @Input() categoriasMeta?: Categoria[] = [];
  @Input() mostrarBotonesAccion = true;

  @Output() cerrar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<void>();
  @Output() publicar = new EventEmitter<Entrada>();

  tituloMostrar = '';
  contenidoSeguro: SafeHtml = '';
  categoriasMostrar: { idCategoria?: number; nombre?: string }[] = [];

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['form'] || changes['entrada'] || changes['categoriasMeta']) {
      this.refreshPreview();
    }
  }

  private refreshPreview(): void {
    // TITULO
    if (this.form && this.form.get('titulo')) {
      this.tituloMostrar = this.form.get('titulo')?.value || '';
    } else if (this.entrada && this.entrada.titulo) {
      this.tituloMostrar = this.entrada.titulo;
    } else {
      this.tituloMostrar = '';
    }

    // CONTENIDO
    const contenidoRaw =
      this.form && this.form.get('contenido')
        ? this.form.get('contenido')?.value
        : this.entrada
          ? this.entrada.contenido
          : '';

    this.contenidoSeguro = this.sanitizeHtml(contenidoRaw);

    // CATEGORIAS
    this.categoriasMostrar = this.resolveCategorias();
  }

  private resolveCategorias(): Categoria[] {
    // Prioridad: entrada.categorias > form.categorias (objetos) > form.categorias (ids + categoriasMeta)
    if (
      this.entrada &&
      Array.isArray(this.entrada.categorias) &&
      this.entrada.categorias.length
    ) {
      return this.entrada.categorias;
    }

    const formCats = this.form?.get('categorias')?.value;
    if (!formCats) return [];

    if (Array.isArray(formCats) && formCats.length > 0) {
      // si son objetos con nombre
      if (typeof formCats[0] === 'object' && 'nombre' in formCats[0]) {
        return formCats;
      }

      // si son ids (números o strings)
      if (this.categoriasMeta && this.categoriasMeta.length) {
        const ids = formCats.map((x: any) => Number(x));
        return this.categoriasMeta.filter((c) =>
          ids.includes(Number(c.idCategoria)),
        );
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
    // opcional: emitimos objeto combinado (por si falta información en form)
    const payload: Entrada = {
      ...(this.entrada || {}),
      ...(this.form ? this.form.value : {}),
    } as Entrada;
    this.publicar.emit(payload);
  }
}
