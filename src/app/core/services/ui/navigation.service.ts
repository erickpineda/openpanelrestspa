import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, distinctUntilChanged, catchError, switchMap, debounceTime } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  INavigationService,
  INavItemEnhanced,
  UserRole,
  IContextualAction,
  NavigationConfig,
  NavigationSection,
} from '../../../shared/types/navigation.types';
import { NavigationUtils } from '../../../shared/utils/navigation.utils';
import { NavigationValidators } from '../../../shared/validators/navigation.validators';
import { NavigationConstants } from '../../../shared/constants/navigation.constants';
import { SidebarStateService } from './sidebar-state.service';
import { ActiveSectionService } from './active-section.service';
import { ProgrammaticNavigationConfigService } from './programmatic-navigation-config.service';
import { NavigationPerformanceService } from './navigation-performance.service';
import { BadgeCounterService } from './badge-counter.service';

/**
 * Códigos de error específicos para el servicio de navegación
 */
export enum NavigationErrorCodes {
  INVALID_STRUCTURE = 'NAV_001',
  PERMISSION_DENIED = 'NAV_002',
  COUNTER_SERVICE_UNAVAILABLE = 'NAV_003',
  CONFIGURATION_INVALID = 'NAV_004',
  RESPONSIVE_ADAPTATION_FAILED = 'NAV_005',
}

/**
 * Servicio de navegación mejorado que implementa funcionalidades avanzadas
 * para el sidebar de administración con manejo robusto de errores
 */
@Injectable({
  providedIn: 'root',
})
export class NavigationService implements INavigationService {
  private readonly navigationItemsSubject = new BehaviorSubject<INavItemEnhanced[]>([]);
  private readonly badgeCountsSubject = new BehaviorSubject<Map<string, number>>(new Map());
  private readonly contextualActionsSubject = new BehaviorSubject<Map<string, IContextualAction[]>>(
    new Map()
  );
  private readonly currentUserRoleSubject = new BehaviorSubject<UserRole>(UserRole.ANONYMOUS);
  private readonly activeSectionSubject = new BehaviorSubject<string>('');
  private readonly errorLogSubject = new BehaviorSubject<any[]>([]);

  // Configuración base de navegación
  private baseNavigationConfig: NavigationConfig | null = null;
  private permissionErrors: Map<string, number> = new Map();

  constructor(
    private router: Router,
    private sidebarStateService: SidebarStateService,
    private activeSectionService: ActiveSectionService,
    private programmaticConfigService: ProgrammaticNavigationConfigService,
    private performanceService: NavigationPerformanceService,
    private badgeCounterService: BadgeCounterService
  ) {
    this.initializeNavigation();
    this.initializePerformanceOptimizations();
    this.initializeBadgeCounters();
  }

  /**
   * Inicializa y conecta el servicio de contadores de badges
   */
  private initializeBadgeCounters(): void {
    // Inicializar los contadores en el servicio origen
    this.badgeCounterService.initializeCounters();

    // Suscribirse a cambios en los contadores y mapearlos a los items de navegación
    combineLatest([
      this.badgeCounterService.getAllCounters(),
      this.navigationItemsSubject.asObservable(),
    ])
      .pipe(debounceTime(200))
      .subscribe(([counters, items]) => {
        const newBadgeCounts = new Map<string, number>();

        const processItems = (navItems: INavItemEnhanced[]) => {
          for (const item of navItems) {
            if (item.dynamicBadge) {
              const itemId = NavigationUtils.generateItemId(item);
              const serviceKey = this.mapMethodToKey(item.dynamicBadge.method);

              if (serviceKey && counters.has(serviceKey)) {
                const count = counters.get(serviceKey)!;
                newBadgeCounts.set(itemId, count);
              }
            }

            if (item.children && item.children.length > 0) {
              processItems(item.children);
            }
          }
        };

        processItems(items);

        // Solo actualizar si hay cambios para evitar bucles infinitos
        // (aunque distinctUntilChanged downstream debería manejarlo)
        this.badgeCountsSubject.next(newBadgeCounts);
      });
  }

