# Plan Técnico Integral — Módulo Público + Integración Bidireccional con Admin

## 1) Objetivo

Implementar completamente `src/app/features/public` para convertirlo en un front público funcional (home, listado, detalle, búsqueda, filtros, autenticación de usuarios finales y perfil), integrado de forma bidireccional con `src/app/features/admin` para sincronizar publicaciones y comentarios con consistencia funcional y de datos.

## 2) Alcance Funcional

### Público
- Home pública con contenidos destacados y últimas publicaciones.
- Listado de entradas con:
  - búsqueda por texto,
  - filtros por categoría, etiqueta, estado de visibilidad pública,
  - ordenación y paginación.
- Detalle de entrada por `slug`.
- Sistema de comentarios en detalle de entrada.
- Registro, login, logout y perfil de usuario final.
- Navegación pública y páginas estáticas (`about`, `contact`).

### Integración con Admin
- Entradas creadas/actualizadas en admin se reflejan en público según reglas de publicación.
- Comentarios enviados desde público se moderan en admin.
- Gestión coherente de estados para visibilidad pública (`Publicada`, `Borrador`, `Archivada`).

## 3) Diagnóstico de Base Actual

- Stack actual confirmado:
  - Angular `21.2.x`, TypeScript `5.9.x`, RxJS `7.8.x`.
  - UI: CoreUI + Bootstrap.
  - i18n: `@ngx-translate/core`.
  - Testing: Jasmine/Karma + Playwright.
- Rutas actuales:
  - Módulo público ya lazy-loaded en `app-routing.module.ts`.
  - Módulo admin protegido con `AuthGuard`.
- Contratos API ya definidos en `op-restapi.constants.ts`:
  - Entradas: `/entradas`, `/entradas/buscar`, `/entradas/obtenerPorSlug/{slug}`.
  - Comentarios: `/comentarios/crear`, `/comentarios/listarPorIdEntrada/{idEntrada}`.
  - Auth: `/login`, `/auth/registerUser`, `/logout`, `/auth/refreshToken`.
- Servicios base existentes y reutilizables:
  - `AuthService`, `TokenStorageService`, `SessionManagerService`, `AuthSyncService`.
  - `EntradaService`, `ComentarioService`, `UsuarioService`.

## 4) Arquitectura Propuesta

### 4.1 Estructura por Feature (público)

```text
src/app/features/public/
├── home/
├── entradas/
│   ├── containers/
│   │   ├── listado-entradas-public.component.*
│   │   └── detalle-entrada-public.component.*
│   ├── components/
│   │   ├── entrada-card.component.*
│   │   ├── entradas-filters.component.*
│   │   ├── entradas-searchbar.component.*
│   │   └── entradas-paginator.component.*
│   ├── services/
│   │   ├── public-entradas-facade.service.ts
│   │   ├── public-entradas-state.service.ts
│   │   └── public-entradas-query.service.ts
│   ├── models/
│   │   ├── public-entrada.vm.ts
│   │   ├── public-search-params.model.ts
│   │   └── public-list-state.model.ts
│   └── entradas-public-routing.module.ts
├── comentarios/
│   ├── components/
│   ├── services/
│   └── models/
├── auth/
│   ├── containers/
│   │   ├── login-public.component.*
│   │   ├── register-public.component.*
│   │   └── perfil-public.component.*
│   ├── services/
│   │   ├── public-auth-facade.service.ts
│   │   └── public-auth-guard.ts
│   └── auth-public-routing.module.ts
├── shared/
│   ├── components/
│   ├── pipes/
│   └── utils/
└── public-routing.module.ts
```

### 4.2 Patrones de diseño
- Facade + State Service para aislar componentes de la lógica de negocio.
- Contenedores (smart) y componentes presentacionales (dumb).
- Adaptadores/mappers para no acoplar UI pública al modelo interno del admin.
- Estrategia de estado local reactiva (RxJS `BehaviorSubject` + `combineLatest`).

## 5) Integración Bidireccional Público/Admin

