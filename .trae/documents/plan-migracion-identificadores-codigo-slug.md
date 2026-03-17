# Plan detallado: Migración de identificadores secuenciales a código/slug

## 1) Alcance y objetivos

* Sustituir el uso de identificadores numéricos secuenciales en navegación y APIs visibles por claves semánticas u opacas (código o slug).

* Mantener compatibilidad transitoria con `id` para no romper integraciones ni enlaces existentes (redirecciones y “fallback” en servicios).

* Alinear documentación OpenAPI/Swagger y el frontend a las nuevas rutas y contratos.

* Excepciones: campos de auditoría internos (p.ej., `idUsuarioEditado`) y relaciones internas del backend pueden seguir siendo numéricos si no se exponen.

## 2) Estado actual (fuente Swagger y código)

* Swagger: `src/assets/docs/swagger.yaml` (OpenAPI 3.0.3, v1.0.0).

* Soporte por entidad (resumen):

  * Entradas: id = sí; slug = sí; ambos = sí.

  * Categorías, Etiquetas, Tipos: id = sí; código = sí; ambos = sí.

  * Estados de Entrada: id = no; código = sí.

  * Usuarios: id = sí; por `username` = GET/PUT/DELETE disponibles.

  * Roles y Privilegios: los servicios de frontend ya usan endpoints por `codigo` (ver `core/services/data/rol.service.ts` y `.../privilegio.service.ts`); en Swagger actual no constan variantes por código → hay que alinear documentación (y/o implementar si faltara en backend). Constantes REST aún reflejan solo variantes por id.

  * Plantilla Email: por `codigo`; Parámetros de Plantilla listan por id y obtienen por clave/valor.

* Constantes REST actuales a revisar: `src/app/shared/constants/op-restapi.constants.ts`.

* Enrutado admin a revisar: `features/admin/**/routing.module.ts` (Entradas, Gestión, etc.).

## 3) Reglas de diseño del identificador

* Código: string alfanumérico con `-`/`_`, único e inmutable por entidad; pensado para backoffice y APIs.

* Slug: string kebab-case legible, único e inmutable por entidad; orientado a URLs públicas (Entradas/Páginas).

* Unicidad/estabilidad: cambios excepcionales, requieren redirección permanente y actualización de referencias.

* Errores y validación backend:

  * 422: formato inválido.

  * 409: violación de unicidad.

  * 404: no encontrado.

## 4) Arquitectura de transición (Frontend)

* Abstracción EntityRef: encapsular acceso por `codigo`/`slug` con fallback a `id` mientras dure la transición.

* Servicios “safe\*”: intentan primero por `codigo`/`slug`; si 404/501, reintentan por `id` (solo en admin).

* Resolvers y redirecciones:

  * Aceptar `{id|codigo|slug}` en parámetros.

  * Resolver clave canónica y redirigir a la URL nueva (301 interna).

* Caching y trackBy: normalizar claves a `codigo`/`slug` para listas y stores.

* Feature flag por entidad: conmutar entre “dual” y “solo código/slug” sin redeploy amplio.

## 5) Cambios por entidad (Frontend)

### Entradas (slug)

* Rutas admin/consulta: `:idEntrada` → `:slug` con resolver que acepta `id` y redirige.

* Servicios:

  * Usar `GET /entradas/obtenerPorSlug/{slug}` para lectura.

  * Mantener `PUT/DELETE` por `id` hasta tener variantes por `slug`; preparar `safeActualizarPorSlug`/`safeBorrarPorSlug`.

* Archivos a tocar (orientativo):

  * `features/admin/entradas/entradas-routing.module.ts`

  * `core/services/data/entrada.service.ts` (añadir safe\* si falta)

  * Resolutores/Componentes de formulario de entrada (lectura por slug).

### Categorías / Etiquetas / Tipos / Estados (código)

* Cambiar rutas admin: `:id` → `:codigo` con redirección si llega `:id`.

* Servicios: usar endpoints por código en GET/PUT/DELETE (constantes ya existen para varios recursos).

* Archivos a tocar (orientativo):

  * `features/admin/categorias/**`

  * `features/admin/etiquetas/**`

  * `core/services/data/{categoria,etiqueta,tipo-entrada,estado-entrada}.service.ts`

  * `shared/constants/op-restapi.constants.ts` (verificar/exponer métodos por código donde falten).

### Usuarios

* Clave canónica: `username` (opaco/estable).

* Swagger actualizado expone `GET/PUT/DELETE` por `username`.

* Frontend (Fase 2): migración completa a rutas `:username` y servicios por username para lectura/edición/borrado.

* Preparar resolvers con redirección desde `:id` a `:username` durante transición.

