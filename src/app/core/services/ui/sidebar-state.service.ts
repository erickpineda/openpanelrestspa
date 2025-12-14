import { Injectable } from '@angular/core';
import { INavData } from '@coreui/angular';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  private readonly STORAGE_KEY = 'sidebar_expanded_items';
  private expandedItems: Set<string> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const items = JSON.parse(stored);
        if (Array.isArray(items)) {
          this.expandedItems = new Set(items);
        }
      } catch (e) {
        console.warn('Error loading sidebar state', e);
      }
    }
  }

  private saveState(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.expandedItems)));
  }

  public toggleItem(name: string, isOpen: boolean): void {
    if (isOpen) {
      this.expandedItems.add(name);
    } else {
      this.expandedItems.delete(name);
    }
    this.saveState();
  }

  public updateNavItems(items: INavData[], currentUrl: string): void {
    // 1. Identificar items activos por URL y asegurar que estén en expandedItems
    this.ensureActiveItemsExpanded(items, currentUrl);

    // 2. Aplicar el estado 'open' a los items basado en expandedItems
    this.applyStateToItems(items);
    
    // Guardar el estado actualizado (por si la URL forzó nuevas aperturas)
    this.saveState();
  }

  private ensureActiveItemsExpanded(items: INavData[], currentUrl: string): boolean {
    let hasActiveChild = false;

    for (const item of items) {
      // Verificar si este item es el activo o tiene un hijo activo
      const isItemActive = this.isRouteActive(item.url, currentUrl);
      let childActive = false;

      if (item.children && item.children.length > 0) {
        childActive = this.ensureActiveItemsExpanded(item.children, currentUrl);
      }

      if (isItemActive || childActive) {
        if (item.children && item.children.length > 0 && item.name) {
           this.expandedItems.add(item.name);
        }
        hasActiveChild = true;
      }
    }

    return hasActiveChild;
  }

  private applyStateToItems(items: INavData[]): void {
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        // Si está en el set, lo marcamos como abierto
        if (item.name && this.expandedItems.has(item.name)) {
          item.open = true;
        } else {
          // Si no está en el set, aseguramos que esté cerrado (opcional, depende del comportamiento deseado)
          // Si queremos persistencia estricta, debemos cerrar lo que no esté guardado.
          // Pero si CoreUI ya lo tiene abierto por alguna razón interna, esto lo forzará.
          item.open = false;
        }
        // Recursión
        this.applyStateToItems(item.children);
      }
    }
  }

  private isRouteActive(itemUrl: string | undefined, currentUrl: string): boolean {
    if (!itemUrl) return false;
    // Comparación simple, puede mejorarse con Router.isActive si se inyecta, 
    // pero string match suele ser suficiente para menús jerárquicos.
    // Ojo con query params y fragmentos.
    const urlTree = currentUrl.split('?')[0].split('#')[0];
    return urlTree === itemUrl || urlTree.startsWith(itemUrl + '/');
  }
}
