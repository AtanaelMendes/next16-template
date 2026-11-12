import { chromium } from '@playwright/test';

async function testCorrected() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(`
    <div id="test-drawer-container">
      <button id="btn-standard">Standard Button</button>
      <a id="link-standard" href="https://example.com">Standard Link</a>
      <input id="input-standard" type="text" value="Text input" />
      <select id="select-standard"><option>Option 1</option></select>
      <textarea id="textarea-standard">Textarea content</textarea>
      <div id="div-tabindex-0" tabindex="0">Custom focusable div</div>
      <div id="editable-div" contenteditable="true">Editable div</div>

      <button id="btn-disabled" disabled>Disabled Button</button>
      <input id="input-disabled" type="text" disabled value="Disabled input" />
      <select id="select-disabled" disabled><option>Disabled Select</option></select>
      <textarea id="textarea-disabled" disabled>Disabled Textarea</textarea>
      <a id="link-no-href">Link without href</a>
      <input id="input-hidden" type="hidden" value="Hidden input" />
      
      <div id="div-tabindex-minus-1" tabindex="-1">Programmatic only div</div>
      <button id="btn-tabindex-minus-1" tabindex="-1">Button tabindex -1</button>
      <a id="link-tabindex-minus-1" href="https://example.com" tabindex="-1">Link tabindex -1</a>
      <input id="input-tabindex-minus-1" type="text" tabindex="-1" value="Input tabindex -1" />
      <select id="select-tabindex-minus-1" tabindex="-1"><option>Select tabindex -1</option></select>
      <textarea id="textarea-tabindex-minus-1" tabindex="-1">Textarea tabindex -1</textarea>

      <button id="btn-display-none" style="display: none;">Display None Button</button>
      <button id="btn-visibility-hidden" style="visibility: hidden;">Visibility Hidden Button</button>
      <div style="display: none;">
        <button id="btn-in-hidden-parent">Button in hidden parent</button>
      </div>
    </div>
  `);

  const result = await page.evaluate(() => {
    const FOCUSABLE_SELECTOR = [
      'a[href]:not([tabindex="-1"])',
      'area[href]:not([tabindex="-1"])',
      'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'iframe:not([tabindex="-1"])',
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

    const container = document.getElementById('test-drawer-container');
    const matched = getFocusableElements(container);
    return matched.map(el => el.id);
  });

  console.log('Corrected getFocusableElements matched IDs:');
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
}

testCorrected();
