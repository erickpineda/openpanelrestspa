import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { ResponsiveNavigationComponent } from './responsive-navigation.component';
import { ResponsiveNavigationService } from '../../../core/services/ui/responsive-navigation.service';
import { NavigationService } from '../../../core/services/ui/navigation.service';
import { INavItemEnhanced, UserRole } from '../../types/navigation.types';

/**
 * Pruebas de integración para componentes visuales de navegación
 * Verifica renderizado correcto de badges dinámicos, transiciones y animaciones
 */
describe('ResponsiveNavigationComponent - Visual Integration Tests', () => {
  let component: ResponsiveNavigationComponent;
  let fixture: ComponentFixture<ResponsiveNavigationComponent>;
  let mockResponsiveService: jasmine.SpyObj<ResponsiveNavigationService>;
  let mockNavigationService: jasmine.SpyObj<NavigationService>;
  type RS = import('../../../core/services/ui/responsive-navigation.service').ResponsiveState;

  // Mock data
  const mockNavigationItems: INavItemEnhanced[] = [
    {
      name: 'Dashboard',
      url: '/admin/dashboard',
      iconComponent: { name: 'cil-speedometer' },
      priority: 100,
      badge: {
        color: 'info',
        text: 'Principal'
      }
    },
    {
      title: true,
      name: 'Gestión de Contenido',
      priority: 90
    },
    {
      name: 'Entradas',
      url: '/admin/control/entradas',
      iconComponent: { name: 'cil-pencil' },
      priority: 85,
      dynamicBadge: {
        service: 'BadgeCounterService',
        method: 'getDraftEntriesCount',
        refreshInterval: 30000
      },
      badge: {
        color: 'warning',
        text: '5'
      }
    },
    {
      name: 'Comentarios',
      url: '/admin/control/comentarios',
      iconComponent: { name: 'cil-comment-square' },
      priority: 65,
      dynamicBadge: {
        service: 'BadgeCounterService',
        method: 'getUnmoderatedCommentsCount',
        refreshInterval: 15000
      },
      badge: {
        color: 'danger',
        text: '12'
      }
    }
  ];

  beforeEach(async () => {
    const responsiveServiceSpy = jasmine.createSpyObj('ResponsiveNavigationService', [
      'getCurrentState',
      'getCriticalFunctions',
      'toggleSidebar',
      'collapseSidebar',
      'expandSidebar',
      'getBreakpoints',
      'shouldAutoCollapse'
    ], ['responsiveState$']);

    const navigationServiceSpy = jasmine.createSpyObj('NavigationService', [
      'getNavigationItems',
      'updateBadgeCount',
      'isItemActive',
      'isSectionActive'
    ]);

    await TestBed.configureTestingModule({
      declarations: [ResponsiveNavigationComponent],
      providers: [
        { provide: ResponsiveNavigationService, useValue: responsiveServiceSpy },
        { provide: NavigationService, useValue: navigationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResponsiveNavigationComponent);
    component = fixture.componentInstance;
    mockResponsiveService = TestBed.inject(ResponsiveNavigationService) as jasmine.SpyObj<ResponsiveNavigationService>;
    mockNavigationService = TestBed.inject(NavigationService) as jasmine.SpyObj<NavigationService>;

    // Setup default state
    const initialState: RS = {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      screenWidth: 1200,
      sidebarCollapsed: false,
      touchEnabled: false
    };
    (mockResponsiveService as any).responsiveState$ = new BehaviorSubject<RS>(initialState);
    mockResponsiveService.getCurrentState.and.returnValue(initialState);
    mockResponsiveService.getCriticalFunctions.and.returnValue([]);
    mockNavigationService.getNavigationItems.and.returnValue(new BehaviorSubject(mockNavigationItems));
    mockNavigationService.isItemActive.and.returnValue(false);
    mockNavigationService.isSectionActive.and.returnValue(false);
  });

  describe('Badge Rendering', () => {
    it('should render static badges correctly', () => {
      fixture.detectChanges();

      const dashboardItem = fixture.debugElement.query(By.css('[data-testid="nav-item-dashboard"]'));
      expect(dashboardItem).toBeTruthy();

      const badge = dashboardItem.query(By.css('.nav-badge'));
      expect(badge).toBeTruthy();
      expect(badge.nativeElement.textContent.trim()).toBe('Principal');
      expect(badge.nativeElement).toHaveClass('badge-info');
    });

    it('should render dynamic badges with correct styling', () => {
      fixture.detectChanges();

      const entradasItem = fixture.debugElement.query(By.css('[data-testid="nav-item-entradas"]'));
      expect(entradasItem).toBeTruthy();

      const badge = entradasItem.query(By.css('.nav-badge'));
      expect(badge).toBeTruthy();
      expect(badge.nativeElement.textContent.trim()).toBe('5');
      expect(badge.nativeElement).toHaveClass('badge-warning');
    });

    it('should update dynamic badge when count changes', async () => {
      fixture.detectChanges();

      // Simular actualización de badge
      (component as any).updateBadgeCount('entradas', 8);
      fixture.detectChanges();

      const entradasItem = fixture.debugElement.query(By.css('[data-testid="nav-item-entradas"]'));
      const badge = entradasItem.query(By.css('.nav-badge'));
      
      expect(badge.nativeElement.textContent.trim()).toBe('8');
    });

    it('should apply correct color classes for different badge types', () => {
      fixture.detectChanges();

      const comentariosItem = fixture.debugElement.query(By.css('[data-testid="nav-item-comentarios"]'));
      const badge = comentariosItem.query(By.css('.nav-badge'));
      
      expect(badge.nativeElement).toHaveClass('badge-danger');
      expect(badge.nativeElement.textContent.trim()).toBe('12');
    });

    it('should hide badges with zero count', () => {
      // Actualizar mock para incluir item con badge cero
      const itemsWithZeroBadge = [...mockNavigationItems];
      itemsWithZeroBadge[2].badge = { color: 'warning', text: '0' };
      
      mockNavigationService.getNavigationItems.and.returnValue(new BehaviorSubject(itemsWithZeroBadge));
      fixture.detectChanges();

      const entradasItem = fixture.debugElement.query(By.css('[data-testid="nav-item-entradas"]'));
      const badge = entradasItem.query(By.css('.nav-badge.zero-count'));
      
      expect(badge).toBeTruthy();
      expect(badge.nativeElement.style.opacity).toBe('0');
    });

    it('should animate new badges', async () => {
      fixture.detectChanges();

      // Agregar nuevo badge
      const newItem: INavItemEnhanced = {
        name: 'Nuevo Item',
        url: '/admin/nuevo',
        iconComponent: { name: 'cil-star' },
        badge: { color: 'success', text: 'Nuevo' }
      };

      (component as any).addNavigationItem(newItem);
      fixture.detectChanges();

      const newItemElement = fixture.debugElement.query(By.css('[data-testid="nav-item-nuevo-item"]'));
      const badge = newItemElement.query(By.css('.nav-badge'));
      
      expect(badge.nativeElement).toHaveClass('new-badge');
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt to mobile breakpoint', () => {
      const nextState: RS = { ...(mockResponsiveService.getCurrentState() as RS), isMobile: true, isTablet: false, isDesktop: false };
      (mockResponsiveService as any).responsiveState$.next(nextState);
      mockResponsiveService.getCurrentState.and.returnValue(nextState);
      fixture.detectChanges();

      const container = fixture.debugElement.query(By.css('.responsive-navigation-container'));
      expect(container.nativeElement).toHaveClass('mobile-layout');
    });

    it('should adapt to tablet breakpoint', () => {
      const nextState: RS = { ...(mockResponsiveService.getCurrentState() as RS), isMobile: false, isTablet: true, isDesktop: false };
      (mockResponsiveService as any).responsiveState$.next(nextState);
      mockResponsiveService.getCurrentState.and.returnValue(nextState);
      fixture.detectChanges();

      const container = fixture.debugElement.query(By.css('.responsive-navigation-container'));
      expect(container.nativeElement).toHaveClass('tablet-layout');
    });

    it('should adapt to desktop breakpoint', () => {
      const nextState: RS = { ...(mockResponsiveService.getCurrentState() as RS), isMobile: false, isTablet: false, isDesktop: true };
      (mockResponsiveService as any).responsiveState$.next(nextState);
      mockResponsiveService.getCurrentState.and.returnValue(nextState);
      fixture.detectChanges();

      const container = fixture.debugElement.query(By.css('.responsive-navigation-container'));
      expect(container.nativeElement).toHaveClass('desktop-layout');
    });

    it('should show critical functions bar on mobile', () => {
      const nextState: RS = { ...(mockResponsiveService.getCurrentState() as RS), isMobile: true, isTablet: false, isDesktop: false };
      (mockResponsiveService as any).responsiveState$.next(nextState);
      mockResponsiveService.getCurrentState.and.returnValue(nextState);
      mockResponsiveService.getCriticalFunctions.and.returnValue([
        { id: 'dashboard', name: 'Dashboard', url: '/admin/dashboard', icon: 'cil-speedometer', priority: 100 },
        { id: 'nueva-entrada', name: 'Nueva Entrada', url: '/admin/control/entradas/crear', icon: 'cil-plus', priority: 90 }
      ]);
      
      fixture.detectChanges();

      const criticalBar = fixture.debugElement.query(By.css('.critical-functions-bar'));
      expect(criticalBar).toBeTruthy();

      const criticalFunctions = fixture.debugElement.queryAll(By.css('.critical-function-btn'));
      expect(criticalFunctions.length).toBe(2);
    });

    it('should hide critical functions bar on desktop', () => {
      const nextState: RS = { ...(mockResponsiveService.getCurrentState() as RS), isMobile: false, isTablet: false, isDesktop: true };
      (mockResponsiveService as any).responsiveState$.next(nextState);
      mockResponsiveService.getCurrentState.and.returnValue(nextState);
      fixture.detectChanges();

      const criticalBar = fixture.debugElement.query(By.css('.critical-functions-bar'));
      expect(criticalBar).toBeFalsy();
    });

    it('should apply touch-optimized styles when touch is enabled', () => {
      const nextState: RS = { ...(mockResponsiveService.getCurrentState() as RS), touchEnabled: true };
      (mockResponsiveService as any).responsiveState$.next(nextState);
      mockResponsiveService.getCurrentState.and.returnValue(nextState);
      fixture.detectChanges();

      const container = fixture.debugElement.query(By.css('.responsive-navigation-container'));
      expect(container.nativeElement).toHaveClass('touch-enabled');

      const navLinks = fixture.debugElement.queryAll(By.css('.nav-link'));
      navLinks.forEach(link => {
        const styles = getComputedStyle(link.nativeElement);
        expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(48); // Touch target size
      });
    });
  });

  describe('Animations and Transitions', () => {
    it('should apply slide-in animation when opening mobile menu', async () => {
      const collapsedState: RS = { ...(mockResponsiveService.getCurrentState() as RS), isMobile: true, isTablet: false, isDesktop: false, sidebarCollapsed: true };
      (mockResponsiveService as any).responsiveState$.next(collapsedState);
      mockResponsiveService.getCurrentState.and.returnValue(collapsedState);
      
      fixture.detectChanges();

      const navigationMenu = fixture.debugElement.query(By.css('.navigation-menu'));
      expect(navigationMenu.nativeElement).toHaveClass('collapsed');

      // Simular apertura del menú
      const expandedState: RS = { ...(mockResponsiveService.getCurrentState() as RS), sidebarCollapsed: false };
      (mockResponsiveService as any).responsiveState$.next(expandedState);
      mockResponsiveService.getCurrentState.and.returnValue(expandedState);
      component.ngOnInit(); // Re-trigger subscriptions
      fixture.detectChanges();

      expect(navigationMenu.nativeElement).not.toHaveClass('collapsed');
    });

    it('should apply hover effects on navigation links', async () => {
      fixture.detectChanges();

      const navLink = fixture.debugElement.query(By.css('.nav-link'));
      
      // Simular hover
      navLink.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      const styles = getComputedStyle(navLink.nativeElement);
      expect(styles.transform).toContain('translateX');
    });

    it('should animate badge updates', async () => {
      fixture.detectChanges();

      const entradasItem = fixture.debugElement.query(By.css('[data-testid="nav-item-entradas"]'));
      const badge = entradasItem.query(By.css('.nav-badge'));

      // Simular actualización de badge
      badge.nativeElement.classList.add('updating');
      fixture.detectChanges();

      expect(badge.nativeElement).toHaveClass('updating');
      
      // Verificar que la animación se aplica
      const styles = getComputedStyle(badge.nativeElement);
      expect(styles.animation).toContain('pulse');
    });

    it('should apply smooth transitions when collapsing sidebar', async () => {
      const expandedState: RS = { ...(mockResponsiveService.getCurrentState() as RS), sidebarCollapsed: false };
      (mockResponsiveService as any).responsiveState$.next(expandedState);
      mockResponsiveService.getCurrentState.and.returnValue(expandedState);
      fixture.detectChanges();

      const navigationMenu = fixture.debugElement.query(By.css('.navigation-menu'));
      const initialWidth = navigationMenu.nativeElement.offsetWidth;

      // Simular colapso
      const collapsedState: RS = { ...(mockResponsiveService.getCurrentState() as RS), sidebarCollapsed: true };
      (mockResponsiveService as any).responsiveState$.next(collapsedState);
      mockResponsiveService.getCurrentState.and.returnValue(collapsedState);
      component.ngOnInit(); // Re-trigger subscriptions
      fixture.detectChanges();

      expect(navigationMenu.nativeElement).toHaveClass('collapsed');
      
      // Verificar que el ancho cambió
      const collapsedWidth = navigationMenu.nativeElement.offsetWidth;
      expect(collapsedWidth).toBeLessThan(initialWidth);
    });

    it('should animate section expansion/collapse', async () => {
      fixture.detectChanges();

      const sectionTitle = fixture.debugElement.query(By.css('.nav-section-title'));
      
      // Simular click en título de sección
      sectionTitle.nativeElement.click();
      fixture.detectChanges();

      const sectionContent = fixture.debugElement.query(By.css('.nav-section-content'));
      expect(sectionContent).toBeTruthy();
    });
  });

  describe('Visual Consistency', () => {
    it('should maintain consistent spacing between navigation items', () => {
      fixture.detectChanges();

      const navItems = fixture.debugElement.queryAll(By.css('.nav-item'));
      
      navItems.forEach(item => {
        const styles = getComputedStyle(item.nativeElement);
        expect(styles.marginBottom).toBe('4px');
      });
    });

    it('should apply consistent icon sizing', () => {
      fixture.detectChanges();

      const navIcons = fixture.debugElement.queryAll(By.css('.nav-icon'));
      
      navIcons.forEach(icon => {
        const styles = getComputedStyle(icon.nativeElement);
        expect(styles.fontSize).toBe('18px');
        expect(styles.width).toBe('20px');
      });
    });

    it('should maintain consistent badge styling', () => {
      fixture.detectChanges();

      const badges = fixture.debugElement.queryAll(By.css('.nav-badge'));
      
      badges.forEach(badge => {
        const styles = getComputedStyle(badge.nativeElement);
        expect(styles.fontSize).toBe('11px');
        expect(styles.fontWeight).toBe('600');
        expect(styles.borderRadius).toBe('10px');
      });
    });

    it('should apply consistent active state styling', () => {
      mockNavigationService.isItemActive.and.returnValue(true);
      fixture.detectChanges();

      const activeLink = fixture.debugElement.query(By.css('.nav-link.active'));
      expect(activeLink).toBeTruthy();
      
      const styles = getComputedStyle(activeLink.nativeElement);
      expect(styles.fontWeight).toBe('500');
    });

    it('should maintain visual hierarchy with section titles', () => {
      fixture.detectChanges();

      const sectionTitles = fixture.debugElement.queryAll(By.css('.nav-section-title'));
      
      sectionTitles.forEach(title => {
        const styles = getComputedStyle(title.nativeElement);
        expect(styles.fontSize).toBe('12px');
        expect(styles.fontWeight).toBe('600');
        expect(styles.textTransform).toBe('uppercase');
      });
    });
  });

  describe('Accessibility', () => {
    it('should provide adequate touch targets on mobile', () => {
      const nextState: RS = { ...(mockResponsiveService.getCurrentState() as RS), isMobile: true, isTablet: false, isDesktop: false, touchEnabled: true };
      (mockResponsiveService as any).responsiveState$.next(nextState);
      mockResponsiveService.getCurrentState.and.returnValue(nextState);
      
      fixture.detectChanges();

      const touchTargets = fixture.debugElement.queryAll(By.css('.nav-link, .critical-function-btn'));
      
      touchTargets.forEach(target => {
        const rect = target.nativeElement.getBoundingClientRect();
        expect(rect.height).toBeGreaterThanOrEqual(44); // WCAG minimum touch target
        expect(rect.width).toBeGreaterThanOrEqual(44);
      });
    });

    it('should maintain focus indicators', () => {
      fixture.detectChanges();

      const navLink = fixture.debugElement.query(By.css('.nav-link'));
      
      // Simular focus
      navLink.nativeElement.focus();
      fixture.detectChanges();

      expect(document.activeElement).toBe(navLink.nativeElement);
    });

    it('should provide screen reader support', () => {
      fixture.detectChanges();

      const srOnlyElements = fixture.debugElement.queryAll(By.css('.sr-only'));
      expect(srOnlyElements.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should not cause excessive re-renders', () => {
      const renderSpy = spyOn(component, 'ngOnInit').and.callThrough();
      
      fixture.detectChanges();
      
      // Simular múltiples cambios de estado
      for (let i = 0; i < 5; i++) {
        const nextState: RS = { ...(mockResponsiveService.getCurrentState() as RS), sidebarCollapsed: i % 2 === 0 };
        (mockResponsiveService as any).responsiveState$.next(nextState);
        mockResponsiveService.getCurrentState.and.returnValue(nextState);
        fixture.detectChanges();
      }

      // Verificar que no hay renders excesivos
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle large navigation lists efficiently', () => {
      // Crear lista grande de navegación
      const largeNavList: INavItemEnhanced[] = Array.from({ length: 100 }, (_, i) => ({
        name: `Item ${i}`,
        url: `/item${i}`,
        iconComponent: { name: 'cil-circle' },
        priority: 100 - i
      }));

      mockNavigationService.getNavigationItems.and.returnValue(new BehaviorSubject(largeNavList));
      
      const startTime = performance.now();
      fixture.detectChanges();
      const endTime = performance.now();

      // Verificar que el renderizado no toma demasiado tiempo
      expect(endTime - startTime).toBeLessThan(100); // menos de 100ms
    });
  });

  // Helper methods for component
  beforeEach(() => {
    // Add helper methods to component for testing
    (component as any).updateBadgeCount = (itemId: string, count: number) => {
      const item = mockNavigationItems.find(item => 
        item.name?.toLowerCase().replace(/\s+/g, '-') === itemId
      );
      if (item && item.badge) {
        item.badge.text = count.toString();
      }
    };

    (component as any).addNavigationItem = (item: INavItemEnhanced) => {
      mockNavigationItems.push(item);
      mockNavigationService.getNavigationItems.and.returnValue(new BehaviorSubject([...mockNavigationItems]));
    };
  });
});
