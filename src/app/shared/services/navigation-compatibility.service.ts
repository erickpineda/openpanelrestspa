import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { INavData } from '@coreui/angular';
import { INavItemEnhanced } from '../types/navigation.types';

/**
 * Service that provides backward compatibility for existing components
 * that expect the legacy INavData format while using the new enhanced structure
 */
@Injectable({
  providedIn: 'root',
})
export class NavigationCompatibilityService {
  constructor(private router: Router) {}

  /**
   * Converts enhanced navigation items back to legacy format for compatibility
   * @param enhancedItems - Array of enhanced navigation items
   * @returns Array of legacy navigation items
   */
  convertToLegacyFormat(enhancedItems: INavItemEnhanced[]): INavData[] {
    return enhancedItems.map((item) => this.convertSingleItemToLegacy(item));
  }

  /**
   * Converts a single enhanced item to legacy format
   * @param enhancedItem - Enhanced navigation item
   * @returns Legacy navigation item
   */
  private convertSingleItemToLegacy(enhancedItem: INavItemEnhanced): INavData {
    const legacyItem: INavData = {
      name: enhancedItem.name,
      url: enhancedItem.url,
      iconComponent: enhancedItem.iconComponent,
      icon: enhancedItem.icon,
      badge: enhancedItem.badge,
      title: enhancedItem.title,
      divider: enhancedItem.divider,
      class: enhancedItem.class,
      variant: enhancedItem.variant,
      attributes: enhancedItem.attributes,
      linkProps: enhancedItem.linkProps,
    };

    // Convert children if they exist
    if (enhancedItem.children && enhancedItem.children.length > 0) {
      legacyItem.children = enhancedItem.children.map((child) =>
        this.convertSingleItemToLegacy(child)
      );
    }

    return legacyItem;
  }

  /**
   * Provides a legacy-compatible navigation observable
   * @param enhancedNavigation$ - Observable of enhanced navigation items
   * @returns Observable of legacy navigation items
   */
  getLegacyNavigation(enhancedNavigation$: Observable<INavItemEnhanced[]>): Observable<INavData[]> {
    return new Observable((subscriber) => {
      enhancedNavigation$.subscribe({
        next: (enhancedItems) => {
          const legacyItems = this.convertToLegacyFormat(enhancedItems);
          subscriber.next(legacyItems);
        },
        error: (error) => subscriber.error(error),
        complete: () => subscriber.complete(),
      });
    });
  }

  /**
   * Handles legacy route redirects for URLs that have changed
   * @param legacyUrl - The legacy URL being accessed
   * @returns The new URL to redirect to, or null if no redirect needed
   */
  handleLegacyRouteRedirect(legacyUrl: string): string | null {
    const routeMap = new Map<string, string>([
      ['/admin/entradas', '/admin/control/entradas'],
      ['/admin/usuarios', '/admin/control/gestion/usuarios'],
      ['/admin/configuracion', '/admin/control/configuracion'],
      ['/admin/perfil', '/admin/control/gestion/miperfil'],
      ['/admin/comentarios', '/admin/control/comentarios'],
      ['/admin/paginas', '/admin/control/paginas'],
      ['/admin/multimedia', '/admin/control/contenido'],
    ]);

    return routeMap.get(legacyUrl) || null;
  }

  /**
   * Automatically redirects legacy routes to new routes
   * @param legacyUrl - The legacy URL being accessed
   * @returns Promise that resolves when navigation is complete
   */
  async redirectLegacyRoute(legacyUrl: string): Promise<boolean> {
    const newUrl = this.handleLegacyRouteRedirect(legacyUrl);

    if (newUrl) {
      console.log(`Redirecting legacy route: ${legacyUrl} -> ${newUrl}`);
      return this.router.navigateByUrl(newUrl);
    }

    return false;
  }

  /**
   * Provides a wrapper for legacy components that expect specific navigation structure
   * @param enhancedItems - Enhanced navigation items
   * @param legacyExpectations - Configuration for what the legacy component expects
   * @returns Adapted navigation items
   */
  adaptForLegacyComponent(
    enhancedItems: INavItemEnhanced[],
    legacyExpectations: LegacyComponentExpectations
  ): INavData[] {
    let adaptedItems = this.convertToLegacyFormat(enhancedItems);

    // Apply legacy-specific adaptations
    if (legacyExpectations.flattenHierarchy) {
      adaptedItems = this.flattenNavigationHierarchy(adaptedItems);
    }

    if (legacyExpectations.removeBadges) {
      adaptedItems = this.removeBadgesFromItems(adaptedItems);
    }

    if (legacyExpectations.simplifyIcons) {
      adaptedItems = this.simplifyIconReferences(adaptedItems);
    }

    if (legacyExpectations.filterByUrls) {
      adaptedItems = this.filterItemsByUrls(adaptedItems, legacyExpectations.allowedUrls || []);
    }

    return adaptedItems;
  }

