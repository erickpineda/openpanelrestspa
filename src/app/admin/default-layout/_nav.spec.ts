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

    expect(control?.requiredPermissions).toEqual([OpPrivilegioConstants.ACCESO_PANEL]);
    expect(contentTitle?.requiredPermissions).not.toEqual([OpPrivilegioConstants.VER_DASHBOARD]);
  });

  it('debe proteger MENU.PAGES con GESTIONAR_PAGINAS en lugar de roles hardcodeados', () => {
    const pages = navItems.find((i) => i.name === 'MENU.PAGES');

    expect(pages?.requiredPermissions).toEqual([OpPrivilegioConstants.GESTIONAR_PAGINAS]);
    expect(pages?.permissionMode).toBeUndefined();
    expect(pages?.requiredRoles).toBeUndefined();
  });

  it('debe mostrar Mi Perfil con el nuevo privilegio propio y compatibilidad legacy', () => {
    const profile = navItems.find((i) => i.name === 'MENU.MY_PROFILE');

    expect(profile?.requiredPermissions).toEqual([
      OpPrivilegioConstants.GESTIONAR_PERFIL_PROPIO,
      OpPrivilegioConstants.GESTIONAR_PERFIL,
    ]);
    expect(profile?.permissionMode).toBe('ANY');
  });

  it('debe separar roles del legacy GESTIONAR_ROLES_USUARIOS en navegación', () => {
    const rolesSection = navItems.find((i) => i.name === 'MENU.ROLES_AND_PERMISSIONS');
    const rolesItem = rolesSection?.children?.find((i) => i.name === 'MENU.ROLES');

    expect(rolesSection?.requiredPermissions).toEqual([
      OpPrivilegioConstants.GESTIONAR_ROLES,
      OpPrivilegioConstants.GESTIONAR_ROLES_USUARIOS,
      OpPrivilegioConstants.GESTIONAR_PRIVILEGIOS,
    ]);
    expect(rolesSection?.permissionMode).toBe('ANY');
    expect(rolesItem?.requiredPermissions).toEqual([
      OpPrivilegioConstants.GESTIONAR_ROLES,
      OpPrivilegioConstants.GESTIONAR_ROLES_USUARIOS,
    ]);
    expect(rolesItem?.permissionMode).toBe('ANY');
  });

  it('debe exponer solo Apariencia mientras no exista backend real de ajustes', () => {
    const systemSection = navItems.find((i) => i.name === 'MENU.SYSTEM_CONFIGURATION');
    const appearance = navItems.find((i) => i.name === 'MENU.APPEARANCE');
    const generalSettings = navItems.find((i) => i.name === 'MENU.GENERAL_SETTINGS');
    const advancedSettings = navItems.find((i) => i.name === 'MENU.ADVANCED_SETTINGS');

    expect(systemSection?.requiredPermissions).toEqual([
      OpPrivilegioConstants.GESTIONAR_TEMAS,
      OpPrivilegioConstants.CONFIGURAR_SISTEMA,
    ]);
    expect(systemSection?.permissionMode).toBe('ANY');
    expect(appearance?.requiredPermissions).toEqual([
      OpPrivilegioConstants.GESTIONAR_TEMAS,
      OpPrivilegioConstants.CONFIGURAR_SISTEMA,
    ]);
    expect(appearance?.permissionMode).toBe('ANY');
    expect(generalSettings).toBeUndefined();
    expect(advancedSettings).toBeUndefined();
  });
});
