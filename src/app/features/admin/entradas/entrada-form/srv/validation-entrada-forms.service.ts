import { Injectable } from '@angular/core';
import {
  AbstractControl,
  ValidationErrors,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  UntypedFormControl,
} from '@angular/forms';
import { Entrada } from '@app/core/models/entrada.model';
import { Categoria } from '@app/core/models/categoria.model';
import { Etiqueta } from '@app/core/models/etiqueta.model';
import { EstadoEntrada } from '@app/core/models/estado-entrada.model';

@Injectable({ providedIn: 'root' })
export class ValidationEntradaFormsService {
  constructor(private fb: UntypedFormBuilder) {}

  private scheduledDateValidator(control: AbstractControl): ValidationErrors | null {
    const parent = control.parent as UntypedFormGroup | null;
    const estado = parent?.get('estadoEntrada')?.value as EstadoEntrada | null;
    const isScheduled =
      !!estado && (estado.nombre === 'PROGRAMADA' || estado.codigo === 'PRO');

    if (!control.value) {
      if (isScheduled) {
        return { requiredWhenScheduled: true };
      }
      return null;
    }

    const inputDate = new Date(control.value);
    const now = new Date();

    if (inputDate < now) {
      return { minDate: true };
    }

    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60000);
    if (inputDate < thirtyMinutesLater) {
      return { minMargin: true };
    }

    return null;
  }

  buildForm(initial?: Entrada): UntypedFormGroup {
    const categorias = (initial?.categorias || []) as Categoria[];
    const etiquetas = (initial?.etiquetas || []) as Etiqueta[];
    return this.fb.group({
      idEntrada: [initial?.idEntrada ?? null],
      idUsuario: [initial?.idUsuario ?? null],
      idUsuarioEditado: [initial?.idUsuarioEditado ?? null],
      titulo: [
        initial?.titulo || '',
        [Validators.required, Validators.minLength(1), Validators.maxLength(150)],
      ],
      subtitulo: [initial?.subtitulo || '', [Validators.maxLength(200)]],
      slug: [initial?.slug || ''],
      resumen: [initial?.resumen || ''],
      contenido: [initial?.contenido || '', [Validators.required, Validators.minLength(1)]],
      notas: [initial?.notas || ''],
      borrador: [initial?.borrador ?? true],
      publicada: [!!initial?.publicada],
      password: [initial?.password || ''],
      privado: [!!initial?.privado],
      permitirComentario: [initial?.permitirComentario ?? true],
      imagenDestacada: [null],
      imagenDestacadaUuid: [initial?.imagenDestacadaUuid ?? null],
      fechaPublicacion: [initial?.fechaPublicacion || null],
      fechaEdicion: [initial?.fechaEdicion || null],
      fechaPublicacionProgramada: [
        initial?.fechaPublicacionProgramada || null,
        [this.scheduledDateValidator],
      ],
      estadoEntrada: [initial?.estadoEntrada || null, Validators.required],
      tipoEntrada: [initial?.tipoEntrada || null, Validators.required],
      categorias: this.fb.array(categorias.map((c) => this.fb.control(c))),
      etiquetas: this.fb.array(etiquetas.map((t) => new UntypedFormControl(t))),
      votos: [initial?.votos ?? 0],
      cantidadComentarios: [initial?.cantidadComentarios ?? 0],
      categoriasConComas: [initial?.categoriasConComas || ''],
      usernameCreador: [initial?.usernameCreador || ''],
    });
  }
  getCategoriasArray(form: UntypedFormGroup): UntypedFormArray {
    return form.get('categorias') as UntypedFormArray;
  }
  getEtiquetasArray(form: UntypedFormGroup): UntypedFormArray {
    return form.get('etiquetas') as UntypedFormArray;
  }
}
