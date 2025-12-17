import { TestBed } from '@angular/core/testing';
import { NavigationAnimationService, AnimationConfig, NavigationAnimationType } from './navigation-animation.service';

describe('NavigationAnimationService', () => {
  let service: NavigationAnimationService;
  let mockElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavigationAnimationService);
    
    // Crear elemento mock para pruebas
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    // Limpiar elemento mock
    if (mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
    service.clearAllAnimations();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Basic Animation', () => {
    it('should apply animation classes to element', async () => {
      const config: AnimationConfig = {
        type: 'fade-in-up',
        duration: 300
      };

      const animationPromise = service.animate(mockElement, config);
      
      expect(mockElement.classList.contains('nav-animate')).toBe(true);
      expect(mockElement.classList.contains('fade-in-up')).toBe(true);
      
      // Simular fin de animación
      mockElement.dispatchEvent(new Event('animationend'));
      
      await animationPromise;
      expect(service.hasActiveAnimation(mockElement)).toBe(false);
    });

    it('should handle animation duration', async () => {
      const config: AnimationConfig = {
        type: 'bounce-in',
        duration: 600
      };

      await service.animate(mockElement, config);
      
      const computedStyle = getComputedStyle(mockElement);
      expect(mockElement.style.getPropertyValue('--nav-transition-duration')).toBe('600ms');
    });

    it('should apply timing classes correctly', async () => {
      const fastConfig: AnimationConfig = {
        type: 'scale-in',
        duration: 100
      };

      await service.animate(mockElement, fastConfig);
      expect(mockElement.classList.contains('fast')).toBe(true);
    });

    it('should apply easing classes correctly', async () => {
      const config: AnimationConfig = {
        type: 'slide-in-left',
        easing: 'bounce'
      };

      await service.animate(mockElement, config);
      expect(mockElement.classList.contains('bounce')).toBe(true);
    });
  });

  describe('Animation Events', () => {
    it('should emit animation start and end events', (done) => {
      const config: AnimationConfig = {
        type: 'pulse',
        duration: 300
      };

      const events: any[] = [];
      
      service.animationEvents$.subscribe(event => {
        events.push(event);
        
        if (events.length === 2) {
          expect(events[0].phase).toBe('start');
          expect(events[1].phase).toBe('end');
          expect(events[0].type).toBe('pulse');
          expect(events[1].type).toBe('pulse');
          done();
        }
      });

      service.animate(mockElement, config).then(() => {
        // Simular fin de animación
        mockElement.dispatchEvent(new Event('animationend'));
      });
    });
  });

  describe('Multiple Animations', () => {
    it('should animate elements in sequence', async () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);

      const animations = [
        { element: element1, config: { type: 'fade-in-up' as NavigationAnimationType, duration: 200 } },
        { element: element2, config: { type: 'fade-in-down' as NavigationAnimationType, duration: 200 } }
      ];

      const startTime = Date.now();
      
      const sequencePromise = service.animateSequence(animations);
      
      // Simular eventos de animación
      setTimeout(() => element1.dispatchEvent(new Event('animationend')), 100);
      setTimeout(() => element2.dispatchEvent(new Event('animationend')), 300);
      
      await sequencePromise;
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThan(300); // Secuencial

      // Limpiar
      document.body.removeChild(element1);
      document.body.removeChild(element2);
    });

    it('should animate elements in parallel', async () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);

      const animations = [
        { element: element1, config: { type: 'scale-in' as NavigationAnimationType, duration: 200 } },
        { element: element2, config: { type: 'scale-out' as NavigationAnimationType, duration: 200 } }
      ];

      const startTime = Date.now();
      
      const parallelPromise = service.animateParallel(animations);
      
      // Simular eventos de animación simultáneos
      setTimeout(() => {
        element1.dispatchEvent(new Event('animationend'));
        element2.dispatchEvent(new Event('animationend'));
      }, 100);
      
      await parallelPromise;
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(300); // Paralelo

      // Limpiar
      document.body.removeChild(element1);
      document.body.removeChild(element2);
    });

    it('should animate elements with stagger', async () => {
      const elements = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div')
      ];
      
      elements.forEach(el => document.body.appendChild(el));

      const config: AnimationConfig = {
        type: 'bounce-in',
        duration: 200
      };

      const staggerPromise = service.animateStagger(elements, config, 100);
      
      // Simular eventos de animación escalonados
      setTimeout(() => elements[0].dispatchEvent(new Event('animationend')), 100);
      setTimeout(() => elements[1].dispatchEvent(new Event('animationend')), 200);
      setTimeout(() => elements[2].dispatchEvent(new Event('animationend')), 300);
      
      await staggerPromise;
      
      // Limpiar
      elements.forEach(el => document.body.removeChild(el));
    });
  });

  describe('Animation Control', () => {
    it('should clear animations from element', async () => {
      const config: AnimationConfig = {
        type: 'glow',
        infinite: true
      };

      await service.animate(mockElement, config);
      expect(service.hasActiveAnimation(mockElement)).toBe(true);
      
      service.clearAnimation(mockElement);
      expect(service.hasActiveAnimation(mockElement)).toBe(false);
      expect(mockElement.classList.contains('nav-animate')).toBe(false);
    });

    it('should pause and resume animations', async () => {
      const config: AnimationConfig = {
        type: 'pulse',
        infinite: true
      };

      await service.animate(mockElement, config);
      
      service.pauseAnimation(mockElement);
      expect(mockElement.style.animationPlayState).toBe('paused');
      
      service.resumeAnimation(mockElement);
      expect(mockElement.style.animationPlayState).toBe('running');
    });

    it('should track active animations', async () => {
      const config: AnimationConfig = {
        type: 'shake',
        duration: 500
      };

      const animationPromise = service.animate(mockElement, config);
      
      expect(service.hasActiveAnimation(mockElement)).toBe(true);
      expect(service.getActiveAnimationType(mockElement)).toBe('shake');
      
      // Simular fin de animación
      mockElement.dispatchEvent(new Event('animationend'));
      await animationPromise;
      
      expect(service.hasActiveAnimation(mockElement)).toBe(false);
      expect(service.getActiveAnimationType(mockElement)).toBeNull();
    });
  });

  describe('Convenience Methods', () => {
    it('should animate nav item enter', async () => {
      const promise = service.animateNavItemEnter(mockElement, 100);
      
      expect(mockElement.classList.contains('fade-in-up')).toBe(true);
      
      // Simular fin de animación
      setTimeout(() => mockElement.dispatchEvent(new Event('animationend')), 50);
      await promise;
    });

    it('should animate nav item leave', async () => {
      const promise = service.animateNavItemLeave(mockElement);
      
      expect(mockElement.classList.contains('fade-in-down')).toBe(true);
      
      // Simular fin de animación
      setTimeout(() => mockElement.dispatchEvent(new Event('animationend')), 50);
      await promise;
    });

    it('should animate badge update', async () => {
      const promise = service.animateBadgeUpdate(mockElement);
      
      expect(mockElement.classList.contains('bounce-in')).toBe(true);
      
      // Simular fin de animación
      setTimeout(() => mockElement.dispatchEvent(new Event('animationend')), 50);
      await promise;
    });

    it('should animate badge pulse', async () => {
      const promise = service.animateBadgePulse(mockElement);
      
      expect(mockElement.classList.contains('pulse')).toBe(true);
      
      // Para animaciones infinitas, limpiar manualmente
      service.clearAnimation(mockElement);
    });

    it('should animate mobile sidebar open/close', async () => {
      // Test open
      let promise = service.animateMobileSidebarOpen(mockElement);
      expect(mockElement.classList.contains('slide-in-left')).toBe(true);
      
      setTimeout(() => mockElement.dispatchEvent(new Event('animationend')), 50);
      await promise;
      
      // Test close
      promise = service.animateMobileSidebarClose(mockElement);
      expect(mockElement.classList.contains('slide-out-left')).toBe(true);
      
      setTimeout(() => mockElement.dispatchEvent(new Event('animationend')), 50);
      await promise;
    });

    it('should animate loading shimmer', async () => {
      const promise = service.animateLoadingShimmer(mockElement);
      
      expect(mockElement.classList.contains('shimmer')).toBe(true);
      
      // Para animaciones infinitas, limpiar manualmente
      service.clearAnimation(mockElement);
    });

    it('should animate error and success states', async () => {
      // Test error
      let promise = service.animateError(mockElement);
      expect(mockElement.classList.contains('shake')).toBe(true);
      
      setTimeout(() => mockElement.dispatchEvent(new Event('animationend')), 50);
      await promise;
      
      // Test success
      promise = service.animateSuccess(mockElement);
      expect(mockElement.classList.contains('glow')).toBe(true);
      
      setTimeout(() => mockElement.dispatchEvent(new Event('animationend')), 50);
      await promise;
    });
  });

  describe('Edge Cases', () => {
    it('should handle animation without duration', async () => {
      const config: AnimationConfig = {
        type: 'scale-in'
      };

      const promise = service.animate(mockElement, config);
      
      // Simular fin de animación
      setTimeout(() => mockElement.dispatchEvent(new Event('animationend')), 50);
      await promise;
      
      expect(mockElement.style.getPropertyValue('--nav-transition-duration')).toBe('');
    });

    it('should handle multiple animations on same element', async () => {
      const config1: AnimationConfig = { type: 'fade-in-up', duration: 200 };
      const config2: AnimationConfig = { type: 'bounce-in', duration: 300 };

      // Primera animación
      const promise1 = service.animate(mockElement, config1);
      expect(service.getActiveAnimationType(mockElement)).toBe('fade-in-up');
      
      // Segunda animación (debería limpiar la primera)
      const promise2 = service.animate(mockElement, config2);
      expect(service.getActiveAnimationType(mockElement)).toBe('bounce-in');
      expect(mockElement.classList.contains('fade-in-up')).toBe(false);
      
      // Simular fin de segunda animación
      setTimeout(() => mockElement.dispatchEvent(new Event('animationend')), 50);
      await promise2;
    });

    it('should handle clearing all animations', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);

      // Aplicar animaciones a múltiples elementos
      service.animate(element1, { type: 'pulse', infinite: true });
      service.animate(element2, { type: 'glow', infinite: true });

      expect(service.hasActiveAnimation(element1)).toBe(true);
      expect(service.hasActiveAnimation(element2)).toBe(true);

      // Limpiar todas
      service.clearAllAnimations();

      expect(service.hasActiveAnimation(element1)).toBe(false);
      expect(service.hasActiveAnimation(element2)).toBe(false);

      // Limpiar DOM
      document.body.removeChild(element1);
      document.body.removeChild(element2);
    });
  });

  describe('Performance', () => {
    it('should handle large number of animations efficiently', async () => {
      const elements: HTMLElement[] = [];
      
      // Crear muchos elementos
      for (let i = 0; i < 50; i++) {
        const el = document.createElement('div');
        document.body.appendChild(el);
        elements.push(el);
      }

      const startTime = performance.now();
      
      // Animar todos en paralelo
      const animations = elements.map(el => ({
        element: el,
        config: { type: 'fade-in-up' as NavigationAnimationType, duration: 100 }
      }));

      const promise = service.animateParallel(animations);
      
      // Simular fin de todas las animaciones
      setTimeout(() => {
        elements.forEach(el => el.dispatchEvent(new Event('animationend')));
      }, 50);
      
      await promise;
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Menos de 1 segundo

      // Limpiar
      elements.forEach(el => document.body.removeChild(el));
    });
  });
});