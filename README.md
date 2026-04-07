# Openpanel SPA (Angular 21 + CoreUI)

Aplicación SPA basada en **Angular 21** y **CoreUI**, orientada a la gestión y administración de contenido (área pública + área de administración), con **carga diferida (lazy loading)**, preloading configurable y servicios compartidos.

> Backend (API REST): ver el repositorio `openpanelrest`.

## Tabla de contenidos

- [Características](#características)
- [Requisitos](#requisitos)
- [Inicio rápido](#inicio-rápido)
- [Configuración (environments)](#configuración-environments)
- [Comandos (npm scripts)](#comandos-npm-scripts)
- [Arquitectura y organización](#arquitectura-y-organización)
- [Despliegue](#despliegue)
- [Internacionalización (i18n)](#internacionalización-i18n)
- [Troubleshooting (Angular 21)](#troubleshooting-angular-21)
- [Referencias](#referencias)

## Características

- Routing por áreas con **módulos y lazy loading**.
- **Preloading configurable** (`CustomPreloadingStrategyService`).
- CoreUI (`@coreui/angular` y `@coreui/icons-angular`) como sistema de UI.
- **Internacionalización (i18n)** con `@ngx-translate`.
- E2E con **Playwright** (`npm run e2e`).
- Generación de **sitemap.xml** en `prebuild` (script `scripts/generate-sitemap.mjs`).
- Integraciones comunes: **Chart.js / CoreUI ChartJS**, **CKEditor 5**.

## Requisitos

Requisitos mínimos recomendados (ver `package.json`):

- Node.js `>= 20.19.0`
- npm `>= 10.0.0`

Dependencias principales:

- Angular `^21.2.x`
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

## Configuración (environments)

Los ficheros de entorno están en `src/environments/`:

- `environment.ts` (dev) importa `environment.dev.es.ts`
- `environment.prod.ts` (prod) importa `environment.prod.es.ts`
- Config base: `environment-base.ts`

### Backend (API)

Por defecto, en desarrollo:

- `backend.host`: `http://localhost:8080`
- `backend.uri`: `/api/v1`

En producción (según `environment.prod.es.ts`) se usa:

- `backend.host`: `/api/v1`
- `backend.uri`: `` (vacío)

Ajusta estos valores si tu API corre en otra URL o si necesitas un proxy/reverse-proxy.

### Mock / modo local

En `environment-base.ts` existe la bandera `mock`. Si estás usando datos mock/locales, revisa también `db.json`.

## Comandos (npm scripts)

Principales (ver `package.json`):

- Desarrollo: `npm start`
- Desarrollo (memoria extra, pensado para Windows): `npm run start:mem`
- Build: `npm run build` *(usa configuración `production` por defecto)*
- Build (memoria extra, pensado para Windows): `npm run build:mem`
- Watch build (development): `npm run watch`
- Formateo: `npm run format`
- Formateo (check): `npm run format:check`
- Tests unitarios: `npm test`
- Tests CI (headless): `npm run test:ci`
- Cobertura: `npm run test:coverage`
- E2E (Playwright): `npm run e2e`

> Nota: `start:mem`/`build:mem` usan `set NODE_OPTIONS=...` (Windows). En Linux/Mac puedes ejecutar:
> `NODE_OPTIONS=--max-old-space-size=4096 ng serve` / `NODE_OPTIONS=--max-old-space-size=4096 ng build`

## Arquitectura y organización

### Capas principales

- `src/app/core/`: servicios transversales (auth, interceptores HTTP, manejo de errores, utilidades, estado UI).
- `src/app/shared/`: módulos y componentes reutilizables (wrappers, paginación, búsqueda, errores globales, widgets).
- `src/app/public/`: área pública (home, about, contact, login) y layout público.
- `src/app/admin/`: área de administración (layout CoreUI, navegación, módulos funcionales).

### Routing

El enrutamiento se organiza por áreas y carga diferida:

- `src/app/app-routing.module.ts`:
  - `''` carga `PublicFeatureModule`.
  - `'admin'` carga `AdminFeatureModule` con guard de autenticación.
  - Preloading habilitado con estrategia propia.
  - `useHash: true` para despliegues sin configuración especial de rewrites.

### Admin

El layout de administración vive en `src/app/admin/admin.component.html` y utiliza:

- `c-sidebar` + `c-sidebar-nav` con `navItems` en `src/app/admin/default-layout/_nav.ts`.
- Módulos funcionales bajo `src/app/admin/base/` con lazy loading.

### Estilos

Los estilos base y ajustes a CoreUI están en `src/assets/css/`.

## Despliegue

Generar artefactos:

```bash
npm run build
```

Salida: `dist/openpanelspa`.

La app usa rutas con hash (`useHash: true`), por lo que puede publicarse en hosting estático sin reglas de rewrite.

### Sitemap

Antes del build se genera `src/sitemap.xml` con rutas estáticas. Puedes indicar el dominio base con:

```bash
SITEMAP_BASE_URL="https://tu-dominio.com" npm run build
```

### Prueba local del build

```bash
npx serve -s dist/openpanelspa
```

## Internacionalización (i18n)

Documentación y guía de uso en: [`README_I18N.md`](./README_I18N.md).

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

- Documentación CoreUI Angular: https://coreui.io/angular/docs/

