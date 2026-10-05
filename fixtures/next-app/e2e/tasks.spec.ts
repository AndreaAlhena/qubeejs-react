import { expect, test } from '@playwright/test';

test.describe('a list whose request needs a route param', () => {
  test('fetches on the server with the project from the path', async ({ request }) => {
    const html = await (await request.get('/projects/42/tasks?status=open')).text();

    // The open tasks of project 42, in the HTML the server sent.
    expect(html).toContain('Project 42 · Task 01');
    expect(html).not.toContain('Project 42 · Task 02');
    expect(html).not.toContain('Project 7 ·');
  });

  test('fetches the next state in the browser, with the project kept and out of the URL', async ({
    page,
  }) => {
    const asked: string[] = [];

    page.on('request', (sent) => {
      if (sent.url().includes('/api/tasks')) {
        asked.push(decodeURIComponent(sent.url()));
      }
    });

    await page.goto('/projects/42/tasks?status=open');

    await expect(page.locator('#rows li').first()).toHaveText('Project 42 · Task 01');
    await expect(page.locator('#fetching')).toHaveText('false');
    // The page came with the HTML: the browser asked the API for nothing.
    expect(asked).toEqual([]);

    await page.locator('#status-done').click();

    await expect(page).toHaveURL(/\/projects\/42\/tasks\?status=done$/);
    await expect(page.locator('#rows li').first()).toHaveText('Project 42 · Task 02');
    await expect(page.locator('#fetching')).toHaveText('false');
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain('filters[project][$eq]=42');
    expect(asked[0]).toContain('filters[status][$eq]=done');
  });

  test('reads the project of the route it is on', async ({ page }) => {
    await page.goto('/projects/7/tasks');

    await expect(page.locator('#rows li').first()).toHaveText('Project 7 · Task 01');
    await expect(page.locator('#client-uri')).toContainText('filters[project][$eq]=7');
  });
});
