## Alcance y Objetivo

* Aplicar un estilo elegante y profesional en todo el área Admin (Dashboard, Entradas, Páginas, Comentarios, Gestión, Multimedia), excluyendo el módulo Público.

* Basar la unificación visual en patrones ya implantados en listados de entradas y usuarios: encabezado moderno, filtros estilizados, tabla responsive con overlay de carga, badges/avatares y modales coherentes.

## Principios de Diseño

* Reutilizar CoreUI y el módulo compartido existente: [SharedCoreUiModule](file:///c:/dev/git/openpanelrestspa/src/app/shared/shared-coreui.module.ts).

* Definir tokens/mixins SCSS para colores, espaciados, bordes y sombras; usar clases CoreUI (text-*-emphasis, bg-opacity-*, border-opacity-\*).

* Estandarizar estructuras: c-card con borde superior destacado, header con icono/acción, bloque de filtros expandible, tabla con loader overlay, footer con paginación.

* Integrar iconos vía iconSubset inicializado en [AdminComponent](file:///c:/dev/git/openpanelrestspa/src/app/admin/admin.component.ts#L67). Añadir solo los necesarios.

## Exclusión del Módulo Público

* Mantener estilos acotados al layout Admin mediante un scope CSS en el root del Admin (selector de [AdminComponent](file:///c:/dev/git/openpanelrestspa/src/app/admin/admin.component.ts#L26)).

* Evitar cambios en [PublicModule](file:///c:/dev/git/openpanelrestspa/src/app/public/public.module.ts) y rutas públicas [PublicRoutingModule](file:///c:/dev/git/openpanelrestspa/src/app/public/public-routing.module.ts).

## Estilo Base (SCSS)

* Añadir variables y utilidades en estilos globales con scope .admin-shell (o similar) aplicado en la plantilla del Admin.

* Mixins: header-elevado, bloque-filtros, tabla-overlay, badge-rol, modal-footer.

* No tocar estilos públicos; el scope asegura que solo afecte a Admin.

## Componentes y Patrones a Uniformar

* Listados: seguir patrón de [listado-entradas.component.html](file:///c:/dev/git/openpanelrestspa/src/app/admin/base/entradas/listado-entradas.component.html) y el nuevo de Usuarios.

* Filtros: input-group con botón "Filtros" y panel expandible; usar ErrorBoundary en filtros avanzados.

* Tablas: cTable hover, thead con tipografía secundaria, tbody con badges/avatares y acciones en ButtonGroup.

* Loader overlay: capa semitransparente con spinner (SpinnerModule) sobre la tabla.

* Paginación: c-pagination estándar, o componente compartido si ya existe (OpPaginationComponent en [shared.module.ts](file:///c:/dev/git/openpanelrestspa/src/app/shared/shared.module.ts)).

* Modales: encabezado y pie coherentes; accesibles con aria-labels.

## Módulos a Tratar

* Dashboard: tarjetas y gráficos con headers y toolbars homogéneos.

* Entradas/Páginas: listados y formularios; ya usan patrón base.

* Comentarios: unificar listado con el patrón de tablas y filtros.

* Gestión (Usuarios/Roles/Privilegios): aplicar el patrón ya hecho en Usuarios al resto.

* Multimedia (Imágenes/Archivos): filtros/date-range, tabla y acciones.

* Base Admin y navegación: coherencia en header/sidebar.

## Iconos y Badges

* Consolidar iconos necesarios en iconSubset; registrar en AdminComponent.

* Mapear estados/roles a badges con colores/emphasis consistentes.

## Errores y Loaders

* Usar ErrorBoundaryComponent donde haya cargas asíncronas complejas.

* Definir loader overlay reutilizable para tablas/listados.

## Accesibilidad y Responsividad

* Añadir aria-labels/aria-live en alerts y botones.

* Gestionar focus en modales y navegación.

* Revisar truncado de textos y tooltips en columnas.

## Estrategia de Implementación

1. Incorporar scope CSS en layout Admin (clase root) y utilidades SCSS.
2. Actualizar listados clave (Entradas, Comentarios, Páginas) al patrón común.
3. Extender a Gestión (Usuarios ya hecho; Roles/Privilegios similar).
4. Unificar Multimedia (Imágenes/Archivos) con filtros y tabla.
5. Ajustar Dashboard (headers, toolbars y badges).
6. Revisar iconos/badges y error/loader consistentes.
7. QA visual y pruebas unitarias básicas donde existan.

## Validación

* Navegar por rutas Admin (ver [app-routing.module](file:///c:/dev/git/openpanelrestspa/src/app/app-routing.module.ts)) y verificar consistencia.

* Confirmar que Público (Home/Login/About/Contact) queda intacto.

¿Confirmas que avancemos con este plan para aplicar el estilo elegante en todo el Admin, manteniendo intacta la parte pública?
