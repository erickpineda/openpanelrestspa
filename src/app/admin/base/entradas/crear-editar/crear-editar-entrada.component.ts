import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Categoria } from '../../../../core/models/categoria.model';
import { Entrada } from '../../../../core/models/entrada.model';
import { EstadoEntrada } from '../../../../core/models/estado-entrada.model';
import { PerfilResponse } from '../../../../core/models/perfil-response.model';
import { TipoEntrada } from '../../../../core/models/tipo-entrada.model';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { EntradaService } from '../../../../core/services/entrada.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { ValidationEntradaFormsService } from '../../../../core/services/validation-entrada-forms.service';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { CommonFunctionalityService } from '../../../../shared/services/common-functionality.service';
import { OpenpanelApiResponse } from '../../../../core/models/openpanel-api-response.model';
import { Usuario } from '../../../../core/models/usuario.model';

@Component({
  selector: 'app-crear-editar-entrada',
  templateUrl: './crear-editar-entrada.component.html',
  styleUrls: ['./crear-editar-entrada.component.scss'],
  providers: [ValidationEntradaFormsService],
})
export class CrearEditarEntrada implements OnInit, AfterViewInit {
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
    private commonFuncService: CommonFunctionalityService,
    private route: ActivatedRoute,
    private fb: UntypedFormBuilder,
    public vf: ValidationEntradaFormsService,
    public entradaService: EntradaService,
    public categoriaService: CategoriaService,
    public usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
  ) {
    this.formErrors = this.vf.errorMessages;
    this.createForm();
    this.initializeData();
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.initializeEditor();
  }

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
        next: (response: OpenpanelApiResponse<any>) => {
          const lista: TipoEntrada[] = Array.isArray(response.data?.tiposEntradas) ? response.data?.tiposEntradas : [];
          resolve(lista);
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
        next: (response: OpenpanelApiResponse<any>) => {
          const lista: EstadoEntrada[] = Array.isArray(response.data?.estadosEntradas) ? response.data.estadosEntradas : [];
          resolve(lista);
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
        next: (response: OpenpanelApiResponse<any>) => {
          const categorias: Categoria[] = Array.isArray(response.data?.elements) ? response.data.elements : [];
          resolve(categorias);
        },
        error: (err) => {
          reject(err);
        }
      });
    });
  }  

  private obtenerDatosEntrada(): Promise<Entrada> {
    return new Promise((resolve, reject) => {
      this.entradaService.obtenerPorId(this.getEntradaId('idEntrada'))
        .subscribe({
          next: (response: OpenpanelApiResponse<any>) => {
            const entrada: Entrada = (response.data) ? response.data : Entrada;
            resolve(entrada);
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
        next: (response: OpenpanelApiResponse<any>) => {
          const usuario: Usuario = (response.data) ? response.data : Usuario;
          resolve(usuario);
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
      categorias: [Categoria, [Validators.required]],
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
    this.commonFuncService.reloadComponent(false, '/admin/control/entradas');
  }

  onValidate() {
    this.submitted = true;
    return this.entradaForm.status === 'VALID';
  }

  guardar() {
    if (this.onValidate()) {
        var ent: Entrada = this.entradaForm.value;
        ent.categorias = ent.categorias ? ent.categorias : [];
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
    this.entradaService.crear(ent).subscribe((response: OpenpanelApiResponse<any>) => {
      const entrada: Entrada = (response.data) ? response.data : Entrada;
      this.entrada = entrada;
      this.commonFuncService.reloadComponent(false, '/admin/control/entradas');
    });
  }

  private actualizaEntrada(ent: Entrada) {
    ent.idUsuarioEditado = this.usuarioEnSesion.idUsuario;
    this.entradaService.actualizar(ent.idEntrada, ent).subscribe((response: OpenpanelApiResponse<any>) => {
      const entrada: Entrada = (response.data) ? response.data : Entrada;
      this.entrada = entrada;
      this.commonFuncService.reloadComponent(false, '/admin/control/entradas');
    });
  }

  editarEntrada() {
    this.entradaForm.enable();
  }

  private initializeEditor() {
    ClassicEditor.defaultConfig = {
      licenseKey: 'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NDUwMjA3OTksImp0aSI6IjFjMzBkNTBiLTM4MTUtNGFlNS04YTA5LTQxNmQ1MDFhNGI1YyIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6IjYyMzUyNjg0In0.lnrFu_caAXepP6Q2VnZZM_kfUMmT_Lp7gFqAeZCWztxj2VXt4RiOAk5ALG-vpkaXe5oRLMZpc0Vpagapyi9ORg',
      //licenseKey: 'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NzUzNDcxOTksImp0aSI6ImJiZDc3ODU5LTUyZWItNDgyNS04MjExLTFmNzJhNGQ0YzExZCIsImxpY2Vuc2VkSG9zdHMiOlsiMTI3LjAuMC4xIiwibG9jYWxob3N0IiwiMTkyLjE2OC4qLioiLCIxMC4qLiouKiIsIjE3Mi4qLiouKiIsIioudGVzdCIsIioubG9jYWxob3N0IiwiKi5sb2NhbCJdLCJ1c2FnZUVuZHBvaW50IjoiaHR0cHM6Ly9wcm94eS1ldmVudC5ja2VkaXRvci5jb20iLCJkaXN0cmlidXRpb25DaGFubmVsIjpbImNsb3VkIiwiZHJ1cGFsIl0sImxpY2Vuc2VUeXBlIjoiZGV2ZWxvcG1lbnQiLCJmZWF0dXJlcyI6WyJEUlVQIl0sInZjIjoiODM1ZjhiY2UifQ.mPEoabXhIRdVjvwwmk6d6O5OFiwKj61M8tdD-amuoSMMMJEe05VyLeCGUKluwRHO_FuP08iHtw2020bA7VTytw',
      toolbar: {
        items: [
          'heading', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote',
          'imageUpload', 'insertTable', 'mediaEmbed', 'undo', 'redo'
          //'heading', 'bold', 'italic', 'link', 'undo', 'redo'
        ],
        shouldNotGroupWhenFull: true
      },
      image: {
        toolbar: [
          'imageStyle:full', 'imageStyle:side', 'imageTextAlternative'
        ]
      },
      table: {
        contentToolbar: [
          'tableColumn', 'tableRow', 'mergeTableCells'
        ]
      },
    };
  }  
  

}

