import { TestBed } from '@angular/core/testing';
import {
  ProgrammaticNavigationConfigService,
  DynamicElementConfig,
  DynamicGroupConfig,
} from './programmatic-navigation-config.service';
import {
  INavItemEnhanced,
  UserRole,
  NavigationConfig,
  IContextualAction,
} from '../../../shared/types/navigation.types';
import { NavigationConstants } from '../../../shared/constants/navigation.constants';

describe('ProgrammaticNavigationConfigService', () => {
  let service: ProgrammaticNavigationConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProgrammaticNavigationConfigService],
    });
    service = TestBed.inject(ProgrammaticNavigationConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Element Configuration', () => {
    it('should configure element with icon, badge and actions', () => {
      const config: DynamicElementConfig = {
        itemId: 'test-item',
        icon: 'cil-star',
        badge: {
          color: 'success',
          text: 'New',
        },
        contextualActions: [
          {
            name: 'Edit',
            icon: 'cil-pencil',
            action: () => {},
            tooltip: 'Edit item',
          },
        ],
        priority: 100,
      };

      service.configureElement(config);

      const retrievedConfig = service.getElementConfig('test-item');
      expect(retrievedConfig).toEqual(config);
    });

    it('should merge configurations for existing elements', () => {
      // Primera configuración
      service.configureElement({
        itemId: 'test-item',
        icon: 'cil-star',
        priority: 50,
      });

      // Segunda configuración (merge)
      service.configureElement({
        itemId: 'test-item',
        badge: {
          color: 'warning',
          text: 'Updated',
        },
      });

      const config = service.getElementConfig('test-item');
      expect(config?.icon).toBe('cil-star');
      expect(config?.priority).toBe(50);
      expect(config?.badge?.color).toBe('warning');
      expect(config?.badge?.text).toBe('Updated');
    });

    it('should remove element by setting visibility to false', () => {
      service.configureElement({
        itemId: 'test-item',
        icon: 'cil-star',
      });

      service.removeElement('test-item');

      const config = service.getElementConfig('test-item');
      expect(config?.visible).toBe(false);
    });
  });

  describe('Badge Configuration', () => {
    it('should set badge for element', () => {
      const badge = {
        color: 'danger' as const,
        text: 'Alert',
        dynamic: true,
      };

      service.setBadge('test-item', badge);

      const config = service.getElementConfig('test-item');
      expect(config?.badge).toEqual(badge);
    });

    it('should remove badge from element', () => {
      service.setBadge('test-item', { color: 'info', text: 'Info' });
      service.removeBadge('test-item');

      const config = service.getElementConfig('test-item');
      expect(config?.badge).toBeUndefined();
    });
  });

  describe('Icon Configuration', () => {
    it('should set icon for element', () => {
      service.setIcon('test-item', 'cil-home');

      const config = service.getElementConfig('test-item');
      expect(config?.icon).toBe('cil-home');
    });
  });

  describe('Visibility Configuration', () => {
    it('should set visibility for element', () => {
      service.setVisibility('test-item', false);

      const config = service.getElementConfig('test-item');
      expect(config?.visible).toBe(false);
    });
  });

  describe('Priority Configuration', () => {
    it('should set priority for element', () => {
      service.setPriority('test-item', 75);

      const config = service.getElementConfig('test-item');
      expect(config?.priority).toBe(75);
    });
  });

  describe('Roles Configuration', () => {
    it('should set required roles for element', () => {
      const roles = [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO];
      service.setRequiredRoles('test-item', roles);

      const config = service.getElementConfig('test-item');
      expect(config?.requiredRoles).toEqual(roles);
    });
  });

  describe('Contextual Actions', () => {
    it('should add contextual action to element', () => {
      const action: IContextualAction = {
        name: 'Delete',
        icon: 'cil-trash',
        action: () => {},
        tooltip: 'Delete item',
      };

      service.addContextualAction('test-item', action);

      const config = service.getElementConfig('test-item');
      expect(config?.contextualActions).toContain(action);
    });

    it('should remove contextual action from element', () => {
      const action1: IContextualAction = {
        name: 'Edit',
        icon: 'cil-pencil',
        action: () => {},
      };

      const action2: IContextualAction = {
        name: 'Delete',
        icon: 'cil-trash',
        action: () => {},
      };

      service.addContextualAction('test-item', action1);
      service.addContextualAction('test-item', action2);
      service.removeContextualAction('test-item', 'Edit');

      const config = service.getElementConfig('test-item');
      expect(config?.contextualActions?.length).toBe(1);
      expect(config?.contextualActions?.[0].name).toBe('Delete');
    });
  });

  describe('Group Configuration', () => {
    it('should create dynamic group', () => {
      const groupConfig: DynamicGroupConfig = {
        groupId: 'custom-group',
        title: 'Custom Group',
        icon: 'cil-folder',
        priority: 80,
        collapsible: true,
        defaultExpanded: false,
        requiredRoles: [UserRole.DESARROLLADOR],
        items: ['item1', 'item2', 'item3'],
      };

      service.createGroup(groupConfig);

      // Verificar que el grupo se creó correctamente
      service.getGroupChanges().subscribe((groups) => {
        const group = groups.get('custom-group');
        expect(group).toEqual(groupConfig);
      });
    });

    it('should update existing group', () => {
      const initialConfig: DynamicGroupConfig = {
        groupId: 'test-group',
        title: 'Test Group',
        priority: 50,
        items: ['item1'],
      };

      service.createGroup(initialConfig);
      service.updateGroup('test-group', {
        title: 'Updated Group',
        priority: 75,
        items: ['item1', 'item2'],
      });

      service.getGroupChanges().subscribe((groups) => {
        const group = groups.get('test-group');
        expect(group?.title).toBe('Updated Group');
        expect(group?.priority).toBe(75);
        expect(group?.items).toEqual(['item1', 'item2']);
      });
    });

    it('should remove group', () => {
      service.createGroup({
        groupId: 'temp-group',
        title: 'Temporary Group',
        priority: 10,
        items: [],
      });

      service.removeGroup('temp-group');

      service.getGroupChanges().subscribe((groups) => {
        expect(groups.has('temp-group')).toBe(false);
      });
    });
  });

  describe('Dynamic Configuration Application', () => {
    it('should apply dynamic configurations to navigation items', () => {
      const items: INavItemEnhanced[] = [
        {
          name: 'Test Item',
          url: '/test',
          iconComponent: { name: 'cil-circle' },
          priority: 50,
        },
        {
          name: 'Another Item',
          url: '/another',
          iconComponent: { name: 'cil-square' },
          priority: 30,
        },
      ];

      // Configurar dinámicamente el primer elemento
      service.configureElement({
        itemId: '/test',
        icon: 'cil-star',
        badge: { color: 'success', text: 'Updated' },
        priority: 100,
      });

      // Ocultar el segundo elemento
      service.setVisibility('/another', false);

      const configuredItems = service.applyDynamicConfigurations(items);

      // Verificar que solo queda un elemento (el otro está oculto)
      expect(configuredItems.length).toBe(1);

      // Verificar que las configuraciones se aplicaron
      const firstItem = configuredItems[0];
      expect(firstItem.iconComponent?.name).toBe('cil-star');
      expect(firstItem.badge?.color).toBe('success');
      expect(firstItem.badge?.text).toBe('Updated');
      expect(firstItem.priority).toBe(100);
    });

    it('should sort items by priority after applying configurations', () => {
      const items: INavItemEnhanced[] = [
        {
          name: 'Low Priority',
          url: '/low',
          priority: 10,
        },
        {
          name: 'High Priority',
          url: '/high',
          priority: 90,
        },
        {
          name: 'Medium Priority',
          url: '/medium',
          priority: 50,
        },
      ];

      // Cambiar prioridades dinámicamente
      service.setPriority('/low', 100); // Ahora será la más alta
      service.setPriority('/high', 20); // Ahora será la más baja

      const sortedItems = service.applyDynamicConfigurations(items);

      expect(sortedItems[0].name).toBe('Low Priority'); // Prioridad 100
      expect(sortedItems[1].name).toBe('Medium Priority'); // Prioridad 50
      expect(sortedItems[2].name).toBe('High Priority'); // Prioridad 20
    });
  });

  describe('Navigation Generation with Dynamic Groups', () => {
    it('should generate navigation config with dynamic groups', () => {
      const baseConfig: NavigationConfig = {
        sections: [
          {
            id: 'base-section',
            title: 'Base Section',
            icon: 'cil-home',
            priority: 100,
            items: [],
            collapsible: false,
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

      // Crear grupo dinámico
      service.createGroup({
        groupId: 'dynamic-tools',
        title: 'Dynamic Tools',
        icon: 'cil-wrench',
        priority: 80,
        items: ['tool1', 'tool2'],
        collapsible: true,
        defaultExpanded: false,
        requiredRoles: [UserRole.DESARROLLADOR],
      });

      const enhancedConfig = service.generateNavigationWithDynamicGroups(baseConfig);

      expect(enhancedConfig.sections.length).toBe(2);

      const dynamicSection = enhancedConfig.sections.find((s) => s.id === 'dynamic-tools');
      expect(dynamicSection).toBeDefined();
      expect(dynamicSection?.title).toBe('Dynamic Tools');
      expect(dynamicSection?.priority).toBe(80);
      expect(dynamicSection?.items.length).toBe(2);
      expect(dynamicSection?.requiredRoles).toEqual([UserRole.DESARROLLADOR]);
    });
  });

  describe('Configuration Persistence', () => {
    it('should export and import configurations', () => {
      // Configurar algunos elementos y grupos
      service.configureElement({
        itemId: 'item1',
        icon: 'cil-star',
        priority: 100,
      });

      service.createGroup({
        groupId: 'group1',
        title: 'Test Group',
        priority: 50,
        items: ['item1'],
      });

      // Exportar configuraciones
      const exported = service.exportConfigurations();

      expect(exported.elements.length).toBe(1);
      expect(exported.groups.length).toBe(1);
      expect(exported.elements[0].icon).toBe('cil-star');
      expect(exported.groups[0].title).toBe('Test Group');

      // Resetear y luego importar
      service.resetAllConfigurations();
      service.importConfigurations(exported);

      // Verificar que se restauraron correctamente
      const restoredElement = service.getElementConfig('item1');
      expect(restoredElement?.icon).toBe('cil-star');
      expect(restoredElement?.priority).toBe(100);

      service.getGroupChanges().subscribe((groups) => {
        const restoredGroup = groups.get('group1');
        expect(restoredGroup?.title).toBe('Test Group');
        expect(restoredGroup?.priority).toBe(50);
      });
    });
  });

  describe('Observables', () => {
    it('should emit configuration changes', (done) => {
      let emissionCount = 0;

      service.getConfigurationChanges().subscribe((configs) => {
        emissionCount++;

        if (emissionCount === 2) {
          // Primera emisión es el estado inicial vacío
          expect(configs.has('test-item')).toBe(true);
          expect(configs.get('test-item')?.icon).toBe('cil-test');
          done();
        }
      });

      service.setIcon('test-item', 'cil-test');
    });

    it('should emit group changes', (done) => {
      let emissionCount = 0;

      service.getGroupChanges().subscribe((groups) => {
        emissionCount++;

        if (emissionCount === 2) {
          // Primera emisión es el estado inicial vacío
          expect(groups.has('test-group')).toBe(true);
          expect(groups.get('test-group')?.title).toBe('Test Group');
          done();
        }
      });

      service.createGroup({
        groupId: 'test-group',
        title: 'Test Group',
        priority: 50,
        items: [],
      });
    });
  });

  // **Feature: admin-sidebar-optimization, Property 11: Configuración programática**
  // **Valida: Requisitos 6.4**
  describe('Property 11: Programmatic configuration', () => {
    it('should allow programmatic configuration of any navigation element', () => {
      // Arrange: Create various navigation elements
      const testElements = [
        { itemId: 'dashboard', name: 'Dashboard', url: '/dashboard' },
        { itemId: 'users', name: 'Users', url: '/users' },
        { itemId: 'settings', name: 'Settings', url: '/settings' },
      ];

      // Act: Configure each element programmatically with different properties
      testElements.forEach((element, index) => {
        service.configureElement({
          itemId: element.itemId,
          icon: `cil-icon-${index}`,
          badge: {
            color: index % 2 === 0 ? 'success' : 'warning',
            text: `Badge ${index}`,
          },
          priority: (index + 1) * 10,
          visible: true,
          requiredRoles: index === 0 ? [] : [UserRole.ADMINISTRADOR],
        });
      });

      // Assert: Verify all configurations were applied correctly
      testElements.forEach((element, index) => {
        const config = service.getElementConfig(element.itemId);

        expect(config).toBeDefined();
        expect(config?.icon).toBe(`cil-icon-${index}`);
        expect(config?.badge?.color).toBe(index % 2 === 0 ? 'success' : 'warning');
        expect(config?.badge?.text).toBe(`Badge ${index}`);
        expect(config?.priority).toBe((index + 1) * 10);
        expect(config?.visible).toBe(true);

        if (index === 0) {
          expect(config?.requiredRoles).toEqual([]);
        } else {
          expect(config?.requiredRoles).toEqual([UserRole.ADMINISTRADOR]);
        }
      });
    });

    it('should allow programmatic creation and configuration of groups', () => {
      // Arrange: Define multiple groups with different configurations
      const groupConfigs = [
        {
          groupId: 'admin-tools',
          title: 'Admin Tools',
          icon: 'cil-wrench',
          priority: 90,
          items: ['user-management', 'system-config'],
          requiredRoles: [UserRole.ADMINISTRADOR],
        },
        {
          groupId: 'developer-tools',
          title: 'Developer Tools',
          icon: 'cil-code',
          priority: 80,
          items: ['api-docs', 'debug-console'],
          requiredRoles: [UserRole.DESARROLLADOR],
        },
      ];

      // Act: Create groups programmatically
      groupConfigs.forEach((config) => {
        service.createGroup(config);
      });

      // Assert: Verify groups were created with correct configurations
      service.getGroupChanges().subscribe((groups) => {
        groupConfigs.forEach((expectedConfig) => {
          const actualGroup = groups.get(expectedConfig.groupId);

          expect(actualGroup).toBeDefined();
          expect(actualGroup?.title).toBe(expectedConfig.title);
          expect(actualGroup?.icon).toBe(expectedConfig.icon);
          expect(actualGroup?.priority).toBe(expectedConfig.priority);
          expect(actualGroup?.items).toEqual(expectedConfig.items);
          expect(actualGroup?.requiredRoles).toEqual(expectedConfig.requiredRoles);
        });
      });
    });

    it('should allow programmatic modification of existing configurations', () => {
      // Arrange: Create initial configuration
      const initialConfig: DynamicElementConfig = {
        itemId: 'test-element',
        icon: 'cil-initial',
        badge: { color: 'info', text: 'Initial' },
        priority: 50,
        visible: true,
      };

      service.configureElement(initialConfig);

      // Act: Modify configuration programmatically using different methods
      service.setIcon('test-element', 'cil-modified');
      service.setBadge('test-element', { color: 'success', text: 'Modified' });
      service.setPriority('test-element', 100);
      service.setRequiredRoles('test-element', [UserRole.EDITOR]);

      // Assert: Verify all modifications were applied
      const finalConfig = service.getElementConfig('test-element');

      expect(finalConfig?.icon).toBe('cil-modified');
      expect(finalConfig?.badge?.color).toBe('success');
      expect(finalConfig?.badge?.text).toBe('Modified');
      expect(finalConfig?.priority).toBe(100);
      expect(finalConfig?.requiredRoles).toEqual([UserRole.EDITOR]);
      expect(finalConfig?.visible).toBe(true); // Should remain unchanged
    });

    it('should allow programmatic addition and removal of contextual actions', () => {
      // Arrange: Define contextual actions
      const actions: IContextualAction[] = [
        {
          name: 'Edit',
          icon: 'cil-pencil',
          action: () => {},
          tooltip: 'Edit item',
        },
        {
          name: 'Delete',
          icon: 'cil-trash',
          action: () => {},
          tooltip: 'Delete item',
        },
        {
          name: 'Share',
          icon: 'cil-share',
          action: () => {},
          tooltip: 'Share item',
        },
      ];

      // Act: Add actions programmatically
      actions.forEach((action) => {
        service.addContextualAction('test-element', action);
      });

      // Assert: Verify actions were added
      let config = service.getElementConfig('test-element');
      expect(config?.contextualActions?.length).toBe(3);
      expect(config?.contextualActions?.map((a) => a.name)).toEqual(['Edit', 'Delete', 'Share']);

      // Act: Remove one action programmatically
      service.removeContextualAction('test-element', 'Delete');

      // Assert: Verify action was removed
      config = service.getElementConfig('test-element');
      expect(config?.contextualActions?.length).toBe(2);
      expect(config?.contextualActions?.map((a) => a.name)).toEqual(['Edit', 'Share']);
    });

    it('should maintain configuration consistency across multiple operations', () => {
      // Arrange: Perform multiple configuration operations
      const elementId = 'complex-element';

      // Act: Perform a series of programmatic configurations
      service.configureElement({
        itemId: elementId,
        icon: 'cil-start',
        priority: 10,
      });

      service.setBadge(elementId, { color: 'warning', text: 'Step 1' });
      service.addContextualAction(elementId, {
        name: 'Action1',
        icon: 'cil-1',
        action: () => {},
      });
      service.setPriority(elementId, 50);
      service.setBadge(elementId, { color: 'success', text: 'Step 2' });
      service.addContextualAction(elementId, {
        name: 'Action2',
        icon: 'cil-2',
        action: () => {},
      });
      service.setIcon(elementId, 'cil-end');

      // Assert: Verify final state is consistent and contains all expected changes
      const finalConfig = service.getElementConfig(elementId);

      expect(finalConfig?.icon).toBe('cil-end'); // Last icon change
      expect(finalConfig?.badge?.color).toBe('success'); // Last badge change
      expect(finalConfig?.badge?.text).toBe('Step 2'); // Last badge change
      expect(finalConfig?.priority).toBe(50); // Last priority change
      expect(finalConfig?.contextualActions?.length).toBe(2); // Both actions added
      expect(finalConfig?.contextualActions?.map((a) => a.name)).toEqual(['Action1', 'Action2']);
    });
  });
});
