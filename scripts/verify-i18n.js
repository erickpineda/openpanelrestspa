const fs = require('fs');
const path = require('path');

const I18N_DIR = path.join(__dirname, '../src/assets/i18n');

function loadJSON(lang) {
    const filePath = path.join(I18N_DIR, `${lang}.json`);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return {};
}

function getKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
        } else {
            keys.push(prefix + key);
        }
    }
    return keys;
}

const es = loadJSON('es');
const en = loadJSON('en');

const esKeys = getKeys(es);
const enKeys = getKeys(en);

console.log(`[ES] Total claves: ${esKeys.length}`);
console.log(`[EN] Total claves: ${enKeys.length}`);

const missingInEn = esKeys.filter(key => !enKeys.includes(key));
const missingInEs = enKeys.filter(key => !esKeys.includes(key));

if (missingInEn.length > 0) {
    console.warn('⚠️  Claves faltantes en EN:', missingInEn);
} else {
    console.log('✅ Todas las claves de ES existen en EN.');
}

if (missingInEs.length > 0) {
    console.warn('⚠️  Claves faltantes en ES:', missingInEs);
} else {
    console.log('✅ Todas las claves de EN existen en ES.');
}

if (missingInEn.length === 0 && missingInEs.length === 0) {
    console.log('🎉 VALIDACIÓN EXITOSA: Los archivos de idioma están sincronizados.');
} else {
    console.error('❌ VALIDACIÓN FALLIDA: Hay inconsistencias entre idiomas.');
    process.exit(1);
}
