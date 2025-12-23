import { NavigationUtils } from './navigation.utils';
import { UserRole, INavItemEnhanced } from '../types/navigation.types';

describe('NavigationUtils', () => {
  it('hasPermission devuelve false y avisa si no existe la funcionalidad', () => {
    const warnSpy = spyOn(console, 'warn');

    const result = NavigationUtils.hasPermission(
      UserRole.ADMINISTRADOR,
      'MISSING',
      {},
    );

    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('hasPermission consulta la matriz cuando existe la funcionalidad', () => {
    const matrix: any = {
      F1: {
        [UserRole.LECTOR]: false,
        [UserRole.ADMINISTRADOR]: true,
      },
    };

    expect(
      NavigationUtils.hasPermission(UserRole.ADMINISTRADOR, 'F1', matrix),
    ).toBe(true);
    expect(NavigationUtils.hasPermission(UserRole.LECTOR, 'F1', matrix)).toBe(
      false,
    );
  });

  it('filterByPermissions respeta requiredRoles, minRole y children', () => {
    const items: INavItemEnhanced[] = [
      {
        name: 'A',
        url: '/a',
        requiredRoles: [UserRole.ADMINISTRADOR],
      },
      {
        name: 'B',
        url: '/b',
        minRole: UserRole.EDITOR,
      },
      {
        name: 'C',
        url: '/c',
        children: [
          {
            name: 'C1',
            url: '/c/1',
            requiredRoles: [UserRole.ADMINISTRADOR],
          },
          {
            name: 'C2',
            url: '/c/2',
          },
        ],
      },
    ];

    const asEditor = NavigationUtils.filterByPermissions(
      items,
      UserRole.EDITOR,
    );
    expect(asEditor.some((i) => i.url === '/a')).toBe(false);
    expect(asEditor.some((i) => i.url === '/b')).toBe(true);
    const c = asEditor.find((i) => i.url === '/c')!;
    expect(c.children?.length).toBe(1);
    expect(c.children?.[0].url).toBe('/c/2');
  });

  it('hasMinimumRole aplica jerarquía', () => {
    expect(
      NavigationUtils.hasMinimumRole(UserRole.ADMINISTRADOR, UserRole.LECTOR),
    ).toBe(true);
    expect(
      NavigationUtils.hasMinimumRole(UserRole.LECTOR, UserRole.ADMINISTRADOR),
    ).toBe(false);
  });

  it('sortByPriority ordena por prioridad descendente', () => {
    const items: INavItemEnhanced[] = [
      { name: 'x', url: '/x', priority: 1 },
      { name: 'y', url: '/y' },
      { name: 'z', url: '/z', priority: 10 },
    ];

    const sorted = NavigationUtils.sortByPriority(items);
    expect(sorted.map((i) => i.url)).toEqual(['/z', '/x', '/y']);
  });

  it('removeDuplicatesByUrl elimina duplicados y conserva items sin url', () => {
    const items: INavItemEnhanced[] = [
      { name: 't', title: true },
      { name: 'a', url: '/a' },
      { name: 'a2', url: '/a' },
      { name: 't2', title: true },
    ];

    const filtered = NavigationUtils.removeDuplicatesByUrl(items);
    expect(filtered.length).toBe(3);
    expect(filtered.filter((i) => i.url === '/a').length).toBe(1);
  });

  it('findItemsWithDynamicBadges recorre recursivamente', () => {
    const items: INavItemEnhanced[] = [
      {
        name: 'a',
        url: '/a',
        dynamicBadge: { counterId: 'x' } as any,
      },
      {
        name: 'b',
        url: '/b',
        children: [
          {
            name: 'b1',
            url: '/b/1',
            dynamicBadge: { counterId: 'y' } as any,
          },
        ],
      },
    ];

    const found = NavigationUtils.findItemsWithDynamicBadges(items);
    expect(found.map((i) => i.url)).toEqual(['/a', '/b/1']);
  });

  it('parseUserRole mapea códigos y usa ANONYMOUS como fallback', () => {
    expect(NavigationUtils.parseUserRole('ADMIN')).toBe(UserRole.ADMINISTRADOR);
    expect(NavigationUtils.parseUserRole('NOPE')).toBe(UserRole.ANONYMOUS);
  });

  it('generateItemId usa url, name o un fallback aleatorio', () => {
    expect(NavigationUtils.generateItemId({ name: 'n', url: '/A B' })).toBe(
      '-a-b',
    );

    expect(NavigationUtils.generateItemId({ name: 'Hola Mundo' })).toBe(
      'hola-mundo',
    );

    spyOn(Math, 'random').and.returnValue(0.1);
    const id = NavigationUtils.generateItemId({} as any);
    expect(id.startsWith('nav-item-')).toBe(true);
  });

  it('isItemActive evalúa coincidencia exacta, prefijo y children', () => {
    expect(NavigationUtils.isItemActive({ url: '/x' } as any, '/x')).toBe(true);
    expect(NavigationUtils.isItemActive({ url: '/x' } as any, '/x/1')).toBe(
      true,
    );
    expect(NavigationUtils.isItemActive({} as any, '/x')).toBe(false);

    const item: INavItemEnhanced = {
      name: 'p',
      url: '/p',
      children: [{ name: 'c', url: '/p/c' }],
    };
    expect(NavigationUtils.isItemActive(item, '/p/c')).toBe(true);
  });

  it('applyResponsiveConfig oculta en móvil cuando corresponde', () => {
    const items: INavItemEnhanced[] = [
      {
        name: 'a',
        url: '/a',
        responsiveConfig: { hideOnMobile: true },
      } as any,
      {
        name: 'b',
        url: '/b',
        responsiveConfig: { collapseThreshold: 1000 },
      } as any,
    ];

    const mobile = NavigationUtils.applyResponsiveConfig(items, 500);
    expect(mobile.map((i) => i.url)).toEqual(['/b']);

    const desktop = NavigationUtils.applyResponsiveConfig(items, 1200);
    expect(desktop.length).toBe(2);
  });

  it('validateNavigationDepth valida el máximo de niveles', () => {
    const valid: INavItemEnhanced[] = [
      {
        name: 'a',
        children: [{ name: 'b', children: [] }],
      } as any,
    ];
    expect(NavigationUtils.validateNavigationDepth(valid)).toBe(true);

    const invalid: INavItemEnhanced[] = [
      {
        name: 'a',
        children: [
          {
            name: 'b',
            children: [{ name: 'c', children: [] }],
          },
        ],
      } as any,
    ];
    expect(NavigationUtils.validateNavigationDepth(invalid)).toBe(false);
  });
});
