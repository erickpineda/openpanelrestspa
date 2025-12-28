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

test.describe('UI watchdog', () => {
  test.setTimeout(60000);

  test('Elimina backdrop huérfano y desbloquea el body', async ({ page }) => {
    await setAuthStorage(page);
    await page.goto('/#/admin?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="admin-root"]', { state: 'visible', timeout: 30000 });

    await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'modal-backdrop fade show';
      el.style.position = 'fixed';
      el.style.top = '0';
      el.style.left = '0';
      el.style.width = '100vw';
      el.style.height = '100vh';
      el.style.zIndex = '1040';
      el.style.background = 'rgba(0,0,0,.5)';
      document.body.appendChild(el);
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '10px';
    });

    await expect(page.locator('.modal-backdrop')).toHaveCount(0, { timeout: 10000 });

    const bodyHasModalOpen = await page.evaluate(() => document.body.classList.contains('modal-open'));
    expect(bodyHasModalOpen).toBe(false);
    const bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(bodyOverflow).not.toBe('hidden');

    const hasSnapshot = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('op_ui_anomaly_snapshots_v1');
        if (!raw) return false;
        const list = JSON.parse(raw);
        return Array.isArray(list) && list.length > 0;
      } catch {
        return false;
      }
    });
    expect(hasSnapshot).toBe(true);
  });
});

