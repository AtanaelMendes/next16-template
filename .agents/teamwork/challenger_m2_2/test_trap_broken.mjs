import { chromium } from '@playwright/test';

async function testFocusTrapFailureWithHiddenLastElement() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(`
    <div id="drawer" role="dialog" aria-modal="true">
      <button id="btn-first">First Visible Button</button>
      <button id="btn-hidden-last" style="display: none;">Hidden Last Button</button>
    </div>
  `);

  const result = await page.evaluate(() => {
    const drawer = document.getElementById('drawer');

    // Implementation currently in useDrawer.js
    const FOCUSABLE_SELECTOR = [
      'a[href]',
      'area[href]',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    function getFocusableElements(container) {
      if (!container || typeof window === 'undefined') return [];
      const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
      return elements.filter((el) => {
        return (
          el.offsetWidth > 0 ||
          el.offsetHeight > 0 ||
          el.getClientRects().length > 0 ||
          window.getComputedStyle(el).visibility !== 'hidden'
        );
      });
    }

    const focusables = getFocusableElements(drawer);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    // User is on first element and presses Shift-Tab
    first.focus();
    const activeBefore = document.activeElement.id;

    // Simulate focus trap shift-tab wrap:
    if (document.activeElement === first) {
      last.focus();
    }
    const activeAfter = document.activeElement.id;
    const bodyActive = document.activeElement === document.body;

    return {
      focusablesCount: focusables.length,
      lastId: last.id,
      activeBefore,
      activeAfter,
      bodyActive
    };
  });

  console.log('Focus trap with hidden element result:');
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
}

testFocusTrapFailureWithHiddenLastElement();
