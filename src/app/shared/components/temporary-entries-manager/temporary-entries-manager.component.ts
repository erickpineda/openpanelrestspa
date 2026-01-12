// temporary-entries-manager.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import {
  TemporaryEntry,
  TemporaryStorageService,
} from '../../../core/services/ui/temporary-storage.service';
import { LoggerService } from '../../../core/services/logger.service';

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
    private translate: TranslationService
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
        recoverData: true,
      },
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
