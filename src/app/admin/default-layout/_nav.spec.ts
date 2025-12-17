import { navItems } from './_nav';

describe('Admin Navigation Config', () => {
  it('debe configurar icono de Base de Datos correctamente', () => {
    const db = navItems.find(i => i.name === 'Base de Datos');
    expect(db).toBeTruthy();
    expect(db?.iconComponent?.name).toBe('cil-storage');
  });
});
