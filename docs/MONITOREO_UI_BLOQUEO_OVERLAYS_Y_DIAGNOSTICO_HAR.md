# Monitoreo de UI bloqueada por overlays/backdrops y diagnóstico con HAR

## 1) Objetivo y alcance

Este documento describe el funcionamiento y el uso operativo de las siguientes características introducidas para diagnosticar y mitigar el estado anómalo de interfaz en el que la pantalla queda “seminegra” y la interacción con la UI queda bloqueada sin errores visibles en consola:

- Monitor de anomalías UI (watchdog) para detectar y recuperar bloqueos causados por overlays/backdrops huérfanos.
- Captura de evidencias (snapshots) del estado del DOM/CSS y métricas de rendimiento (hilo principal).
- Análisis del HAR (tráfico de red) para identificar fallos y latencias de recursos (JS/CSS/fonts) que pueden correlacionar con el bloqueo.
- Herramientas de diagnóstico accesibles desde el panel de mantenimiento.

El objetivo es:

- Reducir el impacto (desbloqueo automático cuando sea seguro).
- Capturar evidencias cuando ocurre el problema para poder corregir la causa raíz.
- Proveer procedimientos consistentes de diagnóstico y troubleshooting.

## 2) Componentes implicados (visión técnica)

### 2.1 Monitor de anomalías UI

**Archivo:** `src/app/core/services/ui/ui-anomaly-monitor.service.ts`

Responsabilidades:

- Detectar elementos “blockers” que cubren la mayor parte del viewport y capturan eventos (pointer-events activos).
- Diferenciar entre un overlay legítimo (modal/offcanvas abierto) y un overlay huérfano.
- Capturar un snapshot con información útil para investigación.
- Ejecutar una recuperación no destructiva cuando no hay diálogo abierto (eliminación de backdrops huérfanos + limpieza del estado del `body`).

Activación:

- Se inicializa al arrancar la app desde `src/app/app.component.ts` mediante `uiMonitor.start()`.

Disparadores de escaneo:

- Tras navegación completada (`NavigationEnd`).
- Periódicamente (configurable; por defecto ~1500ms).
- Manualmente desde consola (ver sección 4.4).

### 2.2 Recolección de métricas del hilo principal (Long Tasks)

El monitor intenta instalar `PerformanceObserver` para `entryTypes: ['longtask']`:

- Cuenta tareas largas.
- Acumula tiempo total.
- Registra la duración máxima observada.

Estas métricas ayudan a detectar congelaciones del hilo principal que pueden dejar la UI en un estado incoherente sin “errores”.

### 2.3 Captura de errores de recursos (resource errors)

Se engancha un listener a `window.addEventListener('error', ..., true)` para capturar errores de carga de recursos (ej.: `<script src=...>` fallido, `<link href=...>` fallido, etc.). Esto es especialmente relevante cuando:

- Un JS crítico no carga y deja overlays sin cerrar.
- Un CSS crítico no carga y deja la UI visualmente “apagada”.

### 2.4 Persistencia de evidencias (snapshots)

Persistencia:

- `localStorage['op_ui_anomaly_snapshots_v1']` guarda una lista de snapshots (máx. 20).
- `window.__OP_UI_ANOMALY__` expone el último snapshot capturado.

El snapshot incluye:

- URL y viewport.
- `body.className` y estilos relevantes (`overflow`, `paddingRight`).
- Blockers detectados con: clases, id, z-index, opacity, pointer-events, bounding rect.
- Estado del loader global (si disponible).
- Métricas de long tasks.
- Errores recientes de recursos.

### 2.5 Diagnóstico desde “Dev Tools” (Mantenimiento)

**Ruta UI:** `/#/admin/control/mantenimiento/dev-tools`

**Archivos:**

- `src/app/admin/base/mantenimiento/dev-tools/dev-tools.component.ts`
- `src/app/admin/base/mantenimiento/dev-tools/dev-tools.component.html`

Incluye dos utilidades clave:

1. **Análisis de HAR (red):** permite pegar el contenido JSON del HAR y obtener un resumen de fallos (status 0/4xx/5xx), recursos lentos (≥ 2000ms) y un conteo de fallos en assets críticos (JS/CSS/fonts).
2. **Visor de snapshots UI:** carga y muestra el contenido persistido en `localStorage['op_ui_anomaly_snapshots_v1']` para facilitar el “copiar/pegar” hacia tickets o revisiones internas.

