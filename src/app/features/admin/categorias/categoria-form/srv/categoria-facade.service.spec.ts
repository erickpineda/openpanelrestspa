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
      'obtenerPorId',
      'obtenerPorCodigo',
      'crear',
      'actualizar',
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
    categoriaServiceSpy.listarPagina.and.returnValue(of({ data: { elements: [{ idCategoria: 1 }] } } as any));
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

  it('obtenerCategoriaPorId should return data on success', (done) => {
    categoriaServiceSpy.obtenerPorId.and.returnValue(of({ data: { idCategoria: 1 } } as any));
    service.obtenerCategoriaPorId(1).subscribe(res => {
      expect(res).toBeTruthy();
      done();
    });
  });

  it('obtenerCategoriaPorId should return null on error', (done) => {
    categoriaServiceSpy.obtenerPorId.and.returnValue(throwError(() => new Error('Err')));
    service.obtenerCategoriaPorId(1).subscribe(res => {
      expect(res).toBeNull();
      done();
    });
  });

  it('obtenerCategoriaPorCodigo should return data', (done) => {
    categoriaServiceSpy.obtenerPorCodigo.and.returnValue(of({ data: { idCategoria: 1 } } as any));
    service.obtenerCategoriaPorCodigo('TEST').subscribe(res => {
      expect(res).toBeTruthy();
      done();
    });
  });

  it('cargarDatosParaEdicion should forkJoin', (done) => {
    categoriaServiceSpy.obtenerPorId.and.returnValue(of({ data: { idCategoria: 1 } } as any));
    usuarioServiceSpy.obtenerDatosSesionActual.and.returnValue(of({ data: {} } as any));
    entradaServiceSpy.obtenerPorId.and.returnValue(of({ data: {} } as any));

    service.cargarDatosParaEdicion(1, 1).subscribe(res => {
      expect(res.categoria).toBeTruthy();
      expect(res.usuario).toBeTruthy();
      expect(res.entrada).toBeTruthy();
      done();
    });
  });

  it('crearCategoria should call service', () => {
    service.crearCategoria({} as any);
    expect(categoriaServiceSpy.crear).toHaveBeenCalled();
  });

  it('actualizarCategoria should call service', () => {
    service.actualizarCategoria(1, {} as any);
    expect(categoriaServiceSpy.actualizar).toHaveBeenCalled();
  });

  it('actualizarCategoriaPorCodigo should call service', () => {
    service.actualizarCategoriaPorCodigo('c', {} as any);
    expect(categoriaServiceSpy.actualizarPorCodigo).toHaveBeenCalled();
  });
});