  /**
   * Mapea el nombre del método de configuración a la clave interna del servicio de badges
   */
  private mapMethodToKey(methodName: string): string | null {
    const mapping: { [key: string]: string } = {
      getDraftEntriesCount: 'draft-entries',
      getPendingUsersCount: 'pending-users',
      getUnmoderatedCommentsCount: 'unmoderated-comments',
      getSystemAlertsCount: 'system-alerts',
      getMyDraftsCount: 'my-drafts',
    };

    return mapping[methodName] || null;
  }

  /**
   * Obtiene los elementos de navegación filtrados por rol de usuario con manejo de errores y optimizaciones de rendimiento
   */
  getNavigationItems(userRole: UserRole): Observable<INavItemEnhanced[]> {
    this.currentUserRoleSubject.next(userRole);

    return combineLatest([
      this.navigationItemsSubject.asObservable(),
      this.badgeCountsSubject.asObservable(),
      this.contextualActionsSubject.asObservable(),
      this.programmaticConfigService.getConfigurationChanges(),
    ]).pipe(
      map(([items, badgeCounts, contextualActions, programmaticConfigs]) => {
        try {
          // Validar entrada
          if (!Array.isArray(items)) {
            this.logPermissionError(
              userRole,
              NavigationErrorCodes.INVALID_STRUCTURE,
              'Navigation items is not an array'
            );
            return this.getFallbackNavigationItems(userRole);
          }

          // Aplicar configuraciones programáticas primero
          let configuredItems = this.programmaticConfigService.applyDynamicConfigurations(items);

          // Aplicar badges dinámicos y acciones contextuales con manejo de errores
          configuredItems = this.safeApplyDynamicContent(
            configuredItems,
            badgeCounts,
            contextualActions
          );

          return configuredItems;
        } catch (error) {
          this.logPermissionError(userRole, NavigationErrorCodes.CONFIGURATION_INVALID, error);
          return this.getFallbackNavigationItems(userRole);
        }
      }),
      // Usar el servicio de rendimiento para optimizaciones
      switchMap((items) => this.performanceService.getOptimizedNavigationItems(items, userRole)),
      catchError((error) => {
        this.logPermissionError(userRole, NavigationErrorCodes.CONFIGURATION_INVALID, error);
        return of(this.getFallbackNavigationItems(userRole));
      }),
      distinctUntilChanged()
    );
  }

  /**
   * Actualiza el contador de un badge dinámico con optimización de rendimiento
   */
  updateBadgeCount(itemId: string, count: number): void {
    const currentCounts = this.badgeCountsSubject.value;
    const newCounts = new Map(currentCounts);
    newCounts.set(itemId, count);

    // Usar optimización de badges del servicio de rendimiento
    this.performanceService.optimizeBadgeUpdates(of(newCounts)).subscribe((optimizedCounts) => {
      this.badgeCountsSubject.next(optimizedCounts);
    });
  }

  /**
   * Alterna el estado de expansión de una sección
   */
  toggleSection(sectionId: string): void {
    // Usar el ActiveSectionService para manejar la expansión
    this.activeSectionService.toggleSection(sectionId);

    // También actualizar el servicio existente para compatibilidad
    const isCurrentlyExpanded = this.activeSectionService.isSectionExpanded(sectionId);
    this.sidebarStateService.toggleItem(sectionId, isCurrentlyExpanded);
  }

  /**
   * Obtiene la sección activa actual
   */
  getActiveSection(): string {
    const activeState = this.activeSectionService.getCurrentActiveState();
    return activeState.activeSectionId || '';
  }

