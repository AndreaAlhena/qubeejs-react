import { expect, test } from '@playwright/test';

test.describe('a list in the Next.js App Router', () => {
  test('renders the state of the requested URL on the server and on the client', async ({
    page,
    request,
  }) => {
    const html = await (await request.get('/articles?page=3&q=react')).text();

    // What the server sent, before any JavaScript ran.
    expect(html).toMatch(/id="server-page">3</);
    expect(html).toMatch(/id="client-page">3</);

    await page.goto('/articles?page=3&q=react');

    await expect(page.locator('#client-page')).toHaveText('3');
    await expect(page.locator('#search')).toHaveValue('react');
    await expect(page.locator('#pending')).toHaveText('false');
  });

  test('hydrates without an error', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/articles?page=2');
    await expect(page.locator('#client-page')).toHaveText('2');

    expect(errors).toEqual([]);
  });

  test('sorts and pages through the router, and the server follows', async ({ page }) => {
    await page.goto('/articles');

    await page.locator('#sort-title').click();

    await expect(page).toHaveURL(/\/articles\?sort=title$/);
    await expect(page.locator('#title-header')).toHaveAttribute('aria-sort', 'ascending');
    await expect(page.locator('#server-uri')).toContainText('title:asc');

    await page.locator('#next-button').click();

    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator('#client-page')).toHaveText('2');
    await expect(page.locator('#server-page')).toHaveText('2');
    await expect(page.locator('#pending')).toHaveText('false');
  });

  test('follows a link built with href(), and the back button', async ({ page }) => {
    await page.goto('/articles');

    await page.locator('#next-link').click();

    await expect(page.locator('#client-page')).toHaveText('2');

    await page.goBack();

    await expect(page.locator('#client-page')).toHaveText('1');
    await expect(page.locator('#pending')).toHaveText('false');
  });

  test('debounces a search and replaces the history entry', async ({ page }) => {
    await page.goto('/other');
    await page.locator('#back-to-articles').click();
    await expect(page.locator('#client-page')).toHaveText('1');

    await page.locator('#search').pressSequentially('react', { delay: 20 });

    // The input never lags; the URL waits for the pause.
    await expect(page.locator('#search')).toHaveValue('react');
    await expect(page).toHaveURL(/\/articles\?q=react$/);
    await expect(page.locator('#pending')).toHaveText('false');
    await expect(page.locator('#client-uri')).toContainText('react');

    // One entry for the whole search: Back leaves the page instead of undoing keystrokes.
    await page.goBack();

    await expect(page.locator('#other')).toBeVisible();
  });

  test('resets every param in one navigation', async ({ page }) => {
    await page.goto('/articles?page=4&q=react&sort=title&utm=keep');

    await page.locator('#reset').click();

    await expect(page).toHaveURL(/\/articles\?utm=keep$/);
    await expect(page.locator('#client-page')).toHaveText('1');
    await expect(page.locator('#search')).toHaveValue('');
  });

  test('works on a statically rendered route, behind a Suspense boundary', async ({ page }) => {
    await page.goto('/static?page=5');

    await expect(page.locator('#client-page')).toHaveText('5');

    await page.locator('#next-button').click();

    await expect(page).toHaveURL(/\/static\?page=6$/);
    await expect(page.locator('#client-page')).toHaveText('6');
  });

  test('is not pulled back when the user follows a slow link while a search is pending', async ({
    page,
  }) => {
    await page.goto('/articles');

    // The debounce is still waiting when the link is clicked, and the page it leads to takes
    // longer to arrive than the debounce: the search must not overtake the navigation.
    await page.locator('#search').pressSequentially('late');
    await page.locator('#slow-link').click();

    await expect(page.locator('#slow')).toBeVisible();
    await expect(page).toHaveURL(/\/slow$/);

    // The click committed the search at once. Next.js may then drop that navigation in favour of
    // the link's, or land it first: either way Back returns to the list, and nothing is pending.
    await page.goBack();

    await expect(page).toHaveURL(/\/articles(\?q=late)?$/);
    await expect(page.locator('#pending')).toHaveText('false');
  });
});
