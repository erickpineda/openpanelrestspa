# Documento técnico y funcional — Buscador Avanzado (genérico v2) + extensiones (Entradas) + variantes (Usuarios/Comentarios/Roles/Privilegios)

## Nota sobre documentación (híbrido)
- Este documento es la guía “práctica” para la SPA (resumen operativo).
- La documentación técnica detallada oficial vive en:
  - `docs/openpanel-feature-adv-search-detailed.docx`

## 0) Resumen ejecutivo
- El sistema implementa un contrato único de búsqueda basado en un árbol lógico (`SearchQuery`) que permite combinar condiciones con AND/OR.
- Existe un componente genérico de UI (`<app-buscador-avanzado>`) que edita ese árbol y lo emite listo para backend, aplicando reglas de “higiene” (evitar condiciones incompletas, serializar fechas, fallback).
- Entradas usa el buscador genérico “potenciado”: definiciones + auto-trigger + catálogos (select dinámico) + convivencia con búsqueda básica.
- Usuarios, Comentarios, Roles y Privilegios usan el mismo contrato `SearchQuery`, pero su “avanzado” es un formulario fijo que construye el payload desde TS (sin `<app-buscador-avanzado>`).

## 1) Alcance y objetivos
### 1.1. Objetivos funcionales
- Permitir búsquedas simples y avanzadas de forma consistente en el panel admin.
- Permitir reglas avanzadas: combinar múltiples campos y condiciones, agrupar y anidar lógica, filtrar por nulos, fechas, booleanos, enumerados, etc.

### 1.2. Objetivos técnicos
- Unificar payload de búsqueda en `SearchQuery`.
- Reducir errores por criterios incompletos o formatos inválidos.
- Facilitar que nuevas entidades se integren con definiciones y mapeos mínimos.

## 2) Contrato común de búsqueda
### 2.1. Modelo de datos
Definición: `src/app/shared/models/search.models.ts`

- `SearchQuery`
  - `node: SearchNode`

- `SearchNode` (recursivo)
  - Group node
    - `type: 'group'`
    - `op: 'AND' | 'OR'`
    - `children: SearchNode[]`
  - Condition node
    - `type: 'condition'`
    - `field: string`
    - `op: string` (p.ej. `contains`, `equal`, `null`, `greater_than`, …)
    - `value?: any` (se omite para `null` / `not_null`)

Reglas:
- El operador de grupo (`SearchGroupOp`) siempre en mayúsculas: `AND` o `OR`.
- Las operaciones de condición suelen ser minúsculas (el backend las espera así).
- `null` y `not_null` no admiten `value`.

### 2.2. Formatos y serialización (fechas)
Utilidades: `src/app/shared/utils/date-utils.ts`

- `date` (input HTML `type="date"`)
  - input: `YYYY-MM-DD`
  - serialización SPA → backend: `yyyy-MM-dd`
- `datetime` (input HTML `type="datetime-local"`)
  - input: `YYYY-MM-DDTHH:mm` o `YYYY-MM-DDTHH:mm:ss`
  - serialización SPA → backend: `yyyy-MM-ddTHH:mm:ss`

Nota:
- El backend puede aceptar más formatos (ver `parseAllowedDate`), pero la SPA, al serializar inputs nativos, envía ISO local (`yyyy-MM-dd` / `yyyy-MM-ddTHH:mm:ss`).

## 3) Buscador Avanzado genérico (UI v2)
### 3.1. Componentes
- Lógica: `src/app/shared/components/buscador-avanzado/buscador-avanzado.component.ts`
- Template: `src/app/shared/components/buscador-avanzado/buscador-avanzado.component.html`

### 3.2. Comportamiento funcional
- Editor recursivo de búsqueda avanzada:
  - añadir condiciones
  - añadir grupos (AND/OR)
  - anidar grupos
  - eliminar nodos
- Cada condición permite seleccionar:
  - Campo
  - Operación
  - Valor (si aplica)
- Para `null/not_null` no se solicita valor.

### 3.3. Configuración (inputs)
- `definiciones`: definiciones (campos/ops/tipos) de backend.
- `defaultField`: campo inicial sugerido.
- `camposPrioritarios`: campos que aparecen primero en el selector.
- `camposCatalogo`: campos que deben usar catálogo en operaciones de igualdad.
- `cargarCatalogosFn`: función (observable) para cargar catálogos.
- `autoTrigger`: emite cambios en caliente.
- `showSearchButton`, `showClearButton`: botones de acción visibles.

### 3.4. Eventos (outputs)
- `filtroSeleccionado: SearchQuery`
  - Se emite en “Buscar” y también tras “Limpiar”.
- `filtroChanged: SearchQuery`
  - Se emite en cada cambio si `autoTrigger=true`.
- `onSearch: SearchQuery`
  - Evento auxiliar al pulsar “Buscar” (útil si el contenedor separa “selección” de “acción”).
- `onClear: void`
  - Evento auxiliar al pulsar “Limpiar”.

