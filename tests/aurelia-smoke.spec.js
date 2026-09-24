const { test, expect } = require('@playwright/test');

test('Aurelia Travels loads and core navigation works', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Aurelia Travels/i);
  await expect(page.locator('h1')).toContainText('TRAVEL');

  for (const link of ['Destinations', 'Experiences', 'Journeys', 'Journal', 'About']) {
    await expect(page.getByRole('link', { name: link })).toBeVisible();
  }

  await page.getByRole('button', { name: /Plan your journey/i }).click();
  await expect(page.locator('#enquiryModal')).toHaveClass(/open/);
  await expect(page.locator('#enquiryForm')).toBeVisible();

  await page.locator('#closeModal').click();
  await expect(page.locator('#enquiryModal')).not.toHaveClass(/open/);
});

test('Aurelia Concierge opens on mobile', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Open Aurelia Concierge/i }).click();
  await expect(page.locator('#concierge')).toHaveClass(/open/);
  await expect(page.locator('#chatInput')).toBeVisible();
});
