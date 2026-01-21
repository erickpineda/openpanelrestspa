# Optimización de Rendimiento y Arranque

## Resumen de Cambios

Se ha realizado una auditoría y optimización del rendimiento de inicio de la aplicación, enfocándose en la reducción del tamaño del bundle inicial (main.js) y la gestión eficiente de la carga de recursos.

### 1. Reducción del Bundle Inicial
**Problema Detectado:**
El módulo `SharedOPModule` (importado en `AppModule` y cargado ansiosamente) exportaba `SharedWidgetsModule`, el cual a su vez importaba `ChartjsModule`. Esto causaba que la librería Chart.js y todos los widgets de dashboard se incluyeran en el bundle inicial de la aplicación, incluso si el usuario solo visitaba la página de login o una página pública.

**Solución Implementada:**
- Se eliminó `SharedWidgetsModule` de los `exports` de `SharedOPModule`.
- Se añadió la importación explícita de `SharedWidgetsModule` solo en los módulos que realmente lo necesitan:
  - `DashboardFeatureModule`
  - `EntradasSharedModule`
  - `GestionFeatureModule`
  - `BaseModule`
  - `ComentariosFeatureModule`, `CategoriasFeatureModule`, `PaginasFeatureModule` (ya lo tenían)

**Resultado:**
El bundle inicial es ahora significativamente más ligero, ya que `Chart.js` y componentes pesados se cargan solo cuando se accede al Dashboard o módulos administrativos específicos (Lazy Loading real).

### 2. Estrategia de Preloading Optimizada
**Problema Detectado:**
La configuración de `preload` en `BaseRoutingModule` era demasiado agresiva, comenzando a precargar módulos pesados (Entradas, Páginas, Configuración) apenas 1 segundo después de la carga inicial. Esto podía competir con recursos críticos de red durante el inicio de sesión o la renderización inicial del Dashboard.

**Solución Implementada:**
Se han ajustado los tiempos de `delay` en `BaseRoutingModule` para escalonar la carga de módulos secundarios y reducir la congestión de red:
- **Entradas:** 1s -> 3s
- **Páginas:** 1.1s -> 4s
- **Contenido:** 1.4s -> 5s
- **Gestión:** 1.6s -> 6s
- **Comentarios:** -> 6.5s
- **Etiquetas:** 1.8s -> 7s
- **Categorías:** -> 7.5s
- **Configuración:** 1.2s -> 8s
- **Perfil y Mantenimiento:** Se eliminó el preloading (carga bajo demanda) para ahorrar recursos.

### 3. Métricas de Inicio
Se ha añadido un log de rendimiento en `main.ts` que muestra en la consola el tiempo exacto de bootstrap de la aplicación:
`🚀 Application bootstrapped in X.XXms`

## Guía para el Futuro

### Reglas para Módulos Compartidos
1. **SharedOPModule (Light):** Debe contener solo componentes UI básicos (botones, inputs, alertas), pipes y directivas que se usen en *toda* la aplicación. No importar librerías pesadas aquí.
2. **Feature Modules:** Si una librería (como Chart.js, CKEditor, Mapas) se usa solo en una feature, impórtala solo en el módulo de esa feature.
3. **SharedWidgetsModule (Heavy):** Si necesitas compartir componentes complejos (Widgets, Gráficos), úsalos en un módulo compartido específico (como `SharedWidgetsModule`) pero **NO** lo exportes en el `SharedOPModule` global. Impórtalo explícitamente donde se necesite.

### Lazy Loading
- Mantener la arquitectura actual donde cada sección de Admin es un módulo lazy loaded.
- Usar `CustomPreloadingStrategyService` con sensatez: priorizar lo que el usuario usa el 80% del tiempo (ej. Entradas) y retrasar o no precargar lo que usa el 5% (ej. Configuración, Logs).
