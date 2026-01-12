# Migración a Angular 21 y CoreUI (última versión)

## 1. Requisitos previos

- Versión actual:
  - Angular 16 (`package.json:24–33`)
  - CoreUI Angular `~4.5.28` (`package.json:39,44`), CoreUI CSS `^4.2.6` (`package.json:42`)
  - CoreUI ChartJS `~4.5.28` (`package.json:40`), `@coreui/chartjs ^3.1.2` (`package.json:41`)
  - CoreUI Icons Angular `~4.5.28` (`package.json:44`)
- Lenguaje y runtime:
  - TypeScript `~4.9.5` (`package.json:79`)
  - RxJS `~7.8.1` (`package.json:55`)
  - Zone.js `~0.13.1` cargado en `src/polyfills.ts:48`
  - Node engines `>=16.4.0` (`package.json:81–84`)
- Configuración de build y pruebas:
  - Builder `@angular-devkit/build-angular:browser` (`angular.json:25`)
  - `polyfills` apuntando a `src/polyfills.ts` (`angular.json:30`)
  - Test runner Karma (`angular.json:106–123`)
  - E2E con Playwright (`package.json:20`)
- Dependencias y paquetes relacionados:
  - CKEditor Angular (`@ckeditor/ckeditor5-angular ^9.1.0`) y build classic (^44.3.0)
  - jQuery `^3.6.1` y otras CommonJS permitidas en `angular.json:45–52`
  - CoreUI módulos usados en `AppModule`: `ToastModule`, `ModalModule` (`src/app/app.module.ts:12,31–33`)
- Patrón de bootstrap:
  - `platformBrowserDynamic().bootstrapModule(AppModule)` (`src/main.ts:11`)
- HTTP:
  - `HttpClientModule` importado en `AppModule` (`src/app/app.module.ts:16`)
  - Interceptores en `CoreModule` con orden explícito (`src/app/core/core.module.ts:33–63`)
- TypeScript config:
  - `tsconfig.json` con `strictTemplates: true`, `target/module ES2022`, `useDefineForClassFields: false` (`c:\dev\git\openpanelrestspa\tsconfig.json:22–25,41–46`)
  - `tsconfig.app.json` incluye `src/main.ts` y `src/polyfills.ts` (`c:\dev\git\openpanelrestspa\tsconfig.app.json:9–11`)
  - `tsconfig.spec.json` usa `jasmine` y Karma (`c:\dev\git\openpanelrestspa\tsconfig.spec.json:6–13`)
- Otras dependencias potencialmente sensibles:
  - `ngx-scrollbar ^13.0.3` (alinear compatibilidad con Angular 21)
  - `loader-utils 3.2.1`, `serve ^14.0.1` (auditar uso real y remover si no se usan)

## 2. Plan de migración Angular 21

- Estado: **COMPLETADO (Fase 2)**
- Pasos realizados:
  - Actualización de Node a v22.21.1.
  - Actualización incremental de Angular (16 -> 17 -> 18 -> 19 -> 20 -> 21) usando `ng update`.
  - Migración a `application` builder (esbuild).
  - Actualización de `angular.json` para corregir configuración de polyfills.
  - Actualización de TypeScript a v5.9.3.
- Notas técnicas:
  - Se utiliza el builder `@angular/build:application`.
  - Se eliminó el uso de tilde (`~`) en imports SCSS (deprecated en nuevos builders).
  - Se mantienen los polyfills y Zone.js por ahora (estrategia conservadora).

## 3. Migración a CoreUI

- Estado: **COMPLETADO (Fase 4)**
- Versión actual:
  - `@coreui/angular`: 5.x (Latest)
  - `@coreui/coreui`: 5.x (Latest)
  - Bootstrap: 5.3.x
- Acciones realizadas:
  - Actualización de paquetes CoreUI a últimas versiones compatibles con Angular 21.
  - Corrección de rutas de assets en SCSS.
  - Validación de build (con warnings de deprecación de SASS aceptados temporalmente).

## 4. Cronograma estimado

- **Fase 0 — Preparación:** (Completado)
  - Auditoría y limpieza de dependencias.
- **Fase 1 — Node & TypeScript:** (Completado)
  - Actualización de entorno base.
