# Gestión de sesión multi‑pestaña y restauración de ubicación (post‑login redirect)

## 1. Objetivo y alcance

Este documento describe el funcionamiento de la sincronización de sesión entre múltiples pestañas y el mecanismo de “volver a la vista anterior” tras reiniciar sesión. Está orientado a:

- Mantener coherencia de estado de autenticación entre pestañas (login/logout/estado cambiado).
- Persistir y restaurar la ubicación previa por pestaña tras un logout o expiración.
- Evitar condiciones de carrera en el consumo/guardado de la URL de retorno.

El alcance incluye los componentes y servicios involucrados en:

- Almacenamiento de token/usuario y sincronización por `localStorage`/`sessionStorage`.
- Emisión/recepción de eventos de autenticación entre pestañas.
- Persistencia de la “última ruta válida” por pestaña y su restauración tras login.
- Flujo de “sesión finalizada” (pantalla/modal) y navegación a login/home.

## 2. Arquitectura: componentes y responsabilidades

### 2.1. Almacenamiento y estado base de autenticación

**Servicio:** `TokenStorageService`  
**Archivo:** `src/app/core/services/auth/token-storage.service.ts`

Responsabilidades principales:

- Persistir token/usuario en `sessionStorage` para el contexto de la pestaña.
- Mantener una copia “compartida” en `localStorage` para permitir sincronización inter‑pestaña.
- Gestionar un identificador estable por pestaña (`tabId`) en `sessionStorage`.
- Mantener limpieza periódica de registros de post‑login redirect caducados.

Claves relevantes (ver `OPConstants.Session`):

- `auth-token`, `auth-user` (pestaña actual, `sessionStorage`)
- `sync-auth-token`, `sync-auth-user` (estado compartido, `localStorage`)
- `op-tab-id` (id de pestaña, `sessionStorage`)
- `post-login-redirect-{tabId}` (URL de retorno por pestaña, `sessionStorage` y/o `localStorage`)

Notas operativas:

- `getToken()` y `getUser()` intentan leer de `sessionStorage`; si no existe, hacen fallback a `localStorage` y rehidratan `sessionStorage`.
- `signOut()` elimina token/usuario y claves de sincronización compartidas, pero evita limpiar toda `sessionStorage` para preservar `tabId` y `post-login-redirect-{tabId}`.

### 2.2. Sincronización entre pestañas (eventos)

**Servicio:** `AuthSyncService`  
**Archivo:** `src/app/core/services/auth/auth-sync.service.ts`

Responsabilidades:

- Emitir eventos de autenticación (`LOGIN`, `LOGOUT`, `CHANGED`) hacia otras pestañas.
- Recibir eventos desde otras pestañas a través de:
  - `BroadcastChannel` (cuando el navegador lo soporta)
  - `storage` events (cuando se escribe una clave de sincronización en `localStorage`)
- En el evento de visibilidad (`visibilitychange`), re‑sincronizar el estado del token desde `localStorage` para compatibilidad y para pestañas que estuvieron en background.

Eventos internos expuestos al resto de la app (por `window.dispatchEvent`):

- `AUTH_LOGIN` con `detail` del evento sincronizado
- `AUTH_LOGOUT` con `detail`
- `AUTH_CHANGED` con `detail`
- `AUTH_STATE_CHANGED` (evento “genérico” para que UI/guards reaccionen)

### 2.3. Seguimiento de ruta y persistencia de ubicación

**Servicio:** `RouteTrackerService`  
**Archivo:** `src/app/core/services/auth/route-tracker.service.ts`

Responsabilidades:

- Escuchar `NavigationEnd` del Router y registrar la última ruta “válida” cuando el usuario está autenticado.
- Ignorar rutas públicas y rutas del flujo de sesión:
  - `/login`
  - `/session-expired`
  - `/public/...`
  - `/` (home pública)
- Guardar la ruta válida usando `PostLoginRedirectService` (persistencia por pestaña).
- Mantener en memoria `lastValidUrl` como fallback rápido para componentes del flujo de sesión.

Punto clave:

- El `RouteTrackerService` debe instanciarse en la app para que se suscriba a los eventos del Router. En este proyecto se fuerza su creación inyectándolo en `AppComponent`.

### 2.4. Servicio de post‑login redirect (por pestaña)

**Servicio:** `PostLoginRedirectService`  
**Archivo:** `src/app/core/services/auth/post-login-redirect.service.ts`

