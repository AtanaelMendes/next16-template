const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:3001/components');
  await page.waitForSelector('#chk-a');
  console.log('before', await page.locator('#chk-a').isChecked());
  await page.locator('#chk-a').click();
  await page.waitForTimeout(300);
  console.log('after click', await page.locator('#chk-a').isChecked());
  console.log('state text', await page.locator('#inputs').getByText(/Termos:/).textContent());
  await page.locator('label:has(#chk-a)').click();
  await page.waitForTimeout(300);
  console.log('after label click', await page.locator('#chk-a').isChecked());
  console.log('errors', errors);
  await browser.close();
})();