  /**
   * Establece acciones contextuales para un elemento específico
   */
  setContextualActions(itemId: string, actions: IContextualAction[]): void {
    const currentActions = this.contextualActionsSubject.value;
    const newActions = new Map(currentActions);
    newActions.set(itemId, actions);
    this.contextualActionsSubject.next(newActions);
  }

  /**
   * Filtra elementos por permisos (implementación de la interfaz)
   */
  filterByPermissions(items: INavItemEnhanced[], userRole: UserRole): INavItemEnhanced[] {
    return NavigationUtils.filterByPermissions(items, userRole);
  }

  /**
   * Carga la configuración de navegación desde una fuente con manejo de errores
   */
  loadNavigationConfig(config: NavigationConfig): void {
    try {
      // Validar la configuración antes de cargarla
      const validationResult = NavigationValidators.validateNavigationConfig(config);

      if (!validationResult.isValid) {
        this.logConfigurationError(
          NavigationErrorCodes.CONFIGURATION_INVALID,
          'Invalid navigation configuration',
          validationResult.errors
        );

        // Usar configuración de fallback
        this.baseNavigationConfig = this.getFallbackConfiguration();
        this.updateNavigationItems();
        return;
      }

      if (validationResult.warnings.length > 0) {
        console.warn('Navigation configuration warnings:', validationResult.warnings);
      }

      this.baseNavigationConfig = config;
      this.updateNavigationItems();
    } catch (error) {
      this.logConfigurationError(
        NavigationErrorCodes.CONFIGURATION_INVALID,
        'Error loading navigation configuration',
        error
      );

      // Usar configuración de fallback en caso de error
      this.baseNavigationConfig = this.getFallbackConfiguration();
      this.updateNavigationItems();
    }
  }

  /**
   * Actualiza la sección activa basada en la URL actual
   */
  updateActiveSection(currentUrl: string): void {
    const currentItems = this.navigationItemsSubject.value;

    // Usar el ActiveSectionService para manejar la detección de sección activa
    this.activeSectionService.setNavigationItems(currentItems);
    this.activeSectionService.updateActiveSection(currentUrl);

    // Mantener compatibilidad con el servicio existente
    this.sidebarStateService.updateNavItems(currentItems, currentUrl);
  }

  /**
   * Obtiene elementos que requieren badges dinámicos
   */
  getItemsWithDynamicBadges(): Observable<INavItemEnhanced[]> {
    return this.navigationItemsSubject
      .asObservable()
      .pipe(map((items) => NavigationUtils.findItemsWithDynamicBadges(items)));
  }

  /**
   * Aplica configuración responsiva basada en el ancho de pantalla
   */
  applyResponsiveConfiguration(screenWidth: number): Observable<INavItemEnhanced[]> {
    return this.navigationItemsSubject
      .asObservable()
      .pipe(map((items) => NavigationUtils.applyResponsiveConfig(items, screenWidth)));
  }

  /**
   * Obtiene el rol de usuario actual
   */
  getCurrentUserRole(): Observable<UserRole> {
    return this.currentUserRoleSubject.asObservable();
  }

  /**
   * Inicializa la navegación con configuración por defecto
   */
  private initializeNavigation(): void {
    // Configuración por defecto si no se ha cargado ninguna
    const defaultConfig: NavigationConfig = {
      sections: [],
      theme: NavigationConstants.DEFAULT_THEME,
      userPreferences: {
        expandedSections: [],
        collapsedSections: [],
        favoriteItems: [],
      },
    };

    this.baseNavigationConfig = defaultConfig;
    this.updateNavigationItems();

    // Suscribirse a cambios de ruta para actualizar la sección activa
    this.router.events.subscribe(() => {
      this.updateActiveSection(this.router.url);
    });
  }

  /**
   * Actualiza los elementos de navegación directamente
   */
  public setNavigationItems(items: INavItemEnhanced[]): void {
    this.navigationItemsSubject.next(items);
  }

