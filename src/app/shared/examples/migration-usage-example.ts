/**
 * Example usage of the navigation migration tools
 * This file demonstrates how to use the migration service and compatibility service
 * to migrate existing navigation configurations to the new enhanced structure
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { INavData } from '@coreui/angular';
import { NavigationMigrationService } from '../utils/navigation-migration.service';
import {
  NavigationCompatibilityService,
  LegacyComponentExpectations,
} from '../services/navigation-compatibility.service';
import { INavItemEnhanced, UserRole } from '../types/navigation.types';

/**
 * Example service showing how to integrate migration tools into your application
 */
@Injectable({
  providedIn: 'root',
})
export class MigrationUsageExampleService {
  constructor(
    private migrationService: NavigationMigrationService,
    private compatibilityService: NavigationCompatibilityService,
  ) {}

  /**
   * Example 1: Basic migration of legacy navigation
   */
  basicMigrationExample(): void {
    console.log('=== Basic Migration Example ===');

    // Legacy navigation configuration (what you might have currently)
    const legacyNavigation: INavData[] = [
      {
        name: 'Dashboard',
        url: '/admin/dashboard',
        iconComponent: { name: 'cil-speedometer' },
      },
      {
        name: 'Entradas',
        url: '/admin/entradas', // Old URL format
        iconComponent: { name: 'cil-pencil' },
        children: [
          {
            name: 'Nueva Entrada',
            url: '/admin/entradas/crear',
          },
          {
            name: 'Todas las Entradas',
            url: '/admin/entradas',
          },
        ],
      },
      {
        name: 'Mi Perfil',
        url: '/admin/perfil', // Old URL format
        iconComponent: { name: 'cil-user' },
      },
    ];

    // Migrate to enhanced format
    const enhancedNavigation =
      this.migrationService.migrateLegacyNavigation(legacyNavigation);

    console.log('Original items:', legacyNavigation.length);
    console.log('Migrated items:', enhancedNavigation.length);
    console.log('First migrated item:', enhancedNavigation[0]);

    // Validate the migrated structure
    const validation =
      this.migrationService.validateMigratedStructure(enhancedNavigation);
    console.log('Validation result:', validation);

    if (!validation.isValid) {
      console.warn('Migration issues found:', validation.issues);
    }
  }

  /**
   * Example 2: Preserving custom configurations during migration
   */
  preserveCustomConfigExample(): void {
    console.log('=== Preserve Custom Config Example ===');

    // Original migrated navigation
    const migratedNavigation: INavItemEnhanced[] = [
      {
        name: 'Dashboard',
        url: '/admin/dashboard',
        priority: 100,
        requiredRoles: [UserRole.AUTOR, UserRole.EDITOR],
      },
      {
        name: 'Entradas',
        url: '/admin/control/entradas',
        priority: 85,
        requiredRoles: [UserRole.AUTOR, UserRole.EDITOR],
      },
    ];

    // User's custom configuration (e.g., from user preferences or admin settings)
    const customConfig: Partial<INavItemEnhanced>[] = [
      {
        url: '/admin/dashboard',
        priority: 150, // User wants dashboard to have higher priority
        badge: { color: 'success', text: 'Custom' },
      },
      {
        url: '/admin/control/entradas',
        badge: { color: 'info', text: 'Hot' },
      },
    ];

    // Apply custom configurations
    const finalNavigation = this.migrationService.preserveCustomConfigurations(
      migratedNavigation,
      customConfig,
    );

    console.log('Final navigation with custom config:', finalNavigation);
    console.log('Dashboard priority:', finalNavigation[0].priority); // Should be 150
    console.log('Dashboard badge:', finalNavigation[0].badge); // Should be custom badge
  }

