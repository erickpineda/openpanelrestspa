import {
  Injectable,
  ElementRef,
  Renderer2,
  RendererFactory2,
} from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';

/**
 * Tipos de animaciones disponibles
 */
export type NavigationAnimationType =
  | 'slide-in-left'
  | 'slide-out-left'
  | 'fade-in-up'
  | 'fade-in-down'
  | 'scale-in'
  | 'scale-out'
  | 'bounce-in'
  | 'pulse'
  | 'shake'
  | 'glow'
  | 'shimmer';

/**
 * Configuración de animación
 */
export interface AnimationConfig {
  type: NavigationAnimationType;
  duration?: number;
  delay?: number;
  easing?:
    | 'ease'
    | 'ease-in'
    | 'ease-out'
    | 'ease-in-out'
    | 'bounce'
    | 'elastic';
  infinite?: boolean;
}

/**
 * Evento de animación
 */
export interface AnimationEvent {
  element: HTMLElement;
  type: NavigationAnimationType;
  phase: 'start' | 'end';
}

/**
 * Servicio para gestionar animaciones de navegación de forma programática
 */
@Injectable({
  providedIn: 'root',
})
export class NavigationAnimationService {
  private renderer: Renderer2;
  private animationEvents = new Subject<AnimationEvent>();
  private activeAnimations = new Map<HTMLElement, string>();

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  /**
   * Observable para eventos de animación
   */
  get animationEvents$(): Observable<AnimationEvent> {
    return this.animationEvents.asObservable();
  }

  /**
   * Aplica una animación a un elemento
   */
  animate(element: HTMLElement, config: AnimationConfig): Promise<void> {
    return new Promise((resolve) => {
      // Limpiar animaciones previas
      this.clearAnimation(element);

      // Configurar clases CSS
      const animationClass = `nav-animate ${config.type}`;
      const timingClass = this.getTimingClass(config.duration);
      const easingClass = this.getEasingClass(config.easing);

      // Aplicar clases
      this.renderer.addClass(element, 'nav-animate');
      this.renderer.addClass(element, config.type);

      if (timingClass) {
        this.renderer.addClass(element, timingClass);
      }

      if (easingClass) {
        this.renderer.addClass(element, easingClass);
      }

      // Configurar variables CSS personalizadas
      if (config.duration) {
        element.style.setProperty(
          '--nav-transition-duration',
          `${config.duration}ms`,
        );
      }

      // Registrar animación activa
      this.activeAnimations.set(element, config.type);

      // Emitir evento de inicio
      this.animationEvents.next({
        element,
        type: config.type,
        phase: 'start',
      });

      // Manejar delay si existe
      const delay = config.delay || 0;
      const duration = config.duration || 300;

      timer(delay).subscribe(() => {
        // Listener para el final de la animación
        const animationEndHandler = () => {
          if (!config.infinite) {
            this.clearAnimation(element);
          }

          // Emitir evento de fin
          this.animationEvents.next({
            element,
            type: config.type,
            phase: 'end',
          });

          element.removeEventListener('animationend', animationEndHandler);
          resolve();
        };

        element.addEventListener('animationend', animationEndHandler);

        // Fallback timeout por si la animación no dispara el evento
        timer(duration + 100).subscribe(() => {
          if (this.activeAnimations.has(element)) {
            animationEndHandler();
          }
        });
      });
    });
  }

  /**
   * Anima múltiples elementos en secuencia
   */
  animateSequence(
    animations: { element: HTMLElement; config: AnimationConfig }[],
  ): Promise<void> {
    return animations.reduce((promise, { element, config }) => {
      return promise.then(() => this.animate(element, config));
    }, Promise.resolve());
  }

  /**
   * Anima múltiples elementos en paralelo
   */
  animateParallel(
    animations: { element: HTMLElement; config: AnimationConfig }[],
  ): Promise<void[]> {
    const promises = animations.map(({ element, config }) =>
      this.animate(element, config),
    );
    return Promise.all(promises);
  }

  /**
   * Anima elementos con stagger (escalonado)
   */
  animateStagger(
    elements: HTMLElement[],
    config: AnimationConfig,
    staggerDelay: number = 100,
  ): Promise<void[]> {
    const animations = elements.map((element, index) => ({
      element,
      config: {
        ...config,
        delay: (config.delay || 0) + index * staggerDelay,
      },
    }));

    return this.animateParallel(animations);
  }

