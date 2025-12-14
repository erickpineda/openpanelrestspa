# Documentación: Módulo de Páginas

## Resumen

El módulo de Páginas proporciona una vista especializada para gestionar entradas de tipo "Página" en el panel de administración. Este módulo valida el diseño arquitectónico existente donde las páginas son tratadas como un tipo especializado de entrada (Entrada) en lugar de una entidad separada.

## Arquitectura

### Estructura de Archivos

```
src/app/admin/base/paginas/
├── paginas.module.ts                      # Módulo principal
├── paginas-routing.module.ts              # Configuración de rutas
├── listado-paginas.component.ts           # Componente de listado
├── listado-paginas.component.html         # Template del listado
├── listado-paginas.component.scss         # Estilos del componente
└── listado-paginas.component.spec.ts      # Pruebas unitarias
```

### Diseño de Datos

Las páginas reutilizan el modelo `Entrada` existente con las siguientes características:

```typescript
interface Entrada {
  idEntrada: number;
  titulo: string;
  contenido: string;
  tipoEntrada: TipoEntrada;  // Filtrado por nombre = "Página"
  // ... otros campos
}

interface TipoEntrada {
  idTipoEntrada: number;
  nombre: string;            // "Página" para páginas estáticas
  descripcion: string;
}
```

## Funcionalidades

### 1. Listado de Páginas
- Muestra solo entradas con `tipoEntrada.nombre = "Página"`
- Búsqueda y filtrado avanzado
- Paginación del lado del servidor
- Ordenamiento de resultados

### 2. Búsqueda Automática
El componente agrega automáticamente un filtro para tipo de entrada:

```typescript
const searchCriteriaList = [
  {
    filterKey: 'tipoEntrada.nombre',
    value: 'Página',
    operation: 'EQUAL',
    clazzName: 'Entrada'
  },
  // ... criterios adicionales de búsqueda
];
```

### 3. Operaciones CRUD
- **Crear**: Redirige a `/admin/control/entradas/crear`
- **Editar**: Redirige a `/admin/control/entradas/editar/:id`
- **Eliminar**: Elimina la entrada desde el listado de páginas
- **Vista**: Navega a la página de edición

## Uso

### Acceso
La sección de Páginas está disponible en:
- URL: `/admin/control/paginas`
- Navegación: Panel de Administración → Páginas

### Crear una Nueva Página
1. Ir a la sección "Páginas"
2. Click en "Crear nueva Página"
3. Llenar el formulario de entrada
4. Asegurarse de seleccionar "Página" como TipoEntrada
5. Guardar

### Editar una Página Existente
1. En el listado de páginas, click en el botón de editar (ícono de lápiz)
2. Modificar los campos necesarios
3. Guardar cambios

### Eliminar una Página
1. En el listado de páginas, click en el botón de eliminar (ícono de papelera)
2. Confirmar la eliminación en el modal

## Ventajas del Diseño Actual

### ✅ Reutilización de Código
- Usa el mismo servicio `EntradaService`
- Comparte modelos y lógica de negocio
- No duplica funcionalidad

### ✅ Mantenibilidad
- Cambios en entradas se reflejan automáticamente en páginas
- Un solo punto de actualización para mejoras
- Consistencia en la interfaz de usuario

### ✅ Escalabilidad
- Fácil agregar nuevos tipos de entrada (Noticia, Artículo, etc.)
- Cada tipo puede tener su propia vista especializada
- Flexibilidad para agregar campos específicos por tipo

### ✅ Consistencia de Datos
- Un modelo unificado simplifica queries
- Relaciones consistentes con categorías y etiquetas
- Validaciones centralizadas

## Casos de Uso Típicos

### Páginas Estáticas del Sitio Web
- Acerca de / About
- Contacto / Contact
- Soporte / Support
- Términos y Condiciones
- Política de Privacidad
- FAQ / Preguntas Frecuentes

### Ventajas para Páginas Estáticas
1. **Gestión Centralizada**: Todas las páginas en un solo lugar
2. **Búsqueda Específica**: Filtros preconfigurados para páginas
3. **Separación Visual**: Claridad sobre qué es contenido estático vs. dinámico

## Integración con Otros Módulos

### Servicios Compartidos
- `EntradaService`: Operaciones CRUD y búsqueda
- `BusquedaService`: Búsqueda avanzada con filtros
- `CommonFunctionalityService`: Utilidades comunes
- `ToastService`: Notificaciones al usuario

### Módulos Compartidos
- `SharedOPModule`: Componentes reutilizables
- `SharedCoreUiModule`: Componentes de CoreUI

## Configuración

### Rutas
```typescript
// base-routing.module.ts
{
  path: 'paginas',
  loadChildren: () => import('./paginas/paginas.module').then(m => m.PaginasModule),
  data: { preload: true, delay: 1000 }
}
```

### Navegación
```typescript
// _nav.ts
{
  name: 'Páginas',
  url: '/admin/control/paginas',
  iconComponent: { name: 'cil-library' }
}
```

## Pruebas

### Pruebas Unitarias
Se incluyen pruebas para:
- Creación del componente
- Filtrado por TipoEntrada
- Gestión del modal de eliminación
- Procesamiento de resultados de búsqueda

```bash
# Ejecutar pruebas
npm run test:ci
```

### Construcción
```bash
# Desarrollo
npm run build

# Producción
npm run build -- --configuration production
```

## Consideraciones de Rendimiento

### Lazy Loading
El módulo se carga de forma diferida para optimizar el tiempo de carga inicial:
```typescript
loadChildren: () => import('./paginas/paginas.module').then(m => m.PaginasModule)
```

### Paginación del Servidor
- Reduce la carga de datos inicial
- Mejora el rendimiento con grandes volúmenes
- Búsqueda eficiente con índices de base de datos

## Futuras Mejoras Posibles

1. **Ruta de Creación Específica**
   - Pre-seleccionar "Página" como TipoEntrada
   - Ocultar/deshabilitar selector de tipo

2. **Campos Específicos para Páginas**
   - Metadata SEO adicional
   - Configuración de URL amigable
   - Posición en menú de navegación

3. **Preview en Sitio Público**
   - Vista previa de cómo se verá la página
   - Link directo al contenido público

4. **Gestión de Menú**
   - Agregar/quitar páginas del menú principal
   - Ordenar páginas en el menú
   - Configurar jerarquía de páginas

## Conclusión

Este diseño confirma que usar una entidad `Entrada` unificada con diferentes valores de `TipoEntrada` es un patrón arquitectónico apropiado porque:

1. Reduce la duplicación de código
2. Mantiene la consistencia de datos
3. Facilita el mantenimiento
4. Permite extensión fácil para nuevos tipos
5. Proporciona vistas especializadas cuando sea necesario

El módulo de Páginas es un ejemplo exitoso de cómo aplicar este patrón para proporcionar una experiencia de usuario clara y enfocada sin sacrificar la reutilización de código.
