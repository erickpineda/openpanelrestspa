import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { EntradaFacadeService } from '@features/admin/entradas/entrada-form/srv/entrada-facade.service';
import { ValidationEntradaFormsService } from '@features/admin/entradas/entrada-form/srv/validation-entrada-forms.service';
import { Entrada } from '@app/core/models/entrada.model';
import { TipoEntrada } from '@app/core/models/tipo-entrada.model';
import { EstadoEntrada } from '@app/core/models/estado-entrada.model';
import { Categoria } from '@app/core/models/categoria.model';
import { ToastService } from '@app/core/services/ui/toast.service';
import { formatForDateTimeLocal, parseAllowedDate } from '@shared/utils/date-utils';

@Component({
  selector: 'app-editar-entrada',
  templateUrl: './editar-entrada.component.html',
  standalone: false,
})
export class EditarEntradaComponent implements OnInit {
  entradaForm!: UntypedFormGroup;
  tiposEntr: TipoEntrada[] = [];
  estadosEntr: EstadoEntrada[] = [];
  categorias: Categoria[] = [];
  entrada: Entrada = new Entrada();
  modoLectura = true;
  submitted = false;
  idEntrada!: number;

  modalPreviaVisible = false;
  entradaParaPrevia?: Entrada;

  get esPublicada(): boolean {
    const nombreEstado = this.entrada?.estadoEntrada?.nombre?.toUpperCase();
    return nombreEstado === 'PUBLICADA';
  }

  get fechaPublicacionMostrar(): Date | null {
    if (!this.entrada || !this.entrada.fechaPublicacion) {
      return null;
    }
    return parseAllowedDate(this.entrada.fechaPublicacion) || null;
  }

  constructor(
    private route: ActivatedRoute,
    private vf: ValidationEntradaFormsService,
    private facade: EntradaFacadeService,
    private router: Router,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    this.entradaForm = this.vf.buildForm(this.entrada);
    this.entradaForm.disable({ emitEvent: false });

    this.idEntrada = this.route.snapshot.params['idEntrada'];
    const data = await this.facade.loadInitData();
    this.tiposEntr = data.tipos;
    this.estadosEntr = data.estados;
    this.categorias = data.categorias;

    this.facade.cargarEntradaPorId(this.idEntrada).subscribe((ent: Entrada) => {
      if (!ent) return;
      this.entrada = ent;

      const estadoCorrecto = this.estadosEntr.find(
        (e) => e.codigo === ent.estadoEntrada?.codigo
      );
      const tipoCorrecto = this.tiposEntr.find(
        (t) => t.codigo === ent.tipoEntrada?.codigo
      );

      this.entradaForm.patchValue(
        {
          ...ent,
          estadoEntrada: estadoCorrecto ?? null,
          tipoEntrada: tipoCorrecto ?? null,
          fechaPublicacionProgramada: formatForDateTimeLocal(ent.fechaPublicacionProgramada),
        },
        { emitEvent: false }
      );

      const arr = this.entradaForm.get('categorias') as UntypedFormArray;
      arr.clear();

      if (ent.categorias && Array.isArray(ent.categorias)) {
        ent.categorias.forEach((cat: any) => arr.push(new UntypedFormControl(cat)));
      }

      if (this.modoLectura) {
        this.entradaForm.disable({ emitEvent: false });
      } else {
        this.entradaForm.enable({ emitEvent: false });
      }

      this.entradaForm.markAsPristine();
    });

    this.entradaForm.valueChanges.subscribe(() => {
      if (this.entradaForm.pristine && !this.entradaForm.disabled) {
        this.entradaForm.markAsDirty();
      }
    });
  }

  onEditar() {
    this.modoLectura = false;
    this.entradaForm.enable();
    this.entradaForm.markAsPristine();
  }

  async onGuardar(ent: any) {
    this.submitted = true;
    if (this.entradaForm.invalid) return;

    const usuario = await this.facade.getUsuarioSesion();
    ent.idUsuarioEditado = usuario?.idUsuario ?? null;

    this.facade.actualizarEntrada(this.idEntrada, ent).subscribe(() => {
      this.toastService.showSuccess(
        'La entrada se ha actualizado correctamente.',
        'Entrada actualizada'
      );
      this.router.navigateByUrl('/admin/control/entradas');
    });
  }

  onPreviewEmit(payload: Partial<Entrada>) {
    this.entradaParaPrevia = {
      ...(this.entradaParaPrevia || {}),
      ...(payload as Entrada),
    } as Entrada;
    this.modalPreviaVisible = true;
  }

  onEditarDesdePreview() {
    this.modalPreviaVisible = false;
  }

  onCerrarPreview() {
    this.modalPreviaVisible = false;
  }

  onPublicarDesdePreview() {
    this.modalPreviaVisible = false;
    if (this.entradaParaPrevia) {
      this.onGuardar(this.entradaParaPrevia);
    }
  }

  onCancelar() {
    this.router.navigateByUrl('/admin/control/entradas');
  }
}
