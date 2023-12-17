import { DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Comentario } from "src/app/core/models/comentario.model";
import { Entrada } from "src/app/core/models/entrada.model";
import { Usuario } from "src/app/core/models/usuario.model";
import { ComentarioService } from "src/app/core/services/comentario.service";
import { EntradaService } from "src/app/core/services/entrada.service";
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import { UsuarioService } from "src/app/core/services/usuario.service";
import { CommonFunctionalityComponent } from "src/app/shared/components/funcionalidades-comunes/common-functionality.component";

@Component({
  selector: 'app-crear-editar-comentario',
  templateUrl: './crear-editar-comentario.component.html',
  styleUrls: ['./crear-editar-comentario.component.scss'],
})
export class CrearEditarComentario extends CommonFunctionalityComponent implements OnInit {
  comentarioForm!: UntypedFormGroup;
  comentario: Comentario = new Comentario();
  usuarioEnSesion: Usuario = new Usuario;
  usuarioQueCreaComentario: Usuario = new Usuario;
  entradaDelComentario: Entrada = new Entrada();
  submitted = false;

  constructor(
    protected override router: Router,
    protected override datePipe: DatePipe,
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    public entradaService: EntradaService,
    public comentarioService: ComentarioService,
    public usuarioService: UsuarioService,
    public tokenStorageService: TokenStorageService,
  ) {
    super(router, datePipe);
    this.createForm();

    new Promise<void>((resolve, _reject) => {
      resolve(this.obtenerDatos());
    });
  }

  override ngOnInit(): void {
  }

  private obtenerDatos() {
    if (this.getComentarioId('idComentario') != 'crear') {
      this.obtenerDatosComentario().then((com: Comentario) => {
        if (com) {
          this.comentario = com;
          //
          this.obtenerDatosUsuario(this.comentario.idUsuario).then((usu: Usuario) => {
            if (usu) {
              this.usuarioQueCreaComentario = usu;
              this.comentarioForm.get('username')?.setValue(this.usuarioQueCreaComentario.username);
              this.comentarioForm.get('email')?.setValue(this.usuarioQueCreaComentario.email);
            }
          });
          //
          this.obtenerDatosEntrada(this.comentario.idEntrada).then((ent: Entrada) => {
            if (ent) {
              this.entradaDelComentario = ent;
              this.comentarioForm.get('tituloEntrada')?.setValue(this.entradaDelComentario.titulo);
            }
          });
          this.comentarioForm.patchValue(com);
        }
      });
      this.comentarioForm.disable();
    }
  }

  private obtenerDatosComentario(): Promise<Comentario> {
    return new Promise((resolve, reject) => {
      this.comentarioService.obtenerPorId(this.getComentarioId('idComentario'))
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

  private obtenerDatosUsuario(idUsuario: number): Promise<Usuario> {
    return new Promise((resolve, reject) => {
      this.usuarioService.obtenerPorId(idUsuario).subscribe({
        next: data => {
          resolve(data);
        },
        error: err => {
          reject(err);
        }
      });
    })
  }

  private obtenerDatosEntrada(idEntrada: number): Promise<Entrada> {
    return new Promise((resolve, reject) => {
      this.entradaService.obtenerPorId(idEntrada)
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

  createForm() {
    this.comentarioForm = this.fb.group(
      {
        idComentario: null,
        idEntrada: null,
        idUsuario: null,
        username: null,
        tituloEntrada: null,
        email: null,
        aprobado: null,
        cuarentena: null,
        votos: null,
        fechaCreacion: null,
        fechaEdicion: null,
        contenido: null,
        contenidoCensurado: null,
      });
  }

  onValidate() {
    this.submitted = true;

    // stop here if form is invalid
    return this.comentarioForm.status === 'VALID';
  }

  get f() {
    return this.comentarioForm.controls;
  }

  guardar() {
    if (this.onValidate()) {
      var coment: Comentario = this.comentarioForm.value;
      if (this.getComentarioId('idComentario') != 'crear') {
        this.actualiza(coment);
      } else {
        this.crea(coment);
      }
    }
  }

  private crea(coment: Comentario) {
    coment.idUsuario = this.tokenStorageService.getUser().id;
    this.comentarioService.crear(coment).subscribe((data: Comentario)=> {
      if (data) {
        this.comentario = data;
        this.reloadComponent(false, '/admin/control/comentarios');
      }
    });
  }

  private actualiza(coment: Comentario) {
    this.comentarioService.actualizar(coment.idComentario, coment).subscribe((data: Comentario)=> {
      if (data) {
        this.comentario = data;
        this.reloadComponent(false, '/admin/control/comentarios');
      }
    });
  }

  onReset() {
    this.submitted = false;
  }

  getComentarioId(param: string) {
    return this.route.snapshot.params[param];
  }

  editarComentario() {
    this.comentarioForm.enable();
    this.comentarioForm.controls['contenidoCensurado'].disable();
  }

}