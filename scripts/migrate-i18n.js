const fs = require('fs');
const path = require('path');

// Configuración
const SRC_DIR = path.join(__dirname, '../src/app');
const I18N_DIR = path.join(__dirname, '../src/assets/i18n');
const LANGUAGES = ['es', 'en'];

// Expresiones regulares para detectar textos (simplificado)
// Busca textos en HTML que no estén ya traducidos (no contienen pipes, etc.)
// Ejemplo: >Texto<  o title="Texto"
const HTML_TEXT_REGEX = />([^<>{}\n]+)</g;
const HTML_ATTR_REGEX = /(?:title|placeholder|aria-label)="([^"{}\n]+)"/g;

// Cargar archivos de idioma existentes
const translations = {};
LANGUAGES.forEach(lang => {
    const filePath = path.join(I18N_DIR, `${lang}.json`);
    if (fs.existsSync(filePath)) {
        translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
        translations[lang] = {};
    }
});

function traverseDir(dir, callback) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            traverseDir(fullPath, callback);
        } else {
            callback(fullPath);
        }
    });
}

function generateKey(text) {
    return text.toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 30); // Limitar longitud
}

function processFile(filePath) {
    if (!filePath.endsWith('.html')) return; // Por ahora solo HTML para seguridad

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Procesar contenido de etiquetas
    content = content.replace(HTML_TEXT_REGEX, (match, text) => {
        const trimmed = text.trim();
        if (!trimmed || trimmed.length < 2) return match;
        // Ignorar si parece código o ya tiene pipe
        if (trimmed.includes('|') || trimmed.includes('{{')) return match;

        const key = `AUTO.${generateKey(trimmed)}`;
        
        // Agregar a JSONs si no existe
        LANGUAGES.forEach(lang => {
            if (!translations[lang].AUTO) translations[lang].AUTO = {};
            if (!translations[lang].AUTO[generateKey(trimmed)]) {
                 // En un script real, aquí se usaría un servicio de traducción
                 // Por defecto usamos el texto original
                 translations[lang].AUTO[generateKey(trimmed)] = trimmed; 
            }
        });

        changed = true;
        return `>{{ '${key}' | translate }}<`;
    });

    if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`[MIGRATED] Modificado: ${filePath}`);
    }
}

// Ejecutar
console.log('Iniciando análisis de literales...');
traverseDir(SRC_DIR, processFile);

// Guardar traducciones
LANGUAGES.forEach(lang => {
    fs.writeFileSync(path.join(I18N_DIR, `${lang}.json`), JSON.stringify(translations[lang], null, 2));
    console.log(`[SAVED] Guardado: ${lang}.json`);
});

console.log('Proceso completado. Descomentar líneas de escritura para aplicar cambios.');
