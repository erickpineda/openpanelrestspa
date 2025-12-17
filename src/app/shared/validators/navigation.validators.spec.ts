import { TestBed } from '@angular/core/testing';
import { 
  NavigationValidators, 
  ValidationResult 
} from './navigation.validators';
import { 
  INavItemEnhanced, 
  NavigationConfig, 
  NavigationSection, 
  UserRole
} from '../types/navigation.types';
import { NavigationConstants } from '../constants/navigation.constants';
import { NavigationUtils } from '../utils/navigation.utils';

describe('NavigationValidators', () => {
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  describe('Unit Tests', () => {
    
    it('should validate empty navigation config as invalid', () => {
      const config: NavigationConfig = {
        sections: [],
        theme: NavigationConstants.DEFAULT_THEME,
        userPreferences: { expandedSections: [], collapsedSections: [], favoriteItems: [] }
      };
      
      const result = NavigationValidators.validateNavigationConfig(config);
      
      expect(result.isValid).toBeFalse();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate simple valid navigation item', () => {
      const item: INavItemEnhanced = {
        name: 'Dashboard',
        url: '/admin/dashboard',
        iconComponent: { name: 'cil-speedometer' }
      };
      
      const result = NavigationValidators.validateNavigationItem(item);
      
      expect(result.isValid).toBeTrue();
      expect(result.errors.length).toBe(0);
    });

    it('should detect duplicate URLs', () => {
      const items: INavItemEnhanced[] = [
        { name: 'Item 1', url: '/same-url', iconComponent: { name: 'cil-test' } },
        { name: 'Item 2', url: '/same-url', iconComponent: { name: 'cil-test' } }
      ];
      
      const result = NavigationValidators.validateNoDuplicateUrls(items);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('URL duplicada');
    });
  });

  describe('Property-Based Tests', () => {

    /**
     * **Feature: admin-sidebar-optimization, Property 2: Jerarquía de navegación limitada**
     * **Valida: Requisitos 1.5**
     * 
     * Para cualquier estructura de navegación generada, la profundidad máxima no debe exceder 2 niveles
     */
    it('should enforce maximum navigation depth of 2 levels', () => {
      // Crear estructura con profundidad válida (2 niveles)
      const validItems: INavItemEnhanced[] = [
        {
          name: 'Parent',
          url: '/parent',
          iconComponent: { name: 'cil-test' },
          children: [
            {
              name: 'Child',
              url: '/parent/child',
              iconComponent: { name: 'cil-test' }
            }
          ]
        }
      ];

      const validResult = NavigationValidators.validateNavigationItems(validItems);
      const depthValid = NavigationUtils.validateNavigationDepth(validItems);
      
      expect(depthValid).toBeTrue();
      expect(validResult.isValid).toBeTrue();

      // Crear estructura con profundidad inválida (3 niveles)
      const invalidItems: INavItemEnhanced[] = [
        {
          name: 'Parent',
          url: '/parent',
          iconComponent: { name: 'cil-test' },
          children: [
            {
              name: 'Child',
              url: '/parent/child',
              iconComponent: { name: 'cil-test' },
              children: [
                {
                  name: 'Grandchild',
                  url: '/parent/child/grandchild',
                  iconComponent: { name: 'cil-test' }
                }
              ]
            }
          ]
        }
      ];

      const invalidResult = NavigationValidators.validateNavigationItems(invalidItems);
      const depthInvalid = NavigationUtils.validateNavigationDepth(invalidItems);
      
      expect(depthInvalid).toBeFalse();
      expect(invalidResult.isValid).toBeFalse();
      expect(invalidResult.errors.some(error => 
        error.message.includes('excede la profundidad máxima')
      )).toBeTrue();
    });

    it('should require valid names for all navigation items', () => {
      // Elemento con nombre vacío
      const itemsWithEmptyName: INavItemEnhanced[] = [
        {
          name: '',
          url: '/test',
          iconComponent: { name: 'cil-test' }
        }
      ];

      const result = NavigationValidators.validateNavigationItems(itemsWithEmptyName);
      
      expect(result.isValid).toBeFalse();
      expect(result.errors.some(error => 
        error.message.includes('nombre válido')
      )).toBeTrue();
    });

    it('should validate dynamic badge configuration', () => {
      // Elemento con badge dinámico mal configurado
      const itemsWithInvalidBadge: INavItemEnhanced[] = [
        {
          name: 'Test Item',
          url: '/test',
          iconComponent: { name: 'cil-test' },
          dynamicBadge: {
            service: '', // Servicio vacío
            method: 'getCount'
          }
        }
      ];

      const result = NavigationValidators.validateNavigationItems(itemsWithInvalidBadge);
      
      expect(result.isValid).toBeFalse();
      expect(result.errors.some(error => 
        error.message.includes('Badge dinámico mal configurado')
      )).toBeTrue();
    });

    it('should validate navigation sections structure', () => {
      // Configuración con sección inválida
      const configWithInvalidSection: NavigationConfig = {
        sections: [
          {
            id: '', // ID vacío
            title: 'Valid Title',
            icon: 'cil-test',
            priority: 1,
            items: [],
            collapsible: true,
            defaultExpanded: false,
            requiredRoles: []
          }
        ],
        theme: NavigationConstants.DEFAULT_THEME,
        userPreferences: { expandedSections: [], collapsedSections: [], favoriteItems: [] }
      };

      const result = NavigationValidators.validateNavigationConfig(configWithInvalidSection);
      
      expect(result.isValid).toBeFalse();
      expect(result.errors.some(error => 
        error.message.includes('ID válido')
      )).toBeTrue();
    });
  });
});