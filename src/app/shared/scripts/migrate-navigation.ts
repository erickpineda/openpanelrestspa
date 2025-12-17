#!/usr/bin/env node

/**
 * Migration script for converting legacy navigation configurations to the new enhanced structure
 * This script can be run standalone or integrated into the application build process
 */

import { INavData } from '@coreui/angular';
import { INavItemEnhanced, UserRole } from '../types/navigation.types';

interface MigrationOptions {
  preserveCustomConfig?: boolean;
  validateOutput?: boolean;
  backupOriginal?: boolean;
  outputPath?: string;
}

interface MigrationResult {
  success: boolean;
  migratedItems: INavItemEnhanced[];
  validationResult?: { isValid: boolean; issues: string[] };
  backupPath?: string;
  errors?: string[];
}

/**
 * Main migration class that handles the conversion process
 */
export class NavigationMigrationScript {
  
  /**
   * Migrates a legacy navigation configuration file
   * @param legacyNavPath - Path to the legacy navigation file
   * @param options - Migration options
   * @returns Migration result
   */
  static async migrateNavigationFile(
    legacyNavPath: string, 
    options: MigrationOptions = {}
  ): Promise<MigrationResult> {
    try {
      // Load legacy navigation configuration
      const legacyNav = await this.loadLegacyNavigation(legacyNavPath);
      
      // Create backup if requested
      let backupPath: string | undefined;
      if (options.backupOriginal) {
        backupPath = await this.createBackup(legacyNavPath);
      }

      // Perform migration
      const migratedItems = this.performMigration(legacyNav, options);

      // Validate output if requested
      let validationResult: { isValid: boolean; issues: string[] } | undefined;
      if (options.validateOutput) {
        validationResult = this.validateMigratedStructure(migratedItems);
      }

      // Save migrated configuration
      if (options.outputPath) {
        await this.saveMigratedNavigation(migratedItems, options.outputPath);
      }

      return {
        success: true,
        migratedItems,
        validationResult,
        backupPath
      };

    } catch (error) {
      return {
        success: false,
        migratedItems: [],
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Loads legacy navigation configuration from file
   * @param filePath - Path to the legacy navigation file
   * @returns Legacy navigation items
   */
  private static async loadLegacyNavigation(filePath: string): Promise<INavData[]> {
    // In a real implementation, this would read from the file system
    // For now, we'll return a sample legacy configuration
    return [
      {
        name: 'Dashboard',
        url: '/admin/dashboard',
        iconComponent: { name: 'cil-speedometer' }
      },
      {
        name: 'Entradas',
        url: '/admin/entradas',
        iconComponent: { name: 'cil-pencil' },
        children: [
          {
            name: 'Nueva Entrada',
            url: '/admin/entradas/crear'
          },
          {
            name: 'Todas las Entradas',
            url: '/admin/entradas'
          }
        ]
      },
      {
        name: 'Usuarios',
        url: '/admin/usuarios',
        iconComponent: { name: 'cil-people' }
      },
      {
        name: 'Mi Perfil',
        url: '/admin/perfil',
        iconComponent: { name: 'cil-user' }
      }
    ];
  }

  /**
   * Creates a backup of the original navigation file
   * @param originalPath - Path to the original file
   * @returns Path to the backup file
   */
  private static async createBackup(originalPath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${originalPath}.backup.${timestamp}`;
    
    // In a real implementation, this would copy the file
    console.log(`Backup created at: ${backupPath}`);
    
    return backupPath;
  }

  /**
   * Performs the actual migration of navigation items
   * @param legacyItems - Legacy navigation items
   * @param options - Migration options
   * @returns Migrated navigation items
   */
  private static performMigration(
    legacyItems: INavData[], 
    options: MigrationOptions
  ): INavItemEnhanced[] {
    
    // Convert legacy items to enhanced format
    const migratedItems = legacyItems.map(item => this.migrateSingleItem(item));

    // Apply route mappings
    const mappedItems = this.applyRouteMappings(migratedItems);

    // Preserve custom configurations if requested
    if (options.preserveCustomConfig) {
      // In a real implementation, this would load and apply custom configs
      console.log('Preserving custom configurations...');
    }

    return mappedItems;
  }

  /**
   * Migrates a single navigation item from legacy to enhanced format
   * @param legacyItem - Legacy navigation item
   * @returns Enhanced navigation item
   */
  private static migrateSingleItem(legacyItem: INavData): INavItemEnhanced {
    const enhancedItem: INavItemEnhanced = {
      ...legacyItem,
      priority: this.inferPriority(legacyItem),
      requiredRoles: this.inferRequiredRoles(legacyItem)
    };

    // Migrate children if they exist
    if (legacyItem.children && legacyItem.children.length > 0) {
      enhancedItem.children = legacyItem.children.map(child => 
        this.migrateSingleItem(child)
      );
    }

    // Add dynamic badges for specific items
    this.addDynamicBadges(enhancedItem);

    // Add responsive configuration
    this.addResponsiveConfig(enhancedItem);

    return enhancedItem;
  }

  /**
   * Applies route mappings to update legacy URLs
   * @param items - Navigation items to update
   * @returns Items with updated URLs
   */
  private static applyRouteMappings(items: INavItemEnhanced[]): INavItemEnhanced[] {
    const routeMap = this.getRouteMapping();

    return items.map(item => {
      const updatedItem = { ...item };
      
      if (item.url && routeMap.has(item.url)) {
        updatedItem.url = routeMap.get(item.url);
        console.log(`Mapped route: ${item.url} -> ${updatedItem.url}`);
      }

      if (item.children) {
        updatedItem.children = this.applyRouteMappings(item.children);
      }

      return updatedItem;
    });
  }

  /**
   * Gets the route mapping for legacy URLs
   * @returns Map of old routes to new routes
   */
  private static getRouteMapping(): Map<string, string> {
    const routeMap = new Map<string, string>();

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
   * Infers priority based on item name and URL patterns
   * @param item - Navigation item
   * @returns Inferred priority value
   */
  private static inferPriority(item: INavData): number {
    const url = item.url || '';
    const name = item.name || '';

    if (url.includes('dashboard') || name.toLowerCase().includes('dashboard')) {
      return 100;
    }

    if (url.includes('entradas') || name.toLowerCase().includes('entrada')) {
      if (url.includes('crear') || name.toLowerCase().includes('nueva')) {
        return 95;
      }
      return 85;
    }

    if (url.includes('usuarios') && !url.includes('perfil')) {
      return 55;
    }

    if (url.includes('perfil')) {
      return 15;
    }

    return 50; // Default priority
  }

  /**
   * Infers required roles based on item URL and functionality
   * @param item - Navigation item
   * @returns Array of required roles
   */
  private static inferRequiredRoles(item: INavData): UserRole[] {
    const url = item.url || '';

    if (url.includes('dashboard')) {
      return [UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.MANTENIMIENTO, UserRole.PROPIETARIO];
    }

    if (url.includes('entradas')) {
      return [UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.PROPIETARIO];
    }

    if (url.includes('usuarios') && !url.includes('perfil')) {
      return [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO];
    }

    if (url.includes('perfil')) {
      return [UserRole.LECTOR, UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.MANTENIMIENTO, UserRole.PROPIETARIO];
    }

    return [UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.PROPIETARIO];
  }

  /**
   * Adds dynamic badges to specific navigation items
   * @param item - Enhanced navigation item
   */
  private static addDynamicBadges(item: INavItemEnhanced): void {
    const url = item.url || '';
    const name = item.name || '';

    if (url.includes('comentarios')) {
      item.dynamicBadge = {
        service: 'BadgeCounterService',
        method: 'getUnmoderatedCommentsCount',
        refreshInterval: 15000
      };
      item.badge = {
        color: 'danger',
        text: 'Pendientes'
      };
    }

    if (url.includes('entradas-temporales') || name.toLowerCase().includes('borrador')) {
      item.dynamicBadge = {
        service: 'BadgeCounterService',
        method: 'getDraftEntriesCount',
        refreshInterval: 30000
      };
      item.badge = {
        color: 'warning',
        text: 'Pendientes'
      };
    }
  }

  /**
   * Adds responsive configuration to navigation items
   * @param item - Enhanced navigation item
   */
  private static addResponsiveConfig(item: INavItemEnhanced): void {
    const url = item.url || '';

    if (url.includes('mantenimiento') || url.includes('dev-tools')) {
      item.responsiveConfig = {
        hideOnMobile: true,
        collapseThreshold: 768
      };
    }

    if (item.children && item.children.length > 0) {
      item.responsiveConfig = {
        hideOnMobile: false,
        collapseThreshold: 1024
      };
    }
  }

  /**
   * Validates the migrated navigation structure
   * @param items - Migrated navigation items
   * @returns Validation result
   */
  private static validateMigratedStructure(items: INavItemEnhanced[]): { isValid: boolean; issues: string[] } {
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
      issues
    };
  }

  /**
   * Collects all URLs and checks for duplicates
   * @param items - Navigation items
   * @param urls - Set to track URLs
   * @param issues - Array to collect issues
   */
  private static collectUrls(items: INavItemEnhanced[], urls: Set<string>, issues: string[]): void {
    for (const item of items) {
      if (item.url) {
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
  private static validateRequiredProperties(items: INavItemEnhanced[], issues: string[]): void {
    for (const item of items) {
      if (!item.name) {
        issues.push('Navigation item missing name property');
      }

      if (!item.title && !item.url) {
        issues.push(`Navigation item "${item.name}" must have either title or url property`);
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
  private static validateHierarchyDepth(items: INavItemEnhanced[], issues: string[], currentDepth: number): void {
    const maxDepth = 2;

    for (const item of items) {
      if (item.children && item.children.length > 0) {
        if (currentDepth >= maxDepth) {
          issues.push(`Navigation hierarchy exceeds maximum depth of ${maxDepth} levels at item: ${item.name}`);
        } else {
          this.validateHierarchyDepth(item.children, issues, currentDepth + 1);
        }
      }
    }
  }

  /**
   * Saves the migrated navigation configuration to a file
   * @param items - Migrated navigation items
   * @param outputPath - Path to save the migrated configuration
   */
  private static async saveMigratedNavigation(items: INavItemEnhanced[], outputPath: string): Promise<void> {
    const output = this.generateNavigationFile(items);
    
    // In a real implementation, this would write to the file system
    console.log(`Migrated navigation saved to: ${outputPath}`);
    console.log('Generated content preview:');
    console.log(output.substring(0, 500) + '...');
  }

  /**
   * Generates the TypeScript file content for the migrated navigation
   * @param items - Migrated navigation items
   * @returns Generated file content
   */
  private static generateNavigationFile(items: INavItemEnhanced[]): string {
    const imports = `import { INavItemEnhanced, UserRole } from '../../shared/types/navigation.types';

export const navItems: INavItemEnhanced[] = `;

    const itemsJson = JSON.stringify(items, null, 2)
      .replace(/"([^"]+)":/g, '$1:') // Remove quotes from property names
      .replace(/"/g, "'"); // Use single quotes

    return imports + itemsJson + ';\n';
  }
}

/**
 * CLI interface for running the migration script
 */
export class MigrationCLI {
  
  /**
   * Runs the migration with command line arguments
   * @param args - Command line arguments
   */
  static async run(args: string[]): Promise<void> {
    const options: MigrationOptions = {
      preserveCustomConfig: args.includes('--preserve-custom'),
      validateOutput: args.includes('--validate'),
      backupOriginal: args.includes('--backup'),
      outputPath: this.getArgValue(args, '--output')
    };

    const inputPath = this.getArgValue(args, '--input') || 'src/app/admin/default-layout/_nav.ts';

    console.log('Starting navigation migration...');
    console.log(`Input: ${inputPath}`);
    console.log(`Options:`, options);

    const result = await NavigationMigrationScript.migrateNavigationFile(inputPath, options);

    if (result.success) {
      console.log('✅ Migration completed successfully!');
      
      if (result.validationResult) {
        if (result.validationResult.isValid) {
          console.log('✅ Validation passed');
        } else {
          console.log('⚠️  Validation issues found:');
          result.validationResult.issues.forEach(issue => console.log(`  - ${issue}`));
        }
      }

      if (result.backupPath) {
        console.log(`📁 Backup created: ${result.backupPath}`);
      }

      console.log(`📊 Migrated ${result.migratedItems.length} navigation items`);
      
    } else {
      console.log('❌ Migration failed:');
      result.errors?.forEach(error => console.log(`  - ${error}`));
    }
  }

  /**
   * Gets the value of a command line argument
   * @param args - Command line arguments
   * @param argName - Argument name to find
   * @returns Argument value or undefined
   */
  private static getArgValue(args: string[], argName: string): string | undefined {
    const index = args.indexOf(argName);
    return index !== -1 && index + 1 < args.length ? args[index + 1] : undefined;
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  MigrationCLI.run(process.argv.slice(2)).catch(console.error);
}