import { Privilegio } from './privilegio.model';

describe('Privilegio model', () => {
  it('should initialize with default values', () => {
    const p = new Privilegio();
    expect(p.idPrivilegio).toBe(0);
    expect(p.codigo).toBe('');
    expect(p.nombre).toBe('');
    expect(p.descripcion).toBe('');
  });
});
