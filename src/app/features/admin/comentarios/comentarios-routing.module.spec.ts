import { comentariosRoutes } from './comentarios-routing.module';
import { OpPrivilegioConstants } from '../../../shared/constants/op-privilegio.constants';

describe('ComentariosRoutingModule anti-legacy', () => {
  it('no debe reintroducir COMENTAR en la ruta de moderación ya migrada', () => {
    const permissions = (comentariosRoutes[0]?.data?.['permissions'] as string[] | undefined) ?? [];

    expect(permissions).toContain(OpPrivilegioConstants.MODERAR_COMENTARIOS);
    expect(permissions).not.toContain(OpPrivilegioConstants.COMENTAR);
  });
});
