import { Injectable } from '@angular/core';
import { INavData } from '@coreui/angular';

@Injectable({
  providedIn: 'root',
})
export class SidebarStateService {
  private readonly STORAGE_KEY = 'sidebar_expanded_items';
  private expandedItems: Set<string> = new Set();
  private loadedFromStorage = false;

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
    this.loadedFromStorage = !!stored;
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
    this.ensureActiveItemsExpanded(items, currentUrl);

    if (!this.loadedFromStorage && this.expandedItems.size === 0) {
      this.expandAllGroups(items);
      this.saveState();
    }

    this.expandTaxonomiaPattern(items, currentUrl);
    this.expandRolesPermisosPattern(items, currentUrl);
    this.applyStateToItems(items);
    this.saveState();
  }

  private ensureActiveItemsExpanded(items: INavData[], currentUrl: string): boolean {
    let hasActiveChild = false;

    for (const item of items) {
      // Verificar si este item es el activo o tiene un hijo activo
      const isItemActive = this.isRouteActive(
        typeof item.url === 'string' ? item.url : undefined,
        currentUrl
      );
      let childActive = false;

      if (item.children && item.children.length > 0) {
        childActive = this.ensureActiveItemsExpanded(item.children, currentUrl);
      }

      if (isItemActive || childActive) {
        if (item.children && item.children.length > 0 && item.name) {
          this.expandedItems.add(item.name);
          this.expandChildGroups(item);
        }
        hasActiveChild = true;
      }
    }

    return hasActiveChild;
  }

  private applyStateToItems(items: INavData[]): void {
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        if (item.name && this.expandedItems.has(item.name)) {
          (item as any).open = true;
        } else {
          (item as any).open = false;
        }
        this.applyStateToItems(item.children);
      }
    }
  }

  private isRouteActive(itemUrl: string | undefined, currentUrl: string): boolean {
    if (!itemUrl) return false;
    const urlTree = currentUrl.split('?')[0].split('#')[0];
    return urlTree === itemUrl || urlTree.startsWith(itemUrl + '/');
  }

  private expandAllGroups(items: INavData[]): void {
    for (const item of items) {
      if (item.children && item.children.length > 0 && item.name) {
        this.expandedItems.add(item.name);
        this.expandAllGroups(item.children);
      }
    }
  }

  private expandChildGroups(item: INavData): void {
    if (!item.children || item.children.length === 0) return;
    for (const child of item.children) {
      if (child.children && child.children.length > 0 && child.name) {
        this.expandedItems.add(child.name);
        this.expandChildGroups(child);
      }
    }
  }

  private expandTaxonomiaPattern(items: INavData[], currentUrl: string): void {
    const isEntradasContext =
      currentUrl.startsWith('/admin/control/entradas') ||
      currentUrl.startsWith('/admin/control/taxonomia') ||
      currentUrl.startsWith('/admin/control/etiquetas') ||
      currentUrl.startsWith('/admin/control/categorias');

    if (!isEntradasContext) return;

    const stack: INavData[] = [...items];
    while (stack.length) {
      const item = stack.pop()!;
      if (item.name === 'MENU.ENTRIES' && item.children && item.children.length > 0) {
        this.expandedItems.add(item.name);
        for (const child of item.children) {
          if (child.name === 'MENU.TAXONOMY') {
            this.expandedItems.add(child.name);
          }
        }
      }
      if (item.children && item.children.length > 0) {
        stack.push(...item.children);
      }
    }
  }

  private expandRolesPermisosPattern(items: INavData[], currentUrl: string): void {
    const isRolesContext =
      currentUrl.startsWith('/admin/control/gestion/roles') ||
      currentUrl.startsWith('/admin/control/gestion/privilegios');

    if (!isRolesContext) return;

    const stack: INavData[] = [...items];
    while (stack.length) {
      const item = stack.pop()!;
      if (item.name === 'MENU.ROLES_AND_PERMISSIONS' && item.children && item.children.length > 0) {
        this.expandedItems.add(item.name);
        return;
      }
      if (item.children && item.children.length > 0) {
        stack.push(...item.children);
      }
    }
  }
}
