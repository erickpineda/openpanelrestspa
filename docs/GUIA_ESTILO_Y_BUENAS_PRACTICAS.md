# Guía de Estilo y Buenas Prácticas: OpenPanel SPA

Este documento detalla los estándares de diseño y desarrollo aplicados para lograr una interfaz **elegante, profesional y consistente** en el panel de administración, enfatizando el uso correcto de la librería **CoreUI**.

## 1. Filosofía de Diseño: "Elegante y Profesional"

El objetivo de la reciente actualización visual ha sido reducir el "ruido visual", mejorar la legibilidad y ofrecer una experiencia de usuario (UX) fluida y moderna.

### Principios Clave:
*   **Minimalismo Funcional**: Mostrar solo la información necesaria.
*   **Consistencia**: Todos los componentes (botones, modales, tablas) deben comportarse y verse igual.
*   **Feedback Inmediato**: El usuario siempre debe saber qué está pasando (spinners, toasts, deshabilitación de botones).
*   **Espaciado (Whitespace)**: Uso generoso del espacio para separar conceptos.

---

## 2. Componentes CoreUI: La Base del Sistema

Es fundamental **respetar y utilizar los componentes nativos de CoreUI** en lugar de elementos HTML crudos o soluciones nativas del navegador (como `alert` o `confirm`).

### ¿Por qué CoreUI?
1.  **Coherencia Visual**: Garantiza que todos los elementos sigan el mismo lenguaje de diseño.
2.  **Accesibilidad (a11y)**: Los componentes vienen con atributos ARIA y navegación por teclado preconfigurados.
3.  **Mantenibilidad**: Actualizar la librería actualiza el estilo de toda la aplicación automáticamente.

---

## 3. Mejoras Visuales Aplicadas

A continuación se detallan los patrones específicos implementados en los módulos de **Imágenes, Archivos, Etiquetas y Entradas**.

### 3.1. Modales vs. Diálogos Nativos
**Antes**: Se usaba `confirm('¿Estás seguro?')` del navegador. Esto es intrusivo y rompe la estética.
**Ahora**: Se utiliza `<c-modal>` con `backdrop="static"`.

**Ejemplo de Código (HTML):**
```html
<c-modal [visible]="confirmationModalVisible" backdrop="static">
  <c-modal-header class="bg-danger text-white">
    <h5 cModalTitle>Confirmar eliminación</h5>
  </c-modal-header>
  <c-modal-body>
    ¿Estás seguro de que deseas eliminar <strong>{{ item?.nombre }}</strong>?
  </c-modal-body>
  <c-modal-footer>
    <button cButton color="secondary" (click)="cancel()">Cancelar</button>
    <button cButton color="danger" (click)="confirm()">Eliminar</button>
  </c-modal-footer>
</c-modal>
```

### 3.2. Botones de Acción "Ghost"
Para las acciones secundarias en tablas (editar, eliminar, ver), utilizamos la variante `ghost`. Esto reduce la carga visual de la tabla.

*   **Clase**: `variant="ghost"`
*   **Tamaño**: `size="sm"`
*   **Iconos**: Deben heredar el color del botón. **NO** forzar clases de color (ej. `text-danger`) dentro del SVG si el botón ya tiene `color="danger"`, ya que esto rompe el efecto *hover* (el icono se vuelve invisible sobre el fondo de color).

**Incorrecto:**
```html
<button cButton color="danger" variant="ghost">
  <svg cIcon name="cilTrash" class="text-danger"></svg> <!-- Mal: fuerza color fijo -->
</button>
```

**Correcto:**
```html
<button cButton color="danger" variant="ghost">
  <svg cIcon name="cilTrash"></svg> <!-- Bien: hereda color y cambia a blanco en hover -->
</button>
```

### 3.3. Tarjetas y Contenedores
Para dar un aspecto moderno y "limpio":
*   **Bordes**: `border-0` en las tarjetas principales.
*   **Sombras**: `shadow-sm` para dar profundidad sutil.
*   **Cabeceras**: Fondo blanco (`bg-white`) con borde inferior sutil, en lugar de cabeceras grises pesadas.

```html
<c-card class="mb-4 shadow-sm border-0">
  <c-card-header class="bg-white border-bottom py-3">
    <!-- Título y acciones -->
  </c-card-header>
</c-card>
```

### 3.4. Paginación Limpia
Se eliminó el recuadro blanco (`shadow-sm` innecesario) alrededor del componente de paginación para que se integre mejor en el pie de página de la tarjeta.

---

## 4. Buenas Prácticas Técnicas

### 4.1. Limpieza de Payload (DTOs)
El frontend a menudo utiliza campos auxiliares para la vista (ej. `categoriasConComas`, `usernameCreador`). Estos campos **no deben enviarse al backend** si no existen en el DTO de Java, ya que provocarán errores `400 Bad Request`.

**Patrón Recomendado:**
Antes de llamar al servicio, eliminar propiedades no deseadas:
```typescript
if ('campoAuxiliar' in entidad) {
  delete (entidad as any).campoAuxiliar;
}
service.guardar(entidad).subscribe(...);
```

### 4.2. Gestión de Formularios en Modales
Al reutilizar un modal para "Crear" y "Editar", es crucial limpiar el formulario correctamente.
*   **Editar**: Usar `patchValue()` con los datos existentes.
*   **Crear**: Usar `reset()` explícito para evitar que datos residuales de una edición anterior aparezcan en la creación.

### 4.3. Manejo de Imágenes (Base64 vs URL)
Para previsualizaciones consistentes:
*   Usar `FileReader` para convertir `File` -> `Base64` (data:image...).
*   El backend espera `byte[]`, por lo que enviar el string Base64 es correcto.
*   Evitar enviar URLs (`blob:` o `http:`) en el payload de guardado si el backend espera el contenido del archivo.

---

## 5. Resumen de Cambios Recientes

1.  **Dashboard**: Corrección del modal "Ajustar Parámetros" (integración correcta de componentes).
2.  **Imágenes/Galería**:
    *   Iconos visibles en botones ghost.
    *   Previsualización correcta de imágenes seleccionadas (uso de Base64).
    *   Modal de confirmación de eliminación (CoreUI) reemplazando `confirm()`.
3.  **Archivos**:
    *   Implementación completa de eliminación con modal CoreUI.
    *   Alineación visual de botones.
4.  **Etiquetas**:
    *   Limpieza de formulario al crear.
    *   Corrección visual en paginación.
5.  **Entradas**:
    *   Corrección de error 400 (payload limpio).
    *   Previsualización de imagen destacada corregida.

---

*Documento generado automáticamente por Trae AI - 02/01/2026*