  /**
   * Example 3: Using compatibility service for legacy components
   */
  legacyCompatibilityExample(): void {
    console.log('=== Legacy Compatibility Example ===');

    // Enhanced navigation (new format)
    const enhancedNavigation: INavItemEnhanced[] = [
      {
        name: 'Dashboard',
        url: '/admin/dashboard',
        iconComponent: { name: 'cil-speedometer' },
        priority: 100,
        requiredRoles: [UserRole.AUTOR],
        badge: { color: 'info', text: 'Main' },
        dynamicBadge: {
          service: 'BadgeCounterService',
          method: 'getDashboardCount',
          refreshInterval: 30000,
        },
      },
      {
        name: 'Content',
        url: '/admin/content',
        priority: 90,
        requiredRoles: [UserRole.AUTOR],
        children: [
          {
            name: 'Posts',
            url: '/admin/content/posts',
            priority: 95,
            requiredRoles: [UserRole.AUTOR],
          },
        ],
      },
    ];

    // Convert to legacy format for old components
    const legacyFormat =
      this.compatibilityService.convertToLegacyFormat(enhancedNavigation);
    console.log('Legacy format:', legacyFormat);

    // Adapt for specific legacy component requirements
    const legacyExpectations: LegacyComponentExpectations = {
      flattenHierarchy: true, // Component doesn't support nested items
      removeBadges: true, // Component doesn't support badges
      simplifyIcons: true, // Component only supports string icons
    };

    const adaptedNavigation = this.compatibilityService.adaptForLegacyComponent(
      enhancedNavigation,
      legacyExpectations,
    );

    console.log('Adapted for legacy component:', adaptedNavigation);
  }

  /**
   * Example 4: Handling legacy route redirects
   */
  async legacyRouteRedirectExample(): Promise<void> {
    console.log('=== Legacy Route Redirect Example ===');

    const legacyUrls = [
      '/admin/entradas',
      '/admin/usuarios',
      '/admin/perfil',
      '/admin/comentarios',
    ];

    for (const legacyUrl of legacyUrls) {
      const newUrl =
        this.compatibilityService.handleLegacyRouteRedirect(legacyUrl);
      console.log(`${legacyUrl} -> ${newUrl}`);

      // In a real application, you might set up route guards or redirects
      if (newUrl) {
        console.log(`Would redirect ${legacyUrl} to ${newUrl}`);
        // await this.compatibilityService.redirectLegacyRoute(legacyUrl);
      }
    }
  }

  /**
   * Example 5: Compatibility checking for existing configurations
   */
  compatibilityCheckExample(): void {
    console.log('=== Compatibility Check Example ===');

    // Example of problematic legacy configuration
    const problematicConfig = [
      {
        name: 'Dashboard',
        url: '/admin/dashboard',
        badge: 'string-badge', // Deprecated format
      },
      {
        name: 'Users',
        url: '/admin/users',
        roles: ['admin'], // Deprecated property
        // Missing requiredRoles
      },
      {
        // Missing name
        url: '/admin/test',
      },
    ];

    const compatibilityReport =
      this.compatibilityService.checkCompatibility(problematicConfig);

    console.log('Compatibility Report:');
    console.log('Is Compatible:', compatibilityReport.isCompatible);
    console.log('Issues:', compatibilityReport.issues);
    console.log('Warnings:', compatibilityReport.warnings);
    console.log('Suggestions:', compatibilityReport.suggestions);

    // Log migration warnings for component
    this.compatibilityService.logMigrationWarnings('ExampleComponent', [
      'Using deprecated string badge format',
      'Using deprecated roles property',
    ]);
  }

  /**
   * Example 6: Complete migration workflow
   */
  completeMigrationWorkflow(): Observable<INavItemEnhanced[]> {
    console.log('=== Complete Migration Workflow ===');

    // Step 1: Load existing legacy navigation
    const legacyNavigation$ = this.loadLegacyNavigation();

    return legacyNavigation$.pipe(
      map((legacyItems) => {
        // Step 2: Check compatibility
        const compatibilityReport =
          this.compatibilityService.checkCompatibility(legacyItems);

        if (!compatibilityReport.isCompatible) {
          console.warn(
            'Compatibility issues found:',
            compatibilityReport.issues,
          );
        }

        // Step 3: Migrate to enhanced format
        const migratedItems =
          this.migrationService.migrateLegacyNavigation(legacyItems);

        // Step 4: Validate migrated structure
        const validation =
          this.migrationService.validateMigratedStructure(migratedItems);

        if (!validation.isValid) {
          throw new Error(
            `Migration validation failed: ${validation.issues.join(', ')}`,
          );
        }

        // Step 5: Apply any custom configurations
        const customConfig = this.loadCustomConfiguration();
        const finalItems = this.migrationService.preserveCustomConfigurations(
          migratedItems,
          customConfig,
        );

        console.log('Migration completed successfully!');
        console.log(`Migrated ${finalItems.length} navigation items`);

        return finalItems;
      }),
    );
  }

