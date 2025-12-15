# Guía de Estilos para Tablas Responsivas

Esta guía define los estándares para implementar tablas en la aplicación, asegurando consistencia visual, responsividad y accesibilidad.

## 1. Estructura General

Todas las tablas deben estar contenidas dentro de un contenedor con la clase `.table-responsive` para manejar el desbordamiento horizontal en dispositivos móviles.

```html
<div class="table-responsive">
  <table cTable hover class="align-middle mb-0 border text-nowrap">
    <!-- Contenido -->
  </table>
</div>
```

## 2. Definición de Columnas

- **Anchos Mínimos**: Asignar `min-width` a las columnas críticas para evitar que se colapsen demasiado.
  - Título/Nombre: `min-width: 200px`
  - Descripción/Contenido: `min-width: 250px`
  - Estado/Acciones: `min-width: 100px`
- **Alineación**:
  - Texto general: Alineado a la izquierda (`text-start`, por defecto).
  - Acciones, Estados, Fechas cortas: Alineado al centro (`text-center`).
  - Números monetarios o métricas: Alineado a la derecha (`text-end`).

## 3. Truncado de Texto

Para celdas con contenido variable que podría romper el diseño, usar truncado de texto con `text-truncate` y proporcionar el contenido completo en un tooltip o atributo `title`.

```html
<td>
  <span class="d-inline-block text-truncate" style="max-width: 250px;" [title]="item.textoCompleto">
    {{ item.textoCompleto }}
  </span>
</td>
```

## 4. Visualización de Estados

Utilizar iconos y colores semánticos para indicar el estado de un registro. Evitar depender solo del color; usar iconos y tooltips.

- **Publicado/Aprobado/Activo**:
  - Icono: `cilCheckCircle`
  - Color: `text-success`
- **Borrador/Oculto**:
  - Icono: `cilEye` (o `cilFile` si es borrador de archivo)
  - Color: `text-warning`
- **Pendiente/En Revisión**:
  - Icono: `cilHistory`
  - Color: `text-warning`
- **Rechazado/Error**:
  - Icono: `cilWarning` o `cilXCircle`
  - Color: `text-danger`

Ejemplo de implementación:

```typescript
getEstadoInfo(item: any): { icon: string, color: string, tooltip: string } {
  if (item.activo) return { icon: 'cilCheckCircle', color: 'text-success', tooltip: 'Activo' };
  return { icon: 'cilHistory', color: 'text-warning', tooltip: 'Inactivo' };
}
```

```html
<svg cIcon [name]="state.icon" [class]="state.color" size="lg" [cTooltip]="state.tooltip"></svg>
```

## 5. Scrollbar Personalizado (CSS)

Para mejorar la estética en Windows/Linux, se aplica un estilo personalizado a la barra de desplazamiento de la tabla.

```scss
.table-responsive {
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0,0,0,0.2);
    border-radius: 4px;
  }
}
```

## 6. Accesibilidad

- Usar `scope="col"` en los encabezados `<th>`.
- Usar `aria-label` en botones de acción que solo tienen iconos.
- Asegurar que los tooltips describan la acción o el estado.
