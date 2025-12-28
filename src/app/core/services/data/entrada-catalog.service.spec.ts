import { of } from 'rxjs';
import { EntradaCatalogService } from './entrada-catalog.service';

describe('EntradaCatalogService', () => {
  it('obtiene catálogos y cachea resultados', (done) => {
    const entradaService = jasmine.createSpyObj('EntradaService', [
      'listarTiposEntradasSafe',
      'listarEstadosEntradasSafe',
    ]);
    const categoriaService = jasmine.createSpyObj('CategoriaService', ['listarSafe']);
    const etiquetaService = jasmine.createSpyObj('EtiquetaService', ['listarSafe']);

    entradaService.listarTiposEntradasSafe.and.returnValue(of([{ nombre: 'Blog' }] as any));
    entradaService.listarEstadosEntradasSafe.and.returnValue(of([{ nombre: 'Borrador' }] as any));
    categoriaService.listarSafe.and.returnValue(of([{ nombre: 'Cat' }] as any));
    etiquetaService.listarSafe.and.returnValue(of([{ nombre: 'Tag' }] as any));

    const service = new EntradaCatalogService(
      entradaService as any,
      categoriaService as any,
      etiquetaService as any
    );

    service.obtenerCatalogosEntrada().subscribe((mapped) => {
      expect(mapped['tipoEntrada.nombre']).toEqual(['Blog']);
      expect(mapped['estadoEntrada.nombre']).toEqual(['Borrador']);
      expect(mapped['categoria.nombre']).toEqual(['Cat']);
      expect(mapped['etiqueta.nombre']).toEqual(['Tag']);
      done();
    });
  });

  it('usa cache en llamadas repetidas y puede limpiarse', (done) => {
    const entradaService = jasmine.createSpyObj('EntradaService', [
      'listarTiposEntradasSafe',
      'listarEstadosEntradasSafe',
    ]);
    const categoriaService = jasmine.createSpyObj('CategoriaService', ['listarSafe']);
    const etiquetaService = jasmine.createSpyObj('EtiquetaService', ['listarSafe']);

    entradaService.listarTiposEntradasSafe.and.returnValue(of([] as any));
    entradaService.listarEstadosEntradasSafe.and.returnValue(of([] as any));
    categoriaService.listarSafe.and.returnValue(of([] as any));
    etiquetaService.listarSafe.and.returnValue(of([] as any));

    const service = new EntradaCatalogService(
      entradaService as any,
      categoriaService as any,
      etiquetaService as any
    );

    service.obtenerCatalogosEntrada().subscribe(() => {
      service.obtenerCatalogosEntrada().subscribe(() => {
        expect(entradaService.listarTiposEntradasSafe).toHaveBeenCalledTimes(1);
        expect(entradaService.listarEstadosEntradasSafe).toHaveBeenCalledTimes(1);
        expect(categoriaService.listarSafe).toHaveBeenCalledTimes(1);
        expect(etiquetaService.listarSafe).toHaveBeenCalledTimes(1);

        service.clearCache();
        service.obtenerCatalogosEntrada().subscribe(() => {
          expect(entradaService.listarTiposEntradasSafe).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });
  });
});
