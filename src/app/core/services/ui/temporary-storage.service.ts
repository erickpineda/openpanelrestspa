// temporary-storage.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { LoggerService } from '../logger.service';
import { OPStorageConstants } from '@app/shared/constants/op-storage.constants';

export interface TemporaryEntry {
  id: string; // ✅ NUEVO: ID único para cada entrada
  formData: any;
  timestamp: string;
  formType: string; // ✅ NUEVO: Tipo de formulario (ej: 'entrada')
  title?: string; // ✅ NUEVO: Título para mostrar al usuario
  description?: string; // ✅ NUEVO: Descripción opcional
}

@Injectable({
  providedIn: 'root',
})
export class TemporaryStorageService {
  private readonly STORAGE_KEY = OPStorageConstants.TEMPORARY_ENTRIES_KEY;
  private readonly NOTIFICATION_SHOWN_KEY = OPStorageConstants.RECOVERY_NOTIFICATION_SHOWN_KEY;
  private entriesChangedSubject = new Subject<void>();
  public entriesChanged$ = this.entriesChangedSubject.asObservable();

  constructor(private log: LoggerService) {}

  // ✅ NUEVO: Generar ID único
  private generateId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // ✅ MODIFICADO: Ahora acepta un objeto completo de entrada temporal y un ID opcional para actualizar
  saveTemporaryEntry(entry: Omit<TemporaryEntry, 'id'>, existingId?: string): string {
    const entries = this.getTemporaryEntries();

    // Si nos pasan un ID, lo usamos (actualización). Si no, generamos uno nuevo.
    const id = existingId || this.generateId();

    const newEntry: TemporaryEntry = {
      ...entry,
      id: id,
    };

    entries[id] = newEntry;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));

    this.log.info('💾 Entrada temporal guardada:', id, newEntry.title);
    this.entriesChangedSubject.next();
    return id;
  }

  getTemporaryEntry(id: string): TemporaryEntry | null {
    const entries = this.getTemporaryEntries();
    return entries[id] || null;
  }

  // ✅ NUEVO: Obtener entradas por tipo
  getTemporaryEntriesByType(formType: string): TemporaryEntry[] {
    const entries = this.getTemporaryEntries();
    return Object.values(entries).filter((entry) => entry.formType === formType);
  }

  getAllTemporaryEntries(): TemporaryEntry[] {
    const entries = this.getTemporaryEntries();
    return Object.values(entries);
  }

  removeTemporaryEntry(id: string): void {
    const entries = this.getTemporaryEntries();
    delete entries[id];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    this.log.info('🧹 Entrada temporal removida:', id);
    this.entriesChangedSubject.next();
  }

  clearAllTemporaryEntries(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.log.info('🧹 Todas las entradas temporales limpiadas');
    this.entriesChangedSubject.next();
  }

  // ✅ NUEVO: Limpiar entradas por tipo
  clearTemporaryEntriesByType(formType: string): void {
    const entries = this.getTemporaryEntries();
    Object.keys(entries).forEach((id) => {
      if (entries[id].formType === formType) {
        delete entries[id];
      }
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    this.log.info(`🧹 Entradas temporales de tipo ${formType} limpiadas`);
    this.entriesChangedSubject.next();
  }

  private getTemporaryEntries(): { [key: string]: TemporaryEntry } {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  hasAnyTemporaryData(): boolean {
    const entries = this.getTemporaryEntries();
    return Object.keys(entries).length > 0;
  }

  // ✅ NUEVO: Controlar si ya se mostró la notificación
  setRecoveryNotificationShown(formId: string): void {
    const shown = this.getRecoveryNotificationsShown();
    shown[formId] = true;
    localStorage.setItem(this.NOTIFICATION_SHOWN_KEY, JSON.stringify(shown));
  }

  isRecoveryNotificationShown(formId: string): boolean {
    const shown = this.getRecoveryNotificationsShown();
    return shown[formId] === true;
  }

  clearRecoveryNotification(formId: string): void {
    const shown = this.getRecoveryNotificationsShown();
    delete shown[formId];
    localStorage.setItem(this.NOTIFICATION_SHOWN_KEY, JSON.stringify(shown));
  }

  private getRecoveryNotificationsShown(): { [formId: string]: boolean } {
    const stored = localStorage.getItem(this.NOTIFICATION_SHOWN_KEY);
    return stored ? JSON.parse(stored) : {};
  }
}
