# Módulo de Búsqueda Reutilizable

## API
- Componentes:
  - op-search-basic
    - Inputs: placeholder, autoTrigger
    - Outputs: onSearch(term: string), onClear()
  - app-buscador-avanzado
    - Inputs: definiciones, autoTrigger, debounceMs, showSearchButton, showClearButton, placeholder
    - Outputs: filtroSeleccionado(payload), filtroChanged(payload), onSearch(payload), onClear()
- Servicio:
  - SearchStoreService: setTerm, setAdvanced, setResults, clear, state$

## Uso
```html
<op-search-basic
  [placeholder]="'Buscar por título...'"
  (onSearch)="buscarBasico($event)"
  (onClear)="limpiarBasico()"
></op-search-basic>
<app-buscador-avanzado
  [definiciones]="defs"
  [autoTrigger]="true"
  (onSearch)="aplicarAvanzado($event)"
  (onClear)="limpiarAvanzado()"
></app-buscador-avanzado>
```

## Integración
- Importar SharedSearchModule en el módulo de la entidad.
- Usar SearchStoreService para leer/escribir estado sin efectos colaterales.
