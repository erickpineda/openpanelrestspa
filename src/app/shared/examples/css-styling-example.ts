/**
 * Ejemplos de uso de los estilos CSS optimizados para navegación
 *
 * Este archivo demuestra cómo utilizar las nuevas clases CSS y animaciones
 * implementadas en la Tarea 12 del proyecto de optimización del sidebar.
 */

/**
 * CLASES CSS PRINCIPALES IMPLEMENTADAS:
 *
 * 1. CONTENEDOR PRINCIPAL:
 *    - .optimized-navigation: Contenedor principal con animaciones
 *    - .optimized-navigation.entering: Animación de entrada
 *    - .optimized-navigation.exiting: Animación de salida
 *
 * 2. SECCIONES DE NAVEGACIÓN:
 *    - .nav-section: Contenedor de sección con espaciado
 *    - .nav-section-title: Título de sección con estilos mejorados
 *    - .nav-section-content: Contenido colapsable de sección
 *    - .nav-section-content.collapsed: Estado colapsado
 *    - .nav-section-content.expanded: Estado expandido
 *
 * 3. ELEMENTOS DE NAVEGACIÓN:
 *    - .nav-item-enhanced: Elemento de navegación mejorado
 *    - .nav-link: Link de navegación con efectos hover
 *    - .nav-link.active: Estado activo con indicador visual
 *    - .nav-icon: Icono con transformaciones en hover
 *    - .nav-text: Texto con transiciones suaves
 *
 * 4. BADGES DINÁMICOS:
 *    - .nav-badge: Badge base con gradientes
 *    - .nav-badge.badge-primary: Badge primario
 *    - .nav-badge.badge-warning: Badge de advertencia
 *    - .nav-badge.badge-danger: Badge de peligro
 *    - .nav-badge.badge-success: Badge de éxito
 *    - .nav-badge.badge-info: Badge informativo
 *    - .nav-badge.badge-secondary: Badge secundario
 *    - .nav-badge.updating: Badge con animación de actualización
 *    - .nav-badge.new-badge: Badge nuevo con animación de entrada
 *    - .nav-badge.zero-count: Badge oculto para contadores cero
 *
 * 5. ACCIONES CONTEXTUALES:
 *    - .nav-contextual-actions: Contenedor de acciones
 *    - .action-button: Botón de acción contextual
 *
 * 6. LAZY LOADING:
 *    - .nav-chunk: Contenedor de chunk
 *    - .nav-chunk.loading: Estado de carga con shimmer
 *    - .nav-chunk.loaded: Estado cargado con animación
 *
 * 7. RESPONSIVE:
 *    - Breakpoints automáticos para móvil, tablet y desktop
 *    - .critical-functions-bar: Barra de funciones críticas móvil
 *    - .critical-function: Función crítica individual
 *
 * 8. ANIMACIONES:
 *    - .nav-animate: Clase base para animaciones
 *    - .slide-in-left, .slide-out-left: Animaciones de deslizamiento
 *    - .fade-in-up, .fade-in-down: Animaciones de desvanecimiento
 *    - .scale-in, .scale-out: Animaciones de escala
 *    - .bounce-in: Animación de rebote
 *    - .pulse: Animación de pulso
 *    - .shake: Animación de temblor
 *    - .glow: Animación de brillo
 *    - .shimmer: Animación de shimmer para carga
 *
 * 9. ESTADOS DE ERROR:
 *    - .nav-error-state: Estado de error con botón de reintento
 *    - .nav-loading-skeleton: Esqueleto de carga
 *
 * 10. ACCESIBILIDAD:
 *     - Soporte para prefers-reduced-motion
 *     - Soporte para prefers-contrast: high
 *     - Targets táctiles de 44px mínimo
 *     - Indicadores de foco visibles
 */

export class CSSStyleExamples {
  /**
   * Ejemplo 1: Aplicar estilos básicos de navegación
   */
  static applyBasicNavigationStyles(): string {
    return `
      <!-- Contenedor principal -->
      <div class="optimized-navigation">
        
        <!-- Sección de navegación -->
        <div class="nav-section">
          <div class="nav-section-title">
            <i class="section-icon cil-speedometer"></i>
            Dashboard
            <i class="collapse-indicator cil-chevron-bottom"></i>
          </div>
          
          <div class="nav-section-content expanded">
            <!-- Elemento de navegación -->
            <div class="nav-item-enhanced">
              <a href="/admin/dashboard" class="nav-link active">
                <i class="nav-icon cil-speedometer"></i>
                <span class="nav-text">Escritorio Principal</span>
                <span class="nav-badge badge-info">Principal</span>
              </a>
            </div>
          </div>
        </div>
        
      </div>
    `;
  }

