// editar-entrada.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntradaFacadeService } from '../entrada-form/srv/entrada-facade.service';
import { ValidationEntradaFormsService } from '../entrada-form/srv/validation-entrada-forms.service';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Entrada } from '../../../../core/models/entrada.model';
import { TipoEntrada } from '../../../../core/models/tipo-entrada.model';
import { EstadoEntrada } from '../../../../core/models/estado-entrada.model';
import { Categoria } from '../../../../core/models/categoria.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { formatForDateTimeLocal, parseAllowedDate } from '../../../../shared/utils/date-utils';

@Component({
  selector: 'app-editar-entrada',
  templateUrl: './editar-entrada.component.html',
  styleUrls: ['./editar-entrada.component.scss'],
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

  // Preview state
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
    // Inicializar deshabilitado
    this.entradaForm.disable({ emitEvent: false });
    
    this.idEntrada = this.route.snapshot.params['idEntrada'];
    const data = await this.facade.loadInitData();
    this.tiposEntr = data.tipos;
    this.estadosEntr = data.estados;
    this.categorias = data.categorias;

    // Cargar entrada
    this.facade.cargarEntradaPorId(this.idEntrada).subscribe((ent: Entrada) => {
      if (!ent) return;
      this.entrada = ent;

      // Busca los objetos reales por referencia
      const estadoCorrecto = this.estadosEntr.find(
        (e) => e.idEstadoEntrada === ent.estadoEntrada?.idEstadoEntrada
      );
      const tipoCorrecto = this.tiposEntr.find(
        (t) => t.idTipoEntrada === ent.tipoEntrada?.idTipoEntrada
      );

      // Usar patchValue con emitEvent: false para evitar disparar valueChanges innecesariamente durante la carga
            this.entradaForm.patchValue({
              ...ent,
              estadoEntrada: estadoCorrecto ?? null,
              tipoEntrada: tipoCorrecto ?? null,
              fechaPublicacionProgramada: formatForDateTimeLocal(ent.fechaPublicacionProgramada)
            }, { emitEvent: false });

            // Rellenar categorías
      const arr = this.entradaForm.get('categorias') as UntypedFormArray;
      // Limpiar primero por si acaso
      arr.clear();
      
      if (ent.categorias && Array.isArray(ent.categorias)) {
        ent.categorias.forEach((cat: any) => arr.push(new UntypedFormControl(cat)));
      }

      // Asegurar estado final correcto
      if (this.modoLectura) {
        this.entradaForm.disable({ emitEvent: false });
      } else {
        this.entradaForm.enable({ emitEvent: false });
      }
      
      // Marcar como pristine después de cargar datos
      this.entradaForm.markAsPristine();
    });

    // Activar dirty en cualquier cambio posterior
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
    // Cierra la previa y deja el formulario listo para editar
    this.modalPreviaVisible = false;
    // opcional: enfocar el título u otra interacción
    // document.getElementById('titulo')?.focus();
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
