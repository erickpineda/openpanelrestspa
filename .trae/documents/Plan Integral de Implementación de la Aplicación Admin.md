# Plan Detallado de Implementación (Sidebar/Header) + Sincronización API

## Contexto y Sincronización con API

* Base API: `/api/v1` (swagger.yaml)

* Verificado en SPA y Swagger:

  * Entradas: CRUD, búsqueda, tipos/estados, cambiar estado — definidos en Swagger y consumidos por la SPA

  * Usuarios: CRUD — definidos en Swagger (falta parte de perfil/cambio de contraseña)

  * Dashboard: endpoints consumidos por SPA no están aún documentados en Swagger (summary, recent-activity, series/activity, series/entries split, top, storage, content-stats)

  * Auth/Perfil (SPA hints): login/refreshToken y perfil `yo` — añadir en Swagger

  * Operaciones largas (SPA hints): fileStorage/upload, reports/export/import — añadir si backend activo

Se incluye en el plan la actualización de `swagger.yaml` para cubrir los endpoints faltantes y alinear los esquemas con la SPA.

***

## 1. Inventario Completo

### Implementado (Dashboard, Entradas, Categorías, Comentarios)

* Dashboard (`/admin/dashboard`):

  * Resumen general, series, tops, almacenamiento, métricas, CSV — UI y servicios implementados (SPA)

* Entradas (`/admin/control/entradas`):

  * Listado, Crear/Editar, Previsualización — UI y servicios implementados

  * Estados y tipos — UI y servicios implementados

* Categorías (`/admin/control/categorias`):

  * Listado/CRUD — UI y servicios implementados

* Comentarios (`/admin/control/comentarios`):

  * Listado/CRUD — UI y servicios implementados

### Pendiente (por sidebar actual)

* Entradas Temporales (`/admin/control/entradas/entradas-temporales`): listado/acciones

* Páginas (`/admin/control/paginas`): listado/crear/editar

* Etiquetas (`/admin/control/etiquetas`): listado/CRUD

* Multimedia (`/admin/contenido/imagenes`, `/admin/contenido/archivos`): galería/subida/metadatos, gestor de archivos

* Usuarios (`/admin/gestion/usuarios`): listado/CRUD/roles/estados; Perfil (`/admin/gestion/miperfil`) y Cambio de contraseña (`/admin/gestion/changepassword`)

* Configuración (`/admin/configuracion/temas`, `/admin/configuracion/ajustes`): theming/ajustes generales

### UI faltante por sección

* Temporales: tabla, filtros por autor/fecha, reanudar/limpiar, permisos

* Páginas: editor (CKEditor), estado publicación, SEO

* Etiquetas: tabla y formulario, asociación con Entradas/Categorías

* Multimedia: grid/tabla, upload (drag\&drop), edición metadatos, previsualización

* Usuarios: tabla con filtros, formulario, asignación de roles, estado, reseteo

* Perfil: vista detalle, actividad reciente, edición de datos

* Password: formulario seguro, validaciones

* Configuración: selector de tema, preferencias de idioma/fecha, toggles de features

### Priorización (flujo y dependencias)

1. Usuarios; 2) Entradas Temporales; 3) Etiquetas; 4) Multimedia; 5) Páginas; 6) Perfil/Password; 7) Configuración; 8) Observabilidad/Accesibilidad transversal

***

## 2. Hoja de Ruta

### Secuencia y estimaciones

* Semana 1–2:

  * Usuarios (Listar/CRUD, roles/estados) — 6–8 días

  * Entradas Temporales — 3–4 días

* Semana 3:

  * Etiquetas — 4–5 días

  * Observabilidad básica/Accesibilidad en secciones nuevas — 1–2 días

* Semana 4:

  * Multimedia Imágenes/Archivos — 6–8 días

* Semana 5:

  * Páginas — 5–6 días

  * Perfil y Cambio de contraseña — 2–3 días

* Semana 6:

  * Configuración (Temas/Ajustes) — 4–5 días

  * E2E ampliados y refactor — 2–3 días

### Recursos y responsabilidades

* FE Angular/CoreUI: 1–2 devs

* BE/API: 1 dev (endpoints faltantes/dashboard/auth/perfil)

* QA: 1 QA (unitarias/integración/E2E)

* Diseño/UX: revisión accesibilidad y coherencia visual

***

## 3. Integración con Arquitectura Existente

### Sidebar y Header

* Rutas nuevas respetando grupos actuales (Control/Contenido/Gestión/Configuración)

* Header con btn-groups de acciones (filtros/CSV/navegación) siguiendo patrón Dashboard

### APIs y puntos de conexión

* Usuarios: `GET/POST/PUT/DELETE /api/v1/usuarios` (paginación/filtros/roles)

* Entradas Temporales: `GET/DELETE /api/v1/entradas/temporales`, `POST /api/v1/entradas/temporales/reanudar`

* Etiquetas: `GET/POST/PUT/DELETE /api/v1/etiquetas`

* Multimedia: `POST /api/v1/fileStorage/subirFichero`, `GET /api/v1/media?type=image|file`, `DELETE /api/v1/media/{id}`

* Páginas: `GET/POST/PUT/DELETE /api/v1/paginas`

* Perfil: `GET /api/v1/usuarios/perfil/yo`, `PUT /api/v1/usuarios/perfil/yo`, `POST /api/v1/usuarios/perfil/password`

