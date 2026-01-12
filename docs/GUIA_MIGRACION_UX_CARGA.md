# Guía de Migración UX de Carga y Buscador Avanzado

Esta guía documenta los pasos necesarios para unificar la experiencia de carga (spinner interno, sin bloqueo global) y la implementación del buscador avanzado en los listados del sistema.

## 1. Objetivos

- Eliminar el cargador global (pantalla completa) durante operaciones de paginación, filtrado y ordenación.
- Implementar un spinner local centrado en el área de contenido (tabla).
- Asegurar transiciones suaves y manejo correcto de errores.
- Implementar patrón de búsqueda unificado (Búsqueda Básica + Botón "Avanzado").

## 2. Capa de Servicio (Service Layer)

Para evitar que el interceptor global muestre el spinner de pantalla completa, se deben crear métodos específicos que pasen el contexto `SKIP_GLOBAL_LOADER`.

### Pasos:

1.  Importar `HttpContext` y la constante del interceptor.
2.  Crear métodos alternativos (ej. `listar...SinGlobalLoader` o `buscar...Safe`).

```typescript
import { HttpClient, HttpContext } from '@angular/common/http';
import { NetworkInterceptor } from '../../interceptors/network.interceptor'; // Ajustar ruta según ubicación

// ...

listarPaginaSinGlobalLoader(page: number, size: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/pagina`, {
    params: { page: page.toString(), size: size.toString() },
    context: new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true)
  });
}
```

## 3. Capa de Componente (Component Layer)

El componente debe gestionar manualmente el estado de carga local y forzar la detección de cambios debido a la naturaleza asíncrona y estrategias de detección (OnPush).

### Requisitos:

- `ChangeDetectorRef` para actualizar la vista.
- `Subject` para limpiar suscripciones (`takeUntil`).
- Variable de estado `cargando` o `cargandoTabla`.

### Implementación Tipo:

```typescript
import { ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subject, takeUntil, finalize } from 'rxjs';

export class MiListadoComponent implements OnInit, OnDestroy {
  cargandoTabla = false;
  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private service: MiService,
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos(): void {
    this.cargandoTabla = true;
    this.cdr.markForCheck(); // Marcar para verificación

    this.service
      .listarPaginaSinGlobalLoader(this.page, this.size)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargandoTabla = false;
          this.cdr.detectChanges(); // Forzar actualización al finalizar (éxito o error)
        }),
      )
      .subscribe({
        next: (data) => {
          this.procesarDatos(data);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.cdr.detectChanges();
        },
      });
  }
}
```

## 4. Capa de Vista (HTML Template)

Reemplazar el uso de `app-op-loader` (si bloquea toda la sección) por un template condicional con spinner de CoreUI.

### Estructura:

```html
<!-- Template de Carga -->
<ng-template #loadingTemplate>
  <div class="text-center py-4">
    <c-spinner [attr.aria-label]="'Cargando datos'"></c-spinner>
    <p class="mt-2 text-muted">Cargando datos...</p>
  </div>
</ng-template>

<!-- Contenedor de Datos -->
<div *ngIf="!cargandoTabla; else loadingTemplate">
  <table cTable>
    <!-- Contenido de la tabla -->
  </table>

  <!-- Paginación -->
  <app-op-pagination ...></app-op-pagination>
</div>
```

## 5. Patrón de Buscador "Avanzado"

Para mantener consistencia con el módulo de Etiquetas y Entradas, se implementa una barra de búsqueda simple con un botón para expandir filtros avanzados.

### En el Componente (.ts):

```typescript
showAdvanced = false;
basicSearchText = '';

toggleAdvanced(): void {
  this.showAdvanced = !this.showAdvanced;
}

onBasicSearchTextChange(text: string): void {
  this.basicSearchText = text;
  // Lógica de búsqueda básica (ej. filtrar por nombre/título)
  this.realizarBusqueda(text);
}
```

### En la Vista (.html):

```html
<div class="mb-4">
  <!-- Fila de Búsqueda Básica -->
  <c-row class="align-items-center mb-3 g-2">
    <c-col xs="12" md="4">
      <!-- Espacio para contadores o vacío -->
    </c-col>
    <c-col xs="12" md="4" class="d-flex justify-content-md-center gap-2">
      <input cFormControl type="text" [value]="basicSearchText" (input)="onBasicSearchTextChange($any($event.target).value)" placeholder="Buscar..." style="max-width: 280px;" />
      <button cButton color="secondary" variant="ghost" size="sm" (click)="toggleAdvanced()">Avanzado</button>
    </c-col>
    <c-col xs="12" md="4">
      <!-- Espacio para selector de tamaño de página o vacío -->
    </c-col>
  </c-row>

  <!-- Contenedor Buscador Avanzado -->
  <div *ngIf="showAdvanced">
    <app-buscador-avanzado ...></app-buscador-avanzado>
    <!-- O formulario manual -->
  </div>
</div>
```

## 6. Consideraciones Adicionales

- **Manejo de Errores**: Asegurar que el spinner desaparezca incluso si ocurre un error (usar `finalize`).
- **Paginación Cliente**: Si el backend no devuelve metadatos de paginación (`totalPages`, `totalElements`), implementar lógica de paginación en cliente (slice del array) como fallback.
- **Accesibilidad**: Incluir `aria-label` en spinners y botones.