  /**
   * Flattens navigation hierarchy for components that don't support nested items
   * @param items - Navigation items to flatten
   * @returns Flattened navigation items
   */
  private flattenNavigationHierarchy(items: INavData[]): INavData[] {
    const flattened: INavData[] = [];

    for (const item of items) {
      // Add the parent item (without children)
      const flatItem = { ...item };
      delete flatItem.children;
      flattened.push(flatItem);

      // Add children as separate items with indented names
      if (item.children) {
        for (const child of item.children) {
          const childItem = {
            ...child,
            name: `  ${child.name}`, // Indent child items
            class: `${child.class || ''} nav-child-item`.trim(),
          };
          flattened.push(childItem);
        }
      }
    }

    return flattened;
  }

  /**
   * Removes badges from navigation items for components that don't support them
   * @param items - Navigation items
   * @returns Items without badges
   */
  private removeBadgesFromItems(items: INavData[]): INavData[] {
    return items.map((item) => {
      const itemWithoutBadge = { ...item };
      delete itemWithoutBadge.badge;

      if (item.children) {
        itemWithoutBadge.children = this.removeBadgesFromItems(item.children);
      }

      return itemWithoutBadge;
    });
  }

  /**
   * Simplifies icon references for components that only support string icons
   * @param items - Navigation items
   * @returns Items with simplified icon references
   */
  private simplifyIconReferences(items: INavData[]): INavData[] {
    return items.map((item) => {
      const simplifiedItem = { ...item };

      // Convert iconComponent to simple icon string if needed
      if (item.iconComponent && !item.icon) {
        simplifiedItem.icon = item.iconComponent.name || 'cil-circle';
        delete simplifiedItem.iconComponent;
      }

      if (item.children) {
        simplifiedItem.children = this.simplifyIconReferences(item.children);
      }

      return simplifiedItem;
    });
  }

  /**
   * Filters navigation items to only include specific URLs
   * @param items - Navigation items to filter
   * @param allowedUrls - Array of allowed URLs
   * @returns Filtered navigation items
   */
  private filterItemsByUrls(items: INavData[], allowedUrls: string[]): INavData[] {
    return items.filter((item) => {
      // Include title items (section headers)
      if (item.title) {
        return true;
      }

      // Include items with allowed URLs
      if (item.url && typeof item.url === 'string' && allowedUrls.includes(item.url)) {
        return true;
      }

      // Include items with children that have allowed URLs
      if (item.children) {
        const filteredChildren = this.filterItemsByUrls(item.children, allowedUrls);
        if (filteredChildren.length > 0) {
          item.children = filteredChildren;
          return true;
        }
      }

      return false;
    });
  }

  /**
   * Provides migration warnings for deprecated usage patterns
   * @param componentName - Name of the component using legacy patterns
   * @param deprecatedFeatures - List of deprecated features being used
   */
  logMigrationWarnings(componentName: string, deprecatedFeatures: string[]): void {
    if (deprecatedFeatures.length > 0) {
      console.warn(
        `[NavigationCompatibility] Component "${componentName}" is using deprecated features:`
      );
      deprecatedFeatures.forEach((feature) => {
        console.warn(`  - ${feature}`);
      });
      console.warn('Consider migrating to the new enhanced navigation structure.');
    }
  }

  /**
   * Provides a compatibility check for existing navigation configurations
   * @param navigationConfig - Existing navigation configuration
   * @returns Compatibility report
   */
  checkCompatibility(navigationConfig: any): CompatibilityReport {
    const issues: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for legacy INavData usage
    if (Array.isArray(navigationConfig) && navigationConfig.length > 0) {
      const firstItem = navigationConfig[0];

      if (!firstItem.priority && !firstItem.requiredRoles) {
        warnings.push('Navigation items are using legacy INavData format');
        suggestions.push('Consider migrating to INavItemEnhanced for better functionality');
      }

      // Check for deprecated properties
      navigationConfig.forEach((item: any, index: number) => {
        if (item.badge && typeof item.badge === 'string') {
          issues.push(`Item ${index} uses deprecated string badge format`);
        }

        if (item.roles && !item.requiredRoles) {
          warnings.push(
            `Item ${index} uses deprecated 'roles' property, use 'requiredRoles' instead`
          );
        }
      });
    }

    return {
      isCompatible: issues.length === 0,
      issues,
      warnings,
      suggestions,
    };
  }
}

/**
 * Configuration interface for legacy component expectations
 */
export interface LegacyComponentExpectations {
  flattenHierarchy?: boolean;
  removeBadges?: boolean;
  simplifyIcons?: boolean;
  filterByUrls?: boolean;
  allowedUrls?: string[];
}

/**
 * Interface for compatibility report results
 */
export interface CompatibilityReport {
  isCompatible: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
}