Responsabilidades:

- Persistir la URL de retorno “por pestaña” usando una clave derivada de `tabId`.
- Recuperar la URL en el momento del login y limpiar la clave, para evitar re‑uso accidental.
- Normalizar rutas para compatibilidad con navegación por hash.
- Proveer un mecanismo anti‑race:
  - `markPostLoginHandled()` marca una ventana temporal tras consumir el redirect.
  - `shouldIgnoreRouteSave()` evita que el `RouteTrackerService` vuelva a guardar inmediatamente rutas derivadas del post‑login, contaminando el redirect.

Orden de búsqueda al recuperar redirect (simplificado):

1. `sessionStorage['post-login-redirect-{tabId}']`
2. `localStorage['post-login-redirect-{tabId}']`
3. `localStorage['post-login-redirect']` (fallback base)
4. Cualquier clave `sessionStorage` con prefijo `post-login-redirect-` (fallback defensivo)

Tras obtener el redirect, el servicio limpia las claves de almacenamiento relevantes.

### 2.5. Coordinación del flujo de sesión (logout/expiración)

**Servicio:** `SessionManagerService`  
**Archivo:** `src/app/core/services/auth/session-manager.service.ts`

Responsabilidades:

- Escuchar `AUTH_LOGOUT` y `AUTH_LOGIN` para reaccionar a eventos inter‑pestaña.
- En `AUTH_LOGOUT`:
  - Guardar inmediatamente el `post-login-redirect` de esta pestaña usando `lastValidUrl` (antes de que navegación/guards cambien la URL).
  - Ejecutar el flujo local de logout (modal si hay trabajo sin guardar, o logout inmediato).
- Ejecutar `performLogout()`:
  - Guardar `post-login-redirect` de esta pestaña.
  - `signOut()` para limpiar token/usuario.
  - Navegar a `/session-expired` pasando `sessionData` en `state`.
- En `AUTH_LOGIN`:
  - Si la pestaña está en `/login` o `/session-expired`, consumir su redirect y navegar a la ruta objetivo.
  - Si no hay redirect, evita forzar navegación y solo emite `AUTH_STATE_CHANGED`.

### 2.6. Componentes UI: login y sesión expirada

**Componente:** `LoginComponent`  
**Archivo:** `src/app/public/login/login.component.ts`

Responsabilidades:

- Realizar login vía `AuthService.login()`.
- En éxito:
  1. Consumir el post‑login redirect local de esta pestaña y navegar primero (para evitar condiciones de carrera).
  2. Emitir `notifyLogin()` para que otras pestañas sincronicen token y restauren su ubicación.

**Componente:** `SessionExpiredComponent`  
**Archivos:**  
- `src/app/core/features/session-expired.component.ts`  
- `src/app/core/features/session-expired.component.html`

Responsabilidades:

- Mostrar modal de “Sesión Finalizada” ante logout/expiración.
- En “Iniciar Sesión Nuevamente”:
  - Guardar la última ruta válida en `post-login-redirect` (si existe).
  - Navegar a `/login` con `replaceUrl` para evitar volver al modal con back.

## 3. Flujo detallado (paso a paso)

### 3.1. Logout desde cualquier pestaña

Escenario: el usuario cierra sesión en una pestaña (pública o privada).

1. La pestaña que ejecuta logout:
   - Guarda su última ruta válida (si aplica).
   - Limpia token/usuario local (`signOut()`).
   - Navega a `/session-expired`.
   - Emite evento sincronizado `LOGOUT` al resto de pestañas (`AuthSyncService.notifyLogout()`).
2. Otras pestañas reciben `AUTH_LOGOUT`:
   - Guardan inmediatamente su `post-login-redirect` usando su última ruta válida.
   - Ejecutan el flujo de logout local (modal o salida inmediata según cambios sin guardar).
   - Navegan a `/session-expired`.

Resultado:

- Cada pestaña conserva su “ubicación anterior” en su propia clave `post-login-redirect-{tabId}`.

### 3.2. Reinicio de sesión (login) desde una pestaña

Escenario: el usuario inicia sesión desde una pestaña que quedó en `/login` o `/session-expired`.

1. La pestaña donde se introduce usuario/contraseña:
   - El login guarda token/usuario en storage.
   - Consume su `post-login-redirect` local y navega a la ruta previa (incluyendo query params si venían en `router.url`).
   - Emite `LOGIN` al resto de pestañas (`notifyLogin()`).