- **Fase 2 — Angular Core:** (Completado)
  - Migración del framework y CLI.
- **Fase 3 — Tests:** (Completado)
  - Ejecución y corrección de tests unitarios críticos.
  - Estabilización del entorno de pruebas (Karma/ChromeHeadless).
- **Fase 4 — UI Libs (CoreUI, CKEditor):** (Completado)
  - Actualización de librerías de interfaz.
  - CKEditor actualizado a v11.x (wrapper) y v44.x (build).

### 4.0. Estrategia y ruta crítica de migración

Orden recomendado de ataque para minimizar bloqueos y maximizar estabilidad progresiva:

1. **Core & Shared (Cimientos):**
   - Migrar `CoreModule` (interceptores, servicios) y `SharedOPModule`/`SharedCoreUiModule` primero.
   - Si estos fallan, nada funciona. Verificar `HttpClient` y componentes UI base (alertas, badges, spinners).

2. **Layout Admin & Navegación:**
   - Adaptar `AdminModule`, Sidebar (`ngx-scrollbar`), Header y Footer.
   - Objetivo: Tener un esqueleto navegable aunque el contenido falle.

3. **Dashboard (Solo lectura):**
   - Migrar `DashboardComponent` y gráficos. Es la "home" y valida la carga de datos masiva sin formularios complejos.

4. **Módulos CRUD Simples (Gestión/Config):**
   - `Gestión` (Usuarios/Roles), `Configuración` (Ajustes), `Categorías`, `Etiquetas`.
   - Validan formularios reactivos básicos, modales y tablas sin editores ricos.

5. **Módulos Complejos (Entradas/Páginas):**
   - Al final, atacar `Entradas` y `Páginas`.
   - Dependen de todo lo anterior + CKEditor 5 (la parte más riesgosa).

### 4.1. Mapa detallado: Entradas y Dashboard

- Entradas (`src/app/admin/base/entradas`):
  - Componentes clave:
    - `listado-entradas.component.ts` (`src/app/admin/base/entradas/listado-entradas.component.ts:1–30`)
    - `crear-entrada.component.ts` (`src/app/admin/base/entradas/crear/crear-entrada.component.ts:1–20`)
    - `editar-entrada.component.ts` (`src/app/admin/base/entradas/editar/editar-entrada.component.ts:1–12`)
    - `entrada-form.component.ts` (`src/app/admin/base/entradas/entrada-form/entrada-form.component.ts:1–30`)
    - `entrada-form.component.html` (`src/app/admin/base/entradas/entrada-form/entrada-form.component.html:146–162`)
    - `preview-entrada.component.ts` (`src/app/admin/base/entradas/previa/preview-entrada.component.ts:1–8`)
  - Servicios y utilidades:
    - `entrada-facade.service.ts` (`src/app/admin/base/entradas/entrada-form/srv/entrada-facade.service.ts:1–20`)
    - `validation-entrada-forms.service.ts` (`src/app/admin/base/entradas/entrada-form/srv/validation-entrada-forms.service.ts:1–8`)
    - Servicios de datos relacionados: `EntradaService`, `CategoriaService` (`src/app/core/services/data/*.service.ts`)
  - Impacto de migración:
    - CKEditor 5: actualizar wrapper a `@ckeditor/ckeditor5-angular ^11` y build `^47.x`; validar carga dinámica del build en `loadEditorBuild()` (`src/app/admin/base/entradas/entrada-form/entrada-form.component.ts:246–260`).
    - CoreUI 5.6: validar modales (`<c-modal>`) y feedback de formularios en plantillas; sustituir `NgClass` por `class.*` donde aplique en vistas.
    - Angular 21: revisar `ChangeDetectionStrategy.OnPush` + eventos CKEditor; si zoneless, confirmar llamadas a `ChangeDetectorRef.detectChanges()` y evitar dependencias de Zone.
    - Tests: actualizar specs NG0100 y pruebas de formularios para `provideHttpClientTesting()` si se migra a test API moderna.

