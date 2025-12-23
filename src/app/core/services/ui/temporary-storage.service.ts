// temporary-storage.service.ts
import { Injectable } from '@angular/core';
import { LoggerService } from '../logger.service';

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
  private readonly STORAGE_KEY = 'temporary-entries';
  private readonly NOTIFICATION_SHOWN_KEY = 'recovery-notification-shown';

  constructor(private log: LoggerService) {}

  // ✅ NUEVO: Generar ID único
  private generateId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ✅ MODIFICADO: Ahora acepta un objeto completo de entrada temporal
  saveTemporaryEntry(entry: Omit<TemporaryEntry, 'id'>): string {
    const entries = this.getTemporaryEntries();

    const newEntry: TemporaryEntry = {
      ...entry,
      id: this.generateId(),
    };

    entries[newEntry.id] = newEntry;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));

    this.log.info('💾 Entrada temporal guardada:', newEntry.id, newEntry.title);
    return newEntry.id;
  }

  getTemporaryEntry(id: string): TemporaryEntry | null {
    const entries = this.getTemporaryEntries();
    return entries[id] || null;
  }

  // ✅ NUEVO: Obtener entradas por tipo
  getTemporaryEntriesByType(formType: string): TemporaryEntry[] {
    const entries = this.getTemporaryEntries();
    return Object.values(entries).filter(
      (entry) => entry.formType === formType,
    );
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
  }

  clearAllTemporaryEntries(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.log.info('🧹 Todas las entradas temporales limpiadas');
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
  }

  private getTemporaryEntries(): { [key: string]: TemporaryEntry } {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
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