  /**
   * Ejemplo 2: Badges dinámicos con diferentes estados
   */
  static applyDynamicBadges(): string {
    return `
      <!-- Badges con diferentes colores y estados -->
      <div class="nav-item-enhanced">
        <a href="/admin/entradas" class="nav-link">
          <i class="nav-icon cil-pencil"></i>
          <span class="nav-text">Entradas</span>
          <span class="nav-badge badge-warning updating">5</span>
        </a>
      </div>
      
      <div class="nav-item-enhanced">
        <a href="/admin/comentarios" class="nav-link">
          <i class="nav-icon cil-comment-square"></i>
          <span class="nav-text">Comentarios</span>
          <span class="nav-badge badge-danger new-badge">12</span>
        </a>
      </div>
      
      <div class="nav-item-enhanced">
        <a href="/admin/usuarios" class="nav-link">
          <i class="nav-icon cil-people"></i>
          <span class="nav-text">Usuarios</span>
          <span class="nav-badge badge-success">3</span>
        </a>
      </div>
    `;
  }

  /**
   * Ejemplo 3: Navegación responsiva con funciones críticas
   */
  static applyResponsiveNavigation(): string {
    return `
      <!-- Navegación móvil -->
      <div class="optimized-navigation mobile-layout">
        <div class="nav-content">
          <!-- Contenido de navegación -->
        </div>
      </div>
      
      <!-- Barra de funciones críticas (solo móvil) -->
      <div class="critical-functions-bar">
        <a href="/admin/dashboard" class="critical-function active">
          <i class="critical-function-icon cil-speedometer"></i>
          <span class="critical-function-label">Dashboard</span>
        </a>
        
        <a href="/admin/entradas/crear" class="critical-function">
          <i class="critical-function-icon cil-plus"></i>
          <span class="critical-function-label">Nueva</span>
        </a>
        
        <a href="/admin/comentarios" class="critical-function">
          <i class="critical-function-icon cil-comment-square"></i>
          <span class="critical-function-label">Comentarios</span>
        </a>
      </div>
    `;
  }

