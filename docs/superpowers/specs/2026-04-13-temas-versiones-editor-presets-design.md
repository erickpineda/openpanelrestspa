# Diseño — Temas: Versionado + Editor Tokens + Presets pro

**Fecha:** 2026-04-13  
**Repos:** `openpanelrest` (backend) + `openpanelrestspa` (frontend)  
**Motivación:** Mejorar gestión de temas para poder **volver atrás (rollback)**, **editar tokens con menos fricción** y **potenciar presets** (merge, sistema, tags).

---

## 1) Objetivos

1. Permitir **historial** de versiones publicadas por tema:
   - Ver listado con metadatos
   - **Activar** una versión concreta
   - **Rollback** a versión anterior
   - **Comparar** tokens entre versiones (diff)
   - **Borrar** versiones antiguas
   - **Notas** por versión (campo real en BD)
2. Mejorar UX de edición de tokens:
   - Vista **JSON ↔ Tabla key/value**
   - Validación semántica básica (tokens `--`, duplicados, tipos)
3. Potenciar Presets:
   - Aplicar preset como **replace** o **merge**
   - Presets **de sistema** (solo lectura)
   - **Tags** para filtrar (light/dark/high-contrast…)

---

## 2) Datos / BD (Flyway)

### 2.1 OP_TEMA_VERSION: notas por versión
**Migración:** `V4__op_tema_version_release_notes.sql`

```sql
ALTER TABLE OP_TEMA_VERSION
  ADD COLUMN RELEASE_NOTES VARCHAR(500) NULL AFTER PUBLISHED_BY;
```

Reglas:
- Texto corto (hasta 500 chars)
- Editable tras publicar (sin cambiar tokens)

### 2.2 OP_TEMA_PRESET: presets de sistema y tags
**Migración:** `V5__op_tema_preset_system_tags.sql`

```sql
ALTER TABLE OP_TEMA_PRESET
  ADD COLUMN IS_SYSTEM TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE OP_TEMA_PRESET
  ADD COLUMN TAGS VARCHAR(255) NULL;
```

Semántica:
- `IS_SYSTEM=1`: no editable / no borrable desde UI (solo lectura)
- `TAGS`: CSV simple (`"dark,contrast"`)

---

## 3) Backend (openpanelrest) — Contratos/API

### 3.1 Versiones publicadas

#### Listar versiones
`GET /api/v1/config/temas/{slug}/versions?state=PUBLISHED`

Respuesta (ejemplo conceptual):
```json
{
  "elements": [
    {
      "version": 3,
      "state": "PUBLISHED",
      "publishedAt": "2026-04-13T12:00:00",
      "publishedBy": "admin",
      "releaseNotes": "Ajuste de colores",
      "sourceType": "TOKENS_ONLY",
      "checksum": "..."
    }
  ]
}
```

#### Activar una versión concreta
Reutilizar existente:
`POST /api/v1/config/temas/{slug}/activate?version={n}`

#### Rollback rápido
`POST /api/v1/config/temas/{slug}/rollback`
- Activa la versión publicada inmediatamente anterior a la activa.
- Si no hay anterior: 400 con mensaje claro.

#### Comparar dos versiones
`GET /api/v1/config/temas/{slug}/compare?from={n}&to={n}`

Salida propuesta:
```json
{
  "from": 2,
  "to": 3,
  "added": { "--x": "..." },
  "removed": { "--y": "..." },
  "changed": {
    "--cui-primary": { "from": "#0ea5e9", "to": "#1d4ed8" }
  }
}
```

Notas:
- diff de tokens (clave/valor) es suficiente.
- metadata diff es opcional (fase 2).

#### Borrar una versión publicada
`DELETE /api/v1/config/temas/{slug}/versions/{n}`

Reglas:
- Si se intenta borrar una versión inexistente: 404.
- Si se borra la versión activa: limpiar tema activo (volver a default).
- No borrar DRAFT con este endpoint (solo published).

#### Actualizar notas de una versión
`PATCH /api/v1/config/temas/{slug}/versions/{n}/release-notes`
Body:
```json
{ "releaseNotes": "texto..." }
```

Validaciones:
- `releaseNotes.length <= 500`

### 3.2 Presets

#### Listar presets
`GET /api/v1/config/tema-presets?includeSystem=true`

DTO incluir:
- `isSystem`
- `tags` (csv o array)

Reglas de permisos:
- `isSystem=true` → backend rechaza update/delete (403 o 400 con mensaje).

---

## 4) Frontend (openpanelrestspa) — UX/UI

### 4.1 Historial en “Gestionar tema”
Bloque “Historial” con:
- tabla de versiones (vN, fecha, autor, notas, badge “activa”)
- acciones:
  - Activar versión
  - Rollback
  - Comparar (selector 2 versiones)
  - Borrar
  - Editar notas (inline o modal)

### 4.2 Editor de tokens (Borrador)
En modal de borrador:
- toggle: **JSON** / **Tabla**
- Tabla:
  - añadir/eliminar fila
  - validar token empieza por `--`
  - evitar duplicados
  - valores string/number
- Botón “Aplicar a JSON” (pretty print)

### 4.3 Presets pro
En aplicar preset:
- radio: **Reemplazar** / **Mezclar (merge)**
  - merge: solo sobrescribe tokens presentes en preset
- badges:
  - “Sistema” (solo lectura)
  - tags (chips)
- filtro por tags

---

## 5) Fases de entrega (para reducir riesgo)

**Fase 1 (MVP usable)**
- BD: V4 (release notes)
- Backend: listar versiones + activar versión + editar notas
- SPA: historial (listar + activar + notas)

**Fase 2**
- Backend: rollback + delete version
- SPA: rollback + delete + confirmaciones

**Fase 3**
- Backend: compare
- SPA: UI compare

**Fase 4**
- Tokens editor tabla + presets merge/system/tags

---

## 6) Criterios de aceptación

1. Puedo activar una versión antigua y ver reflejado el activo sin recargar.
2. Puedo hacer rollback con un click y queda auditado (publishedBy/publishedAt ya existe).
3. Puedo ver y editar `releaseNotes` (<= 500 chars).
4. Puedo comparar dos versiones y ver qué tokens cambiaron.
5. Presets: puedo aplicar merge/replace y distinguir presets de sistema.
6. Editor tokens: puedo editar en tabla y se genera JSON válido.

---

## 7) Riesgos / consideraciones

- Borrado de versiones: asegurar consistencia con tema activo y tokens preview.
- Compare: tokensJson puede ser grande; usar parsing seguro y limitar tamaño si hace falta.
- Presets sistema: semilla de datos (insert) opcional; puede añadirse con migración posterior.