### 2.6 Loader global y red (contexto)

Aunque el problema se manifiesta visualmente como “pantalla seminegra”, existen dos elementos de contexto que pueden influir y deben considerarse en el diagnóstico:

- **Loader global:** `src/app/core/services/ui/loading.service.ts` mantiene un contador de peticiones activas y expone estadísticas (`getLoadingStats`). Un contador desbalanceado (incrementos sin decremento) puede dejar un overlay de carga activo si existe UI que lo renderiza.
- **Intercepción de red:** `src/app/core/interceptor/network.interceptor.ts` inicia y detiene el loader global en `finalize()`. Si hay flujos fuera del `HttpClient` (p. ej. fetch nativo, recursos estáticos, o lógica UI) el loader puede no reflejarlo.

## 3) Funcionamiento detallado (técnico)

### 3.1 Detección de bloqueo por overlays/backdrops

El monitor considera candidatos típicos de bloqueo de interacción:

- `.modal-backdrop` (Bootstrap/CoreUI)
- `.offcanvas-backdrop` (Bootstrap/CoreUI)
- `.c-backdrop`, `.c-modal-backdrop`, `.c-offcanvas-backdrop` (CoreUI)
- `.mobile-overlay` (overlay del sidebar móvil)
- `.loading-overlay.full-screen` (loader global a pantalla completa)

Heurística principal:

- El elemento debe estar visible (`display != none`, `visibility != hidden`).
- Debe capturar eventos (`pointer-events != none`).
- Debe cubrir un área significativa del viewport (configurable vía `viewportCoverageThreshold`, por defecto ≥ 80%).
- Debe tener opacidad efectiva (descarta opacidad ≤ 0.05).

Esto evita falsos positivos como overlays “ocultos” o presentes en el DOM sin impacto real.

### 3.2 Diferenciación entre overlay legítimo y overlay huérfano

Antes de aplicar recuperación, el monitor valida si hay un diálogo u offcanvas realmente abierto:

- `.modal.show`
- `.offcanvas.show`
- `[role="dialog"][aria-modal="true"]`

Si existe un diálogo abierto, **no** elimina backdrops para no romper una interacción legítima.

### 3.3 Captura de snapshot (evidencia)

Cuando detecta un bloqueo candidato y considera segura la recuperación:

- Construye un snapshot con la estructura `UiAnomalySnapshot`.
- Lo persiste en `localStorage` (máximo 20).
- Expone el último snapshot en `window.__OP_UI_ANOMALY__`.
- Emite un `warn` en logs con el snapshot como payload.

Campos recomendados a revisar dentro del snapshot:

- `blockers[]`: clases, `zIndex`, `opacity`, `pointerEvents` y `rect`.
- `body`: `className`, `overflow`, `paddingRight`.
- `loading`: contador de requests del loader global.
- `recentResourceErrors`: evidencia de fallos de assets.
- `longTasks`: correlación con congelaciones del hilo principal.

### 3.4 Recuperación automática (unlock)

La recuperación está diseñada para ser conservadora:

- Elimina nodos de backdrop conocidos (`.modal-backdrop`, `.offcanvas-backdrop`, `.c-backdrop`, etc.).
- Limpia el estado del `body` asociado a modales:
  - `body.classList.remove('modal-open')`
  - `body.style.overflow = ''`
  - `body.style.paddingRight = ''`

No intenta “cerrar” componentes de Angular ni disparar eventos de UI; busca únicamente eliminar el bloqueo que impide interacción.

### 3.5 Interacción manual para diagnóstico

Al arrancar, el monitor expone helpers en `window.OPDebug.uiAnomaly`:

- `scan()`: fuerza un escaneo y aplica recuperación si procede.
- `getConfig()`: devuelve la configuración efectiva del monitor.
- `setConfig(partialConfig)`: aplica cambios de configuración.
- `getSnapshots()`: devuelve la lista de snapshots persistidos.
- `clearSnapshots()`: borra snapshots del `localStorage`.

Ejemplo en consola:

```js
OPDebug.uiAnomaly.scan();
OPDebug.uiAnomaly.getConfig();
OPDebug.uiAnomaly.setConfig({ enabled: false });
OPDebug.uiAnomaly.getSnapshots();
```

### 3.6 Configuración (check parametrizable)

Parámetros configurables (con valores por defecto):