  /**
   * Ejemplo 4: Animaciones y transiciones
   */
  static applyAnimations(): string {
    return `
      <!-- Elementos con animaciones -->
      <div class="nav-item-enhanced nav-animate fade-in-up">
        <a href="/admin/item1" class="nav-link">
          <i class="nav-icon cil-circle"></i>
          <span class="nav-text">Item con Fade In</span>
        </a>
      </div>
      
      <div class="nav-item-enhanced nav-animate bounce-in">
        <a href="/admin/item2" class="nav-link">
          <i class="nav-icon cil-star"></i>
          <span class="nav-text">Item con Bounce</span>
          <span class="nav-badge badge-success new-badge">Nuevo</span>
        </a>
      </div>
      
      <!-- Chunk con estado de carga -->
      <div class="nav-chunk loading">
        <div class="nav-item-enhanced">
          <div class="nav-link">
            <i class="nav-icon cil-circle"></i>
            <span class="nav-text">Cargando...</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Ejemplo 5: Estados de error y carga
   */
  static applyErrorAndLoadingStates(): string {
    return `
      <!-- Estado de error -->
      <div class="nav-error-state">
        <i class="error-icon cil-warning"></i>
        <div class="error-message">Error al cargar la navegación</div>
        <button class="retry-button">Reintentar</button>
      </div>
      
      <!-- Esqueleto de carga -->
      <div class="nav-loading-skeleton">
        <div class="nav-item-enhanced">
          <div class="nav-link">
            <div class="nav-icon"></div>
            <div class="nav-text">Cargando elemento...</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Ejemplo 6: Acciones contextuales
   */
  static applyContextualActions(): string {
    return `
      <div class="nav-item-enhanced">
        <a href="/admin/entradas" class="nav-link">
          <i class="nav-icon cil-pencil"></i>
          <span class="nav-text">Entradas</span>
          <span class="nav-badge badge-warning">5</span>
          
          <!-- Acciones contextuales (aparecen en hover) -->
          <div class="nav-contextual-actions">
            <button class="action-button" title="Crear nueva entrada">
              <i class="cil-plus"></i>
            </button>
            <button class="action-button" title="Configurar">
              <i class="cil-settings"></i>
            </button>
          </div>
        </a>
      </div>
    `;
  }

  /**
   * Ejemplo 7: Tema oscuro
   */
  static applyDarkTheme(): string {
    return `
      <!-- Para activar tema oscuro, agregar atributo al body o html -->
      <body data-coreui-theme="dark">
        <div class="optimized-navigation">
          <!-- Los estilos se adaptan automáticamente -->
          <div class="nav-section">
            <div class="nav-section-title">Sección Oscura</div>
            <div class="nav-section-content expanded">
              <div class="nav-item-enhanced">
                <a href="#" class="nav-link">
                  <i class="nav-icon cil-moon"></i>
                  <span class="nav-text">Modo Oscuro</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    `;
  }

  /**
   * Ejemplo 8: Personalización con variables CSS
   */
  static customizeWithCSSVariables(): string {
    return `
      <style>
        :root {
          /* Personalizar colores */
          --nav-item-hover-color: #28a745;
          --nav-active-bg: rgba(40, 167, 69, 0.15);
          
          /* Personalizar tiempos de transición */
          --nav-transition-duration: 0.5s;
          
          /* Personalizar espaciado */
          --nav-section-spacing: 2rem;
          --nav-item-spacing: 0.75rem;
          
          /* Personalizar badges */
          --nav-badge-size: 1.5rem;
          --nav-badge-font-size: 0.8rem;
        }
      </style>
      
      <div class="optimized-navigation">
        <!-- Los elementos usarán las variables personalizadas -->
      </div>
    `;
  }

  /**
   * Ejemplo 9: Integración con JavaScript/TypeScript
   */
  static integrateWithJavaScript(): string {
    return `
      // Aplicar animaciones dinámicamente
      const element = document.querySelector('.nav-item-enhanced');
      
      // Agregar animación
      element.classList.add('nav-animate', 'bounce-in');
      
      // Escuchar fin de animación
      element.addEventListener('animationend', () => {
        element.classList.remove('nav-animate', 'bounce-in');
      });
      
      // Actualizar badge dinámicamente
      const badge = element.querySelector('.nav-badge');
      badge.textContent = '10';
      badge.classList.add('updating');
      
      setTimeout(() => {
        badge.classList.remove('updating');
      }, 1000);
      
      // Cambiar estado de sección
      const section = document.querySelector('.nav-section-content');
      section.classList.toggle('collapsed');
      section.classList.toggle('expanded');
    `;
  }

  /**
   * Ejemplo 10: Mejores prácticas de implementación
   */
  static bestPractices(): string {
    return `
      <!-- MEJORES PRÁCTICAS: -->
      
      <!-- 1. Usar clases semánticas -->
      <div class="nav-section" role="navigation" aria-label="Gestión de Contenido">
        
        <!-- 2. Incluir atributos de accesibilidad -->
        <button class="nav-section-title" 
                aria-expanded="true" 
                aria-controls="content-section">
          <span>Gestión de Contenido</span>
          <i class="collapse-indicator cil-chevron-bottom" aria-hidden="true"></i>
        </button>
        
        <div class="nav-section-content expanded" 
             id="content-section" 
             aria-labelledby="content-title">
          
          <!-- 3. Usar targets táctiles adecuados -->
          <div class="nav-item-enhanced">
            <a href="/admin/entradas" 
               class="nav-link" 
               aria-describedby="entradas-badge">
              <i class="nav-icon cil-pencil" aria-hidden="true"></i>
              <span class="nav-text">Entradas</span>
              <span class="nav-badge badge-warning" 
                    id="entradas-badge" 
                    aria-label="5 entradas pendientes">5</span>
            </a>
          </div>
          
        </div>
      </div>
      
      <!-- 4. Proporcionar alternativas para animaciones -->
      <style>
        @media (prefers-reduced-motion: reduce) {
          .nav-animate {
            animation: none !important;
            transition: none !important;
          }
        }
      </style>
      
      <!-- 5. Asegurar contraste adecuado -->
      <style>
        @media (prefers-contrast: high) {
          .nav-link {
            border: 1px solid currentColor;
          }
          
          .nav-badge {
            border: 2px solid currentColor;
          }
        }
      </style>
    `;
  }
}

/**
 * VARIABLES CSS DISPONIBLES PARA PERSONALIZACIÓN:
 *
 * --nav-transition-duration: Duración de transiciones (default: 0.3s)
 * --nav-transition-easing: Función de easing (default: cubic-bezier(0.4, 0, 0.2, 1))
 * --nav-section-spacing: Espaciado entre secciones (default: 1.5rem)
 * --nav-item-spacing: Espaciado entre elementos (default: 0.5rem)
 * --nav-badge-size: Tamaño de badges (default: 1.25rem)
 * --nav-badge-font-size: Tamaño de fuente de badges (default: 0.75rem)
 * --nav-group-border-radius: Radio de borde de grupos (default: 0.5rem)
 * --nav-hover-bg: Color de fondo en hover (default: rgba(0, 123, 255, 0.1))
 * --nav-active-bg: Color de fondo activo (default: rgba(0, 123, 255, 0.15))
 * --nav-section-title-color: Color de títulos de sección (default: #6c757d)
 * --nav-item-color: Color de elementos (default: #495057)
 * --nav-item-hover-color: Color de elementos en hover (default: #007bff)
 * --nav-shadow-light: Sombra ligera (default: 0 2px 4px rgba(0, 0, 0, 0.1))
 * --nav-shadow-medium: Sombra media (default: 0 4px 8px rgba(0, 0, 0, 0.15))
 */

/**
 * BREAKPOINTS RESPONSIVOS:
 *
 * Móvil: max-width: 575.98px
 * - Navegación de ancho completo
 * - Elementos táctiles más grandes
 * - Barra de funciones críticas visible
 * - Acciones contextuales ocultas
 *
 * Tablet: 576px - 767.98px
 * - Elementos optimizados para touch
 * - Navegación colapsable
 * - Barra de funciones críticas visible
 *
 * Tablet Grande: 768px - 991.98px
 * - Navegación compacta
 * - Sin barra de funciones críticas
 * - Hover effects habilitados
 *
 * Desktop: 992px+
 * - Navegación completa
 * - Todos los efectos visuales
 * - Tooltips disponibles
 * - Transformaciones en hover más pronunciadas
 */
