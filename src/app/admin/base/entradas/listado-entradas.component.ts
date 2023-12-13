import { DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Entrada } from "src/app/core/models/entrada.model";
import { Usuario } from "src/app/core/models/usuario.model";
import { EntradaService } from "src/app/core/services/entrada.service";
import { UsuarioService } from "src/app/core/services/usuario.service";
import { CommonFunctionalityComponent } from "src/app/shared/components/funcionalidades-comunes/common-functionality.component";

@Component({
  selector: 'app-listado-entradas',
  templateUrl: './listado-entradas.component.html',
  styleUrls: ['./listado-entradas.component.scss']
})

export class ListadoEntradasComponent extends CommonFunctionalityComponent implements OnInit {

  entrada: Entrada = new Entrada();
  listaEntradas: Entrada[] = [];
  nombresCategoriasConComas: string = '';

  constructor(
    protected override router: Router,
    private entradaService: EntradaService,
    private usuarioService: UsuarioService,
    protected override datePipe: DatePipe
  ) {
    super(router, datePipe);
    this.obtenerListaEntradas().then((listaRes: Entrada[]) => {
      listaRes.forEach((entradaRes) => {
        entradaRes.categoriasConComas = entradaRes.categorias.map(e => e.nombre).join(', ');

        this.obtenerDatosUsuario(entradaRes.idUsuario).then((usu: Usuario) => {
          if (usu) {
            entradaRes.username = usu.username;
          }
        });

      });
    });
  }

  override ngOnInit(): void {
  }

  private obtenerListaEntradas(): Promise<Entrada[]> {
    return new Promise((resolve, reject) => {
      this.entradaService.listar().subscribe({
        next: data => {
          this.listaEntradas = data;
          resolve(this.listaEntradas);
        },
        error: err => {
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

  crearEntrada() {

  }

  actualizarEntrada(id: number) {

  }

  borrarEntrada(id: number) {

  }

  public refrescarPagina(): void {
    window.location.reload();
  }

}