import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable, BehaviorSubject, from, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { FileStorageService } from '../../../../core/services/file-storage.service';
import { LoggerService } from '../../../../core/services/logger.service';

export interface ImageUploadResult {
  base64: string;
  previewUrl: SafeUrl | string;
  file: File;
}

@Injectable({
  providedIn: 'root'
})
export class EntradaImageService {
  
  constructor(
    private fileStorage: FileStorageService,
    private sanitizer: DomSanitizer,
    private log: LoggerService
  ) {}

  /**
   * Procesa un archivo de imagen seleccionado:
   * 1. Lee el archivo como Base64 (para enviar al backend en el DTO).
   * 2. Genera una URL segura para preview.
   * 3. Sube el archivo a la librería de medios (opcional/background).
   */
  processSelectedImage(file: File): Observable<ImageUploadResult> {
    return new Observable<ImageUploadResult>(observer => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        const base64 = e.target.result;
        
        // El base64 sirve tanto para el modelo como para la preview inmediata
        const result: ImageUploadResult = {
          base64: base64,
          previewUrl: base64, // Base64 es seguro para src
          file: file
        };
        
        observer.next(result);
        observer.complete();
      };
      
      reader.onerror = (error) => observer.error(error);
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Sube la imagen al FileStorage (Librería de Medios)
   * Esto es independiente del guardado de la entrada.
   */
  uploadToLibrary(file: File): Observable<any> {
    this.log.info('Subiendo imagen a librería...', file.name);
    return this.fileStorage.uploadFile(file).pipe(
      tap(response => this.log.info('Imagen subida a librería', response)),
      catchError(err => {
        this.log.error('Error subiendo a librería', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Carga una imagen segura desde un UUID (para endpoints protegidos)
   */
  loadSecureImage(uuid: string): Observable<SafeUrl> {
    return this.fileStorage.descargarFichero(uuid).pipe(
      map(blob => {
        const objectUrl = URL.createObjectURL(blob);
        return this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      })
    );
  }

  /**
   * Revoca una URL de objeto creada anteriormente para liberar memoria
   */
  revokeUrl(url: string | SafeUrl | null): void {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
    // Si es SafeUrl, Angular no nos da acceso fácil al string interno blob:
    // pero en este caso el componente suele tener el string original si lo guardó.
    // Para simplificar, asumimos que si pasamos string es revokeable.
  }

  /**
   * Extrae el UUID de una URL de descarga
   */
  extractUuidFromUrl(url: string): string | null {
    const match = url.match(/\/descargar\/([0-9a-fA-F-]{36})/);
    return match ? match[1] : null;
  }

  /**
   * Descarga una imagen desde su UUID y la devuelve como Base64
   * Útil para poblar el formulario y la vista previa cuando se selecciona desde la galería
   */
  downloadImageAsBase64(uuid: string): Observable<string> {
    return this.fileStorage.descargarFichero(uuid).pipe(
      switchMap(blob => new Observable<string>(observer => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          observer.next(e.target.result);
          observer.complete();
        };
        reader.onerror = (error) => observer.error(error);
        reader.readAsDataURL(blob);
      })),
      catchError(err => {
        this.log.error('Error descargando y convirtiendo imagen', err);
        return throwError(() => err);
      })
    );
  }
}