- Dashboard (`src/app/admin/base/dashboard`):
  - Componentes clave:
    - `dashboard.component.ts` (carga y orquestación de datos, exportaciones) (`src/app/admin/base/dashboard/dashboard.component.ts:148–170, 288–317`)
    - Paneles: `dashboard-series-panel`, `dashboard-estado-nominal-panel`, `dashboard-estado-split-panel`, `dashboard-top-panel`, `dashboard-recent-panel`, `dashboard-content-panel` (en `src/app/admin/base/dashboard/components/*`)
    - Barra de herramientas: `dashboard-toolbar.component.ts` (`src/app/admin/base/dashboard/components/dashboard-toolbar/dashboard-toolbar.component.ts:1–14`)
  - Servicios:
    - `DashboardFacadeService` (`src/app/admin/base/dashboard/srv/dashboard-facade.service.ts:1–20, 44–66`)
    - `DashboardApiService` (`src/app/core/services/dashboard-api.service.ts:1–20, 49–67, 112–129`)
  - Impacto de migración:
    - Chart.js: actualizar a `@coreui/angular-chartjs 5.6.x` y validar opciones/registro con Chart.js v4; revisar `DashboardChartComponent` (`src/app/shared/components/dashboard-chart/dashboard-chart.component.ts:1–13`).
    - Angular 21: revisar suscripciones y `ChangeDetectorRef`; si zoneless, asegurar actualizaciones explícitas en flujos asíncronos críticos.
    - CoreUI 5.6: cards, grids, badges; revisar iconos `@coreui/icons-angular 5.6.x`.
    - HTTP: `DashboardApiService` aprovecha `HttpClient` por defecto; evaluar retiro de `HttpClientModule` del `AppModule`.

Notas transversales:

- Layout Admin: `NgScrollbarModule` en `AdminModule` (`src/app/admin/admin.module.ts:1–20`); actualizar `ngx-scrollbar` a versión compatible.
- Shared CoreUI: `shared-coreui.module.ts` consolida imports CoreUI (`src/app/shared/shared-coreui.module.ts:1–30`); migrar a CoreUI 5.6 y revisar APIs.

### 4.2. Mapa detallado: Páginas

- Páginas (`src/app/admin/base/paginas`):
  - Componentes clave:
    - `listado-paginas.component.ts` (`src/app/admin/base/paginas/listado-paginas.component.ts:1–30, 194–240, 271–287, 339–349, 425–447`)
    - `listado-paginas.component.html` (`src/app/admin/base/paginas/listado-paginas.component.html:1–40, 106–140, 171–207`)
    - `crear-pagina.component.ts` (`src/app/admin/base/paginas/crear/crear-pagina.component.ts:13–27, 82–98`)
    - `crear-pagina.component.html` (`src/app/admin/base/paginas/crear/crear-pagina.component.html:1–21`)
    - `editar-pagina.component.ts` (`src/app/admin/base/paginas/editar/editar-pagina.component.ts:12–29, 91–106`)
  - Módulo:
    - `PaginasModule` (`src/app/admin/base/paginas/paginas.module.ts:1–24`)
  - Impacto de migración:
    - CKEditor 5: reutiliza `EntradaFormComponent` y `PreviaEntradaComponent` desde `EntradasSharedModule`; aplicar mismos cambios que en Entradas.
    - CoreUI 5.6: tablas, botones y modales (`<c-modal id="previewPaginaModal">`) en vistas de listado y edición.
    - Angular 21: lógica de paginación, `ChangeDetectorRef` y `NgZone` similares a Entradas; revisar posibles NG0100 en previews y modales.

### 4.3. Mapa detallado: Comentarios

- Comentarios (`src/app/admin/base/comentarios`):
  - Componentes clave:
    - `listado-comentarios.component.ts` (`src/app/admin/base/comentarios/listado-comentarios.component.ts:1–47, 110–134, 275–308`)
    - `listado-comentarios.component.html` (`src/app/admin/base/comentarios/listado-comentarios.component.html:1–31, 57–89, 115–144`)
    - `crear-comentario.component.ts` (`src/app/admin/base/comentarios/crear/crear-comentario.component.ts:1–25`)
    - `editar-comentario.component.ts` (`src/app/admin/base/comentarios/editar/editar-comentario.component.ts:1–36, 38–59, 86–101`)
    - `comentario-form.component.ts` (`src/app/admin/base/comentarios/comentario-form/comentario-form.component.ts:1–24, 44–72`)
  - Impacto de migración:
    - CoreUI 5.6: listas, tablas, modales de confirmación (`<c-modal [visible]=...>`), paginación manual y toolbars de búsqueda.
    - Angular 21: uso intensivo de `ChangeDetectorRef.detectChanges()` tras peticiones; revisar comportamiento en zoneless.
    - HTTP: `ComentarioService`, `EntradaService`, `UsuarioService` en `src/app/core/services/data/*.service.ts` deben alinearse con HttpClient actualizado.

