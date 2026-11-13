import { test, expect, Page } from '@playwright/test';
import fs from 'node:fs';

const COMPONENTS_PATH = '/components';
const THEME_KEY = 'next16-template:theme';

async function openComponents(page: Page) {
  await page.goto(COMPONENTS_PATH);
  await expect(page.getByRole('heading', { name: /Buttons/ })).toBeVisible();
}

async function getTheme(page: Page): Promise<'light' | 'dark'> {
  return page.evaluate(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
}

async function ensureTheme(page: Page, theme: 'light' | 'dark') {
  if ((await getTheme(page)) !== theme) {
    await page.getByTestId('theme-toggle').click();
  }
  await expect.poll(() => getTheme(page)).toBe(theme);
  await expect(page.locator('html')).toHaveAttribute(
    'style',
    new RegExp(`color-scheme:\\s*${theme}`, 'i')
  );
}

async function toggleSwitch(page: Page, id: string) {
  // Switch inputs are visually hidden (sr-only); click their wrapping label instead.
  await page.locator(`label:has(#${id})`).click();
}

async function assertNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  expect(
    metrics.scrollWidth,
    `document scrollWidth ${metrics.scrollWidth} should not exceed viewport ${metrics.innerWidth}`
  ).toBeLessThanOrEqual(metrics.innerWidth + 1);
}

