import { Injectable } from '@angular/core';
import { INavData } from '@coreui/angular';
import { INavItemEnhanced, UserRole } from '../types/navigation.types';

/**
 * Service for migrating existing navigation configurations to the new enhanced structure
 * Handles backward compatibility and preserves custom configurations
 */
@Injectable({
  providedIn: 'root',
})
export class NavigationMigrationService {
  /**
   * Maps legacy navigation items to the new enhanced structure
   * @param legacyItems - Array of legacy INavData items
   * @returns Array of enhanced navigation items
   */
  migrateLegacyNavigation(legacyItems: INavData[]): INavItemEnhanced[] {
    return legacyItems.map((item) => this.migrateSingleItem(item));
  }

  /**
   * Migrates a single navigation item from legacy to enhanced format
   * @param legacyItem - Legacy navigation item
   * @returns Enhanced navigation item
   */
  private migrateSingleItem(legacyItem: INavData): INavItemEnhanced {
    const enhancedItem: INavItemEnhanced = {
      ...legacyItem,
      priority: this.inferPriority(legacyItem),
      requiredRoles: this.inferRequiredRoles(legacyItem),
    };

    // Migrate children if they exist
    if (legacyItem.children && legacyItem.children.length > 0) {
      enhancedItem.children = legacyItem.children.map((child) =>
        this.migrateSingleItem(child),
      );
    }

    // Add dynamic badges for specific items
    this.addDynamicBadges(enhancedItem);

    // Add responsive configuration
    this.addResponsiveConfig(enhancedItem);

    return enhancedItem;
  }

  /**
   * Infers priority based on item name and URL patterns
   * @param item - Navigation item
   * @returns Inferred priority value
   */
  private inferPriority(item: INavData): number {
    const url = item.url || '';
    const name = item.name || '';

    // Dashboard gets highest priority
    if (
      url.includes('dashboard') ||
      name.toLowerCase().includes('escritorio')
    ) {
      return 100;
    }

    // Content management items
    if (url.includes('entradas') || name.toLowerCase().includes('entrada')) {
      if (url.includes('crear') || name.toLowerCase().includes('nueva')) {
        return 95;
      }
      return 85;
    }

    if (url.includes('paginas') || name.toLowerCase().includes('página')) {
      return 75;
    }

    if (url.includes('contenido') || url.includes('multimedia')) {
      return 70;
    }

    if (url.includes('comentarios')) {
      return 65;
    }

    // User management
    if (url.includes('usuarios') && !url.includes('miperfil')) {
      return 55;
    }

    if (url.includes('roles') || url.includes('permisos')) {
      return 50;
    }

    // Configuration
    if (url.includes('configuracion') || url.includes('ajustes')) {
      if (name.toLowerCase().includes('avanzado')) {
        return 25;
      }
      if (
        name.toLowerCase().includes('apariencia') ||
        name.toLowerCase().includes('tema')
      ) {
        return 35;
      }
      return 30;
    }

    // User profile
    if (url.includes('miperfil') || name.toLowerCase().includes('mi perfil')) {
      return 15;
    }

    if (
      url.includes('changepassword') ||
      name.toLowerCase().includes('contraseña')
    ) {
      return 10;
    }

    // Maintenance
    if (url.includes('mantenimiento') || url.includes('logs')) {
      return 5;
    }

    // Quick links
    if (item.attributes?.['target'] === '_blank' || url === '/') {
      return 1;
    }

    // Default priority for unrecognized items
    return 50;
  }

