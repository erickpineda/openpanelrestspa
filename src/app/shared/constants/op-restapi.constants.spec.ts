import { OPRestMethods } from './op-restapi.constants';

describe('OPRestMethods', () => {
  it('debe generar rutas parametrizadas', () => {
    expect(OPRestMethods.ENTRADAS.OBTENER_POR_ID(1)).toBe('/entradas/obtenerPorId/1');
    expect(OPRestMethods.ENTRADAS.ACTUALIZAR(2)).toBe('/entradas/2');
    expect(OPRestMethods.ROLES.ELIMINAR(3)).toBe('/roles/3');
    expect(OPRestMethods.USUARIOS.OBTENER_POR_ID(9)).toBe('/usuarios/obtenerPorId/9');
    expect(OPRestMethods.COMENTARIOS.ACTUALIZAR(4)).toBe('/comentarios/4');
    expect(OPRestMethods.CATEGORIAS.ELIMINAR(5)).toBe('/categorias/5');
    expect(OPRestMethods.ETIQUETAS.OBTENER_POR_ID(6)).toBe('/etiquetas/obtenerPorId/6');
    expect(OPRestMethods.FILE_STORAGE.ELIMINAR(7)).toBe('/fileStorage/7');
    expect(OPRestMethods.PERFILES.ACTUALIZAR(8)).toBe('/perfil/8');
    expect(OPRestMethods.PRIVILEGIOS.OBTENER_POR_ID(10)).toBe('/privilegios/obtenerPorId/10');
  });

  it('debe exponer rutas estáticas esperadas', () => {
    expect(OPRestMethods.ENTRADAS.BASE).toBe('/entradas');
    expect(OPRestMethods.ROLES.CREAR).toBe('/roles/crear');
    expect(OPRestMethods.PRIVILEGIOS.CREAR).toBe('/privilegios/crear');
    expect(OPRestMethods.USUARIOS.CREAR).toBe('/usuarios/crear');
    expect(OPRestMethods.COMENTARIOS.CREAR).toBe('/comentarios/crear');
    expect(OPRestMethods.CATEGORIAS.CREAR).toBe('/categorias/crear');
    expect(OPRestMethods.ETIQUETAS.CREAR).toBe('/etiquetas/crear');
    expect(OPRestMethods.FILE_STORAGE.CREAR).toBe('/fileStorage/crear');
    expect(OPRestMethods.PERFILES.BASE).toBe('/perfil');
    expect(OPRestMethods.BUSCAR.BASE).toBe('/buscar');
    expect(OPRestMethods.AUTH.BASE).toBe('/auth');
    expect(OPRestMethods.AUTH.LOGIN).toBe('/login');
    expect(OPRestMethods.AUTH.REFRESH_TOKEN).toBe('/auth/refreshToken');
    expect(OPRestMethods.BUSCAR.DEFINICIONES).toBe('/buscar/definicionesBuscador');
    expect(OPRestMethods.REDIS.BASE).toBe('/redis');
    expect(OPRestMethods.CONFIRM_REGISTER.BASE).toBe('/validaRegistro/confirmarRegistroUsuario');
    expect(OPRestMethods.HERRAMIENTAS_AUXILIAR.BASE).toBe('/herramientas/sistema');
    expect(OPRestMethods.FICHEROS.RUTA_INTERNA).toBe('/fileStorage/ficheros/obtenerDatos/');
  });
});
