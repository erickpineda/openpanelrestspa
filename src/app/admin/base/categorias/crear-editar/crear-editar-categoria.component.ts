import { DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Categoria } from "../../../../core/models/categoria.model";
import { Entrada } from "../../../../core/models/entrada.model";
import { PerfilResponse } from "../../../../core/models/perfil-response.model";
import { CategoriaService } from "../../../../core/services/data/categoria.service";
import { EntradaService } from "../../../../core/services/data/entrada.service";
import { TokenStorageService } from "../../../../core/services/auth/token-storage.service";
import { UsuarioService } from "../../../../core/services/data/usuario.service";
import { OpenpanelApiResponse } from "../../../../core/models/openpanel-api-response.model";
import { CommonFunctionalityService } from "../../../../shared/services/common-functionality.service";

@Component({
  selector: 'app-crear-editar-categoria',
  templateUrl: './crear-editar-categoria.component.html',
  styleUrls: ['./crear-editar-categoria.component.scss'],
})
export class CrearEditarCategoria implements OnInit {
  categoriaForm!: FormGroup;
  usuarioEnSesion: PerfilResponse = new PerfilResponse();
  submitted = false;
  listaCategorias: Categoria[] = [];

  constructor(
    private commonFuncService: CommonFunctionalityService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public tokenStorageService: TokenStorageService,
    private categoriaService: CategoriaService,
    public usuarioService: UsuarioService,
    private entradaService: EntradaService
  ) {
    
    this.createForm();
  }

  ngOnInit(): void {
    this.obtenerDatos();
  }

  private async obtenerDatos() {
    this.listaCategorias = await this.obtenerListaCategorias();
    if (this.getCategoriaId('idCategoria') !== 'crear') {
      try {
        const cat = await this.obtenerDatosCategoria();
        if (cat) {
          this.usuarioEnSesion = (await this.obtenerDatosUsuarioActual()) ?? new PerfilResponse();
          await this.obtenerDatosEntrada(1);
          this.categoriaForm.patchValue(cat);
          this.categoriaForm.disable();
        }
      } catch (error) {
        console.error("Error al obtener datos", error);
      }
    }
  }

  private obtenerDatosCategoria(): Promise<Categoria> {
    return new Promise((resolve, reject) => {
      this.categoriaService.obtenerPorId(this.getCategoriaId('idCategoria')).subscribe({
        next: (response: OpenpanelApiResponse<any>) => {
          const categoria: Categoria = (response.data) ? response.data : Categoria;
          resolve(categoria)
        },
        error: (err: any) => reject(err)
      });
    });
  }

  private obtenerListaCategorias(): Promise<Categoria[]> {
    return new Promise((resolve, reject) => {
      this.categoriaService.listar().subscribe({
        next: (response: OpenpanelApiResponse<any>) => {
          const categorias: Categoria[] = Array.isArray(response.data?.elements) ? response.data.elements : [];
          resolve(categorias)
        },
        error: (err) => {
          reject(err);
        }
      });
    });
  }

  private obtenerDatosUsuarioActual(): Promise<PerfilResponse> {
    return new Promise((resolve, reject) => {
      this.usuarioService.obtenerDatosSesionActual().subscribe({
        next: (response: OpenpanelApiResponse<any>) => {
          const perfil: PerfilResponse = (response.data) ? response.data : PerfilResponse;
          resolve(perfil);
        },
        error: err => {
          reject(err);
        }
      });
    })
  }

  private obtenerDatosEntrada(idEntrada: number): Promise<Entrada> {
    return new Promise((resolve, reject) => {
      this.entradaService.obtenerPorId(idEntrada).subscribe({
        next: (response: OpenpanelApiResponse<any>) => {
          const entrada: Entrada = (response.data) ? response.data : Entrada;
          resolve(entrada)
        },
        error: (err: any) => reject(err)
      });
    });
  }

  createForm() {
    this.categoriaForm = this.fb.group({
      idCategoria: [null],
      nombre: [null, Validators.required],
      descripcion: [null],
      cantidadEntradas: [0]
    });
  }

  onValidate() {
    this.submitted = true;
    return this.categoriaForm.valid;
  }

  get f() {
    return this.categoriaForm.controls;
  }

  guardar() {
    if (this.onValidate()) {
      const categoria: Categoria = this.categoriaForm.value;
      if (this.getCategoriaId('idCategoria') !== 'crear') {
        this.actualiza(categoria);
      } else {
        this.crea(categoria);
      }
    }
  }

  private crea(cat: Categoria) {
    this.categoriaService.crear(cat).subscribe(() => {
      this.commonFuncService.reloadComponent(false, '/admin/control/categorias');
    });
  }

  private actualiza(cat: Categoria) {
    this.categoriaService.actualizar(cat.idCategoria, cat).subscribe(() => {
      this.commonFuncService.reloadComponent(false, '/admin/control/categorias');
    });
  }

  onReset() {
    this.submitted = false;
    this.categoriaForm.reset();
  }

  getCategoriaId(param: string) {
    return this.route.snapshot.params[param];
  }

  editarCategoria() {
    this.categoriaForm.enable();
  }
}