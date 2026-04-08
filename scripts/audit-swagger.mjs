import fs from 'node:fs';

function extractSwaggerPaths(swaggerText) {
  const pathRe = /"(\/api\/v1\/[^\"]+)"\s*:/g;
  const paths = [];
  let m;
  while ((m = pathRe.exec(swaggerText))) {
    paths.push(m[1]);
  }
  return [...new Set(paths)].sort();
}

function detectDeprecatedPaths(swaggerText, paths) {
  const depRe = /\"deprecated\"\s*:\s*true/;
  const deprecated = [];
  for (const path of paths) {
    const idx = swaggerText.indexOf(`\"${path}\"`);
    if (idx < 0) continue;
    const nextIdx = swaggerText.indexOf('"/api/v1/', idx + 1);
    const block = nextIdx > -1 ? swaggerText.slice(idx, nextIdx) : swaggerText.slice(idx);
    if (depRe.test(block)) deprecated.push(path);
  }
  return deprecated;
}

function extractLiteralEndpointsFromTs(tsText) {
  const litRe = /(['"`])(\/[^'"`\n\r]+)\1/g;
  const out = [];
  let m;
  while ((m = litRe.exec(tsText))) {
    out.push(m[2]);
  }
  return out;
}

function normalizeEndpointForComparison(p) {
  return p
    .replace(/^\/api\/v\d+\//, '/')
    .replace(/\$\{[^}]+\}/g, '{var}')
    .replace(/\/(\d+)(?=\/|$)/g, '/{id}')
    .replace(/\s+/g, '');
}

const [swaggerPath = 'src/assets/nuevo_swagger.yaml', constantsPath = 'src/app/shared/constants/op-restapi.constants.ts'] =
  process.argv.slice(2);

const swaggerText = fs.readFileSync(swaggerPath, 'utf8');
const swaggerPaths = extractSwaggerPaths(swaggerText);
const deprecatedSwaggerPaths = detectDeprecatedPaths(swaggerText, swaggerPaths);
const swaggerNonDeprecated = swaggerPaths.filter((p) => !deprecatedSwaggerPaths.includes(p));

const constantsText = fs.existsSync(constantsPath) ? fs.readFileSync(constantsPath, 'utf8') : '';
const literalEndpoints = extractLiteralEndpointsFromTs(constantsText);

const swaggerSet = new Set(swaggerNonDeprecated.map(normalizeEndpointForComparison));
const constantsSet = new Set(literalEndpoints.map(normalizeEndpointForComparison));

const constantsNotInSwagger = [...constantsSet]
  .filter((p) => p.startsWith('/') && !swaggerSet.has(`/api/v1${p}`) && !swaggerSet.has(p))
  .sort();

const swaggerNotInConstants = [...swaggerSet]
  .filter((p) => p.startsWith('/') && !constantsSet.has(p) && !constantsSet.has(p.replace(/^\/api\/v1/, '')))
  .sort();

const result = {
  swagger: {
    totalPaths: swaggerPaths.length,
    deprecatedPaths: deprecatedSwaggerPaths.length,
    nonDeprecatedPaths: swaggerNonDeprecated.length,
  },
  constants: {
    literalEndpointsFound: literalEndpoints.length,
    uniqueNormalized: constantsSet.size,
  },
  diffs: {
    constantsNotInSwagger: constantsNotInSwagger.slice(0, 200),
    swaggerNotInConstants: swaggerNotInConstants.slice(0, 200),
  },
  samples: {
    deprecatedSwaggerPaths: deprecatedSwaggerPaths.slice(0, 50),
  },
};

process.stdout.write(JSON.stringify(result, null, 2));