2. Otras pestañas reciben `AUTH_LOGIN`:
   - Sincronizan token/usuario desde `localStorage` a `sessionStorage`.
   - Si están en `/login` o `/session-expired`, consumen su `post-login-redirect-{tabId}` y restauran su vista anterior.

Resultado:

- Todas las pestañas, incluida la que inicia sesión, restauran su vista previa consistente.

## 4. Requisitos previos para funcionamiento correcto

### 4.1. Navegador y almacenamiento

- `localStorage` y `sessionStorage` habilitados para el origen del sitio.
- Sin políticas de privacidad/extensiones que bloqueen acceso a storage o eventos `storage`.
- `BroadcastChannel` es opcional; si no está disponible, el sistema cae al mecanismo por `storage` events.

### 4.2. Condiciones de “mismo origen”

- Todas las pestañas deben compartir el mismo `origin` (misma combinación de protocolo + host + puerto).  
  Si cambian host/puerto (por ejemplo `localhost:4200` vs `127.0.0.1:4200`), no se comparten `localStorage` ni eventos.

### 4.3. Inicialización de servicios

- `AuthSyncService.initializeAuthState()` debe ejecutarse al iniciar la app para rehidratar storage y emitir `AUTH_STATE_CHANGED`.
- `RouteTrackerService` debe instanciarse (inyectado en `AppComponent`) para registrar `lastValidUrl` y persistir rutas válidas.

### 4.4. Convención de rutas y estrategia de navegación

- El sistema soporta URLs con hash (`/#/ruta`) mediante `normalizeRoute()` en `PostLoginRedirectService`.
- Las rutas de sesión deben mantenerse consistentes:
  - `/login`
  - `/session-expired`

## 5. Posibles puntos de fallo y cómo identificarlos

### 5.1. Condición de carrera: consumo temprano del redirect

Síntoma:

- La pestaña desde la que se inicia sesión vuelve al dashboard por defecto, ignorando su ubicación previa.

Causa típica:

- Un handler global consume y limpia el `post-login-redirect` antes de que el `LoginComponent` lo lea.

Cómo identificarlo:

- En DevTools, antes de enviar el login, confirmar que existe `sessionStorage['post-login-redirect-{tabId}']`.
- Tras el login, verificar si la clave desapareció antes de navegar a la ruta esperada.
- Revisar que `notifyLogin()` se emite una sola vez y en el orden correcto (primero redirigir local, luego notificar).

### 5.2. `RouteTrackerService` no se está ejecutando

Síntomas:

- `post-login-redirect-{tabId}` nunca se guarda.
- “Iniciar sesión nuevamente” no devuelve a la vista previa.

Cómo identificarlo:

- No hay logs de “RouteTracker: guardada ruta válida…” (si logging está activo).
- `RouteTrackerService.getLastValidUrl()` devuelve `null` incluso tras navegar por rutas privadas.
- Confirmar que `AppComponent` inyecta `RouteTrackerService`.

### 5.3. Bloqueo o limpieza de `sessionStorage`

Síntomas:

- Se pierde `tabId` (`op-tab-id`), por lo que cambian las claves por pestaña.
- No se encuentra `post-login-redirect-{tabId}` tras logout.

Cómo identificarlo:

- En DevTools, `sessionStorage` se vacía entre navegaciones (p. ej. por políticas del navegador, “clear on close”, extensiones, navegación en modo privado).
- `op-tab-id` cambia frecuentemente.

### 5.4. Diferente origen entre pestañas

Síntomas:

- Login/logout no se propaga a otras pestañas.
- Solo la pestaña actual refleja el estado correcto.

Cómo identificarlo:

- Verificar la URL exacta de cada pestaña (host/puerto).
- Comprobar que `localStorage['sync-auth-token']` cambia en una pestaña y no aparece en otra.

### 5.5. Restricciones del navegador sobre `storage` events / `BroadcastChannel`

Síntomas:

- Algunas pestañas no reciben eventos hasta que vuelven a primer plano.

Cómo identificarlo:

- Confirmar si el navegador soporta `BroadcastChannel`.
- Observar si al cambiar foco a la pestaña se recupera el estado (por `visibilitychange`).

## 6. Checklist de revisión (pre‑producción y post‑incidente)

