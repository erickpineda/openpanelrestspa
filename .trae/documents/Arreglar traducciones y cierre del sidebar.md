**Problemas detectados**

* Los títulos de sección del sidebar (title: true) a veces muestran la clave (MENU.\*) en lugar del valor traducido. Los ítems normales sí se traducen.

* En pantallas pequeñas, al abrir el sidebar con el toggler, hacer clic fuera no lo cierra.

**Causas probables**

* La traducción se aplica mutando item.name en AdminComponent, pero CoreUI vuelve a emitir/rehidratar la lista y los títulos pueden quedar sin aplicar, mientras otras capas (estado y badges) clonan ítems.

* El estado de expansión del sidebar se persiste por item.name; al cambiar idioma o al volver a clonar, esa clave deja de ser estable.

* El c-sidebar no tiene backdrop/cierre por clic fuera habilitado.

**Cambios propuestos**

* Render traducido en plantilla:

  * Sustituir <c-sidebar-nav> por el componente existente que ya traduce con pipe: [responsive-navigation.component](file:///c:/dev/git/openpanelrestspa/src/app/shared/components/responsive-navigation/responsive-navigation.component.html).

  * En [admin.component.html](file:///c:/dev/git/openpanelrestspa/src/app/admin/admin.component.html#L27-L31) reemplazar la línea del nav por:

    * \<app-responsive-navigation \[userRole]="userRole" \[navigationItems]="navItems" (navigationItemClick)="" (sidebarToggle)=""></app-responsive-navigation>

  * Este componente usa {{ item.name | translate }} para títulos e ítems, evitando depender de mutaciones en item.name.

* Cierre por clic fuera en móvil:

  * Activar el backdrop del sidebar añadiendo \[backdrop]="true" y enlazar (visibleChange) a una propiedad sidebarVisible en [admin.component.html](file:///c:/dev/git/openpanelrestspa/src/app/admin/admin.component.html#L2-L9).

  * En AdminComponent, controlar \[visible] mediante sidebarVisible; al recibir visibleChange=false por clic en backdrop, cerrar.

  * Fallback: añadir un listener de documento que, si ancho < lg y sidebarVisible=true y el objetivo está fuera de #sidebar, cierre el sidebar.

* Estado del sidebar robusto:

  * En [sidebar-state.service.ts](file:///c:/dev/git/openpanelrestspa/src/app/core/services/ui/sidebar-state.service.ts#L35-L56) persistir y comparar usando un id estable (NavigationUtils.generateItemId) o la url, no por item.name.

  * Actualizar patrones (Taxonomía, Roles/Permisos) para buscar por url/id ([sidebar-state.service.ts](file:///c:/dev/git/openpanelrestspa/src/app/core/services/ui/sidebar-state.service.ts#L123-L168)) y no por 'MENU.\*'.

* Simplificación de traducciones:

  * Mantener updateTranslations para etiquetas del header.

  * Reducir applyTranslationsInPlace de [admin.component.ts](file:///c:/dev/git/openpanelrestspa/src/app/admin/admin.component.ts#L268-L300) a traducir únicamente badges si queremos conservar textos de badges dinámicos; ya no mutar item.name para títulos/ítems porque el render usa pipe.

**Verificación**

* Navegar y cambiar idioma varias veces: los títulos deben permanecer traducidos.

* Abrir el sidebar en móvil y hacer clic fuera: debe cerrarse sin navegar ni refrescar.

* Comprobar que los grupos siguen expandiéndose correctamente al entrar en Entradas/Taxonomía y Roles/Permisos.

¿Quieres que aplique estos cambios y los pruebe ahora?
