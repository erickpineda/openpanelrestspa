// crear-entrada.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EntradaFacadeService } from '../entrada-form/srv/entrada-facade.service';
import { ValidationEntradaFormsService } from '../entrada-form/srv/validation-entrada-forms.service';
import { Entrada } from '../../../../core/models/entrada.model';
import { TipoEntrada } from '../../../../core/models/tipo-entrada.model';
import { EstadoEntrada } from '../../../../core/models/estado-entrada.model';
import { Categoria } from '../../../../core/models/categoria.model';
import { UntypedFormGroup } from '@angular/forms';
import { LoggerService } from '../../../../core/services/logger.service';
import { ToastService } from '../../../../core/services/ui/toast.service';

@Component({
    selector: 'app-crear-entrada',
    templateUrl: './crear-entrada.component.html',
    styleUrls: ['./crear-entrada.component.scss'],
    standalone: false
})
export class CrearEntradaComponent implements OnInit {
  entradaForm : UntypedFormGroup;
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
        this.toastService.showInfo('Se ha creado la entrada correctamente', 'Entrada creada');
        // ✅ Solo navegar si es exitoso
        this.router.navigateByUrl('/admin/control/entradas');
      },
      error: (error) => {
        // ❌ Error - mostrar mensaje y mantener en formulario
        this.log.error('Error creando entrada:', error);
      }
    });
  }

  onPreviewEmit(payload: Partial<Entrada>) {
    this.entradaParaPrevia = { ...(this.entradaParaPrevia || {}), ...(payload as Entrada) } as Entrada;
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

  onCancelar() {
    this.router.navigateByUrl('/admin/control/entradas');
  }
}
