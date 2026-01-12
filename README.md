# Openpanel SPA (Angular 21)

Aplicación SPA basada en Angular 21 y CoreUI, orientada a la gestión y administración de contenido (área pública + área de administración) con carga diferida de módulos y servicios compartidos.

## Características

- Routing con módulos y lazy loading.
- Preloading configurable (`CustomPreloadingStrategyService`).
- CoreUI (`@coreui/angular` y `@coreui/icons-angular`) como sistema de UI.
- E2E con Playwright (`npm run e2e`).

## Requisitos

Requisitos mínimos recomendados (ver `package.json`):

- Node.js `>= 20.19.0`
- npm `>= 10.0.0`

Dependencias principales:

- Angular `^21.0.x`
- TypeScript `~5.9.x`
- RxJS `~7.8.x`
- CoreUI `^5.6.x`

## Inicio rápido

Instalar dependencias:

```bash
npm install
```

Arrancar en desarrollo:

```bash
npm start
```

Servidor por defecto: `http://localhost:4200/`.

Para usar otro puerto:

```bash
npm run start -- --port=4300
```

## Arquitectura y organización

### Capas principales

- `src/app/core/`: servicios transversales (auth, interceptores HTTP, manejo de errores, utilidades, estado UI).
- `src/app/shared/`: módulos y componentes reutilizables (CoreUI wrappers, paginación, búsqueda, errores globales, widgets).
- `src/app/public/`: área pública (home, about, contact, login) y layout público.
- `src/app/admin/`: área de administración (layout CoreUI, navegación, módulos funcionales).

### Routing

El enrutamiento se organiza por áreas y carga diferida:

- `src/app/app-routing.module.ts`:
  - `''` carga `PublicModule`.
  - `'admin'` carga `AdminModule` con guard de autenticación.
  - Preloading habilitado con estrategia propia.
  - `useHash: true` para despliegues sin configuración especial de rewrites.

### Admin

El layout de administración vive en `src/app/admin/admin.component.html` y utiliza:

- `c-sidebar` + `c-sidebar-nav` con `navItems` en `src/app/admin/default-layout/_nav.ts`.
- Módulos funcionales bajo `src/app/admin/base/` con lazy loading (entradas, páginas, dashboard, gestión, etc.).

### Estilos

Los estilos base y ajustes a CoreUI están en `src/assets/css/`.

## Comandos de desarrollo

Comandos principales (ver `package.json`):

- Desarrollo: `npm start`
- Desarrollo (memoria extra): `npm run start:mem`
- Build: `npm run build`
- Build (memoria extra): `npm run build:mem`
- Tests unitarios: `npm test`
- Tests CI (headless): `npm run test:ci`
- Cobertura: `npm run test:coverage`
- E2E (Playwright): `npm run e2e`

## Configuración de entornos

Los ficheros de entorno están en `src/environments/` (por ejemplo `environment.ts`, `environment.prod.ts`).

## Despliegue

Generar artefactos:

```bash
npm run build
```

Salida: `dist/openpanelspa`.

La app usa rutas con hash (`useHash: true`), por lo que puede publicarse en hosting estático sin reglas de rewrite.

Prueba local del build:

```bash
npx serve -s dist/openpanelspa
```

## Troubleshooting (Angular 21)

### El puerto 4200 está en uso

```bash
npm run start -- --port=4300
```

### Advertencias de template tipo `NG8107` (optional chaining)

Angular 21 endurece el type-checking en plantillas. Si el valor no puede ser `null/undefined`, evita `?.`.

Ejemplo:

```html
{{ (form.get('descripcion')?.value ?? '').length }}
```

### `bundle initial exceeded maximum budget`

Es un warning de budgets. Opciones:

- Optimizar/lazy-load de dependencias pesadas (ej. editores, charts).
- Ajustar budgets en `angular.json` si está justificado.

### `start:mem`/`build:mem` en Windows

Estos comandos usan `NODE_OPTIONS` para evitar errores de memoria en builds grandes.

### Playwright falla en primera ejecución

Instala navegadores:

```bash
npx playwright install
```

## Referencias

- Documentación CoreUI Angular: `https://coreui.io/angular/docs/`
