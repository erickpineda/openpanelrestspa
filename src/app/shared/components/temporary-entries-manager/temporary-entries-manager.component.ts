// temporary-entries-manager.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TemporaryEntry, TemporaryStorageService } from '../../../core/services/ui/temporary-storage.service';
import { LoggerService } from '../../../core/services/logger.service';

@Component({
  selector: 'app-temporary-entries-manager',
  templateUrl: './temporary-entries-manager.component.html',
  styleUrls: ['./temporary-entries-manager.component.scss']
})
export class TemporaryEntriesManagerComponent implements OnInit {
  entries: TemporaryEntry[] = [];
  selectedEntry: TemporaryEntry | null = null;
  viewModalVisible = false;

  constructor(
    private temporaryStorage: TemporaryStorageService,
    private router: Router,
    private log: LoggerService
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
    this.router.navigate(['/admin/control/entradas/crear'], {
      state: { 
        temporaryEntry: entry,
        recoverData: true 
      }
    });
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

  // ✅ NUEVO: Método para crear nueva entrada
  createNewEntry(): void {
    this.router.navigate(['/admin/control/entradas/crear']);
  }
}