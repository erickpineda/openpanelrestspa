import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ValidationEntradaFormsService } from 'src/app/core/services/validation-entrada-forms.service';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { EntradaService } from 'src/app/core/services/entrada.service';
import { Entrada } from 'src/app/core/models/entrada.model';
import { Categoria } from 'src/app/core/models/categoria.model';
import { TipoEntrada } from 'src/app/core/models/tipo-entrada.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriaService } from 'src/app/core/services/categoria.service';
import { EstadoEntrada } from 'src/app/core/models/estado-entrada.model';
import { CommonFunctionalityComponent } from 'src/app/shared/components/funcionalidades-comunes/common-functionality.component';
import { UsuarioService } from 'src/app/core/services/usuario.service';
import { DatePipe } from '@angular/common';
import { PerfilResponse } from 'src/app/core/models/perfil-response.model';

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
  usuarioEnSesion: PerfilResponse = new PerfilResponse;

  constructor(
    protected override router: Router,
    private route: ActivatedRoute,
    private fb: UntypedFormBuilder,
    public vf: ValidationEntradaFormsService,
    public entradaService: EntradaService,
    public categoriaService: CategoriaService,
    public usuarioService: UsuarioService,
    protected override datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
  ) {
    super(router, datePipe);
    this.formErrors = this.vf.errorMessages;
    this.createForm();
    this.initializeData();
  }

  override ngOnInit(): void { }

  private async initializeData() {
    await this.obtenerDatos();
    if (!this.isCreatingNewEntry()) {
      const ent = await this.obtenerDatosEntrada();
      if (ent) {
        this.entrada = ent;
        this.entradaForm.patchValue(ent);
        this.entradaForm.disable();
      }
    } else {
      this.entradaForm.enable();
    }
  }

  private async obtenerDatos() {
    try {
      this.tiposEntr = await this.obtenerDatosTipoEntrada();
      this.estadosEntr = await this.obtenerDatosEstadosEntrada();
      this.categorias = await this.obtenerDatosCategorias();
      this.usuarioEnSesion = await this.obtenerDatosUsuarioActual();
    } catch (error) {
      console.error('Error al obtener datos:', error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  private obtenerDatosTipoEntrada(): Promise<TipoEntrada[]> {
    return new Promise((resolve, reject) => {
      this.entradaService.listarTiposEntradas().subscribe({
        next: data => {
          resolve(data.tiposEntradas);
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
          resolve(data.estadosEntradas);
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
          resolve(data.data);
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

  private obtenerDatosUsuarioActual(): Promise<PerfilResponse> {
    return new Promise((resolve, reject) => {
      this.usuarioService.obtenerDatosSesionActual().subscribe({
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
    this.entradaForm = this.fb.group({
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
    });
  }

  get f() {
    return this.entradaForm.controls;
  }

  getEntradaId(param: string) {
    return this.route.snapshot.params[param];
  }

  inputCheckedCategorias(categ: Categoria, categoriasEntrada: Categoria[]) {
    return categoriasEntrada.some(el => el.nombre === categ.nombre);
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
    return this.entradaForm.status === 'VALID';
  }

  guardar() {
    if (this.onValidate()) {
        var ent: Entrada = this.entradaForm.value;
        if (this.isCreatingNewEntry()) {
            this.creaEntrada(ent);
        } else {
            this.actualizaEntrada(ent);
        }
    }
  }

  private isCreatingNewEntry(): boolean {
      return this.getEntradaId('idEntrada') === 'crear';
  }

  private creaEntrada(ent: Entrada) {
    ent.idUsuario = this.usuarioEnSesion.idUsuario;
    this.entradaService.crear(ent).subscribe((data: Entrada) => {
      if (data) {
        this.entrada = data;
        this.reloadComponent(false, '/admin/control/entradas');
      }
    });
  }

  private actualizaEntrada(ent: Entrada) {
    ent.idUsuarioEditado = this.usuarioEnSesion.idUsuario;
    this.entradaService.actualizar(ent.idEntrada, ent).subscribe((data: Entrada) => {
      if (data) {
        this.entrada = data;
        this.reloadComponent(false, '/admin/control/entradas');
      }
    });
  }

  editarEntrada() {
    this.entradaForm.enable();
  }
}

