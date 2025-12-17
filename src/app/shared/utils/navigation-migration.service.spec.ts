import { TestBed } from '@angular/core/testing';
import { INavData } from '@coreui/angular';
import { NavigationMigrationService } from './navigation-migration.service';
import { INavItemEnhanced, UserRole } from '../types/navigation.types';

describe('NavigationMigrationService', () => {
  let service: NavigationMigrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavigationMigrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('migrateLegacyNavigation', () => {
    it('should migrate simple legacy navigation items', () => {
      const legacyItems: INavData[] = [
        {
          name: 'Dashboard',
          url: '/admin/dashboard',
          iconComponent: { name: 'cil-speedometer' }
        },
        {
          name: 'Entradas',
          url: '/admin/control/entradas',
          iconComponent: { name: 'cil-pencil' }
        }
      ];

      const result = service.migrateLegacyNavigation(legacyItems);

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Dashboard');
      expect(result[0].priority).toBe(100); // Dashboard gets highest priority
      expect(result[0].requiredRoles).toContain(UserRole.AUTOR);
      
      expect(result[1].name).toBe('Entradas');
      expect(result[1].priority).toBe(85); // Content items get high priority
      expect(result[1].requiredRoles).toContain(UserRole.AUTOR);
    });

    it('should migrate nested navigation items', () => {
      const legacyItems: INavData[] = [
        {
          name: 'Entradas',
          url: '/admin/control/entradas',
          children: [
            {
              name: 'Nueva Entrada',
              url: '/admin/control/entradas/crear'
            },
            {
              name: 'Todas las Entradas',
              url: '/admin/control/entradas'
            }
          ]
        }
      ];

      const result = service.migrateLegacyNavigation(legacyItems);

      expect((result[0].children || []).length).toBe(2);
      expect(result[0].children![0].name).toBe('Nueva Entrada');
      expect(result[0].children![0].priority).toBe(95); // New entry gets very high priority
      expect(result[0].children![1].name).toBe('Todas las Entradas');
    });

    it('should add dynamic badges to appropriate items', () => {
      const legacyItems: INavData[] = [
        {
          name: 'Comentarios',
          url: '/admin/control/comentarios'
        },
        {
          name: 'Borradores',
          url: '/admin/control/entradas/entradas-temporales'
        }
      ];

      const result = service.migrateLegacyNavigation(legacyItems);

      expect(result[0].dynamicBadge).toBeDefined();
      expect(result[0].dynamicBadge!.service).toBe('BadgeCounterService');
      expect(result[0].dynamicBadge!.method).toBe('getUnmoderatedCommentsCount');
      expect(result[0].badge!.color).toBe('danger');

      expect(result[1].dynamicBadge).toBeDefined();
      expect(result[1].dynamicBadge!.method).toBe('getDraftEntriesCount');
      expect(result[1].badge!.color).toBe('warning');
    });

    it('should infer correct roles for different item types', () => {
      const legacyItems: INavData[] = [
        {
          name: 'Usuarios',
          url: '/admin/control/gestion/usuarios'
        },
        {
          name: 'Roles',
          url: '/admin/control/gestion/roles'
        },
        {
          name: 'Mi Perfil',
          url: '/admin/control/gestion/miperfil'
        }
      ];

      const result = service.migrateLegacyNavigation(legacyItems);

      // Users management - admin only
      expect(result[0].requiredRoles).toEqual([UserRole.ADMINISTRADOR, UserRole.PROPIETARIO]);
      
      // Roles management - owner only
      expect(result[1].requiredRoles).toEqual([UserRole.PROPIETARIO]);
      
      // Profile - all authenticated users
      expect(result[2].requiredRoles).toContain(UserRole.LECTOR);
      expect(result[2].requiredRoles).toContain(UserRole.PROPIETARIO);
    });

    it('should add responsive configuration to appropriate items', () => {
      const legacyItems: INavData[] = [
        {
          name: 'Mantenimiento',
          url: '/admin/control/mantenimiento'
        },
        {
          name: 'Entradas',
          url: '/admin/control/entradas',
          children: [
            { name: 'Nueva Entrada', url: '/admin/control/entradas/crear' }
          ]
        }
      ];

      const result = service.migrateLegacyNavigation(legacyItems);

      // Maintenance items should hide on mobile
      expect(result[0].responsiveConfig?.hideOnMobile).toBe(true);
      
      // Items with children should have collapse threshold
      expect(result[1].responsiveConfig?.collapseThreshold).toBe(1024);
    });
  });

  describe('getRouteMapping', () => {
    it('should provide correct route mappings', () => {
      const routeMap = service.getRouteMapping();

      expect(routeMap.get('/admin/entradas')).toBe('/admin/control/entradas');
      expect(routeMap.get('/admin/usuarios')).toBe('/admin/control/gestion/usuarios');
      expect(routeMap.get('/admin/perfil')).toBe('/admin/control/gestion/miperfil');
    });

    it('should have mappings for all common legacy routes', () => {
      const routeMap = service.getRouteMapping();
      const expectedMappings = [
        '/admin/entradas',
        '/admin/usuarios',
        '/admin/configuracion',
        '/admin/perfil',
        '/admin/comentarios',
        '/admin/paginas',
        '/admin/multimedia'
      ];

      expectedMappings.forEach(route => {
        expect(routeMap.has(route)).toBe(true);
      });
    });
  });

  describe('validateMigratedStructure', () => {
    it('should validate correct navigation structure', () => {
      const validItems: INavItemEnhanced[] = [
        {
          name: 'Dashboard',
          url: '/admin/dashboard',
          priority: 100,
          requiredRoles: [UserRole.AUTOR]
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

      const result = service.validateMigratedStructure(validItems);

      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should detect duplicate URLs', () => {
      const invalidItems: INavItemEnhanced[] = [
        {
          name: 'Item 1',
          url: '/admin/duplicate',
          priority: 100,
          requiredRoles: [UserRole.AUTOR]
        },
        {
          name: 'Item 2',
          url: '/admin/duplicate',
          priority: 90,
          requiredRoles: [UserRole.AUTOR]
        }
      ];

      const result = service.validateMigratedStructure(invalidItems);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Duplicate URL found: /admin/duplicate');
    });

    it('should detect missing required properties', () => {
      const invalidItems: INavItemEnhanced[] = [
        {
          name: '',
          url: '/admin/test',
          priority: 100,
          requiredRoles: [UserRole.AUTOR]
        },
        {
          name: 'No URL or Title',
          priority: 90,
          requiredRoles: []
        }
      ];

      const result = service.validateMigratedStructure(invalidItems);

      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.includes('missing name'))).toBe(true);
      expect(result.issues.some(issue => issue.includes('empty requiredRoles'))).toBe(true);
    });

    it('should detect excessive hierarchy depth', () => {
      const deepItems: INavItemEnhanced[] = [
        {
          name: 'Level 1',
          url: '/admin/level1',
          priority: 100,
          requiredRoles: [UserRole.AUTOR],
          children: [
            {
              name: 'Level 2',
              url: '/admin/level2',
              priority: 90,
              requiredRoles: [UserRole.AUTOR],
              children: [
                {
                  name: 'Level 3 - Too Deep',
                  url: '/admin/level3',
                  priority: 80,
                  requiredRoles: [UserRole.AUTOR]
                }
              ]
            }
          ]
        }
      ];

      const result = service.validateMigratedStructure(deepItems);

      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.includes('exceeds maximum depth'))).toBe(true);
    });
  });

  describe('preserveCustomConfigurations', () => {
    it('should preserve custom user configurations', () => {
      const originalItems: INavItemEnhanced[] = [
        {
          name: 'Dashboard',
          url: '/admin/dashboard',
          priority: 100,
          requiredRoles: [UserRole.AUTOR]
        }
      ];

      const customConfig: Partial<INavItemEnhanced>[] = [
        {
          url: '/admin/dashboard',
          priority: 150,
          badge: { color: 'success', text: 'Custom' }
        }
      ];

      const result = service.preserveCustomConfigurations(originalItems, customConfig);

      expect(result[0].priority).toBe(150);
      expect(result[0].badge?.text).toBe('Custom');
      expect(result[0].requiredRoles).toEqual([UserRole.AUTOR]); // Should preserve system properties
    });

    it('should preserve custom configurations for nested items', () => {
      const originalItems: INavItemEnhanced[] = [
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

      const customConfig: Partial<INavItemEnhanced>[] = [
        {
          url: '/admin/control/entradas/crear',
          priority: 200,
          badge: { color: 'info', text: 'Hot' }
        }
      ];

      const result = service.preserveCustomConfigurations(originalItems, customConfig);

      expect(result[0].children![0].priority).toBe(200);
      expect(result[0].children![0].badge?.text).toBe('Hot');
    });
  });

  describe('Deterministic validations', () => {
    it('preserves structure and roles on migration', () => {
      const legacyItems: INavData[] = [
        { name: 'A', url: '/a' },
        { name: 'B', url: '/b', children: [{ name: 'B1', url: '/b/1' }] }
      ];
      const migrated = service.migrateLegacyNavigation(legacyItems);
      expect(migrated.every(item => item.name && item.name.length > 0)).toBeTrue();
      expect(migrated.every(item => typeof item.priority === 'number')).toBeTrue();
      expect(migrated.every(item => Array.isArray(item.requiredRoles))).toBeTrue();
      const validation = service.validateMigratedStructure(migrated);
      expect(validation.isValid).toBeTrue();
    });

    it('route mappings are consistent', () => {
      const routeMap = service.getRouteMapping();
      Array.from(routeMap.keys()).forEach(k => {
        const v = routeMap.get(k);
        expect(v).toBeDefined();
        expect(v).not.toBe(k);
        expect(v!.startsWith('/admin')).toBeTrue();
      });
    });

    it('validation detects issues', () => {
      const items: INavItemEnhanced[] = [
        { name: '', url: '/x', priority: 10, requiredRoles: [UserRole.AUTOR] },
        { name: 'No URL', priority: 5, requiredRoles: [] }
      ];
      const result = service.validateMigratedStructure(items);
      expect(result.isValid).toBeFalse();
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });
});
