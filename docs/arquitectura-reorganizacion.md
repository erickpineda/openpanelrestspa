# Reorganización Modular SPA — Guía de Arquitectura

## Estructura de Carpetas

```
src/app/
├── core/
│   ├── _utils/              # utilidades y helpers (con barril index.ts)
│   └── services/            # servicios compartidos (con barriles por subcarpeta)
├── shared/                  # componentes/pipes/directivas compartidas
└── features/
    ├── public/              # módulo público (placeholder inicial)
    └── admin/               # módulo administrativo (placeholder inicial)
```

## Alias de Imports

- @app/* → src/app/*
- @core/* → src/app/core/*
- @core/_utils/* → src/app/core/_utils/*
- @shared/* → src/app/shared/*
- @features/* → src/app/features/*
- @env/* → src/environments/*

## Barriles

- core/_utils/index.ts reexporta utilidades públicas
- core/services/index.ts reexporta subcarpetas: auth, data, ui, utils, srv-busqueda
- Cada subcarpeta posee su propio index.ts con exportaciones públicas

## Consideraciones

- No se han movido servicios; se mantiene funcionalidad y endpoints
- Migración incremental: futuras fases moverán módulos a features