  /**
   * Limpia todas las animaciones de un elemento
   */
  clearAnimation(element: HTMLElement): void {
    // Remover clases de animación
    const animationClasses = [
      'nav-animate',
      'slide-in-left',
      'slide-out-left',
      'fade-in-up',
      'fade-in-down',
      'scale-in',
      'scale-out',
      'bounce-in',
      'pulse',
      'shake',
      'glow',
      'shimmer',
      'nav-timing',
      'fast',
      'slow',
      'instant',
      'nav-easing',
      'ease-in',
      'ease-out',
      'ease-in-out',
      'bounce',
      'elastic',
    ];

    animationClasses.forEach((className) => {
      this.renderer.removeClass(element, className);
    });

    // Limpiar estilos personalizados
    element.style.removeProperty('--nav-transition-duration');
    element.style.removeProperty('--nav-transition-easing');

    // Remover de animaciones activas
    this.activeAnimations.delete(element);
  }

  /**
   * Pausa una animación
   */
  pauseAnimation(element: HTMLElement): void {
    this.renderer.setStyle(element, 'animation-play-state', 'paused');
  }

  /**
   * Reanuda una animación pausada
   */
  resumeAnimation(element: HTMLElement): void {
    this.renderer.setStyle(element, 'animation-play-state', 'running');
  }

  /**
   * Verifica si un elemento tiene animaciones activas
   */
  hasActiveAnimation(element: HTMLElement): boolean {
    return this.activeAnimations.has(element);
  }

  /**
   * Obtiene el tipo de animación activa de un elemento
   */
  getActiveAnimationType(element: HTMLElement): NavigationAnimationType | null {
    return (
      (this.activeAnimations.get(element) as NavigationAnimationType) || null
    );
  }

  /**
   * Limpia todas las animaciones activas
   */
  clearAllAnimations(): void {
    this.activeAnimations.forEach((_, element) => {
      this.clearAnimation(element);
    });
  }

  // Métodos de conveniencia para animaciones comunes

  /**
   * Anima la entrada de un elemento de navegación
   */
  animateNavItemEnter(element: HTMLElement, delay: number = 0): Promise<void> {
    return this.animate(element, {
      type: 'fade-in-up',
      duration: 400,
      delay,
      easing: 'ease-out',
    });
  }

  /**
   * Anima la salida de un elemento de navegación
   */
  animateNavItemLeave(element: HTMLElement): Promise<void> {
    return this.animate(element, {
      type: 'fade-in-down',
      duration: 300,
      easing: 'ease-in',
    });
  }

  /**
   * Anima la actualización de un badge
   */
  animateBadgeUpdate(element: HTMLElement): Promise<void> {
    return this.animate(element, {
      type: 'bounce-in',
      duration: 600,
      easing: 'bounce',
    });
  }

  /**
   * Anima el pulso de un badge con notificación
   */
  animateBadgePulse(element: HTMLElement): Promise<void> {
    return this.animate(element, {
      type: 'pulse',
      duration: 1000,
      infinite: true,
    });
  }

  /**
   * Anima la apertura del sidebar móvil
   */
  animateMobileSidebarOpen(element: HTMLElement): Promise<void> {
    return this.animate(element, {
      type: 'slide-in-left',
      duration: 300,
      easing: 'ease-out',
    });
  }

  /**
   * Anima el cierre del sidebar móvil
   */
  animateMobileSidebarClose(element: HTMLElement): Promise<void> {
    return this.animate(element, {
      type: 'slide-out-left',
      duration: 300,
      easing: 'ease-in',
    });
  }

  /**
   * Anima el estado de carga con shimmer
   */
  animateLoadingShimmer(element: HTMLElement): Promise<void> {
    return this.animate(element, {
      type: 'shimmer',
      duration: 1500,
      infinite: true,
    });
  }

  /**
   * Anima un error con shake
   */
  animateError(element: HTMLElement): Promise<void> {
    return this.animate(element, {
      type: 'shake',
      duration: 500,
    });
  }

  /**
   * Anima un éxito con glow
   */
  animateSuccess(element: HTMLElement): Promise<void> {
    return this.animate(element, {
      type: 'glow',
      duration: 1000,
    });
  }

  // Métodos privados

  /**
   * Obtiene la clase CSS para la duración
   */
  private getTimingClass(duration?: number): string | null {
    if (!duration) return null;

    if (duration <= 150) return 'fast';
    if (duration >= 600) return 'slow';
    if (duration === 0) return 'instant';

    return null;
  }

  /**
   * Obtiene la clase CSS para el easing
   */
  private getEasingClass(easing?: string): string | null {
    if (!easing || easing === 'ease') return null;

    const easingMap: { [key: string]: string } = {
      'ease-in': 'ease-in',
      'ease-out': 'ease-out',
      'ease-in-out': 'ease-in-out',
      bounce: 'bounce',
      elastic: 'elastic',
    };

    return easingMap[easing] || null;
  }
}
