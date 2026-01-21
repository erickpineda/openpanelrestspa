import { SidebarStateService } from './sidebar-state.service';
import { navItems } from '../../../admin/default-layout/_nav';

describe('SidebarStateService', () => {
  let service: SidebarStateService;

  beforeEach(() => {
    service = new SidebarStateService();
    try {
      localStorage.removeItem('sidebar_expanded_items');
    } catch {}
  });

  it('debe expandir Entradas por defecto en primer render', () => {
    const items = JSON.parse(JSON.stringify(navItems));
    service.updateNavItems(items as any, '/admin/dashboard');
    const entradas = items.find((i: any) => i.name === 'MENU.ENTRIES') as any;
    expect(entradas.open).toBeTrue();
  });

  it('debe mantener abierto Entradas al navegar a Todas las Entradas', () => {
    const items = JSON.parse(JSON.stringify(navItems));
    service.updateNavItems(items as any, '/admin/control/entradas');
    const entradas = items.find((i: any) => i.name === 'MENU.ENTRIES') as any;
    expect(entradas.open).toBeTrue();
  });

  it('debe mantener abierto Taxonomía al navegar a Categorías', () => {
    const items = JSON.parse(JSON.stringify(navItems));
    service.updateNavItems(items as any, '/admin/control/categorias');
    const entradas = items.find((i: any) => i.name === 'MENU.ENTRIES') as any;
    const taxonomia = entradas.children?.find((c: any) => c.name === 'MENU.TAXONOMY') as any;
    expect(entradas.open).toBeTrue();
    expect(taxonomia.open).toBeTrue();
  });

  it('debe mantener abierto Taxonomía al navegar a Etiquetas', () => {
    const items = JSON.parse(JSON.stringify(navItems));
    service.updateNavItems(items as any, '/admin/control/etiquetas');
    const entradas = items.find((i: any) => i.name === 'MENU.ENTRIES') as any;
    const taxonomia = entradas.children?.find((c: any) => c.name === 'MENU.TAXONOMY') as any;
    expect(entradas.open).toBeTrue();
    expect(taxonomia.open).toBeTrue();
  });

  it('debe abrir Roles y Permisos al navegar a Privilegios', () => {
    const items = JSON.parse(JSON.stringify(navItems));
    service.updateNavItems(items as any, '/admin/control/gestion/privilegios');
    const rolesPermisos = items.find((i: any) => i.name === 'MENU.ROLES_AND_PERMISSIONS') as any;
    expect(rolesPermisos.open).toBeTrue();
  });
});