- `enabled` (`boolean`, por defecto `false`): activa/desactiva el escaneo automático.
- `scanIntervalMs` (`number`, por defecto `1500`): intervalo del escaneo periódico.
- `viewportCoverageThreshold` (`number`, por defecto `0.8`): umbral de cobertura del viewport para considerar un elemento como bloqueante.

Persistencia:

- La configuración se guarda en `localStorage['op_ui_anomaly_monitor_config_v1']`.
- Los cambios pueden aplicarse desde:
  - `Dev Tools` (sección “Monitor de bloqueo UI”).
  - Consola con `OPDebug.uiAnomaly.setConfig(...)`.

## 4) Requisitos previos

### 4.1 Requisitos de runtime

- Navegador con soporte de:
  - `localStorage` (para persistir snapshots).
  - `getComputedStyle` y `getBoundingClientRect` (para la heurística).
- `PerformanceObserver` es opcional; si no existe, simplemente no se registran long tasks.

### 4.2 Requisitos de integración en Angular

- El servicio debe inicializarse en el arranque de la app (`AppComponent`), actualmente en:
  - `src/app/app.component.ts`
- Debe existir `Router` activo (la app usa `useHash: true`).

### 4.3 Requisitos de UI para HAR/Snapshots (Dev Tools)

- La ruta `/#/admin/control/mantenimiento/dev-tools` requiere acceso a:
  - `MantenimientoModule` (lazy-loaded desde BaseModule).
  - `FormsModule` (para `[(ngModel)]` del textarea de HAR).

## 5) Puntos de fallo y cómo identificarlos

### 5.1 Overlays/backdrops huérfanos (causa principal esperada)

Indicadores:

- La UI se ve oscura/seminegra y no responde a clics.
- En el DOM existe un `.modal-backdrop`/`.offcanvas-backdrop`/`.c-backdrop` cubriendo el viewport.
- `document.body` mantiene `modal-open` y `overflow: hidden` sin modal visible.

Cómo identificar:

- Abrir DevTools → Elements → buscar `modal-backdrop`, `offcanvas-backdrop`, `c-backdrop`, `mobile-overlay`.
- Revisar `localStorage['op_ui_anomaly_snapshots_v1']`.
- Ejecutar `OPDebug.uiAnomaly.scan()` para forzar captura/recuperación.

### 5.2 Falsos positivos / recuperación no deseada

Riesgo:

- Un modal visible podría no ser detectado si cambia la clase (`.show`) o si es un diálogo custom.

Mitigación:

- Revisar que modales/offcanvas reales cumplan al menos uno de:
  - `.modal.show`, `.offcanvas.show`, `[role="dialog"][aria-modal="true"]`
- Si se usan componentes nuevos, actualizar la detección.

### 5.3 Falta de captura (no se guarda snapshot)

Causas:

- `localStorage` deshabilitado o lleno (quota).
- El bloqueo no cumple heurística (por ejemplo, overlay no cubre el umbral configurado).

Cómo identificar:

- Consola: revisar si existe `window.__OP_UI_ANOMALY__`.
- Revisar si `localStorage` está accesible.
- Inspeccionar visualmente el rect del overlay y su opacidad.

### 5.4 Bloqueos del hilo principal (congelación)

Indicadores:

- Interacción congelada incluso sin overlays visibles.
- `longTasks.maxMs` alto en snapshots.

Cómo identificar:

- Performance panel (DevTools) y revisar scripting/long tasks.
- Revisar `longTasks` en snapshots.

### 5.5 Fallos de carga de recursos (JS/CSS/fonts)

Indicadores:

- Estado inconsistente después de navegación/carga.
- Errores de recursos en `recentResourceErrors`.
- En el HAR: 404/500/0 en JS/CSS/fonts o recursos muy lentos.

Cómo identificar:

- Exportar HAR con “Preserve log” + “Disable cache”.
- Pegar en `Dev Tools` y revisar:
  - `Assets críticos fallidos`
  - tabla de `Fallos (top 30)`
  - tabla de `Lentos (top 30)`

## 6) Checklist de revisión (operativa)

### 6.1 UI/DOM/CSS

- Existe un backdrop/overlay cubriendo el viewport.
- `pointer-events` del overlay está activo.
- `body` tiene `modal-open` sin modal visible.
- `body overflow` está `hidden` en un estado sin diálogos.
- Se detecta `.mobile-overlay` activo fuera de contexto (móvil/sidebar).