### Roles / Privilegios

* Frontend: servicios ya adaptados a `codigo` (overrides GET/PUT/DELETE por código). Ver:

  * `core/services/data/rol.service.ts`

  * `core/services/data/privilegio.service.ts`

* Constantes REST: añadir métodos por código y marcar por id como deprecated.

* Backend/Swagger: si el backend ya soporta estos endpoints, actualizar `swagger.yaml`; si no, implementar equivalentes por código y documentar.

### Comentarios

* Público: referenciar por `entradaSlug` + `codigoComentario` (o UUID) si se expone; si no, ocultar IDs en URLs.

* Admin: mantener `id` interno; en UI pública, no exponer números secuenciales.

## 6) Cambios necesarios en Backend (Swagger y API)

* Usuarios: ya existen `GET/PUT/DELETE` por `username` (OK). Mantener documentación y ejemplos actualizados.

* Roles/Privilegios: confirmar soporte actual por `codigo` (el frontend ya lo usa). Acciones:

  * Si existen en backend: incluir `obtenerPorCodigo/actualizarPorCodigo/borrarPorCodigo` en `swagger.yaml` con ejemplos.

  * Si faltan: implementarlos y documentarlos.

* Comentarios: clave pública no secuencial (UUID o `codigoComentario`), y listados/filtro por `entradaSlug`.

* Estado Flujos / Parámetros Plantilla: definir “código” y exponer operaciones por código si corresponde.

* Validaciones:

  * Índices únicos nuevos en BBDD para `codigo`/`slug`.

  * Backfill de códigos/slugs para registros existentes.

  * Estrategia de colisión y normalización (p.ej., transliteración para slugs).

* Actualizar `swagger.yaml`: rutas, esquemas, ejemplos y deprecaciones de `id`.

## 7) Plan de implementación por fases

### Fase 0 — Preparación

* Acordar formatos y reglas de negocio de `codigo`/`slug`.

* Backfill de datos y creación de índices únicos.

* Añadir mensajes i18n de validación y errores.

### Fase 1 — Infraestructura Frontend

* Implementar `EntityRef`, utilidades de parámetros, resolvers y redirecciones.

* Introducir servicios `safe*` y feature flags por entidad.

* Ajustar claves de caché y `trackBy`.

### Fase 2 — Migración con soporte dual (sin cambios backend)

* Entradas, Categorías, Etiquetas, Tipos, Estados: mover lectura/edición a `codigo/slug` donde ya existen; rutas `:id` → `:codigo/:slug` con redirecciones.

* Usuarios: lectura/edición/borrado por `:username` y servicios por username; rutas legacy por id redirigen.

* Roles/Privilegios: ya usan `codigo` en servicios. Alinear `op-restapi.constants.ts` añadiendo métodos por código y marcando los de id como deprecated; verificar rutas admin `:codigo`.

* PR Frontend #1: constantes, rutas, servicios, resolvers, pruebas (incluye alineación Roles/Privilegios).

### Fase 3 — Backend (endpoints faltantes)

* Implementar y documentar endpoints por código para Usuarios, Roles, Privilegios, Comentarios, Estado Flujos, Parámetros.

* PR Backend #1: API + Swagger actualizados.

### Fase 4 — Frontend sobre nuevas APIs

* Cambiar servicios a “solo código/slug” para entidades de Fase 3; mantener fallback temporal.

* PR Frontend #2: activación por feature flag y retirada gradual del id en navegación pública.

### Fase 5 — Deprecación y limpieza

* Marcar paths por id como `deprecated` en OpenAPI.

* Telemetría de uso; plan de retirada del fallback.

* Eliminar rutas por id y claves de caché antiguas; actualizar documentación.

## 8) Verificación y calidad

* Unit tests:

  * Servicios `safe*` (primero código/slug, fallback id).

  * Resolvers con redirección canónica.

* E2E:

  * Navegación usando rutas nuevas y legacy (redirigen a canónica).

  * CRUD por código/slug en admin.

* Auditoría de enlaces:

  * Buscar `:id` en plantillas, docs y navegación; actualizar.

* Seguridad:

  * Revisar IDOR: control de acceso por recurso; limitar enumeración; rate limit.

## 9) Compatibilidad y comunicación

* Mapas de rutas legacy→nuevas (internos) y redirecciones 301 internas.

* Changelog, README y notas de migración para integradores.

## 10) Criterios de aceptación

* Rutas públicas usan `:codigo` o `:slug` en todas las entidades objetivo.

* Servicios de lectura/edición funcionan por código/slug en dichas entidades.

* Redirecciones desde URLs con `:id` operativas durante transición.

