import { navItems } from './_nav';

describe('Admin Navigation Config', () => {
  it('debe configurar icono de Dashboard correctamente', () => {
    const dashboard = navItems.find((i) => i.name === 'MENU.DASHBOARD');
    expect(dashboard).toBeTruthy();
    expect(dashboard?.iconComponent?.name).toBe('cil-speedometer');
  });
});
