import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  ResponsiveNavigationService,
  ResponsiveState,
} from '../../../core/services/ui/responsive-navigation.service';
import { NavigationService } from '../../../core/services/ui/navigation.service';
import { INavItemEnhanced, UserRole } from '../../types/navigation.types';

@Component({
  selector: 'app-responsive-navigation',
  templateUrl: './responsive-navigation.component.html',
  styleUrls: ['./responsive-navigation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ResponsiveNavigationComponent implements OnInit, OnDestroy {
  @Input() userRole: UserRole = UserRole.LECTOR;
  @Input() navigationItems: INavItemEnhanced[] = [];
  @Output() navigationItemClick = new EventEmitter<INavItemEnhanced>();
  @Output() sidebarToggle = new EventEmitter<boolean>();

  public responsiveState$: Observable<ResponsiveState>;
  public adaptedNavigationItems: INavItemEnhanced[] = [];
  public criticalFunctions: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private responsiveNavigationService: ResponsiveNavigationService,
    private navigationService: NavigationService,
    private cdr: ChangeDetectorRef
  ) {
    this.responsiveState$ = this.responsiveNavigationService.responsiveState$;
  }

  ngOnInit(): void {
    this.criticalFunctions = this.responsiveNavigationService.getCriticalFunctions();
    this.initializeResponsiveNavigation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa la navegación responsiva
   */
  private initializeResponsiveNavigation(): void {
    // Suscribirse a cambios en el estado responsivo
    this.responsiveState$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      this.adaptNavigationForCurrentState(state);
      this.cdr.markForCheck();
    });

    // Suscribirse a cambios en los elementos de navegación
    this.navigationService
      .getNavigationItems(this.userRole)
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        this.navigationItems = items;
        const currentState = this.responsiveNavigationService.getCurrentState();
        this.adaptNavigationForCurrentState(currentState);
        this.cdr.markForCheck();
      });
  }

  /**
   * Adapta la navegación para el estado actual
   */
  private adaptNavigationForCurrentState(state: ResponsiveState): void {
    this.adaptedNavigationItems = this.responsiveNavigationService.adaptNavigationItems(
      this.navigationItems,
      state
    );
  }

  /**
   * Maneja el clic en un elemento de navegación
   */
  public onNavigationItemClick(item: INavItemEnhanced): void {
    this.navigationItemClick.emit(item);

    // Auto-colapsar en móvil después de la navegación
    const currentState = this.responsiveNavigationService.getCurrentState();
    if (currentState.isMobile && !currentState.sidebarCollapsed) {
      this.toggleSidebar();
    }
  }

  /**
   * Alterna el estado del sidebar
   */
  public toggleSidebar(): void {
    this.responsiveNavigationService.toggleSidebar();
    const newState = this.responsiveNavigationService.getCurrentState();
    this.sidebarToggle.emit(newState.sidebarCollapsed);
  }

  /**
   * Colapsa el sidebar
   */
  public collapseSidebar(): void {
    this.responsiveNavigationService.collapseSidebar();
    this.sidebarToggle.emit(true);
  }

  /**
   * Expande el sidebar
   */
  public expandSidebar(): void {
    this.responsiveNavigationService.expandSidebar();
    this.sidebarToggle.emit(false);
  }

  /**
   * Verifica si un elemento debe mostrarse en el modo actual
   */
  public shouldShowItem(item: INavItemEnhanced, state: ResponsiveState): boolean {
    if (item.responsiveConfig?.hideOnMobile && state.isMobile) {
      return false;
    }

    if (state.isMobile) {
      // En móvil, mostrar solo funciones críticas y títulos de sección
      return item.title === true || this.isCriticalFunction(item);
    }

    return true;
  }

  /**
   * Verifica si un elemento es una función crítica
   */
  private isCriticalFunction(item: INavItemEnhanced): boolean {
    return this.criticalFunctions.some(
      (critical) => critical.url === item.url || critical.name === item.name
    );
  }

  /**
   * Obtiene las clases CSS para el contenedor de navegación
   */
  public getNavigationClasses(state: ResponsiveState): string[] {
    const classes = ['responsive-navigation'];

    if (state.isMobile) {
      classes.push('mobile-layout');
    } else if (state.isTablet) {
      classes.push('tablet-layout');
    } else {
      classes.push('desktop-layout');
    }

    if (state.sidebarCollapsed) {
      classes.push('collapsed');
    }

    if (state.touchEnabled) {
      classes.push('touch-enabled');
    }

    return classes;
  }

  /**
   * Obtiene las clases CSS para un elemento de navegación
   */
  public getItemClasses(item: INavItemEnhanced, state: ResponsiveState): string[] {
    const classes = ['nav-item'];

    if (item.title) {
      classes.push('nav-title');
    }

    if (this.isCriticalFunction(item)) {
      classes.push('critical-function');
    }

    if (state.touchEnabled && !item.title) {
      classes.push('touch-optimized');
    }

    if (item.children && item.children.length > 0) {
      classes.push('has-children');
    }

    return classes;
  }

  /**
   * Maneja el evento de cambio de tamaño de ventana
   */
  public onWindowResize(): void {
    // El servicio maneja automáticamente los cambios de tamaño
    // Este método está disponible para lógica adicional si es necesaria
  }

  /**
   * Obtiene el texto del botón de toggle
   */
  public getToggleButtonText(state: ResponsiveState): string {
    if (state.isMobile) {
      return state.sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú';
    }
    return state.sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar';
  }

  /**
   * Verifica si debe mostrar el botón de toggle
   */
  public shouldShowToggleButton(state: ResponsiveState): boolean {
    return state.isMobile || state.isTablet;
  }

  /**
   * TrackBy function para optimizar el renderizado de la lista
   */
  public trackByNavItem(index: number, item: INavItemEnhanced): string {
    return (item.url as string) || item.name || index.toString();
  }

  public getBadgeClasses(badge?: { color?: string; text?: string } | null): string[] {
    const color = badge?.color || 'info';
    const classes = ['badge-' + color];
    if (badge?.text === '0') classes.push('zero-count');
    return classes;
  }

  public toTestId(name?: string): string {
    return ('nav-item-' + (name || '')).toLowerCase().replace(/\s+/g, '-');
  }

  public onBottomToggleKeydown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (key === 'enter' || key === ' ') {
      event.preventDefault();
      this.toggleSidebar();
    }
  }

  @HostListener('document:keydown', ['$event'])
  public onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key.toLowerCase() === 'escape') {
      const state = this.responsiveNavigationService.getCurrentState();
      if (!state.sidebarCollapsed) {
        this.collapseSidebar();
      }
    }
  }
}
