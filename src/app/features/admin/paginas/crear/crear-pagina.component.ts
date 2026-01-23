import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EntradaFacadeService } from '@features/admin/entradas/entrada-form/srv/entrada-facade.service';
import { ValidationEntradaFormsService } from '@features/admin/entradas/entrada-form/srv/validation-entrada-forms.service';
import { Entrada } from '../../../../core/models/entrada.model';
import { TipoEntrada } from '../../../../core/models/tipo-entrada.model';
import { EstadoEntrada } from '../../../../core/models/estado-entrada.model';
import { Categoria } from '../../../../core/models/categoria.model';
import { UntypedFormGroup } from '@angular/forms';
import { LoggerService } from '../../../../core/services/logger.service';
import { ToastService } from '../../../../core/services/ui/toast.service';

@Component({
  selector: 'app-crear-pagina',
  templateUrl: './crear-pagina.component.html',
  styleUrls: ['./crear-pagina.component.scss'],
  standalone: false,
})
export class CrearPaginaComponent implements OnInit {
  entradaForm: UntypedFormGroup;
  tiposEntr: TipoEntrada[] = [];
  estadosEntr: EstadoEntrada[] = [];
  categorias: Categoria[] = [];
  submitted = false;

  // Preview state
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
    this.estadosEntr = data.estados;
    this.categorias = data.categorias;

    // Filtrar solo el tipo 'Página'
    const tipoPagina = data.tipos.find((t) => t.nombre === 'Página');
    if (tipoPagina) {
      this.tiposEntr = [tipoPagina];
      this.entradaForm.get('tipoEntrada')?.setValue(tipoPagina);
    } else {
      // Fallback si no existe 'Página', mostramos todos? O error?
      // Mostramos todos por seguridad pero logueamos
      this.log.error('No se encontró el tipo de entrada "Página"');
      this.tiposEntr = data.tipos;
    }

    this.entradaForm.enable();
  }

  async onGuardar(ent: any) {
    this.submitted = true;
    if (this.entradaForm.invalid) return;

    const usuario = await this.facade.getUsuarioSesion();
    ent.idUsuario = usuario?.idUsuario ?? null;

    // Asegurar que el tipo es Página si no lo seleccionó (aunque debería estar seleccionado)
    if (!ent.tipoEntrada && this.tiposEntr.length === 1) {
      ent.tipoEntrada = this.tiposEntr[0];
    }

    this.facade.crearEntrada(ent).subscribe({
      next: () => {
        this.toastService.showInfo('Se ha creado la página correctamente', 'Página creada');
        this.router.navigateByUrl('/admin/control/paginas');
      },
      error: (error) => {
        this.log.error('Error creando página:', error);
        this.toastService.showError('Error al crear la página.', 'Error');
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

  onCancelar() {
    this.router.navigateByUrl('/admin/control/paginas');
  }
}
