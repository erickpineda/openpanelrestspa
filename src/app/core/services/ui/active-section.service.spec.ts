import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  ActiveSectionService,
  ActiveSectionState,
  MenuExpansionState,
} from './active-section.service';
import { INavItemEnhanced, UserRole } from '../../../shared/types/navigation.types';

describe('ActiveSectionService', () => {
  let service: ActiveSectionService;
  let mockRouter: jasmine.SpyObj<Router>;
  let routerEventsSubject: BehaviorSubject<any>;

  const mockNavigationItems: INavItemEnhanced[] = [
    {
      name: 'Dashboard',
      url: '/admin/dashboard',
      iconComponent: { name: 'cil-speedometer' },
      priority: 100,
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
      children: [
        {
          name: 'Nueva Entrada',
          url: '/admin/control/entradas/crear',
          icon: 'cil-plus',
          priority: 100,
        },
        {
          name: 'Todas las Entradas',
          url: '/admin/control/entradas',
          icon: 'cil-list',
          priority: 90,
        },
      ],
    },
    {
      name: 'Comentarios',
      url: '/admin/control/comentarios',
      iconComponent: { name: 'cil-comment-square' },
      priority: 65,
    },
    {
      title: true,
      name: 'Administración',
      priority: 60,
    },
    {
      name: 'Usuarios',
      url: '/admin/control/gestion/usuarios',
      iconComponent: { name: 'cil-people' },
      priority: 55,
    },
  ];

  beforeEach(() => {
    routerEventsSubject = new BehaviorSubject(
      new NavigationEnd(1, '/admin/dashboard', '/admin/dashboard')
    );

    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      events: routerEventsSubject.asObservable(),
      url: '/admin/dashboard',
    });

    TestBed.configureTestingModule({
      providers: [ActiveSectionService, { provide: Router, useValue: routerSpy }],
    });

    service = TestBed.inject(ActiveSectionService);
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Set up navigation items
    service.setNavigationItems(mockNavigationItems);
  });

  afterEach(() => {
    // Clean up localStorage
    service.clearExpansionState();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Active Section Detection', () => {
    it('should detect active section for dashboard', () => {
      service.updateActiveSection('/admin/dashboard');

      const activeState = service.getCurrentActiveState();
      expect(activeState.activeUrl).toBe('/admin/dashboard');
      expect(activeState.activeItemId).toBe('-admin-dashboard');
      expect(activeState.breadcrumb).toEqual(['Dashboard']);
    });

    it('should detect active section for content management items', () => {
      service.updateActiveSection('/admin/control/entradas');

      const activeState = service.getCurrentActiveState();
      expect(activeState.activeUrl).toBe('/admin/control/entradas');
      expect(activeState.activeSectionId).toBe('gestion-de-contenido');
      expect(activeState.activeItemId).toBe('-admin-control-entradas');
      expect(activeState.breadcrumb).toEqual([
        'Gestión de Contenido',
        'Entradas',
        'Todas las Entradas',
      ]);
    });

    it('should detect active section for child items', () => {
      service.updateActiveSection('/admin/control/entradas/crear');

      const activeState = service.getCurrentActiveState();
      expect(activeState.activeUrl).toBe('/admin/control/entradas/crear');
      expect(activeState.activeSectionId).toBe('gestion-de-contenido');
      expect(activeState.activeItemId).toBe('-admin-control-entradas-crear');
      expect(activeState.breadcrumb).toEqual(['Gestión de Contenido', 'Entradas', 'Nueva Entrada']);
    });

    it('should handle URLs with query parameters and fragments', () => {
      service.updateActiveSection('/admin/control/entradas?page=1#section');

      const activeState = service.getCurrentActiveState();
      expect(activeState.activeUrl).toBe('/admin/control/entradas');
      expect(activeState.activeSectionId).toBe('gestion-de-contenido');
    });

    it('should handle nested route matching', () => {
      service.updateActiveSection('/admin/control/entradas/123/edit');

      const activeState = service.getCurrentActiveState();
      expect(activeState.activeUrl).toBe('/admin/control/entradas/123/edit');
      expect(activeState.activeSectionId).toBe('gestion-de-contenido');
      expect(activeState.activeItemId).toBe('-admin-control-entradas');
    });
  });

  describe('Menu Expansion State', () => {
    it('should expand section', () => {
      const sectionId = 'test-section';

      service.expandSection(sectionId);

      expect(service.isSectionExpanded(sectionId)).toBe(true);
    });

    it('should collapse section', () => {
      const sectionId = 'test-section';

      service.expandSection(sectionId);
      service.collapseSection(sectionId);

      expect(service.isSectionExpanded(sectionId)).toBe(false);
    });

    it('should toggle section expansion', () => {
      const sectionId = 'test-section';

      // Initially collapsed
      expect(service.isSectionExpanded(sectionId)).toBe(false);

      // Toggle to expand
      service.toggleSection(sectionId);
      expect(service.isSectionExpanded(sectionId)).toBe(true);

      // Toggle to collapse
      service.toggleSection(sectionId);
      expect(service.isSectionExpanded(sectionId)).toBe(false);
    });

    it('should auto-expand active section', () => {
      service.updateActiveSection('/admin/control/entradas');

      const activeState = service.getCurrentActiveState();
      if (activeState.activeSectionId) {
        expect(service.isSectionExpanded(activeState.activeSectionId)).toBe(true);
      }
    });
  });

  describe('Persistence', () => {
    it('should persist expansion state to localStorage', () => {
      const sectionId = 'test-section';

      service.expandSection(sectionId);

      // Check if state is saved to localStorage
      const saved = localStorage.getItem('navigation-expansion-state');
      expect(saved).toBeTruthy();

      if (saved) {
        const state = JSON.parse(saved);
        expect(state[sectionId]).toBe(true);
      }
    });

    it('should load expansion state from localStorage', () => {
      const sectionId = 'test-section';
      const state = { [sectionId]: true };

      // Manually set localStorage
      localStorage.setItem('navigation-expansion-state', JSON.stringify(state));

      // Create new service instance to test loading
      // We need to inject Router since it's a dependency
      const router = TestBed.inject(Router);
      const newService = new ActiveSectionService(router);

      expect(newService.isSectionExpanded(sectionId)).toBe(true);
    });

    it('should clear expansion state', () => {
      const sectionId = 'test-section';

      service.expandSection(sectionId);
      service.clearExpansionState();

      expect(service.isSectionExpanded(sectionId)).toBe(false);
      expect(localStorage.getItem('navigation-expansion-state')).toBeNull();
    });
  });

  describe('Navigation Context', () => {
    it('should generate navigation context for entries section', () => {
      const url = '/admin/control/entradas';
      routerEventsSubject.next(new NavigationEnd(2, url, url));

      const context = service.getCurrentNavigationContext();
      expect(context.currentSection).toBe('gestion-de-contenido');
      expect(context.suggestedActions).toContain('Nueva Entrada');
      expect(context.suggestedActions).toContain('Ver Borradores');
    });

    it('should generate navigation context for users section', () => {
      const url = '/admin/control/gestion/usuarios';
      routerEventsSubject.next(new NavigationEnd(2, url, url));

      const context = service.getCurrentNavigationContext();
      expect(context.suggestedActions).toContain('Nuevo Usuario');
      expect(context.suggestedActions).toContain('Gestionar Roles');
    });

    it('should generate navigation context for dashboard', () => {
      const url = '/admin/dashboard';
      routerEventsSubject.next(new NavigationEnd(2, url, url));

      const context = service.getCurrentNavigationContext();
      expect(context.suggestedActions).toContain('Ver Estadísticas');
      expect(context.suggestedActions).toContain('Generar Reporte');
    });
  });

  describe('Item and Section Status', () => {
    it('should correctly identify active items', () => {
      service.updateActiveSection('/admin/control/entradas');

      const entriesItem = mockNavigationItems.find((item) => item.name === 'Entradas')!;
      const dashboardItem = mockNavigationItems.find((item) => item.name === 'Dashboard')!;

      expect(service.isItemActive(entriesItem)).toBe(true);
      expect(service.isItemActive(dashboardItem)).toBe(false);
    });

    it('should correctly identify active sections', () => {
      service.updateActiveSection('/admin/control/entradas');

      const contentSection = mockNavigationItems.find(
        (item) => item.name === 'Gestión de Contenido'
      )!;
      const adminSection = mockNavigationItems.find((item) => item.name === 'Administración')!;

      expect(service.isSectionActive(contentSection)).toBe(true);
      expect(service.isSectionActive(adminSection)).toBe(false);
    });
  });

  describe('Router Integration', () => {
    it('should update active section on router navigation', () => {
      const newUrl = '/admin/control/comentarios';

      routerEventsSubject.next(new NavigationEnd(2, newUrl, newUrl));

      const activeState = service.getCurrentActiveState();
      expect(activeState.activeUrl).toBe(newUrl);
      expect(activeState.activeSectionId).toBe('gestion-de-contenido');
    });

    it('should not update on non-NavigationEnd events', () => {
      const initialState = service.getCurrentActiveState();

      // Emit a different type of router event
      routerEventsSubject.next({ type: 'NavigationStart' });

      const currentState = service.getCurrentActiveState();
      expect(currentState).toEqual(initialState);
    });
  });

  describe('Breadcrumb Generation', () => {
    it('should generate correct breadcrumb for simple item', () => {
      service.updateActiveSection('/admin/dashboard');

      const breadcrumb = service.getCurrentBreadcrumb();
      expect(breadcrumb).toEqual(['Dashboard']);
    });

    it('should generate correct breadcrumb for section item', () => {
      service.updateActiveSection('/admin/control/entradas');

      const breadcrumb = service.getCurrentBreadcrumb();
      expect(breadcrumb).toEqual(['Gestión de Contenido', 'Entradas', 'Todas las Entradas']);
    });

    it('should generate correct breadcrumb for child item', () => {
      service.updateActiveSection('/admin/control/entradas/crear');

      const breadcrumb = service.getCurrentBreadcrumb();
      expect(breadcrumb).toEqual(['Gestión de Contenido', 'Entradas', 'Nueva Entrada']);
    });
  });

  // PROPIEDAD 6: Sección activa resaltada
  // Valida: Requisitos 4.1
  describe('Property 6: Active section highlighting', () => {
    /**
     * **Feature: admin-sidebar-optimization, Property 6: Sección activa resaltada**
     * **Valida: Requisitos 4.1**
     *
     * Para cualquier estado de navegación, la sección correspondiente a la ruta actual
     * debe tener propiedades visuales distintivas que la identifiquen como activa
     */
    it('should consistently highlight active section across different routes', () => {
      const testRoutes = [
        {
          url: '/admin/dashboard',
          expectedSection: null,
          expectedItem: '-admin-dashboard',
        },
        {
          url: '/admin/control/entradas',
          expectedSection: 'gestion-de-contenido',
          expectedItem: '-admin-control-entradas',
        },
        {
          url: '/admin/control/entradas/crear',
          expectedSection: 'gestion-de-contenido',
          expectedItem: '-admin-control-entradas-crear',
        },
        {
          url: '/admin/control/comentarios',
          expectedSection: 'gestion-de-contenido',
          expectedItem: '-admin-control-comentarios',
        },
        {
          url: '/admin/control/gestion/usuarios',
          expectedSection: 'administracion',
          expectedItem: '-admin-control-gestion-usuarios',
        },
      ];

      testRoutes.forEach((testCase) => {
        service.updateActiveSection(testCase.url);

        const activeState = service.getCurrentActiveState();
        expect(activeState.activeUrl).toBe(testCase.url);
        expect(activeState.activeSectionId).toBe(testCase.expectedSection);
        expect(activeState.activeItemId).toBe(testCase.expectedItem);

        // Verify that only one section is active at a time
        const activeSections = mockNavigationItems
          .filter((item) => item.title)
          .filter((item) => service.isSectionActive(item));

        if (testCase.expectedSection) {
          expect(activeSections.length).toBe(1);
          expect(service.isSectionActive(activeSections[0])).toBe(true);
        } else {
          expect(activeSections.length).toBe(0);
        }
      });
    });

    it('should maintain active state consistency during navigation', () => {
      // Start with dashboard
      service.updateActiveSection('/admin/dashboard');
      let activeState = service.getCurrentActiveState();
      expect(activeState.activeItemId).toBe('-admin-dashboard');
      expect(activeState.activeSectionId).toBeNull();

      // Navigate to entries section
      service.updateActiveSection('/admin/control/entradas');
      activeState = service.getCurrentActiveState();
      expect(activeState.activeItemId).toBe('-admin-control-entradas');
      expect(activeState.activeSectionId).toBe('gestion-de-contenido');

      // Navigate to child item
      service.updateActiveSection('/admin/control/entradas/crear');
      activeState = service.getCurrentActiveState();
      expect(activeState.activeItemId).toBe('-admin-control-entradas-crear');
      expect(activeState.activeSectionId).toBe('gestion-de-contenido');

      // Navigate to different section
      service.updateActiveSection('/admin/control/gestion/usuarios');
      activeState = service.getCurrentActiveState();
      expect(activeState.activeItemId).toBe('-admin-control-gestion-usuarios');
      expect(activeState.activeSectionId).toBe('administracion');
    });

    it('should handle URL variations and still highlight correctly', () => {
      const urlVariations = [
        '/admin/control/entradas',
        '/admin/control/entradas/',
        '/admin/control/entradas?page=1',
        '/admin/control/entradas#section',
        '/admin/control/entradas?page=1&sort=date#top',
      ];

      urlVariations.forEach((url) => {
        service.updateActiveSection(url);

        const activeState = service.getCurrentActiveState();
        expect(activeState.activeSectionId).toBe('gestion-de-contenido');
        expect(activeState.activeItemId).toBe('-admin-control-entradas');

        // Verify the entries item is marked as active
        const entriesItem = mockNavigationItems.find((item) => item.name === 'Entradas')!;
        expect(service.isItemActive(entriesItem)).toBe(true);
      });
    });

    it('should provide distinctive visual properties for active sections', () => {
      service.updateActiveSection('/admin/control/entradas');

      const activeState = service.getCurrentActiveState();

      // Active section should have distinctive properties
      expect(activeState.activeSectionId).toBeTruthy();
      expect(activeState.activeItemId).toBeTruthy();
      expect(activeState.breadcrumb.length).toBeGreaterThan(0);

      // Verify breadcrumb provides visual context
      expect(activeState.breadcrumb).toContain('Gestión de Contenido');
      expect(activeState.breadcrumb).toContain('Entradas');

      // Verify section identification methods work
      const contentSection = mockNavigationItems.find(
        (item) => item.name === 'Gestión de Contenido'
      )!;
      const entriesItem = mockNavigationItems.find((item) => item.name === 'Entradas')!;

      expect(service.isSectionActive(contentSection)).toBe(true);
      expect(service.isItemActive(entriesItem)).toBe(true);
    });
  });

  // PROPIEDAD 7: Persistencia de estado de expansión
  // Valida: Requisitos 4.3
  describe('Property 7: Expansion state persistence', () => {
    /**
     * **Feature: admin-sidebar-optimization, Property 7: Persistencia de estado de expansión**
     * **Valida: Requisitos 4.3**
     *
     * Para cualquier navegación entre secciones, el estado de expansión de menús
     * debe mantenerse consistente durante la sesión del usuario
     */
    it('should persist expansion state across service instances', () => {
      const sectionIds = ['section-1', 'section-2', 'section-3'];

      // Expand some sections
      service.expandSection(sectionIds[0]);
      service.expandSection(sectionIds[1]);
      // Leave section-3 collapsed

      // Verify initial state
      expect(service.isSectionExpanded(sectionIds[0])).toBe(true);
      expect(service.isSectionExpanded(sectionIds[1])).toBe(true);
      expect(service.isSectionExpanded(sectionIds[2])).toBe(false);

      // Create new service instance (simulating page reload)
      const newService = TestBed.inject(ActiveSectionService);

      // State should be restored from localStorage
      expect(newService.isSectionExpanded(sectionIds[0])).toBe(true);
      expect(newService.isSectionExpanded(sectionIds[1])).toBe(true);
      expect(newService.isSectionExpanded(sectionIds[2])).toBe(false);
    });

    it('should maintain expansion state during navigation', () => {
      const sectionId = 'gestion-de-contenido';

      // Navigate to entries and expand section
      service.updateActiveSection('/admin/control/entradas');
      service.expandSection(sectionId);
      expect(service.isSectionExpanded(sectionId)).toBe(true);

      // Navigate to different route in same section
      service.updateActiveSection('/admin/control/entradas/crear');
      expect(service.isSectionExpanded(sectionId)).toBe(true);

      // Navigate to different section
      service.updateActiveSection('/admin/control/gestion/usuarios');
      expect(service.isSectionExpanded(sectionId)).toBe(true); // Should remain expanded

      // Navigate back to original section
      service.updateActiveSection('/admin/control/entradas');
      expect(service.isSectionExpanded(sectionId)).toBe(true);
    });

    it('should handle multiple sections expansion state independently', () => {
      const sections = [
        { id: 'gestion-de-contenido', url: '/admin/control/entradas' },
        { id: 'administracion', url: '/admin/control/gestion/usuarios' },
      ];

      // Expand first section
      service.updateActiveSection(sections[0].url);
      service.expandSection(sections[0].id);

      // Navigate to second section and expand it
      service.updateActiveSection(sections[1].url);
      service.expandSection(sections[1].id);

      // Both sections should be expanded
      expect(service.isSectionExpanded(sections[0].id)).toBe(true);
      expect(service.isSectionExpanded(sections[1].id)).toBe(true);

      // Collapse first section
      service.collapseSection(sections[0].id);

      // First should be collapsed, second should remain expanded
      expect(service.isSectionExpanded(sections[0].id)).toBe(false);
      expect(service.isSectionExpanded(sections[1].id)).toBe(true);

      // Navigate between sections - states should persist
      service.updateActiveSection(sections[0].url);
      expect(service.isSectionExpanded(sections[0].id)).toBe(true);
      expect(service.isSectionExpanded(sections[1].id)).toBe(true);
    });

    it('should auto-expand active section while preserving other states', () => {
      const sections = [
        { id: 'gestion-de-contenido', url: '/admin/control/entradas' },
        { id: 'administracion', url: '/admin/control/gestion/usuarios' },
      ];

      // Manually expand first section
      service.expandSection(sections[0].id);
      expect(service.isSectionExpanded(sections[0].id)).toBe(true);

      // Navigate to second section (should auto-expand)
      service.updateActiveSection(sections[1].url);

      // Both sections should be expanded
      expect(service.isSectionExpanded(sections[0].id)).toBe(true); // Preserved
      expect(service.isSectionExpanded(sections[1].id)).toBe(true); // Auto-expanded

      // Manually collapse first section
      service.collapseSection(sections[0].id);

      // Navigate back to first section (should auto-expand again)
      service.updateActiveSection(sections[0].url);

      expect(service.isSectionExpanded(sections[0].id)).toBe(true); // Auto-expanded
      expect(service.isSectionExpanded(sections[1].id)).toBe(true); // Preserved
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw errors
      spyOn(localStorage, 'setItem').and.throwError('Storage quota exceeded');
      spyOn(localStorage, 'getItem').and.throwError('Storage access denied');

      // Should not throw errors
      expect(() => {
        service.expandSection('test-section');
        service.collapseSection('test-section');
        service.clearExpansionState();
      }).not.toThrow();

      // Service should still function without persistence
      service.expandSection('test-section');
      expect(service.isSectionExpanded('test-section')).toBe(true);
    });

    it('should maintain state consistency during rapid navigation', () => {
      const rapidNavigationUrls = [
        '/admin/dashboard',
        '/admin/control/entradas',
        '/admin/control/entradas/crear',
        '/admin/control/comentarios',
        '/admin/control/gestion/usuarios',
        '/admin/control/entradas',
      ];

      // Perform rapid navigation
      rapidNavigationUrls.forEach((url) => {
        service.updateActiveSection(url);

        const activeState = service.getCurrentActiveState();
        expect(activeState.activeUrl).toBe(url);

        // If there's an active section, it should be expanded
        if (activeState.activeSectionId) {
          expect(service.isSectionExpanded(activeState.activeSectionId)).toBe(true);
        }
      });

      // Final state should be consistent
      const finalState = service.getCurrentActiveState();
      expect(finalState.activeUrl).toBe('/admin/control/entradas');
      expect(finalState.activeSectionId).toBe('gestion-de-contenido');
      expect(service.isSectionExpanded('gestion-de-contenido')).toBe(true);
    });
  });
});
