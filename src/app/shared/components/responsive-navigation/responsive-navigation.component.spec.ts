import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { ResponsiveNavigationComponent } from './responsive-navigation.component';
import {
  ResponsiveNavigationService,
  ResponsiveState,
} from '../../../core/services/ui/responsive-navigation.service';
import { NavigationService } from '../../../core/services/ui/navigation.service';
import { INavItemEnhanced, UserRole } from '../../types/navigation.types';

describe('ResponsiveNavigationComponent', () => {
  let component: ResponsiveNavigationComponent;
  let fixture: ComponentFixture<ResponsiveNavigationComponent>;
  let mockResponsiveNavigationService: jasmine.SpyObj<ResponsiveNavigationService>;
  let mockNavigationService: jasmine.SpyObj<NavigationService>;
  let responsiveStateSubject: BehaviorSubject<ResponsiveState>;

  const mockResponsiveState: ResponsiveState = {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1200,
    sidebarCollapsed: false,
    touchEnabled: false,
  };

  const mockNavItems: INavItemEnhanced[] = [
    {
      name: 'Dashboard',
      url: '/admin/dashboard',
      iconComponent: { name: 'cil-speedometer' },
      priority: 100,
      requiredRoles: [UserRole.ADMINISTRADOR],
    },
    {
      title: true,
      name: 'Content Management',
      priority: 90,
    },
    {
      name: 'Entries',
      url: '/admin/entries',
      iconComponent: { name: 'cil-pencil' },
      priority: 85,
      requiredRoles: [UserRole.AUTOR],
      children: [
        {
          name: 'New Entry',
          url: '/admin/entries/new',
          icon: 'cil-plus',
          priority: 100,
          requiredRoles: [UserRole.AUTOR],
        },
      ],
    },
  ];

  beforeEach(async () => {
    responsiveStateSubject = new BehaviorSubject<ResponsiveState>(mockResponsiveState);

    const responsiveNavSpy = jasmine.createSpyObj(
      'ResponsiveNavigationService',
      [
        'toggleSidebar',
        'collapseSidebar',
        'expandSidebar',
        'getCurrentState',
        'adaptNavigationItems',
        'getCriticalFunctions',
      ],
      {
        responsiveState$: responsiveStateSubject.asObservable(),
      }
    );

    const navSpy = jasmine.createSpyObj('NavigationService', ['getNavigationItems']);

    responsiveNavSpy.getCurrentState.and.returnValue(mockResponsiveState);
    responsiveNavSpy.adaptNavigationItems.and.returnValue(mockNavItems);
    responsiveNavSpy.getCriticalFunctions.and.returnValue([
      {
        id: 'dashboard',
        name: 'Dashboard',
        url: '/admin/dashboard',
        icon: 'cil-speedometer',
        priority: 100,
      },
    ]);
    navSpy.getNavigationItems.and.returnValue(of(mockNavItems));

    await TestBed.configureTestingModule({
      declarations: [ResponsiveNavigationComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: ResponsiveNavigationService, useValue: responsiveNavSpy },
        { provide: NavigationService, useValue: navSpy },
      ],
    }).compileComponents();

    mockResponsiveNavigationService = TestBed.inject(
      ResponsiveNavigationService
    ) as jasmine.SpyObj<ResponsiveNavigationService>;
    mockNavigationService = TestBed.inject(NavigationService) as jasmine.SpyObj<NavigationService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponsiveNavigationComponent);
    component = fixture.componentInstance;
    component.userRole = UserRole.ADMINISTRADOR;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.userRole).toBe(UserRole.ADMINISTRADOR);
      expect(component.navigationItems).toEqual(mockNavItems);
      expect(component.adaptedNavigationItems).toBeDefined();
      expect(component.criticalFunctions).toBeDefined();
    });

    it('should subscribe to responsive state changes', (done) => {
      expect(component.responsiveState$).toBeDefined();

      component.responsiveState$.pipe(take(1)).subscribe((state) => {
        expect(state).toEqual(mockResponsiveState);
        done();
      });
    });

    it('should load navigation items on init', () => {
      expect(mockNavigationService.getNavigationItems).toHaveBeenCalledWith(UserRole.ADMINISTRADOR);
    });
  });

  describe('Sidebar Controls', () => {
    it('should toggle sidebar', () => {
      component.toggleSidebar();

      expect(mockResponsiveNavigationService.toggleSidebar).toHaveBeenCalled();
    });

    it('should collapse sidebar', () => {
      component.collapseSidebar();

      expect(mockResponsiveNavigationService.collapseSidebar).toHaveBeenCalled();
    });

    it('should expand sidebar', () => {
      component.expandSidebar();

      expect(mockResponsiveNavigationService.expandSidebar).toHaveBeenCalled();
    });

    it('should emit sidebar toggle event', () => {
      spyOn(component.sidebarToggle, 'emit');

      component.toggleSidebar();

      expect(component.sidebarToggle.emit).toHaveBeenCalledWith(
        mockResponsiveState.sidebarCollapsed
      );
    });
  });

  describe('Navigation Item Handling', () => {
    it('should handle navigation item click', () => {
      spyOn(component.navigationItemClick, 'emit');
      const testItem = mockNavItems[0];

      component.onNavigationItemClick(testItem);

      expect(component.navigationItemClick.emit).toHaveBeenCalledWith(testItem);
    });

    it('should auto-collapse on mobile after navigation', () => {
      const mobileState: ResponsiveState = {
        ...mockResponsiveState,
        isMobile: true,
        sidebarCollapsed: false,
      };

      mockResponsiveNavigationService.getCurrentState.and.returnValue(mobileState);

      component.onNavigationItemClick(mockNavItems[0]);

      expect(mockResponsiveNavigationService.toggleSidebar).toHaveBeenCalled();
    });

    it('should not auto-collapse on desktop after navigation', () => {
      component.onNavigationItemClick(mockNavItems[0]);

      expect(mockResponsiveNavigationService.toggleSidebar).not.toHaveBeenCalled();
    });
  });

  describe('Item Visibility Logic', () => {
    it('should show all items on desktop', () => {
      const desktopState: ResponsiveState = {
        ...mockResponsiveState,
        isDesktop: true,
      };

      mockNavItems.forEach((item) => {
        const shouldShow = component.shouldShowItem(item, desktopState);
        expect(shouldShow).toBe(true);
      });
    });

    it('should show only critical functions and titles on mobile', () => {
      const mobileState: ResponsiveState = {
        ...mockResponsiveState,
        isMobile: true,
        isDesktop: false,
      };

      const titleItem = mockNavItems.find((item) => item.title);
      const dashboardItem = mockNavItems.find((item) => item.name === 'Dashboard');
      const entriesItem = mockNavItems.find((item) => item.name === 'Entries');

      expect(component.shouldShowItem(titleItem!, mobileState)).toBe(true);
      expect(component.shouldShowItem(dashboardItem!, mobileState)).toBe(true);
      expect(component.shouldShowItem(entriesItem!, mobileState)).toBe(false); // Not a critical function
    });

    it('should hide items with hideOnMobile config on mobile', () => {
      const mobileState: ResponsiveState = {
        ...mockResponsiveState,
        isMobile: true,
        isDesktop: false,
      };

      const itemWithHideConfig: INavItemEnhanced = {
        name: 'Advanced Settings',
        url: '/admin/advanced',
        iconComponent: { name: 'cil-settings' },
        responsiveConfig: {
          hideOnMobile: true,
        },
      };

      expect(component.shouldShowItem(itemWithHideConfig, mobileState)).toBe(false);
    });
  });

  describe('CSS Classes Generation', () => {
    it('should generate correct navigation classes for desktop', () => {
      const desktopState: ResponsiveState = {
        ...mockResponsiveState,
        isDesktop: true,
        sidebarCollapsed: false,
        touchEnabled: false,
      };

      const classes = component.getNavigationClasses(desktopState);

      expect(classes).toContain('responsive-navigation');
      expect(classes).toContain('desktop-layout');
      expect(classes).not.toContain('collapsed');
      expect(classes).not.toContain('touch-enabled');
    });

    it('should generate correct navigation classes for mobile', () => {
      const mobileState: ResponsiveState = {
        ...mockResponsiveState,
        isMobile: true,
        isDesktop: false,
        sidebarCollapsed: true,
        touchEnabled: true,
      };

      const classes = component.getNavigationClasses(mobileState);

      expect(classes).toContain('responsive-navigation');
      expect(classes).toContain('mobile-layout');
      expect(classes).toContain('collapsed');
      expect(classes).toContain('touch-enabled');
    });

    it('should generate correct item classes', () => {
      const testItem = mockNavItems[0]; // Dashboard
      const touchState: ResponsiveState = {
        ...mockResponsiveState,
        touchEnabled: true,
      };

      const classes = component.getItemClasses(testItem, touchState);

      expect(classes).toContain('nav-item');
      expect(classes).toContain('critical-function');
      expect(classes).toContain('touch-optimized');
    });

    it('should generate correct classes for title items', () => {
      const titleItem = mockNavItems.find((item) => item.title)!;
      const classes = component.getItemClasses(titleItem, mockResponsiveState);

      expect(classes).toContain('nav-item');
      expect(classes).toContain('nav-title');
    });

    it('should generate correct classes for items with children', () => {
      const itemWithChildren = mockNavItems.find(
        (item) => item.children && item.children.length > 0
      )!;
      const classes = component.getItemClasses(itemWithChildren, mockResponsiveState);

      expect(classes).toContain('nav-item');
      expect(classes).toContain('has-children');
    });
  });

  describe('Toggle Button Logic', () => {
    it('should show toggle button on mobile', () => {
      const mobileState: ResponsiveState = {
        ...mockResponsiveState,
        isMobile: true,
        isDesktop: false,
      };

      expect(component.shouldShowToggleButton(mobileState)).toBe(true);
    });

    it('should show toggle button on tablet', () => {
      const tabletState: ResponsiveState = {
        ...mockResponsiveState,
        isTablet: true,
        isDesktop: false,
      };

      expect(component.shouldShowToggleButton(tabletState)).toBe(true);
    });

    it('should not show toggle button on desktop', () => {
      const desktopState: ResponsiveState = {
        ...mockResponsiveState,
        isDesktop: true,
      };

      expect(component.shouldShowToggleButton(desktopState)).toBe(false);
    });

    it('should generate correct toggle button text for mobile', () => {
      const mobileCollapsed: ResponsiveState = {
        ...mockResponsiveState,
        isMobile: true,
        sidebarCollapsed: true,
      };

      const mobileExpanded: ResponsiveState = {
        ...mockResponsiveState,
        isMobile: true,
        sidebarCollapsed: false,
      };

      expect(component.getToggleButtonText(mobileCollapsed)).toBe('Mostrar menú');
      expect(component.getToggleButtonText(mobileExpanded)).toBe('Ocultar menú');
    });

    it('should generate correct toggle button text for desktop', () => {
      const desktopCollapsed: ResponsiveState = {
        ...mockResponsiveState,
        isDesktop: true,
        sidebarCollapsed: true,
      };

      const desktopExpanded: ResponsiveState = {
        ...mockResponsiveState,
        isDesktop: true,
        sidebarCollapsed: false,
      };

      expect(component.getToggleButtonText(desktopCollapsed)).toBe('Expandir sidebar');
      expect(component.getToggleButtonText(desktopExpanded)).toBe('Colapsar sidebar');
    });
  });

  describe('TrackBy Function', () => {
    it('should return item URL as track key when available', () => {
      const item = mockNavItems[0];
      const trackKey = component.trackByNavItem(0, item);

      expect(trackKey).toBe(item.url as string);
    });

    it('should return item name when URL is not available', () => {
      const item: INavItemEnhanced = {
        name: 'Test Item',
        iconComponent: { name: 'cil-test' },
      };

      const trackKey = component.trackByNavItem(0, item);

      expect(trackKey).toBe(item.name as string);
    });

    it('should return index as string when neither URL nor name is available', () => {
      const item: INavItemEnhanced = {
        title: true,
      };

      const trackKey = component.trackByNavItem(5, item);

      expect(trackKey).toBe('5');
    });
  });

  describe('Responsive State Changes', () => {
    it('should adapt navigation when responsive state changes', () => {
      const newState: ResponsiveState = {
        ...mockResponsiveState,
        isMobile: true,
        isDesktop: false,
      };

      responsiveStateSubject.next(newState);

      expect(mockResponsiveNavigationService.adaptNavigationItems).toHaveBeenCalledWith(
        component.navigationItems,
        newState
      );
    });

    it('should adapt navigation when navigation items change', () => {
      const newItems: INavItemEnhanced[] = [
        {
          name: 'New Item',
          url: '/admin/new',
          iconComponent: { name: 'cil-new' },
        },
      ];

      mockNavigationService.getNavigationItems.and.returnValue(of(newItems));

      // Trigger ngOnInit again
      component.ngOnInit();

      expect(mockResponsiveNavigationService.adaptNavigationItems).toHaveBeenCalledWith(
        newItems,
        mockResponsiveState
      );
    });
  });
});
