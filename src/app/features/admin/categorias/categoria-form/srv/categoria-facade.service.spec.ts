import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CategoriaFacadeService } from './categoria-facade.service';
import { CategoriaService } from '@app/core/services/data/categoria.service';
import { UsuarioService } from '@app/core/services/data/usuario.service';
import { EntradaService } from '@app/core/services/data/entrada.service';

describe('CategoriaFacadeService', () => {
  let service: CategoriaFacadeService;
  let categoriaServiceSpy: jasmine.SpyObj<CategoriaService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let entradaServiceSpy: jasmine.SpyObj<EntradaService>;

  beforeEach(() => {
    const catSpy = jasmine.createSpyObj('CategoriaService', [
      'listarPagina',
      'obtenerPorCodigo',
      'crear',
      'actualizarPorCodigo'
    ]);
    const userSpy = jasmine.createSpyObj('UsuarioService', ['obtenerDatosSesionActual']);
    const entSpy = jasmine.createSpyObj('EntradaService', ['obtenerPorId']);

    TestBed.configureTestingModule({
      providers: [
        CategoriaFacadeService,
        { provide: CategoriaService, useValue: catSpy },
        { provide: UsuarioService, useValue: userSpy },
        { provide: EntradaService, useValue: entSpy }
      ]
    });

    service = TestBed.inject(CategoriaFacadeService);
    categoriaServiceSpy = TestBed.inject(CategoriaService) as jasmine.SpyObj<CategoriaService>;
    usuarioServiceSpy = TestBed.inject(UsuarioService) as jasmine.SpyObj<UsuarioService>;
    entradaServiceSpy = TestBed.inject(EntradaService) as jasmine.SpyObj<EntradaService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('obtenerListaCategorias should return elements on success', (done) => {
    categoriaServiceSpy.listarPagina.and.returnValue(of({ data: { elements: [{ codigo: 'TEST' }] } } as any));
    service.obtenerListaCategorias().subscribe(res => {
      expect(res.length).toBe(1);
      done();
    });
  });

  it('obtenerListaCategorias should return empty array on error', (done) => {
    categoriaServiceSpy.listarPagina.and.returnValue(throwError(() => new Error('Err')));
    service.obtenerListaCategorias().subscribe(res => {
      expect(res).toEqual([]);
      done();
    });
  });

  it('obtenerCategoriaPorCodigo should return data', (done) => {
    categoriaServiceSpy.obtenerPorCodigo.and.returnValue(of({ data: { codigo: 'TEST' } } as any));
    service.obtenerCategoriaPorCodigo('TEST').subscribe(res => {
      expect(res).toBeTruthy();
      done();
    });
  });

  it('crearCategoria should call service', () => {
    service.crearCategoria({} as any);
    expect(categoriaServiceSpy.crear).toHaveBeenCalled();
  });

  it('actualizarCategoriaPorCodigo should call service', () => {
    service.actualizarCategoriaPorCodigo('c', {} as any);
    expect(categoriaServiceSpy.actualizarPorCodigo).toHaveBeenCalled();
  });
});