### 4.4. Mapa detallado: Categorías y Etiquetas

- Categorías (`src/app/admin/base/categorias`):
  - Componentes:
    - `listado-categorias.component.ts` (`src/app/admin/base/categorias/listado-categorias.component.ts:1–36, 144–160`)
    - `listado-categorias.component.html` (`src/app/admin/base/categorias/listado-categorias.component.html:1–27, 59–91`)
    - `categoria-form.component.ts` (`src/app/admin/base/categorias/categoria-form/categoria-form.component.ts:1–25`)
    - `categoria-form.component.html` (`src/app/admin/base/categorias/categoria-form/categoria-form.component.html:78–92`)
  - Impacto:
    - CoreUI 5.6: tablas, badges (`<c-badge>`), modales de borrado.
    - Angular 21: patrones de búsqueda/paginación similares a Comentarios; revisar tipado de formularios y validators.
    - HTTP: `CategoriaService` (`src/app/core/services/data/categoria.service.ts:1–10`) usa `CrudService`/`HttpContext` con `NetworkInterceptor`.

- Etiquetas (`src/app/admin/base/etiquetas`):
  - Componentes:
    - `listado-etiquetas.component.ts` (`src/app/admin/base/etiquetas/listado-etiquetas.component.ts:1–37, 144–199`)
    - `listado-etiquetas.component.html` (`src/app/admin/base/etiquetas/listado-etiquetas.component.html:1–32, 45–76`)
    - `etiqueta-form.component.ts` (`src/app/admin/base/etiquetas/etiqueta-form/etiqueta-form.component.ts:1–31`)
  - Módulo:
    - `EtiquetasModule` (`src/app/admin/base/etiquetas/etiquetas.module.ts:1–14`)
  - Impacto:
    - CoreUI 5.6: cards, tablas, badges de color y modales.
    - Angular 21: formularios reactivos y validaciones; revisar `FormBuilder` y types con TS 5.9.
    - HTTP: `EtiquetaService` y `SearchUtilService` para filtros avanzados (`src/app/core/services/utils/search-util.service.ts:1–24`).

### 4.5. Mapa detallado: Gestión (usuarios, roles, privilegios)

- Gestión (`src/app/admin/base/gestion`):
  - Módulo:
    - `GestionModule` y routing (`src/app/admin/base/gestion/gestion.module.ts:1–15`, `gestion-routing.module.ts:1–22`)
  - Usuarios:
    - `listado-usuarios.component.ts` (`src/app/admin/base/gestion/usuarios/listado-usuarios.component.ts:1–12, 45–57`)
    - Impacto: tablas de usuarios, filtros, asignación de roles (`RolService`, `UsuarioService`), mensajes CoreUI.
  - Roles:
    - `listado-roles.component.ts` (`src/app/admin/base/gestion/roles/listado-roles.component.ts:1–44, 231–245, 319–359, 361–392`)
    - `listado-roles.component.html` (`src/app/admin/base/gestion/roles/listado-roles.component.html:109–132`)
    - Impacto: modales complejos, checkboxes de “todos los privilegios”, reglas de negocio (roles protegidos PROPIETARIO/ADMIN).
  - Privilegios:
    - `listado-privilegios.component.ts` (`src/app/admin/base/gestion/privilegios/listado-privilegios.component.ts:1–37`)
    - `listado-privilegios.component.html` (`src/app/admin/base/gestion/privilegios/listado-privilegios.component.html:1–27`)
    - Impacto: CRUD completo con búsqueda avanzada, paginación y modales.
  - Impacto de migración (común):
    - CoreUI 5.6: tablas densas, toolbars, modales y toasts.
    - Angular 21: `ChangeDetectorRef`, observables de servicios con `takeUntil`; revisar tipados y posible migración a señales a medio plazo.
    - HTTP: `UsuarioService`, `RolService`, `PrivilegioService` dependen de `CrudService` y `NetworkInterceptor`.

