import { chromium } from '@playwright/test';

async function testFocusTrapFixed() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(`
    <div id="drawer" role="dialog" aria-modal="true">
      <button id="btn-first">First Visible Button</button>
      <button id="btn-middle">Middle Visible Button</button>
      <button id="btn-hidden-last" style="display: none;">Hidden Last Button</button>
      <button id="btn-minus1-last" tabindex="-1">Minus 1 Button</button>
    </div>
  `);

  const result = await page.evaluate(() => {
    const drawer = document.getElementById('drawer');

    const FOCUSABLE_SELECTOR = [
      'a[href]:not([tabindex="-1"])',
      'area[href]:not([tabindex="-1"])',
      'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'iframe:not([tabindex="-1"])',
      'object:not([tabindex="-1"])',
      'embed:not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]:not([tabindex="-1"])',
    ].join(', ');

    function getFocusableElements(container) {
      if (!container || typeof window === 'undefined') return [];
      const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
      return elements.filter((el) => {
        if (el.getAttribute('tabindex') === '-1' || el.hasAttribute('disabled')) {
          return false;
        }
        const style = window.getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none') {
          return false;
        }
        return (
          el.offsetWidth > 0 ||
          el.offsetHeight > 0 ||
          el.getClientRects().length > 0
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

    // Simulate focus trap tab wrap:
    if (document.activeElement === last) {
      first.focus();
    }
    const activeAfterTab = document.activeElement.id;

    return {
      focusablesCount: focusables.length,
      matchedIds: focusables.map(el => el.id),
      firstId: first.id,
      lastId: last.id,
      activeBefore,
      activeAfter,
      activeAfterTab,
      shiftTabWrappedProperly: activeAfter === 'btn-middle',
      tabWrappedProperly: activeAfterTab === 'btn-first'
    };
  });

  console.log('Fixed Focus Trap result:');
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
}

testFocusTrapFixed();
