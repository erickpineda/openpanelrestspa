import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Comentario } from '@app/core/models/comentario.model';
import { ComentarioFacadeService } from '../comentario-form/srv/comentario-facade.service';
import { ToastService } from '@app/core/services/ui/toast.service';
import { ComentarioFormComponent } from '../comentario-form/comentario-form.component';
import { Router } from '@angular/router';
import { HttpContext } from '@angular/common/http';
import { SKIP_GLOBAL_ERROR_HANDLING } from '@app/core/interceptor/skip-global-error.token';

@Component({
  selector: 'app-editar-comentario',
  templateUrl: './editar-comentario.component.html',
  styleUrls: ['./editar-comentario.component.scss'],
  standalone: false,
})
export class EditarComentarioComponent implements OnChanges {
  @Input() visible = false;
  @Input() comentario?: Comentario;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSuccess = new EventEmitter<void>();

  @ViewChild(ComentarioFormComponent) formComponent!: ComentarioFormComponent;

  nombreUsuario?: string;
  emailUsuario?: string;
  tituloEntrada?: string;
  submitted = false;
  disabled = true;

  constructor(
    private facade: ComentarioFacadeService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.disabled = true;
      this.submitted = false;
    }

    if (changes['comentario'] && this.comentario) {
      this.cargarDatosAdicionales();
    }
  }

  cargarDatosAdicionales() {
    this.nombreUsuario = '';
    this.emailUsuario = '';
    this.tituloEntrada = '';

    if (!this.comentario) return;

    if (this.comentario.username) {
      this.nombreUsuario = this.comentario.username;
      this.facade.obtenerUsuarioPorUsername(this.comentario.username).subscribe((usuario) => {
        if (usuario) {
          this.emailUsuario = usuario.email;
        }
      });
    } else if (this.comentario.idUsuario) {
      this.facade.obtenerUsuarioPorId(this.comentario.idUsuario).subscribe((usuario) => {
        if (usuario) {
          this.nombreUsuario = usuario.username;
          this.emailUsuario = usuario.email;
        }
      });
    }

    if (this.comentario.idEntrada) {
      this.facade.obtenerEntradaPorId(this.comentario.idEntrada).subscribe((entrada) => {
        if (entrada) {
          this.tituloEntrada = entrada.titulo;
        }
      });
    }
  }

  handleVisibleChange(event: boolean) {
    this.visible = event;
    this.visibleChange.emit(event);
  }

  cerrarModal() {
    this.handleVisibleChange(false);
  }

  irAEntrada(idEntrada: number) {
    this.cerrarModal();
    setTimeout(() => {
      this.router.navigate(['/admin/control/entradas/editar', idEntrada]);
    }, 350);
  }

  guardar(comentario: Comentario) {
    if (!comentario.idComentario) return;

    this.submitted = true;
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);
    this.facade.actualizarComentario(comentario.idComentario, comentario, context).subscribe({
      next: () => {
        this.toastService.showSuccess(
          'El comentario se ha actualizado correctamente.',
          'Comentario actualizado'
        );
        this.onSuccess.emit();
        this.cerrarModal();
      },
      error: (err) => {
        console.error('Error al actualizar comentario:', err);
        this.toastService.showError(
          err?.error?.message || 'Error al actualizar el comentario.',
          'Error'
        );
      },
    });
  }

  onEditarComentario() {
    this.disabled = false;
  }

  onGuardarClick() {
    this.formComponent.guardar();
  }
}
