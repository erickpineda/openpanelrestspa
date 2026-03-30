import { test, expect } from '@playwright/test';

const mockEntradas = [
  {
    idEntrada: 101,
    slug: 'hola-openpanel',
    titulo: 'Hola OpenPanel',
    resumen: 'Resumen de prueba',
    publicada: true,
    fechaPublicacion: '2026-03-01 10:00:00',
    votos: 3,
    cantidadComentarios: 0,
    usernameCreador: 'admin',
    categorias: [{ nombre: 'Angular' }],
    etiquetas: [{ nombre: 'Frontend' }],
    contenido: '<p>Contenido de prueba</p>',
  },
  {
    idEntrada: 102,
    slug: 'segunda-entrada',
    titulo: 'Segunda entrada',
    resumen: 'Otra entrada',
    publicada: true,
    fechaPublicacion: '2026-03-02 10:00:00',
    votos: 1,
    cantidadComentarios: 2,
    usernameCreador: 'admin',
    categorias: [{ nombre: 'CoreUI' }],
    etiquetas: [{ nombre: 'UI' }],
    contenido: '<p>Otro contenido</p>',
  },
];

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/entradas/buscar**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { elements: mockEntradas, totalPages: 1 } }),
    });
  });

  await page.route('**/api/v1/entradas/obtenerPorSlug/*', async (route) => {
    const url = route.request().url();
    const slug = decodeURIComponent(url.split('/').pop() || '');
    const found = mockEntradas.find((e) => e.slug === slug) ?? mockEntradas[0];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: found }),
    });
  });

  await page.route('**/api/v1/categorias**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          elements: [
            { nombre: 'Angular', cantidadEntradas: 10 },
            { nombre: 'CoreUI', cantidadEntradas: 8 },
            { nombre: 'UX', cantidadEntradas: 5 },
          ],
        },
      }),
    });
  });

  await page.route('**/api/v1/comentarios/listarPorIdEntrada/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ elements: [], totalPages: 0, totalElements: 0, hasMore: false }),
    });
  });
});

test('home → listado → detalle (smoke público)', async ({ page }) => {
  await page.goto('/#/home', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('banner', { name: 'Portada' })).toBeVisible();
  await expect(page.getByText('Últimas Publicaciones')).toBeVisible();

  await page.getByRole('button', { name: 'Ver entradas' }).click();
  await expect(page.getByRole('heading', { name: 'Explorar Entradas' })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 820 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Filtros' }).click();
  await expect(page.locator('#publicFiltersLabel')).toBeVisible();

  const offcanvasBody = page.locator('c-offcanvas-body');
  await offcanvasBody.getByPlaceholder('Palabras clave...').fill('openpanel');
  await offcanvasBody.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('button', { name: 'Cerrar' }).click();
  await expect(page.locator('c-offcanvas.offcanvas.show')).toHaveCount(0);

  await page.getByRole('link', { name: 'Hola OpenPanel', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Hola OpenPanel' })).toBeVisible();
  await expect(page.getByText('Entradas relacionadas')).toBeVisible();

  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page).toHaveURL(/#\/login/);
});
