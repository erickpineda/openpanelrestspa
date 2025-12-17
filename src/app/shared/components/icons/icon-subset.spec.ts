import { iconSubset } from './icon-subset';

describe('iconSubset', () => {
  it('debe contener cilStorage para navegación de Base de Datos', () => {
    expect(iconSubset).toBeTruthy();
    expect(iconSubset['cilStorage']).toBeTruthy();
  });
});
