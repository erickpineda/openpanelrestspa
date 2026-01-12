# Sistema de Internacionalización (i18n)

Este proyecto implementa un sistema de internacionalización robusto, escalable y modular.

## Características

*   **Gestión de Idioma**: Soporte para español (`es`) e inglés (`en`), extensible a más idiomas.
*   **Persistencia**: El idioma seleccionado se guarda en `localStorage`.
*   **Interceptor API**: Se añade automáticamente `?lang=es` (o el idioma actual) a todas las peticiones API.
*   **Traducciones Dinámicas**: Carga lazy de archivos JSON (`assets/i18n/*.json`).
*   **Interpolación**: Soporte para variables en textos (ej: `{{name}}`).
*   **Fallback**: Si una traducción falta en el idioma actual, se busca en el idioma por defecto (`es`).
*   **Anidamiento**: Soporte para claves anidadas (ej: `HOME.TITLE`).
*   **Formatos**: Soporte para formatos de fecha y número (locales `es` y `en` registrados).

## Uso

### 1. En Plantillas (HTML)

Usar el pipe `translate`:

```html
<!-- Texto simple -->
<h1>{{ 'HOME.TITLE' | translate }}</h1>

<!-- Con interpolación -->
<p>{{ 'WELCOME_MESSAGE' | translate: { name: user.name } }}</p>

<!-- Formatos de fecha (pasar locale dinámicamente si se requiere) -->
<p>{{ today | date:'fullDate':undefined:currentLang }}</p>
```

### 2. En Código (TypeScript)

Inyectar `TranslationService`:

```typescript
constructor(private translationService: TranslationService) {}

showMessage() {
  const msg = this.translationService.translate('ALERTS.SUCCESS', { id: 123 });
  console.log(msg);
}
```

### 3. Añadir Traducciones

Editar `src/assets/i18n/es.json` y `src/assets/i18n/en.json`:

```json
{
  "HOME": {
    "TITLE": "Bienvenido"
  },
  "ALERTS": {
    "SUCCESS": "Operación {{id}} exitosa"
  }
}
```

## Configuración

### Añadir un nuevo idioma

1.  Crear `src/assets/i18n/fr.json`.
2.  Actualizar el tipo `Language` en `src/app/core/services/language.service.ts`.
3.  Registrar el locale en `src/app/app.module.ts` si se requieren formatos específicos.

### Estructura

*   `TranslationService`: Gestiona la carga y lógica de traducción.
*   `TranslatePipe`: Transforma claves en texto en la vista.
*   `LanguageService`: Gestiona el estado del idioma activo.
*   `LanguageInterceptor`: Propaga el idioma al backend.

## Pruebas

Ejecutar pruebas unitarias:
```bash
npm test
```
