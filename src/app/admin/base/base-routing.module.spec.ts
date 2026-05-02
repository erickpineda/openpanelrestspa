import { baseRoutes } from './base-routing.module';
import { OpPrivilegioConstants } from '../../shared/constants/op-privilegio.constants';

describe('BaseRoutingModule anti-legacy', () => {
  it('no debe reintroducir privilegios legacy en la ruta de páginas ya migrada', () => {
    const gestionRoute = baseRoutes[0]?.children?.find((route) => route.path === 'paginas');
    const permissions = (gestionRoute?.data?.['permissions'] as string[] | undefined) ?? [];

    expect(permissions).toEqual([OpPrivilegioConstants.GESTIONAR_PAGINAS]);
  });

  it('no debe usar COMENTAR en la ruta de moderación de comentarios ya migrada', () => {
    const commentsRoute = baseRoutes[0]?.children?.find((route) => route.path === 'comentarios');
    const permissions = (commentsRoute?.data?.['permissions'] as string[] | undefined) ?? [];

    expect(permissions).toContain(OpPrivilegioConstants.MODERAR_COMENTARIOS);
    expect(permissions).not.toContain(OpPrivilegioConstants.COMENTAR);
  });
});
