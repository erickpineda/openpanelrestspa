import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { delay } from 'rxjs';
import { Entrada } from '../../../core/models/entrada.model';
import { Usuario } from '../../../core/models/usuario.model';
import { EntradaService } from '../../../core/services/entrada.service';
import { LoadingService } from '../../../core/services/loading.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { CommonFunctionalityService } from 'src/app/shared/services/common-functionality.service';

@Component({
  selector: 'app-listado-entradas',
  templateUrl: './listado-entradas.component.html',
  styleUrls: ['./listado-entradas.component.scss']
})
export class ListadoEntradasComponent implements OnInit {
  entrada: Entrada = new Entrada();
  listaEntradas: Entrada[] = [];
  nombresCategoriasConComas: string = '';
  
  // Propiedades para la paginación
  page = 1;
  pageSize = 5;
  pagedEntradas: any[] = [];

  constructor(
    private commonFuncService: CommonFunctionalityService,
    private entradaService: EntradaService,
    private usuarioService: UsuarioService,
    public loader: LoadingService
  ) {
    
  }

  ngOnInit(): void {
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
    return fechaPublicacion ? this.commonFuncService.transformaFecha(fechaPublicacion, 'dd/MM/yyyy', false) : 'No publicada';
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
