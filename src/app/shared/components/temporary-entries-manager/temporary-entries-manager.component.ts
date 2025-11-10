// temporary-entries-manager.component.ts
import { Component, OnInit } from '@angular/core';
import { TemporaryEntry, TemporaryStorageService } from '../../../core/services/temporary-storage.service';

@Component({
  selector: 'app-temporary-entries-manager',
  template: `
    <c-card>
      <c-card-header>
        <h2 cCardTitle>Entradas Temporales No Guardadas</h2>
        <p class="text-muted">Estas son las entradas que se guardaron temporalmente durante cierres de sesión.</p>
      </c-card-header>
      <c-card-body>
        <div *ngIf="entries.length === 0" class="text-center py-4">
          <p>No hay entradas temporales guardadas.</p>
        </div>

        <c-row *ngIf="entries.length > 0">
          <c-col lg="6" *ngFor="let entry of entries">
            <c-card class="mb-3">
              <c-card-body>
                <h5 class="card-title">{{ entry.title || 'Sin título' }}</h5>
                <p class="card-text text-muted small">
                  {{ entry.description || 'Entrada sin descripción' }}
                </p>
                <p class="card-text">
                  <small class="text-muted">
                    Guardado: {{ entry.timestamp | date:'medium' }}
                  </small>
                </p>
                <div class="btn-group">
                  <button cButton color="success" size="sm" (click)="recoverEntry(entry)">
                    <i class="fas fa-download me-1"></i> Recuperar
                  </button>
                  <button cButton color="secondary" size="sm" (click)="viewEntry(entry)">
                    <i class="fas fa-eye me-1"></i> Ver
                  </button>
                  <button cButton color="danger" size="sm" (click)="deleteEntry(entry.id)">
                    <i class="fas fa-trash me-1"></i> Eliminar
                  </button>
                </div>
              </c-card-body>
            </c-card>
          </c-col>
        </c-row>

        <div *ngIf="entries.length > 0" class="text-center mt-3">
          <button cButton color="outline-danger" (click)="clearAll()">
            <i class="fas fa-broom me-1"></i> Limpiar Todas
          </button>
        </div>
      </c-card-body>
    </c-card>

    <!-- Modal para ver detalles -->
    <c-modal id="viewEntryModal" [visible]="viewModalVisible" (visibleChange)="viewModalVisible = $event">
      <c-modal-header>
        <h5 cModalTitle>Vista Previa: {{ selectedEntry?.title }}</h5>
      </c-modal-header>
      <c-modal-body>
        <div *ngIf="selectedEntry">
          <p><strong>Título:</strong> {{ selectedEntry.formData.titulo || 'Sin título' }}</p>
          <p><strong>Subtítulo:</strong> {{ selectedEntry.formData.subtitulo || 'Sin subtítulo' }}</p>
          <p><strong>Resumen:</strong> {{ selectedEntry.formData.resumen || 'Sin resumen' }}</p>
          <p><strong>Contenido:</strong></p>
          <div [innerHTML]="selectedEntry.formData.contenido || 'Sin contenido'"></div>
        </div>
      </c-modal-body>
      <c-modal-footer>
        <button cButton color="secondary" (click)="viewModalVisible = false">Cerrar</button>
        <button cButton color="primary" (click)="recoverSelectedEntry()">Recuperar</button>
      </c-modal-footer>
    </c-modal>
  `,
  styleUrls: ['./temporary-entries-manager.component.scss']
})
export class TemporaryEntriesManagerComponent implements OnInit {
  entries: TemporaryEntry[] = [];
  selectedEntry: TemporaryEntry | null = null;
  viewModalVisible = false;

  constructor(private temporaryStorage: TemporaryStorageService) {}

  ngOnInit(): void {
    this.loadEntries();
  }

  loadEntries(): void {
    this.entries = this.temporaryStorage.getTemporaryEntriesByType('entrada');
  }

  recoverEntry(entry: TemporaryEntry): void {
    // Aquí podrías navegar al formulario de entrada con los datos
    console.log('Recuperando entrada:', entry);
    // Por ahora, solo eliminamos la entrada temporal
    this.temporaryStorage.removeTemporaryEntry(entry.id);
    this.loadEntries();
    
    // Podrías emitir un evento o usar un servicio para comunicar con el formulario
    alert(`Entrada "${entry.title}" recuperada. Navega al formulario de creación para ver los datos.`);
  }

  viewEntry(entry: TemporaryEntry): void {
    this.selectedEntry = entry;
    this.viewModalVisible = true;
  }

  recoverSelectedEntry(): void {
    if (this.selectedEntry) {
      this.recoverEntry(this.selectedEntry);
      this.viewModalVisible = false;
    }
  }

  deleteEntry(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta entrada temporal?')) {
      this.temporaryStorage.removeTemporaryEntry(id);
      this.loadEntries();
    }
  }

  clearAll(): void {
    if (confirm('¿Estás seguro de que quieres eliminar TODAS las entradas temporales?')) {
      this.temporaryStorage.clearTemporaryEntriesByType('entrada');
      this.loadEntries();
    }
  }
}