- Flujo de login:
  - `notifyLogin()` se ejecuta una sola vez y desde el `LoginComponent`.
  - La pestaña que inicia sesión consume su redirect antes de notificar a otras pestañas.
- Persistencia por pestaña:
  - Existe `op-tab-id` estable en `sessionStorage`.
  - Se guarda `post-login-redirect-{tabId}` al recibir `AUTH_LOGOUT` y/o al ejecutar `performLogout()`.
- Sincronización:
  - `sync-auth-token` y `sync-auth-user` se escriben en `localStorage` tras login.
  - Las otras pestañas rehidratan `sessionStorage` desde `localStorage` (`syncFromLocalStorage()`).
- Rutas especiales:
  - `/login` y `/session-expired` existen y son accesibles.
  - `RouteTrackerService` ignora rutas públicas y no “contamina” el redirect.
- Anti‑race:
  - `markPostLoginHandled()` y `shouldIgnoreRouteSave()` están operativos para evitar guardados inmediatos tras restauración.
- Observabilidad:
  - Se pueden inspeccionar claves en DevTools para confirmar estado de sesión y redirect.

## 7. Procedimientos de diagnóstico y resolución

### 7.1. Diagnóstico rápido en DevTools (sin cambios de código)

1. Identificar `tabId`:

   - Abrir DevTools → Application → Session Storage → `op-tab-id`
   - Determinar la clave esperada `post-login-redirect-{tabId}`

2. Verificar estado compartido:

   - Local Storage:
     - `sync-auth-token`
     - `sync-auth-user`

3. Verificar URL de retorno:

   - Session Storage:
     - `post-login-redirect-{tabId}`
   - Confirmar que contenga la ruta completa esperada, incluyendo query params.

4. Verificar flujo:

   - Tras logout, cada pestaña debería tener su `post-login-redirect-{tabId}`.
   - Tras login, cada pestaña debería consumir (y limpiar) su propia clave y navegar.

### 7.2. Reproducción controlada del incidente descrito

1. Abrir 4 pestañas:
   - Pestaña 1: `/admin/control/gestion/changepassword`
   - Pestaña 2: `/admin/control/entradas` (listado)
   - Pestaña 3: `/admin/control/contenido` (listado imágenes/medios según módulo)
   - Pestaña 4: sección pública (`/` o `/public/...`)
2. Cerrar sesión desde la pestaña pública.
3. Confirmar que todas navegan a `/session-expired` y que cada una conserva su `post-login-redirect-{tabId}`.
4. Iniciar sesión desde la pestaña 1.
5. Validar:
   - Pestaña 1 vuelve a `/admin/control/gestion/changepassword`
   - Pestañas 2 y 3 vuelven a sus listados
   - Pestaña 4 vuelve a la sección pública previa

### 7.3. Acciones correctivas típicas

- Si la pestaña que inicia sesión cae en dashboard:
  - Verificar que el redirect exista antes del login y que se consuma una sola vez.
  - Confirmar el orden: redirección local primero, `notifyLogin()` después.
- Si otras pestañas no se sincronizan:
  - Verificar mismo origen y que `localStorage` se comparte.
  - Confirmar que `storage` events no estén bloqueados y que `visibilitychange` rehidrata.
- Si no se guarda la ruta previa:
  - Confirmar que `RouteTrackerService` está instanciado.
  - Confirmar que el usuario estaba autenticado al navegar (el tracker solo guarda si `isLoggedIn()` es true).

## 8. Recomendaciones para prevenir incidentes futuros

- Mantener una única “fuente de verdad” para emitir `notifyLogin()` (idealmente el componente que controla el orden de navegación).
- Conservar el orden crítico: consumir redirect local → navegar → notificar otras pestañas.
- Evitar limpiar `sessionStorage` globalmente; usar borrado selectivo para no perder `tabId` ni claves por pestaña.
- Asegurar que `RouteTrackerService` se instancie siempre (inyección en root o referencia en el componente raíz).
- Ampliar pruebas automatizadas:
  - Prueba unitaria que valide que el consumo de redirect no ocurre antes del handler del login.
  - Prueba e2e multi‑tab (si se incorpora soporte) para validar restauración en escenarios de logout/login.
- Mantener observabilidad:
  - Estandarizar logs de eventos de auth y lectura/escritura de claves críticas.
  - Documentar claves y TTL en `OPSessionConstants` y revisar cualquier cambio de naming.