  /**
   * Example 7: Using migration in Angular component
   */
  getNavigationForComponent(
    componentType: 'modern' | 'legacy',
  ): Observable<INavData[] | INavItemEnhanced[]> {
    // Get enhanced navigation
    const enhancedNavigation$ = this.completeMigrationWorkflow();

    if (componentType === 'legacy') {
      // Convert to legacy format for old components
      return enhancedNavigation$.pipe(
        map((enhancedItems) =>
          this.compatibilityService.convertToLegacyFormat(enhancedItems),
        ),
      );
    }

    return enhancedNavigation$;
  }

  /**
   * Helper method to simulate loading legacy navigation
   */
  private loadLegacyNavigation(): Observable<INavData[]> {
    const legacyItems: INavData[] = [
      {
        name: 'Dashboard',
        url: '/admin/dashboard',
        iconComponent: { name: 'cil-speedometer' },
      },
      {
        name: 'Entradas',
        url: '/admin/entradas',
        iconComponent: { name: 'cil-pencil' },
      },
    ];

    return of(legacyItems);
  }

  /**
   * Helper method to simulate loading custom configuration
   */
  private loadCustomConfiguration(): Partial<INavItemEnhanced>[] {
    return [
      {
        url: '/admin/dashboard',
        priority: 150,
        badge: { color: 'success', text: 'Custom' },
      },
    ];
  }
}

/**
 * Example Angular component using the migration tools
 */
export class ExampleNavigationComponent {
  constructor(
    private migrationExample: MigrationUsageExampleService,
    private compatibilityService: NavigationCompatibilityService,
  ) {}

  ngOnInit(): void {
    // Run all examples
    this.migrationExample.basicMigrationExample();
    this.migrationExample.preserveCustomConfigExample();
    this.migrationExample.legacyCompatibilityExample();
    this.migrationExample.legacyRouteRedirectExample();
    this.migrationExample.compatibilityCheckExample();

    // Get navigation for this component
    this.migrationExample
      .getNavigationForComponent('modern')
      .subscribe((navigation) => {
        console.log('Navigation for modern component:', navigation);
      });

    this.migrationExample
      .getNavigationForComponent('legacy')
      .subscribe((navigation) => {
        console.log('Navigation for legacy component:', navigation);
      });
  }
}

/**
 * Example route guard that handles legacy route redirects
 */
export class LegacyRouteGuard {
  constructor(private compatibilityService: NavigationCompatibilityService) {}

  canActivate(route: any): Promise<boolean> {
    const url = route.url.join('/');
    const fullUrl = `/${url}`;

    // Check if this is a legacy route that needs redirection
    return this.compatibilityService
      .redirectLegacyRoute(fullUrl)
      .then((redirected) => {
        if (redirected) {
          return false; // Prevent activation, redirect happened
        }
        return true; // Allow normal activation
      });
  }
}

/**
 * Example usage in app module or routing configuration
 */
export const MIGRATION_EXAMPLES = {
  // Example of setting up route redirects in routing module
  setupLegacyRouteRedirects: () => {
    return [
      { path: 'admin/entradas', redirectTo: 'admin/control/entradas' },
      { path: 'admin/usuarios', redirectTo: 'admin/control/gestion/usuarios' },
      { path: 'admin/perfil', redirectTo: 'admin/control/gestion/miperfil' },
      { path: 'admin/comentarios', redirectTo: 'admin/control/comentarios' },
      { path: 'admin/paginas', redirectTo: 'admin/control/paginas' },
      { path: 'admin/multimedia', redirectTo: 'admin/control/contenido' },
    ];
  },

  // Example of migration configuration
  migrationConfig: {
    preserveCustomConfig: true,
    validateOutput: true,
    backupOriginal: true,
    outputPath: 'src/app/admin/default-layout/_nav.migrated.ts',
  },
};

/**
 * Example CLI usage commands:
 *
 * # Basic migration
 * npm run migrate-navigation --input=src/app/admin/default-layout/_nav.ts
 *
 * # Migration with all options
 * npm run migrate-navigation \
 *   --input=src/app/admin/default-layout/_nav.ts \
 *   --output=src/app/admin/default-layout/_nav.migrated.ts \
 *   --preserve-custom \
 *   --validate \
 *   --backup
 *
 * # Check compatibility only
 * npm run check-navigation-compatibility --input=src/app/admin/default-layout/_nav.ts
 */
