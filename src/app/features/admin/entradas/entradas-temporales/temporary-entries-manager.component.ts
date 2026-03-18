import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslationService } from '../../../../core/services/translation.service';
import {
  TemporaryEntry,
  TemporaryStorageService,
} from '../../../../core/services/ui/temporary-storage.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { parseAllowedDate } from '../../../../shared/utils/date-utils';

@Component({
  selector: 'app-temporary-entries-manager',
  templateUrl: './temporary-entries-manager.component.html',
  styleUrls: ['./temporary-entries-manager.component.scss'],
  standalone: false,
})
export class TemporaryEntriesManagerComponent implements OnInit {
  entries: TemporaryEntry[] = [];
  selectedEntry: TemporaryEntry | null = null;
  viewModalVisible = false;

  // Preview Properties
  tituloMostrar = '';
  subtituloMostrar = '';
  imagenMostrar: string | null = null;
  fechaMostrar: Date | null = null;
  estadoTooltip = '';
  estadoIcon = '';
  estadoColor = '';
  categoriasMostrar: any[] = [];
  contenidoSeguro: SafeHtml = '';

  // Confirmation Modal State
  confirmationVisible = false;
  confirmationTitle = '';
  confirmationMessage = '';
  confirmationType: 'danger' | 'warning' | 'info' = 'danger';
  private pendingAction: (() => void) | null = null;

  constructor(
    private temporaryStorage: TemporaryStorageService,
    private router: Router,
    private log: LoggerService,
    private translate: TranslationService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadEntries();
  }

  loadEntries(): void {
    this.entries = this.temporaryStorage.getTemporaryEntriesByType('entrada');
  }

  recoverEntry(entry: TemporaryEntry): void {
    this.log.info('📥 Recuperando entrada:', entry);

    // ✅ CORREGIDO: Navegar al formulario de creación con los datos
    setTimeout(() => {
      this.router.navigate(['/admin/control/entradas/crear'], {
        state: {
          temporaryEntry: entry,
          recoverData: true,
        },
      });
    }, 100);
  }

  viewEntry(entry: TemporaryEntry): void {
    this.selectedEntry = entry;
    this.refreshPreview();
    this.viewModalVisible = true;
  }

  private refreshPreview(): void {
    if (!this.selectedEntry || !this.selectedEntry.formData) {
      this.resetPreview();
      return;
    }

    const data = this.selectedEntry.formData;

    this.tituloMostrar = data.titulo || '';
    this.subtituloMostrar = data.subtitulo || '';
    this.imagenMostrar = typeof data.imagenDestacada === 'string' ? data.imagenDestacada : null;

    this.resolveEstado(data);
    this.resolveFecha(data);
    this.resolveCategorias(data);

    this.contenidoSeguro = this.sanitizer.bypassSecurityTrustHtml(data.contenido || '');
  }

  private resetPreview(): void {
    this.tituloMostrar = '';
    this.subtituloMostrar = '';
    this.imagenMostrar = null;
    this.fechaMostrar = null;
    this.estadoTooltip = '';
    this.estadoIcon = '';
    this.estadoColor = '';
    this.categoriasMostrar = [];
    this.contenidoSeguro = '';
  }

