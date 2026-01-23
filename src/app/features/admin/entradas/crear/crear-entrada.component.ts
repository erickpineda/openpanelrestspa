import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormGroup } from '@angular/forms';
import { EntradaFacadeService } from '@features/admin/entradas/entrada-form/srv/entrada-facade.service';
import { ValidationEntradaFormsService } from '@features/admin/entradas/entrada-form/srv/validation-entrada-forms.service';
import { Entrada } from '@app/core/models/entrada.model';
import { TipoEntrada } from '@app/core/models/tipo-entrada.model';
import { EstadoEntrada } from '@app/core/models/estado-entrada.model';
import { Categoria } from '@app/core/models/categoria.model';
import { LoggerService } from '@app/core/services/logger.service';
import { ToastService } from '@app/core/services/ui/toast.service';

@Component({
  selector: 'app-crear-entrada',
  templateUrl: './crear-entrada.component.html',
  standalone: false,
})
export class CrearEntradaComponent implements OnInit {
  entradaForm: UntypedFormGroup;
  tiposEntr: TipoEntrada[] = [];
  estadosEntr: EstadoEntrada[] = [];
  categorias: Categoria[] = [];
  submitted = false;

  modalPreviaVisible = false;
  entradaParaPrevia?: Entrada;

  constructor(
    private vf: ValidationEntradaFormsService,
    private facade: EntradaFacadeService,
    private router: Router,
    private toastService: ToastService,
    private log: LoggerService
  ) {
    this.entradaForm = this.vf.buildForm();
  }

  async ngOnInit() {
    const data = await this.facade.loadInitData();
    this.tiposEntr = data.tipos;
    this.estadosEntr = data.estados;
    this.categorias = data.categorias;
    this.entradaForm.enable();
  }

  async onGuardar(ent: any) {
    this.submitted = true;
    if (this.entradaForm.invalid) return;

    const usuario = await this.facade.getUsuarioSesion();
    ent.idUsuario = usuario?.idUsuario ?? null;

    this.facade.crearEntrada(ent).subscribe({
      next: () => {
        this.toastService.showSuccess('Se ha creado la entrada correctamente', 'Entrada creada');
        this.router.navigateByUrl('/admin/control/entradas');
      },
      error: (error) => {
        this.log.error('Error creando entrada:', error);
        this.toastService.showError('Error al crear la entrada.', 'Error');
      },
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
