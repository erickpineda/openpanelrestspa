import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { UsuarioService } from '../../../../core/services/data/usuario.service';
import { Usuario } from '../../../../core/models/usuario.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { PerfilResponse } from '../../../../core/models/perfil-response.model';
import { PerfilMediaService } from '../../../../core/services/data/perfil-media.service';
import { SKIP_GLOBAL_ERROR_HANDLING } from '../../../../core/interceptor/error.interceptor';
import { finalize, take } from 'rxjs/operators';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  standalone: false,
})
export class PerfilComponent implements OnInit {
  usuario: PerfilResponse | null = null;
  loading = false;
  uploading = false;
  activeTab = 0; // Track active tab

  constructor(
    private usuarioService: UsuarioService,
    private toastService: ToastService,
    private perfilMediaService: PerfilMediaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  // Keyboard Shortcuts (Ctrl+1, Ctrl+2, etc.)
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && !event.shiftKey && !event.altKey) {
      const key = event.key;
      const tabIndex = parseInt(key, 10) - 1; // 1-based to 0-based
      if (tabIndex >= 0 && tabIndex <= 3) {
        // Assuming 4 tabs
        event.preventDefault();
        this.setActiveTab(tabIndex);
      }
    }
  }

  setActiveTab(index: number) {
    this.activeTab = index;
    this.cdr.markForCheck();
  }

  cargarPerfil() {
    this.loading = true;
    this.cdr.markForCheck();
    this.usuarioService
      .obtenerDatosSesionActualSafe()
      .pipe(
        take(1),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
          try {
            this.cdr.detectChanges();
          } catch {}
        })
      )
      .subscribe({
        next: (res: PerfilResponse) => {
          this.usuario = res;
          this.cdr.markForCheck();
        },
        error: () => {
          this.toastService.showError('Error al cargar perfil', 'Error');
          this.cdr.markForCheck();
        },
      });
  }

  onSave(usuarioModificado: Partial<Usuario>) {
    if (!this.usuario) return;
    this.loading = true;
    this.cdr.markForCheck();
    // Cast to Usuario or compatible type if needed
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);
    this.usuarioService
      .actualizarParcial(this.usuario.username, usuarioModificado as Usuario, context)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
          try {
            this.cdr.detectChanges();
          } catch {}
        })
      )
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Perfil actualizado', 'Éxito');
          this.cargarPerfil();
          this.cdr.markForCheck();
        },
        error: () => {
          this.toastService.showError('Error al actualizar', 'Error');
          this.cdr.markForCheck();
        },
      });
  }

  triggerFileInput(fileInput: HTMLElement) {
    fileInput.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (file) {
      this.uploading = true;
      this.cdr.markForCheck();

      this.perfilMediaService
        .uploadAvatar(file)
        .pipe(
          finalize(() => {
            this.uploading = false;
            if (input) {
              input.value = '';
            }
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Imagen subida', 'Éxito');
            this.cargarPerfil();
          },
          error: () => {
            this.toastService.showError('Error al subir imagen', 'Error');
          },
        });
    }
  }
}
