CKEditor 5 (47.x) - Integración por assets

Ubicación esperada
- Coloca los archivos generados por CKEditor Online Builder en:
- src/assets/ckeditor5/build/ckeditor.js
- src/assets/ckeditor5/build/* (otros recursos si los hubiera)

Plugins recomendados (equivalentes al build clásico)
- Essentials
- Paragraph
- Heading
- Bold
- Italic
- Underline
- Strikethrough
- Link
- List
- Indent
- BlockQuote
- Image (Caption, Resize, Toolbar)
- Table (Toolbar)
- PasteFromOffice
- MediaEmbed

Idioma
- Selecciona "es" para el idioma del editor.

Funcionamiento
- La aplicación intenta cargar /assets/ckeditor5/build/ckeditor.js en tiempo de ejecución.
- Si el archivo no existe, usa el build clásico actual como fallback.

Verificación
- Tras copiar los archivos, ejecuta: npm run build y revisa el funcionamiento del editor en el formulario de entradas.

Auditoría
- Ejecuta: npm audit para confirmar la desaparición de los avisos de CKEditor.

