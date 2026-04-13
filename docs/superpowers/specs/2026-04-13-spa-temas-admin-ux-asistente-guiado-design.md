# Diseño UX/UI — Asistente guiado para Temas (Admin)

**Fecha:** 2026-04-13  
**Producto:** openpanelrestspa  
**Área:** Admin → Configuración → Temas  
**Contexto:** El flujo actual (Presets / Borrador / Publicar / Activar / Preview) funciona, pero es difícil de entender si no conoces el orden y los conceptos (preset, tokens, metadata).

---

## 1. Objetivos

1) Hacer que un usuario nuevo entienda el **orden correcto**:
   - **Borrador → Presets (opcional) → Preview (opcional) → Publicar → Activar**
2) Aclarar conceptos:
   - Qué es un **preset**
   - Qué valores puede tener `tokensJson` (tokens)
   - Qué es `metadataJson` y ejemplos útiles
3) Reducir errores y dudas recurrentes:
   - “Publicado” ≠ “Activo”
   - “No hay borrador” tras publicar (y cómo proceder)
4) Mantener la UI actual, pero con una capa guía “ligera” y reversible (colapsable / ocultable).

---

## 2. Enfoque UX aprobado (mixto)

### 2.1. Wizard completo en el listado (arriba del todo) — **principal**

Un panel superior “**Cómo se usa**” con 4 pasos. Debe ser:
- **Siempre visible** por defecto (pero colapsable).
- **No intrusivo**: ocupa 1 bloque y no bloquea acciones.
- **Contextual**: el CTA principal cambia según el estado del tema seleccionado/gestionado.

**Paso 1 — Borrador**
- Mensaje: “Edita tokens (variables CSS) en el borrador”.
- CTA: “Abrir borrador / Crear borrador”.

**Paso 2 — Presets**
- Mensaje: “Aplica una plantilla reutilizable (tokens + metadata)”.
- CTA: “Gestionar presets”.

**Paso 3 — Preview**
- Mensaje: “Genera un enlace temporal para ver el tema sin activarlo”.
- CTA: “Generar / Copiar URL / Abrir preview”.

**Paso 4 — Publicar y Activar**
- Mensaje: “Publicar crea una versión estable. Activar la aplica a la web pública”.
- CTA: “Publicar” o “Activar” o “Desactivar” según estado.

### 2.2. Resumen compacto en modal “Gestionar” — **secundario**

En el modal de “Gestionar tema”, un bloque superior tipo:
- **Estado actual** (en una frase, no solo badges)
- **Siguiente paso recomendado** (ej.: “Tienes un borrador pendiente: Publica para poder activarlo”)

---

## 3. Estados y vocabulario (UI)

Se deben mostrar con badges + texto:

- **Activo** (verde): “Se está usando en la web pública”.
- **Publicado** (azul): “Existe una versión publicada del tema”.
- **Borrador** (amarillo): “Hay cambios sin publicar”.

Regla: el usuario debe poder distinguir “publicado” vs “activo” sin saber la implementación.

---

## 4. Ayuda inline (Presets / Tokens / Metadata)

### 4.1. Panel “¿Qué es esto?” (expandible)
Ubicación:
- Modal “Presets”
- Modal “Borrador”

Contenido mínimo:
- **Preset**: plantilla reutilizable de `tokensJson` + `metadataJson`.
- **Tokens** (`tokensJson`):
  - Formato JSON `{"--css-var": "valor"}`
  - Solo claves que empiezan por `--`
  - Ejemplos (CoreUI):
    - `--cui-primary`, `--cui-body-bg`, `--cui-body-color`
- **Metadata** (`metadataJson`):
  - JSON libre (no afecta al estilo salvo que la app lo use)
  - Ejemplo recomendado:
    - `{"displayName":"High Contrast Blue","mode":"light","notes":"..."}`

### 4.2. Acciones de ayuda
- Botón “Insertar ejemplo” (rellena el textarea con un ejemplo válido).
- Botón “Validar JSON” (muestra error claro si el JSON no es válido).

---

## 5. Tour (primera vez) + “Saltar”

### 5.1. Comportamiento
- La primera vez que el usuario entra en “Temas”, mostrar un tour corto (4 pasos).
- Debe poder:
  - **Siguiente**
  - **Saltar**
  - **No volver a mostrar** (persistente)

### 5.2. Persistencia
- LocalStorage:
  - `op_admin_themes_tour_dismissed = "true"`

---

## 6. CTA principal por estado (reducir ruido)

En el modal “Gestionar”, se define un botón principal recomendado (sin eliminar el resto de acciones):
- Si hay **borrador**: principal = **Publicar**
- Si hay **publicado** y no activo: principal = **Activar**
- Si es **activo**: principal = **Desactivar**

Los demás botones quedan disponibles como secundarios, pero visualmente menos dominantes.

---

## 7. Requisitos técnicos mínimos (SPA)

1) Implementar el panel guía en `TemasComponent` (pantalla de listado).
2) Añadir textos i18n en `es.json` y `en.json`.
3) Añadir storage key para “No volver a mostrar”.
4) No se requiere backend adicional (solo UI/UX).

---

## 8. Criterios de aceptación

1) Un usuario puede describir el flujo correcto en < 30 segundos leyendo el wizard.
2) Hay explicación clara de qué es Preset/Tokens/Metadata con ejemplos.
3) Existe “Saltar tour” y “No volver a mostrar”.
4) “Publicado” y “Activo” quedan claramente diferenciados en UI.

---

## 9. Fuera de alcance (por ahora)

- Editor avanzado de tokens con autocompletado.
- Import/export de presets.
- Versionado múltiple de published con selección de versión.