### 5.1 Sincronización de entradas/publicaciones
- Fuente de verdad: backend.
- Flujo:
  1. Admin crea/edita entrada (`/entradas/crear`, `/entradas/{id}`).
  2. Al cambiar `estadoEntrada` a `Publicada`, entra al catálogo público.
  3. Público consulta `buscar` y `obtenerPorSlug` con filtros de visibilidad.
- Regla de consistencia:
  - Solo entradas publicadas aparecen en listado/detalle público.
  - Entradas `Top` (campo de negocio ya mapeado) se muestran primero en Home.

### 5.2 Sincronización de comentarios
- Público crea comentario (`/comentarios/crear`) con estado inicial de moderación.
- Admin revisa/aprueba/rechaza en módulo comentarios.
- Público lista únicamente comentarios aprobados para cada entrada.

### 5.3 Contrato de datos compartido
- Definir view models públicos explícitos:
  - `PublicEntradaVM` (id, slug, título, extracto, fechaPublicación, categoría, etiquetas, portada, autor público).
  - `PublicComentarioVM` (id, autorVisible, texto, fecha, estadoPublicación).
- Aplicar mappers frontend para blindar cambios internos del modelo de admin.

## 6) API y Endpoints

### 6.1 Reutilización inmediata (ya disponible)
- Entradas:
  - `POST /entradas/buscar`
  - `GET /entradas/obtenerPorSlug/{slug}`
- Comentarios:
  - `POST /comentarios/crear`
  - `GET /comentarios/listarPorIdEntrada/{idEntrada}`
- Auth:
  - `POST /login`
  - `POST /auth/registerUser`
  - `POST /logout`
  - `POST /auth/refreshToken`

### 6.2 Ajustes recomendados de contrato
- `POST /entradas/buscarPublicas` (opcional) para evitar filtros redundantes en frontend.
- `GET /comentarios/publicos/{idEntrada}` para exponer solo aprobados.
- `GET /usuarios/perfil/yo` para hidratar perfil público autenticado.

## 7) Autenticación y Seguridad

### 7.1 Estrategia de autenticación
- Reusar `AuthService` + `TokenStorageService`.
- Segregar permisos por rol:
  - Usuario final: comentar, editar perfil, favoritos (si aplica).
  - Admin: sin cambios en su circuito actual.
- Guards:
  - `PublicAuthGuard` para acciones autenticadas en rutas públicas.
  - guard inverso para evitar mostrar login/register si ya hay sesión.

### 7.2 Seguridad de aplicación
- Sanitizar contenido HTML de entradas renderizadas.
- Validar payload de formularios cliente con reglas estrictas.
- Evitar exposición de campos sensibles del usuario/admin en respuestas públicas.
- Manejo de expiración:
  - renovar sesión con `refreshToken`,
  - logout forzado controlado,
  - preservar intención de navegación post-login.

## 8) UX/UI Responsive y Accesibilidad

- Diseño mobile-first.
- Breakpoints principales: `xs`, `sm`, `md`, `lg`, `xl`.
- Elementos clave:
  - barra de búsqueda sticky en listado,
  - filtros colapsables en móvil,
  - cards optimizadas con skeleton loaders,
  - breadcrumbs en detalle.
- Accesibilidad:
  - navegación por teclado,
  - roles ARIA en componentes críticos,
  - contraste mínimo AA.

## 9) Estrategia de Estado, Errores y Validaciones

### 9.1 Estado
- `public-entradas-state.service.ts`:
  - lista, totalPages, loading, error, filtros activos.
- `public-auth-facade.service.ts`:
  - usuario actual, sesión válida, estado de refresh.

### 9.2 Errores
- Clasificación:
  - red (`timeout`, offline),
  - autorización (`401`, `403`),
  - negocio (`422`, validación),
  - servidor (`5xx`).
- UX de error:
  - mensajes accionables en UI,
  - toasts no bloqueantes,
  - fallback en componentes con `retry`.

### 9.3 Validaciones
- Login/Register:
  - email válido, password robusta, confirmación.
- Comentarios:
  - longitud mínima/máxima,
  - antispam básico (rate limit por sesión).
- Búsqueda/filtros:
  - sanitización y normalización de entradas de usuario.

