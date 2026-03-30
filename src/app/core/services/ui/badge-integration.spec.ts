import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { BadgeCounterService } from './badge-counter.service';
import { NavigationService } from './navigation.service';
import { EntradaService } from '../data/entrada.service';
import { ComentarioService } from '../data/comentario.service';
import { UsuarioService } from '../data/usuario.service';
import { TemporaryStorageService } from './temporary-storage.service';
import { SidebarStateService } from './sidebar-state.service';
import { ActiveSectionService } from './active-section.service';
import { ProgrammaticNavigationConfigService } from './programmatic-navigation-config.service';
import { NavigationPerformanceService } from './navigation-performance.service';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { INavItemEnhanced } from '../../../shared/types/navigation.types';

describe('BadgeCounter & Navigation Integration', () => {
  let badgeService: BadgeCounterService;
  let navigationService: NavigationService;
  let tempStorageSpy: jasmine.SpyObj<TemporaryStorageService>;

  const mockNavItems: INavItemEnhanced[] = [
    {
      name: 'Drafts',
      url: '/admin/drafts',
      dynamicBadge: {
        service: 'BadgeCounterService',
        method: 'getDraftEntriesCount',
        refreshInterval: 1000,
      },
    },
  ];

  beforeEach(() => {
    (globalThis as any).__ENABLE_BADGE_COUNTERS_IN_TEST__ = true;

    const entradaSpy = jasmine.createSpyObj('EntradaService', ['listarSafe']);
    const comentarioSpy = jasmine.createSpyObj('ComentarioService', [
      'listarSafe',
      'listarSafeSinGlobalLoader',
    ]);
    const usuarioSpy = jasmine.createSpyObj('UsuarioService', [
      'listarSafe',
      'obtenerDatosSesionActualSafe',
      'listarSafeSinGlobalLoader',
    ]);
    const tempSpy = jasmine.createSpyObj('TemporaryStorageService', ['getTemporaryEntriesByType']);

    // Mock entriesChanged$
    // Use simple object property assignment for spy
    (tempSpy as any).entriesChanged$ = new Subject<void>();
    tempSpy.getTemporaryEntriesByType.and.returnValue([
      { id: '1', formType: 'entrada', formData: {}, timestamp: '' },
      { id: '2', formType: 'entrada', formData: {}, timestamp: '' },
    ] as any);

    // Mock Router
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.events = of(null);
    routerSpy.url = '/admin/drafts';

    // Mock other services
    const sidebarSpy = jasmine.createSpyObj('SidebarStateService', [
      'updateNavItems',
      'toggleItem',
    ]);
    const activeSectionSpy = jasmine.createSpyObj('ActiveSectionService', [
      'setNavigationItems',
      'updateActiveSection',
      'getCurrentActiveState',
    ]);
    const progConfigSpy = jasmine.createSpyObj('ProgrammaticNavigationConfigService', [
      'getConfigurationChanges',
      'applyDynamicConfigurations',
    ]);
    const perfSpy = jasmine.createSpyObj('NavigationPerformanceService', [
      'getOptimizedNavigationItems',
      'optimizeBadgeUpdates',
      'configurePerformance',
    ]);

    // Setup default returns
    entradaSpy.listarSafe.and.returnValue(of([]));
    comentarioSpy.listarSafe.and.returnValue(of([]));
    comentarioSpy.listarSafeSinGlobalLoader.and.returnValue(of([]));
    usuarioSpy.listarSafe.and.returnValue(of([]));
    usuarioSpy.obtenerDatosSesionActualSafe.and.returnValue(of({ username: 'test' }));

    activeSectionSpy.activeSection$ = of({});
    activeSectionSpy.menuExpansion$ = of({});
    activeSectionSpy.navigationContext$ = of({});
    progConfigSpy.getConfigurationChanges.and.returnValue(of({}));
    progConfigSpy.applyDynamicConfigurations.and.callFake((items: any) => items);
    perfSpy.getOptimizedNavigationItems.and.callFake((items: any) => of(items));
    perfSpy.optimizeBadgeUpdates.and.callFake((counts: any) => counts);

    TestBed.configureTestingModule({
      providers: [
        BadgeCounterService,
        NavigationService,
        { provide: EntradaService, useValue: entradaSpy },
        { provide: ComentarioService, useValue: comentarioSpy },
        { provide: UsuarioService, useValue: usuarioSpy },
        { provide: TemporaryStorageService, useValue: tempSpy },
        { provide: Router, useValue: routerSpy },
        { provide: SidebarStateService, useValue: sidebarSpy },
        { provide: ActiveSectionService, useValue: activeSectionSpy },
        { provide: ProgrammaticNavigationConfigService, useValue: progConfigSpy },
        { provide: NavigationPerformanceService, useValue: perfSpy },
      ],
    });

    badgeService = TestBed.inject(BadgeCounterService);
    navigationService = TestBed.inject(NavigationService);
    badgeService.initializeCounters();
    tempStorageSpy = TestBed.inject(
      TemporaryStorageService
    ) as jasmine.SpyObj<TemporaryStorageService>;
  });

  afterEach(() => {
    delete (globalThis as any).__ENABLE_BADGE_COUNTERS_IN_TEST__;
  });

  it('should call getTemporaryEntriesByType and update navigation item badge', fakeAsync(() => {
    navigationService.setNavigationItems(mockNavItems);
    tick(0);

    // Verify TemporaryStorageService was called
    expect(tempStorageSpy.getTemporaryEntriesByType).toHaveBeenCalledWith('entrada');

    badgeService.setCounterValue('draft-entries', 2);

    let updatedItems: INavItemEnhanced[] = [];
    navigationService.getNavigationItems('ADMIN' as any).subscribe((items) => {
      updatedItems = items;
    });

    tick(0);

    console.log('Updated Item Badge:', updatedItems[0].badge);
    expect(updatedItems.length).toBe(1);
    expect(updatedItems[0].badge).toBeDefined();
    expect(updatedItems[0].badge?.text).toBe('2');

    discardPeriodicTasks();
  }));
});
