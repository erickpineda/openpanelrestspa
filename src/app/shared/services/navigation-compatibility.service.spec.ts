import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { INavData } from '@coreui/angular';
import { NavigationCompatibilityService, LegacyComponentExpectations } from './navigation-compatibility.service';
import { INavItemEnhanced, UserRole } from '../types/navigation.types';
// fast-check removed for TS compatibility

describe('NavigationCompatibilityService', () => {
  let service: NavigationCompatibilityService;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    });
    
    service = TestBed.inject(NavigationCompatibilityService);
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('convertToLegacyFormat', () => {
    it('should convert enhanced items to legacy format', () => {
      const enhancedItems: INavItemEnhanced[] = [
        {
          name: 'Dashboard',
          url: '/admin/dashboard',
          iconComponent: { name: 'cil-speedometer' },
          priority: 100,
          requiredRoles: [UserRole.AUTOR],
          badge: { color: 'info', text: 'Main' }
        },
        {
          name: 'Entradas',
          url: '/admin/control/entradas',
          priority: 85,
          requiredRoles: [UserRole.AUTOR],
          children: [
            {
              name: 'Nueva Entrada',
              url: '/admin/control/entradas/crear',
              priority: 95,
              requiredRoles: [UserRole.AUTOR]
            }
          ]
        }
      ];

      const result = service.convertToLegacyFormat(enhancedItems);

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Dashboard');
      expect(result[0].url).toBe('/admin/dashboard');
      expect(result[0].badge).toEqual({ color: 'info', text: 'Main' });
      expect((result[0] as any).priority).toBeUndefined();
      expect((result[0] as any).requiredRoles).toBeUndefined();

      expect((result[1].children || []).length).toBe(1);
      expect(result[1].children![0].name).toBe('Nueva Entrada');
    });

    it('should preserve all legacy-compatible properties', () => {
      const enhancedItem: INavItemEnhanced = {
        name: 'Test Item',
        url: '/test',
        iconComponent: { name: 'cil-test' },
        icon: 'test-icon',
        badge: { color: 'success', text: 'Test' },
        title: false,
        divider: false,
        class: 'test-class',
        variant: 'test-variant',
        attributes: { target: '_blank' },
        linkProps: { fragment: 'test' },
        priority: 50,
        requiredRoles: [UserRole.AUTOR]
      };

      const result = service.convertToLegacyFormat([enhancedItem]);

      expect(result[0].name).toBe('Test Item');
      expect(result[0].url).toBe('/test');
      expect(result[0].iconComponent).toEqual({ name: 'cil-test' });
      expect(result[0].icon).toBe('test-icon');
      expect(result[0].badge).toEqual({ color: 'success', text: 'Test' });
      expect(result[0].class).toBe('test-class');
      expect(result[0].variant).toBe('test-variant');
      expect(result[0].attributes).toEqual({ target: '_blank' });
      expect(result[0].linkProps).toEqual({ fragment: 'test' });
    });
  });

  describe('handleLegacyRouteRedirect', () => {
    it('should return correct new URLs for legacy routes', () => {
      const testCases = [
        { legacy: '/admin/entradas', expected: '/admin/control/entradas' },
        { legacy: '/admin/usuarios', expected: '/admin/control/gestion/usuarios' },
        { legacy: '/admin/perfil', expected: '/admin/control/gestion/miperfil' },
        { legacy: '/admin/comentarios', expected: '/admin/control/comentarios' }
      ];

      testCases.forEach(testCase => {
        const result = service.handleLegacyRouteRedirect(testCase.legacy);
        expect(result).toBe(testCase.expected);
      });
    });

    it('should return null for non-legacy routes', () => {
      const nonLegacyRoutes = [
        '/admin/control/entradas',
        '/admin/dashboard',
        '/some/other/route'
      ];

      nonLegacyRoutes.forEach(route => {
        const result = service.handleLegacyRouteRedirect(route);
        expect(result).toBeNull();
      });
    });
  });

  describe('redirectLegacyRoute', () => {
    it('should redirect legacy routes using router', async () => {
      mockRouter.navigateByUrl.and.returnValue(Promise.resolve(true));

      const result = await service.redirectLegacyRoute('/admin/entradas');

      expect(result).toBe(true);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/admin/control/entradas');
    });

    it('should return false for non-legacy routes', async () => {
      const result = await service.redirectLegacyRoute('/admin/dashboard');

      expect(result).toBe(false);
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('adaptForLegacyComponent', () => {
    let sampleEnhancedItems: INavItemEnhanced[];

    beforeEach(() => {
      sampleEnhancedItems = [
        {
          name: 'Parent Item',
          url: '/parent',
          priority: 100,
          requiredRoles: [UserRole.AUTOR],
          badge: { color: 'info', text: 'Badge' },
          iconComponent: { name: 'cil-parent' },
          children: [
            {
              name: 'Child Item',
              url: '/parent/child',
              priority: 90,
              requiredRoles: [UserRole.AUTOR]
            }
          ]
        },
        {
          name: 'Simple Item',
          url: '/simple',
          priority: 80,
          requiredRoles: [UserRole.AUTOR]
        }
      ];
    });

    it('should flatten hierarchy when requested', () => {
      const expectations: LegacyComponentExpectations = {
        flattenHierarchy: true
      };

      const result = service.adaptForLegacyComponent(sampleEnhancedItems, expectations);

      expect(result.length).toBe(3); // Parent + Child + Simple
      expect(result[0].name).toBe('Parent Item');
      expect(result[0].children).toBeUndefined();
      expect(result[1].name).toBe('  Child Item'); // Indented
      expect(result[1].class).toContain('nav-child-item');
      expect(result[2].name).toBe('Simple Item');
    });

    it('should remove badges when requested', () => {
      const expectations: LegacyComponentExpectations = {
        removeBadges: true
      };

      const result = service.adaptForLegacyComponent(sampleEnhancedItems, expectations);

      result.forEach(item => {
        expect(item.badge).toBeUndefined();
      });
    });

    it('should simplify icons when requested', () => {
      const expectations: LegacyComponentExpectations = {
        simplifyIcons: true
      };

      const result = service.adaptForLegacyComponent(sampleEnhancedItems, expectations);

      expect(result[0].icon).toBe('cil-parent');
      expect(result[0].iconComponent).toBeUndefined();
    });

    it('should filter by URLs when requested', () => {
      const expectations: LegacyComponentExpectations = {
        filterByUrls: true,
        allowedUrls: ['/parent']
      };

      const result = service.adaptForLegacyComponent(sampleEnhancedItems, expectations);

      expect(result.length).toBe(1);
      expect(result[0].url).toBe('/parent');
    });

    it('should apply multiple adaptations together', () => {
      const expectations: LegacyComponentExpectations = {
        flattenHierarchy: true,
        removeBadges: true,
        simplifyIcons: true
      };

      const result = service.adaptForLegacyComponent(sampleEnhancedItems, expectations);

      expect(result.length).toBe(3); // Flattened
      expect(result[0].badge).toBeUndefined(); // No badges
      expect(result[0].icon).toBe('cil-parent'); // Simplified icons
      expect(result[0].iconComponent).toBeUndefined();
    });
  });

  describe('checkCompatibility', () => {
    it('should detect legacy INavData format', () => {
      const legacyConfig: INavData[] = [
        {
          name: 'Dashboard',
          url: '/admin/dashboard'
        }
      ];

      const result = service.checkCompatibility(legacyConfig);

      expect(result.warnings).toContain('Navigation items are using legacy INavData format');
      expect(result.suggestions).toContain('Consider migrating to INavItemEnhanced for better functionality');
    });

    it('should detect deprecated badge format', () => {
      const configWithDeprecatedBadge = [
        {
          name: 'Item',
          url: '/test',
          badge: 'deprecated-string-badge'
        }
      ];

      const result = service.checkCompatibility(configWithDeprecatedBadge);

      expect(result.isCompatible).toBe(false);
      expect(result.issues.some(issue => issue.includes('deprecated string badge format'))).toBe(true);
    });

    it('should detect deprecated roles property', () => {
      const configWithDeprecatedRoles = [
        {
          name: 'Item',
          url: '/test',
          roles: ['admin']
        }
      ];

      const result = service.checkCompatibility(configWithDeprecatedRoles);

      expect(result.warnings.some(warning => warning.includes("deprecated 'roles' property"))).toBe(true);
    });

    it('should report compatible configuration', () => {
      const compatibleConfig: INavItemEnhanced[] = [
        {
          name: 'Dashboard',
          url: '/admin/dashboard',
          priority: 100,
          requiredRoles: [UserRole.AUTOR]
        }
      ];

      const result = service.checkCompatibility(compatibleConfig);

      expect(result.isCompatible).toBe(true);
      expect(result.issues.length).toBe(0);
    });
  });

  describe('Deterministic validations', () => {
    it('legacy conversion preserves essential data', () => {
      const enhancedItems: INavItemEnhanced[] = [
        { name: 'A', url: '/a', iconComponent: { name: 'cil-a' }, priority: 10, requiredRoles: [UserRole.AUTOR] },
        { name: 'B', url: '/b', icon: 'cil-b', badge: { color: 'success', text: 'B' }, priority: 20, requiredRoles: [UserRole.EDITOR] }
      ];
      const legacyItems = service.convertToLegacyFormat(enhancedItems);
      expect(legacyItems.length).toBe(enhancedItems.length);
      legacyItems.forEach((legacyItem, i) => {
        const original = enhancedItems[i];
        expect(legacyItem.name).toBe(original.name);
        expect(legacyItem.url).toBe(original.url);
        expect((legacyItem as any).priority).toBeUndefined();
        expect((legacyItem as any).requiredRoles).toBeUndefined();
      });
    });

    it('route mappings redirect to valid routes', () => {
      const routes = ['/admin/entradas','/admin/usuarios','/admin/perfil','/admin/comentarios'];
      routes.forEach(r => {
        const newRoute = service.handleLegacyRouteRedirect(r);
        expect(newRoute).toBeDefined();
        expect(newRoute).not.toBe(r);
        expect(newRoute!.startsWith('/admin')).toBeTrue();
      });
    });
  });
});
