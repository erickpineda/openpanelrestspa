## Estado Actual: Hallazgos Clave
- Componentes con mezcla de responsabilidades (UI + HTTP + estado + negocio): Listado, Pendientes, EntradaForm, Etiquetas.
- Acceso a datos inconsistente: algunos usan fachada/estado, otros llaman servicios directamente.
- Fugas de infraestructura (flags SKIP_GLOBAL_*) desde la capa de feature.
- Tipado laxo en respuestas de búsqueda y adaptaciones ad hoc.
- No se observan dependencias circulares, pero sí acoplamientos innecesarios entre UI y datos.
- Referencias útiles: Listado ([listado-entradas.component.ts](file:///c:/dev/git/openpanelrestspa/src/app/features/admin/entradas/listado-entradas.component.ts)), Pendientes ([entradas-pendientes.component.ts](file:///c:/dev/git/openpanelrestspa/src/app/features/admin/entradas/pendientes/entradas-pendientes.component.ts)), Form ([entrada-form.component.ts](file:///c:/dev/git/openpanelrestspa/src/app/features/admin/entradas/entrada-form/entrada-form.component.ts)), Etiquetas ([entrada-etiquetas.component.ts](file:///c:/dev/git/openpanelrestspa/src/app/features/admin/entradas/entrada-form/components/entrada-etiquetas/entrada-etiquetas.component.ts)), Facade ([entrada-facade.service.ts](file:///c:/dev/git/openpanelrestspa/src/app/features/admin/entradas/entrada-form/srv/entrada-facade.service.ts)), Estado ([listado-entradas-state.service.ts](file:///c:/dev/git/openpanelrestspa/src/app/features/admin/entradas/services/listado-entradas-state.service.ts), [entrada-form-state.service.ts](file:///c:/dev/git/openpanelrestspa/src/app/features/admin/entradas/services/entrada-form-state.service.ts)).

## Objetivos de Arquitectura
- Separar claramente UI, presentación (pages/view models), dominio (servicios), acceso a datos (repositorios) y utilidades.
- Aplicar SOLID; minimizar acoplamiento y maximizar testabilidad.
- Unificar el acceso a datos vía una fachada de feature y repositorios tipados.
- Centralizar manejo de errores y normalización de respuestas.

## Estructura Propuesta de Carpetas/Módulos
- entradas/
  - ui/
    - components/ (entradas-table, entradas-filter, previa-entrada, etiquetas)
  - pages/
    - listado/
    - pendientes/
    - crear/
    - editar/
  - state/
    - listado-entradas.store.ts
    - entrada-form.store.ts
  - domain/
    - models/ (entrada.model.ts, etiqueta.model.ts, search-response.model.ts)
    - services/ (entrada.service.ts, etiquetas.service.ts)
    - facade/ (entradas.facade.ts)
  - data/
    - repositories/ (entrada.repository.ts, etiqueta.repository.ts)
    - adapters/ (search-response.adapter.ts, entrada.adapter.ts)
  - utils/ (html-sanitizer.service.ts, media-preview.service.ts, mappers.ts)
  - entradas-routing.module.ts
  - entradas.module.ts
  - index.ts (barrels por carpeta)

## Patrones de Diseño
- Repository Pattern: interfaces de repositorio + implementación HttpClient; mapping desde DTO a modelos.
- Service Layer: reglas de negocio en `domain/services` orquestando repositorios.
- Facade: `entradas.facade.ts` expone API de alto nivel a pages, integra estado y servicios.
- DI: tokens para repositorios y servicios; providers en `EntradasModule` para facilitar mocks.
- Component-based: componentes UI puros (Inputs/Outputs) y pages como contenedores inteligentes usando facade/store.

## Refactorización Incremental (Fases)
1. Tipos y Adaptadores
   - Crear `search-response.model.ts` y adaptadores centralizados.
   - Introducir modelos `Entrada`, `Etiqueta` y mappers.
2. Repositorios
   - `EntradaRepository` y `EtiquetaRepository`: mover todas las llamadas HTTP de componentes/estado a estas clases.
3. Facade Unificada
   - Ampliar `EntradasFacade` para cubrir Listado, Pendientes y Etiquetas (búsqueda, CRUD, catálogos, borrado). 
   - Que los componentes/pages dejen de usar servicios directos.
4. Utilidades Cross-Cutting
   - `HtmlSanitizerService` y `MediaPreviewService`: extraer sanitización y previews de `EntradaForm`.
5. Estado Consistente
   - Homogeneizar stores (`listado-entradas.store.ts`, `entrada-form.store.ts`) con BehaviorSubject/Signals; eliminar lógica de datos de los stores.
6. Manejo de Errores
   - Centralizar en facade repos/servicios: toast traducidos y reglas de notificación.
7. Tests
   - Unit tests: repositorios, servicios, facade, stores (ordenación/paginación). 
   - Integración: pages con facade mockeado.
8. Limpieza
   - Remover flags SKIP_GLOBAL_* de componentes; decidir en repos/facade.

## Convenciones
- Nomenclatura: `*.model.ts`, `*.repository.ts`, `*.service.ts`, `*.facade.ts`, `*.store.ts`.
- Imports/exports: usar barrels `index.ts` por carpeta; evitar imports profundos.
- Estado: stores sólo UI y cache; lógica de negocio/datos fuera.
- Errores: facade/servicios traducen mensajes antes de mostrarlos y sincronizan i18n en `es.json`/`en.json`.
- Testing: folder `__tests__` por submódulo; mocks vía tokens DI; alta cobertura en adapters y negocio.

## Documentación
- `README.md` en `entradas/` con:
  - Diagrama de capas y flujo de datos.
  - Guía para añadir nuevos repos/servicios/modelos.
  - Ejemplos de uso de facade en pages y de componentes UI puros.
  - Convenciones de errores, i18n y testing.

## Migración de Componentes (Resumen)
- Listado: usar `EntradasFacade` + `listado-entradas.store`; mover catálogos/definiciones al facade.
- Pendientes: delegar búsquedas/paginación en facade + store.
- EntradaForm: extraer sanitización/preview; mantener `entrada-form.store` para UI/temporal.
- Etiquetas: delegar búsqueda/creación al repositorio/servicio; componente como UI.
- Table/Filter: componentes presentacionales estrictos.

## Riesgos y Mitigaciones
- Roturas por cambios de API interna: introducir shims en facade para preservar firmas durante la migración.
- Aumento temporal de complejidad: avanzar por páginas y funcionalidades, con tests de regresión.

## Métricas de Éxito
- Cero llamadas HttpClient desde componentes.
- Reducción de duplicidades de manejo de errores.
- Tipos fuertes y adaptadores únicos para respuestas de búsqueda.
- Tests verdes en stores, facade y repositorios.