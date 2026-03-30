# Moderación de comentarios: UX coherente

## Objetivo
Evitar disonancia cognitiva entre el contador de comentarios y la lista realmente visible para el usuario final.

## Estrategias soportadas

### 1) Contador total + mensaje específico (nivel intermedio)
- UI: muestra `visibles / total`.
- Mensaje público cuando `visibles = 0` y `pendientes > 0`:
  - "Hay X comentarios en espera de moderación. Sé el primero en publicar un comentario público."
- Cuándo usarla: portales con alta actividad donde la moderación es una parte explícita de la cultura del sitio.

### 2) Contador sincronizado (nivel recomendado)
- UI: el contador público muestra solo `visibles`.
- Mensaje cuando `visibles = 0`:
  - "No hay comentarios aún. ¡Sé el primero en opinar!"
- Criterio de éxito: el número que ve el usuario nunca supera el número de comentarios visibles (aunque existan pendientes).

### 3) Estados para usuarios autenticados
- Mensaje personalizado para el emisor tras enviar un comentario:
  - "Gracias, tu comentario está pendiente de moderación."
- Restricción: solo lo ve el usuario autenticado que envió el comentario.

## Configuración
- `OPConstants.App.Public.Comentarios.UX_STRATEGY`:
  - `SYNCED` (recomendado)
  - `TOTAL_WITH_MESSAGE`
- `OPConstants.App.Public.Comentarios.PENDING_NOTICE_TTL_MS`:
  - TTL del aviso de “pendiente de moderación” para el emisor.

## Requisitos de backend (contrato propuesto)
Para soportar recuentos consistentes sin depender de paginación/heurísticas:

### Endpoints
- `GET /comentarios/recuentosPorIdEntrada/{idEntrada}`
  - Respuesta:
    - `visibles`: comentarios aprobados y visibles públicamente
    - `totales`: comentarios totales (incluye pendientes/rechazados según política)
    - `pendientes`: comentarios en espera de moderación

> Nota: este endpoint no existe en el `swagger.yaml` actual. El frontend lo deja deshabilitado por defecto mediante `OPConstants.App.Public.Comentarios.USE_RECUENTOS_ENDPOINT = false`.

### Criterios de moderación (sugeridos)
- Visible: `aprobado = true`.
- Pendiente: `aprobado = false` y `cuarentena = false`.
- Rechazado/oculto: `cuarentena = true` o política equivalente.

### Auditoría
- Registrar cada decisión de moderación con:
  - `idComentario`, acción (aprobar/rechazar/cuarentena), actor (admin), timestamp, motivo.

## Criterios de aceptación
- El contador público no supera a los comentarios visibles.
- El usuario entiende el estado de moderación sin ambigüedad.
- Consistencia entre vistas (cabecera de entrada y sección de comentarios) y dispositivos.
