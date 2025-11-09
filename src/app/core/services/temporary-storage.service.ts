// temporary-storage.service.ts
import { Injectable } from '@angular/core';

export interface TemporaryEntry {
  formData: any;
  timestamp: string;
  formId: string;
  attemptedSave: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TemporaryStorageService {
  private readonly STORAGE_KEY = 'temporary-entries';
  private readonly NOTIFICATION_SHOWN_KEY = 'recovery-notification-shown';

  constructor() { }

  saveTemporaryEntry(formId: string, formData: any): void {
    const entries = this.getTemporaryEntries();
    
    const temporaryEntry: TemporaryEntry = {
      formData,
      timestamp: new Date().toISOString(),
      formId,
      attemptedSave: true
    };

    entries[formId] = temporaryEntry;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    
    console.log('💾 Entrada guardada temporalmente:', formId);
  }

  getTemporaryEntry(formId: string): TemporaryEntry | null {
    const entries = this.getTemporaryEntries();
    return entries[formId] || null;
  }

  getAllTemporaryEntries(): TemporaryEntry[] {
    const entries = this.getTemporaryEntries();
    return Object.values(entries);
  }

  removeTemporaryEntry(formId: string): void {
    const entries = this.getTemporaryEntries();
    delete entries[formId];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    console.log('🧹 Entrada temporal removida:', formId);
  }

  clearAllTemporaryEntries(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🧹 Todas las entradas temporales limpiadas');
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