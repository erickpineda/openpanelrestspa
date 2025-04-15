import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Entrada } from '../../../core/models/entrada.model';
import { Usuario } from '../../../core/models/usuario.model';
import { EntradaService } from '../../../core/services/entrada.service';
import { LoadingService } from '../../../core/services/loading.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { CommonFunctionalityService } from '../../../shared/services/common-functionality.service';
import { OpenpanelApiResponse } from '../../../core/models/openpanel-api-response.model';

@Component({
  selector: 'app-listado-entradas',
  templateUrl: './listado-entradas.component.html',
  styleUrls: ['./listado-entradas.component.scss']
})
export class ListadoEntradasComponent implements OnInit {
  entrada: Entrada = new Entrada();
  listaEntradas: Entrada[] = [];

  totalPages: number = 0;
  currentPage: number = 0;
  pageSize: number = 20;

  constructor(
    public commonFuncService: CommonFunctionalityService,
    private entradaService: EntradaService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.obtenerListaEntradas(this.currentPage);
  }

  obtenerListaEntradas(page: number): void {
    this.currentPage = page;
    this.entradaService.listarPagina(page, this.pageSize).subscribe({
      next: async (response: OpenpanelApiResponse<any>) => {
        
        // Obtener los elementos y total de páginas
        this.listaEntradas = response.data.elements || [];
        this.totalPages = response.data.totalPages;
  
        // Manejamos los valores asincrónicos de manera correcta usando Promise.all
        this.listaEntradas = await Promise.all(
          this.listaEntradas.map(async entrada => {
            const usuario = await this.obtenerDatosUsuario(entrada.idUsuario);
            return {
              ...entrada,
              categoriasConComas: entrada.categorias.map(e => e.nombre).join(', '),
              username: usuario.username
            };
          })
        );
  
      },
      error: err => {
        if (err?.status === 404) {
          this.listaEntradas = [];
        }
      }
    });
  }  

  private obtenerDatosUsuario(idUsuario: number): Promise<Usuario> {
    return new Promise((resolve, reject) => {
      this.usuarioService.obtenerPorId(idUsuario).subscribe({
        next: (response: OpenpanelApiResponse<any>) => {
          const usuario: Usuario = (response.data) ? response.data : Usuario;
          resolve(usuario);
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

}