### 4.6. Mapa detallado: Perfil

- Perfil (`src/app/admin/base/perfil`):
  - Módulo:
    - `PerfilModule` (`src/app/admin/base/perfil/perfil.module.ts:1–24`)
  - Componentes:
    - `PerfilComponent` contenedor (`src/app/admin/base/perfil/containers/perfil.component.ts`)
    - `PerfilFormComponent` (`src/app/admin/base/perfil/components/perfil-form/perfil-form.component.ts:1–24`)
    - `PerfilPreferencesComponent`, `PerfilActivityComponent` (`src/app/admin/base/perfil/components/*`)
  - Impacto:
    - CoreUI 5.6: tabs (`TabsModule`), cards y formularios.
    - Angular 21: formularios reactivos, eventos de guardado, posibles validaciones asíncronas.
    - HTTP: `UsuarioService` para datos de perfil.

### 4.7. Mapa detallado: Configuración (Ajustes, Temas)

- Configuración (`src/app/admin/base/configuracion`):
  - Módulo:
    - `ConfiguracionModule` (`src/app/admin/base/configuracion/configuracion.module.ts:1–13`)
  - Ajustes:
    - `AjustesComponent` (`src/app/admin/base/configuracion/ajustes/ajustes.component.ts:1–34, 48–74, 76–99, 111–133`)
    - `ajustes.component.html` (`src/app/admin/base/configuracion/ajustes/ajustes.component.html:1–32`)
  - Temas:
    - `TemasComponent` (`src/app/admin/base/configuracion/temas/temas.component.ts:1–34, 119–122`)
    - `temas.component.html` (`src/app/admin/base/configuracion/temas/temas.component.html`)
  - Impacto:
    - CoreUI 5.6: tablas/listas de ajustes, modales de edición.
    - Angular 21: formularios reactivos, pipes de filtro y paginación manual.
    - HTTP: `AjustesService`, `TemasService` y su integración con backend.

### 4.8. Mapa detallado: Contenido (archivos, imágenes)

- Contenido (`src/app/admin/base/contenido`):
  - Módulo:
    - `ContenidoModule` (`src/app/admin/base/contenido/contenido.module.ts:1–19`)
    - `MediaSharedModule` (`src/app/admin/base/contenido/media-shared.module.ts`)
  - Archivos:
    - `ArchivosComponent` (`src/app/admin/base/contenido/archivos/archivos.component.ts:1–34, 75–78`)
    - `archivos.component.html` (`src/app/admin/base/contenido/archivos/archivos.component.html:59–87`)
  - Imágenes:
    - `ImagenesComponent` (`src/app/admin/base/contenido/imagenes/imagenes.component.ts:1–7, ...`)
    - Usado como selector en `EntradaFormComponent` (`src/app/admin/base/entradas/entrada-form/entrada-form.component.ts:24–25`) y modales.
  - Impacto:
    - CoreUI 5.6: tablas, toolbars, filtrado por fechas y modales.
    - Angular 21: manejo de `ChangeDetectorRef`, `Subject`/`takeUntil`, subida de ficheros (probar con HttpClient actualizado).
    - HTTP: `FileStorageService` (`src/app/core/services/file-storage.service.ts`) ajustado a Angular 21 y `NetworkInterceptor`.

### 4.9. Mapa detallado: Mantenimiento

- Mantenimiento (`src/app/admin/base/mantenimiento`):
  - Módulo:
    - `MantenimientoModule` (`src/app/admin/base/mantenimiento/mantenimiento.module.ts:1–19`)
    - Routing (`mantenimiento-routing.module.ts:1–18`)
  - Logs:
    - `LogsComponent` (`src/app/admin/base/mantenimiento/logs/logs.component.ts:1–53`)
  - Database:
    - `DatabaseComponent` (`src/app/admin/base/mantenimiento/database/database.component.ts:1–15`)
  - Dev Tools:
    - `DevToolsComponent` (`src/app/admin/base/mantenimiento/dev-tools/dev-tools.component.ts:1–16`)
  - Impacto:
    - CoreUI 5.6: cards, listas y botones de acciones.
    - Angular 21: timers (`setInterval` en logs), suscripciones y limpieza adecuada en zoneless.

