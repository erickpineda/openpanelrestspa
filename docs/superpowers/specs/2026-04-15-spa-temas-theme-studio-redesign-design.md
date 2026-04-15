# Diseño — SPA Temas: Theme Studio (ruta dedicada) + Modo Simple/Avanzado

**Fecha:** 2026-04-15  
**Ámbito:** `openpanelrestspa` (UX/UI) + endpoints existentes de `openpanelrest` (sin cambios en esta fase)  
**Problema:** La gestión actual de Temas se hace pesada porque el modal “Gestionar tema” concentra demasiadas funciones (acciones peligrosas, historial, presets, edición, ayuda), reduciendo espacio de trabajo y claridad.

---

## 1) Objetivos

1. Sustituir el “workspace en modal” por una **pantalla dedicada** (“Theme Studio”) con más espacio y mejor jerarquía.
2. Soportar perfil **mixto** (técnico y no técnico) con un **switch Simple/Avanzado**:
   - **Simple (recomendado):** no tocar JSON; ajustes básicos + presets.
   - **Avanzado:** tokens (tabla/JSON), versiones, diff, etc.
3. Persistir el modo seleccionado **por usuario y por tema** (localStorage).
4. Mantener el listado de Temas como punto de entrada con acciones rápidas (sin saturarlo).

---

## 2) No objetivos (por ahora)

- Rediseño visual completo del Admin (estilo, branding).
- Refactor masivo de servicios/estado global.
- Rehacer backend o el modelo de datos de temas.

---

## 3) IA / Navegación (Information Architecture)

### 3.1 Listado de Temas (pantalla actual)

Cambios propuestos:
- CTA principal por fila: **“Abrir Studio”**
- Acciones rápidas se mantienen (activar/desactivar/reset/preview), pero:
  - evitar abrir/encadenar modales como “workspace”
  - el modal actual puede quedar **solo como acciones rápidas** temporalmente (Fase 1).

### 3.2 Nueva pantalla: Theme Studio (ruta dedicada)

Ruta recomendada:
- `/admin/configuracion/temas/:slug` (ajustar al routing real del proyecto)

Breadcrumb:
- Configuración → Temas → `:slug`

---

## 4) Layout del Theme Studio

### 4.1 Estructura

- **Sidebar (izquierda, persistente)**
  - Overview
  - Simple (Recomendado)
  - Borrador
  - Versiones
  - Preview
  - Ajustes
- **Topbar sticky (arriba, persistente)**
  - Estado: Activo / Publicado / Borrador
  - Acciones: Publicar, Activar/Desactivar, Rollback (solo si aplica), Más…
- **Área de contenido**
  - render de la sección seleccionada (1 a la vez)

### 4.2 Principio UX clave

> “Una sección = un trabajo”.  
Se elimina la sensación de “modal saturado” separando tareas en pantallas/secciones con espacio suficiente.

---

## 5) Switch Simple/Avanzado (“Soy técnico”)

### 5.1 Comportamiento

- Toggle visible en sidebar o topbar:
  - Texto sugerido: **“Modo avanzado (soy técnico)”**
- En modo **Simple**:
  - se muestran controles básicos + presets y acciones recomendadas
  - se ocultan herramientas potencialmente intimidantes (JSON, diff, etc.)
- En modo **Avanzado**:
  - se muestran todas las herramientas.

### 5.2 Persistencia (por usuario + por tema)

Persistencia en localStorage:
- Key: `op_admin_theme_studio_mode::<userId>::<slug>`
- Value: `simple` | `advanced`

Reglas:
- Por defecto: `simple`
- Al entrar al studio se aplica el último modo guardado para ese `userId + slug`.

> Nota: si no hay `userId` accesible fácilmente, fallback a `op_admin_theme_studio_mode::<slug>`.

---

## 6) Modo Simple (recomendado)

Objetivo: permitir “resultados” sin editar JSON.

### 6.1 Controles recomendados (6)

1. Primary: `--cui-primary`
2. Primary RGB: `--cui-primary-rgb` (opcional auto-derivado)
3. Background: `--cui-body-bg`
4. Text: `--cui-body-color`
5. Border: `--cui-border-color`
6. Secondary text: `--cui-secondary-color`

UX:
- Inputs tipo color picker + input de texto
- Preview inmediata (idealmente usando el runtime ya existente)

### 6.2 Acciones disponibles en Simple

- Aplicar preset (replace/merge)
- Guardar borrador
- Preview (copiar link / abrir)
- Publicar
- Activar/Desactivar (según estado)

---

## 7) Modo Avanzado

Incluye:
- Editor tokens **Tabla ↔ JSON** con validación
- Versiones (activar/rollback/compare/borrar/notas)
- Herramientas (validar JSON, ejemplos)

---

## 8) Estrategia de transición (reducción de riesgo)

### Fase 1 (introducción)
- Añadir Theme Studio sin eliminar UI actual.
- En listado: añadir botón **Abrir Studio**.
- Modal actual puede coexistir (para “acciones rápidas”).

### Fase 2 (des-saturación)
- Mover funcionalidades del modal al studio (si aún quedan).
- Reducir el modal a “acciones rápidas” o eliminarlo si ya no aporta.

---

## 9) Criterios de aceptación

1. Un tema se puede gestionar sin abrir modales grandes: todo se hace en Theme Studio.
2. Existe toggle Simple/Avanzado y persiste por usuario+tema.
3. En modo Simple puedo ajustar los 6 tokens recomendados sin tocar JSON.
4. En modo Avanzado puedo acceder a tokens/versions/diff.
5. El listado no se vuelve más complejo: mantiene acciones rápidas y CTA “Abrir Studio”.

---

## 10) Notas de implementación (para el plan posterior)

- Reutilizar `TemasService`, `ThemeRuntimeService`, `PublicThemesService`.
- Crear componentes:
  - `TemaStudioPageComponent`
  - `TemaStudioSidebarComponent`
  - `TemaStudioTopbarComponent`
  - Secciones: `OverviewSection`, `SimpleSection`, `DraftSection`, `VersionsSection`, `PreviewSection`, `SettingsSection`
- i18n: añadir nuevas claves para labels, toggle y menú lateral.