  /**
   * Infers required roles based on item URL and functionality
   * @param item - Navigation item
   * @returns Array of required roles
   */
  private inferRequiredRoles(item: INavData): UserRole[] {
    const url = item.url || '';
    const name = item.name || '';

    // Dashboard - accessible to most roles
    if (url.includes('dashboard')) {
      return [
        UserRole.AUTOR,
        UserRole.EDITOR,
        UserRole.ADMINISTRADOR,
        UserRole.DESARROLLADOR,
        UserRole.MANTENIMIENTO,
        UserRole.PROPIETARIO,
      ];
    }

    // Content creation - authors and above
    if (
      url.includes('entradas') ||
      url.includes('paginas') ||
      url.includes('contenido')
    ) {
      if (url.includes('categorias')) {
        return [
          UserRole.EDITOR,
          UserRole.ADMINISTRADOR,
          UserRole.DESARROLLADOR,
          UserRole.PROPIETARIO,
        ];
      }
      if (url.includes('paginas')) {
        return [
          UserRole.EDITOR,
          UserRole.ADMINISTRADOR,
          UserRole.DESARROLLADOR,
          UserRole.PROPIETARIO,
        ];
      }
      return [
        UserRole.AUTOR,
        UserRole.EDITOR,
        UserRole.ADMINISTRADOR,
        UserRole.DESARROLLADOR,
        UserRole.PROPIETARIO,
      ];
    }

    // Comments - editors and above
    if (url.includes('comentarios')) {
      return [
        UserRole.EDITOR,
        UserRole.ADMINISTRADOR,
        UserRole.DESARROLLADOR,
        UserRole.PROPIETARIO,
      ];
    }

    // User management - administrators only
    if (url.includes('usuarios') && !url.includes('miperfil')) {
      return [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO];
    }

    // Roles and permissions - owners only
    if (
      url.includes('roles') ||
      url.includes('permisos') ||
      url.includes('privilegios')
    ) {
      return [UserRole.PROPIETARIO];
    }

    // Configuration
    if (url.includes('configuracion') || url.includes('ajustes')) {
      if (
        name.toLowerCase().includes('apariencia') ||
        name.toLowerCase().includes('tema')
      ) {
        return [UserRole.DESARROLLADOR, UserRole.PROPIETARIO];
      }
      if (name.toLowerCase().includes('avanzado')) {
        return [UserRole.DESARROLLADOR, UserRole.PROPIETARIO];
      }
      return [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO];
    }

    // Maintenance
    if (url.includes('mantenimiento')) {
      if (url.includes('database') || url.includes('dev-tools')) {
        return [UserRole.DESARROLLADOR, UserRole.PROPIETARIO];
      }
      return [
        UserRole.MANTENIMIENTO,
        UserRole.DESARROLLADOR,
        UserRole.PROPIETARIO,
      ];
    }

    // User profile - all authenticated users
    if (url.includes('miperfil') || url.includes('changepassword')) {
      return [
        UserRole.LECTOR,
        UserRole.AUTOR,
        UserRole.EDITOR,
        UserRole.ADMINISTRADOR,
        UserRole.DESARROLLADOR,
        UserRole.MANTENIMIENTO,
        UserRole.PROPIETARIO,
      ];
    }

    // Quick links - all users
    if (item.attributes?.['target'] === '_blank' || url === '/') {
      return [
        UserRole.LECTOR,
        UserRole.AUTOR,
        UserRole.EDITOR,
        UserRole.ADMINISTRADOR,
        UserRole.DESARROLLADOR,
        UserRole.MANTENIMIENTO,
        UserRole.PROPIETARIO,
      ];
    }

    // Default - authors and above
    return [
      UserRole.AUTOR,
      UserRole.EDITOR,
      UserRole.ADMINISTRADOR,
      UserRole.DESARROLLADOR,
      UserRole.PROPIETARIO,
    ];
  }

  /**
   * Adds dynamic badges to specific navigation items
   * @param item - Enhanced navigation item
   */
  private addDynamicBadges(item: INavItemEnhanced): void {
    const url = item.url || '';
    const name = item.name || '';

    // Comments counter
    if (url.includes('comentarios')) {
      item.dynamicBadge = {
        service: 'BadgeCounterService',
        method: 'getUnmoderatedCommentsCount',
        refreshInterval: 15000,
      };
      item.badge = {
        color: 'danger',
        text: 'Pendientes',
      };
    }

    // Draft entries counter
    if (
      url.includes('entradas-temporales') ||
      name.toLowerCase().includes('borrador')
    ) {
      item.dynamicBadge = {
        service: 'BadgeCounterService',
        method: 'getDraftEntriesCount',
        refreshInterval: 30000,
      };
      item.badge = {
        color: 'warning',
        text: 'Pendientes',
      };
    }

    // Users counter
    if (url.includes('usuarios') && !url.includes('miperfil')) {
      item.dynamicBadge = {
        service: 'BadgeCounterService',
        method: 'getPendingUsersCount',
        refreshInterval: 60000,
      };
      item.badge = {
        color: 'info',
        text: 'Nuevos',
      };
    }

    // System alerts counter
    if (url.includes('logs') || name.toLowerCase().includes('logs')) {
      item.dynamicBadge = {
        service: 'BadgeCounterService',
        method: 'getSystemAlertsCount',
        refreshInterval: 120000,
      };
      item.badge = {
        color: 'warning',
        text: 'Alertas',
      };
    }
  }

  /**
   * Adds responsive configuration to navigation items
   * @param item - Enhanced navigation item
   */
  private addResponsiveConfig(item: INavItemEnhanced): void {
    const url = item.url || '';
    const name = item.name || '';

    // Hide less critical items on mobile
    if (
      url.includes('mantenimiento') ||
      name.toLowerCase().includes('avanzado') ||
      url.includes('dev-tools')
    ) {
      item.responsiveConfig = {
        hideOnMobile: true,
        collapseThreshold: 768,
      };
    }

    // Collapse secondary items at tablet size
    if (item.children && item.children.length > 0) {
      item.responsiveConfig = {
        hideOnMobile: false,
        collapseThreshold: 1024,
      };
    }
  }

