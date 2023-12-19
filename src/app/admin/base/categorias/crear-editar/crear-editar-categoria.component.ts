import { DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Categoria } from "src/app/core/models/categoria.model";
import { Entrada } from "src/app/core/models/entrada.model";
import { Usuario } from "src/app/core/models/usuario.model";
import { CategoriaService } from "src/app/core/services/categoria.service";
import { EntradaService } from "src/app/core/services/entrada.service";
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import { UsuarioService } from "src/app/core/services/usuario.service";
import { CommonFunctionalityComponent } from "src/app/shared/components/funcionalidades-comunes/common-functionality.component";

@Component({
  selector: 'app-crear-editar-categoria',
  templateUrl: './crear-editar-categoria.component.html',
  styleUrls: ['./crear-editar-categoria.component.scss'],
})
export class CrearEditarCategoria extends CommonFunctionalityComponent implements OnInit {
  categoriaForm!: UntypedFormGroup;
  usuarioEnSesion: Usuario = new Usuario;
  submitted = false;

  constructor(
    protected override router: Router,
    protected override datePipe: DatePipe,
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    public tokenStorageService: TokenStorageService,
    private categoriaService: CategoriaService,
    public usuarioService: UsuarioService,
    private entradaService: EntradaService
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
    if (this.getCategoriaId('idCategoria') != 'crear') {
      this.obtenerDatosCategoria().then((cat: Categoria) => {
        if (cat) {
          //
          this.obtenerDatosUsuarioActual().then((usu: Usuario) => {
            if (usu) {
              this.usuarioEnSesion = usu;
            }
          });
          this.obtenerDatosEntrada(1).then((ent: Entrada) => {
            if (ent) {
              
            }
          });
          this.categoriaForm.patchValue(cat);
        }
      });
      this.categoriaForm.disable();
    }
  }

  private obtenerDatosCategoria(): Promise<Categoria> {
    return new Promise((resolve, reject) => {
      this.categoriaService.obtenerPorId(this.getCategoriaId('idCategoria'))
        .subscribe({
          next: (data: Categoria | PromiseLike<Categoria>) => {
            resolve(data);
          },
          error: (err: any) => {
            reject(err);
          }
        });
    })
  }

  private obtenerDatosUsuarioActual(): Promise<Usuario> {
    return new Promise((resolve, reject) => {
      const currentUser = this.tokenStorageService.getUser();
      this.usuarioService.obtenerPorId(currentUser.id).subscribe({
        next: (data: Usuario | PromiseLike<Usuario>) => {
          resolve(data);
        },
        error: (err: any) => {
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
    this.categoriaForm = this.fb.group(
      {
        idCategoria: null,
        nombre: null,
        descripcion: null,
        cantidadEntradas: 0
      });
  }

  onValidate() {
    this.submitted = true;

    // stop here if form is invalid
    return this.categoriaForm.status === 'VALID';
  }

  get f() {
    return this.categoriaForm.controls;
  }

  guardar() {
    if (this.onValidate()) {
      var categoria: Categoria = this.categoriaForm.value;
      if (this.getCategoriaId('idCategoria') != 'crear') {
        this.actualiza(categoria);
      } else {
        this.crea(categoria);
      }
    }
  }

  private crea(cat: Categoria) {
    this.categoriaService.crear(cat).subscribe((data: Categoria)=> {
      if (data) {
        this.reloadComponent(false, '/admin/control/categorias');
      }
    });
  }

  private actualiza(cat: Categoria) {
    this.categoriaService.actualizar(cat.idCategoria, cat).subscribe((data: Categoria)=> {
      if (data) {
        this.reloadComponent(false, '/admin/control/categorias');
      }
    });
  }

  onReset() {
    this.submitted = false;
  }

  getCategoriaId(param: string) {
    return this.route.snapshot.params[param];
  }

  editarCategoria() {
    this.categoriaForm.enable();
  }

}