  /**
   * Actualiza los elementos de navegación basado en la configuración actual
   */
  private updateNavigationItems(): void {
    if (!this.baseNavigationConfig) return;

    // Convertir secciones a elementos de navegación planos
    const items = this.convertSectionsToNavItems(this.baseNavigationConfig.sections);
    this.navigationItemsSubject.next(items);
  }

  /**
   * Convierte secciones de configuración a elementos de navegación
   */
  private convertSectionsToNavItems(sections: NavigationSection[]): INavItemEnhanced[] {
    const items: INavItemEnhanced[] = [];

    // Ordenar secciones por prioridad antes de convertir
    const sortedSections = [...sections].sort((a, b) => b.priority - a.priority);

    for (const section of sortedSections) {
      // Agregar título de sección si tiene elementos
      if (section.items.length > 0) {
        const sectionTitle: INavItemEnhanced = {
          title: true,
          name: section.title,
          requiredRoles: section.requiredRoles, // Aplicar roles de la sección al título
          priority: section.priority, // Agregar prioridad al título de sección
        };
        items.push(sectionTitle);

        // Agregar elementos de la sección con roles heredados
        for (const item of section.items) {
          const navItem = this.convertNavigationItem(item);
          // Si la sección tiene roles específicos y el item no, heredar los roles de la sección
          if (section.requiredRoles.length > 0 && !navItem.requiredRoles) {
            navItem.requiredRoles = section.requiredRoles;
          }
          items.push(navItem);
        }
      }
    }

    return items;
  }

  /**
   * Convierte un elemento de configuración a INavItemEnhanced
   */
  private convertNavigationItem(item: any): INavItemEnhanced {
    const navItem: INavItemEnhanced = {
      name: item.name,
      url: item.url,
      iconComponent: item.icon ? { name: item.icon } : undefined,
      priority: item.priority || 0,
    };

    // Agregar badge si existe
    if (item.badge) {
      navItem.badge = {
        color: item.badge.color || 'info',
        text: item.badge.text,
      };
    }

    // Agregar children si existen
    if (item.children && item.children.length > 0) {
      navItem.children = item.children.map((child: any) => this.convertNavigationItem(child));
    }

    return navItem;
  }

  /**
   * Aplica contenido dinámico (badges y acciones contextuales) a los elementos
   * Optimizada para preservar referencias de objetos si no hay cambios
   */
  private applyDynamicContent(
    items: INavItemEnhanced[],
    badgeCounts: Map<string, number>,
    contextualActions: Map<string, IContextualAction[]>
  ): INavItemEnhanced[] {
    let hasChanges = false;

    const newItems = items.map((item) => {
      const itemId = NavigationUtils.generateItemId(item);
      let itemChanged = false;
      let newBadge = item.badge;
      let newActions = item.contextualActions;
      let newChildren = item.children;

      // 1. Badge Logic
      if (item.dynamicBadge && badgeCounts.has(itemId)) {
        const count = badgeCounts.get(itemId)!;
        if (count > 0) {
          const calculatedBadge = {
            color: this.getBadgeColorByCount(count),
            text: count.toString(),
          };
          // Comparar si el badge realmente cambió
          if (
            !item.badge ||
            item.badge.text !== calculatedBadge.text ||
            item.badge.color !== calculatedBadge.color
          ) {
            newBadge = calculatedBadge;
            itemChanged = true;
          }
        } else {
          // Si el contador es 0, ocultar el badge
          if (item.badge) {
            newBadge = undefined;
            itemChanged = true;
          }
        }
      }

      // 2. Contextual Actions Logic
      if (contextualActions.has(itemId)) {
        const actions = contextualActions.get(itemId);
        if (item.contextualActions !== actions) {
          newActions = actions;
          itemChanged = true;
        }
      }

      // 3. Children Logic (Recursive)
      if (item.children && item.children.length > 0) {
        const updatedChildren = this.applyDynamicContent(
          item.children,
          badgeCounts,
          contextualActions
        );
        if (updatedChildren !== item.children) {
          newChildren = updatedChildren;
          itemChanged = true;
        }
      }

      if (itemChanged) {
        hasChanges = true;
        const updatedItem = { ...item };
        if (newBadge) updatedItem.badge = newBadge;
        else delete updatedItem.badge;

        if (newActions) updatedItem.contextualActions = newActions;

        if (newChildren) updatedItem.children = newChildren;

        return updatedItem;
      }

      return item;
    });

    return hasChanges ? newItems : items;
  }