### 4.10. Mapa detallado: Layout Admin, Core y App

- Layout Admin:
  - `AdminModule` (`src/app/admin/admin.module.ts:1–42`), `AdminRoutingModule` (`src/app/admin/admin-routing.module.ts:1–30`)
  - Componentes: `AdminComponent`, `DefaultHeaderComponent`, `DefaultFooterComponent`, sidebar y navegación (`src/app/admin/default-layout/*`, `src/app/admin/admin.component.html:1–40`)
  - Impacto:
    - CoreUI 5.6: header, footer, sidebar, breadcrumbs, toasts globales.
    - `NgScrollbarModule` + `ngx-scrollbar` para sidebar; actualizar versión y probar en Angular 21.

- Core (`src/app/core`):
  - `CoreModule` (`src/app/core/core.module.ts:1–40`): interceptores (`TimeoutInterceptor` → `AuthInterceptor` → `NetworkInterceptor` → `ErrorInterceptor`).
  - Servicios clave: `AuthService`, `TokenStorageService`, `LoadingService`, `TemporaryStorageService`, `SessionManagerService`, `UnsavedWorkService`, `SearchUtilService`, servicios de datos (`EntradaService`, `UsuarioService`, `CategoriaService`, `RolService`, etc.).
  - Errores y logging: `GlobalErrorHandlerService` (`src/app/core/errors/global-error/global-error-handler.service.ts`), `ErrorBoundaryService`, `LoggerService`.
  - Impacto:
    - Angular 21: revisar providers, uso de `HttpClient`, y posibles nuevas APIs (`provideHttpClient`).
    - Compatibilidad con zoneless: interceptores no deben depender de Zone.

- App y routing:
  - `AppModule` (`src/app/app.module.ts:1–40`), `AppRoutingModule` (`src/app/app-routing.module.ts:1–25`), `main.ts` (`src/main.ts:1–13`), `polyfills.ts` (`src/polyfills.ts:1–36`), `app.config.ts` (`src/app/app.config.ts:1–24`).
  - Impacto:
    - Migración opcional a Standalone (`bootstrapApplication`) y `provideRouter` a medio plazo.
    - Revisión de `HttpClientModule` (retirar si se usa `provideHttpClient`) y `BrowserAnimationsModule`.

## 5. Pruebas requeridas

- Pruebas unitarias:
  - Interceptores (`Auth`, `Network`, `Error`, `Timeout`) con orden y comportamiento (`src/app/core/core.module.ts:45–63`).
  - Servicios HTTP (`auth.service`, `dashboard-api.service`, `usuario.service`) validando parámetros y rutas; ejemplo existente: `dashboard-api.service.spec.ts`.
  - Manejador global de errores (`global-error-handler.service.ts`) para `HttpErrorResponse` y validaciones del backend (`src/app/core/errors/global-error/global-error-handler.service.ts:269–304`).
- Pruebas de integración:
  - Flujo de sesión y expiración (`SessionExpiredComponent`, `UnsavedWorkDirective`) (`src/app/app.module.ts:12–21`).
  - Preloading de rutas (`CustomPreloadingStrategyService`) y navegación con estados de carga.
- Pruebas de regresión visual:

## 6. Seguridad y rendimiento post-migración

- NPM: Resuelto conflicto de `@coreui/angular-chartjs@5.6.2` con `@coreui/chartjs`. Actualizado `@coreui/chartjs` a `^4.1.0` en `package.json` para cumplir peer dependency.
- Auditoría: `npm audit` detectó 61 vulnerabilidades de baja severidad (principalmente CKEditor 5). No hay vulnerabilidades críticas/altas.
- Mitigación CKEditor:
  - Sanitización de campos `contenido` y `resumen` al guardar entradas (`src/app/admin/base/entradas/entrada-form/entrada-form.component.ts:418–434` y `src/app/admin/base/entradas/entrada-form/entrada-form.component.ts:456–478`).
  - Mantener carga dinámica del build para mejorar rendimiento (`src/app/admin/base/entradas/entrada-form/entrada-form.component.ts:248–261`).
