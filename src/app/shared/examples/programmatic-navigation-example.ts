import { Injectable } from '@angular/core';
import { NavigationService } from '../../core/services/ui/navigation.service';
import { UserRole } from '../types/navigation.types';

/**
 * Ejemplo de uso de la API de configuración programática de navegación
 * 
 * Este servicio demuestra cómo usar la API para personalizar dinámicamente
 * la navegación del sidebar de administración.
 */
@Injectable({
  providedIn: 'root'
})
export class ProgrammaticNavigationExample {

  constructor(private navigationService: NavigationService) {}

  /**
   * Ejemplo 1: Configuración básica de elementos
   */
  configureBasicElements(): void {
    // Cambiar el icono del dashboard
    this.navigationService.setElementIcon('/admin/dashboard', 'cil-home');

    // Agregar badge de notificación a comentarios
    this.navigationService.setElementBadge('/admin/control/comentarios', {
      color: 'danger',
      text: 'Nuevo'
    });

    // Aumentar la prioridad de "Nueva Entrada"
    this.navigationService.setElementPriority('/admin/control/entradas/crear', 100);

    // Ocultar herramientas de desarrollo para usuarios no desarrolladores
    this.navigationService.setElementVisibility('/admin/control/mantenimiento/dev-tools', false);
  }

  /**
   * Ejemplo 2: Configuración basada en roles
   */
  configureByUserRole(userRole: UserRole): void {
    switch (userRole) {
      case UserRole.AUTOR:
        // Para autores, destacar las funciones de contenido
        this.navigationService.setElementBadge('/admin/control/entradas', {
          color: 'success',
          text: 'Principal'
        });
        
        // Ocultar gestión de usuarios
        this.navigationService.setElementVisibility('/admin/control/gestion/usuarios', false);
        break;

      case UserRole.EDITOR:
        // Para editores, destacar moderación
        this.navigationService.setElementBadge('/admin/control/comentarios', {
          color: 'warning',
          text: 'Moderar'
        });
        break;

      case UserRole.ADMINISTRADOR:
        // Para administradores, destacar gestión de usuarios
        this.navigationService.setElementBadge('/admin/control/gestion/usuarios', {
          color: 'info',
          text: 'Gestión'
        });
        break;

      case UserRole.DESARROLLADOR:
        // Para desarrolladores, crear grupo de herramientas
        this.createDeveloperToolsGroup();
        break;
    }
  }

  /**
   * Ejemplo 3: Creación de grupos dinámicos
   */
  createDeveloperToolsGroup(): void {
    this.navigationService.createNavigationGroup('dev-tools-group', {
      title: 'Herramientas de Desarrollo',
      icon: 'cil-code',
      priority: 85,
      items: [
        '/admin/control/mantenimiento/logs',
        '/admin/control/mantenimiento/database',
        '/admin/control/mantenimiento/dev-tools'
      ],
      collapsible: true,
      defaultExpanded: false,
      requiredRoles: [UserRole.DESARROLLADOR, UserRole.PROPIETARIO]
    });
  }

  /**
   * Ejemplo 4: Configuración de acciones contextuales
   */
  addContextualActions(): void {
    // Agregar acción rápida para crear entrada
    this.navigationService.addElementAction('/admin/control/entradas', {
      name: 'Crear Rápido',
      icon: 'cil-plus',
      action: () => {
        // Lógica para crear entrada rápida
        console.log('Creando entrada rápida...');
      },
      tooltip: 'Crear nueva entrada rápidamente'
    });

    // Agregar acción para exportar usuarios
    this.navigationService.addElementAction('/admin/control/gestion/usuarios', {
      name: 'Exportar',
      icon: 'cil-cloud-download',
      action: () => {
        // Lógica para exportar usuarios
        console.log('Exportando usuarios...');
      },
      tooltip: 'Exportar lista de usuarios'
    });

    // Agregar acción para limpiar logs
    this.navigationService.addElementAction('/admin/control/mantenimiento/logs', {
      name: 'Limpiar',
      icon: 'cil-trash',
      action: () => {
        // Lógica para limpiar logs
        console.log('Limpiando logs...');
      },
      tooltip: 'Limpiar logs del sistema'
    });
  }

  /**
   * Ejemplo 5: Configuración dinámica basada en estado del sistema
   */
  configureBasedOnSystemState(systemState: {
    hasUnmoderatedComments: boolean;
    hasDraftEntries: boolean;
    hasSystemAlerts: boolean;
    maintenanceMode: boolean;
  }): void {
    // Configurar badges basados en el estado del sistema
    if (systemState.hasUnmoderatedComments) {
      this.navigationService.setElementBadge('/admin/control/comentarios', {
        color: 'danger',
        text: 'Pendientes'
      });
    }

    if (systemState.hasDraftEntries) {
      this.navigationService.setElementBadge('/admin/control/entradas/entradas-temporales', {
        color: 'warning',
        text: 'Borradores'
      });
    }

    if (systemState.hasSystemAlerts) {
      this.navigationService.setElementBadge('/admin/control/mantenimiento/logs', {
        color: 'danger',
        text: 'Alertas'
      });
    }

    // En modo mantenimiento, destacar herramientas de mantenimiento
    if (systemState.maintenanceMode) {
      this.navigationService.setElementPriority('/admin/control/mantenimiento', 95);
      this.navigationService.setElementBadge('/admin/control/mantenimiento', {
        color: 'warning',
        text: 'Activo'
      });
    }
  }