### 3.5. Reglas clave del payload (higiene)
Implementación: `buildQuery()` / `stripAndSerialize()`

- Se eliminan criterios incompletos:
  - si `value` está vacío (`'' | null | undefined`) y la operación requiere valor, la condición se descarta.
  - excepción: `contains` en campo string permite `value: ''`.
- Operaciones sin valor:
  - `null` / `not_null` se envían sin `value`.
- Fallback garantizado:
  - si el árbol queda vacío tras descartar nodos:
    - usa un campo string con `contains ''`, o
    - si no hay strings, usa `not_null` en el primer campo disponible.

### 3.6. Widgets por tipo
Según el tipo adaptado:
- `string` → input text
- `number` → input number
- `date` → input date
- `datetime` → input datetime-local
- `boolean` → select true/false
- `select` → select (enumValues/catálogo)

## 4) Definiciones del buscador (SearchDefinitions)
### 4.1. Contrato esperado
Modelo: `src/app/shared/models/search.models.ts`

Campos típicos:
- `entity`
- `fields[]`: `key`, `type`, `operations[]`, opcional `enumValues[]`, etc.
- `example?`: `SearchQuery` de ejemplo (para pre-cargar árbol).
- `hints?`: indicaciones a mostrar.

### 4.2. Adaptación “amigable” a UI
Utilidad: `src/app/shared/utils/buscador-definiciones.util.ts`

Responsabilidades:
- Traducir operaciones a labels (Contiene, Igual a…).
- Normalizar operaciones (incluye soportes legacy/abreviados).
- Mapear tipos backend a tipos de widget (`TipoCampoBuscador`).
- Traducir labels de campo por entidad cuando existe mapeo (`buscador-traducciones.util.ts`).

### 4.3. Mapeo de tipos por entidad/campo
Archivo: `src/app/shared/utils/buscador-tipos-campos.util.ts`

- Se usa como fallback/refuerzo cuando el tipo backend no basta o se quiere asegurar widget.
- Entradas tiene un mapeo extenso.

## 5) Utilidad transversal (pantallas sin editor genérico)
### 5.1. SearchUtilService
Servicio: `src/app/core/services/utils/search-util.service.ts`

- `buildRequest(entityName, criteria[], dataOption)`:
  - crea un `SearchQuery` de 1 condición o un grupo `AND/OR` con varias.
  - normaliza operaciones a minúsculas (`CONTAINS` → `contains`, etc.).
  - serializa fechas si aplica.
- `normalizeGroupOp`:
  - devuelve `OR` si input es `OR` o `ANY`.
  - si no, devuelve `AND` por defecto.

Nota operativa:
- Varias pantallas pasan `dataOption='ALL'`. En la práctica funciona como `AND` por fallback del normalizador (no por mapeo explícito).

## 5.2. Backend: whitelist de campos (por qué hay 400)
Concepto:
- El backend no acepta cualquier `condition.field`; solo los campos permitidos en su “whitelist” por entidad.
- Si la SPA envía un `field` no permitido, la respuesta típica es 400 por “campo no permitido”.

Regla práctica:
- La SPA no debe inventar keys: usar las keys de definiciones (`definicionesBuscador`) o las ya utilizadas por pantallas existentes.

## 6) Implementación “potenciada”: Entradas
### 6.1. UI y configuración
Integración en filtros:
- Archivo: `src/app/features/admin/entradas/components/entradas-filter/entradas-filter.component.html`

Configuración utilizada (concepto):
- `autoTrigger=true`
- `showSearchButton=true`, `showClearButton=true`
- `defaultField='titulo'`
- `camposPrioritarios=['titulo']`
- `camposCatalogo=['tipoEntrada.nombre','estadoEntrada.nombre','categoria.nombre','etiqueta.nombre']`
- `cargarCatalogosFn` para obtener opciones de selects

### 6.2. Catálogos
Carga/caché:
- `src/app/core/services/data/entrada-catalog.service.ts`

Regla UI:
- Para `camposCatalogo`, si `op` es `equal` o `not_equal` se usa `<select>` aunque el catálogo esté cargando.

### 6.3. Convivencia con búsqueda básica
Regla:
- Al alternar avanzado, se limpia la búsqueda básica para no mezclar estado.

### 6.4. Ejecución y paginación
- En modo avanzado:
  - se ejecuta `applySearchQuery(query)` y el estado guarda `lastSearchQuery` para paginar.
- En modo básico:
  - se construye un query simple desde parámetros actuales.

Estado/fachada:
- `src/app/features/admin/entradas/services/listado-entradas-state.service.ts`
- `src/app/features/admin/entradas/services/entradas-list-facade.service.ts`

### 6.5. Endpoints de Entradas
- Definiciones: `GET /entradas/buscar/definicionesBuscador`
  - `src/app/core/services/data/entrada.service.ts`