### 6.2 Red (HAR)

- Fallos `status 0` (cancelado/bloqueado/CORS/red).
- 404/500 en JS/CSS/fonts.
- Recursos con `time >= 2000ms` (especialmente JS de módulos lazy o CSS base).
- Duplicidades o redirects inesperados (3xx).

### 6.3 Estado de carga (loader)

- El loader global no queda activo indefinidamente.
- Revisión de estadísticas (si se captura): `loading.activeRequests`.

### 6.4 Rendimiento

- `longTasks.maxMs` y `longTasks.totalMs` razonables.
- En navegación a rutas problemáticas no hay picos de scripting prolongados.

## 7) Procedimientos de diagnóstico y troubleshooting

### 7.1 Procedimiento rápido cuando ocurre en producción

1. Abrir consola y ejecutar:

   ```js
   OPDebug.uiAnomaly.scan();
   ```

2. Copiar el último snapshot:

   ```js
   window.__OP_UI_ANOMALY__;
   ```

3. Abrir `/#/admin/control/mantenimiento/dev-tools` → “Cargar capturas” → copiar JSON completo.
4. Exportar HAR del navegador (incluyendo contenido y con caché deshabilitada) y pegarlo en “Análisis de HAR”.

Resultado esperado:

- La UI se desbloquea sin recargar (si el bloqueo era un backdrop huérfano).
- Queda evidencia persistida para análisis posterior.

### 7.2 Procedimiento de investigación (causa raíz)

1. Con el snapshot, identificar `blockers[0].classes` y `kind`.
2. Buscar en el repo dónde se crea ese overlay:
   - Modales CoreUI/Bootstrap (`c-modal`, `offcanvas`, etc.).
   - Overlay móvil del sidebar (`.mobile-overlay`).
   - Loader global (`.loading-overlay.full-screen`).
3. Revisar flujos de navegación/cierre:
   - `visibleChange` de modales.
   - Cancelaciones de navegación.
   - Errores HTTP silenciados que eviten cerrar UI.
4. Con el HAR:
   - Correlacionar timestamps: fallos/latencias justo antes del bloqueo.
   - Verificar si faltó algún JS/CSS crítico.

### 7.3 Solución temporal recomendada (sin recarga)

- Ejecutar `OPDebug.uiAnomaly.scan()` (o esperar al escaneo periódico).
- Si persiste, revisar si hay un modal realmente abierto y cerrar el diálogo desde UI.

## 8) Recomendaciones preventivas

### 8.1 En UI/Angular (causa raíz)

- Asegurar que todo overlay/modal tenga un “cierre” garantizado en:
  - `finalize()` de observables.
  - `ngOnDestroy()` si el componente navega fuera.
  - `NavigationCancel`/`NavigationError` si hay lógica custom de navegación.
- Evitar depender solo de clases CSS para estado; centralizar estado visible de modales.

### 8.2 En red / assets

- Monitorear en backend/CDN:
  - 404 de bundles lazy.
  - latencias elevadas en JS/CSS.
- Configurar budgets/alertas (si aplica) y revisar cache headers.

### 8.3 En rendimiento (hilo principal)

- Evitar trabajo síncrono pesado en `ngOnInit`/`ngAfterViewInit`.
- Particionar tareas largas (microtareas / `setTimeout(0)` / web workers si procede).
- Revisar componentes con render pesado al navegar (editores, tablas grandes).

### 8.4 Validación automatizada

- Mantener el test e2e que verifica que un backdrop huérfano se elimina:
  - `e2e/ui-overlay-watchdog.spec.ts`
- Añadir escenarios reales si se identifica el disparador (p. ej. navegación mientras modal está abriéndose/cerrándose).

## 9) Ejemplos prácticos

### 9.1 Ejemplo: identificar un backdrop huérfano en el DOM

En consola:

```js
document.querySelectorAll('.modal-backdrop,.offcanvas-backdrop,.c-backdrop,.mobile-overlay');
```

Si devuelve nodos y no hay modal/offcanvas visible, es un fuerte candidato a bloqueo por overlay huérfano.

### 9.2 Ejemplo: extracción de snapshots para un ticket

```js
OPDebug.uiAnomaly.getSnapshots();
```

Copiar el primer elemento (más reciente) y adjuntarlo al ticket junto con el HAR.
