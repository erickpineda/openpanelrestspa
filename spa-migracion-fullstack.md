# Migración Fullstack SPA — Cambios de API y requisitos

## Resumen

- Se han normalizado rutas con constantes (`OpUrlApiConstants`) y eliminado hardcodes.
- Se han añadido endpoints por código/clave en varias entidades.
- Se han reemplazado mensajes "OK" por respuestas i18n vía `TranslatorService`.
- Todas las respuestas siguen el envelope `OpenpanelApiResponse` con `result`, `data`, `error`.

## Endpoints nuevos/ajustados

- Etiquetas (`/api/v1/etiquetas`)
  - GET /obtenerPorCodigo/{codigo}
  - PUT /actualizarPorCodigo/{codigo}
  - DELETE /borrarPorCodigo/{codigo}
  - POST /buscar (paginado: pageNo, pageSize)

- Categorías (`/api/v1/categorias`)
  - GET /obtenerPorCodigo/{codigo}
  - PUT /actualizarPorCodigo/{codigo}
  - DELETE /borrarPorCodigo/{codigo}
  - POST /buscar (paginado)

- Tipos de Entrada (`/api/v1/tiposEntradas`)
  - GET "" (listar paginado)
  - GET /obtenerPorId/{id}
  - POST /crear
  - PUT /{id}
  - DELETE /{id}
  - GET /obtenerPorCodigo/{codigo}
  - PUT /actualizarPorCodigo/{codigo}
  - DELETE /borrarPorCodigo/{codigo}

- Estados de Entrada (`/api/v1/estadosEntradas`)
  - GET /obtenerPorCodigo/{codigo}
  - PUT /actualizarPorCodigo/{codigo}
  - DELETE /borrarPorCodigo/{codigo}

- Plantillas Email (`/api/v1/plantillaEmail`)
  - GET /obtenerPorCodigo/{codigo}
  - PUT /actualizarPorCodigo/{codigo}
  - DELETE /borrarPorCodigo/{codigo}

- Parámetros de Plantilla (`/api/v1/plantillaEmail/parametros`)
  - GET /listarPorIdPlantilla/{idPlantillaEmail}
  - GET /obtenerPorClave/{clave}
  - GET /obtenerPorValor/{valor}

- Comentarios (`/api/v1/comentarios`)
  - GET /listarPorIdEntrada/{idEntrada} (paginado)
  - POST /buscar (paginado)

- Entradas (`/api/v1/entradas`)
  - GET /obtenerPorSlug/{slug}
  - GET /buscar/definicionesBuscador

- Literales (`/api/v1/literales`)
  - GET /obtenerPorCodigoLiteral/{codigoLiteral}
  - GET /obtenerPorCodigoPropiedad/{codigoPropiedad}

- Agravios (`/api/v1/agravios`)
  - GET /obtenerPorPalabra/{palabra}

- Excepciones (`/api/v1/excepciones`)
  - GET /obtenerPorUuid/{uuid}

- Sesiones (`/api/v1/sesiones`)
  - GET /obtenerPorHashSesionToken/{hash}

## Privilegios de acceso (SPA)

- Público: `VER_CONTENIDO_PUBLICO` para lecturas (entradas, comentarios, categorías, etiquetas, tipos/estados).
- Restringido: `VER_CONTENIDO_RESTRINGIDO` para endpoints administrativos (usuarios, roles, privilegios, dashboard, sesiones, excepciones).
- Escritura:
  - Comentarios: `COMENTAR` (crear/editar/borrar).
  - Entradas: `CREAR_ENTRADAS`, `EDITAR_ENTRADAS_PROPIAS`, `EDITAR_ENTRADAS_TODO`, `PUBLICAR_ENTRADAS`, `BORRAR_ENTRADAS`.
  - Configuración: `CONFIGURAR_SISTEMA` (categorías, estados, tipologías, plantillas, herramientas).

## Paginación en SPA

- Query params: `pageNo` (default 0), `pageSize` (default 20).
- Respuesta paginada se entrega dentro de `OpenpanelApiResponse.data` con estructura estándar (usar `PaginaResponseUtils` en server; la SPA sólo parsea `data`).

## Mensajes i18n (UX)

- Se han introducido claves nuevas de borrado:
  - `tipoentrada.mensaje.borrado.ok`
  - `estadoentrada.mensaje.borrado.ok`
  - `plantilla.mensaje.borrado.ok`

- SPA debe mostrar `result.message` si existe; cuando un borrado es correcto, el servidor devuelve la clave traducida en `data` (string).

## Contratos y OpenAPI

- Swagger canónico: `c:\dev\git\openpanelrest\swagger.yaml` actualizado con todos los paths nuevos.
- Envelope de respuesta: siempre `OpenpanelApiResponse`.

## Consideraciones de migración

- Rutas normalizadas: consumir siempre endpoints bajo `/api/v1` y utilizar los nuevos paths listados arriba.
- Evitar asumir textos "OK": la SPA debe renderizar el mensaje devuelto (i18n).
- Buscar endpoints usan `SearchRequestDTO` con `searchCriteriaList` y `dataOption`.

## Próximos pasos para SPA

- Actualizar mapeos de servicios: categorías, etiquetas, tipos y estados por código.
- Ajustar vistas de detalle: entrada por `slug`, comentario por `idEntrada` (paginado), agravio por `palabra`, `username` para usuarios, excepciones por `uuid`, sesiones por `hash`, literales por `codigoLiteral` y así sucesivamente el resto.
- Internacionalización: usar siempre el `data` del servidor como mensaje para operaciones de borrado/éxito.

