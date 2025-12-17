import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, distinctUntilChanged } from 'rxjs/operators';
import { INavItemEnhanced } from '../../../shared/types/navigation.types';

export interface ActiveSectionState {
  activeUrl: string;
  activeSectionId: string | null;
  activeItemId: string | null;
  breadcrumb: string[];
}

export interface MenuExpansionState {
  [itemId: string]: boolean;
}

export interface NavigationContext {
  currentSection: string | null;
  parentSection: string | null;
  relatedItems: INavItemEnhanced[];
  suggestedActions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ActiveSectionService {
  private readonly STORAGE_KEY = 'navigation-expansion-state';
  private readonly CONTEXT_STORAGE_KEY = 'navigation-context';

  private activeSectionSubject = new BehaviorSubject<ActiveSectionState>({
    activeUrl: '',
    activeSectionId: null,
    activeItemId: null,
    breadcrumb: []
  });

  private menuExpansionSubject = new BehaviorSubject<MenuExpansionState>({});
  private navigationContextSubject = new BehaviorSubject<NavigationContext>({
    currentSection: null,
    parentSection: null,
    relatedItems: [],
    suggestedActions: []
  });

  public activeSection$: Observable<ActiveSectionState> = this.activeSectionSubject.asObservable();
  public menuExpansion$: Observable<MenuExpansionState> = this.menuExpansionSubject.asObservable();
  public navigationContext$: Observable<NavigationContext> = this.navigationContextSubject.asObservable();

  private navigationItems: INavItemEnhanced[] = [];

  constructor(private router: Router) {
    this.initializeRouterListener();
    this.loadExpansionState();
  }

  /**
   * Inicializa el listener para cambios de ruta
   */
  private initializeRouterListener(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => (event as NavigationEnd).url),
        distinctUntilChanged()
      )
      .subscribe(url => {
        this.updateActiveSection(url);
        this.updateNavigationContext(url);
      });

