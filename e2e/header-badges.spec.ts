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
        }),
      )
        .replace(/=+$/, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      const token = `${header}.${payload}.e2e`;
      window.localStorage.setItem('sync-auth-token', token);
      window.localStorage.setItem(
        'sync-auth-user',
        JSON.stringify({ id: 'e2e', roles: ['ADMIN'] }),
      );
    } catch {}
  });
};

test.describe('Header badges', () => {
  test.setTimeout(60000);

  test('incrementa notificaciones al mostrar un toast global', async ({
    page,
  }) => {
    await setAuthStorage(page);
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await page.goto('/#/admin?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="admin-root"]', {
      state: 'visible',
      timeout: 30000,
    });

    await page.evaluate(() => {
      try {
        (window as any).__E2E_CLEAR_TOASTS__?.();
      } catch {}
    });

    // Abrir menú de usuario para leer el badge de "Actualizaciones"
    await page.getByLabel('Abrir menú de usuario').click();
    const updatesBadge = page.locator(
      'ul[cDropdownMenu] a:has-text("Actualizaciones") c-badge',
    );
    const initialText = (await updatesBadge.textContent())?.trim() || '0';
    const initialCount = Number(initialText) || 0;

    await page.evaluate(() => {
      try {
        (window as any).__E2E_SHOW_TOAST__?.({
          title: 'E2E',
          body: `Campo requerido ${Date.now()}`,
          color: 'danger',
          autohide: false,
        });
      } catch {}
    });

    // Esperar a que el badge de Actualizaciones se incremente
    const target = String(initialCount + 1);
    const isMenuVisible = await page
      .locator('ul[cDropdownMenu]')
      .isVisible()
      .catch(() => false);
    if (!isMenuVisible) {
      await page.getByLabel('Abrir menú de usuario').click();
    }
    await expect(updatesBadge).toHaveText(target, { timeout: 15000 });
  });
});
