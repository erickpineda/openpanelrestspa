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
import { CommonFunctionalityComponent } from 'src/app/shared/components/funcionalidades-comunes/common-functionality.component';
import { UsuarioService } from 'src/app/core/services/usuario.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-crear-editar-entrada',
  templateUrl: './crear-editar-entrada.component.html',
  styleUrls: ['./crear-editar-entrada.component.scss'],
  providers: [ValidationEntradaFormsService],
})
export class CrearEditarEntrada extends CommonFunctionalityComponent implements OnInit {
  public Editor = ClassicEditor;
  entradaForm!: UntypedFormGroup;
  submitted = false;
  formErrors: any;
  entrada: Entrada = new Entrada;
  tiposEntr: TipoEntrada[] = [];
  estadosEntr: EstadoEntrada[] = [];
  categorias: Categoria[] = [];
  modoLectura: boolean = true;
  usuarioEnSesion: Usuario = new Usuario;

  constructor(
    protected override router: Router,
    private route: ActivatedRoute,
    private fb: UntypedFormBuilder,
    public vf: ValidationEntradaFormsService,
    public entradaService: EntradaService,
    public categoriaService: CategoriaService,
    public usuarioService: UsuarioService,
    public tokenStorageService: TokenStorageService,
    protected override datePipe: DatePipe
  ) {
    super(router, datePipe);
    this.formErrors = this.vf.errorMessages;
    this.createForm();

    new Promise<void>((resolve, _reject) => {
      this.obtenerDatos();
      if (this.getEntradaId('idEntrada') != 'crear') {
        this.obtenerDatosEntrada().then((ent: Entrada) => {
          if (ent) {
            this.entrada = ent;
            this.entradaForm.patchValue(ent);
          }
        });
        this.entradaForm.disable();
      }
      resolve();
    });
  }

  override ngOnInit(): void {
  }

  private obtenerDatos() {
    this.obtenerDatosTipoEntrada().then((listTipEnt: TipoEntrada[]) => {
      if (listTipEnt) {
        this.tiposEntr = listTipEnt;
      }
    });
    this.obtenerDatosEstadosEntrada().then((listEstEnt: EstadoEntrada[]) => {
      if (listEstEnt) {
        this.estadosEntr = listEstEnt;
      }
    });
    this.obtenerDatosCategorias().then((listCate: Categoria[]) => {
      if (listCate) {
        this.categorias = listCate;
      }
    });
    this.obtenerDatosUsuarioActual().then((usu: Usuario) => {
      if (usu) {
        this.usuarioEnSesion = usu;
      }
    });
  }

  private obtenerDatosTipoEntrada(): Promise<TipoEntrada[]> {
    return new Promise((resolve, reject) => {
      this.entradaService.listarTiposEntradas().subscribe({
        next: data => {
          resolve(data);
        },
        error: err => {
          reject(err);
        }
      });
    })
  }

  private obtenerDatosEstadosEntrada(): Promise<EstadoEntrada[]> {
    return new Promise((resolve, reject) => {
      this.entradaService.listarEstadosEntradas().subscribe({
        next: data => {
          resolve(data);
        },
        error: err => {
          reject(err);
        }
      });
    })
  }

  private obtenerDatosCategorias(): Promise<Categoria[]> {
    return new Promise((resolve, reject) => {
      this.categoriaService.listar().subscribe({
        next: data => {
          resolve(data);
        },
        error: err => {
          reject(err);
        }
      });
    })
  }

  private obtenerDatosEntrada(): Promise<Entrada> {
    return new Promise((resolve, reject) => {
      this.entradaService.obtenerPorId(this.getEntradaId('idEntrada'))
        .subscribe({
          next: data => {
            resolve(data);
          },
          error: err => {
            reject(err);
          }
        });
    })
  }

  private obtenerDatosUsuarioActual(): Promise<Usuario> {
    return new Promise((resolve, reject) => {
      const currentUser = this.tokenStorageService.getUser();
      this.usuarioService.obtenerPorId(currentUser.id).subscribe({
        next: data => {
          resolve(data);
        },
        error: err => {
          reject(err);
        }
      });
    })
  }

  createForm() {
    this.entradaForm = this.fb.group(
      {
        idEntrada: null,
        idUsuario: null,
        idUsuarioEditado: null,
        titulo: ['', [
          Validators.required,
          Validators.minLength(this.vf.formRules.tituloMin),
          Validators.maxLength(this.vf.formRules.tituloMax)]],
        subtitulo: ['', [
          Validators.maxLength(this.vf.formRules.subtituloMax)]],
        contenido: ['', [
          Validators.required,
          Validators.minLength(this.vf.formRules.contenidoMin),
        ]],
        notas: null,
        tipoEntrada: [TipoEntrada, [Validators.required]],
        resumen: null,
        fechaPublicacion: null,
        fechaEdicion: null,
        borrador: true,
        publicada: false,
        password: null,
        privado: false,
        estadoEntrada: [EstadoEntrada, [Validators.required]],
        fechaPublicacionProgramada: Date,
        permitirComentario: true,
        imagenDestacada: null,
        votos: 0,
        cantidadComentarios: 0,

        categorias: [],
        categoriasConComas: [''],
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
    this.reloadComponent(false, '/admin/control/entradas');
  }

  onValidate() {
    this.submitted = true;

    // stop here if form is invalid
    return this.entradaForm.status === 'VALID';
  }

  guardar() {
    if (this.onValidate()) {
      // TODO: Submit form value
      console.warn(this.entradaForm.value);
      var ent: Entrada = this.entradaForm.value;
      if (this.getEntradaId('idEntrada') != 'crear') {
        this.actualizaEntrada(ent);
      } else {
        this.creaEntrada(ent);
      }
    }
  }

  private creaEntrada(ent: Entrada) {
    ent.idUsuario = this.usuarioEnSesion.idUsuario;
    this.entradaService.crear(ent).subscribe((data: Entrada) => {
      if (data) {
        this.entrada = data;
        this.reloadComponent(false, '/admin/control/entradas');
      }
    })
  }

  private actualizaEntrada(ent: Entrada) {
    ent.idUsuarioEditado = this.usuarioEnSesion.idUsuario;
    //ent.fechaEdicion = new Date(this.transformaFecha(new Date(), 'dd-MM-yyyy hh:mm:ss', true));
    this.entradaService.actualizar(ent.idEntrada, ent).subscribe((data: Entrada) => {
      if (data) {
        this.entrada = data;
        this.reloadComponent(false, '/admin/control/entradas');
      }
    })
  }

  editarEntrada() {
    this.entradaForm.enable();
  }

}