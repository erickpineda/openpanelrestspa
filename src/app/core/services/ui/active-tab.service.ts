import { Injectable } from '@angular/core';
import { TokenStorageService } from '../auth/token-storage.service';
import { LoggerService } from '../logger.service';

@Injectable({ providedIn: 'root' })
export class ActiveTabService {
  private readonly STORAGE_KEY = 'op_active_tabs';

  constructor(
    private tokenStorage: TokenStorageService,
    private log: LoggerService
  ) {}

  /**
   * Registra que esta pestaña tiene activa una funcionalidad específica (ej. 'create-entry').
   * Usa localStorage para persistencia entre pestañas.
   */
  public registerActiveFeature(feature: string): void {
    const tabId = this.tokenStorage.getOrCreateTabId();
    const map = this.getMap();
    
    if (!map[tabId]) {
      map[tabId] = [];
    }
    
    if (!map[tabId].includes(feature)) {
      map[tabId].push(feature);
      this.saveMap(map);
      this.log.info(`ActiveTabService: Feature '${feature}' registrada en pestaña ${tabId}`);
    }
  }

  /**
   * Elimina el registro de una funcionalidad para esta pestaña.
   */
  public unregisterActiveFeature(feature: string): void {
    const tabId = this.tokenStorage.getOrCreateTabId();
    const map = this.getMap();
    
    if (map[tabId]) {
      const index = map[tabId].indexOf(feature);
      if (index > -1) {
        map[tabId].splice(index, 1);
        // Si no quedan features, limpiar la entrada de la pestaña
        if (map[tabId].length === 0) {
          delete map[tabId];
        }
        this.saveMap(map);
        this.log.info(`ActiveTabService: Feature '${feature}' eliminada de pestaña ${tabId}`);
      }
    }
  }

  /**
   * Verifica si la feature está activa en la pestaña ACTUAL.
   */
  public isFeatureActiveInCurrentTab(feature: string): boolean {
    const tabId = this.tokenStorage.getOrCreateTabId();
    const map = this.getMap();
    return map[tabId]?.includes(feature) || false;
  }

  /**
   * Verifica si la feature está activa en CUALQUIER pestaña (incluida la actual).
   */
  public isFeatureActiveAnywhere(feature: string): boolean {
    const map = this.getMap();
    return Object.values(map).some(features => features.includes(feature));
  }

  /**
   * Verifica si la feature está activa en OTRA pestaña (excluyendo la actual).
   */
  public isFeatureActiveInOtherTab(feature: string): boolean {
    const currentTabId = this.tokenStorage.getOrCreateTabId();
    const map = this.getMap();
    return Object.keys(map).some(tabId => tabId !== currentTabId && map[tabId].includes(feature));
  }

  /**
   * Limpia todas las features de esta pestaña (útil al cerrar/recargar).
   */
  public clearCurrentTab(): void {
    const tabId = this.tokenStorage.getOrCreateTabId();
    const map = this.getMap();
    if (map[tabId]) {
      delete map[tabId];
      this.saveMap(map);
    }
  }

  // Helpers privados
  private getMap(): { [tabId: string]: string[] } {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  private saveMap(map: { [tabId: string]: string[] }): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(map));
    } catch (e) {
      console.error('ActiveTabService: Error saving to localStorage', e);
    }
  }
}
