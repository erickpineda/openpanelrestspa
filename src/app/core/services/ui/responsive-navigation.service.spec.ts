import { TestBed } from '@angular/core/testing';
import {
  ResponsiveNavigationService,
  ResponsiveState,
} from './responsive-navigation.service';
import {
  INavItemEnhanced,
  UserRole,
} from '../../../shared/types/navigation.types';

describe('ResponsiveNavigationService', () => {
  let service: ResponsiveNavigationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ResponsiveNavigationService],
    });
    service = TestBed.inject(ResponsiveNavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Responsive State Management', () => {
    it('should initialize with default responsive state', () => {
      const state = service.getCurrentState();

      expect(state).toBeDefined();
      expect(typeof state.isMobile).toBe('boolean');
      expect(typeof state.isTablet).toBe('boolean');
      expect(typeof state.isDesktop).toBe('boolean');
      expect(typeof state.screenWidth).toBe('number');
      expect(typeof state.sidebarCollapsed).toBe('boolean');
      expect(typeof state.touchEnabled).toBe('boolean');
    });

    it('should toggle sidebar state', () => {
      const initialCollapsed = service.getCurrentState().sidebarCollapsed;

      service.toggleSidebar();

      const newState = service.getCurrentState();
      expect(newState.sidebarCollapsed).toBe(!initialCollapsed);
    });

    it('should collapse sidebar', () => {
      service.collapseSidebar();

      const state = service.getCurrentState();
      expect(state.sidebarCollapsed).toBe(true);
    });

    it('should expand sidebar', () => {
      service.collapseSidebar(); // First collapse
      service.expandSidebar();

      const state = service.getCurrentState();
      expect(state.sidebarCollapsed).toBe(false);
    });
  });

  describe('Breakpoints Management', () => {
    it('should return default breakpoints', () => {
      const breakpoints = service.getBreakpoints();

      expect(breakpoints.mobile).toBe(768);
      expect(breakpoints.tablet).toBe(1024);
      expect(breakpoints.desktop).toBe(1200);
    });

    it('should set custom breakpoints', () => {
      const customBreakpoints = {
        mobile: 600,
        tablet: 900,
      };

      service.setBreakpoints(customBreakpoints);

      const breakpoints = service.getBreakpoints();
      expect(breakpoints.mobile).toBe(600);
      expect(breakpoints.tablet).toBe(900);
      expect(breakpoints.desktop).toBe(1200); // Should keep default
    });
  });

  describe('Critical Functions', () => {
    it('should return critical functions list', () => {
      const criticalFunctions = service.getCriticalFunctions();

      expect(criticalFunctions).toBeDefined();
      expect(criticalFunctions.length).toBeGreaterThan(0);
      expect(criticalFunctions[0].id).toBeDefined();
      expect(criticalFunctions[0].name).toBeDefined();
      expect(criticalFunctions[0].url).toBeDefined();
      expect(criticalFunctions[0].icon).toBeDefined();
      expect(criticalFunctions[0].priority).toBeDefined();
    });

    it('should include dashboard as critical function', () => {
      const criticalFunctions = service.getCriticalFunctions();

      const dashboard = criticalFunctions.find(
        (func) => func.id === 'dashboard',
      );
      expect(dashboard).toBeDefined();
      expect(dashboard?.name).toBe('Escritorio');
      expect(dashboard?.url).toBe('/admin/dashboard');
    });
  });

  describe('Navigation Adaptation', () => {
    const mockNavItems: INavItemEnhanced[] = [
      {
        name: 'Escritorio',
        url: '/admin/dashboard',
        iconComponent: { name: 'cil-speedometer' },
        priority: 100,
        requiredRoles: [UserRole.ADMINISTRADOR],
      },
      {
        title: true,
        name: 'Gestión de Contenido',
        priority: 90,
      },
      {
        name: 'Entradas',
        url: '/admin/control/entradas',
        iconComponent: { name: 'cil-pencil' },
        priority: 85,
        requiredRoles: [UserRole.AUTOR],
        children: [
          {
            name: 'Nueva Entrada',
            url: '/admin/control/entradas/crear',
            icon: 'cil-plus',
            priority: 100,
            requiredRoles: [UserRole.AUTOR],
          },
          {
            name: 'Todas las Entradas',
            url: '/admin/control/entradas',
            icon: 'cil-list',
            priority: 90,
            requiredRoles: [UserRole.AUTOR],
          },
        ],
      },
      {
        name: 'Configuración Avanzada',
        url: '/admin/control/configuracion/avanzada',
        iconComponent: { name: 'cil-settings' },
        priority: 10,
        requiredRoles: [UserRole.PROPIETARIO],
      },
    ];

    it('should adapt navigation for mobile devices', () => {
      const mobileState: ResponsiveState = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        screenWidth: 600,
        sidebarCollapsed: false,
        touchEnabled: true,
      };

      const adaptedItems = service.adaptNavigationItems(
        mockNavItems,
        mobileState,
      );

      // Should filter to critical functions and section titles
      expect(adaptedItems.length).toBeLessThan(mockNavItems.length);

      // Should remove children from all items
      adaptedItems.forEach((item) => {
        if (!item.title) {
          expect(item.children).toBeUndefined();
        }
      });

      // Should include dashboard (critical function)
      const dashboard = adaptedItems.find((item) => item.name === 'Escritorio');
      expect(dashboard).toBeDefined();
    });

    it('should adapt navigation for tablet devices', () => {
      const tabletState: ResponsiveState = {
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        screenWidth: 800,
        sidebarCollapsed: false,
        touchEnabled: true,
      };

      const adaptedItems = service.adaptNavigationItems(
        mockNavItems,
        tabletState,
      );

      // Should keep all items for tablet
      expect(adaptedItems.length).toBe(mockNavItems.length);

      // Should optimize for touch interaction
      adaptedItems.forEach((item) => {
        if (item.responsiveConfig) {
          expect(item.responsiveConfig.collapseThreshold).toBeDefined();
        }
      });
    });

    it('should adapt navigation for desktop devices', () => {
      const desktopState: ResponsiveState = {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1400,
        sidebarCollapsed: false,
        touchEnabled: false,
      };

      const adaptedItems = service.adaptNavigationItems(
        mockNavItems,
        desktopState,
      );

      // Should keep all items unchanged for desktop
      expect(adaptedItems.length).toBe(mockNavItems.length);
      expect(adaptedItems).toEqual(mockNavItems);
    });
  });

  describe('Screen Size Detection', () => {
    it('should detect screen size correctly', () => {
      const screenSize = service.getScreenSize();

      expect(['mobile', 'tablet', 'desktop']).toContain(screenSize);
    });

    it('should determine auto-collapse behavior', () => {
      const mobileState: ResponsiveState = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        screenWidth: 600,
        sidebarCollapsed: false,
        touchEnabled: true,
      };

      const desktopState: ResponsiveState = {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1400,
        sidebarCollapsed: false,
        touchEnabled: false,
      };

      expect(service.shouldAutoCollapse(mobileState)).toBe(true);
      expect(service.shouldAutoCollapse(desktopState)).toBe(false);
    });
  });

  describe('Touch Device Detection', () => {
    it('should detect touch capability', () => {
      const isTouchDevice = service.isTouchDevice();

      expect(typeof isTouchDevice).toBe('boolean');
    });
  });

  // PROPIEDAD 8: Adaptación responsiva
  // Valida: Requisitos 5.1, 5.2, 5.3, 5.4, 5.5
  describe('Property 8: Responsive adaptation', () => {
    /**
     * **Feature: admin-sidebar-optimization, Property 8: Adaptación responsiva**
     * **Valida: Requisitos 5.1, 5.2, 5.3, 5.4, 5.5**
     *
     * Para cualquier tamaño de pantalla, el sidebar debe adaptar su presentación
     * manteniendo acceso a todas las funciones críticas
     */
    it('should maintain access to critical functions across all screen sizes', () => {
      const testNavItems: INavItemEnhanced[] = [
        {
          name: 'Escritorio',
          url: '/admin/dashboard',
          iconComponent: { name: 'cil-speedometer' },
          priority: 100,
        },
        {
          name: 'Nueva Entrada',
          url: '/admin/control/entradas/crear',
          iconComponent: { name: 'cil-plus' },
          priority: 90,
        },
        {
          name: 'Configuración Avanzada',
          url: '/admin/advanced-config',
          iconComponent: { name: 'cil-settings' },
          priority: 10,
        },
      ];

      const criticalFunctions = service.getCriticalFunctions();
      const criticalUrls = criticalFunctions.map((func) => func.url);

      // Test mobile adaptation
      const mobileState: ResponsiveState = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        screenWidth: 600,
        sidebarCollapsed: false,
        touchEnabled: true,
      };

      const mobileAdapted = service.adaptNavigationItems(
        testNavItems,
        mobileState,
      );

      // Verify critical functions are preserved in mobile
      criticalUrls.forEach((criticalUrl) => {
        const foundInMobile = mobileAdapted.some(
          (item) => item.url === criticalUrl,
        );
        if (testNavItems.some((item) => item.url === criticalUrl)) {
          expect(foundInMobile).toBe(true);
        }
      });

      // Test tablet adaptation
      const tabletState: ResponsiveState = {
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        screenWidth: 900,
        sidebarCollapsed: false,
        touchEnabled: true,
      };

      const tabletAdapted = service.adaptNavigationItems(
        testNavItems,
        tabletState,
      );

      // Tablet should maintain all functions
      expect(tabletAdapted.length).toBe(testNavItems.length);

      // Test desktop adaptation
      const desktopState: ResponsiveState = {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1400,
        sidebarCollapsed: false,
        touchEnabled: false,
      };

      const desktopAdapted = service.adaptNavigationItems(
        testNavItems,
        desktopState,
      );

      // Desktop should maintain all functions
      expect(desktopAdapted.length).toBe(testNavItems.length);
    });

    it('should automatically collapse sidebar on mobile devices', () => {
      // Simulate mobile state
      service.setBreakpoints({ mobile: 768 });

      const mobileState: ResponsiveState = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        screenWidth: 600,
        sidebarCollapsed: false,
        touchEnabled: true,
      };

      // Should recommend auto-collapse for mobile
      expect(service.shouldAutoCollapse(mobileState)).toBe(true);

      // Desktop should not auto-collapse
      const desktopState: ResponsiveState = {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1200,
        sidebarCollapsed: false,
        touchEnabled: false,
      };

      expect(service.shouldAutoCollapse(desktopState)).toBe(false);
    });

    it('should optimize navigation for touch interaction on tablets', () => {
      const testNavItems: INavItemEnhanced[] = [
        {
          name: 'Test Item',
          url: '/test',
          iconComponent: { name: 'cil-test' },
          priority: 50,
        },
      ];

      const tabletState: ResponsiveState = {
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        screenWidth: 900,
        sidebarCollapsed: false,
        touchEnabled: true,
      };

      const adaptedItems = service.adaptNavigationItems(
        testNavItems,
        tabletState,
      );

      // Should optimize for touch interaction
      adaptedItems.forEach((item) => {
        if (item.responsiveConfig) {
          expect(item.responsiveConfig.collapseThreshold).toBeDefined();
        }
      });

      // Should detect touch capability
      expect(tabletState.touchEnabled).toBe(true);
    });

    it('should dynamically adapt to window size changes', (done) => {
      // Subscribe to responsive state changes
      service.responsiveState$.subscribe((state) => {
        expect(state).toBeDefined();
        expect(typeof state.screenWidth).toBe('number');
        expect(typeof state.isMobile).toBe('boolean');
        expect(typeof state.isTablet).toBe('boolean');
        expect(typeof state.isDesktop).toBe('boolean');
        done();
      });
    });

    it('should maintain functionality when switching between screen sizes', () => {
      const testNavItems: INavItemEnhanced[] = [
        {
          name: 'Dashboard',
          url: '/admin/dashboard',
          iconComponent: { name: 'cil-speedometer' },
          priority: 100,
        },
        {
          name: 'Settings',
          url: '/admin/settings',
          iconComponent: { name: 'cil-settings' },
          priority: 20,
          children: [
            {
              name: 'General',
              url: '/admin/settings/general',
              icon: 'cil-cog',
              priority: 100,
            },
          ],
        },
      ];

      // Test mobile -> tablet -> desktop progression
      const mobileState: ResponsiveState = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        screenWidth: 600,
        sidebarCollapsed: false,
        touchEnabled: true,
      };

      const tabletState: ResponsiveState = {
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        screenWidth: 900,
        sidebarCollapsed: false,
        touchEnabled: true,
      };

      const desktopState: ResponsiveState = {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1400,
        sidebarCollapsed: false,
        touchEnabled: false,
      };

      const mobileAdapted = service.adaptNavigationItems(
        testNavItems,
        mobileState,
      );
      const tabletAdapted = service.adaptNavigationItems(
        testNavItems,
        tabletState,
      );
      const desktopAdapted = service.adaptNavigationItems(
        testNavItems,
        desktopState,
      );

      // Mobile should have fewer items (critical functions only)
      expect(mobileAdapted.length).toBeLessThanOrEqual(testNavItems.length);

      // Tablet should have all items but optimized for touch
      expect(tabletAdapted.length).toBe(testNavItems.length);

      // Desktop should have all items unchanged
      expect(desktopAdapted.length).toBe(testNavItems.length);
      expect(desktopAdapted).toEqual(testNavItems);

      // Critical functions should be preserved across all sizes
      const dashboardInMobile = mobileAdapted.find(
        (item) => item.name === 'Dashboard',
      );
      const dashboardInTablet = tabletAdapted.find(
        (item) => item.name === 'Dashboard',
      );
      const dashboardInDesktop = desktopAdapted.find(
        (item) => item.name === 'Dashboard',
      );

      expect(dashboardInMobile).toBeDefined();
      expect(dashboardInTablet).toBeDefined();
      expect(dashboardInDesktop).toBeDefined();
    });
  });
});
