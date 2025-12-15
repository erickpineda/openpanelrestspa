# Documentación de Estados de Entradas

Este documento describe los posibles estados de una Entrada en el sistema y su representación visual en el listado.

## Estados Soportados

### 1. Publicada
- **Descripción**: La entrada es pública y visible para los usuarios finales.
- **Condición**: `entrada.publicada === true`
- **Representación Visual**:
  - **Icono**: `cilCheckCircle` (Círculo con check)
  - **Color**: Verde (`text-success`)
  - **Tooltip**: "Publicada"

### 2. Borrador
- **Descripción**: La entrada está en proceso de creación y no es visible públicamente.
- **Condición**: `entrada.borrador === true` (y `publicada === false`)
- **Representación Visual**:
  - **Icono**: `cilEye` (Ojo) - *Nota: Anteriormente cilFile, actualizado a cilEye para mejor semántica de "visibilidad restringida/privada"*
  - **Color**: Amarillo (`text-warning`)
  - **Tooltip**: "Borrador"

### 3. Pendiente / Otros
- **Descripción**: La entrada tiene un estado específico de flujo de trabajo (ej. Pendiente de revisión) o no cumple las condiciones anteriores.
- **Condición**: `publicada === false` y `borrador === false`
- **Representación Visual**:
  - **Icono**: `cilHistory` (Reloj/Historial)
  - **Color**: Amarillo (`text-warning`)
  - **Tooltip**: Nombre del estado (ej. "Pendiente de revisión")

## Lógica de Determinación

El método `getEstadoInfo(entrada: Entrada)` en el componente determina la visualización siguiendo este orden de prioridad:

1. Si `publicada` es `true` -> **Publicada**.
2. Si `borrador` es `true` -> **Borrador**.
3. En cualquier otro caso -> **Pendiente** (usa `entrada.estadoEntrada.nombre` para el tooltip).