* Swagger actualizado y pruebas en verde.

## 11) Rollback

* Feature flag para volver a endpoints por id si un despliegue falla.

* Conservar resolvers duales hasta finalizar retirada.

## 12) Riesgos y mitigaciones

* Enlaces rotos: mitigado con resolvers y redirecciones.

* Colisiones de código/slug: validación e índices únicos; backfill controlado.

* Inconsistencia de caché: claves normalizadas y tareas de invalidación.

## 13) Entregables (PRs sugeridos)

* PR FE #1: Infraestructura + migración de Entradas/Categorías/Etiquetas/Tipos/Estados (dual con fallback).

* PR BE #1: Endpoints por código para Roles/Privilegios/Comentarios/Flujos/Parámetros + Swagger.

* PR FE #2: Migración final sobre nuevas APIs + activación feature flags.

* PR FE #3: Deprecación definitiva de rutas por id y limpieza.

## 14) Notas específicas

* Campos internos como `idUsuarioEditado` pueden seguir siendo numéricos para auditoría; no se exponen en rutas.

---

## Anexo A — Auditoría de Swagger y documentación

Fuente revisada por petición del usuario:
- Canonical nuevo: `src/assets/swagger.yaml` (OpenAPI 3.0.3).
- Antiguo: `src/assets/docs/swagger.yaml`.
- UI: `src/assets/docs/swagger.html`.

Resumen de diferencias relevantes entre YAMLs:
- Roles/Privilegios por código:
  - `src/assets/swagger.yaml` incluye `obtenerPorCodigo/actualizarPorCodigo/borrarPorCodigo` y operaciones asociadas (`obtenerPrivilegios`, `actualizarPrivilegios`, etc.).
  - `src/assets/docs/swagger.yaml` solo tenía variantes por id para Roles/Privilegios.
- Usuarios:
  - `src/assets/swagger.yaml` incluye `GET/PUT/DELETE` por `username`.
  - `src/assets/docs/swagger.yaml` solo refleja lectura por id y no documenta las variantes por username.
- FileStorage:
  - `src/assets/swagger.yaml` contiene rutas en dos estilos: `/filestorage/...` y camelCase `/fileStorage/...` (duplicidad y conflicto de estilo).
  - `src/assets/docs/swagger.yaml` usa mayoritariamente `/filestorage/...`.
- Herramientas Auxiliar:
  - `src/assets/swagger.yaml` incluye dos prefijos: `/herramientasauxiliar/*` y `/herramientas/sistema/*`. Debe consolidarse un único espacio de rutas.
  - `src/assets/docs/swagger.yaml` usa `/herramientasauxiliar/*`.
- Cobertura adicional en `src/assets/swagger.yaml`:
  - Tag “Autenticación” (`/auth/*`), “Literales” (`/literales/*`), contadores y listados adicionales en Roles.
  - Seguridad global: `security: [bearerAuth]` a nivel raíz; coherente con `components.securitySchemes`.

Propósito de `swagger.html`:
- Es un visor Swagger UI que intenta cargar `/api/v1/swagger.yaml` del backend y, si no existe, hace fallback a `/assets/swagger.yaml`. Útil para documentación embebida y entornos sin servidor de documentación.

Coherencia del nuevo `src/assets/swagger.yaml` (confirmación rápida):
- Alinea con el plan de migración: añade operaciones por código para Roles/Privilegios y mantiene lectura por `slug` para Entradas y por `codigo` para catálogos.
- Pendientes para completar la migración:
  - Comentarios: definir clave pública no secuencial si se exponen fuera de admin.
  - Consolidar nombres y prefijos de rutas (evitar duplicidad `filestorage` vs `fileStorage`, `herramientasauxiliar` vs `herramientas/sistema`).

Recomendaciones:
- Canonicalizar fuente única: mantener solo `src/assets/swagger.yaml` como fichero YAML local. Eliminar o archivar `src/assets/docs/swagger.yaml` para evitar divergencias.
- Conservar `src/assets/docs/swagger.html` como visor, ya que referencia el canonical (`/assets/swagger.yaml`) si el backend no expone el suyo. Opcional: documentar en README la URL interna de docs.
- Normalizar rutas y estilo:
  - Elegir un único casing (preferible kebab/lowercase consistente) y un único prefijo para herramientas (`/herramientas/sistema/*` o `/herramientasauxiliar/*`).
  - Unificar FileStorage: elegir entre `/filestorage/*` o `/fileStorage/*` y retirar el otro.
- Actualizar `op-restapi.constants.ts` para reflejar nuevas rutas por código en Roles/Privilegios y para cualquier normalización de naming que se acuerde.
