import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { map, startWith, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { INavItemEnhanced } from '../../../shared/types/navigation.types';

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  sidebarCollapsed: boolean;
  touchEnabled: boolean;
}

export interface CriticalFunction {
  id: string;
  name: string;
  url: string;
  icon: string;
  priority: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResponsiveNavigationService {
  private readonly DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  };

  private readonly CRITICAL_FUNCTIONS: CriticalFunction[] = [
    { id: 'dashboard', name: 'Escritorio', url: '/admin/dashboard', icon: 'cil-speedometer', priority: 100 },
    { id: 'new-entry', name: 'Nueva Entrada', url: '/admin/control/entradas/crear', icon: 'cil-plus', priority: 90 },
    { id: 'entries', name: 'Entradas', url: '/admin/control/entradas', icon: 'cil-pencil', priority: 80 },
    { id: 'comments', name: 'Comentarios', url: '/admin/control/comentarios', icon: 'cil-comment-square', priority: 70 },
    { id: 'profile', name: 'Mi Perfil', url: '/admin/control/gestion/miperfil', icon: 'cil-user', priority: 60 }
  ];

  private breakpoints: ResponsiveBreakpoints = this.DEFAULT_BREAKPOINTS;
  private sidebarCollapsedSubject = new BehaviorSubject<boolean>(false);
  private responsiveStateSubject = new BehaviorSubject<ResponsiveState>(this.getInitialState());

  public responsiveState$: Observable<ResponsiveState> = this.responsiveStateSubject.asObservable();
  public sidebarCollapsed$: Observable<boolean> = this.sidebarCollapsedSubject.asObservable();

  constructor() {
    this.initializeResponsiveListener();
    this.initializeTouchDetection();
  }

  /**
   * Inicializa el listener para cambios de tamaño de ventana
   */
  private initializeResponsiveListener(): void {
    if (typeof window !== 'undefined') {
      fromEvent(window, 'resize')
        .pipe(
          debounceTime(150),
          map(() => this.calculateResponsiveState()),
          distinctUntilChanged((prev, curr) => 
            prev.isMobile === curr.isMobile && 
            prev.isTablet === curr.isTablet && 
            prev.isDesktop === curr.isDesktop
          ),
          startWith(this.calculateResponsiveState())
        )
        .subscribe(state => {
          this.responsiveStateSubject.next(state);
          this.handleAutomaticCollapse(state);
        });
    }
  }

  /**
   * Detecta si el dispositivo soporta interacción táctil
   */
  private initializeTouchDetection(): void {
    if (typeof window !== 'undefined') {
      const touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const currentState = this.responsiveStateSubject.value;
      this.responsiveStateSubject.next({
        ...currentState,
        touchEnabled
      });
    }
  }

  /**
   * Calcula el estado responsivo actual
   */
  private calculateResponsiveState(): ResponsiveState {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const isMobile = screenWidth < this.breakpoints.mobile;
    const isTablet = screenWidth >= this.breakpoints.mobile && screenWidth < this.breakpoints.desktop;
    const isDesktop = screenWidth >= this.breakpoints.desktop;
    const touchEnabled = typeof window !== 'undefined' ? 
      ('ontouchstart' in window || navigator.maxTouchPoints > 0) : false;

    return {
      isMobile,
      isTablet,
      isDesktop,
      screenWidth,
      sidebarCollapsed: this.sidebarCollapsedSubject.value,
      touchEnabled
    };
  }

  /**
   * Obtiene el estado inicial
   */
  private getInitialState(): ResponsiveState {
    return this.calculateResponsiveState();
  }

  /**
   * Maneja el colapso automático del sidebar según el tamaño de pantalla
   */
  private handleAutomaticCollapse(state: ResponsiveState): void {
    if (state.isMobile && !this.sidebarCollapsedSubject.value) {
      this.collapseSidebar();
    }
  }

  /**
   * Colapsa el sidebar
   */
  public collapseSidebar(): void {
    this.sidebarCollapsedSubject.next(true);
    this.updateResponsiveState();
  }

