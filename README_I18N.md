# Sistema de Internacionalización (i18n)

Este proyecto implementa un sistema de internacionalización personalizado que interactúa con el backend y permite la traducción de la interfaz de usuario.

## Características

1.  **Gestión de Estado**: `LanguageService` gestiona el idioma actual ('es' o 'en') persistiendo la selección en `localStorage`.
2.  **Integración Backend**: `LanguageInterceptor` intercepta todas las peticiones a `/api/` e inyecta el parámetro `lang=es` o `lang=en`.
3.  **Traducciones Frontend**: `TranslationService` carga archivos JSON desde `assets/i18n/` y `TranslatePipe` permite usar estas traducciones en las plantillas.

## Estructura

*   `src/app/core/services/language.service.ts`: Servicio singleton para gestionar el idioma activo.
*   `src/app/core/interceptor/language.interceptor.ts`: Interceptor HTTP.
*   `src/app/core/services/translation.service.ts`: Servicio de carga de traducciones.
*   `src/app/shared/pipes/translate.pipe.ts`: Pipe puro (false) para transformar claves en texto.
*   `src/assets/i18n/*.json`: Archivos de traducción.

## Uso

### Cambiar Idioma

Inyectar `LanguageService` y usar `setLanguage(lang)` o `toggleLanguage()`.

```typescript
constructor(private languageService: LanguageService) {}

cambiarIngles() {
  this.languageService.setLanguage('en');
}
```

### Usar Traducciones en HTML

Usar el pipe `translate`:

```html
<p>{{ 'HEADER.HOME' | translate }}</p>
```

### Añadir Nuevas Traducciones

1.  Editar `src/assets/i18n/es.json` y `en.json`.
2.  Mantener la misma estructura de claves en ambos archivos.

### Añadir Nuevo Idioma

1.  Crear `src/assets/i18n/fr.json` (ejemplo).
2.  Actualizar el tipo `Language` en `language.service.ts`.
3.  Actualizar los selectores de idioma en el Header.

## Backend

El backend recibe automáticamente el parámetro `lang` en el query string. No es obligatorio procesarlo, pero está disponible para devolver mensajes de error o datos localizados.
