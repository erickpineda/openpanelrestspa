import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  INavItemEnhanced,
  IContextualAction,
  UserRole,
  NavigationConfig,
  NavigationSection,
  NavigationItem,
} from '../../../shared/types/navigation.types';

/**
 * Configuración dinámica para elementos de navegación
 */
export interface DynamicElementConfig {
  itemId: string;
  icon?: string;
  badge?: {
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
    text: string;
    dynamic?: boolean;
  };
  contextualActions?: IContextualAction[];
  visible?: boolean;
  priority?: number;
  requiredRoles?: UserRole[];
}

/**
 * Configuración de agrupación dinámica
 */
export interface DynamicGroupConfig {
  groupId: string;
  title: string;
  icon?: string;
  priority: number;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  requiredRoles?: UserRole[];
  items: string[]; // IDs de elementos a incluir en el grupo
}

/**
 * API para personalización de navegación
 */
export interface NavigationCustomizationAPI {
  // Configuración de elementos
  configureElement(config: DynamicElementConfig): void;
  removeElement(itemId: string): void;

  // Configuración de grupos
  createGroup(config: DynamicGroupConfig): void;
  updateGroup(groupId: string, config: Partial<DynamicGroupConfig>): void;
  removeGroup(groupId: string): void;

  // Configuración de acciones contextuales
  addContextualAction(itemId: string, action: IContextualAction): void;
  removeContextualAction(itemId: string, actionName: string): void;

  // Configuración de badges
  setBadge(itemId: string, badge: DynamicElementConfig['badge']): void;
  removeBadge(itemId: string): void;

  // Configuración de iconos
  setIcon(itemId: string, icon: string): void;

  // Configuración de visibilidad
  setVisibility(itemId: string, visible: boolean): void;

  // Configuración de prioridad
  setPriority(itemId: string, priority: number): void;

  // Configuración de roles
  setRequiredRoles(itemId: string, roles: UserRole[]): void;

  // Obtener configuración actual
  getElementConfig(itemId: string): DynamicElementConfig | null;
  getAllConfigurations(): Map<string, DynamicElementConfig>;

  // Observables para cambios
  getConfigurationChanges(): Observable<Map<string, DynamicElementConfig>>;
  getGroupChanges(): Observable<Map<string, DynamicGroupConfig>>;
}

/**
 * Servicio para configuración programática de elementos de navegación
 */
@Injectable({
  providedIn: 'root',
})
export class ProgrammaticNavigationConfigService implements NavigationCustomizationAPI {
  private elementConfigsSubject = new BehaviorSubject<
    Map<string, DynamicElementConfig>
  >(new Map());
  private groupConfigsSubject = new BehaviorSubject<
    Map<string, DynamicGroupConfig>
  >(new Map());

  constructor() {}

  /**
   * Configura un elemento de navegación dinámicamente
   */
  configureElement(config: DynamicElementConfig): void {
    const currentConfigs = this.elementConfigsSubject.value;
    const newConfigs = new Map(currentConfigs);

    // Merge con configuración existente si existe
    const existingConfig = newConfigs.get(config.itemId);
    const mergedConfig = existingConfig
      ? { ...existingConfig, ...config }
      : config;

    newConfigs.set(config.itemId, mergedConfig);
    this.elementConfigsSubject.next(newConfigs);
  }

  /**
   * Remueve un elemento de la navegación
   */
  removeElement(itemId: string): void {
    const currentConfigs = this.elementConfigsSubject.value;
    const newConfigs = new Map(currentConfigs);

    // Marcar como no visible en lugar de eliminar completamente
    const existingConfig = newConfigs.get(itemId);
    if (existingConfig) {
      newConfigs.set(itemId, { ...existingConfig, visible: false });
    } else {
      newConfigs.set(itemId, { itemId, visible: false });
    }

    this.elementConfigsSubject.next(newConfigs);
  }

  /**
   * Crea un nuevo grupo de navegación
   */
  createGroup(config: DynamicGroupConfig): void {
    const currentGroups = this.groupConfigsSubject.value;
    const newGroups = new Map(currentGroups);

    newGroups.set(config.groupId, config);
    this.groupConfigsSubject.next(newGroups);
  }

  /**
   * Actualiza un grupo existente
   */
  updateGroup(groupId: string, config: Partial<DynamicGroupConfig>): void {
    const currentGroups = this.groupConfigsSubject.value;
    const existingGroup = currentGroups.get(groupId);

    if (existingGroup) {
      const newGroups = new Map(currentGroups);
      newGroups.set(groupId, { ...existingGroup, ...config });
      this.groupConfigsSubject.next(newGroups);
    }
  }

  /**
   * Remueve un grupo de navegación
   */
  removeGroup(groupId: string): void {
    const currentGroups = this.groupConfigsSubject.value;
    const newGroups = new Map(currentGroups);

    newGroups.delete(groupId);
    this.groupConfigsSubject.next(newGroups);
  }

