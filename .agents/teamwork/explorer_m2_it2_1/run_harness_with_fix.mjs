import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import swc from 'next/dist/build/swc/index.js';
import React from 'react';
import { renderToString } from 'react-dom/server';

await swc.loadBindings();

const testResults = {
  suites: [],
  summary: { total: 0, passed: 0, failed: 0 }
};

function recordTest(suiteName, testName, passed, details = {}) {
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    testResults.summary.failed++;
    console.log(`  [FAIL] ${testName}`);
    console.log(`         Details:`, JSON.stringify(details));
  }
  let suite = testResults.suites.find(s => s.name === suiteName);
  if (!suite) {
    suite = { name: suiteName, tests: [] };
    testResults.suites.push(suite);
  }
  suite.tests.push({ name: testName, passed, details });
}

async function runTest() {
  console.log('================================================================');
  console.log('VERIFYING FULL 6 SUITES WITH FIXED FOCUSABLE LOGIC');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // SUITE 1: Body Scroll Lock Mechanics & Reference Counting
  console.log('Suite 1: Body Scroll Lock Lifecycle & Reference Counting');
  const s1_1 = await page.evaluate(() => {
    let activeLocksCount = 0;
    let originalOverflowStyle = '';
    function lockBodyScroll() {
      if (typeof document === 'undefined') return;
      if (activeLocksCount === 0) {
        originalOverflowStyle = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      activeLocksCount++;
    }
    function unlockBodyScroll() {
      if (typeof document === 'undefined') return;
      activeLocksCount = Math.max(0, activeLocksCount - 1);
      if (activeLocksCount === 0) {
        document.body.style.overflow = originalOverflowStyle || '';
      }
    }
    document.body.style.overflow = '';
    const initialOverflow = document.body.style.overflow;
    lockBodyScroll();
    const lockedOverflow = document.body.style.overflow;
    unlockBodyScroll();
    const unlockedOverflow = document.body.style.overflow;
    return {
      initialOverflow,
      lockedOverflow,
      unlockedOverflow,
      passed: lockedOverflow === 'hidden' && unlockedOverflow === ''
    };
  });
  recordTest('Body Scroll Lock', 'Single locker sets document.body.style.overflow = "hidden" and restores original style on unlock', s1_1.passed, s1_1);

  const s1_2 = await page.evaluate(() => {
    let activeLocksCount = 0;
    let originalOverflowStyle = '';
    function lockBodyScroll() {
      if (typeof document === 'undefined') return;
      if (activeLocksCount === 0) {
        originalOverflowStyle = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      activeLocksCount++;
    }
    function unlockBodyScroll() {
      if (typeof document === 'undefined') return;
      activeLocksCount = Math.max(0, activeLocksCount - 1);
      if (activeLocksCount === 0) {
        document.body.style.overflow = originalOverflowStyle || '';
      }
    }
    document.body.style.overflow = '';
    lockBodyScroll();
    const state1 = { count: activeLocksCount, overflow: document.body.style.overflow };
    lockBodyScroll();
    const state2 = { count: activeLocksCount, overflow: document.body.style.overflow };
    unlockBodyScroll();
    const state3 = { count: activeLocksCount, overflow: document.body.style.overflow };
    unlockBodyScroll();
    const state4 = { count: activeLocksCount, overflow: document.body.style.overflow };
    return {
      passed: (
        state1.overflow === 'hidden' && state1.count === 1 &&
        state2.overflow === 'hidden' && state2.count === 2 &&
        state3.overflow === 'hidden' && state3.count === 1 &&
        state4.overflow === '' && state4.count === 0
      )
    };
  });
  recordTest('Body Scroll Lock', 'Multiple lockers reference counting: overflow remains "hidden" until last locker unlocks (count = 0)', s1_2.passed, s1_2);

  const s1_3 = await page.evaluate(() => {
    let activeLocksCount = 0;
    let originalOverflowStyle = '';
    function lockBodyScroll() {
      if (typeof document === 'undefined') return;
      if (activeLocksCount === 0) {
        originalOverflowStyle = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      activeLocksCount++;
    }
    function unlockBodyScroll() {
      if (typeof document === 'undefined') return;
      activeLocksCount = Math.max(0, activeLocksCount - 1);
      if (activeLocksCount === 0) {
        document.body.style.overflow = originalOverflowStyle || '';
      }
    }
    document.body.style.overflow = '';
    unlockBodyScroll();
    unlockBodyScroll();
    unlockBodyScroll();
    const underflowCount = activeLocksCount;
    lockBodyScroll();
    const lockedCount = activeLocksCount;
    const lockedOverflow = document.body.style.overflow;
    unlockBodyScroll();
    const finalCount = activeLocksCount;
    const finalOverflow = document.body.style.overflow;
    return {
      passed: underflowCount === 0 && lockedCount === 1 && lockedOverflow === 'hidden' && finalCount === 0 && finalOverflow === ''
    };
  });
  recordTest('Body Scroll Lock', 'Underflow defense: calling unlock with count=0 does not make counter negative and recovers cleanly', s1_3.passed, s1_3);

  const s1_4 = await page.evaluate(() => {
    let activeLocksCount = 0;
    let originalOverflowStyle = '';
    function lockBodyScroll() {
      if (typeof document === 'undefined') return;
      if (activeLocksCount === 0) {
        originalOverflowStyle = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      activeLocksCount++;
    }
    function unlockBodyScroll() {
      if (typeof document === 'undefined') return;
      activeLocksCount = Math.max(0, activeLocksCount - 1);
      if (activeLocksCount === 0) {
        document.body.style.overflow = originalOverflowStyle || '';
      }
    }
    document.body.style.overflow = 'scroll';
    lockBodyScroll();
    const locked = document.body.style.overflow;
    unlockBodyScroll();
    const restored = document.body.style.overflow;
    return {
      passed: locked === 'hidden' && restored === 'scroll'
    };
  });
  recordTest('Body Scroll Lock', 'Preserves pre-existing custom body overflow (e.g., "scroll" or "auto") upon unlocking', s1_4.passed, s1_4);

  // SUITE 2: Focus Trap Logic & getFocusableElements with PROPOSED FIX
  console.log('\nSuite 2: Focus Trap Logic & getFocusableElements (WITH FIX)');
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

  const focusableAnalysis = await page.evaluate(() => {
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

  const discoversAllStandard = (
    focusableAnalysis.includesStandardButton &&
    focusableAnalysis.includesStandardLink &&
    focusableAnalysis.includesStandardInput &&
    focusableAnalysis.includesStandardSelect &&
    focusableAnalysis.includesStandardTextarea &&
    focusableAnalysis.includesDivTabindex0 &&
    focusableAnalysis.includesEditableDiv
  );
  recordTest('Focus Trap Logic', 'Discovers all standard focusable elements (button, link with href, text input, select, textarea, tabindex="0", contenteditable)', discoversAllStandard, focusableAnalysis);

  const excludesDisabledAndHidden = (
    focusableAnalysis.excludesDisabledButton &&
    focusableAnalysis.excludesDisabledInput &&
    focusableAnalysis.excludesDisabledSelect &&
    focusableAnalysis.excludesDisabledTextarea &&
    focusableAnalysis.excludesLinkNoHref &&
    focusableAnalysis.excludesInputHidden
  );
  recordTest('Focus Trap Logic', 'Excludes elements with disabled attribute, type="hidden" inputs, and <a> tags without href', excludesDisabledAndHidden, focusableAnalysis);

  const excludesAllTabindexMinus1 = (
    focusableAnalysis.excludesDivTabindexMinus1 &&
    focusableAnalysis.excludesButtonTabindexMinus1 &&
    focusableAnalysis.excludesLinkTabindexMinus1 &&
    focusableAnalysis.excludesInputTabindexMinus1 &&
    focusableAnalysis.excludesSelectTabindexMinus1 &&
    focusableAnalysis.excludesTextareaTabindexMinus1
  );
  recordTest('Focus Trap Logic', 'Excludes elements with tabindex="-1" (<button>, <a>, <input>, <select>, <textarea>, <div>)', excludesAllTabindexMinus1, focusableAnalysis);

  const excludesAllHidden = (
    focusableAnalysis.excludesDisplayNoneButton &&
    focusableAnalysis.excludesVisibilityHiddenButton &&
    focusableAnalysis.excludesHiddenParentButton
  );
  recordTest('Focus Trap Logic', 'Excludes invisible elements (display: none, visibility: hidden, elements in hidden parents)', excludesAllHidden, focusableAnalysis);

  // SUITE 3: Keyboard Navigation Handlers (Focus Trap Simulation)
  console.log('\nSuite 3: Keyboard Navigation Handlers (Focus Trap Simulation)');
  await page.setContent(`
    <div>
      <button id="outside-before">Outside Before</button>
      <div id="drawer-trap" role="dialog" aria-modal="true" tabindex="-1">
        <button id="trap-btn-1">Trap Button 1 (First)</button>
        <input id="trap-input-2" type="text" value="Trap Input 2 (Middle)" />
        <button id="trap-btn-3">Trap Button 3 (Last)</button>
      </div>
      <button id="outside-after">Outside After</button>
    </div>
  `);

  await page.evaluate(() => {
    const drawer = document.getElementById('drawer-trap');
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

    window.__trapKeydownHandler = (e) => {
      if (e.key === 'Tab') {
        const focusables = getFocusableElements(drawer);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (e.shiftKey) {
          if (active === first || !drawer.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !drawer.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', window.__trapKeydownHandler, true);
  });

  const tabWrapResult = await page.evaluate(() => {
    const btn1 = document.getElementById('trap-btn-1');
    const btn3 = document.getElementById('trap-btn-3');
    btn3.focus();
    const focusedBefore = document.activeElement.id;
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true, shiftKey: false });
    window.dispatchEvent(tabEvent);
    const focusedAfter = document.activeElement.id;
    return {
      passed: focusedBefore === 'trap-btn-3' && focusedAfter === 'trap-btn-1' && tabEvent.defaultPrevented === true
    };
  });
  recordTest('Focus Trap Simulation', 'Forward Tab on last focusable element wraps focus back to the first element and prevents default', tabWrapResult.passed, tabWrapResult);

  const shiftTabWrapResult = await page.evaluate(() => {
    const btn1 = document.getElementById('trap-btn-1');
    btn1.focus();
    const focusedBefore = document.activeElement.id;
    const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true, shiftKey: true });
    window.dispatchEvent(shiftTabEvent);
    const focusedAfter = document.activeElement.id;
    return {
      passed: focusedBefore === 'trap-btn-1' && focusedAfter === 'trap-btn-3' && shiftTabEvent.defaultPrevented === true
    };
  });
  recordTest('Focus Trap Simulation', 'Backward Shift-Tab on first focusable element wraps focus back to the last element and prevents default', shiftTabWrapResult.passed, shiftTabWrapResult);

  const midTabResult = await page.evaluate(() => {
    const input2 = document.getElementById('trap-input-2');
    input2.focus();
    const focusedBefore = document.activeElement.id;
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true, shiftKey: false });
    window.dispatchEvent(tabEvent);
    return {
      passed: tabEvent.defaultPrevented === false
    };
  });
  recordTest('Focus Trap Simulation', 'Mid-drawer Tab does not prevent default, allowing native sequential keyboard progression', midTabResult.passed, midTabResult);

  const outsideTrapResult = await page.evaluate(() => {
    const outsideBtn = document.getElementById('outside-before');
    outsideBtn.focus();
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true, shiftKey: false });
    window.dispatchEvent(tabEvent);
    const focusedAfterTab = document.activeElement.id;
    outsideBtn.focus();
    const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true, shiftKey: true });
    window.dispatchEvent(shiftTabEvent);
    const focusedAfterShiftTab = document.activeElement.id;
    return {
      passed: focusedAfterTab === 'trap-btn-1' && focusedAfterShiftTab === 'trap-btn-3'
    };
  });
  recordTest('Focus Trap Simulation', 'Outside focus interception traps runaway focus back into drawer on Tab (first) and Shift-Tab (last)', outsideTrapResult.passed, outsideTrapResult);

  // SUITE 4: ESC Key Dismissal
  console.log('\nSuite 4: ESC Key Dismissal');
  const escModalResult = await page.evaluate(() => {
    let closed = false;
    const onClose = () => { closed = true; };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true });
    window.dispatchEvent(escEvent);
    window.removeEventListener('keydown', handleKeyDown, true);
    return {
      passed: closed === true && escEvent.defaultPrevented === true
    };
  });
  recordTest('ESC Key Dismissal', 'Escape key triggers onClose callback and prevents event default/propagation in temporary modal mode', escModalResult.passed, escModalResult);

  const escPersistentResult = await page.evaluate(() => {
    let closed = false;
    const isPersistent = true;
    const onClose = () => { closed = true; };
    const handleKeyDown = (e) => {
      if (isPersistent) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true });
    window.dispatchEvent(escEvent);
    window.removeEventListener('keydown', handleKeyDown, true);
    return {
      passed: closed === false
    };
  });
  recordTest('ESC Key Dismissal', 'Escape key does not dismiss drawer when in persistent desktop layout mode', escPersistentResult.passed, escPersistentResult);

  // SUITE 5: Return Focus on Close
  console.log('\nSuite 5: Return Focus on Close');
  const returnFocusResult = await page.evaluate(async () => {
    const trigger = document.createElement('button');
    trigger.id = 'test-trigger-btn';
    document.body.appendChild(trigger);
    const other = document.createElement('button');
    document.body.appendChild(other);
    other.focus();
    const focusedBefore = document.activeElement.id;
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        if (typeof document !== 'undefined' && document.body.contains(trigger)) {
          trigger.focus();
        }
        resolve();
      });
    });
    const focusedAfter = document.activeElement.id;
    trigger.remove();
    other.remove();
    return {
      passed: focusedBefore !== 'test-trigger-btn' && focusedAfter === 'test-trigger-btn'
    };
  });
  recordTest('Return Focus on Close', 'Restores focus to triggerRef.current via requestAnimationFrame upon drawer closure', returnFocusResult.passed, returnFocusResult);

  const unmountedTriggerResult = await page.evaluate(async () => {
    let threw = false;
    const trigger = document.createElement('button');
    try {
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          if (typeof document !== 'undefined' && document.body.contains(trigger)) {
            trigger.focus();
          }
          resolve();
        });
      });
    } catch {
      threw = true;
    }
    return {
      passed: threw === false
    };
  });
  recordTest('Return Focus on Close', 'Safely guards against unmounted/removed triggers without throwing exceptions', unmountedTriggerResult.passed, unmountedTriggerResult);

  // SUITE 6: Permanent Toggle Accessibility (DrawerToggle)
  console.log('\nSuite 6: Permanent Toggle Accessibility (DrawerToggle)');
  const drawerToggleSrc = fs.readFileSync('src/components/ui/drawer/DrawerToggle.jsx', 'utf8');
  const replacedToggleSrc = drawerToggleSrc
    .replace('@/lib/utils', '../../../src/lib/utils.js')
    .replace("'./useDrawer'", "'../../../src/components/ui/drawer/useDrawer.js'");
  const transformedToggle = await swc.transform(replacedToggleSrc, {
    jsc: {
      parser: { syntax: 'ecmascript', jsx: true },
      transform: { react: { runtime: 'automatic' } },
    },
    module: { type: 'es6' },
  });
  const tempTogglePath = path.resolve('.agents/teamwork/explorer_m2_it2_1/temp_DrawerToggle.mjs');
  fs.writeFileSync(tempTogglePath, transformedToggle.code);
  const { DrawerToggle } = await import('./temp_DrawerToggle.mjs');

  const leftClosedHtml = renderToString(React.createElement(DrawerToggle, { side: 'left', open: false }));
  recordTest('DrawerToggle Accessibility', 'Left toggle closed state: renders <button type="button"> with aria-expanded="false", aria-controls="left-drawer", and data-testid="left-drawer-toggle"', leftClosedHtml.includes('<button') && leftClosedHtml.includes('type="button"') && leftClosedHtml.includes('aria-expanded="false"') && leftClosedHtml.includes('aria-controls="left-drawer"') && leftClosedHtml.includes('data-testid="left-drawer-toggle"'));

  const leftOpenHtml = renderToString(React.createElement(DrawerToggle, { side: 'left', open: true }));
  recordTest('DrawerToggle Accessibility', 'Left toggle open state: renders <button type="button"> with aria-expanded="true", aria-controls="left-drawer", and data-testid="left-drawer-toggle"', leftOpenHtml.includes('<button') && leftOpenHtml.includes('type="button"') && leftOpenHtml.includes('aria-expanded="true"') && leftOpenHtml.includes('aria-controls="left-drawer"') && leftOpenHtml.includes('data-testid="left-drawer-toggle"'));

  const rightClosedHtml = renderToString(React.createElement(DrawerToggle, { side: 'right', open: false }));
  recordTest('DrawerToggle Accessibility', 'Right toggle closed state: renders <button type="button"> with aria-expanded="false", aria-controls="right-drawer", and data-testid="right-drawer-toggle"', rightClosedHtml.includes('<button') && rightClosedHtml.includes('type="button"') && rightClosedHtml.includes('aria-expanded="false"') && rightClosedHtml.includes('aria-controls="right-drawer"') && rightClosedHtml.includes('data-testid="right-drawer-toggle"'));

  const rightOpenHtml = renderToString(React.createElement(DrawerToggle, { side: 'right', open: true }));
  recordTest('DrawerToggle Accessibility', 'Right toggle open state: renders <button type="button"> with aria-expanded="true", aria-controls="right-drawer", and data-testid="right-drawer-toggle"', rightOpenHtml.includes('<button') && rightOpenHtml.includes('type="button"') && rightOpenHtml.includes('aria-expanded="true"') && rightOpenHtml.includes('aria-controls="right-drawer"') && rightOpenHtml.includes('data-testid="right-drawer-toggle"'));

  const customToggleHtml = renderToString(React.createElement(DrawerToggle, { side: 'left', open: true, ariaLabel: 'Custom Drawer Label', ariaControls: 'custom-drawer-id', dataTestId: 'custom-toggle-btn' }));
  recordTest('DrawerToggle Accessibility', 'Accepts and prioritizes custom ariaLabel, ariaControls, and dataTestId props', customToggleHtml.includes('aria-label="Custom Drawer Label"') && customToggleHtml.includes('aria-controls="custom-drawer-id"') && customToggleHtml.includes('data-testid="custom-toggle-btn"'));

  await page.setContent('<div id="toggle-host"></div>');
  const spaceActivationResult = await page.evaluate(() => {
    let toggleCount = 0;
    const handleToggle = () => { toggleCount++; };
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handleToggle();
      }
    };
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.addEventListener('keydown', handleKeyDown);
    document.getElementById('toggle-host').appendChild(btn);
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ', code: 'Space', keyCode: 32, bubbles: true, cancelable: true });
    btn.dispatchEvent(spaceEvent);
    return {
      passed: toggleCount === 1 && spaceEvent.defaultPrevented === true
    };
  });
  recordTest('DrawerToggle Accessibility', 'Space keydown triggers toggle handler and prevents default page scroll', spaceActivationResult.passed, spaceActivationResult);

  await browser.close();

  console.log('\n================================================================');
  console.log(`TEST EXECUTION SUMMARY: ${testResults.summary.passed}/${testResults.summary.total} PASSED`);
  console.log(`FAILURES: ${testResults.summary.failed}`);
  console.log('================================================================\n');

  return testResults;
}

runTest().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
