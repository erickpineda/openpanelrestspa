import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Comentario } from '../../../../core/models/comentario.model';
import { Entrada } from '../../../../core/models/entrada.model';
import { Usuario } from '../../../../core/models/usuario.model';
import { ComentarioService } from '../../../../core/services/data/comentario.service';
import { EntradaService } from '../../../../core/services/data/entrada.service';
import { UsuarioService } from '../../../../core/services/data/usuario.service';
import { CommonFunctionalityService } from '../../../../shared/services/common-functionality.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { OpenpanelApiResponse } from '../../../../core/models/openpanel-api-response.model';

@Component({
  selector: 'app-editar-comentario',
  templateUrl: './editar-comentario.component.html',
  styleUrls: ['./editar-comentario.component.scss']
})
export class EditarComentarioComponent implements OnInit {
  comentario?: Comentario;
  nombreUsuario?: string;
  emailUsuario?: string;
  tituloEntrada?: string;
  
  submitted = false;
  disabled = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private comentarioService: ComentarioService,
    private usuarioService: UsuarioService,
    private entradaService: EntradaService,
    private commonFuncService: CommonFunctionalityService,
    private log: LoggerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['idComentario'];
    if (id) {
      this.obtenerDatos(id);
    }
  }

  private obtenerDatos(id: any) {
      this.comentarioService.obtenerPorId(id).subscribe({
          next: (response: OpenpanelApiResponse<any>) => {
            this.comentario = response.data;
            if (this.comentario) {
                this.obtenerDatosUsuario(this.comentario.idUsuario);
                this.obtenerDatosEntrada(this.comentario.idEntrada);
            }
            this.cdr.detectChanges();
          },
          error: (err) => {
              this.log.error("Error al obtener comentario", err);
          }
      });
  }

  private obtenerDatosUsuario(idUsuario: number) {
      this.usuarioService.obtenerPorId(idUsuario).subscribe({
          next: (response: OpenpanelApiResponse<any>) => {
              const usuario: Usuario = response.data;
              if (usuario) {
                  this.nombreUsuario = usuario.username;
                  this.emailUsuario = usuario.email;
                  this.cdr.detectChanges();
              }
          }
      });
  }

  private obtenerDatosEntrada(idEntrada: number) {
      this.entradaService.obtenerPorId(idEntrada).subscribe({
          next: (response: OpenpanelApiResponse<any>) => {
              const entrada: Entrada = response.data;
              if (entrada) {
                  this.tituloEntrada = entrada.titulo;
                  this.cdr.detectChanges();
              }
          }
      });
  }

  onSubmit(comentario: Comentario) {
    this.submitted = true;
    this.comentarioService.actualizar(comentario.idComentario, comentario).subscribe((response: OpenpanelApiResponse<any>) => {
        this.log.info('Se ha actualizado el comentario ' + comentario.idComentario);
        this.commonFuncService.reloadComponent(false, '/admin/control/comentarios');
    });
  }

  onCancel() {
    this.router.navigate(['/admin/control/comentarios']);
  }

  onEditarComentario() {
      this.disabled = false;
  }
}
