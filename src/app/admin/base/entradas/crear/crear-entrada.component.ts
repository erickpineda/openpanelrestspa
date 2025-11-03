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

@Component({
  selector: 'app-crear-entrada',
  templateUrl: './crear-entrada.component.html',
  styleUrls: ['./crear-entrada.component.scss'],
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
    private router: Router
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
    this.facade.crearEntrada(ent).subscribe(() => {
      this.router.navigateByUrl('/admin/control/entradas');
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
