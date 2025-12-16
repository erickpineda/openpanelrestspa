import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../../../core/services/data/usuario.service';
import { Usuario } from '../../../../core/models/usuario.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { PerfilResponse } from '../../../../core/models/perfil-response.model';
import { FileStorageService } from '../../../../core/services/file-storage.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  usuario: PerfilResponse | null = null;
  loading = false;
  uploading = false;

  constructor(
    private usuarioService: UsuarioService,
    private toastService: ToastService,
    private fileStorageService: FileStorageService
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil() {
    this.loading = true;
    this.usuarioService.obtenerDatosSesionActualSafe().subscribe({
      next: (res: PerfilResponse) => {
        this.usuario = res;
        this.loading = false;
      },
      error: (err) => {
        this.toastService.showError('Error al cargar perfil', 'Error');
        this.loading = false;
      }
    });
  }

  onSave(usuarioModificado: Partial<Usuario>) {
     if (!this.usuario) return;
     this.loading = true;
     // Cast to Usuario or compatible type if needed
     this.usuarioService.actualizarParcial(this.usuario.idUsuario, usuarioModificado as Usuario).subscribe({
        next: () => {
             this.toastService.showSuccess('Perfil actualizado', 'Éxito');
             this.cargarPerfil();
        },
        error: () => {
             this.toastService.showError('Error al actualizar', 'Error');
             this.loading = false;
        }
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
           
           if(imageUrl && this.usuario) {
               this.onSave({ imagen: [imageUrl] } as unknown as Usuario);
           } else {
             this.toastService.showSuccess('Imagen subida', 'Éxito');
             // Si el backend no devuelve URL directa, recargamos o esperamos que el usuario guarde
             // Pero idealmente actualizamos el usuario con la nueva imagen
           }
           this.uploading = false;
        },
        error: () => {
          this.toastService.showError('Error al subir imagen', 'Error');
          this.uploading = false;
        }
      });
    }
  }
}