  /**
   * Determina el color del badge basado en el contador
   */
  private getBadgeColorByCount(count: number): string {
    if (count === 0) return 'secondary';
    if (count <= 5) return 'info';
    if (count <= 10) return 'warning';
    return 'danger';
  }

  /**
   * Encuentra la sección activa basada en la URL
   */
  private findActiveSectionByUrl(items: INavItemEnhanced[], currentUrl: string): string {
    for (const item of items) {
      if (NavigationUtils.isItemActive(item, currentUrl)) {
        // Si es un título de sección, devolver su nombre
        if (item.title) {
          return item.name || '';
        }

        // Si es un elemento con children activos, buscar en la estructura
        if (item.children && item.children.length > 0) {
          const childSection = this.findActiveSectionByUrl(item.children, currentUrl);
          if (childSection) return childSection;
        }

        return item.name || '';
      }
    }

    return '';
  }

  /**
   * Verifica si una sección está expandida
   */
  private isSectionExpanded(sectionId: string): boolean {
    return this.activeSectionService.isSectionExpanded(sectionId);
  }

  /**
   * Obtiene el estado activo actual de la navegación
   */
  getActiveState(): Observable<any> {
    return this.activeSectionService.activeSection$;
  }

  /**
   * Obtiene el estado de expansión de menús
   */
  getMenuExpansionState(): Observable<any> {
    return this.activeSectionService.menuExpansion$;
  }

  /**
   * Obtiene el contexto de navegación actual
   */
  getNavigationContext(): Observable<any> {
    return this.activeSectionService.navigationContext$;
  }

  /**
   * Verifica si un elemento está activo
   */
  isItemActive(item: INavItemEnhanced): boolean {
    return this.activeSectionService.isItemActive(item);
  }

  /**
   * Verifica si una sección está activa
   */
  isSectionActive(item: INavItemEnhanced): boolean {
    return this.activeSectionService.isSectionActive(item);
  }

  /**
   * Obtiene el breadcrumb actual
   */
  getCurrentBreadcrumb(): string[] {
    return this.activeSectionService.getCurrentBreadcrumb();
  }

  /**
   * Expande una sección específica
   */
  expandSection(sectionId: string): void {
    this.activeSectionService.expandSection(sectionId);
  }

  /**
   * Colapsa una sección específica
   */
  collapseSection(sectionId: string): void {
    this.activeSectionService.collapseSection(sectionId);
  }

  /**
   * Limpia el estado de expansión guardado
   */
  clearExpansionState(): void {
    this.activeSectionService.clearExpansionState();
  }

  /**
   * Filtra elementos por permisos con manejo seguro de errores
   */
  private safeFilterByPermissions(
    items: INavItemEnhanced[],
    userRole: UserRole
  ): INavItemEnhanced[] {
    try {
      return NavigationUtils.filterByPermissions(items, userRole);
    } catch (error) {
      this.logPermissionError(userRole, NavigationErrorCodes.PERMISSION_DENIED, error);
      // Retornar solo elementos básicos sin restricciones
      return items.filter((item) => !item.requiredRoles || item.requiredRoles.length === 0);
    }
  }