## 10) Rendimiento y Optimización

- Lazy loading por submódulo público (`entradas`, `auth`, `perfil`).
- Preloading escalonado para evitar congestión inicial.
- `trackBy` en listados y paginación incremental.
- Caché de consultas de listado por combinación de filtros (TTL corto).
- Optimización de imágenes:
  - tamaños responsivos,
  - lazy loading nativo,
  - formatos modernos cuando backend lo permita.

## 11) Plan de Testing

### 11.1 Unitarias (Jasmine/Karma)
- Facades y state services del módulo público.
- Guards de autenticación pública.
- Mappers de modelos públicos.
- Componentes de filtros/búsqueda/paginación.

### 11.2 Integración
- Flujo listado -> detalle -> comentarios.
- Flujo login/register -> comentar -> logout.
- Sincronización admin->public:
  - crear entrada en admin,
  - publicar,
  - validar aparición en home/listado público.

### 11.3 E2E (Playwright)
- Escenarios críticos end-to-end:
  1. Descubrimiento de contenido (home/listado/detalle).
  2. Búsqueda y filtros combinados.
  3. Registro y login de usuario final.
  4. Envío comentario y verificación de moderación.
  5. Expiración de sesión y recuperación.

## 12) Milestones, Tiempo y Recursos

### M1 — Fundaciones Técnicas (4 días)
- Estructura de carpetas pública final.
- Modelos/mappers públicos.
- Facades y state base.
- Criterio de salida: build estable + rutas públicas compilan.

### M2 — Catálogo Público de Entradas (6 días)
- Home, listado, búsqueda, filtros y paginación.
- Detalle por slug con SEO básico.
- Criterio de salida: navegación completa de contenido público.

### M3 — Autenticación de Usuario Final (5 días)
- Login/register/logout y guardas públicas.
- Perfil básico de usuario.
- Criterio de salida: sesión robusta y flujo protegido estable.

### M4 — Comentarios + Moderación Bidireccional (4 días)
- Alta de comentarios desde público.
- Visibilidad controlada por estado moderado desde admin.
- Criterio de salida: ciclo completo público->admin->público validado.

### M5 — Hardening, QA y Performance (5 días)
- Tests unitarios/integración/e2e.
- Optimización responsive, accesibilidad y rendimiento.
- Criterio de salida: checklist de calidad aprobado.

### Estimación total
- 24 días laborables (aprox. 5 semanas).

### Recursos recomendados
- 1 Tech Lead/Arquitecto Angular.
- 2 Frontend Angular engineers.
- 1 QA automation (Playwright).
- 1 Backend engineer de soporte de contratos API.
- 1 UX/UI (parcial) para diseño responsive y accesibilidad.

## 13) Criterios de Aceptación por Funcionalidad

### Home
- Muestra entradas `Top` y últimas publicaciones.
- Carga inicial rápida y sin errores de consola.

### Listado
- Búsqueda y filtros funcionan combinados.
- Paginación consistente y persistencia de parámetros en URL.

### Detalle
- Resuelve `slug` válido y maneja `404` funcional.
- Render seguro de contenido HTML.

### Comentarios
- Solo autenticados pueden comentar.
- Moderación admin controla visibilidad pública.

### Auth
- Login, register y logout operativos.
- Manejo robusto de expiración y refresh token.

### Integración admin-public
- Publicación/cambios en admin se reflejan en público de forma coherente.
- No hay exposición de datos administrativos no públicos.

## 14) Riesgos y Mitigación

- Inconsistencias de contrato API:
  - mitigar con mappers, versionado y pruebas de contrato.
- Deriva entre reglas de publicación admin/público:
  - mitigar con una única regla de visibilidad en backend.
- Regresiones por cambios de auth:
  - mitigar con pruebas e2e específicas de sesión.
- Degradación de rendimiento por filtros complejos:
  - mitigar con paginación en servidor + caché de consultas.

## 15) Entregables

- Código del módulo público completo y documentado.
- Pruebas unitarias, integración y e2e pasando.
- Matriz de criterios de aceptación aprobada.
- Guía de operación funcional para sincronización admin/público.