- Buscar: `POST /entradas/buscar` + `pageNo` + `pageSize` (+ sort)
  - `src/app/core/services/data/entrada.service.ts`

## 7) Variantes actuales por entidad (sin editor genérico)
Estas pantallas no usan `<app-buscador-avanzado>` pero usan `SearchQuery`.

### 7.1. Usuarios
UX:
- Básico: texto que filtra por usuario (username).
- Avanzado: filtros fijos adicionales (rol, email confirmado).

Construcción del payload:
- Usa `SearchUtilService.buildRequest`.
- Criterios:
  - `username` + `CONTAINS`
  - `rol.codigo` + `EQUAL`
  - `emailConfirmado` + `BOOLEAN` (se pasa como string desde la pantalla)

Implementación:
- `src/app/features/admin/gestion/usuarios/listado-usuarios.component.ts`

Endpoint:
- `POST /usuarios/buscar?pageNo=...&pageSize=...&sort=<field>,<ASC|DESC>`
- `src/app/core/services/data/usuario.service.ts`

### 7.2. Comentarios
UX:
- Básico: texto (contenido).
- Avanzado: usuario, aprobado, cuarentena.

Construcción del payload:
- Construcción manual de `SearchQuery` (no usa `SearchUtilService`).
- Criterios:
  - `contenido` + `contains`
  - `usuario.username` + `contains`
  - `aprobado` + `equal`
  - `cuarentena` + `equal`
- Agrupa en `AND` si hay más de 1 condición.

Implementación:
- `src/app/features/admin/comentarios/listado-comentarios.component.ts`

Endpoint:
- `POST /comentarios/buscar?pageNo=...&pageSize=...&sort=<field>,<ASC|DESC>`
- `src/app/core/services/data/comentario.service.ts`

### 7.3. Roles
UX:
- Básico + avanzado fijo (filtro por nombre) con aplicar/limpiar.

Construcción del payload:
- Usa `SearchUtilService.buildRequest('Rol', criteria, 'ALL')`.
- Criterio:
  - `nombre` + `CONTAINS`

Implementación:
- `src/app/features/admin/gestion/roles/listado-roles.component.ts`

Endpoint:
- `POST /roles/buscar?pageNo=...&pageSize=...&sort=<field>,<ASC|DESC>`
- `src/app/core/services/data/rol.service.ts`

### 7.4. Privilegios
UX:
- Básico + avanzado fijo (filtro por nombre).

Construcción del payload:
- Usa `SearchUtilService.buildRequest('Privilegio', criteria, 'ALL')`.
- Criterio:
  - `nombre` + `CONTAINS`

Implementación:
- `src/app/features/admin/gestion/privilegios/listado-privilegios.component.ts`

Endpoint:
- `POST /privilegios/buscar?pageNo=...&pageSize=...&sort=<field>,<ASC|DESC>`
- `src/app/core/services/data/privilegio.service.ts`

## 8) Reglas de calidad a respetar
- No enviar `value` en `null/not_null`.
- Evitar enviar condiciones incompletas (en pantallas manuales, añadir criterios solo si tienen valor).
- Mantener consistencia de operaciones:
  - si se usan tokens legacy (`CONTAINS/EQUAL/BOOLEAN`), normalizar con `SearchUtilService` o enviar minúsculas.
- Para selects dinámicos (catálogos):
  - implementar proveedor de catálogos (`cargarCatalogosFn`) y configurar `camposCatalogo`.

## 9) Ejemplos de payload
Condición simple:
```json
{
  "node": { "type": "condition", "field": "nombre", "op": "contains", "value": "admin" }
}
```

Grupo AND:
```json
{
  "node": {
    "type": "group",
    "op": "AND",
    "children": [
      { "type": "condition", "field": "username", "op": "contains", "value": "juan" },
      { "type": "condition", "field": "rol.codigo", "op": "equal", "value": "ADMIN" }
    ]
  }
}
```

No nulo:
```json
{
  "node": { "type": "condition", "field": "fechaPublicacion", "op": "not_null" }
}
```

Fecha (date) serializada por SPA:
```json
{
  "node": { "type": "condition", "field": "fechaPublicacion", "op": "greater_than_equal", "value": "2026-01-01" }
}
```

Fecha/hora (datetime) serializada por SPA:
```json
{
  "node": { "type": "condition", "field": "fechaCreacion", "op": "less_than", "value": "2026-04-23T12:30:00" }
}
```

## 10) Checklist para integrar una nueva entidad con el buscador genérico
- Backend:
  - endpoint de definiciones (SearchDefinitions)
  - endpoint de búsqueda (`SearchQuery`)
- Frontend:
  - montar `<app-buscador-avanzado [definiciones]="...">`
  - conectar eventos a la llamada de búsqueda
  - opcional: traducciones (`buscador-traducciones.util.ts`)
  - opcional: mapeos de tipo (`buscador-tipos-campos.util.ts`)
  - opcional: catálogos (camposCatalogo + cargarCatalogosFn)

