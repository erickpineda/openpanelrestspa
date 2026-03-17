import { Injectable } from '@angular/core';
import { INavData } from '@coreui/angular';
import { NavigationUtils } from '../../../shared/utils/navigation.utils';

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

  public toggleItem(itemId: string, isOpen: boolean): void {
    if (isOpen) {
      this.expandedItems.add(itemId);
    } else {
      this.expandedItems.delete(itemId);
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
        if (item.children && item.children.length > 0) {
          const id = NavigationUtils.generateItemId(item as any);
          this.expandedItems.add(id);
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
        const id = NavigationUtils.generateItemId(item as any);
        if (this.expandedItems.has(id)) {
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
      if (item.children && item.children.length > 0) {
        const id = NavigationUtils.generateItemId(item as any);
        this.expandedItems.add(id);
        this.expandAllGroups(item.children);
      }
    }
  }

  private expandChildGroups(item: INavData): void {
    if (!item.children || item.children.length === 0) return;
    for (const child of item.children) {
      if (child.children && child.children.length > 0) {
        const id = NavigationUtils.generateItemId(child as any);
        this.expandedItems.add(id);
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
      if (typeof item.url === 'string' && item.url === '/admin/control/entradas' && item.children && item.children.length > 0) {
        const id = NavigationUtils.generateItemId(item as any);
        this.expandedItems.add(id);
        for (const child of item.children) {
          if (typeof child.url === 'string' && child.url === '/admin/control/taxonomia') {
            const childId = NavigationUtils.generateItemId(child as any);
            this.expandedItems.add(childId);
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
      if (typeof item.url === 'string' && item.url === '/admin/control/gestion/roles' && item.children && item.children.length > 0) {
        const id = NavigationUtils.generateItemId(item as any);
        this.expandedItems.add(id);
        return;
      }
      if (item.children && item.children.length > 0) {
        stack.push(...item.children);
      }
    }
  }
}
