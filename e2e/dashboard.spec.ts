import { test, expect } from '@playwright/test';

const setAuthStorage = async (page: any) => {
  await page.addInitScript(() => {
    try {
      (window as any).__E2E_BYPASS_AUTH__ = true;
      (window as any).__E2E_POPULATE_DASHBOARD__ = true;
      const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now()/1000) + 3600, sub: 'e2e' })).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
      const token = `${header}.${payload}.e2e`;
      window.localStorage.setItem('sync-auth-token', token);
      window.localStorage.setItem('sync-auth-user', JSON.stringify({ id: 'e2e', roles: ['ADMIN'] }));
    } catch {}
  });
};

test.describe('Dashboard inicial', () => {
  test.setTimeout(60000);
  test('Carga 30d/Día y descarga CSV con date_raw', async ({ page }) => {
    await setAuthStorage(page);
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await page.goto('/#/admin?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="admin-root"]', { state: 'visible', timeout: 30000 });
    await page.goto('/#/admin/dashboard?e2e=1', { waitUntil: 'domcontentloaded' });
    const loginImmediately = await page.locator('text=Login').first().isVisible().catch(() => false);
    if (loginImmediately) {
      await setAuthStorage(page);
      await page.goto('/#/admin?e2e=1', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-testid="admin-root"]', { state: 'visible', timeout: 30000 });
      await page.goto('/#/admin/dashboard?e2e=1', { waitUntil: 'domcontentloaded' });
    }
    await page.waitForSelector('[data-testid="dashboard-root"]', { state: 'visible', timeout: 90000 });
    const toolbarVisible = await page.locator('[data-testid="dashboard-toolbar"]').first().isVisible().catch(() => false);
    if (!toolbarVisible) {
      const loginVisible = await page.locator('text=Login').first().isVisible().catch(() => false);
      if (loginVisible) {
        await setAuthStorage(page);
        await page.goto('/admin/dashboard?e2e=1', { waitUntil: 'domcontentloaded' });
      }
      await page.waitForSelector('[data-testid="dashboard-root"]', { state: 'visible', timeout: 90000 });
    }

    const rangoGroup = page.getByRole('group', { name: 'Rango' });
    await expect(rangoGroup.getByRole('button', { name: '30d' })).toBeDisabled();

    const granGroup = page.getByRole('group', { name: 'Granularidad' });
    await expect(granGroup.getByRole('button', { name: 'Día' })).toBeDisabled();

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="btn-csv-series"]').click();
    const download = await downloadPromise;
    const path = await download.path();
    const content = await page.context().storageState();
    expect(path).toBeTruthy();
    const fs = require('fs');
    const data = fs.readFileSync(path!, 'utf-8');
    const lines = data.trim().split('\n');
    expect(lines[0]).toContain('date,date_raw');
    expect(lines[1]).toMatch(/^\d{2}-\d{2}-\d{4},\d{4}-\d{2}-\d{2}/);
  });

  test('Granularidad mensual usa nombres de mes en español', async ({ page }) => {
    await setAuthStorage(page);
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await page.goto('/#/admin?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="admin-root"]', { state: 'visible', timeout: 30000 });
    await page.goto('/#/admin/dashboard?e2e=1', { waitUntil: 'domcontentloaded' });
    const loginImmediately2 = await page.locator('text=Login').first().isVisible().catch(() => false);
    if (loginImmediately2) {
      await setAuthStorage(page);
      await page.goto('/#/admin?e2e=1', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-testid="admin-root"]', { state: 'visible', timeout: 30000 });
      await page.goto('/#/admin/dashboard?e2e=1', { waitUntil: 'domcontentloaded' });
    }
    await page.waitForSelector('[data-testid="dashboard-root"]', { state: 'visible', timeout: 90000 });
    const toolbarVisible2 = await page.locator('[data-testid="dashboard-toolbar"]').first().isVisible().catch(() => false);
    if (!toolbarVisible2) {
      const loginVisible2 = await page.locator('text=Login').first().isVisible().catch(() => false);
      if (loginVisible2) {
        await setAuthStorage(page);
        await page.goto('/admin/dashboard?e2e=1', { waitUntil: 'domcontentloaded' });
      }
      await page.waitForSelector('[data-testid="dashboard-root"]', { state: 'visible', timeout: 90000 });
    }

    const granGroup = page.getByRole('group', { name: 'Granularidad' });
    await granGroup.getByRole('button', { name: 'Mes' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="btn-csv-series"]').click();
    const download = await downloadPromise;
    const path = await download.path();
    const fs = require('fs');
    const data = fs.readFileSync(path!, 'utf-8');
    const lines = data.trim().split('\n');
    expect(lines[0]).toContain('date,date_raw');
    const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const firstDate = lines[1].split(',')[0];
    expect(months.some(m => firstDate.startsWith(m + ' '))).toBeTruthy();
  });

  test('CSV split estado incluye date_raw', async ({ page }) => {
    await setAuthStorage(page);
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await page.goto('/#/admin?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="admin-root"]', { state: 'visible', timeout: 30000 });
    await page.goto('/#/admin/dashboard?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="dashboard-root"]', { state: 'visible', timeout: 90000 });

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="btn-csv-split-estado"]').click();
    const download = await downloadPromise;
    const path = await download.path();
    const fs = require('fs');
    const data = fs.readFileSync(path!, 'utf-8');
    const lines = data.trim().split('\n');
    expect(lines[0]).toContain('date,date_raw');
    expect(lines[1]).toMatch(/^\d{2}-\d{2}-\d{4},\d{4}-\d{2}-\d{2}/);
  });

  test('CSV split estado nominal incluye date_raw', async ({ page }) => {
    await setAuthStorage(page);
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await page.goto('/#/admin?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="admin-root"]', { state: 'visible', timeout: 30000 });
    await page.goto('/#/admin/dashboard?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="dashboard-root"]', { state: 'visible', timeout: 90000 });

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="btn-csv-split-estado-nombre"]').click();
    const download = await downloadPromise;
    const path = await download.path();
    const fs = require('fs');
    const data = fs.readFileSync(path!, 'utf-8');
    const lines = data.trim().split('\n');
    expect(lines[0]).toContain('date,date_raw');
    expect(lines[1]).toMatch(/^\d{2}-\d{2}-\d{4},\d{4}-\d{2}-\d{2}/);
  });

  test('CSV Top Usuarios tiene encabezados name,count', async ({ page }) => {
    await setAuthStorage(page);
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await page.goto('/#/admin?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="admin-root"]', { state: 'visible', timeout: 30000 });
    await page.goto('/#/admin/dashboard?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="dashboard-root"]', { state: 'visible', timeout: 90000 });

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="btn-csv-top-users"]').click();
    const download = await downloadPromise;
    const path = await download.path();
    const fs = require('fs');
    const data = fs.readFileSync(path!, 'utf-8');
    const lines = data.trim().split('\n');
    expect(lines[0]).toContain('name,count');
  });

  test('CSV Top Categorías tiene encabezados name,count', async ({ page }) => {
    await setAuthStorage(page);
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await page.goto('/#/admin?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="admin-root"]', { state: 'visible', timeout: 30000 });
    await page.goto('/#/admin/dashboard?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="dashboard-root"]', { state: 'visible', timeout: 90000 });

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="btn-csv-top-categories"]').click();
    const download = await downloadPromise;
    const path = await download.path();
    const fs = require('fs');
    const data = fs.readFileSync(path!, 'utf-8');
    const lines = data.trim().split('\n');
    expect(lines[0]).toContain('name,count');
  });

  test('CSV Top Tags tiene encabezados name,count', async ({ page }) => {
    await setAuthStorage(page);
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await page.goto('/#/admin?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="admin-root"]', { state: 'visible', timeout: 30000 });
    await page.goto('/#/admin/dashboard?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="dashboard-root"]', { state: 'visible', timeout: 90000 });

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="btn-csv-top-tags"]').click();
    const download = await downloadPromise;
    const path = await download.path();
    const fs = require('fs');
    const data = fs.readFileSync(path!, 'utf-8');
    const lines = data.trim().split('\n');
    expect(lines[0]).toContain('name,count');
  });

  test('CSV Content Stats tiene encabezados metric,value', async ({ page }) => {
    await setAuthStorage(page);
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await page.goto('/#/admin?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="admin-root"]', { state: 'visible', timeout: 30000 });
    await page.goto('/#/admin/dashboard?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="dashboard-root"]', { state: 'visible', timeout: 90000 });

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="btn-csv-content-stats"]').click();
    const download = await downloadPromise;
    const path = await download.path();
    const fs = require('fs');
    const data = fs.readFileSync(path!, 'utf-8');
    const lines = data.trim().split('\n');
    expect(lines[0]).toContain('metric,value');
  });

  test('CSV Content Stats Estados tiene encabezados estado,count', async ({ page }) => {
    await setAuthStorage(page);
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await page.goto('/#/admin?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="admin-root"]', { state: 'visible', timeout: 30000 });
    await page.goto('/#/admin/dashboard?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="dashboard-root"]', { state: 'visible', timeout: 90000 });

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="btn-csv-content-stats-estados"]').click();
    const download = await downloadPromise;
    const path = await download.path();
    const fs = require('fs');
    const data = fs.readFileSync(path!, 'utf-8');
    const lines = data.trim().split('\n');
    expect(lines[0]).toContain('estado,count');
  });

  test('CSV Storage tiene encabezados metric,value', async ({ page }) => {
    await setAuthStorage(page);
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await page.goto('/#/admin?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="admin-root"]', { state: 'visible', timeout: 30000 });
    await page.goto('/#/admin/dashboard?e2e=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="dashboard-root"]', { state: 'visible', timeout: 90000 });

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="btn-csv-storage"]').click();
    const download = await downloadPromise;
    const path = await download.path();
    const fs = require('fs');
    const data = fs.readFileSync(path!, 'utf-8');
    const lines = data.trim().split('\n');
    expect(lines[0]).toContain('metric,value');
  });
});
