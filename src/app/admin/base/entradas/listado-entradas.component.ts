import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { EntradaCatalogService } from '../../../core/services/data/entrada-catalog.service';
import { catchError, Subject, takeUntil, throwError, finalize } from 'rxjs';
import { Entrada } from '../../../core/models/entrada.model';
import { EntradaService } from '../../../core/services/data/entrada.service';
import { CommonFunctionalityService } from '../../../shared/services/common-functionality.service';
import { BusquedaService } from '../../../core/services/srv-busqueda/busqueda.service';
import { ToastService } from '../../../core/services/ui/toast.service';
import { ErrorBoundaryService } from '../../../core/errors/error-boundary/error-boundary.service';
import { GlobalErrorHandlerService } from '../../../core/errors/global-error/global-error-handler.service';
import { ErrorBoundaryComponent } from '../../../shared/components/errors/error-boundary/error-boundary.component';
import { LoggerService } from '../../../core/services/logger.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listado-entradas',
  templateUrl: './listado-entradas.component.html',
  styleUrls: ['./listado-entradas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListadoEntradasComponent implements OnInit, OnDestroy, AfterViewInit {
  listaEntradas: Entrada[] = [];
  allEntradas: Entrada[] = []; // Para fallback client-side
  entradaABorrar: Entrada | null = null;

  totalPages: number = 0;
  currentPage: number = 0;
  pageSize: number = 20;
  totalElements = 0;
  numberOfElements = 0;
  estaVacio: boolean = false;

  public visible = false;
  private destroy$ = new Subject<void>();

  campoSeleccionado: string = '';
  operacionSeleccionada: string = '';
  valorBusqueda: string = '';
  dataOptionSeleccionada: string = 'AND';

  public definiciones: any;
  public cargando: boolean = false;
  public cargandoTabla: boolean = false;
  
  // Propiedades para búsqueda básica/avanzada
  public showAdvanced = false;
  public basicSearchText = '';

  // Para el buscador avanzado genérico
  public cargarCatalogosEntrada = (): Observable<{ [key: string]: string[] }> => {
    return this.entradaCatalogService.obtenerCatalogosEntrada();
  };
private readonly boundaryId = 'listado-entradas-main';
  constructor(
    public commonFuncService: CommonFunctionalityService,
    private entradaService: EntradaService,
    private busquedaService: BusquedaService,
    private toastService: ToastService,
    private errorBoundaryService: ErrorBoundaryService,
    private log: LoggerService,
    private router: Router,
    private entradaCatalogService: EntradaCatalogService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.cargarDefinicionesBuscador();
    this.busquedaService.iniciarBusqueda(
      (term, page) => this.realizarBusquedaEntradas(term, page),
      (response) => this.procesarResultadosBusqueda(response)
    );
  }

  ngAfterViewInit(): void {
    try { this.cdr.detectChanges(); } catch {}
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.errorBoundaryService.unregisterBoundary(this.boundaryId);
    this.busquedaService.limpiarBusqueda();
  }

  private realizarBusquedaEntradas(term: string, page?: number) {
    this.cargandoTabla = true;
    this.cdr.markForCheck();
    const searchRequest = {
      dataOption: this.dataOptionSeleccionada,
      searchCriteriaList: [{
        filterKey: this.campoSeleccionado,
        value: term,
        operation: this.operacionSeleccionada,
        clazzName: 'Entrada'
      }]
    };
    const pageToUse = page !== undefined ? page : this.currentPage;
    return this.entradaService.buscarSafe(searchRequest, pageToUse, this.pageSize)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargandoTabla = false;
          this.cdr.detectChanges();
        })
      );
  }

  public toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  public onBasicSearchTextChange(text: string): void {
    this.basicSearchText = text;
    this.campoSeleccionado = 'titulo';
    
    // Intentar obtener operación válida para título, por defecto CONTAINS
    const operaciones = this.definiciones?.operationPermitido?.['titulo'];
    this.operacionSeleccionada = Array.isArray(operaciones) && operaciones.length > 0 ? operaciones[0] : 'CONTAINS';
    
    this.valorBusqueda = text;
    this.currentPage = 0;
    this.busquedaService.triggerBusqueda(text);
  }

  public onPageSizeChange(size: number): void {
    this.pageSize = Number(size) || 20;
    this.currentPage = 0;
    // Forzar recarga
    if (this.allEntradas.length > 0) {
       // Si estamos en modo cliente, solo reaplicar paginación
       // Pero como cambió el pageSize, los totales de páginas cambian.
       this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.pageSize));
       this.applyPaging();
    } else {
       this.busquedaService.triggerBusqueda(this.valorBusqueda);
    }
  }

  public aplicarFiltro(filtro: any): void {
    this.campoSeleccionado = filtro.campo;
    this.operacionSeleccionada = filtro.operacion;
    this.valorBusqueda = filtro.valor;
    this.currentPage = 0;
    this.cdr.markForCheck();
    
    if (this.campoSeleccionado && this.operacionSeleccionada) {
      this.busquedaService.triggerBusqueda(this.valorBusqueda);
    }
  }

  public onFiltroChanged(filtro: any): void {
    // Actualizar el estado interno pero no volver a disparar la búsqueda,
    // ya que el buscador centralizado (BusquedaService) será quien la ejecute.
    this.campoSeleccionado = filtro.campo;
    this.operacionSeleccionada = filtro.operacion;
    this.valorBusqueda = filtro.valor;
    this.currentPage = 0;
  }

  private setPageData(data: any): void {
    const raw = (data?.elements ?? (data as any)?.items ?? (data as any)?.content ?? (Array.isArray(data) ? data : []));
    let elementos: Entrada[] = Array.isArray(raw) ? raw : [];
    
    // Mapear categorías
    elementos = elementos.map((entrada: Entrada) => ({
      ...entrada,
      categoriasConComas: entrada.categorias?.map(e => e.nombre).join(', ') || ''
    }));

    const hasServerPaging = typeof data?.totalPages === 'number' || typeof data?.totalElements === 'number';

    if (hasServerPaging) {
      this.listaEntradas = elementos;
      this.totalElements = Number(data.totalElements || elementos.length || 0);
      this.totalPages = Number(data.totalPages || Math.ceil(this.totalElements / this.pageSize) || 1);
      this.numberOfElements = Number(data.numberOfElements ?? elementos.length);
      this.estaVacio = elementos.length === 0;
      this.allEntradas = []; // Limpiar caché cliente si es server paging

      // Boundary check
      if (elementos.length === 0 && this.currentPage > 0 && this.currentPage >= this.totalPages) {
         this.currentPage = Math.max(0, this.totalPages - 1);
         this.busquedaService.triggerBusqueda(this.valorBusqueda);
         return;
      }
    } else {
      // Fallback Client Paging
      this.allEntradas = elementos;
      this.totalElements = this.allEntradas.length;
      this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.pageSize));
      this.estaVacio = this.totalElements === 0;

      if (this.currentPage >= this.totalPages) {
        this.currentPage = Math.max(0, this.totalPages - 1);
      }
      this.applyPaging();
    }
    this.cdr.markForCheck();
    try { this.cdr.detectChanges(); } catch {}
  }

  private applyPaging(): void {
    if (this.allEntradas.length > 0) {
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.listaEntradas = this.allEntradas.slice(start, end);
      this.numberOfElements = this.listaEntradas.length;
    } else {
      if (this.allEntradas.length === 0 && !this.estaVacio) {
         // Si allEntradas está vacío pero no es porque no haya resultados, sino porque estamos en server paging, no hacemos nada aquí.
      } else if (this.allEntradas.length > 0) { // Caso redundante pero por seguridad
          this.listaEntradas = [];
          this.numberOfElements = 0;
      }
    }
    this.cdr.markForCheck();
    try { this.cdr.detectChanges(); } catch {}
  }

  private procesarResultadosBusqueda(response: any) {
    this.setPageData(response);
  }

  private cargarDefinicionesBuscador(): void {
    this.cargando = true;
    this.cdr.markForCheck();
    
    this.entradaService.obtenerDefinicionesBuscadorSafe()
      .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.cargando = false;
            this.cdr.detectChanges();
          }),
          catchError((error) => {
            // Reportar al boundary específico
            this.errorBoundaryService.reportErrorToBoundary(
              this.boundaryId, 
              error,
              'CargarDefinicionesBuscador'
            );
            
            return throwError(() => error);
          })
        )
      .subscribe({
        next: (response) => {
          if (response) {
            this.definiciones = response;
            this.inicializarCamposBusqueda();
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.log.error('Error secundario:', error);
          this.cdr.markForCheck();
        }
      });
  }

   onBoundaryInit(boundary: ErrorBoundaryComponent): void {
    this.errorBoundaryService.registerBoundary(this.boundaryId, boundary);
  }

  private inicializarCamposBusqueda(): void {
    const campos = (this.definiciones.filterKeySegunClazzNamePermitido as string[]) || [];
    
    // Ordenar campos: 'titulo' primero, luego el resto alfabéticamente
    const camposOrdenados = [
      ...campos.filter(k => k === 'titulo'),
      ...campos.filter(k => k !== 'titulo').sort((a, b) => a.localeCompare(b))
    ];
    
    this.campoSeleccionado = camposOrdenados[0] || '';
    const operaciones = this.definiciones.operationPermitido?.[this.campoSeleccionado];
    this.operacionSeleccionada = Array.isArray(operaciones) ? operaciones[0] : '';
    this.valorBusqueda = '';
    this.currentPage = 0;
    
    if (this.campoSeleccionado && this.operacionSeleccionada) {
      this.zone.run(() => setTimeout(() => this.busquedaService.triggerBusqueda(this.valorBusqueda), 0));
    }
  }

  obtenerListaEntradas(page: number): void {
    this.currentPage = page;
    
    if (this.allEntradas.length > 0) {
        // Paginación cliente
        this.applyPaging();
    } else {
        // Paginación servidor
        this.busquedaService.searchNow(this.valorBusqueda, this.currentPage)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => this.procesarResultadosBusqueda(response),
            error: (error) => this.mostrarError('Error en búsqueda: ' + error)
          });
    }
    this.cdr.markForCheck();
  }

  checkFechaPublicacion(fechaPublicacion: Date): string {
    return fechaPublicacion
      ? this.commonFuncService.transformaFecha(fechaPublicacion, 'dd-MM-yyyy', false)
      : 'No publicada';
  }

  borrarEntrada(entrada: Entrada): void {
    this.entradaABorrar = entrada;
    this.visible = true;
    this.cdr.markForCheck();
  }

  confirmarBorrado(): void {
    if (this.entradaABorrar) {
      this.entradaService.borrar(this.entradaABorrar.idEntrada)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.obtenerListaEntradas(this.currentPage);
            this.entradaABorrar = null;
            this.visible = false;
            this.toastService.showSuccess('La entrada se ha eliminado correctamente.', 'Entrada eliminada');
            this.cdr.markForCheck();
          },
          error: (error) => {
            this.log.error('Error al eliminar la entrada:', error);
            this.visible = false;
            this.mostrarError('Error al eliminar la entrada: ' + error.message);
            this.cdr.markForCheck();
          }
        });
    }
  }

  private mostrarError(mensaje: string): void {
    this.toastService.showError(mensaje, 'Error');
    this.cdr.markForCheck();
  }

  toggleModal(): void {
    this.visible = !this.visible;
    if (!this.visible) {
      this.entradaABorrar = null;
    }
    this.cdr.markForCheck();
  }

  onVisibleModalChange(visible: boolean): void {
    this.visible = visible;
    if (!visible) {
      this.entradaABorrar = null;
    }
    this.cdr.markForCheck();
    try { this.cdr.detectChanges(); } catch {}
  }

  refrescarDatos(): void {
    this.currentPage = 0;
    this.busquedaService.triggerBusqueda(this.valorBusqueda);
  }

  // Preview handling
  public previewEntrada?: Entrada;
  public previewVisible: boolean = false;

  openPreview(entrada: Entrada): void {
    this.previewEntrada = entrada;
    this.previewVisible = true;
    // Dar foco al botón de cerrar del modal para accesibilidad (delay corto
    // para esperar a que el modal se renderice).
    setTimeout(() => {
      try {
        this.previewCloseBtn?.nativeElement?.focus();
      } catch (e) {
        // ignorar si no está disponible
      }
    }, 50);
  }

  closePreview(): void {
    this.previewVisible = false;
    this.previewEntrada = undefined;
    this.cdr.markForCheck();
  }

  onPreviewVisibleChange(visible: boolean): void {
    this.previewVisible = visible;
    if (!visible) this.previewEntrada = undefined;
    this.cdr.markForCheck();
  }

  onEditarDesdePreview(): void {
    if (this.previewEntrada && this.previewEntrada.idEntrada) {
      // Navegar a la ruta de edición
      this.router.navigate(['/admin/control/entradas/editar', this.previewEntrada.idEntrada]);
      this.closePreview();
    }
  }

  onPublicarDesdePreview(entrada: Entrada): void {
    // Si existe un endpoint para publicar, se llamaría aquí. Por ahora, cerramos la preview
    // y mostramos un toast informativo.
    this.closePreview();
    this.toastService.showInfo('Solicitud de publicación enviada (acción no implementada).', 'Publicar');
  }

  @ViewChild('previewCloseBtn') previewCloseBtn?: ElementRef<HTMLButtonElement>;

  // Método para trackBy en *ngFor (mejora rendimiento)
  trackByEntradaId(index: number, entrada: Entrada): number {
    return entrada.idEntrada;
  }
}
