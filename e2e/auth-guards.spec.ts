import { test, expect } from '@playwright/test';

test.describe('Protección de rutas y sesión', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch {}
      try {
        (window as any).__E2E_BYPASS_AUTH__ = false;
      } catch {}
    });
  });

  test('redirige /admin a /login sin renderizar contenido de admin', async ({ page }) => {
    await page.goto('/#/admin', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('text=Login', { timeout: 30000 });

    const adminRoot = page.locator('[data-testid="admin-root"]');
    await expect(adminRoot).toHaveCount(0);

    await expect(page.locator('text=Sesión Finalizada')).toHaveCount(0);
    await expect(page.locator('.modal.show')).toHaveCount(0);

    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test('no muestra modal de sesión expirada durante el chequeo previo de auth', async ({ page }) => {
    await page.goto('/#/admin', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('text=Login', { timeout: 30000 });
    await expect(page.locator('text=Sesión Finalizada')).toHaveCount(0);
    await expect(page.locator('.modal.show')).toHaveCount(0);
  });

  test('redirige si token caducado sin mostrar dashboard', async ({ page }) => {
    await page.addInitScript(() => {
      const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
      const exp = Math.floor(Date.now() / 1000) - 60; // expirado
      const payload = btoa(JSON.stringify({ exp })).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
      const token = `${header}.${payload}.x`;
      localStorage.setItem('sync-auth-token', token);
      localStorage.setItem('sync-auth-user', JSON.stringify({ username: 'expired' }));
    });
    await page.goto('/#/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid="admin-root"]')).toHaveCount(0);
  });

  test('redirige si token inválido (mal formado)', async ({ page }) => {
    await page.addInitScript(() => {
      const token = 'abc.def'; // mal formado
      localStorage.setItem('sync-auth-token', token);
      localStorage.setItem('sync-auth-user', JSON.stringify({ username: 'bad' }));
    });
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await page.goto('/#/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid="admin-root"]')).toHaveCount(0);
  });

  test('redirige rápidamente ante 401 del backend', async ({ page }) => {
    await page.addInitScript(() => {
      const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
      const exp = Math.floor(Date.now() / 1000) + 300; // válido unos minutos
      const payload = btoa(JSON.stringify({ exp })).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
      const token = `${header}.${payload}.x`;
      localStorage.setItem('sync-auth-token', token);
      localStorage.setItem('sync-auth-user', JSON.stringify({ username: 'ok' }));
    });

    await page.route('**/api/v1/**', async (route) => {
      await route.fulfill({ status: 401, body: 'Unauthorized' });
    });

    await page.goto('/#/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid="admin-root"]')).toHaveCount(0);
  });

  test('no render de admin bajo red lenta sin sesión', async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.removeItem('sync-auth-token'); localStorage.removeItem('sync-auth-user'); } catch {}
    });
    await page.route('**/*', async (route) => {
      // simula red lenta para recursos de la app; el guard debe redirigir igual
      await new Promise(r => setTimeout(r, 1500));
      await route.continue();
    });
    await page.goto('/#/admin', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/#\/login$/);
    await expect(page.locator('[data-testid="admin-root"]')).toHaveCount(0);
  });
});
