# Registro de Cambios - Mejoras UI OpenPanel SPA

## [2026-01-06] - Restauración de Diseño y Mejoras Globales

### Restauración de Componentes
- **Eliminar Privilegio**: Se ha recreado el componente `EliminarPrivilegioComponent` restaurando su diseño original "elegante" (iconos centrados, sin bordes en header/footer).
- **Eliminar Rol**: Se ha recreado el componente `EliminarRolComponent` con el mismo diseño visual restaurado.
- **Integración**: Se han actualizado `listado-privilegios.component.html` y `listado-roles.component.html` para utilizar estos componentes específicos en lugar del modal genérico.

### Mejoras Globales (Propagación de Estilo)
- **Modal de Confirmación Compartido**: Se ha actualizado `confirmation-modal.component.html` para adoptar el mismo estilo "elegante":
  - Iconos grandes centrados (`cilTrash`, `cilWarning`, `cilInfo`) según el tipo de alerta.
  - Títulos coloreados y en negrita.
  - Botones centrados en el pie de página.
  - Eliminación de bordes en cabecera y pie para una apariencia más limpia.
  - Esto asegura que la eliminación de Usuarios, Comentarios y Multimedia ahora comparta la misma estética profesional.

### Internacionalización (i18n)
- Se han añadido nuevas claves de traducción en `es.json`:
  - `ADMIN.PRIVILEGES.DELETE_TITLE`, `DELETE_CONFIRMATION`, `DELETE_WARNING`
  - `ADMIN.ROLES.DELETE_TITLE`, `DELETE_CONFIRMATION`, `DELETE_WARNING`
  - `COMMON.YES_DELETE`

### Correcciones Previas
- **Literales**: Se corrigieron las referencias a `AUTO.*` reemplazándolas por claves válidas de i18n.
- **Modales**:
  - Se añadió `backdrop="static"` para prevenir cierres accidentales.
  - Se añadió `scrollable` a los modales largos.
  - Se estandarizó el uso de botones "ghost" para acciones secundarias.

## Archivos Modificados
- `src/app/admin/base/gestion/gestion.module.ts`
- `src/app/admin/base/gestion/privilegios/eliminar/eliminar-privilegio.component.ts` (Nuevo)
- `src/app/admin/base/gestion/privilegios/eliminar/eliminar-privilegio.component.html` (Nuevo)
- `src/app/admin/base/gestion/roles/eliminar/eliminar-rol.component.ts` (Nuevo)
- `src/app/admin/base/gestion/roles/eliminar/eliminar-rol.component.html` (Nuevo)
- `src/app/admin/base/gestion/privilegios/listado-privilegios.component.html`
- `src/app/admin/base/gestion/roles/listado-roles.component.html`
- `src/app/shared/components/confirmation-modal/confirmation-modal.component.html`
- `src/assets/i18n/es.json`
