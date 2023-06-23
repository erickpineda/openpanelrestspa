import { Entrada } from "./entrada.model";
import { Usuario } from "./usuario.model";

/*export class Comentario {
  id: number = 0;
  usuario: Usuario = new Usuario;
  entrada: Entrada = new Entrada;
  fechaCreacion: Date = new Date();
  fechaEdicion: Date = new Date();
  contenido: string = "";
  votos: number = 0;
  aprobado: boolean = true;
  cuarentena: boolean = false;

  constructor() {

  }
}*/

export interface Comentario {
  id: number;
  usuario: Usuario;
  entrada: Entrada;
  fechaCreacion: Date;
  fechaEdicion: Date;
  contenido: string;
  votos: number;
  aprobado: boolean;
  cuarentena: boolean;
}