test.describe('Component library theming and accessibility', () => {
  test('toggles light -> dark -> light and syncs native color-scheme', async ({ page }) => {
    await openComponents(page);
    await expect.poll(() => getTheme(page)).toBe('dark');

    await page.getByTestId('theme-toggle').click();
    await expect.poll(() => getTheme(page)).toBe('light');
    await expect(page.getByTestId('theme-toggle')).toHaveAttribute(
      'aria-label',
      'Ativar tema escuro'
    );
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)
    ).toBe('light');

    await page.getByTestId('theme-toggle').click();
    await expect.poll(() => getTheme(page)).toBe('dark');
    await expect(page.getByTestId('theme-toggle')).toHaveAttribute(
      'aria-label',
      'Ativar tema claro'
    );
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)
    ).toBe('dark');
  });

  test('persists the selected theme after reload', async ({ page }) => {
    await openComponents(page);
    await ensureTheme(page, 'light');
    expect(await page.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe('light');

    await page.reload();
    await expect(page.getByRole('heading', { name: /Buttons/ })).toBeVisible();
    await expect.poll(() => getTheme(page)).toBe('light');

    // The pre-paint script must resolve the theme before React hydrates.
    expect(
      await page.evaluate(() => document.documentElement.classList.contains('light'))
    ).toBe(true);
  });

  test('has no hydration warnings or uncaught page errors', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await openComponents(page);
    await ensureTheme(page, 'light');
    await page.locator('#demo-text').fill('Teste de hidratação');
    await toggleSwitch(page, 'toggle-a');
    await ensureTheme(page, 'dark');

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);

    const hydrationErrors = consoleErrors.filter((line) =>
      /hydrat|did not match|server rendered html|text content does not match/i.test(line)
    );
    expect(hydrationErrors, `Hydration errors: ${hydrationErrors.join(' | ')}`).toEqual([]);
  });

  test('renders core components and interactions in both themes', async ({ page }) => {
    await openComponents(page);

    for (const theme of ['dark', 'light'] as const) {
      await ensureTheme(page, theme);

      await expect(page.getByRole('heading', { name: /PillsBadge/ })).toBeVisible();
      await expect(page.getByText('Usuários do sistema')).toBeVisible();
      await expect(page.getByText('Criado', { exact: true }).first()).toBeVisible();

      const input = page.locator('#demo-text');
      await input.fill(`Tema ${theme}`);
      await expect(input).toHaveValue(`Tema ${theme}`);

      await page.locator('#select-demo').selectOption('SP');
      await expect(page.locator('#select-demo')).toHaveValue('SP');

      await page.locator('#chk-a').check();
      await expect(page.locator('#chk-a')).toBeChecked();

      await page.locator('#opt1').check();
      await expect(page.locator('#opt1')).toBeChecked();

      const toggleA = page.locator('#toggle-a');
      const wasChecked = await toggleA.isChecked();
      await toggleSwitch(page, 'toggle-a');
      await expect(toggleA).toBeChecked({ checked: !wasChecked });
      await toggleSwitch(page, 'toggle-a');
      await expect(toggleA).toBeChecked({ checked: wasChecked });
    }
  });

  test('Inputs, Select, Timeline, PillsBadge, Pagination and DataTable stay usable in dark and light', async ({ page }) => {
    await openComponents(page);

    for (const theme of ['dark', 'light'] as const) {
      await ensureTheme(page, theme);

      // Inputs keep their labels associated with the field.
      await expect(page.locator('label[for="demo-text"]')).toBeVisible();

      // Semantic badges render in every variant.
      for (const badge of ['default', 'primary', 'danger', 'success', 'warning']) {
        await expect(page.locator('#pills').getByText(badge, { exact: true }).first()).toBeVisible();
      }

      // Timeline content is readable.
      const timelineSection = page.locator('#display');
      await expect(timelineSection.getByRole('heading', { name: 'Criado' })).toBeVisible();
      await expect(timelineSection.locator('time').filter({ hasText: '01/11/2026 09:00' })).toBeVisible();

      // Pagination uses real buttons and marks the current page.
      const nav = page.getByRole('navigation', { name: 'Paginação' });
      await expect(nav).toBeVisible();
      await expect(nav.locator('button[aria-current="page"]')).toHaveText('1');
      await nav.getByRole('button', { name: 'Página 2' }).click();
      await expect(nav.locator('button[aria-current="page"]')).toHaveText('2');
      await nav.getByRole('button', { name: 'Primeira página' }).click();
      await expect(nav.locator('button[aria-current="page"]')).toHaveText('1');

      // DataTable is fully themed and populated.
      const tableSection = page.locator('#tables');
      await expect(tableSection.getByText('Usuários do sistema')).toBeVisible();
      await expect(tableSection.getByText('Ana Souza')).toBeVisible();
      await expect(tableSection.getByText('Exibindo 5 registros')).toBeVisible();
      await expect(tableSection.getByText('Sem registros')).toBeVisible();
      await expect(tableSection.getByText('Não há dados para exibir...')).toBeVisible();
    }
  });

  test('disabled, error, selected and readOnly states remain legible', async ({ page }) => {
    await openComponents(page);
    await ensureTheme(page, 'dark');

    const disabled = page.locator('#demo-disabled');
    await expect(disabled).toBeDisabled();

    const contrast = await disabled.evaluate((el) => {
      const parse = (value: string) => {
        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
      };
      const luminance = ([r, g, b]: number[]) => {
        const channel = (value: number) => {
          const normalized = value / 255;
          return normalized <= 0.03928
            ? normalized / 12.92
            : Math.pow((normalized + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      };
      const style = window.getComputedStyle(el);
      const fg = parse(style.color);
      const bg = parse(style.backgroundColor);
      if (!fg || !bg) return null;
      const [lighter, darker] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
      return (lighter + 0.05) / (darker + 0.05);
    });

    expect(contrast, 'disabled text must remain readable').not.toBeNull();
    expect(contrast as number).toBeGreaterThanOrEqual(3);

    // Filled action buttons meet AA for normal text in the active (dark) theme.
    for (const label of ['Primary', 'Danger']) {
      const button = page.getByRole('button', { name: label, exact: true }).first();
      const buttonContrast = await button.evaluate((el) => {
        const parse = (value: string) => {
          const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
        };
        const luminance = ([r, g, b]: number[]) => {
          const channel = (value: number) => {
            const normalized = value / 255;
            return normalized <= 0.03928
              ? normalized / 12.92
              : Math.pow((normalized + 0.055) / 1.055, 2.4);
          };
          return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
        };
        const style = window.getComputedStyle(el);
        const fg = parse(style.color);
        const bg = parse(style.backgroundColor);
        if (!fg || !bg) return null;
        const [lighter, darker] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
        return (lighter + 0.05) / (darker + 0.05);
      });
      expect(buttonContrast, `${label} button contrast`).not.toBeNull();
      expect(buttonContrast as number).toBeGreaterThanOrEqual(4.5);
    }

    await expect(page.getByText('Este campo é obrigatório').first()).toBeVisible();
    await expect(page.getByText('Selecione uma opção')).toBeVisible();
    await expect(page.locator('#select-disabled')).toBeDisabled();
    await expect(page.locator('#demo-readonly')).toHaveJSProperty('readOnly', true);

    // Error state is not conveyed by colour alone: a text message is present.
    await expect(page.locator('#demo-error')).toBeVisible();

    // Keyboard focus produces a perceptible indicator.
    await page.locator('#demo-text').focus();
    await page.keyboard.press('Tab');
    const focusVisible = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        matches: el.matches(':focus-visible'),
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
      };
    });
    expect(focusVisible.tag).not.toBe('BODY');
    expect(focusVisible.matches).toBe(true);
    const hasIndicator =
      (focusVisible.outlineStyle !== 'none' && parseFloat(focusVisible.outlineWidth) >= 2) ||
      (focusVisible.boxShadow !== 'none' && focusVisible.boxShadow.length > 0);
    expect(hasIndicator, 'focus-visible must show an outline or ring').toBe(true);
  });

  test('has no horizontal overflow at desktop and mobile sizes in both themes', async ({ page }) => {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 },
    ]) {
      await page.setViewportSize(viewport);
      await openComponents(page);

      for (const theme of ['dark', 'light'] as const) {
        await ensureTheme(page, theme);
        await assertNoHorizontalOverflow(page);
      }
    }
  });

  test('floating labels are aligned with their fields and not clipped', async ({ page }) => {
    await openComponents(page);

    for (const theme of ['dark', 'light'] as const) {
      await ensureTheme(page, theme);

      for (const fieldId of ['demo-text', 'demo-error', 'select-demo']) {
        const field = page.locator(`#${fieldId}`);
        const label = page.locator(`label[for="${fieldId}"]`);
        await expect(label).toBeVisible();

        const box = await field.boundingBox();
        const labelBox = await label.boundingBox();
        expect(box).not.toBeNull();
        expect(labelBox).not.toBeNull();

        expect(labelBox!.x).toBeGreaterThanOrEqual(box!.x - 6);
        expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(box!.x + box!.width + 12);
        expect(labelBox!.y).toBeLessThan(box!.y + 4);

        const clipped = await label.evaluate((el) => el.scrollWidth > el.clientWidth + 2);
        expect(clipped, `label for ${fieldId} should not be clipped`).toBe(false);
      }
    }
  });

  test('captures reference screenshots for both themes and viewports', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const project = testInfo.project.name.replace(/\s+/g, '-');
    fs.mkdirSync('test-results/theme-artifacts', { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await openComponents(page);

    for (const theme of ['light', 'dark'] as const) {
      await ensureTheme(page, theme);
      await page.screenshot({
        path: `test-results/theme-artifacts/components-${theme}-desktop-${project}.png`,
        fullPage: true,
        animations: 'disabled',
      });
    }

    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.getByRole('heading', { name: /Buttons/ })).toBeVisible();

    for (const theme of ['light', 'dark'] as const) {
      await ensureTheme(page, theme);
      await page.screenshot({
        path: `test-results/theme-artifacts/components-${theme}-mobile-${project}.png`,
        fullPage: true,
        animations: 'disabled',
      });
    }
  });
});