  /**
   * Aplica contenido dinámico con manejo seguro de errores
   */
  private safeApplyDynamicContent(
    items: INavItemEnhanced[],
    badgeCounts: Map<string, number>,
    contextualActions: Map<string, IContextualAction[]>
  ): INavItemEnhanced[] {
    try {
      return this.applyDynamicContent(items, badgeCounts, contextualActions);
    } catch (error) {
      this.logConfigurationError(
        NavigationErrorCodes.COUNTER_SERVICE_UNAVAILABLE,
        'Error applying dynamic content',
        error
      );
      // Retornar elementos sin contenido dinámico
      return items;
    }
  }

  /**
   * Registra errores de permisos
   */
  private logPermissionError(
    userRole: UserRole,
    errorCode: NavigationErrorCodes,
    error: any
  ): void {
    const errorKey = `${userRole}-${errorCode}`;
    const currentCount = this.permissionErrors.get(errorKey) || 0;
    this.permissionErrors.set(errorKey, currentCount + 1);

    const errorInfo = {
      timestamp: new Date().toISOString(),
      userRole,
      errorCode,
      errorCount: currentCount + 1,
      error: error?.message || error,
    };

    console.error('[NavigationService] Permission Error:', errorInfo);

    // Agregar al log de errores
    const currentErrors = this.errorLogSubject.value;
    this.errorLogSubject.next([...currentErrors, errorInfo]);

    // Emitir evento personalizado para sistemas de logging externos
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('navigation-permission-error', {
          detail: errorInfo,
        })
      );
    }
  }

  /**
   * Registra errores de configuración
   */
  private logConfigurationError(
    errorCode: NavigationErrorCodes,
    message: string,
    error: any
  ): void {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      errorCode,
      message,
      error: error?.message || error,
    };

    console.error('[NavigationService] Configuration Error:', errorInfo);

    // Agregar al log de errores
    const currentErrors = this.errorLogSubject.value;
    this.errorLogSubject.next([...currentErrors, errorInfo]);

    // Emitir evento personalizado para sistemas de logging externos
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('navigation-configuration-error', {
          detail: errorInfo,
        })
      );
    }
  }

  /**
   * Obtiene elementos de navegación de fallback para un rol específico
   */
  private getFallbackNavigationItems(userRole: UserRole): INavItemEnhanced[] {
    // Configuración mínima segura basada en el rol
    const fallbackItems: INavItemEnhanced[] = [
      {
        name: 'Dashboard',
        url: '/admin/dashboard',
        iconComponent: { name: 'cil-speedometer' },
        priority: 100,
      },
    ];

    // Agregar elementos básicos según el rol
    if (userRole !== UserRole.ANONYMOUS && userRole !== UserRole.LECTOR) {
      fallbackItems.push({
        name: 'Mi Perfil',
        url: '/admin/control/gestion/miperfil',
        iconComponent: { name: 'cil-user' },
        priority: 50,
      });
    }

    return fallbackItems;
  }

  /**
   * Obtiene configuración de navegación de fallback
   */
  private getFallbackConfiguration(): NavigationConfig {
    return {
      sections: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon: 'cil-speedometer',
          priority: 100,
          items: [
            {
              id: 'main-dashboard',
              name: 'Escritorio Principal',
              url: '/admin/dashboard',
              icon: 'cil-speedometer',
              priority: 100,
            },
          ],
          collapsible: false,
          defaultExpanded: true,
          requiredRoles: [],
        },
      ],
      theme: NavigationConstants.DEFAULT_THEME,
      userPreferences: {
        expandedSections: [],
        collapsedSections: [],
        favoriteItems: [],
      },
    };
  }

  /**
   * Obtiene estadísticas de errores de permisos
   */
  public getPermissionErrorStatistics(): Map<string, number> {
    return new Map(this.permissionErrors);
  }

  /**
   * Obtiene el log de errores
   */
  public getErrorLog(): Observable<any[]> {
    return this.errorLogSubject.asObservable();
  }

  /**
   * Limpia el log de errores
   */
  public clearErrorLog(): void {
    this.errorLogSubject.next([]);
    this.permissionErrors.clear();
  }

  /**
   * Obtiene el estado de salud del servicio de navegación
   */
  public getServiceHealthStatus(): {
    healthy: boolean;
    errors: number;
    permissionErrors: number;
  } {
    const totalErrors = this.errorLogSubject.value.length;
    const totalPermissionErrors = Array.from(this.permissionErrors.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      healthy: totalErrors === 0 && totalPermissionErrors === 0,
      errors: totalErrors,
      permissionErrors: totalPermissionErrors,
    };
  }

  // ===== API DE CONFIGURACIÓN PROGRAMÁTICA =====

  /**
   * Obtiene la API de configuración programática
   */
  public getProgrammaticAPI() {
    return this.programmaticConfigService;
  }

  /**
   * Configura un elemento de navegación dinámicamente
   */
  public configureElement(
    itemId: string,
    config: Partial<{
      icon: string;
      badge: {
        color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
        text: string;
      };
      priority: number;
      visible: boolean;
      requiredRoles: UserRole[];
      contextualActions: IContextualAction[];
    }>
  ): void {
    this.programmaticConfigService.configureElement({
      itemId,
      ...config,
    });
  }

  /**
   * Establece el icono de un elemento
   */
  public setElementIcon(itemId: string, icon: string): void {
    this.programmaticConfigService.setIcon(itemId, icon);
  }

  /**
   * Establece el badge de un elemento
   */
  public setElementBadge(
    itemId: string,
    badge: {
      color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
      text: string;
    }
  ): void {
    this.programmaticConfigService.setBadge(itemId, badge);
  }

  /**
   * Establece la prioridad de un elemento
   */
  public setElementPriority(itemId: string, priority: number): void {
    this.programmaticConfigService.setPriority(itemId, priority);
  }

  /**
   * Establece la visibilidad de un elemento
   */
  public setElementVisibility(itemId: string, visible: boolean): void {
    this.programmaticConfigService.setVisibility(itemId, visible);
  }

  /**
   * Establece los roles requeridos para un elemento
   */
  public setElementRoles(itemId: string, roles: UserRole[]): void {
    this.programmaticConfigService.setRequiredRoles(itemId, roles);
  }

  /**
   * Agrega una acción contextual a un elemento
   */
  public addElementAction(itemId: string, action: IContextualAction): void {
    this.programmaticConfigService.addContextualAction(itemId, action);
  }

  /**
   * Remueve una acción contextual de un elemento
   */
  public removeElementAction(itemId: string, actionName: string): void {
    this.programmaticConfigService.removeContextualAction(itemId, actionName);
  }

  /**
   * Crea un grupo dinámico de navegación
   */
  public createNavigationGroup(
    groupId: string,
    config: {
      title: string;
      icon?: string;
      priority: number;
      items: string[];
      collapsible?: boolean;
      defaultExpanded?: boolean;
      requiredRoles?: UserRole[];
    }
  ): void {
    this.programmaticConfigService.createGroup({
      groupId,
      ...config,
    });
  }

  /**
   * Actualiza un grupo de navegación existente
   */
  public updateNavigationGroup(
    groupId: string,
    config: Partial<{
      title: string;
      icon: string;
      priority: number;
      items: string[];
      collapsible: boolean;
      defaultExpanded: boolean;
      requiredRoles: UserRole[];
    }>
  ): void {
    this.programmaticConfigService.updateGroup(groupId, config);
  }

  /**
   * Remueve un grupo de navegación
   */
  public removeNavigationGroup(groupId: string): void {
    this.programmaticConfigService.removeGroup(groupId);
  }

  /**
   * Carga la configuración de navegación con grupos dinámicos
   */
  loadNavigationConfigWithDynamicGroups(config: NavigationConfig): void {
    // Cargar configuración base
    this.loadNavigationConfig(config);

    // Generar configuración con grupos dinámicos
    const enhancedConfig =
      this.programmaticConfigService.generateNavigationWithDynamicGroups(config);

    // Actualizar la configuración base con los grupos dinámicos
    this.baseNavigationConfig = enhancedConfig;
    this.updateNavigationItems();
  }

  /**
   * Exporta todas las configuraciones programáticas
   */
  public exportProgrammaticConfigurations(): {
    elements: any[];
    groups: any[];
  } {
    return this.programmaticConfigService.exportConfigurations();
  }

  /**
   * Importa configuraciones programáticas
   */
  public importProgrammaticConfigurations(data: { elements: any[]; groups: any[] }): void {
    this.programmaticConfigService.importConfigurations(data);
  }

  /**
   * Resetea todas las configuraciones programáticas
   */
  public resetProgrammaticConfigurations(): void {
    this.programmaticConfigService.resetAllConfigurations();
  }

  // ===== MÉTODOS DE OPTIMIZACIÓN DE RENDIMIENTO =====

  /**
   * Inicializa las optimizaciones de rendimiento
   */
  private initializePerformanceOptimizations(): void {
    // Configurar optimizaciones basadas en el tamaño esperado de la navegación
    this.performanceService.configurePerformance({
      lazyLoadThreshold: 30, // Activar lazy loading con más de 30 elementos
      chunkSize: 8, // Chunks de 8 elementos
      permissionCacheSize: 500, // Cache para 500 verificaciones de permisos
      permissionCacheTTL: 300000, // 5 minutos de TTL
      badgeUpdateDebounce: 300, // 300ms de debounce para badges
      badgeUpdateBatchSize: 10, // Procesar badges en lotes de 10
      virtualScrollThreshold: 50, // Scroll virtual con más de 50 elementos
      renderDebounce: 150, // 150ms de debounce para renders
    });
  }

  /**
   * Obtiene estadísticas de rendimiento del servicio de navegación
   */
  public getPerformanceStatistics(): any {
    const performanceStats = this.performanceService.getPerformanceStats();
    const serviceHealth = this.getServiceHealthStatus();

    return {
      performance: performanceStats,
      health: serviceHealth,
      cacheEfficiency: {
        hitRate:
          performanceStats.permissionCacheHits /
            (performanceStats.permissionCacheHits + performanceStats.permissionCacheMisses) || 0,
        totalQueries: performanceStats.permissionCacheHits + performanceStats.permissionCacheMisses,
      },
    };
  }

  /**
   * Optimiza el rendimiento del servicio manualmente
   */
  public optimizePerformance(): void {
    this.performanceService.optimizeMemoryUsage();
    this.clearErrorLog(); // Limpiar logs antiguos
  }

  /**
   * Configura las opciones de rendimiento
   */
  public configurePerformanceOptions(config: {
    lazyLoadThreshold?: number;
    chunkSize?: number;
    permissionCacheSize?: number;
    permissionCacheTTL?: number;
    badgeUpdateDebounce?: number;
    badgeUpdateBatchSize?: number;
    virtualScrollThreshold?: number;
    renderDebounce?: number;
  }): void {
    this.performanceService.configurePerformance(config);
  }

  /**
   * Limpia el cache de permisos para forzar recálculo
   */
  public clearPermissionCache(): void {
    this.performanceService.clearPermissionCache();
  }

  /**
   * Verifica si un elemento tiene permisos usando cache memoizado
   */
  public checkPermissionMemoized(item: INavItemEnhanced, userRole: UserRole): boolean {
    return this.performanceService.checkPermissionMemoized(item, userRole);
  }

  /**
   * Crea chunks de navegación para lazy loading
   */
  public createNavigationChunks(items: INavItemEnhanced[]): Observable<any[]> {
    return this.performanceService.createNavigationChunks(items);
  }

  /**
   * Carga un chunk específico de navegación
   */
  public loadNavigationChunk(chunkId: string): Observable<any> {
    return this.performanceService.loadChunk(chunkId);
  }
}