    // Inicializar con la URL actual
    this.updateActiveSection(this.router.url);
    this.updateNavigationContext(this.router.url);
  }

  /**
   * Actualiza la sección activa basada en la URL
   */
  public updateActiveSection(url: string): void {
    const activeState = this.calculateActiveState(url);
    this.activeSectionSubject.next(activeState);

    // Auto-expandir la sección activa
    if (activeState.activeSectionId) {
      this.expandSection(activeState.activeSectionId);
    }
  }

  /**
   * Calcula el estado activo basado en la URL
   */
  private calculateActiveState(url: string): ActiveSectionState {
    const cleanUrl = this.cleanUrl(url);
    let activeSectionId: string | null = null;
    let activeItemId: string | null = null;
    const breadcrumb: string[] = [];

    // Buscar el elemento activo en la navegación
    for (const item of this.navigationItems) {
      if (item.title) {
        // Es un título de sección
        const sectionMatch = this.findActiveItemInSection(item, cleanUrl);
        if (sectionMatch) {
          activeSectionId = this.generateItemId(item);
          activeItemId = sectionMatch.itemId;
          breadcrumb.push(item.name || '');
          if (sectionMatch.breadcrumb.length > 0) {
            breadcrumb.push(...sectionMatch.breadcrumb);
          }
          break;
        }
      } else if (this.isUrlMatch(item.url, cleanUrl)) {
        // Es un elemento directo
        activeItemId = this.generateItemId(item);
        breadcrumb.push(item.name || '');
        break;
      }
    }

    return {
      activeUrl: cleanUrl,
      activeSectionId,
      activeItemId,
      breadcrumb
    };
  }

  /**
   * Busca el elemento activo dentro de una sección
   */
  private findActiveItemInSection(sectionItem: INavItemEnhanced, url: string): { itemId: string; breadcrumb: string[] } | null {
    const nextItems = this.getItemsAfterSection(sectionItem);
    
    for (const item of nextItems) {
      if (item.title) {
        // Llegamos a otra sección, detener búsqueda
        break;
      }

      // Verificar subelementos primero (más específicos)
      if (item.children) {
        for (const child of item.children) {
          if (this.isUrlMatch(child.url, url)) {
            return {
              itemId: this.generateItemId(child),
              breadcrumb: [item.name || '', child.name || '']
            };
          }
        }
      }

      // Verificar elemento principal después
      if (this.isUrlMatch(item.url, url)) {
        return {
          itemId: this.generateItemId(item),
          breadcrumb: [item.name || '']
        };
      }
    }

    return null;
  }

  /**
   * Obtiene los elementos que siguen a una sección
   */
  private getItemsAfterSection(sectionItem: INavItemEnhanced): INavItemEnhanced[] {
    const sectionIndex = this.navigationItems.indexOf(sectionItem);
    if (sectionIndex === -1) return [];

    const items: INavItemEnhanced[] = [];
    for (let i = sectionIndex + 1; i < this.navigationItems.length; i++) {
      const item = this.navigationItems[i];
      if (item.title) {
        // Llegamos a otra sección
        break;
      }
      items.push(item);
    }

    return items;
  }

  /**
   * Verifica si una URL coincide con la URL activa
   */
  private isUrlMatch(itemUrl: string | string[] | undefined, activeUrl: string): boolean {
    if (!itemUrl) return false;
    
    const url = Array.isArray(itemUrl) ? itemUrl.join('/') : itemUrl;
    const cleanItemUrl = this.cleanUrl(url);
    
    // Coincidencia exacta
    if (cleanItemUrl === activeUrl) return true;
    
    // Coincidencia de prefijo para rutas anidadas
    if (activeUrl.startsWith(cleanItemUrl + '/')) return true;
    
    return false;
  }

  /**
   * Limpia la URL removiendo parámetros y fragmentos
   */
  private cleanUrl(url: string): string {
    return url.split('?')[0].split('#')[0];
  }

  /**
   * Genera un ID único para un elemento de navegación
   */
  private generateItemId(item: INavItemEnhanced): string {
    if (item.url) {
      return Array.isArray(item.url) ? item.url.join('-') : item.url.replace(/[^a-zA-Z0-9]/g, '-');
    }
    return item.name?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'unknown';
  }

  /**
   * Actualiza el contexto de navegación
   */
  private updateNavigationContext(url: string): void {
    const activeState = this.activeSectionSubject.value;
    const context = this.calculateNavigationContext(url, activeState);
    this.navigationContextSubject.next(context);
  }

  /**
   * Calcula el contexto de navegación
   */
  private calculateNavigationContext(url: string, activeState: ActiveSectionState): NavigationContext {
    const relatedItems: INavItemEnhanced[] = [];
    const suggestedActions: string[] = [];
    
    // Encontrar elementos relacionados en la misma sección
    if (activeState.activeSectionId) {
      const sectionItems = this.getItemsInSection(activeState.activeSectionId);
      relatedItems.push(...sectionItems.filter(item => !this.isUrlMatch(item.url, url)));
    }

    // Generar acciones sugeridas basadas en la ruta actual
    suggestedActions.push(...this.generateSuggestedActions(url));

    return {
      currentSection: activeState.activeSectionId,
      parentSection: this.findParentSection(activeState.activeSectionId),
      relatedItems,
      suggestedActions
    };
  }

  /**
   * Obtiene los elementos de una sección específica
   */
  private getItemsInSection(sectionId: string): INavItemEnhanced[] {
    const sectionItem = this.navigationItems.find(item => 
      item.title && this.generateItemId(item) === sectionId
    );
    
    if (!sectionItem) return [];
    
    return this.getItemsAfterSection(sectionItem);
  }

  /**
   * Encuentra la sección padre de una sección dada
   */
  private findParentSection(sectionId: string | null): string | null {
    // En esta implementación simple, no hay secciones anidadas
    // Pero se puede extender para soportar jerarquías más complejas
    return null;
  }

  /**
   * Genera acciones sugeridas basadas en la URL actual
   */
  private generateSuggestedActions(url: string): string[] {
    const actions: string[] = [];
    
    if (url.includes('/entradas')) {
      actions.push('Nueva Entrada', 'Ver Borradores', 'Gestionar Categorías');
    } else if (url.includes('/usuarios')) {
      actions.push('Nuevo Usuario', 'Gestionar Roles', 'Ver Permisos');
    } else if (url.includes('/comentarios')) {
      actions.push('Moderar Comentarios', 'Ver Reportados', 'Configurar Filtros');
    } else if (url.includes('/dashboard')) {
      actions.push('Ver Estadísticas', 'Generar Reporte', 'Configurar Widgets');
    } else {
      // Fallback para otras URLs
      actions.push('Ver Estadísticas', 'Generar Reporte', 'Configurar Widgets');
    }
    
    return actions;
  }

  /**
   * Expande una sección del menú
   */
  public expandSection(itemId: string): void {
    const currentState = this.menuExpansionSubject.value;
    const newState = { ...currentState, [itemId]: true };
    this.menuExpansionSubject.next(newState);
    this.saveExpansionState(newState);
  }

  /**
   * Colapsa una sección del menú
   */
  public collapseSection(itemId: string): void {
    const currentState = this.menuExpansionSubject.value;
    const newState = { ...currentState, [itemId]: false };
    this.menuExpansionSubject.next(newState);
    this.saveExpansionState(newState);
  }

  /**
   * Alterna el estado de expansión de una sección
   */
  public toggleSection(itemId: string): void {
    const currentState = this.menuExpansionSubject.value;
    const isExpanded = currentState[itemId] || false;
    
    if (isExpanded) {
      this.collapseSection(itemId);
    } else {
      this.expandSection(itemId);
    }
  }

  /**
   * Verifica si una sección está expandida
   */
  public isSectionExpanded(itemId: string): boolean {
    const currentState = this.menuExpansionSubject.value;
    return currentState[itemId] || false;
  }

  /**
   * Guarda el estado de expansión en localStorage
   */
  private saveExpansionState(state: MenuExpansionState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Could not save navigation expansion state:', error);
    }
  }

  /**
   * Carga el estado de expansión desde localStorage
   */
  private loadExpansionState(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved) as MenuExpansionState;
        this.menuExpansionSubject.next(state);
      }
    } catch (error) {
      console.warn('Could not load navigation expansion state:', error);
    }
  }

  /**
   * Establece los elementos de navegación
   */
  public setNavigationItems(items: INavItemEnhanced[]): void {
    this.navigationItems = items;
    // Recalcular el estado activo con los nuevos elementos
    this.updateActiveSection(this.router.url);
  }

  /**
   * Obtiene el estado activo actual
   */
  public getCurrentActiveState(): ActiveSectionState {
    return this.activeSectionSubject.value;
  }

  /**
   * Obtiene el estado de expansión actual
   */
  public getCurrentExpansionState(): MenuExpansionState {
    return this.menuExpansionSubject.value;
  }

  /**
   * Obtiene el contexto de navegación actual
   */
  public getCurrentNavigationContext(): NavigationContext {
    return this.navigationContextSubject.value;
  }

  /**
   * Limpia el estado de expansión guardado
   */
  public clearExpansionState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.menuExpansionSubject.next({});
    } catch (error) {
      console.warn('Could not clear navigation expansion state:', error);
    }
  }

  /**
   * Verifica si un elemento está activo
   */
  public isItemActive(item: INavItemEnhanced): boolean {
    const activeState = this.activeSectionSubject.value;
    const itemId = this.generateItemId(item);
    return activeState.activeItemId === itemId;
  }

  /**
   * Verifica si una sección está activa
   */
  public isSectionActive(item: INavItemEnhanced): boolean {
    const activeState = this.activeSectionSubject.value;
    const sectionId = this.generateItemId(item);
    return activeState.activeSectionId === sectionId;
  }

  /**
   * Obtiene el breadcrumb actual
   */
  public getCurrentBreadcrumb(): string[] {
    return this.activeSectionSubject.value.breadcrumb;
  }
}