  /**
   * Agrega una acción contextual a un elemento
   */
  addContextualAction(itemId: string, action: IContextualAction): void {
    const currentConfigs = this.elementConfigsSubject.value;
    const existingConfig = currentConfigs.get(itemId) || { itemId };

    const existingActions = existingConfig.contextualActions || [];
    const newActions = [...existingActions, action];

    this.configureElement({
      ...existingConfig,
      contextualActions: newActions,
    });
  }

  /**
   * Remueve una acción contextual de un elemento
   */
  removeContextualAction(itemId: string, actionName: string): void {
    const currentConfigs = this.elementConfigsSubject.value;
    const existingConfig = currentConfigs.get(itemId);

    if (existingConfig && existingConfig.contextualActions) {
      const filteredActions = existingConfig.contextualActions.filter(
        (action) => action.name !== actionName,
      );

      this.configureElement({
        ...existingConfig,
        contextualActions: filteredActions,
      });
    }
  }

  /**
   * Establece un badge para un elemento
   */
  setBadge(itemId: string, badge: DynamicElementConfig['badge']): void {
    const currentConfigs = this.elementConfigsSubject.value;
    const existingConfig = currentConfigs.get(itemId) || { itemId };

    this.configureElement({
      ...existingConfig,
      badge,
    });
  }

  /**
   * Remueve el badge de un elemento
   */
  removeBadge(itemId: string): void {
    const currentConfigs = this.elementConfigsSubject.value;
    const existingConfig = currentConfigs.get(itemId);

    if (existingConfig) {
      const { badge, ...configWithoutBadge } = existingConfig;
      const newConfigs = new Map(currentConfigs);
      newConfigs.set(itemId, configWithoutBadge);
      this.elementConfigsSubject.next(newConfigs);
    }
  }

  /**
   * Establece el icono de un elemento
   */
  setIcon(itemId: string, icon: string): void {
    const currentConfigs = this.elementConfigsSubject.value;
    const existingConfig = currentConfigs.get(itemId) || { itemId };

    this.configureElement({
      ...existingConfig,
      icon,
    });
  }

  /**
   * Establece la visibilidad de un elemento
   */
  setVisibility(itemId: string, visible: boolean): void {
    const currentConfigs = this.elementConfigsSubject.value;
    const existingConfig = currentConfigs.get(itemId) || { itemId };

    this.configureElement({
      ...existingConfig,
      visible,
    });
  }

  /**
   * Establece la prioridad de un elemento
   */
  setPriority(itemId: string, priority: number): void {
    const currentConfigs = this.elementConfigsSubject.value;
    const existingConfig = currentConfigs.get(itemId) || { itemId };

    this.configureElement({
      ...existingConfig,
      priority,
    });
  }

  /**
   * Establece los roles requeridos para un elemento
   */
  setRequiredRoles(itemId: string, roles: UserRole[]): void {
    const currentConfigs = this.elementConfigsSubject.value;
    const existingConfig = currentConfigs.get(itemId) || { itemId };

    this.configureElement({
      ...existingConfig,
      requiredRoles: roles,
    });
  }

  /**
   * Obtiene la configuración de un elemento específico
   */
  getElementConfig(itemId: string): DynamicElementConfig | null {
    return this.elementConfigsSubject.value.get(itemId) || null;
  }

  /**
   * Obtiene todas las configuraciones actuales
   */
  getAllConfigurations(): Map<string, DynamicElementConfig> {
    return new Map(this.elementConfigsSubject.value);
  }

  /**
   * Observable para cambios en configuraciones de elementos
   */
  getConfigurationChanges(): Observable<Map<string, DynamicElementConfig>> {
    return this.elementConfigsSubject.asObservable();
  }

  /**
   * Observable para cambios en configuraciones de grupos
   */
  getGroupChanges(): Observable<Map<string, DynamicGroupConfig>> {
    return this.groupConfigsSubject.asObservable();
  }

  /**
   * Aplica configuraciones dinámicas a elementos de navegación
   */
  applyDynamicConfigurations(items: INavItemEnhanced[]): INavItemEnhanced[] {
    const configs = this.elementConfigsSubject.value;

    return items
      .map((item) => this.applyConfigToItem(item, configs))
      .filter((item) => {
        // Filtrar elementos marcados como no visibles
        const itemId = this.generateItemId(item);
        const config = configs.get(itemId);
        return config?.visible !== false;
      })
      .sort((a, b) => {
        // Ordenar por prioridad si está configurada
        const aId = this.generateItemId(a);
        const bId = this.generateItemId(b);
        const aConfig = configs.get(aId);
        const bConfig = configs.get(bId);

        const aPriority = aConfig?.priority ?? a.priority ?? 0;
        const bPriority = bConfig?.priority ?? b.priority ?? 0;

        return bPriority - aPriority; // Mayor prioridad primero
      });
  }

