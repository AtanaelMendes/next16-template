import { chromium } from '@playwright/test';
import fs from 'fs';

async function testHarnessWithFix() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Load the harness test page DOM
  await page.setContent(`
    <div id="test-drawer-container">
      <!-- Standard focusable elements -->
      <button id="btn-standard">Standard Button</button>
      <a id="link-standard" href="https://example.com">Standard Link</a>
      <input id="input-standard" type="text" value="Text input" />
      <select id="select-standard"><option>Option 1</option></select>
      <textarea id="textarea-standard">Textarea content</textarea>
      <div id="div-tabindex-0" tabindex="0">Custom focusable div</div>
      <div id="editable-div" contenteditable="true">Editable div</div>

      <!-- Elements that MUST be EXCLUDED according to accessibility requirements -->
      <button id="btn-disabled" disabled>Disabled Button</button>
      <input id="input-disabled" type="text" disabled value="Disabled input" />
      <select id="select-disabled" disabled><option>Disabled Select</option></select>
      <textarea id="textarea-disabled" disabled>Disabled Textarea</textarea>
      
      <a id="link-no-href">Link without href</a>
      <input id="input-hidden" type="hidden" value="Hidden input" />
      
      <!-- Explicit tabindex="-1" elements (MUST BE EXCLUDED) -->
      <div id="div-tabindex-minus-1" tabindex="-1">Programmatic only div</div>
      <button id="btn-tabindex-minus-1" tabindex="-1">Button tabindex -1</button>
      <a id="link-tabindex-minus-1" href="https://example.com" tabindex="-1">Link tabindex -1</a>
      <input id="input-tabindex-minus-1" type="text" tabindex="-1" value="Input tabindex -1" />
      <select id="select-tabindex-minus-1" tabindex="-1"><option>Select tabindex -1</option></select>
      <textarea id="textarea-tabindex-minus-1" tabindex="-1">Textarea tabindex -1</textarea>

      <!-- Invisible / Hidden elements (MUST BE EXCLUDED) -->
      <button id="btn-display-none" style="display: none;">Display None Button</button>
      <button id="btn-visibility-hidden" style="visibility: hidden;">Visibility Hidden Button</button>
      <div style="display: none;">
        <button id="btn-in-hidden-parent">Button in hidden parent</button>
      </div>
    </div>
  `);

  const results = await page.evaluate(() => {
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

    const container = document.getElementById('test-drawer-container');
    const matched = getFocusableElements(container);
    const matchedIds = matched.map(el => el.id);

    return {
      matchedIds,
      includesStandardButton: matchedIds.includes('btn-standard'),
      includesStandardLink: matchedIds.includes('link-standard'),
      includesStandardInput: matchedIds.includes('input-standard'),
      includesStandardSelect: matchedIds.includes('select-standard'),
      includesStandardTextarea: matchedIds.includes('textarea-standard'),
      includesDivTabindex0: matchedIds.includes('div-tabindex-0'),
      includesEditableDiv: matchedIds.includes('editable-div'),
      
      excludesDisabledButton: !matchedIds.includes('btn-disabled'),
      excludesDisabledInput: !matchedIds.includes('input-disabled'),
      excludesDisabledSelect: !matchedIds.includes('select-disabled'),
      excludesDisabledTextarea: !matchedIds.includes('textarea-disabled'),
      excludesLinkNoHref: !matchedIds.includes('link-no-href'),
      excludesInputHidden: !matchedIds.includes('input-hidden'),
      
      excludesDivTabindexMinus1: !matchedIds.includes('div-tabindex-minus-1'),
      excludesButtonTabindexMinus1: !matchedIds.includes('btn-tabindex-minus-1'),
      excludesLinkTabindexMinus1: !matchedIds.includes('link-tabindex-minus-1'),
      excludesInputTabindexMinus1: !matchedIds.includes('input-tabindex-minus-1'),
      excludesSelectTabindexMinus1: !matchedIds.includes('select-tabindex-minus-1'),
      excludesTextareaTabindexMinus1: !matchedIds.includes('textarea-tabindex-minus-1'),

      excludesDisplayNoneButton: !matchedIds.includes('btn-display-none'),
      excludesVisibilityHiddenButton: !matchedIds.includes('btn-visibility-hidden'),
      excludesHiddenParentButton: !matchedIds.includes('btn-in-hidden-parent'),
    };
  });

  console.log('Result Analysis:', JSON.stringify(results, null, 2));

  const allPassed = (
    results.includesStandardButton &&
    results.includesStandardLink &&
    results.includesStandardInput &&
    results.includesStandardSelect &&
    results.includesStandardTextarea &&
    results.includesDivTabindex0 &&
    results.includesEditableDiv &&
    results.excludesDisabledButton &&
    results.excludesDisabledInput &&
    results.excludesDisabledSelect &&
    results.excludesDisabledTextarea &&
    results.excludesLinkNoHref &&
    results.excludesInputHidden &&
    results.excludesDivTabindexMinus1 &&
    results.excludesButtonTabindexMinus1 &&
    results.excludesLinkTabindexMinus1 &&
    results.excludesInputTabindexMinus1 &&
    results.excludesSelectTabindexMinus1 &&
    results.excludesTextareaTabindexMinus1 &&
    results.excludesDisplayNoneButton &&
    results.excludesVisibilityHiddenButton &&
    results.excludesHiddenParentButton
  );

  console.log('ALL SUITE 2 CRITERIA PASSED:', allPassed);

  await browser.close();
}

testHarnessWithFix();
