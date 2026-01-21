import { test, expect } from '@playwright/test';

const setAuthStorage = async (page: any) => {
  await page.addInitScript(() => {
    try {
      (window as any).__E2E_BYPASS_AUTH__ = true;
      const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
        .replace(/=+$/, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      const payload = btoa(
        JSON.stringify({
          exp: Math.floor(Date.now() / 1000) + 3600,
          sub: 'e2e',
        })
      )
        .replace(/=+$/, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      const token = `${header}.${payload}.e2e`;
      window.localStorage.setItem('sync-auth-token', token);
      window.localStorage.setItem(
        'sync-auth-user',
        JSON.stringify({ id: 'e2e', roles: ['ADMIN'] })
      );
    } catch {}
  });
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization,content-type,accept',
};

const fulfillJson = async (route: any, payload: any) => {
  const method = String(route.request().method() || '').toUpperCase();
  if (method === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: corsHeaders, body: '' });
    return;
  }
  await route.fulfill({
    status: 200,
    headers: corsHeaders,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
};

test.describe('Entradas: Previa → Editar', () => {
  test.setTimeout(60000);

  test('No deja backdrop huérfano al navegar a editar desde previa', async ({ page }) => {
    await setAuthStorage(page);

    let definicionesHits = 0;
    let buscarHits = 0;

    await page.route('**/api/v1/entradas/buscar/definicionesBuscador**', async (route) => {
      definicionesHits += 1;
      await fulfillJson(route, {
        result: { success: true },
        data: {
          filterKeySegunClazzNamePermitido: ['titulo'],
          operationPermitido: { titulo: ['CONTAINS'] },
        },
      });
    });

    await page.route('**/api/v1/entradas/buscar**', async (route) => {
      buscarHits += 1;
      await fulfillJson(route, {
        result: { success: true },
        data: {
          elements: [
            {
              idEntrada: 1,
              titulo: 'Entrada E2E',
              usernameCreador: 'e2e',
              fechaPublicacion: null,
              categorias: [],
              publicada: false,
              borrador: true,
              estadoEntrada: { codigo: 'BOR', nombre: 'Borrador' },
              tipoEntrada: { idTipoEntrada: 1, nombre: 'Blog' },
            },
          ],
          totalPages: 1,
          totalElements: 1,
          numberOfElements: 1,
        },
      });
    });

    await page.route('**/api/v1/entradas/tiposEntradas**', async (route) => {
      await fulfillJson(route, {
        result: { success: true },
        data: { tiposEntradas: [{ idTipoEntrada: 1, nombre: 'Blog' }] },
      });
    });

    await page.route('**/api/v1/entradas/estadosEntradas**', async (route) => {
      await fulfillJson(route, {
        result: { success: true },
        data: { estadosEntradas: [{ codigo: 'BOR', nombre: 'Borrador' }] },
      });
    });

    await page.route('**/api/v1/categorias**', async (route) => {
      await fulfillJson(route, { result: { success: true }, data: { elements: [] } });
    });

    await page.route('**/api/v1/etiquetas**', async (route) => {
      await fulfillJson(route, { result: { success: true }, data: { elements: [] } });
    });

    await page.route('**/api/v1/usuarios/perfil/yo**', async (route) => {
      await fulfillJson(route, { result: { success: true }, data: { username: 'e2e' } });
    });

    await page.route('**/api/v1/entradas/obtenerPorId/1**', async (route) => {
      await fulfillJson(route, {
        result: { success: true },
        data: {
          idEntrada: 1,
          titulo: 'Entrada E2E',
          contenido: '<p>Contenido</p>',
          imagenDestacada: null,
          categorias: [],
          estadoEntrada: { codigo: 'BOR', nombre: 'Borrador' },
          tipoEntrada: { idTipoEntrada: 1, nombre: 'Blog' },
        },
      });
    });

    await page.route('**/api/v1/**', async (route) => {
      await fulfillJson(route, { result: { success: true }, data: {} });
    });

    await page.goto('/#/admin?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="admin-root"]', { state: 'visible', timeout: 30000 });
    await page.goto('/#/admin/control/entradas?e2e=1', { waitUntil: 'domcontentloaded' });

    await expect.poll(() => definicionesHits).toBeGreaterThan(0, { timeout: 30000 });
    await expect.poll(() => buscarHits).toBeGreaterThan(0, { timeout: 30000 });

    const previewBtn = page.locator('button[aria-label^="Vista previa de"]').first();
    await expect(previewBtn).toBeVisible({ timeout: 30000 });
    await previewBtn.click();

    const editarBtn = page.getByRole('button', { name: 'Editar' }).first();
    await expect(editarBtn).toBeVisible({ timeout: 30000 });
    await editarBtn.click();

    await expect(page).toHaveURL(/#\/admin\/control\/entradas\/editar\/1(\?|$)/, {
      timeout: 30000,
    });

    await expect(page.locator('.modal-backdrop')).toHaveCount(0, { timeout: 10000 });
    const bodyHasModalOpen = await page.evaluate(() => document.body.classList.contains('modal-open'));
    expect(bodyHasModalOpen).toBe(false);
    const bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(bodyOverflow).not.toBe('hidden');
  });
});