* Configuración: `GET/PUT /api/v1/config/temas`, `GET/PUT /api/v1/config/ajustes`

* Dashboard (documentar en Swagger):

  * `GET /api/v1/dashboard/summary`

  * `GET /api/v1/dashboard/recent-activity?page&size`

  * `GET /api/v1/dashboard/series/activity?days&granularity`

  * `GET /api/v1/dashboard/series/entries?days&granularity&split=estado|estadoNombre`

  * `GET /api/v1/dashboard/top?type&limit&startDate&endDate`

  * `GET /api/v1/dashboard/storage`

  * `GET /api/v1/dashboard/content-stats`

* Auth: `POST /api/v1/auth/login`, `POST /api/v1/auth/refreshToken` (Bearer)

### Especificaciones técnicas coherencia

* Angular 16/CoreUI; patrones existentes (módulos lazy, servicios, facades)

* Accesibilidad: `role`, `aria-*`, focus y teclado; `aria-busy` en cargas

* i18n: `es-ES`, fechas `dd-MM-yyyy HH:mm:ss`, meses en español

* Observabilidad dev: métricas de carga por sección (toggle `?metrics=1`), desactivado en prod

* Rendimiento: commonjs permitido (file-saver/jszip) y migración a ESM en backlog; lazy load y cache TTL

***

## 4. Criterios de Finalización

### Definition of Done (por sección)

* UI: CoreUI coherente, accesible, responsive

* Funcional: CRUD completo, validaciones, estados, errores y reintentos

* Testing: unitarias ≥ 80% cobertura, integración de servicios, E2E funcionales por ruta principal

* Observabilidad: métricas de carga en dev, logs con tiempos y errores

* Documentación: README por módulo; Swagger actualizado

### Requisitos de testing

* Unitarias: Karma/Jasmine (ChromeHeadless); mocks HttpClient/DTOs

* Integración: HttpClientTestingModule; cobertura en facades

* E2E: Playwright Chromium; casos por sección (listado, crear/editar, filtros, descargas)

* Accesibilidad: pruebas de roles/aria y foco en reintentos/acciones

### Checklist producción

* [ ] Navegación completa desde Sidebar

* [ ] CRUDs (Entradas, Etiquetas, Páginas, Usuarios, Multimedia, Configuración)

* [ ] Accesibilidad AA/i18n es-ES

* [ ] Observabilidad dev activa, prod desactivada

* [ ] E2E ≥ 20 casos, unitarias cobertura ≥ 80%

* [ ] Swagger `/api-docs` funcional, `swagger.yaml` validado

***

## Fechas y Dependencias

* Cronograma (desde 2025-11-28): Sem.1–6 según hoja de ruta

* Dependencias:

  * Usuarios → roles/gestión

  * Multimedia → Entradas/Páginas

  * Etiquetas → Entradas/Categorías

  * Dashboard → documentación Swagger

  * Auth/Perfil → seguridad del resto de módulos

## Métricas de Progreso Visibles

* % completado por módulo (UI/Funcional/Tests/Docs)

* Cobertura de tests y casos E2E en verde

* Accesibilidad: nº de alertas resueltas

* Rendimiento: tiempo medio de carga por sección en dev

## Cierre

Confirmado el plan, procedo a:

1. Auditar y actualizar `swagger.yaml` con endpoints Dashboard/Auth/Perfil/Operaciones largas
2. Generar/armonizar servicios Angular faltantes
3. Implementar módulos pendientes según hoja de ruta y validar con QA/E2E
### Progreso (2025-11-29)

- Reorganización parcial completa:
  - Etiquetas movido a `src/app/admin/base/etiquetas`, rutas y navegación actualizadas.
  - Adopción CoreUI consolidada (cards, formularios, modales, iconos, spinners) y `FormModule` expuesto en `SharedOPModule`.
  - Corrección de iconos mediante actualización de `icon-subset` y registro en `IconSetService`.
- Usuarios:
  - Lista con filtros, total y selector de tamaño; modal de crear/editar con validaciones visibles; nombre de rol en tabla.
- Contenido (Imágenes/Archivos):
  - Listado con filtros, totales y selección de página; truncado con tooltips; corrección de desbordes.
- Configuración (Temas/Ajustes):
  - CRUD básico con modales CoreUI y toasts; formularios reactivos.

### Backlog inmediato

- Swagger/API:
  - Documentar endpoints de Dashboard y Auth/Perfil; validar tipos y respuestas para sincronización con SPA.
- Módulos pendientes:
  - Entradas Temporales: listado y acciones (reanudar/limpiar) con servicios `CrudService` y UI.
  - Páginas: editor CKEditor, estado publicación y SEO; servicios y vistas.
  - Multimedia: subida drag&drop, metadatos y previsualización.
  - Perfil/Password: conectar formularios a API y añadir validaciones.
- Calidad y pruebas:
  - Unitarias (≥80%) en servicios y componentes clave; E2E por sección (listado/CRUD/filtros).
  - Accesibilidad AA: roles/aria, foco y teclado; `aria-busy` en cargas.
  - Observabilidad: métricas de carga en dev y guía de logging.

### Criterios de cierre (ajuste)

- Navegación Sidebar validada y rutas coherentes.
- CRUDs operativos (Entradas, Etiquetas, Páginas, Usuarios, Multimedia, Configuración) con CoreUI consistente.
- Documentación actualizada (`swagger.yaml`, `docs/arch-reorg.md`, adopción CoreUI).
