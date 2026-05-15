import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { UsuarioService } from '../../../../core/services/data/usuario.service';
import { Usuario } from '../../../../core/models/usuario.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { PerfilResponse } from '../../../../core/models/perfil-response.model';
import { PerfilMediaService } from '../../../../core/services/data/perfil-media.service';
import { SKIP_GLOBAL_ERROR_HANDLING } from '../../../../core/interceptor/error.interceptor';
import { SKIP_GLOBAL_LOADER } from '../../../../core/interceptor/network.interceptor';
import { finalize, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  standalone: false,
})
export class PerfilComponent implements OnInit, OnDestroy {
  usuario: PerfilResponse | null = null;
  loading = false;
  uploading = false;
  activeTab = 0; // Track active tab
  avatarUrl: string | null = null;
  readonly defaultAvatarUrl = './assets/img/avatars/2.jpg';
  private avatarObjectUrl: string | null = null;
  private avatarSubscription?: Subscription;

  constructor(
    private usuarioService: UsuarioService,
    private toastService: ToastService,
    private perfilMediaService: PerfilMediaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.avatarSubscription = this.perfilMediaService.avatarChanged$.subscribe((event) => {
      if (event === 'deleted') {
        this.setDefaultAvatar();
        this.cdr.markForCheck();
        return;
      }
      this.loadAvatar(false);
    });
    this.cargarPerfil();
  }

  ngOnDestroy(): void {
    this.avatarSubscription?.unsubscribe();
    this.revokeAvatarObjectUrl();
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

  private loadAvatar(fallbackToDefaultOnError: boolean = true): void {
    this.perfilMediaService
      .getAvatarObjectUrl()
      .pipe(take(1))
      .subscribe({
        next: (avatarUrl) => {
          if (avatarUrl) {
            this.setAvatarUrl(avatarUrl);
          }
        },
        error: () => {
          if (fallbackToDefaultOnError) {
            this.setDefaultAvatar();
          }
        },
      });
  }

  onAvatarError(): void {
    this.setDefaultAvatar();
    this.cdr.markForCheck();
  }

  private setAvatarUrl(avatarUrl: string): void {
    this.revokeAvatarObjectUrl();
    this.avatarObjectUrl = avatarUrl;
    this.avatarUrl = avatarUrl;
    this.cdr.markForCheck();
  }

  private setDefaultAvatar(): void {
    this.revokeAvatarObjectUrl();
    this.avatarUrl = this.defaultAvatarUrl;
  }

  private revokeAvatarObjectUrl(): void {
    if (this.avatarObjectUrl) {
      URL.revokeObjectURL(this.avatarObjectUrl);
      this.avatarObjectUrl = null;
    }
  }

  cargarPerfil() {
    this.loading = true;
    this.cdr.markForCheck();
    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    this.usuarioService
      .obtenerDatosSesionActualSafe(context)
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
          this.loadAvatar(true);
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
            if (this.usuario) {
              this.usuario = {
                ...this.usuario,
                imagen: this.usuario.imagen && this.usuario.imagen.length > 0 ? this.usuario.imagen : ['avatar'],
              };
            }
            this.cdr.markForCheck();
          },
          error: () => {
            this.toastService.showError('Error al subir imagen', 'Error');
          },
        });
    }
  }

  onDeleteAvatar(): void {
    if (!this.usuario) return;

    this.uploading = true;
    this.cdr.markForCheck();

    this.perfilMediaService
      .deleteAvatar()
      .pipe(
        take(1),
        finalize(() => {
          this.uploading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Imagen borrada', 'Éxito');
          if (this.usuario) {
            this.usuario = {
              ...this.usuario,
              imagen: [],
            };
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.toastService.showError('Error al borrar imagen', 'Error');
        },
      });
  }
}
