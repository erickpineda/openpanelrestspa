import { Component, OnInit } from '@angular/core';

import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ValidationEntradaFormsService } from 'src/app/core/services/validation-entrada-forms.service';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { EntradaService } from 'src/app/core/services/entrada.service';
import { Entrada } from 'src/app/core/models/entrada.model';
import { Usuario } from 'src/app/core/models/usuario.model';
import { Categoria } from 'src/app/core/models/categoria.model';
import { Etiqueta } from 'src/app/core/models/etiqueta.model';
import { TipoEntrada } from 'src/app/core/models/tipo-entrada.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriaService } from 'src/app/core/services/categoria.service';
import { EstadoEntrada } from 'src/app/core/models/estado-entrada.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-ver-editar-entrada',
  templateUrl: './ver-editar-entrada.component.html',
  styleUrls: ['./ver-editar-entrada.component.scss'],
  providers: [ValidationEntradaFormsService],
})
export class VerEditarEntrada implements OnInit {
  public Editor = ClassicEditor;
  entradaForm!: UntypedFormGroup;
  submitted = false;
  formErrors: any;
  entradaId: any;
  entrada: Entrada = new Entrada;
  tiposEntr: TipoEntrada[] = [];
  estadosEntr: EstadoEntrada[] = [];
  categorias: Categoria[] = [];
  modoLectura: boolean = true;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: UntypedFormBuilder,
    public vf: ValidationEntradaFormsService,
    public entradaService: EntradaService,
    public categoriaService: CategoriaService) {

    this.formErrors = this.vf.errorMessages;
    this.createForm();
    this.obtenerDatos();
  }

  ngOnInit(): void {
    this.entradaId = this.getEntradaId('id');
    if (this.entradaId != 'crear') {
      this.obtenerDatosEntrada();
      this.entradaForm.disable();
    }
  }

  obtenerDatos() {
    this.obtenerDatosTipoEntrada();
    this.obtenerDatosEstadosEntrada();
    this.obtenerDatosCategorias();
  }

  obtenerDatosTipoEntrada(): TipoEntrada[] {
    this.entradaService.listarTiposEntradas()
      .subscribe((res: TipoEntrada[]) => {
        this.tiposEntr = res;
      });

      return this.tiposEntr ;
  }

  obtenerDatosEstadosEntrada(): EstadoEntrada[] {
    this.entradaService.listarEstadosEntradas()
      .subscribe((res: EstadoEntrada[]) => {
        this.estadosEntr = res;
      });

      return this.estadosEntr ;
  }

  obtenerDatosCategorias(): Categoria[] {
    this.categoriaService.listar()
      .subscribe((res: Categoria[]) => {
        this.categorias = res;
      });

      return this.categorias ;
  }

  obtenerDatosEntrada() {
    this.entradaService.obtenerPorId(this.entradaId)
      .subscribe((res: Entrada) => {
        if (res.id) {
          this.entrada = res;
          console.log(this.entrada);
          this.entradaForm.patchValue(res);
          console.log(this.entradaForm.value)
        }
      });
  }

  createForm() {
    this.entradaForm = this.fb.group(
      {
        id: null,
        titulo: ['', [Validators.required,
          Validators.minLength(this.vf.formRules.tituloMin),
          Validators.maxLength(this.vf.formRules.tituloMax),
        ]],
        contenido: ['', [Validators.required,
          Validators.minLength(this.vf.formRules.contenidoMin),
        ]],
        subtitulo: null,
        tipoEntradaForm: [TipoEntrada, [Validators.required]],
        resumen: null,
        fechaPublicacion: Date.now,
        fechaEdicion: null,
        borrador: true,
        publicada: false,
        password: null,
        privado: false,
        estadoEntradaForm: [EstadoEntrada, [Validators.required]],
        permitirComentario: true,
        imagenDestacada: null,
        votos: 0,
        cantidadComentarios: 0,
        usuario: new Usuario(),
        usuarioEditado: null,
        categoriasFormList: [],
        etiquetas: [],
      },
    );
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.entradaForm.controls;
  }

  getEntradaId(param: string) {
    return this.route.snapshot.params[param];
  }

  inputCheckedCategorias(categ: Categoria, categoriasEntrada: Categoria[]) {
    return categoriasEntrada.find(function (el) { return el.nombre === categ.nombre }) !== undefined;
  }

  resetForm(form: UntypedFormGroup) {
		form.reset();
	}

  desactivarCampos() {
    this.entradaForm.controls['subtitulo'].disable();
  }

  onReset() {
    this.modoLectura = false;
    this.submitted = false;
    this.resetForm(this.entradaForm);
    this.obtenerDatos();
    alert('¡Se borraran los datos!');
    this.router.navigate(['/admin/control/entradas']);
  }

  onValidate() {
    this.submitted = true;

    // stop here if form is invalid
    return this.entradaForm.status === 'VALID';
  }

  onSubmit() {
    console.warn(this.onValidate(), this.entradaForm.value);

    if (this.onValidate()) {
      // TODO: Submit form value
      console.warn(this.entradaForm.value);
      let entrada = JSON.stringify(this.entradaForm.value);
      var ent: Entrada = this.entradaForm.value;
      console.log(ent.id);
      if (this.entradaId != 'crear') {
        this.entradaService.actualizar(ent.id, ent);
      } else {
        this.entradaService.crear(ent);
      }

      alert('SUCCESS!');
    }
  }

  guardar() {
    
  }

  editarEntrada() {
    this.entradaForm.enable();
  }

}