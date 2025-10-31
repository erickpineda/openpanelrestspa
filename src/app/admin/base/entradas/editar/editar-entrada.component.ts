// editar-entrada.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntradaFacadeService } from '../entrada-form/entrada-facade.service';
import { ValidationEntradaFormsService } from '../entrada-form/validation-entrada-forms.service';
import { UntypedFormArray, UntypedFormControl } from '@angular/forms';

@Component({
  selector: 'app-editar-entrada',
  template: `
    <app-entrada-form
      [form]="entradaForm"
      [tiposEntr]="tiposEntr"
      [estadosEntr]="estadosEntr"
      [categorias]="categorias"
      [entrada]="entrada"
      [modoLectura]="modoLectura"
      [submitted]="submitted"
      (submitForm)="onGuardar($event)"
      (editar)="onEditar()"
      (cancelar)="onCancelar()"
    ></app-entrada-form>
  `
})
export class EditarEntradaComponent implements OnInit {
  entradaForm : any;
  tiposEntr: any[] = [];
  estadosEntr: any[] = [];
  categorias: any[] = [];
  entrada: any = null;
  modoLectura = true;
  submitted = false;
  idEntrada!: number;

  constructor(
    private route: ActivatedRoute,
    private vf: ValidationEntradaFormsService,
    private facade: EntradaFacadeService,
    private router: Router
  ) {
    this.entradaForm = this.vf.buildForm();
  }

  async ngOnInit() {
    this.idEntrada = this.route.snapshot.params['idEntrada'];
    const data = await this.facade.loadInitData();
    this.tiposEntr = data.tipos;
    this.estadosEntr = data.estados;
    this.categorias = data.categorias;

    // Cargar entrada
    this.facade.cargarEntradaPorId(this.idEntrada).subscribe((ent: any) => {
      if (!ent) return;
      this.entrada = ent;
      // Populate form values
      this.entradaForm.patchValue(ent);

      // Rellenar FormArray de categorías (si hay)
      const arr = this.entradaForm.get('categorias') as UntypedFormArray;
      if (ent.categorias && Array.isArray(ent.categorias)) {
        ent.categorias.forEach((cat: any) => arr.push(new UntypedFormControl(cat)));
      }

      // Por defecto en modo lectura
      this.entradaForm.disable();
      this.modoLectura = true;
    });
  }

  onEditar() {
    this.modoLectura = false;
    this.entradaForm.enable();
  }

  async onGuardar(ent: any) {
    this.submitted = true;
    if (this.entradaForm.invalid) return;
    const usuario = await this.facade.getUsuarioSesion();
    ent.idUsuarioEditado = usuario?.idUsuario ?? null;
    this.facade.actualizarEntrada(this.idEntrada, ent).subscribe(() => {
      this.router.navigateByUrl('/admin/control/entradas');
    });
  }

  onCancelar() {
    this.router.navigateByUrl('/admin/control/entradas');
  }
}
