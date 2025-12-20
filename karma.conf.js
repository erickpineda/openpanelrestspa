// Karma configuration file, see link for more information
// karma-runner.github.io
const path = require('path');

module.exports = function (config) {
  try { 
    // Intenta usar puppeteer si está disponible, si no, usa el Chrome del sistema.
    process.env.CHROME_BIN = require('puppeteer').executablePath(); 
  } catch (e) {
    // Manejo de error si puppeteer no está instalado
    console.warn('Puppeteer no encontrado, usando Chrome instalado localmente.');
  }
  
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      
    ],
    client: {
      jasmine: {
        // Puedes añadir opciones de Jasmine aquí si lo necesitas
        random: false, // Desactiva la ejecución aleatoria de tests
      },
      clearContext: false, // Deja la salida de Jasmine Spec Runner visible en el navegador
      captureConsole: false // Esto evita que los WARN y LOG saturen la comunicación
    },
    jasmineHtmlReporter: {
      suppressAll: true // Elimina trazas duplicadas
    },
    coverageReporter: {
      dir: path.join(__dirname, './coverage/openpanelspa'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly' } // Útil para herramientas de CI como SonarQube
      ],
      check: {
        global: {
          statements: 25,
          branches: 10,
          functions: 15,
          lines: 25
        },
        each: {
          statements: 20,
          branches: 5,
          functions: 10,
          lines: 20
        }
      }
    },
    reporters: ['progress', 'kjhtml', 'coverage'], // Añadido 'coverage' aquí para que reporte
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    
    // --- Configuración de Ejecución para CI ---
    autoWatch: false,
    singleRun: true, // Ejecuta todos los tests una vez y termina el proceso
    restartOnFileChange: false, // Deshabilita la recarga automática
    
    // --- Configuración de Navegadores y Timeouts Optimizada ---
    // Usamos el launcher personalizado para mayor estabilidad
    browsers: ['ChromeHeadlessNoSandbox'], 
    
    // Timeouts optimizados para CI. Detecta fallos más rápido (60s) en vez de 90s.
    browserNoActivityTimeout: 300000, 
    browserDisconnectTimeout: 60000,
    browserDisconnectTolerance: 2, // Reintentar la conexión si falla
    captureTimeout: 300000,

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox', // CRÍTICO para entornos Linux/Docker/CI
          '--disable-gpu',
          '--disable-dev-shm-usage', // CRÍTICO para problemas de memoria en CI
          '--no-proxy-server',
          '--disable-background-timer-throttling', // Evita que Chrome reduzca su prioridad en CI
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--js-flags="--max-old-space-size=4096"' // Aumenta el límite de RAM de JS (4GB)
        ]
      }
    },
    
    // Limita la concurrencia a 1 para evitar que el navegador se sature en máquinas con pocos recursos
    concurrency: 1 
  });
};
