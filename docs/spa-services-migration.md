# SPA Servicios — Migración Fullstack

## Endpoints y Servicios

- Etiquetas
  - obtenerPorCodigo, actualizarPorCodigo, borrarPorCodigo, buscar
  - Servicio: core/services/data/etiqueta.service.ts
- Categorías
  - obtenerPorCodigo, actualizarPorCodigo, borrarPorCodigo, buscar
  - Servicio: core/services/data/categoria.service.ts
- Tipos de Entrada
  - listar paginado, obtenerPorId, crear, actualizar, borrar, obtener/actualizar/borrar por código
  - Servicio: core/services/data/tipo-entrada.service.ts
- Estados de Entrada
  - obtener/actualizar/borrar por código
  - Servicio: core/services/data/estado-entrada.service.ts
- Plantillas Email
  - obtener/actualizar/borrar por código
  - Servicio: core/services/data/plantilla-email.service.ts
- Parámetros de Plantilla
  - listarPorIdPlantilla, obtenerPorClave, obtenerPorValor
  - Servicio: core/services/data/plantilla-email-parametros.service.ts
- Comentarios
  - listarPorIdEntrada (paginado), buscar
  - Servicio: core/services/data/comentario.service.ts
- Entradas
  - obtenerPorSlug, buscar/definicionesBuscador
  - Servicio: core/services/data/entrada.service.ts
- Literales
  - obtenerPorCodigoLiteral, obtenerPorCodigoPropiedad
  - Servicio: core/services/data/literales.service.ts
- Agravios
  - obtenerPorPalabra
  - Servicio: core/services/data/agravios.service.ts
- Excepciones
  - obtenerPorUuid
  - Servicio: core/services/data/excepciones.service.ts
- Sesiones
  - obtenerPorHashSesionToken
  - Servicio: core/services/data/sesiones.service.ts

## Constantes y Envelope

- Rutas: src/app/shared/constants/op-restapi.constants.ts (OPRestMethods)
- Envelope: OpenpanelApiResponse via BaseService (safe* helpers)
- Paginación: pageNo, pageSize (OPConstants.Pagination)

## Observaciones Swagger

- Literales: rutas no presentes en src/assets/docs/swagger.yaml; crear en backend