  /**
   * Aplica configuración dinámica a un elemento individual
   */
  private applyConfigToItem(
    item: INavItemEnhanced,
    configs: Map<string, DynamicElementConfig>,
  ): INavItemEnhanced {
    const itemId = this.generateItemId(item);
    const config = configs.get(itemId);

    if (!config) {
      return item;
    }

    const updatedItem: INavItemEnhanced = { ...item };

    // Aplicar icono
    if (config.icon) {
      updatedItem.iconComponent = { name: config.icon };
    }

    // Aplicar badge
    if (config.badge) {
      updatedItem.badge = {
        color: config.badge.color,
        text: config.badge.text,
      };
    }

    // Aplicar acciones contextuales
    if (config.contextualActions) {
      updatedItem.contextualActions = config.contextualActions;
    }

    // Aplicar prioridad
    if (config.priority !== undefined) {
      updatedItem.priority = config.priority;
    }

    // Aplicar roles requeridos
    if (config.requiredRoles) {
      updatedItem.requiredRoles = config.requiredRoles;
    }

    // Aplicar configuración a children recursivamente
    if (item.children && item.children.length > 0) {
      updatedItem.children = item.children.map((child) =>
        this.applyConfigToItem(child, configs),
      );
    }

    return updatedItem;
  }

  /**
   * Genera un ID único para un elemento de navegación
   */
  private generateItemId(item: INavItemEnhanced): string {
    if (item.url) {
      return Array.isArray(item.url) ? item.url.join('-') : item.url;
    }
    return (
      item.name
        ?.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase() || 'unknown'
    );
  }

  /**
   * Genera configuración de navegación con grupos dinámicos
   */
  generateNavigationWithDynamicGroups(
    baseConfig: NavigationConfig,
  ): NavigationConfig {
    const dynamicGroups = this.groupConfigsSubject.value;
    const elementConfigs = this.elementConfigsSubject.value;

    // Crear secciones adicionales basadas en grupos dinámicos
    const dynamicSections: NavigationSection[] = Array.from(
      dynamicGroups.values(),
    ).map((group) => ({
      id: group.groupId,
      title: group.title,
      icon: group.icon || 'cil-folder',
      priority: group.priority,
      items: this.createItemsFromGroup(group, elementConfigs),
      collapsible: group.collapsible ?? true,
      defaultExpanded: group.defaultExpanded ?? false,
      requiredRoles: group.requiredRoles || [],
    }));

    // Combinar secciones base con secciones dinámicas
    const allSections = [...baseConfig.sections, ...dynamicSections].sort(
      (a, b) => b.priority - a.priority,
    );

    return {
      ...baseConfig,
      sections: allSections,
    };
  }

  /**
   * Crea elementos de navegación a partir de un grupo dinámico
   */
  private createItemsFromGroup(
    group: DynamicGroupConfig,
    elementConfigs: Map<string, DynamicElementConfig>,
  ): NavigationItem[] {
    return group.items.map((itemId) => {
      const config = elementConfigs.get(itemId);

      return {
        id: itemId,
        name: config?.itemId || itemId,
        url: `/${itemId}`,
        icon: config?.icon || 'cil-circle',
        priority: config?.priority || 0,
        badge: config?.badge
          ? {
              type: config.badge.dynamic ? 'dynamic' : 'static',
              color: config.badge.color,
              text: config.badge.text,
            }
          : undefined,
      };
    });
  }

  /**
   * Resetea todas las configuraciones dinámicas
   */
  resetAllConfigurations(): void {
    this.elementConfigsSubject.next(new Map());
    this.groupConfigsSubject.next(new Map());
  }

  /**
   * Exporta configuraciones actuales para persistencia
   */
  exportConfigurations(): { elements: any[]; groups: any[] } {
    const elements = Array.from(this.elementConfigsSubject.value.entries()).map(
      ([id, config]) => ({
        id,
        ...config,
      }),
    );

    const groups = Array.from(this.groupConfigsSubject.value.entries()).map(
      ([id, config]) => ({
        id,
        ...config,
      }),
    );

    return { elements, groups };
  }

  /**
   * Importa configuraciones desde datos persistidos
   */
  importConfigurations(data: { elements: any[]; groups: any[] }): void {
    // Importar configuraciones de elementos
    const elementConfigs = new Map<string, DynamicElementConfig>();
    data.elements.forEach((element) => {
      const { id, ...config } = element;
      elementConfigs.set(id, { itemId: id, ...config });
    });

    // Importar configuraciones de grupos
    const groupConfigs = new Map<string, DynamicGroupConfig>();
    data.groups.forEach((group) => {
      const { id, ...config } = group;
      groupConfigs.set(id, { groupId: id, ...config });
    });

    this.elementConfigsSubject.next(elementConfigs);
    this.groupConfigsSubject.next(groupConfigs);
  }
}
