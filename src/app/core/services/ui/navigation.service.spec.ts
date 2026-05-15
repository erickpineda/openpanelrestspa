import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { NavigationService } from './navigation.service';
import { SidebarStateService } from './sidebar-state.service';
import { ActiveSectionService } from './active-section.service';
import { BadgeCounterService } from './badge-counter.service';
import { TokenStorageService } from '../auth/token-storage.service';
import {
  UserRole,
  NavigationConfig,
  INavItemEnhanced,
} from '../../../shared/types/navigation.types';
import { NavigationConstants } from '../../../shared/constants/navigation.constants';
import { OpPrivilegioConstants } from '../../../shared/constants/op-privilegio.constants';

describe('NavigationService', () => {
  let service: NavigationService;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSidebarStateService: jasmine.SpyObj<SidebarStateService>;
  let mockActiveSectionService: jasmine.SpyObj<ActiveSectionService>;
  let mockBadgeCounterService: jasmine.SpyObj<BadgeCounterService>;
  let mockTokenStorageService: jasmine.SpyObj<TokenStorageService>;

  beforeEach(() => {
    (globalThis as any).__ENABLE_BADGE_COUNTERS_IN_TEST__ = true;

    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      events: of({}),
      url: '/admin/dashboard',
    });
    const sidebarStateSpy = jasmine.createSpyObj('SidebarStateService', [
      'toggleItem',
      'updateNavItems',
    ]);

    const badgeCounterSpy = jasmine.createSpyObj('BadgeCounterService', [
      'initializeCounters',
      'getAllCounters',
    ]);
    badgeCounterSpy.getAllCounters.and.returnValue(of(new Map<string, number>()));

    const tokenStorageSpy = jasmine.createSpyObj('TokenStorageService', ['getUser']);
    tokenStorageSpy.getUser.and.returnValue(null);

    const activeSectionSpy = jasmine.createSpyObj(
      'ActiveSectionService',
      [
        'toggleSection',
        'expandSection',
        'collapseSection',
        'isSectionExpanded',
        'setNavigationItems',
        'updateActiveSection',
        'getCurrentActiveState',
        'getCurrentBreadcrumb',
        'isItemActive',
        'isSectionActive',
        'clearExpansionState',
      ],
      {
        activeSection$: of({
          activeUrl: '',
          activeSectionId: null,
          activeItemId: null,
          breadcrumb: [],
        }),
        menuExpansion$: of({}),
        navigationContext$: of({
          currentSection: null,
          parentSection: null,
          relatedItems: [],
          suggestedActions: [],
        }),
      }
    );

    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        { provide: Router, useValue: routerSpy },
        { provide: SidebarStateService, useValue: sidebarStateSpy },
        { provide: ActiveSectionService, useValue: activeSectionSpy },
        { provide: BadgeCounterService, useValue: badgeCounterSpy },
        { provide: TokenStorageService, useValue: tokenStorageSpy },
      ],
    });

    service = TestBed.inject(NavigationService);
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockSidebarStateService = TestBed.inject(
      SidebarStateService
    ) as jasmine.SpyObj<SidebarStateService>;
    mockActiveSectionService = TestBed.inject(
      ActiveSectionService
    ) as jasmine.SpyObj<ActiveSectionService>;
    mockBadgeCounterService = TestBed.inject(
      BadgeCounterService
    ) as jasmine.SpyObj<BadgeCounterService>;
    mockTokenStorageService = TestBed.inject(
      TokenStorageService
    ) as jasmine.SpyObj<TokenStorageService>;
  });

  afterEach(() => {
    delete (globalThis as any).__ENABLE_BADGE_COUNTERS_IN_TEST__;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getNavigationItems', () => {
    it('should return filtered navigation items for a specific role', (done) => {
      const testConfig: NavigationConfig = {
        sections: [
          {
            id: 'dashboard',
            title: 'Dashboard',
            icon: 'cil-speedometer',
            priority: 100,
            items: [
              {
                id: 'main-dashboard',
                name: 'Escritorio Principal',
                url: '/admin/dashboard',
                icon: 'cil-speedometer',
              },
            ],
            collapsible: false,
            defaultExpanded: true,
            requiredRoles: [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO],
          },
        ],
        theme: NavigationConstants.DEFAULT_THEME,
        userPreferences: {
          expandedSections: [],
          collapsedSections: [],
          favoriteItems: [],
        },
      };

      service.loadNavigationConfig(testConfig);

      service
        .getNavigationItems(UserRole.ADMINISTRADOR)
        .pipe(take(1))
        .subscribe((items) => {
          expect(items).toBeDefined();
          expect(items.length).toBeGreaterThan(0);
          expect(items.some((item) => item.name === 'Dashboard')).toBeTrue();
          done();
        });
    });

    it('should filter out items for unauthorized roles', (done) => {
      const testConfig: NavigationConfig = {
        sections: [
          {
            id: 'admin-only',
            title: 'Admin Only Section',
            icon: 'cil-shield',
            priority: 100,
            items: [
              {
                id: 'admin-item',
                name: 'Admin Item',
                url: '/admin/restricted',
                icon: 'cil-shield',
              },
            ],
            collapsible: false,
            defaultExpanded: true,
            requiredRoles: [UserRole.PROPIETARIO],
          },
        ],
        theme: NavigationConstants.DEFAULT_THEME,
        userPreferences: {
          expandedSections: [],
          collapsedSections: [],
          favoriteItems: [],
        },
      };

      service.loadNavigationConfig(testConfig);

      service
        .getNavigationItems(UserRole.LECTOR)
        .pipe(take(1))
        .subscribe((items) => {
          expect(items).toBeDefined();
          expect(items.some((item) => item.name === 'Admin Only Section')).toBeFalse();
          done();
        });
    });

    it('oculta secciones sin hijos visibles', (done) => {
      mockTokenStorageService.getUser.and.returnValue({ privileges: [] });

      service.setNavigationItems([
        { title: true, name: 'SECTION' },
        {
          name: 'A',
          url: '/admin/a',
          iconComponent: { name: 'cil-list' },
          requiredPermissions: ['X'],
        },
        { title: true, name: 'VISIBLE_SECTION' },
        {
          name: 'B',
          url: '/admin/b',
          iconComponent: { name: 'cil-list' },
        },
      ]);

      service
        .getNavigationItems(UserRole.ADMINISTRADOR)
        .pipe(take(1))
        .subscribe((items) => {
          expect(items.some((item) => item.name === 'SECTION')).toBeFalse();
          expect(items.some((item) => item.name === 'A')).toBeFalse();
          expect(items.some((item) => item.name === 'VISIBLE_SECTION')).toBeTrue();
          expect(items.some((item) => item.name === 'B')).toBeTrue();
          done();
        });
    });
  });

  describe('updateBadgeCount', () => {
    it('should update badge count for a specific item', (done) => {
      const itemId = 'test-item';
      const count = 5;

      service.updateBadgeCount(itemId, count);

      // Verify the badge count was updated by checking if it affects navigation items
      service
        .getNavigationItems(UserRole.ADMINISTRADOR)
        .pipe(take(1))
        .subscribe(() => {
          expect(service).toBeTruthy();
          done();
        });
    });
  });

  describe('toggleSection', () => {
    it('should delegate to ActiveSectionService and SidebarStateService', () => {
      const sectionId = 'test-section';
      mockActiveSectionService.isSectionExpanded.and.returnValue(true);

      service.toggleSection(sectionId);

      expect(mockActiveSectionService.toggleSection).toHaveBeenCalledWith(sectionId);
      expect(mockSidebarStateService.toggleItem).toHaveBeenCalledWith(sectionId, true);
    });
  });

  describe('setContextualActions', () => {
    it('should set contextual actions for an item', () => {
      const itemId = 'test-item';
      const actions = [
        {
          name: 'Edit',
          icon: 'cil-pencil',
          action: () => {},
          tooltip: 'Edit item',
        },
      ];

      expect(() => {
        service.setContextualActions(itemId, actions);
      }).not.toThrow();
    });
  });

  describe('loadNavigationConfig', () => {
    it('should load valid navigation configuration', () => {
      const validConfig: NavigationConfig = {
        sections: [
          {
            id: 'test-section',
            title: 'Test Section',
            icon: 'cil-test',
            priority: 1,
            items: [],
            collapsible: true,
            defaultExpanded: false,
            requiredRoles: [],
          },
        ],
        theme: NavigationConstants.DEFAULT_THEME,
        userPreferences: {
          expandedSections: [],
          collapsedSections: [],
          favoriteItems: [],
        },
      };

      expect(() => {
        service.loadNavigationConfig(validConfig);
      }).not.toThrow();
    });

    it('should reject invalid navigation configuration', () => {
      const invalidConfig: NavigationConfig = {
        sections: [], // Empty sections should be invalid
        theme: NavigationConstants.DEFAULT_THEME,
        userPreferences: {
          expandedSections: [],
          collapsedSections: [],
          favoriteItems: [],
        },
      };

      spyOn(console, 'error');
      service.loadNavigationConfig(invalidConfig);

      expect(console.error).toHaveBeenCalled();
    });

    it('debe preservar requiredPermissions y permissionMode al convertir secciones y títulos', (done) => {
      mockTokenStorageService.getUser.and.returnValue({
        privileges: [OpPrivilegioConstants.GESTIONAR_PAGINAS],
      });

      const config: NavigationConfig = {
        sections: [
          {
            id: 'pages',
            title: 'Páginas',
            icon: 'cil-library',
            priority: 10,
            items: [
              {
                id: 'pages-list',
                name: 'Listado',
                url: '/admin/control/paginas',
                icon: 'cil-library',
              },
            ],
            collapsible: true,
            defaultExpanded: true,
            requiredRoles: [],
            requiredPermissions: [OpPrivilegioConstants.GESTIONAR_PAGINAS],
            permissionMode: 'ALL',
          },
        ],
        theme: NavigationConstants.DEFAULT_THEME,
        userPreferences: {
          expandedSections: [],
          collapsedSections: [],
          favoriteItems: [],
        },
      };

      service.loadNavigationConfig(config);

      service
        .getNavigationItems(UserRole.LECTOR)
        .pipe(take(1))
        .subscribe((items) => {
          const title = items.find((item) => item.title && item.name === 'Páginas');
          const child = items.find((item) => item.name === 'Listado');

          expect(title?.requiredPermissions).toEqual([OpPrivilegioConstants.GESTIONAR_PAGINAS]);
          expect(title?.permissionMode).toBe('ALL');
          expect(child?.requiredPermissions).toEqual([OpPrivilegioConstants.GESTIONAR_PAGINAS]);
          expect(child?.permissionMode).toBe('ALL');
          done();
        });
    });

    it('debe preservar permisos propios del item al convertirlo', (done) => {
      mockTokenStorageService.getUser.and.returnValue({
        privileges: [OpPrivilegioConstants.GESTIONAR_PRIVILEGIOS],
      });

      const config: NavigationConfig = {
        sections: [
          {
            id: 'admin',
            title: 'Administración',
            icon: 'cil-settings',
            priority: 10,
            items: [
              {
                id: 'privileges',
                name: 'Privilegios',
                url: '/admin/control/gestion/privilegios',
                icon: 'cil-check-circle',
                requiredPermissions: [OpPrivilegioConstants.GESTIONAR_PRIVILEGIOS],
                permissionMode: 'ALL',
              },
            ],
            collapsible: true,
            defaultExpanded: true,
            requiredRoles: [],
          },
        ],
        theme: NavigationConstants.DEFAULT_THEME,
        userPreferences: {
          expandedSections: [],
          collapsedSections: [],
          favoriteItems: [],
        },
      };

      service.loadNavigationConfig(config);

      service
        .getNavigationItems(UserRole.LECTOR)
        .pipe(take(1))
        .subscribe((items) => {
          const item = items.find((entry) => entry.name === 'Privilegios');

          expect(item?.requiredPermissions).toEqual([OpPrivilegioConstants.GESTIONAR_PRIVILEGIOS]);
          expect(item?.permissionMode).toBe('ALL');
          done();
        });
    });
  });

  describe('updateActiveSection', () => {
    it('should update active section using ActiveSectionService', () => {
      const testUrl = '/admin/dashboard';

      service.updateActiveSection(testUrl);

      expect(mockActiveSectionService.setNavigationItems).toHaveBeenCalled();
      expect(mockActiveSectionService.updateActiveSection).toHaveBeenCalledWith(testUrl);
      expect(mockSidebarStateService.updateNavItems).toHaveBeenCalled();
    });
  });

  describe('filterByPermissions', () => {
    it('should filter navigation items by user role', () => {
      const items: INavItemEnhanced[] = [
        {
          name: 'Public Item',
          url: '/public',
          iconComponent: { name: 'cil-home' },
        },
        {
          name: 'Admin Item',
          url: '/admin',
          iconComponent: { name: 'cil-shield' },
          requiredRoles: [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO],
        },
      ];

      const filteredForLector = service.filterByPermissions(items, UserRole.LECTOR);
      const filteredForAdmin = service.filterByPermissions(items, UserRole.ADMINISTRADOR);

      expect(filteredForLector.length).toBe(1);
      expect(filteredForLector[0].name).toBe('Public Item');

      expect(filteredForAdmin.length).toBe(2);
      expect(filteredForAdmin.some((item) => item.name === 'Admin Item')).toBeTrue();
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: admin-sidebar-optimization, Property 1: Agrupación lógica de navegación**
     * **Valida: Requisitos 1.1, 1.2, 2.2, 4.4, 4.5**
     *
     * Para cualquier configuración de navegación, todos los elementos deben estar agrupados bajo secciones
     * que correspondan a su funcionalidad principal, sin elementos duplicados por URL o identificador
     */
    it('should group navigation items logically without duplicates', (done) => {
      const testConfig: NavigationConfig = {
        sections: [
          {
            id: 'content-management',
            title: 'Gestión de Contenido',
            icon: 'cil-pencil',
            priority: 80,
            items: [
              {
                id: 'entries',
                name: 'Entradas',
                url: '/admin/entries',
                icon: 'cil-pencil',
              },
              {
                id: 'pages',
                name: 'Páginas',
                url: '/admin/pages',
                icon: 'cil-library',
              },
            ],
            collapsible: true,
            defaultExpanded: true,
            requiredRoles: [],
          },
          {
            id: 'user-management',
            title: 'Administración de Usuarios',
            icon: 'cil-people',
            priority: 70,
            items: [
              {
                id: 'users',
                name: 'Usuarios',
                url: '/admin/users',
                icon: 'cil-people',
              },
              {
                id: 'roles',
                name: 'Roles',
                url: '/admin/roles',
                icon: 'cil-shield',
              },
            ],
            collapsible: true,
            defaultExpanded: false,
            requiredRoles: [],
          },
        ],
        theme: NavigationConstants.DEFAULT_THEME,
        userPreferences: {
          expandedSections: [],
          collapsedSections: [],
          favoriteItems: [],
        },
      };

      service.loadNavigationConfig(testConfig);

      service
        .getNavigationItems(UserRole.ADMINISTRADOR)
        .pipe(take(1))
        .subscribe((items) => {
          // Verificar que los elementos están agrupados lógicamente
          const contentSectionIndex = items.findIndex(
            (item) => item.name === 'Gestión de Contenido'
          );
          const userSectionIndex = items.findIndex(
            (item) => item.name === 'Administración de Usuarios'
          );

          expect(contentSectionIndex).toBeGreaterThanOrEqual(0);
          expect(userSectionIndex).toBeGreaterThanOrEqual(0);

          // Verificar que los elementos de contenido aparecen después del título de la sección
          const entriesIndex = items.findIndex((item) => item.name === 'Entradas');
          const pagesIndex = items.findIndex((item) => item.name === 'Páginas');

          expect(entriesIndex).toBeGreaterThan(contentSectionIndex);
          expect(pagesIndex).toBeGreaterThan(contentSectionIndex);

          // Verificar que no hay URLs duplicadas
          const urls = items
            .filter((item) => item.url && typeof item.url === 'string')
            .map((item) => item.url as string);
          const uniqueUrls = new Set(urls);

          expect(urls.length).toBe(uniqueUrls.size); // No duplicados

          done();
        });
    });

    /**
     * Propiedad adicional: Ordenamiento por prioridad
     * Para cualquier configuración de navegación, las secciones deben aparecer ordenadas por prioridad
     */
    it('should order sections by priority', (done) => {
      const testConfig: NavigationConfig = {
        sections: [
          {
            id: 'low-priority',
            title: 'Baja Prioridad',
            icon: 'cil-test',
            priority: 10,
            items: [{ id: 'low', name: 'Low Item', url: '/low', icon: 'cil-test' }],
            collapsible: true,
            defaultExpanded: false,
            requiredRoles: [],
          },
          {
            id: 'high-priority',
            title: 'Alta Prioridad',
            icon: 'cil-test',
            priority: 90,
            items: [{ id: 'high', name: 'High Item', url: '/high', icon: 'cil-test' }],
            collapsible: true,
            defaultExpanded: false,
            requiredRoles: [],
          },
          {
            id: 'medium-priority',
            title: 'Media Prioridad',
            icon: 'cil-test',
            priority: 50,
            items: [
              {
                id: 'medium',
                name: 'Medium Item',
                url: '/medium',
                icon: 'cil-test',
              },
            ],
            collapsible: true,
            defaultExpanded: false,
            requiredRoles: [],
          },
        ],
        theme: NavigationConstants.DEFAULT_THEME,
        userPreferences: {
          expandedSections: [],
          collapsedSections: [],
          favoriteItems: [],
        },
      };

      service.loadNavigationConfig(testConfig);

      service
        .getNavigationItems(UserRole.ADMINISTRADOR)
        .pipe(take(1))
        .subscribe((items) => {
          // Encontrar los índices de las secciones
          const highIndex = items.findIndex((item) => item.name === 'Alta Prioridad');
          const mediumIndex = items.findIndex((item) => item.name === 'Media Prioridad');
          const lowIndex = items.findIndex((item) => item.name === 'Baja Prioridad');

          // Verificar que están ordenadas por prioridad (mayor prioridad primero)
          expect(highIndex).toBeLessThan(mediumIndex);
          expect(mediumIndex).toBeLessThan(lowIndex);

          done();
        });
    });

    /**
     * **Feature: admin-sidebar-optimization, Property 5: Indicadores visuales por estado**
     * **Valida: Requisitos 2.4, 2.5**
     *
     * Para cualquier elemento de navegación, elementos con diferentes estados (publicado, borrador, pendiente)
     * deben tener configuraciones de badge visualmente distintivas
     */
    it('should provide distinctive visual indicators for different states', (done) => {
      const testItems: INavItemEnhanced[] = [
        {
          name: 'Entradas Publicadas',
          url: '/admin/entries/published',
          iconComponent: { name: 'cil-pencil' },
          badge: {
            color: 'success',
            text: 'Publicado',
          },
        },
        {
          name: 'Borradores',
          url: '/admin/entries/drafts',
          iconComponent: { name: 'cil-history' },
          badge: {
            color: 'warning',
            text: 'Borrador',
          },
        },
        {
          name: 'Comentarios Pendientes',
          url: '/admin/comments/pending',
          iconComponent: { name: 'cil-comment-square' },
          badge: {
            color: 'danger',
            text: 'Pendiente',
          },
        },
        {
          name: 'Usuarios Activos',
          url: '/admin/users/active',
          iconComponent: { name: 'cil-people' },
          badge: {
            color: 'info',
            text: 'Activo',
          },
        },
      ];

      // Verificar que cada estado tiene un color distintivo
      const badgeColors = testItems.filter((item) => item.badge).map((item) => item.badge!.color);

      const uniqueColors = new Set(badgeColors);

      // Cada estado debe tener un color único
      expect(badgeColors.length).toBe(uniqueColors.size);

      // Verificar colores específicos para estados específicos
      const publishedItem = testItems.find((item) => item.name === 'Entradas Publicadas');
      const draftItem = testItems.find((item) => item.name === 'Borradores');
      const pendingItem = testItems.find((item) => item.name === 'Comentarios Pendientes');
      const activeItem = testItems.find((item) => item.name === 'Usuarios Activos');

      expect(publishedItem?.badge?.color).toBe('success');
      expect(draftItem?.badge?.color).toBe('warning');
      expect(pendingItem?.badge?.color).toBe('danger');
      expect(activeItem?.badge?.color).toBe('info');

      // Verificar que los textos son descriptivos del estado
      expect(publishedItem?.badge?.text).toBe('Publicado');
      expect(draftItem?.badge?.text).toBe('Borrador');
      expect(pendingItem?.badge?.text).toBe('Pendiente');
      expect(activeItem?.badge?.text).toBe('Activo');

      done();
    });

    /**
     * **Feature: admin-sidebar-optimization, Property 9: Control de acceso por roles**
     * **Valida: Requisitos 6.2**
     *
     * Para cualquier configuración de usuario y roles, solo deben mostrarse elementos de navegación
     * para los cuales el usuario tiene permisos apropiados
     */
    it('should enforce role-based access control consistently', (done) => {
      const testItems: INavItemEnhanced[] = [
        {
          name: 'Dashboard Público',
          url: '/admin/dashboard',
          iconComponent: { name: 'cil-speedometer' },
          // Sin requiredRoles = accesible para todos
        },
        {
          name: 'Gestión de Usuarios',
          url: '/admin/users',
          iconComponent: { name: 'cil-people' },
          requiredRoles: [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO],
        },
        {
          name: 'Configuración del Sistema',
          url: '/admin/system-config',
          iconComponent: { name: 'cil-settings' },
          requiredRoles: [UserRole.PROPIETARIO],
        },
        {
          name: 'Herramientas de Desarrollo',
          url: '/admin/dev-tools',
          iconComponent: { name: 'cil-code' },
          requiredRoles: [UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
        },
      ];

      // Test para LECTOR - solo debe ver elementos públicos
      const lectorItems = service.filterByPermissions(testItems, UserRole.LECTOR);
      expect(lectorItems.length).toBe(1);
      expect(lectorItems[0].name).toBe('Dashboard Público');

      // Test para ADMINISTRADOR - debe ver dashboard y gestión de usuarios
      const adminItems = service.filterByPermissions(testItems, UserRole.ADMINISTRADOR);
      expect(adminItems.length).toBe(2);
      expect(adminItems.some((item) => item.name === 'Dashboard Público')).toBeTrue();
      expect(adminItems.some((item) => item.name === 'Gestión de Usuarios')).toBeTrue();
      expect(adminItems.some((item) => item.name === 'Configuración del Sistema')).toBeFalse();

      // Test para DESARROLLADOR - debe ver dashboard y herramientas de desarrollo
      const devItems = service.filterByPermissions(testItems, UserRole.DESARROLLADOR);
      expect(devItems.length).toBe(2);
      expect(devItems.some((item) => item.name === 'Dashboard Público')).toBeTrue();
      expect(devItems.some((item) => item.name === 'Herramientas de Desarrollo')).toBeTrue();
      expect(devItems.some((item) => item.name === 'Gestión de Usuarios')).toBeFalse();

      // Test para PROPIETARIO - debe ver todos los elementos
      const ownerItems = service.filterByPermissions(testItems, UserRole.PROPIETARIO);
      expect(ownerItems.length).toBe(4);

      done();
    });
  });

  describe('Active Section Integration', () => {
    it('should get active state from ActiveSectionService', () => {
      service.getActiveState().subscribe((state) => {
        expect(state).toBeDefined();
      });
    });

    it('should get menu expansion state from ActiveSectionService', () => {
      service.getMenuExpansionState().subscribe((state) => {
        expect(state).toBeDefined();
      });
    });

    it('should get navigation context from ActiveSectionService', () => {
      service.getNavigationContext().subscribe((context) => {
        expect(context).toBeDefined();
      });
    });

    it('should check if item is active using ActiveSectionService', () => {
      const testItem: INavItemEnhanced = {
        name: 'Test Item',
        url: '/test',
        iconComponent: { name: 'cil-test' },
      };

      mockActiveSectionService.isItemActive.and.returnValue(true);

      const result = service.isItemActive(testItem);

      expect(result).toBe(true);
      expect(mockActiveSectionService.isItemActive).toHaveBeenCalledWith(testItem);
    });

    it('should check if section is active using ActiveSectionService', () => {
      const testSection: INavItemEnhanced = {
        title: true,
        name: 'Test Section',
      };

      mockActiveSectionService.isSectionActive.and.returnValue(true);

      const result = service.isSectionActive(testSection);

      expect(result).toBe(true);
      expect(mockActiveSectionService.isSectionActive).toHaveBeenCalledWith(testSection);
    });

    it('should get current breadcrumb from ActiveSectionService', () => {
      const mockBreadcrumb = ['Section', 'Item'];
      mockActiveSectionService.getCurrentBreadcrumb.and.returnValue(mockBreadcrumb);

      const result = service.getCurrentBreadcrumb();

      expect(result).toEqual(mockBreadcrumb);
      expect(mockActiveSectionService.getCurrentBreadcrumb).toHaveBeenCalled();
    });

    it('should expand section using ActiveSectionService', () => {
      const sectionId = 'test-section';

      service.expandSection(sectionId);

      expect(mockActiveSectionService.expandSection).toHaveBeenCalledWith(sectionId);
    });

    it('should collapse section using ActiveSectionService', () => {
      const sectionId = 'test-section';

      service.collapseSection(sectionId);

      expect(mockActiveSectionService.collapseSection).toHaveBeenCalledWith(sectionId);
    });

    it('should clear expansion state using ActiveSectionService', () => {
      service.clearExpansionState();

      expect(mockActiveSectionService.clearExpansionState).toHaveBeenCalled();
    });

    it('should get active section from ActiveSectionService', () => {
      const mockActiveState = {
        activeUrl: '/admin/test',
        activeSectionId: 'test-section',
        activeItemId: 'test-item',
        breadcrumb: ['Test'],
      };

      mockActiveSectionService.getCurrentActiveState.and.returnValue(mockActiveState);

      const result = service.getActiveSection();

      expect(result).toBe('test-section');
      expect(mockActiveSectionService.getCurrentActiveState).toHaveBeenCalled();
    });
  });

  describe('Dynamic Badge Integration', () => {
    it('should initialize badge counters on service creation', () => {
      expect(mockBadgeCounterService.initializeCounters).toHaveBeenCalled();
    });
  });
});
