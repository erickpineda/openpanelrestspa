import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Usuario } from '@app/core/models/usuario.model';
import { UsuarioService } from '@app/core/services/data/usuario.service';
import { ToastService } from '@app/core/services/ui/toast.service';
import { UsuarioFormComponent } from '../form/usuario-form.component';
import { Rol } from '@app/core/models/rol.model';
import { TranslationService } from '@app/core/services/translation.service';
import { HttpContext } from '@angular/common/http';
import { SKIP_GLOBAL_ERROR_HANDLING } from '@app/core/interceptor/skip-global-error.token';

@Component({
  selector: 'app-editar-usuario',
  templateUrl: './editar-usuario.component.html',
  standalone: false,
})
export class EditarUsuarioComponent implements OnChanges {
  @Input() visible = false;
  @Input() usuario: Usuario | null = null;
  @Input() roles: Rol[] = [];
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSuccess = new EventEmitter<void>();

  @ViewChild(UsuarioFormComponent) formComponent!: UsuarioFormComponent;

  loading = false;
  isEditing = false;

  constructor(
    private usuarioService: UsuarioService,
    private toastService: ToastService,
    private translate: TranslationService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.isEditing = false;
    }
  }

  handleVisibleChange(event: boolean) {
    this.visible = event;
    this.visibleChange.emit(event);
  }

  handleEditEnabled() {
    this.isEditing = true;
  }

  cerrarModal() {
    this.isEditing = false;
    this.handleVisibleChange(false);
  }

  guardar(usuarioData: Usuario) {
    this.loading = true;

    // Determine if we need full update or partial
    // For now, let's use actualizarParcial as in the original test/code it seemed preferred
    // But check if password is changed, etc.
    // The original listado-usuarios.component.ts used logic:
    // if existing user -> actualizarParcial (or actualizar?)

    // Let's look at what was there.
    // In search results: "should use partial update for existing users" test.

    if (this.usuario && this.usuario.username) {
      usuarioData.username = this.usuario.username;

      const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);
      this.usuarioService.actualizarParcial(this.usuario.username, usuarioData, context).subscribe({
        next: () => {
          this.loading = false;
          this.toastService.showSuccess(
            this.translate.instant('ADMIN.USERS.SUCCESS.UPDATE'),
            this.translate.instant('COMMON.SUCCESS')
          );
          this.onSuccess.emit();
          this.cerrarModal();
        },
        error: (err) => {
          this.loading = false;
          console.error('Error al actualizar usuario:', err);
          this.toastService.showError(
            this.translate.instant('ADMIN.USERS.ERROR.UPDATE'),
            this.translate.instant('COMMON.ERROR')
          );
        },
      });
    }
  }

  onGuardarClick() {
    this.formComponent.guardar();
  }
}
