# Sistema de Perfil de Usuario - Documentación

## 1. Especificación Técnica

### 1.1 Arquitectura
El sistema de perfil de usuario está construido sobre Angular 16 y CoreUI, siguiendo una arquitectura modular.

- **Módulo**: `PerfilModule` (`src/app/admin/base/perfil`)
- **Componentes**:
    - `PerfilComponent`: Contenedor principal.
    - `PerfilFormComponent`: Formulario de edición de datos personales.
    - `PerfilPreferencesComponent`: Gestión de preferencias (tema, idioma, notificaciones).
    - `PerfilActivityComponent`: Visualización de historial de actividades.
- **Servicios**:
    - `UsuarioService`: Para la obtención y actualización de datos (`obtenerDatosSesionActualSafe`, `actualizarParcial`).

### 1.2 Modelos de Datos
Se utiliza el modelo `Usuario` y `PerfilResponse`.
Las preferencias se almacenan en el campo `infouser` como un objeto JSON serializado.

```json
{
  "theme": "light|dark",
  "language": "es|en",
  "notifications": true|false
}
```

## 2. Manual de Usuario

### 2.1 Acceso
1. Inicie sesión en el panel de administración.
2. En el menú lateral, bajo "Administración", haga clic en "Mi Perfil".

### 2.2 Funcionalidades
- **Editar Información**: Modifique su nombre, email, teléfono y sitio web en la pestaña "Información Personal". Haga clic en "Guardar Cambios".
- **Foto de Perfil**: Haga clic en el botón de cámara sobre su avatar para subir una nueva foto.
- **Preferencias**: Cambie el tema (Claro/Oscuro), idioma y configuración de notificaciones en la pestaña "Preferencias".
- **Historial**: Consulte sus actividades recientes (inicio de sesión, cambios de perfil) en la pestaña "Actividad Reciente".

## 3. Diagrama de Flujo de Datos

[Usuario] <-> [PerfilComponent] <-> [UsuarioService] <-> [API Backend]

1. **Carga**: `PerfilComponent` llama a `UsuarioService.obtenerDatosSesionActualSafe()` -> GET `/usuarios/perfil/yo`.
2. **Edición**: Usuario modifica datos en `PerfilFormComponent`.
3. **Guardado**: `PerfilComponent` recibe evento `save`, llama a `UsuarioService.actualizarParcial(id, data)` -> PATCH `/usuarios/perfil/{id}`.
4. **Preferencias**: Se serializan a JSON y se guardan en el campo `infouser` del usuario.

## 4. Guía de Implementación para Desarrolladores

### 4.1 Requisitos Previos
- Node.js >= 16
- Angular CLI >= 16

### 4.2 Instalación
El módulo ya está integrado en el proyecto `openpanelrestspa`.
Para verificar, ejecute `ng serve` y navegue a `/admin/control/perfil`.

### 4.3 Pruebas
- Unitarias: `ng test` (Módulo Perfil verificado con 49/49 pruebas exitosas).
- E2E: `npx playwright test`

### 4.4 Seguridad
- Todas las peticiones están protegidas por JWT vía `NetworkInterceptor`.
- Se valida el formato de email y teléfono en el frontend.
- El backend debe validar que el usuario solo pueda editar su propio perfil (endpoint `/perfil/yo` o validación de ID).
