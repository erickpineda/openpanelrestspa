import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const outPath = path.join(projectRoot, 'src', 'sitemap.xml');

const baseUrl = (process.env.SITEMAP_BASE_URL || 'http://localhost').replace(/\/$/, '');

const staticRoutes = ['/#/home', '/#/entradas', '/#/about', '/#/contact', '/#/login', '/#/registro'];

const xmlEscape = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const buildXml = (urls) => {
  const items = urls
    .map((u) => {
      const loc = xmlEscape(`${baseUrl}${u}`);
      return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
};

const main = async () => {
  const xml = buildXml(staticRoutes);
  await fs.writeFile(outPath, xml, 'utf8');
};

try {
  await main();
} catch {
  process.exitCode = 0;
}

