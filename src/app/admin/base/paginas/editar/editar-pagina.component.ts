import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntradaFacadeService } from '../../entradas/entrada-form/srv/entrada-facade.service';
import { ValidationEntradaFormsService } from '../../entradas/entrada-form/srv/validation-entrada-forms.service';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Entrada } from '../../../../core/models/entrada.model';
import { TipoEntrada } from '../../../../core/models/tipo-entrada.model';
import { EstadoEntrada } from '../../../../core/models/estado-entrada.model';
import { Categoria } from '../../../../core/models/categoria.model';
import { ToastService } from '../../../../core/services/ui/toast.service';

@Component({
  selector: 'app-editar-pagina',
  templateUrl: './editar-pagina.component.html',
  styleUrls: ['./editar-pagina.component.scss'],
  standalone: false,
})
export class EditarPaginaComponent implements OnInit {
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

  constructor(
    private route: ActivatedRoute,
    private vf: ValidationEntradaFormsService,
    private facade: EntradaFacadeService,
    private router: Router,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    this.entradaForm = this.vf.buildForm(this.entrada);
    this.entradaForm.disable(); // Deshabilitar por defecto
    this.idEntrada = this.route.snapshot.params['idEntrada'];

    const data = await this.facade.loadInitData();
    this.estadosEntr = data.estados;
    this.categorias = data.categorias;

    // Filtrar solo el tipo 'Página' para el selector, aunque al editar ya vendrá con su tipo
    const tipoPagina = data.tipos.find((t) => t.nombre === 'Página');
    this.tiposEntr = tipoPagina ? [tipoPagina] : data.tipos;

    // Cargar entrada
    this.facade.cargarEntradaPorId(this.idEntrada).subscribe((ent: Entrada) => {
      if (!ent) return;
      this.entrada = ent;

      // Busca los objetos reales por referencia
      const estadoCorrecto = this.estadosEntr.find(
        (e) => e.idEstadoEntrada === ent.estadoEntrada?.idEstadoEntrada
      );
      // Usamos la lista filtrada o la completa si no encontramos 'Página'
      const tipoCorrecto =
        this.tiposEntr.find((t) => t.idTipoEntrada === ent.tipoEntrada?.idTipoEntrada) ||
        data.tipos.find((t) => t.idTipoEntrada === ent.tipoEntrada?.idTipoEntrada);

      this.entradaForm.patchValue({
        ...ent,
        estadoEntrada: estadoCorrecto ?? null,
        tipoEntrada: tipoCorrecto ?? null,
      });

      // Rellenar categorías igual que antes
      const arr = this.entradaForm.get('categorias') as UntypedFormArray;
      if (ent.categorias && Array.isArray(ent.categorias)) {
        ent.categorias.forEach((cat: any) => arr.push(new UntypedFormControl(cat)));
      }

      // Por defecto en modo lectura
      this.entradaForm.disable();
      this.modoLectura = true;
    });

    // Activar dirty en cualquier cambio, incluidas categorías
    this.entradaForm.valueChanges.subscribe(() => {
      if (this.entradaForm.pristine) {
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
        'La página se ha actualizado correctamente.',
        'Página actualizada'
      );
      this.router.navigateByUrl('/admin/control/paginas');
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

  onCancelar() {
    this.router.navigateByUrl('/admin/control/paginas');
  }
}