  private resolveEstado(data: any): void {
    let nombreEstado = data.estadoEntrada?.nombre?.toUpperCase();

    // Fallback: Si no hay nombre pero hay codigo
    if (!nombreEstado && data.estadoEntrada?.codigo) {
      const codigo = data.estadoEntrada.codigo;
      switch (codigo) {
        case 'BOR':
          nombreEstado = 'BORRADOR';
          break;
        case 'PUB':
          nombreEstado = 'PUBLICADA';
          break;
        case 'PDR':
          nombreEstado = 'PENDIENTE REVISION';
          break;
        case 'PRO':
          nombreEstado = 'PROGRAMADA';
          break;
        case 'NOP':
          nombreEstado = 'NO PUBLICADA';
          break;
      }
    }

    if (!nombreEstado) {
      this.estadoTooltip = '';
      this.estadoIcon = '';
      this.estadoColor = '';
      return;
    }

    switch (nombreEstado) {
      case 'PUBLICADA':
        this.estadoColor = 'success';
        this.estadoIcon = 'cilCheckCircle';
        this.estadoTooltip = 'Publicada';
        break;
      case 'NO PUBLICADA':
        this.estadoColor = 'danger';
        this.estadoIcon = 'cilXCircle';
        this.estadoTooltip = 'No Publicada';
        break;
      case 'GUARDADA':
      case 'BORRADOR':
        this.estadoColor = 'secondary';
        this.estadoIcon = 'cilSave';
        this.estadoTooltip = 'Guardada';
        break;
      case 'PENDIENTE REVISION':
        this.estadoColor = 'warning';
        this.estadoIcon = 'cilWarning';
        this.estadoTooltip = 'Pendiente Revisión';
        break;
      case 'EN REVISION':
        this.estadoColor = 'info';
        this.estadoIcon = 'cilZoom';
        this.estadoTooltip = 'En Revisión';
        break;
      case 'REVISADA':
        this.estadoColor = 'primary';
        this.estadoIcon = 'cilTask';
        this.estadoTooltip = 'Revisada';
        break;
      case 'HISTORICA':
        this.estadoColor = 'dark';
        this.estadoIcon = 'cilHistory';
        this.estadoTooltip = 'Histórica';
        break;
      case 'PROGRAMADA':
        this.estadoColor = 'info';
        this.estadoIcon = 'cilCalendar';
        this.estadoTooltip = 'Programada';
        break;
      default:
        this.estadoColor = 'secondary';
        this.estadoIcon = 'cilFile';
        this.estadoTooltip = data.estadoEntrada?.nombre || 'Archivada';
        break;
    }
  }

  private resolveFecha(data: any): void {
    const nombreEstado = data.estadoEntrada?.nombre?.toUpperCase();

    if (nombreEstado === 'PROGRAMADA' && data.fechaPublicacionProgramada) {
      this.fechaMostrar = parseAllowedDate(data.fechaPublicacionProgramada);
    } else if (nombreEstado === 'PUBLICADA' && data.fechaPublicacion) {
      this.fechaMostrar = parseAllowedDate(data.fechaPublicacion);
    } else if (data.fechaPublicacion) {
      this.fechaMostrar = parseAllowedDate(data.fechaPublicacion);
    } else {
      this.fechaMostrar = new Date(this.selectedEntry!.timestamp); // Fallback to save timestamp
    }
  }

  private resolveCategorias(data: any): void {
    if (Array.isArray(data.categorias) && data.categorias.length) {
      // Si son objetos completos
      if (typeof data.categorias[0] === 'object' && 'nombre' in data.categorias[0]) {
        this.categoriasMostrar = data.categorias;
      } else {
        // Si son IDs (esto es más complejo si no tenemos la lista meta,
        // pero asumiremos que el form guarda objetos si es posible,
        // o mostraremos vacío si no podemos resolver)
        this.categoriasMostrar = [];
      }
    } else {
      this.categoriasMostrar = [];
    }
  }

  recoverSelectedEntry(): void {
    if (this.selectedEntry) {
      this.recoverEntry(this.selectedEntry);
      this.viewModalVisible = false;
    }
  }

  deleteEntry(id: string): void {
    this.confirmationTitle = this.translate.instant('ADMIN.TEMP_ENTRIES.DELETE_TITLE');
    this.confirmationMessage = this.translate.instant('ADMIN.TEMP_ENTRIES.DELETE_CONFIRMATION');
    this.confirmationType = 'danger';
    this.pendingAction = () => {
      this.temporaryStorage.removeTemporaryEntry(id);
      this.loadEntries();
    };
    this.confirmationVisible = true;
  }

  clearAll(): void {
    this.confirmationTitle = this.translate.instant('ADMIN.TEMP_ENTRIES.CLEAR_ALL_TITLE');
    this.confirmationMessage = this.translate.instant('ADMIN.TEMP_ENTRIES.CLEAR_ALL_CONFIRMATION');
    this.confirmationType = 'danger';
    this.pendingAction = () => {
      this.temporaryStorage.clearTemporaryEntriesByType('entrada');
      this.loadEntries();
    };
    this.confirmationVisible = true;
  }

  confirmAction(): void {
    if (this.pendingAction) {
      this.pendingAction();
    }
    this.confirmationVisible = false;
    this.pendingAction = null;
  }

  cancelAction(): void {
    this.confirmationVisible = false;
    this.pendingAction = null;
  }

  // ✅ NUEVO: Método para crear nueva entrada
  createNewEntry(): void {
    this.router.navigate(['/admin/control/entradas/crear']);
  }
}
