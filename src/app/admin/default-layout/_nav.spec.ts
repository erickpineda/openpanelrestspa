import { navItems } from './_nav';
import { OpPrivilegioConstants } from '../../shared/constants/op-privilegio.constants';

describe('Admin Navigation Config', () => {
  it('debe configurar icono de Dashboard correctamente', () => {
    const dashboard = navItems.find((i) => i.name === 'MENU.DASHBOARD');
    expect(dashboard).toBeTruthy();
    expect(dashboard?.iconComponent?.name).toBe('cil-speedometer');
  });

  it('no debe usar VER_DASHBOARD como permiso del contenedor de gestión', () => {
    const control = navItems.find((i) => i.name === 'MENU.CONTROL_PANEL');
    const contentTitle = navItems.find((i) => i.name === 'MENU.CONTENT_MANAGEMENT');

    expect(control?.requiredPermissions).not.toEqual([OpPrivilegioConstants.VER_DASHBOARD]);
    expect(contentTitle?.requiredPermissions).not.toEqual([OpPrivilegioConstants.VER_DASHBOARD]);
  });

  it('debe proteger MENU.PAGES con GESTIONAR_PAGINAS en lugar de roles hardcodeados', () => {
    const pages = navItems.find((i) => i.name === 'MENU.PAGES');

    expect(pages?.requiredPermissions).toEqual([OpPrivilegioConstants.GESTIONAR_PAGINAS]);
    expect(pages?.permissionMode).toBeUndefined();
    expect(pages?.requiredRoles).toBeUndefined();
  });
});