  /**
   * Ejemplo 6: Configuración temporal con restauración
   */
  applyTemporaryConfiguration(): () => void {
    // Guardar configuración actual
    const currentConfig = this.navigationService.exportProgrammaticConfigurations();

    // Aplicar configuración temporal
    this.navigationService.setElementBadge('/admin/dashboard', {
      color: 'success',
      text: 'Temporal'
    });

    this.navigationService.setElementPriority('/admin/control/configuracion', 100);

    // Retornar función para restaurar configuración
    return () => {
      this.navigationService.resetProgrammaticConfigurations();
      this.navigationService.importProgrammaticConfigurations(currentConfig);
    };
  }

  /**
   * Ejemplo 7: Configuración completa de elemento
   */
  configureCompleteElement(): void {
    this.navigationService.configureElement('/admin/control/entradas', {
      icon: 'cil-pencil',
      badge: {
        color: 'success',
        text: 'Activo'
      },
      priority: 90,
      visible: true,
      requiredRoles: [UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR],
      contextualActions: [
        {
          name: 'Nueva',
          icon: 'cil-plus',
          action: () => console.log('Nueva entrada'),
          tooltip: 'Crear nueva entrada'
        },
        {
          name: 'Importar',
          icon: 'cil-cloud-upload',
          action: () => console.log('Importar entradas'),
          tooltip: 'Importar entradas desde archivo'
        }
      ]
    });
  }

  /**
   * Ejemplo 8: Configuración reactiva basada en observables
   */
  setupReactiveConfiguration(): void {
    // Obtener API programática
    const api = this.navigationService.getProgrammaticAPI();

    // Suscribirse a cambios de configuración
    api.getConfigurationChanges().subscribe(configs => {
      console.log('Configuraciones actualizadas:', configs.size);
      
      // Aplicar lógica adicional cuando cambian las configuraciones
      configs.forEach((config, itemId) => {
        if (config.badge && config.badge.color === 'danger') {
          console.log(`Elemento ${itemId} tiene badge crítico`);
        }
      });
    });

    // Suscribirse a cambios de grupos
    api.getGroupChanges().subscribe(groups => {
      console.log('Grupos actualizados:', groups.size);
    });
  }

  /**
   * Ejemplo 9: Configuración de tema personalizado
   */
  applyCustomTheme(theme: 'dark' | 'light' | 'colorful'): void {
    switch (theme) {
      case 'dark':
        // Configurar iconos para tema oscuro
        this.navigationService.setElementIcon('/admin/dashboard', 'cil-moon');
        break;

      case 'light':
        // Configurar iconos para tema claro
        this.navigationService.setElementIcon('/admin/dashboard', 'cil-sun');
        break;

      case 'colorful':
        // Configurar badges coloridos
        this.navigationService.setElementBadge('/admin/control/entradas', {
          color: 'primary',
          text: '✨'
        });
        this.navigationService.setElementBadge('/admin/control/comentarios', {
          color: 'success',
          text: '💬'
        });
        break;
    }
  }

  /**
   * Ejemplo 10: Configuración de accesibilidad
   */
  configureAccessibility(options: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
  }): void {
    if (options.highContrast) {
      // Usar badges de alto contraste
      this.navigationService.setElementBadge('/admin/control/comentarios', {
        color: 'danger',
        text: 'IMPORTANTE'
      });
    }

    if (options.largeText) {
      // Configurar tooltips más descriptivos
      this.navigationService.addElementAction('/admin/dashboard', {
        name: 'Ayuda',
        icon: 'cil-info',
        action: () => console.log('Mostrar ayuda'),
        tooltip: 'Mostrar información de ayuda detallada para el dashboard principal'
      });
    }

    if (options.reducedMotion) {
      // Configurar elementos para reducir animaciones
      // (esto se manejaría en el CSS, pero podemos marcar elementos)
      this.navigationService.configureElement('/admin/dashboard', {
        // Marcar para CSS que no debe tener animaciones
      });
    }
  }
}

/**
 * Ejemplo de uso en un componente
 */
export class NavigationConfigurationUsageExample {
  
  constructor(
    private navigationService: NavigationService,
    private exampleService: ProgrammaticNavigationExample
  ) {}

  ngOnInit(): void {
    // Configurar elementos básicos
    this.exampleService.configureBasicElements();

    // Configurar basado en rol del usuario actual
    const currentUserRole = UserRole.ADMINISTRADOR; // Obtener del servicio de autenticación
    this.exampleService.configureByUserRole(currentUserRole);

    // Agregar acciones contextuales
    this.exampleService.addContextualActions();

    // Configurar basado en estado del sistema
    this.exampleService.configureBasedOnSystemState({
      hasUnmoderatedComments: true,
      hasDraftEntries: false,
      hasSystemAlerts: true,
      maintenanceMode: false
    });

    // Configurar observables reactivos
    this.exampleService.setupReactiveConfiguration();
  }

  onThemeChange(theme: 'dark' | 'light' | 'colorful'): void {
    this.exampleService.applyCustomTheme(theme);
  }

  onAccessibilityChange(options: any): void {
    this.exampleService.configureAccessibility(options);
  }

  onTemporaryMode(): void {
    const restore = this.exampleService.applyTemporaryConfiguration();
    
    // Restaurar después de 5 segundos
    setTimeout(restore, 5000);
  }
}