- Karma/ChromeHeadless: Configuración optimizada con `ChromeHeadlessNoSandbox` y timeouts para estabilidad en CI (`karma.conf.js:79–91`).
  - Playwright con screenshots de páginas clave: dashboard, perfil (`src/app/admin/base/perfil/containers/perfil.component.html:3`), listas y modales.
  - Validar temas y componentes CoreUI (toasts, modales, sidebar).
- Validación de funcionalidad:
  - Rendimiento: respetar `budgets` (`angular.json:56–66`) y revisar paquetes CommonJS.
  - Comprobación zoneless/Zone según decisión: estabilidad de detección de cambios.
- Pruebas de compatibilidad de librerías:
  - `ngx-scrollbar` y CKEditor contra Angular 21/TS 5.9; actualizar versiones y pruebas de integración.
  - `@coreui/angular-chartjs` y Chart.js v4 en gráficas actuales.
- Pruebas específicas CKEditor:
  - Inicialización en contenedores, eventos `ready` y `change`, y watchdog.
  - Carga de plugins utilizados (CKBox/premium) y validación de tipos en TS.

## 6. Documentación adicional

- Guía de referencia para cambios importantes:
  - Compatibilidad Angular 21 (Node/TS/RxJS): https://angular.dev/reference/versions
  - Novedades Angular 21 y migraciones (`NgClass`/`NgStyle`, control flow, zoneless): https://blog.ninja-squad.com/2025/11/20/what-is-new-angular-21.0
  - CoreUI para Angular (docs y requisitos): https://coreui.io/angular/docs/ y releases: https://github.com/coreui/coreui-angular/releases
- Problemas conocidos y soluciones:
  - Warnings por CommonJS (lodash, CKEditor, jQuery): sustituir por ESM donde sea viable; mantener lista en `angular.json:45–52` temporalmente.
  - CKEditor compatibilidad: actualizar `@ckeditor/ckeditor5-angular` a versión compatible con TS 5.9/Angular 21; validar builds.
  - Karma→Vitest: el schematic de migración ayuda, pero configuraciones personalizadas pueden requerir ajustes manuales.
  - Zoneless: evitar mezclar patrones sin control; introducir señales gradualmente, revisar `ChangeDetectorRef`.
  - Builders nuevos:
    - `@angular/build` sustituye a `@angular-devkit/build-angular` en Angular 21; aceptar migraciones del CLI y validar `angular.json`.
  - Linting:
    - Actualizar `angular-eslint` a línea 21 y revisar reglas nuevas en plantillas (bindings `class.*`/`style.*`).
- Recomendaciones post-migración:
  - Adoptar señales en nuevas funcionalidades y formularios (`@angular/forms/signals`) donde aporte.
  - Reducir uso de jQuery y librerías CommonJS; migrar a alternativas ESM.
  - Mantener `provideZoneChangeDetection()` solo si es necesario; planificar transición a zoneless.
  - Actualizar pipeline CI/CD (Node LTS 20/22), bloquear versiones y definir lints de Angular 21.
  - Arquitectura:
    - Planificar migración progresiva a Standalone y `bootstrapApplication` para simplificar `AppModule` y reducir dependencias del sistema de módulos.

---

## Apéndice: ubicaciones clave del proyecto

- `package.json` (`c:\dev\git\openpanelrestspa\package.json`)
- `angular.json` (`c:\dev\git\openpanelrestspa\angular.json`)
- `src/main.ts` (`c:\dev\git\openpanelrestspa\src\main.ts:11`)
- `src/polyfills.ts` (`c:\dev\git\openpanelrestspa\src\polyfills.ts:48`)
- `AppModule` (`c:\dev\git\openpanelrestspa\src\app\app.module.ts:1–44`)
- `CoreModule` (`c:\dev\git\openpanelrestspa\src\app\core\core.module.ts:1–69`)
- `DashboardApiService tests` (`c:\dev\git\openpanelrestspa\src\app\core\services\dashboard-api.service.spec.ts`)
- `tsconfig.json` (`c:\dev\git\openpanelrestspa\tsconfig.json`)
- `tsconfig.app.json` (`c:\dev\git\openpanelrestspa\tsconfig.app.json`)
- `tsconfig.spec.json` (`c:\dev\git\openpanelrestspa\tsconfig.spec.json`)
