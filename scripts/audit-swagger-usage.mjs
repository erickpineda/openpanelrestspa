import fs from 'node:fs';
import path from 'node:path';

function extractSwaggerPaths(swaggerText) {
  const pathRe = /"(\/api\/v1\/[^\"]+)"\s*:/g;
  const paths = [];
  let m;
  while ((m = pathRe.exec(swaggerText))) {
    paths.push(m[1]);
  }
  return [...new Set(paths)].sort();
}

function normalize(p) {
  return p
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/api\/v\d+\//, '/')
    .replace(/\$\{[^}]+\}/g, '{var}')
    .replace(/\{[^}]+\}/g, '{var}')
    .replace(/\/(\d+)(?=\/|$)/g, '/{var}')
    .replace(/\s+/g, '');
}

function walkFiles(rootDir, exts = new Set(['.ts'])) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const current = stack.pop();
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(current)) {
        if (name === 'node_modules' || name === 'dist' || name === '.angular') continue;
        stack.push(path.join(current, name));
      }
      continue;
    }
    if (stat.isFile() && exts.has(path.extname(current))) out.push(current);
  }
  return out;
}

function extractApiishStrings(tsText) {
  const out = [];
  const re = /(['"`])((?:\/)[^'"`\n\r]{2,200})\1/g;
  let m;
  while ((m = re.exec(tsText))) {
    const s = m[2];
    if (!s.startsWith('/')) continue;
    if (s.startsWith('/assets/')) continue;
    out.push(s);
  }
  return out;
}

const [swaggerPath = 'src/assets/nuevo_swagger.yaml', scanRoot = 'src/app'] = process.argv.slice(2);
const swaggerText = fs.readFileSync(swaggerPath, 'utf8');
const swaggerPaths = extractSwaggerPaths(swaggerText);
const swaggerSet = new Set(swaggerPaths.map((p) => normalize(p)));

const files = walkFiles(scanRoot);
const findings = [];

for (const file of files) {
  const txt = fs.readFileSync(file, 'utf8');
  const strings = extractApiishStrings(txt);
  for (const s of strings) {
    const n = normalize(s);
    const looksApi =
      n.startsWith('/entradas') ||
      n.startsWith('/comentarios') ||
      n.startsWith('/usuarios') ||
      n.startsWith('/categorias') ||
      n.startsWith('/etiquetas') ||
      n.startsWith('/roles') ||
      n.startsWith('/privilegios') ||
      n.startsWith('/tiposEntradas') ||
      n.startsWith('/estadosEntradas') ||
      n.startsWith('/dashboard') ||
      n.startsWith('/fileStorage') ||
      n.startsWith('/redis') ||
      n.startsWith('/herramientas') ||
      n.startsWith('/excepciones') ||
      n.startsWith('/literales') ||
      n.startsWith('/sesiones') ||
      n.startsWith('/auth');

    if (!looksApi) continue;

    const matches = swaggerSet.has(n) || swaggerSet.has(`/api/v1${n}`) || swaggerSet.has(n.replace(/^\/api\/v1/, ''));
    if (!matches) {
      findings.push({ file, raw: s, normalized: n });
    }
  }
}

const uniqKey = (x) => `${x.normalized}@@${x.file}`;
const uniq = new Map();
for (const f of findings) {
  uniq.set(uniqKey(f), f);
}

const result = {
  swaggerPaths: swaggerPaths.length,
  scannedFiles: files.length,
  unmatchedCount: uniq.size,
  unmatched: [...uniq.values()].slice(0, 200),
};

process.stdout.write(JSON.stringify(result, null, 2));