  /**
   * Creates a mapping of old URLs to new URLs for route compatibility
   * @returns Map of old routes to new routes
   */
  getRouteMapping(): Map<string, string> {
    const routeMap = new Map<string, string>();

    // Legacy routes that might need mapping
    routeMap.set('/admin/entradas', '/admin/control/entradas');
    routeMap.set('/admin/usuarios', '/admin/control/gestion/usuarios');
    routeMap.set('/admin/configuracion', '/admin/control/configuracion');
    routeMap.set('/admin/perfil', '/admin/control/gestion/miperfil');
    routeMap.set('/admin/comentarios', '/admin/control/comentarios');
    routeMap.set('/admin/paginas', '/admin/control/paginas');
    routeMap.set('/admin/multimedia', '/admin/control/contenido');

    return routeMap;
  }

  /**
   * Validates that the migrated navigation structure is valid
   * @param items - Array of enhanced navigation items
   * @returns Validation result with any issues found
   */
  validateMigratedStructure(items: INavItemEnhanced[]): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for duplicate URLs
    const urls = new Set<string>();
    this.collectUrls(items, urls, issues);

    // Check for missing required properties
    this.validateRequiredProperties(items, issues);

    // Check hierarchy depth
    this.validateHierarchyDepth(items, issues, 0);

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Collects all URLs and checks for duplicates
   * @param items - Navigation items
   * @param urls - Set to track URLs
   * @param issues - Array to collect issues
   */
  private collectUrls(
    items: INavItemEnhanced[],
    urls: Set<string>,
    issues: string[],
  ): void {
    for (const item of items) {
      if (item.url && typeof item.url === 'string') {
        if (urls.has(item.url)) {
          issues.push(`Duplicate URL found: ${item.url}`);
        } else {
          urls.add(item.url);
        }
      }

      if (item.children) {
        this.collectUrls(item.children, urls, issues);
      }
    }
  }

  /**
   * Validates required properties are present
   * @param items - Navigation items
   * @param issues - Array to collect issues
   */
  private validateRequiredProperties(
    items: INavItemEnhanced[],
    issues: string[],
  ): void {
    for (const item of items) {
      if (!item.name) {
        issues.push('Navigation item missing name property');
      }

      if (!item.title && !item.url) {
        issues.push(
          `Navigation item "${item.name}" must have either title or url property`,
        );
      }

      if (item.requiredRoles && item.requiredRoles.length === 0) {
        issues.push(
          `Navigation item "${item.name}" has empty requiredRoles array`,
        );
      }

      if (item.children) {
        this.validateRequiredProperties(item.children, issues);
      }
    }
  }

  /**
   * Validates navigation hierarchy depth doesn't exceed limits
   * @param items - Navigation items
   * @param issues - Array to collect issues
   * @param currentDepth - Current depth level
   */
  private validateHierarchyDepth(
    items: INavItemEnhanced[],
    issues: string[],
    currentDepth: number,
  ): void {
    const maxDepth = 2;

    for (const item of items) {
      if (currentDepth >= maxDepth) {
        issues.push(
          `Navigation hierarchy exceeds maximum depth of ${maxDepth} levels at item: ${item.name}`,
        );
      }
      if (item.children && item.children.length > 0) {
        this.validateHierarchyDepth(item.children, issues, currentDepth + 1);
      }
    }
  }

  /**
   * Preserves custom user configurations during migration
   * @param originalItems - Original navigation items
   * @param customConfig - User's custom configuration
   * @returns Merged navigation items with custom settings preserved
   */
  preserveCustomConfigurations(
    originalItems: INavItemEnhanced[],
    customConfig: Partial<INavItemEnhanced>[],
  ): INavItemEnhanced[] {
    const configMap = new Map<string, Partial<INavItemEnhanced>>();

    // Create a map of custom configurations by URL or name
    customConfig.forEach((config) => {
      const key =
        (typeof config.url === 'string' ? config.url : config.name) || '';
      if (key) {
        configMap.set(key, config);
      }
    });

    return originalItems.map((item) => this.applyCustomConfig(item, configMap));
  }

  /**
   * Applies custom configuration to a navigation item
   * @param item - Original navigation item
   * @param configMap - Map of custom configurations
   * @returns Navigation item with custom config applied
   */
  private applyCustomConfig(
    item: INavItemEnhanced,
    configMap: Map<string, Partial<INavItemEnhanced>>,
  ): INavItemEnhanced {
    const key = (typeof item.url === 'string' ? item.url : item.name) || '';
    const customConfig = configMap.get(key);

    let mergedItem = { ...item };

    if (customConfig) {
      // Merge custom configuration, preserving important system properties
      mergedItem = {
        ...mergedItem,
        ...customConfig,
        // Preserve system-critical properties
        requiredRoles: customConfig.requiredRoles || item.requiredRoles,
        priority:
          customConfig.priority !== undefined
            ? customConfig.priority
            : item.priority,
      };
    }

    // Apply custom config to children
    if (item.children) {
      mergedItem.children = item.children.map((child) =>
        this.applyCustomConfig(child, configMap),
      );
    }

    return mergedItem;
  }
}
