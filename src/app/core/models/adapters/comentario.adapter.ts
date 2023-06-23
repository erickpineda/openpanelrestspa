/*import { Injectable } from "@angular/core";
import { Comentario } from "../comentario.model";
import { Adapter } from "./adapter.adapter";

@Injectable({
  providedIn: "root"
})
export class ComentarioAdapter implements Adapter<Comentario> {
  adapt(item: any): Comentario {
    var comentario: Comentario = new Comentario();
    comentario.id = item.id;
    comentario.usuario = item.usuario;
    comentario.entrada = item.entrada;
    comentario.fechaCreacion = item.fechaCreacion;
    comentario.fechaEdicion = item.fechaEdicion;
    comentario.contenido = item.contenido;
    comentario.votos = item.votos;
    comentario.aprobado = item.aprobado;
    comentario.cuarentena = item.cuarentena;

    return comentario;
  }
}*/
