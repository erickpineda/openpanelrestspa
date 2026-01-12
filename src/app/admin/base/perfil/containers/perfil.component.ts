import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UsuarioService } from '../../../../core/services/data/usuario.service';
import { Usuario } from '../../../../core/models/usuario.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { PerfilResponse } from '../../../../core/models/perfil-response.model';
import { FileStorageService } from '../../../../core/services/file-storage.service';
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

  constructor(
    private usuarioService: UsuarioService,
    private toastService: ToastService,
    private fileStorageService: FileStorageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
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
    this.usuarioService
      .actualizarParcial(this.usuario.idUsuario, usuarioModificado as Usuario)
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

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.uploading = true;
      this.fileStorageService.uploadFile(file, 'perfil').subscribe({
        next: (response) => {
          // Asumimos que la respuesta contiene la URL o path de la imagen
          // y actualizamos el perfil
          const imageUrl = response.ruta || response.url; // Adaptar según respuesta del backend

          if (imageUrl && this.usuario) {
            this.onSave({ imagen: [imageUrl] } as unknown as Usuario);
          } else {
            this.toastService.showSuccess('Imagen subida', 'Éxito');
            // Si el backend no devuelve URL directa, recargamos o esperamos que el usuario guarde
            // Pero idealmente actualizamos el usuario con la nueva imagen
          }
          this.uploading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.toastService.showError('Error al subir imagen', 'Error');
          this.uploading = false;
          this.cdr.markForCheck();
        },
      });
    }
  }
}
