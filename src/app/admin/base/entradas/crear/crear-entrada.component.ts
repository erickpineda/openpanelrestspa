// crear-entrada.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EntradaFacadeService } from '../entrada-form/entrada-facade.service';
import { ValidationEntradaFormsService } from '../entrada-form/validation-entrada-forms.service';

@Component({
  selector: 'app-crear-entrada',
  template: `
    <app-entrada-form
      [form]="entradaForm"
      [tiposEntr]="tiposEntr"
      [estadosEntr]="estadosEntr"
      [categorias]="categorias"
      [submitted]="submitted"
      (submitForm)="onGuardar($event)"
      (cancelar)="onCancelar()"
    ></app-entrada-form>
  `
})
export class CrearEntradaComponent implements OnInit {
  entradaForm : any;
  tiposEntr: any[] = [];
  estadosEntr: any[] = [];
  categorias: any[] = [];
  submitted = false;

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

  onCancelar() {
    this.router.navigateByUrl('/admin/control/entradas');
  }
}
