import {
  INavItemEnhanced,
  NavigationConfig,
  NavigationSection,
  UserRole,
  NavigationErrorCodes,
} from '../types/navigation.types';
import { NavigationConstants } from '../constants/navigation.constants';

/**
 * Resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Error de validación
 */
export interface ValidationError {
  code: NavigationErrorCodes;
  message: string;
  item?: INavItemEnhanced;
  section?: NavigationSection;
}

/**
 * Advertencia de validación
 */
export interface ValidationWarning {
  message: string;
  item?: INavItemEnhanced;
  section?: NavigationSection;
}

/**
 * Validadores para estructura de navegación
 */
export class NavigationValidators {
  /**
   * Valida una configuración completa de navegación
   */
  static validateNavigationConfig(config: NavigationConfig): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validar secciones
    if (!config.sections || config.sections.length === 0) {
      result.errors.push({
        code: NavigationErrorCodes.INVALID_STRUCTURE,
        message: 'La configuración debe tener al menos una sección',
      });
      result.isValid = false;
    }

    // Validar límite de secciones
    if (
      config.sections &&
      config.sections.length > NavigationConstants.STRUCTURE_LIMITS.MAX_SECTIONS
    ) {
      result.warnings.push({
        message: `Se recomienda no exceder ${NavigationConstants.STRUCTURE_LIMITS.MAX_SECTIONS} secciones`,
      });
    }

    // Validar cada sección
    if (config.sections) {
      for (const section of config.sections) {
        const sectionResult = this.validateNavigationSection(section);
        result.errors.push(...sectionResult.errors);
        result.warnings.push(...sectionResult.warnings);

        if (!sectionResult.isValid) {
          result.isValid = false;
        }
      }
    }

