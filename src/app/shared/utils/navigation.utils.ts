import { UserRole, INavItemEnhanced, DEFAULT_PERMISSION_MATRIX, RolePermissionMatrix } from '../types/navigation.types';

/**
 * Utilidades para manejo de navegación y permisos
 */
export class NavigationUtils {
  
  /**
   * Verifica si un rol tiene permisos para acceder a una funcionalidad específica
   */
  static hasPermission(userRole: UserRole, functionality: string, customMatrix?: RolePermissionMatrix): boolean {
    const matrix = customMatrix || DEFAULT_PERMISSION_MATRIX;
    
    if (!matrix[functionality]) {
      console.warn(`Functionality '${functionality}' not found in permission matrix`);
      return false;
    }
    
    return matrix[functionality][userRole as keyof typeof matrix[typeof functionality]] || false;
  }

  /**
   * Filtra elementos de navegación basado en los permisos del rol del usuario
   */
  static filterByPermissions(items: INavItemEnhanced[], userRole: UserRole): INavItemEnhanced[] {
    return items.filter(item => {
      // Si el item tiene roles requeridos específicos, verificar contra esos
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        return item.requiredRoles.includes(userRole);
      }
      
      // Si tiene un rol mínimo requerido, verificar jerarquía
      if (item.minRole) {
        return this.hasMinimumRole(userRole, item.minRole);
      }
      
      // Si no tiene restricciones específicas, permitir acceso
      return true;
    }).map(item => {
      // Recursivamente filtrar children si existen
      if (item.children && item.children.length > 0) {
        const filteredChildren = this.filterByPermissions(item.children, userRole);
        return {
          ...item,
          children: filteredChildren
        };
      }
      return item;
    });
  }

  /**
   * Verifica si un rol cumple con el rol mínimo requerido basado en jerarquía
   */
  static hasMinimumRole(userRole: UserRole, minRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.PROPIETARIO]: 7,
      [UserRole.ADMINISTRADOR]: 6,
      [UserRole.MANTENIMIENTO]: 5,
      [UserRole.DESARROLLADOR]: 4,
      [UserRole.EDITOR]: 3,
      [UserRole.AUTOR]: 2,
      [UserRole.LECTOR]: 1,
      [UserRole.ANONYMOUS]: 0
    };

    return roleHierarchy[userRole] >= roleHierarchy[minRole];
  }

  /**
   * Ordena elementos de navegación por prioridad
   */
  static sortByPriority(items: INavItemEnhanced[]): INavItemEnhanced[] {
    return items.sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      return priorityB - priorityA; // Orden descendente (mayor prioridad primero)
    });
  }

  /**
   * Agrupa elementos de navegación eliminando duplicados por URL
   */
  static removeDuplicatesByUrl(items: INavItemEnhanced[]): INavItemEnhanced[] {
    const seen = new Set<string>();
    const result: INavItemEnhanced[] = [];

    for (const item of items) {
      if (item.url && typeof item.url === 'string' && !seen.has(item.url)) {
        seen.add(item.url);
        result.push(item);
      } else if (!item.url) {
        // Items sin URL (como títulos de sección) siempre se incluyen
        result.push(item);
      }
    }

    return result;
  }



  /**
   * Encuentra elementos de navegación que requieren badges dinámicos
   */
  static findItemsWithDynamicBadges(items: INavItemEnhanced[]): INavItemEnhanced[] {
    const result: INavItemEnhanced[] = [];

    for (const item of items) {
      if (item.dynamicBadge) {
        result.push(item);
      }
      
      if (item.children && item.children.length > 0) {
        result.push(...this.findItemsWithDynamicBadges(item.children));
      }
    }

    return result;
  }

  /**
   * Convierte roles de string a enum UserRole
   */
  static parseUserRole(roleString: string): UserRole {
    const roleMap: { [key: string]: UserRole } = {
      'PROPI': UserRole.PROPIETARIO,
      'ADMIN': UserRole.ADMINISTRADOR,
      'MANTE': UserRole.MANTENIMIENTO,
      'EDITO': UserRole.EDITOR,
      'DESAR': UserRole.DESARROLLADOR,
      'AUTOR': UserRole.AUTOR,
      'LECTO': UserRole.LECTOR
    };

    return roleMap[roleString] || UserRole.ANONYMOUS;
  }

  /**
   * Genera un ID único para elementos de navegación basado en su URL o nombre
   */
  static generateItemId(item: INavItemEnhanced): string {
    if (item.url && typeof item.url === 'string') {
      return item.url.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    }
    
    if (item.name && typeof item.name === 'string') {
      return item.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    }
    
    return `nav-item-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Verifica si un elemento de navegación está activo basado en la URL actual
   */
  static isItemActive(item: INavItemEnhanced, currentUrl: string): boolean {
    if (!item.url || typeof item.url !== 'string') return false;
    
    // Coincidencia exacta
    if (item.url === currentUrl) return true;
    
    // Coincidencia de prefijo para rutas anidadas
    if (currentUrl.startsWith(item.url + '/')) return true;
    
    // Verificar children si existen
    if (item.children && item.children.length > 0) {
      return item.children.some(child => this.isItemActive(child, currentUrl));
    }
    
    return false;
  }

  /**
   * Aplica configuración responsiva a elementos de navegación
   */
  static applyResponsiveConfig(items: INavItemEnhanced[], screenWidth: number): INavItemEnhanced[] {
    return items.filter(item => {
      if (item.responsiveConfig?.hideOnMobile && screenWidth < 768) {
        return false;
      }
      
      if (item.responsiveConfig?.collapseThreshold && screenWidth < item.responsiveConfig.collapseThreshold) {
        // Aplicar lógica de colapso si es necesario
        return true;
      }
      
      return true;
    });
  }

  /**
   * Valida que la estructura de navegación no exceda la profundidad máxima permitida
   */
  static validateNavigationDepth(items: INavItemEnhanced[], currentDepth: number = 0): boolean {
    const maxDepth = 2; // Según los requisitos, máximo 2 niveles
    
    // Si la profundidad actual es igual o mayor al máximo, es inválida
    if (currentDepth >= maxDepth) {
      return false;
    }

    for (const item of items) {
      if (item.children && item.children.length > 0) {
        if (!this.validateNavigationDepth(item.children, currentDepth + 1)) {
          return false;
        }
      }
    }

    return true;
  }
}