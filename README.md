# Openpanelspa

Este proyecto fue generado con [Angular CLI](https://github.com/angular/angular-cli) versión 16.2.12.

## Descripción

Openpanelspa es una aplicación Angular diseñada para la gestión avanzada de datos. Incluye funcionalidades como:

- Componentes reutilizables para formularios, tablas y notificaciones.
- Integración con CoreUI para estilos y diseño.
- Módulos compartidos para facilitar la reutilización de código.
- Soporte para lazy loading y preloading de módulos.

## Estructura del proyecto

```plaintext
openpanelrestspa/
├── angular.json
├── db.json
├── karma.conf.js
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.spec.json
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── polyfills.ts
│   ├── styles.scss
│   ├── test.ts
│   ├── typings.d.ts
│   ├── app/
│   │   ├── app-routing.module.ts
│   │   ├── app.component.css
│   │   ├── app.component.html
│   │   ├── app.component.spec.ts
│   │   ├── app.component.ts
│   │   ├── app.module.ts
│   │   ├── admin/
│   │   │   ├── admin-routing.module.ts
│   │   │   ├── admin.component.html
│   │   │   ├── admin.component.scss
│   │   │   ├── admin.component.spec.ts
│   │   │   ├── admin.component.ts
│   │   │   ├── admin.module.ts
│   │   │   ├── base/
│   │   │   │   ├── base-routing.module.ts
│   │   │   │   ├── base.component.html
│   │   │   │   ├── base.component.ts
│   │   │   │   ├── base.module.ts
│   │   │   │   ├── categorias/
│   │   │   │   ├── comentarios/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── entradas/
│   │   │   │   ├── etiquetas/
│   │   │   │   ├── paginas/
│   │   │   │   ├── perfil/
│   │   │   │   ├── roles/
│   │   │   │   ├── usuarios/
│   │   │   ├── default-layout/
│   │   │   │   ├── _nav.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── default-footer/
│   │   │   │   ├── default-header/
│   │   │   ├── perfil/
│   │   │       ├── user.component.ts
│   │   ├── core/
│   │   │   ├── core.module.ts
│   │   │   ├── _helpers/
│   │   │   │   ├── auth.guard.ts
│   │   │   ├── _utils/
│   │   │   │   ├── base.service.ts
│   │   │   │   ├── crud.service.ts
│   │   │   │   ├── jwt.utils.ts
│   │   │   │   ├── search-operation.util.ts
│   │   │   ├── directives/
│   │   │   │   ├── unsaved-work.directive.ts
│   │   │   ├── errors/
│   │   │   │   ├── error-boundary/
│   │   │   │   ├── global-error/
│   │   │   ├── features/
│   │   │   │   ├── session-expired.component.html
│   │   │   │   ├── session-expired.component.scss
│   │   │   │   ├── session-expired.component.ts
│   │   │   │   ├── unsaved-work-modal.component.html
│   │   │   ├── interceptor/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   ├── models/
│   │   │   ├── preloading/
│   │   │   ├── services/
│   │   ├── public/
│   │   │   ├── public-routing.module.ts
│   │   │   ├── public.component.html
│   │   │   ├── public.component.scss
│   │   │   ├── public.component.ts
│   │   │   ├── public.module.ts
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   ├── footer-public/
│   │   │   ├── header-public/
│   │   │   ├── home/
│   │   │   ├── login/
│   │   │   ├── nav-bar-public/
│   │   ├── shared/
│   │   │   ├── shared.component.ts
│   │   │   ├── shared.module.ts
│   │   │   ├── components/
│   │   │   ├── constants/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   ├── utils/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── _charts.scss
│   │   │   ├── _custom.scss
│   │   │   ├── _examples.scss
│   │   │   ├── _fixes.scss
│   │   │   ├── _layout.scss
│   │   │   ├── _scrollbar.scss
│   │   │   ├── _variables.scss
│   │   │   ├── startbootstrap.scss
│   │   ├── img/
│   │   │   ├── avatars/
│   │   │   ├── brand/
│   │   ├── js/
│   │       ├── scripts.js
│   ├── environments/
│       ├── environment-base.ts
│       ├── environment.dev.es.ts
│       ├── environment.prod.es.ts
│       ├── environment.prod.ts
│       ├── environment.ts
```

La aplicación está organizada en los siguientes módulos principales:

- **CoreModule**: Contiene servicios globales, interceptores y lógica central de la aplicación.
- **SharedOPModule**: Proporciona componentes y directivas reutilizables como el buscador avanzado y manejo de errores globales.
- **SharedWidgetsModule**: Incluye widgets reutilizables como loaders y toasts.
- **SharedCoreUiModule**: Configura y exporta módulos de CoreUI utilizados en toda la aplicación.
- **AdminModule**: Módulo para la administración, incluye dashboards y gestión de usuarios.
- **PublicModule**: Módulo para vistas públicas como inicio de sesión y páginas informativas.

## Servidor de desarrollo

Ejecuta `ng serve` para iniciar un servidor de desarrollo. Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si cambias alguno de los archivos fuente.

## Generación de código

Ejecuta `ng generate component nombre-componente` para generar un nuevo componente. También puedes usar `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Construcción

Ejecuta `ng build` para construir el proyecto. Los artefactos de construcción se almacenarán en el directorio `dist/`.

## Ejecución de pruebas unitarias

Ejecuta `ng test` para ejecutar las pruebas unitarias mediante [Karma](https://karma-runner.github.io).

## Ejecución de pruebas end-to-end

Ejecuta `ng e2e` para ejecutar las pruebas end-to-end mediante una plataforma de tu elección. Para usar este comando, primero necesitas agregar un paquete que implemente capacidades de pruebas end-to-end.

## Módulos compartidos

### SharedCoreUiModule

- Configura y exporta módulos de CoreUI como `ToastModule`, `ModalModule`, y más.
- Asegúrate de importarlo en los módulos que necesiten estilos y componentes de CoreUI.

### SharedWidgetsModule

- Incluye componentes reutilizables como:
  - `OpLoaderComponent`: Loader genérico.
  - `ToastsContainerComponent`: Contenedor para notificaciones tipo toast.
- Exporta `SharedCoreUiModule` para facilitar su uso en otros módulos.

### SharedOPModule

- Proporciona componentes y directivas reutilizables como:
  - `BuscadorAvanzadoComponent`: Componente para búsquedas avanzadas.
  - `GlobalErrorComponent`: Manejo de errores globales.
- Importa y exporta `SharedWidgetsModule`.

## Mejores prácticas

1. **Documentación**:
   - Mantén actualizada la documentación de los módulos compartidos.

2. **Pruebas**:
   - Implementa pruebas unitarias para validar la correcta configuración de los módulos.

3. **Revisión de código**:
   - Realiza revisiones de código para asegurar que los módulos compartidos estén correctamente utilizados.

4. **Automatización**:
   - Configura pipelines de CI/CD para validar la estructura del proyecto y ejecutar pruebas automáticamente.

## Ayuda adicional

Para obtener más ayuda sobre Angular CLI, usa `ng help` o consulta la [documentación oficial de Angular CLI](https://angular.io/cli).