    return result;
  }

  /**
   * Valida una sección de navegación
   */
  static validateNavigationSection(section: NavigationSection): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validar campos requeridos
    if (!section.id || section.id.trim() === '') {
      result.errors.push({
        code: NavigationErrorCodes.INVALID_STRUCTURE,
        message: 'La sección debe tener un ID válido',
        section,
      });
      result.isValid = false;
    }

    if (!section.title || section.title.trim() === '') {
      result.errors.push({
        code: NavigationErrorCodes.INVALID_STRUCTURE,
        message: 'La sección debe tener un título válido',
        section,
      });
      result.isValid = false;
    }

    // Validar límite de elementos por sección
    if (
      section.items &&
      section.items.length > NavigationConstants.STRUCTURE_LIMITS.MAX_ITEMS_PER_SECTION
    ) {
      result.warnings.push({
        message: `La sección '${section.title}' tiene demasiados elementos (${section.items.length}). Se recomienda no exceder ${NavigationConstants.STRUCTURE_LIMITS.MAX_ITEMS_PER_SECTION}`,
        section,
      });
    }

    // Validar roles requeridos
    if (section.requiredRoles && section.requiredRoles.length === 0) {
      result.warnings.push({
        message: `La sección '${section.title}' no tiene roles definidos, será accesible para todos`,
        section,
      });
    }

    return result;
  }

  /**
   * Valida un array de elementos de navegación
   */
  static validateNavigationItems(items: INavItemEnhanced[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    const seenUrls = new Set<string>();
    const seenIds = new Set<string>();

    for (const item of items) {
      const itemResult = this.validateNavigationItem(item, 0);
      result.errors.push(...itemResult.errors);
      result.warnings.push(...itemResult.warnings);

      if (!itemResult.isValid) {
        result.isValid = false;
      }

      // Verificar URLs duplicadas
      if (item.url && typeof item.url === 'string' && seenUrls.has(item.url)) {
        result.warnings.push({
          message: `URL duplicada encontrada: ${item.url}`,
          item,
        });
      } else if (item.url && typeof item.url === 'string') {
        seenUrls.add(item.url);
      }

      // Verificar IDs duplicados si existen
      const itemId = this.generateItemId(item);
      if (seenIds.has(itemId)) {
        result.warnings.push({
          message: `ID duplicado encontrado: ${itemId}`,
          item,
        });
      } else {
        seenIds.add(itemId);
      }
    }

    return result;
  }

  /**
   * Valida un elemento individual de navegación
   */
  static validateNavigationItem(item: INavItemEnhanced, depth: number = 0): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validar profundidad máxima (contando desde 0: 0=raíz, 1=primer nivel, 2=segundo nivel)
    if (depth >= NavigationConstants.STRUCTURE_LIMITS.MAX_DEPTH) {
      result.errors.push({
        code: NavigationErrorCodes.INVALID_STRUCTURE,
        message: `El elemento '${item.name}' excede la profundidad máxima permitida (${NavigationConstants.STRUCTURE_LIMITS.MAX_DEPTH} niveles)`,
        item,
      });
      result.isValid = false;
    }

    // Validar campos requeridos
    if (!item.name || (typeof item.name === 'string' && item.name.trim() === '')) {
      result.errors.push({
        code: NavigationErrorCodes.INVALID_STRUCTURE,
        message: 'El elemento debe tener un nombre válido',
        item,
      });
      result.isValid = false;
    }

    // Validar URL si no es un título de sección
    if (!item.title && (!item.url || (typeof item.url === 'string' && item.url.trim() === ''))) {
      result.warnings.push({
        message: `El elemento '${item.name}' no tiene URL definida`,
        item,
      });
    }

    // Validar configuración de badge dinámico
    if (item.dynamicBadge) {
      if (!item.dynamicBadge.service || !item.dynamicBadge.method) {
        result.errors.push({
          code: NavigationErrorCodes.CONFIGURATION_INVALID,
          message: `Badge dinámico mal configurado en '${item.name}': falta servicio o método`,
          item,
        });
        result.isValid = false;
      }
    }

    // Validar roles
    if (item.requiredRoles && item.minRole) {
      result.warnings.push({
        message: `El elemento '${item.name}' tiene tanto requiredRoles como minRole definidos. Se usará requiredRoles`,
        item,
      });
    }

    // Validar children recursivamente
    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        const childResult = this.validateNavigationItem(child, depth + 1);
        result.errors.push(...childResult.errors);
        result.warnings.push(...childResult.warnings);

        if (!childResult.isValid) {
          result.isValid = false;
        }
      }
    }

    return result;
  }

  /**
   * Valida que no existan elementos duplicados por URL
   */
  static validateNoDuplicateUrls(items: INavItemEnhanced[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    const urlMap = new Map<string, INavItemEnhanced[]>();

    this.collectUrls(items, urlMap);

    for (const [url, itemsWithUrl] of urlMap.entries()) {
      if (itemsWithUrl.length > 1) {
        result.warnings.push({
          message: `URL duplicada encontrada: ${url} (${itemsWithUrl.length} elementos)`,
        });
      }
    }

    return result;
  }

  /**
   * Valida que la jerarquía de roles sea consistente
   */
  static validateRoleHierarchy(items: INavItemEnhanced[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    for (const item of items) {
      if (item.children && item.children.length > 0) {
        // Los children no deberían tener permisos más restrictivos que el padre
        this.validateParentChildRoles(item, item.children, result);
      }
    }

    return result;
  }

  /**
   * Recolecta todas las URLs de los elementos de navegación
   */
  private static collectUrls(
    items: INavItemEnhanced[],
    urlMap: Map<string, INavItemEnhanced[]>
  ): void {
    for (const item of items) {
      if (item.url && typeof item.url === 'string') {
        if (!urlMap.has(item.url)) {
          urlMap.set(item.url, []);
        }
        urlMap.get(item.url)!.push(item);
      }

      if (item.children && item.children.length > 0) {
        this.collectUrls(item.children, urlMap);
      }
    }
  }

  /**
   * Valida la consistencia de roles entre padre e hijos
   */
  private static validateParentChildRoles(
    parent: INavItemEnhanced,
    children: INavItemEnhanced[],
    result: ValidationResult
  ): void {
    for (const child of children) {
      // Si el padre tiene roles específicos, los hijos deberían ser igual o más restrictivos
      if (parent.requiredRoles && child.requiredRoles) {
        const parentHasMorePermissiveRoles = parent.requiredRoles.some(
          (role) => !child.requiredRoles!.includes(role)
        );

        if (parentHasMorePermissiveRoles) {
          result.warnings.push({
            message: `El elemento hijo '${child.name}' tiene permisos más restrictivos que su padre '${parent.name}'`,
            item: child,
          });
        }
      }

      // Validar recursivamente
      if (child.children && child.children.length > 0) {
        this.validateParentChildRoles(child, child.children, result);
      }
    }
  }

  /**
   * Genera un ID único para un elemento
   */
  private static generateItemId(item: INavItemEnhanced): string {
    if (item.url && typeof item.url === 'string') {
      return item.url.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    }

    if (item.name && typeof item.name === 'string') {
      return item.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    }

    return `nav-item-${Math.random().toString(36).substr(2, 9)}`;
  }
}
