## Alcance
Implementar la sección de navegación (enlaces `a`) y menú desplegable (`ul`) del header usando componentes CoreUI Angular, asegurando accesibilidad, coherencia visual y correcto comportamiento.

## Objetivos
- Usar `cnavlink` + `routerLink`/`routerLinkActive` para enlaces.
- Usar `c-dropdown` + `cdropdowntoggle` + `cdropdownmenu` para menú.
- Renderizar iconos con `cIcon` registrados vía `IconSetService`.
- Mantener posición/alineación del menú y estados activos de enlaces.

## Estructura Técnica
- **Contenedor de Header**: `c-header-nav` y `c-container` dentro del layout.
- **Navegación (`a`)**:
  - `cnavlink` + `routerLink` y `routerLinkActive="active"`.
  - `cIcon` para iconos (e.g., `cilBell`, `cilEnvelopeOpen`, `cilTask`, `cilCommentSquare`), tamaño `size="lg"`, espaciado `me-2`.
- **Dropdown (`ul`)**:
  - `c-dropdown alignment="end"`.
  - `cdropdowntoggle` (botón/avatar) para abrir/cerrar.
  - `cdropdownmenu` con items `cdropdownitem`, headers `cdropdownheader` y separadores `cdropdowndivider`.
  - Dejar a CoreUI/Popper el posicionamiento (atributos `data-popper-placement`).

## Módulos Necesarios
- Verificar que el módulo compartido exporta:
  - `HeaderModule`, `NavModule`, `DropdownModule`, `ButtonModule`, `BadgeModule`, `FormModule`, `IconModule`.
- Confirmar `SharedOPModule` usado por el header/layout.

## Iconos
- Completar `icon-subset` con los iconos del header/dropdown si faltasen (bell/list/envelope/task/comment/user/settings/creditcard/file/lock).
- Mantener registro en `IconSetService` (en `AdminComponent`).

## Accesibilidad y UX
- `role="navigation"` en contenedores.
- `aria-label` en toggles/enlaces.
- `aria-busy` en contenedores durante cargas.
- Estados activos con `routerLinkActive` y foco accesible.

## Implementación (pasos)
1. Auditar el componente de header y layout para confirmar uso de `SharedOPModule`.
2. Revisar/actualizar `SharedOPModule` para exportar los módulos CoreUI necesarios.
3. Ajustar markup de enlaces:
   - Reemplazar `a` estándar por `cnavlink` + `routerLink` + `cIcon`.
4. Implementar dropdown:
   - `c-dropdown` con `cdropdowntoggle` y `cdropdownmenu`.
   - Items con `cdropdownitem`; iconos con `cIcon`.
5. Alinear/estilar iconos y items (tamaños/espaciados) respetando CoreUI.
6. Comprobar accesibilidad y estados activos.

## Validación
- Navegación funcional a rutas esperadas.
- Dropdown abre/cierra y posiciona correctamente.
- Iconos se renderizan.
- Cross-browser (Chrome/Firefox/Edge/Safari móvil). 

## Entregables
- Header actualizado con navegación y dropdown CoreUI.
- Ajuste de `SharedOPModule` (si aplica) y `icon-subset`.
- Notas en `docs/coreui-adoption.md` sobre Header/Dropdown.

## Riesgos y Mitigación
- Iconos faltantes: añadir a `icon-subset` y registrar.
- Estilos globales que interfieran: encapsular estilos, evitar sobrescribir clases CoreUI.

¿Confirmas que proceda con la actualización del Header y Dropdown según este plan?