  /**
   * Expande el sidebar
   */
  public expandSidebar(): void {
    this.sidebarCollapsedSubject.next(false);
    this.updateResponsiveState();
  }

  /**
   * Alterna el estado del sidebar
   */
  public toggleSidebar(): void {
    const currentState = this.sidebarCollapsedSubject.value;
    this.sidebarCollapsedSubject.next(!currentState);
    this.updateResponsiveState();
  }

  /**
   * Actualiza el estado responsivo
   */
  private updateResponsiveState(): void {
    const newState = this.calculateResponsiveState();
    this.responsiveStateSubject.next(newState);
  }

  /**
   * Adapta los elementos de navegación según el estado responsivo
   */
  public adaptNavigationItems(items: INavItemEnhanced[], state?: ResponsiveState): INavItemEnhanced[] {
    const currentState = state || this.responsiveStateSubject.value;

    if (currentState.isMobile) {
      return this.adaptForMobile(items);
    } else if (currentState.isTablet) {
      return this.adaptForTablet(items);
    } else {
      return this.adaptForDesktop(items);
    }
  }

  /**
   * Adapta la navegación para dispositivos móviles
   */
  private adaptForMobile(items: INavItemEnhanced[]): INavItemEnhanced[] {
    // En móviles, mostrar solo funciones críticas y colapsar submenús
    const criticalItems = items.filter(item => 
      this.isCriticalFunction(item) || item.title === true
    );

    return criticalItems.map(item => ({
      ...item,
      children: undefined, // Colapsar todos los submenús en móvil
      responsiveConfig: {
        ...item.responsiveConfig,
        hideOnMobile: false
      }
    }));
  }

  /**
   * Adapta la navegación para tablets
   */
  private adaptForTablet(items: INavItemEnhanced[]): INavItemEnhanced[] {
    return items.map(item => ({
      ...item,
      // Optimizar para interacción táctil
      responsiveConfig: {
        ...item.responsiveConfig,
        collapseThreshold: this.breakpoints.tablet
      }
    }));
  }

  /**
   * Adapta la navegación para escritorio
   */
  private adaptForDesktop(items: INavItemEnhanced[]): INavItemEnhanced[] {
    // En escritorio, mostrar navegación completa
    return items;
  }

  /**
   * Determina si un elemento es una función crítica
   */
  private isCriticalFunction(item: INavItemEnhanced): boolean {
    return this.CRITICAL_FUNCTIONS.some(critical => 
      critical.url === item.url || critical.name === item.name
    );
  }

  /**
   * Obtiene las funciones críticas para mostrar en modo colapsado
   */
  public getCriticalFunctions(): CriticalFunction[] {
    return [...this.CRITICAL_FUNCTIONS];
  }

  /**
   * Configura breakpoints personalizados
   */
  public setBreakpoints(breakpoints: Partial<ResponsiveBreakpoints>): void {
    this.breakpoints = { ...this.DEFAULT_BREAKPOINTS, ...breakpoints };
    this.updateResponsiveState();
  }

  /**
   * Obtiene los breakpoints actuales
   */
  public getBreakpoints(): ResponsiveBreakpoints {
    return { ...this.breakpoints };
  }

  /**
   * Verifica si el sidebar debe estar colapsado automáticamente
   */
  public shouldAutoCollapse(state?: ResponsiveState): boolean {
    const currentState = state || this.responsiveStateSubject.value;
    return currentState.isMobile;
  }

  /**
   * Obtiene el estado responsivo actual
   */
  public getCurrentState(): ResponsiveState {
    return this.responsiveStateSubject.value;
  }

  /**
   * Verifica si el dispositivo soporta interacción táctil
   */
  public isTouchDevice(): boolean {
    return this.responsiveStateSubject.value.touchEnabled;
  }

  /**
   * Obtiene el tamaño de pantalla actual
   */
  public getScreenSize(): 'mobile' | 'tablet' | 'desktop' {
    const state = this.responsiveStateSubject.value;
    if (state.isMobile) return 'mobile';
    if (state.isTablet) return 'tablet';
    return 'desktop';
  }
}