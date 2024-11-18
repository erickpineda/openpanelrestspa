import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { delay } from 'rxjs';
import { Entrada } from 'src/app/core/models/entrada.model';
import { Usuario } from 'src/app/core/models/usuario.model';
import { EntradaService } from 'src/app/core/services/entrada.service';
import { LoadingService } from 'src/app/core/services/loading.service';
import { UsuarioService } from 'src/app/core/services/usuario.service';
import { CommonFunctionalityComponent } from 'src/app/shared/components/funcionalidades-comunes/common-functionality.component';

@Component({
  selector: 'app-listado-entradas',
  templateUrl: './listado-entradas.component.html',
  styleUrls: ['./listado-entradas.component.scss']
})
export class ListadoEntradasComponent extends CommonFunctionalityComponent implements OnInit {
  entrada: Entrada = new Entrada();
  listaEntradas: Entrada[] = [];
  nombresCategoriasConComas: string = '';
  
  // Propiedades para la paginación
  page = 1;
  pageSize = 5;
  pagedEntradas: any[] = [];

  constructor(
    protected override router: Router,
    private entradaService: EntradaService,
    private usuarioService: UsuarioService,
    protected override datePipe: DatePipe,
    public loader: LoadingService
  ) {
    super(router, datePipe);
    
  }

  override ngOnInit(): void {
    this.obtenerListaEntradas().then((listaRes: Entrada[]) => {
      listaRes.forEach((entradaRes) => {
        entradaRes.categoriasConComas = entradaRes.categorias.map(e => e.nombre).join(', ');

        this.obtenerDatosUsuario(entradaRes.idUsuario).then((usu: Usuario) => {
          if (usu) {
            entradaRes.username = usu.username;
          }
        });
      });
      this.refreshEntradas();
    });
  }

  private obtenerListaEntradas(): Promise<Entrada[]> {
    return new Promise((resolve, reject) => {
      this.entradaService.listar().subscribe({
        next: data => {
          this.listaEntradas = data.data;
          resolve(this.listaEntradas);
        },
        error: err => {
          if (err && err.status == 404 && err.error && err.error.message) {
            this.listaEntradas = [];
          }
          reject(err);
        }
      });
    });
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
    });
  }

  public checkFechaPublicacion(fechaPublicacion: Date): string {
    return fechaPublicacion ? this.transformaFecha(fechaPublicacion, 'dd/MM/yyyy', false) : 'No publicada';
  }

  crearEntrada() {}

  actualizarEntrada(id: number) {}

  borrarEntrada(id: number) {}

  public refrescarPagina(): void {
    window.location.reload();
  }

  // Métodos para la paginación
  refreshEntradas() {
    this.pagedEntradas = this.listaEntradas.slice(
      (this.page - 1) * this.pageSize,
      (this.page - 1) * this.pageSize + this.pageSize
    );
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.numberOfPages) return;
    this.page = page;
    this.refreshEntradas();
  }

  get numberOfPages(): number {
    return Math.ceil(this.listaEntradas.length / this.pageSize);
  }

  getPages(): number[] {
    return Array.from({ length: this.numberOfPages }, (v, k) => k + 1);
  }
}
