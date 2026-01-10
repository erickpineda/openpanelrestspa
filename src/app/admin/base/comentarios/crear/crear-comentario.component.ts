import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Comentario } from '../../../../core/models/comentario.model';
import { ComentarioFacadeService } from '../comentario-form/srv/comentario-facade.service';
import { TokenStorageService } from '../../../../core/services/auth/token-storage.service';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { ComentarioFormComponent } from '../comentario-form/comentario-form.component';

@Component({
  selector: 'app-crear-comentario',
  templateUrl: './crear-comentario.component.html',
  styleUrls: ['./crear-comentario.component.scss'],
  standalone: false,
})
export class CrearComentarioComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSuccess = new EventEmitter<void>();

  @ViewChild(ComentarioFormComponent) formComponent!: ComentarioFormComponent;

  comentario: Comentario = new Comentario();
  nombreUsuario = '';
  emailUsuario = '';

  constructor(
    private facade: ComentarioFacadeService,
    private tokenStorageService: TokenStorageService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.facade.obtenerUsuarioActual().subscribe((user) => {
      if (user) {
        this.nombreUsuario = user.username;
        this.emailUsuario = user.email;
        this.comentario.idUsuario = user.idUsuario;
      }
    });
  }

  handleVisibleChange(event: boolean) {
    this.visible = event;
    this.visibleChange.emit(event);
  }

  cerrarModal() {
    this.handleVisibleChange(false);
  }

  guardar(comentario: Comentario) {
    this.facade.crearComentario(comentario).subscribe({
      next: () => {
        this.toastService.showSuccess('El comentario se ha creado correctamente.', 'Comentario creado');
        this.onSuccess.emit();
        this.cerrarModal();
      },
      error: (err) => {
        console.error('Error al crear comentario:', err);
        this.toastService.showError('Error al crear el comentario.', 'Error');
      }
    });
  }

  onGuardarClick() {
    this.formComponent.guardar();
  }
}
