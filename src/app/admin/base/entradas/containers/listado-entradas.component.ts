import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Categoria } from "src/app/core/models/categoria.model";
import { Entrada } from "src/app/core/models/entrada.model";
import { EntradaService } from "src/app/core/services/entrada.service";

@Component({
  selector: 'app-listado-entradas',
  templateUrl: './listado-entradas.component.html',
  styleUrls: ['./listado-entradas.component.scss']
})

export class ListadoEntradasComponent implements OnInit {

  entrada: Entrada = new Entrada();
  listaEntradas: Entrada[] = [];
  nombresCategoriasConComas: string = '';

  constructor(
    private router: Router,
    private entradasServ: EntradaService) {

  }

  ngOnInit(): void {
    this.obtenerListaEntradas().then((listaRes: Entrada[]) => {
      listaRes.forEach((entradaRes) => {
        entradaRes.categoriasConComas = entradaRes.categorias.map(e => e.nombre).join(', ');
      });
    });

  }

  obtenerListaEntradas(): Promise<Entrada[]> {
    return new Promise((resolve, reject) => {
      this.entradasServ.listar().subscribe({
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