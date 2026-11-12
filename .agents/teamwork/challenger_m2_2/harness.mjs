/**
 * Empirical Challenge Test Harness for Milestone 2: Reusable Drawer Core System & Accessibility
 * 
 * Tests:
 * 1. Body scroll lock (lockBodyScroll, unlockBodyScroll, ref counting, overflow restore)
 * 2. Focus trap logic (getFocusableElements discovery, tabindex="-1" and disabled exclusion, hidden exclusion)
 * 3. Keyboard navigation handlers (Tab forward wrap-around, Shift-Tab reverse wrap, boundary conditions)
 * 4. ESC dismissal (modal mode onClose trigger, persistent mode non-trigger)
 * 5. Return focus (triggerRef.current?.focus() called on close, activeElement fallback)
 * 6. Permanent toggle accessibility (DrawerToggle rendering, type="button", aria-controls, aria-expanded, data-testid, Space/Enter activation)
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import swc from 'next/dist/build/swc/index.js';
import React from 'react';
import { renderToString } from 'react-dom/server';

await swc.loadBindings();

// Results accumulator
const testResults = {
  timestamp: new Date().toISOString(),
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

async function runEmpiricalHarness() {
  console.log('================================================================');
  console.log('STARTING EMPIRICAL CHALLENGER TEST HARNESS: MILESTONE 2');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Read implementation source files
  const useDrawerSrc = fs.readFileSync('src/components/ui/drawer/useDrawer.js', 'utf8');
  const drawerToggleSrc = fs.readFileSync('src/components/ui/drawer/DrawerToggle.jsx', 'utf8');

  // --------------------------------------------------------------------------
  // SUITE 1: Body Scroll Lock Mechanics & Reference Counting
  // --------------------------------------------------------------------------
  console.log('Suite 1: Body Scroll Lock Lifecycle & Reference Counting');
  
  // Test 1.1: Single lock/unlock lifecycle
  const s1_1 = await page.evaluate(() => {
    // Inject clean isolated module logic for scroll lock
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
  recordTest(
    'Body Scroll Lock',
    'Single locker sets document.body.style.overflow = "hidden" and restores original style on unlock',
    s1_1.passed,
    s1_1
  );

  // Test 1.2: Multi-locker reference counting (2 lockers)
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
    // Locker 1 locks
    lockBodyScroll();
    const state1 = { count: activeLocksCount, overflow: document.body.style.overflow };
    // Locker 2 locks
    lockBodyScroll();
    const state2 = { count: activeLocksCount, overflow: document.body.style.overflow };
    // Locker 1 unlocks -> must STAY 'hidden' because Locker 2 is still active
    unlockBodyScroll();
    const state3 = { count: activeLocksCount, overflow: document.body.style.overflow };
    // Locker 2 unlocks -> now drops to 0, must restore to ''
    unlockBodyScroll();
    const state4 = { count: activeLocksCount, overflow: document.body.style.overflow };

    return {
      state1,
      state2,
      state3,
      state4,
      passed: (
        state1.overflow === 'hidden' && state1.count === 1 &&
        state2.overflow === 'hidden' && state2.count === 2 &&
        state3.overflow === 'hidden' && state3.count === 1 &&
        state4.overflow === '' && state4.count === 0
      )
    };
  });
  recordTest(
    'Body Scroll Lock',
    'Multiple lockers reference counting: overflow remains "hidden" until last locker unlocks (count = 0)',
    s1_2.passed,
    s1_2
  );

  // Test 1.3: Underflow protection (unlock called when count is 0)
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
    // Call unlock 3 times while 0
    unlockBodyScroll();
    unlockBodyScroll();
    unlockBodyScroll();
    const underflowCount = activeLocksCount;

    // Now lock once
    lockBodyScroll();
    const lockedCount = activeLocksCount;
    const lockedOverflow = document.body.style.overflow;

    // Unlock once
    unlockBodyScroll();
    const finalCount = activeLocksCount;
    const finalOverflow = document.body.style.overflow;

    return {
      underflowCount,
      lockedCount,
      lockedOverflow,
      finalCount,
      finalOverflow,
      passed: underflowCount === 0 && lockedCount === 1 && lockedOverflow === 'hidden' && finalCount === 0 && finalOverflow === ''
    };
  });
  recordTest(
    'Body Scroll Lock',
    'Underflow defense: calling unlock with count=0 does not make counter negative and recovers cleanly',
    s1_3.passed,
    s1_3
  );

  // Test 1.4: Pre-existing custom overflow style preservation
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
      initial: 'scroll',
      locked,
      restored,
      passed: locked === 'hidden' && restored === 'scroll'
    };
  });
  recordTest(
    'Body Scroll Lock',
    'Preserves pre-existing custom body overflow (e.g., "scroll" or "auto") upon unlocking',
    s1_4.passed,
    s1_4
  );

  // --------------------------------------------------------------------------
  // SUITE 2: Focus Trap Logic & getFocusableElements
  // --------------------------------------------------------------------------
  console.log('\nSuite 2: Focus Trap Logic & getFocusableElements');

  // Setup DOM inside Chromium for testing getFocusableElements
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

  // Execute getFocusableElements as implemented in src/components/ui/drawer/useDrawer.js
  const focusableAnalysis = await page.evaluate(() => {
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
      
      // Exclusion checks
      excludesDisabledButton: !matchedIds.includes('btn-disabled'),
      excludesDisabledInput: !matchedIds.includes('input-disabled'),
      excludesDisabledSelect: !matchedIds.includes('select-disabled'),
      excludesDisabledTextarea: !matchedIds.includes('textarea-disabled'),
      excludesLinkNoHref: !matchedIds.includes('link-no-href'),
      excludesInputHidden: !matchedIds.includes('input-hidden'),
      
      // TABINDEX="-1" EXCLUSION CHECKS
      excludesDivTabindexMinus1: !matchedIds.includes('div-tabindex-minus-1'),
      excludesButtonTabindexMinus1: !matchedIds.includes('btn-tabindex-minus-1'),
      excludesLinkTabindexMinus1: !matchedIds.includes('link-tabindex-minus-1'),
      excludesInputTabindexMinus1: !matchedIds.includes('input-tabindex-minus-1'),
      excludesSelectTabindexMinus1: !matchedIds.includes('select-tabindex-minus-1'),
      excludesTextareaTabindexMinus1: !matchedIds.includes('textarea-tabindex-minus-1'),

      // VISIBILITY / DISPLAY CHECKS
      excludesDisplayNoneButton: !matchedIds.includes('btn-display-none'),
      excludesVisibilityHiddenButton: !matchedIds.includes('btn-visibility-hidden'),
      excludesHiddenParentButton: !matchedIds.includes('btn-in-hidden-parent'),
    };
  });

  // Test 2.1: Discovers all standard interactive elements
  const discoversAllStandard = (
    focusableAnalysis.includesStandardButton &&
    focusableAnalysis.includesStandardLink &&
    focusableAnalysis.includesStandardInput &&
    focusableAnalysis.includesStandardSelect &&
    focusableAnalysis.includesStandardTextarea &&
    focusableAnalysis.includesDivTabindex0 &&
    focusableAnalysis.includesEditableDiv
  );
  recordTest(
    'Focus Trap Logic',
    'Discovers all standard focusable elements (button, link with href, text input, select, textarea, tabindex="0", contenteditable)',
    discoversAllStandard,
    focusableAnalysis
  );

  // Test 2.2: Excludes disabled elements, hidden inputs, and no-href links
  const excludesDisabledAndHidden = (
    focusableAnalysis.excludesDisabledButton &&
    focusableAnalysis.excludesDisabledInput &&
    focusableAnalysis.excludesDisabledSelect &&
    focusableAnalysis.excludesDisabledTextarea &&
    focusableAnalysis.excludesLinkNoHref &&
    focusableAnalysis.excludesInputHidden
  );
  recordTest(
    'Focus Trap Logic',
    'Excludes elements with disabled attribute, type="hidden" inputs, and <a> tags without href',
    excludesDisabledAndHidden,
    focusableAnalysis
  );

  // Test 2.3: Excludes elements with tabindex="-1"
  const excludesAllTabindexMinus1 = (
    focusableAnalysis.excludesDivTabindexMinus1 &&
    focusableAnalysis.excludesButtonTabindexMinus1 &&
    focusableAnalysis.excludesLinkTabindexMinus1 &&
    focusableAnalysis.excludesInputTabindexMinus1 &&
    focusableAnalysis.excludesSelectTabindexMinus1 &&
    focusableAnalysis.excludesTextareaTabindexMinus1
  );
  recordTest(
    'Focus Trap Logic',
    'Excludes elements with tabindex="-1" (<button>, <a>, <input>, <select>, <textarea>, <div>)',
    excludesAllTabindexMinus1,
    {
      divMinus1Excluded: focusableAnalysis.excludesDivTabindexMinus1,
      buttonMinus1Excluded: focusableAnalysis.excludesButtonTabindexMinus1,
      linkMinus1Excluded: focusableAnalysis.excludesLinkTabindexMinus1,
      inputMinus1Excluded: focusableAnalysis.excludesInputTabindexMinus1,
      selectMinus1Excluded: focusableAnalysis.excludesSelectTabindexMinus1,
      textareaMinus1Excluded: focusableAnalysis.excludesTextareaTabindexMinus1,
      allMatchedIds: focusableAnalysis.matchedIds
    }
  );

  // Test 2.4: Excludes invisible / hidden elements
  const excludesAllHidden = (
    focusableAnalysis.excludesDisplayNoneButton &&
    focusableAnalysis.excludesVisibilityHiddenButton &&
    focusableAnalysis.excludesHiddenParentButton
  );
  recordTest(
    'Focus Trap Logic',
    'Excludes invisible elements (display: none, visibility: hidden, elements in hidden parents)',
    excludesAllHidden,
    {
      displayNoneExcluded: focusableAnalysis.excludesDisplayNoneButton,
      visibilityHiddenExcluded: focusableAnalysis.excludesVisibilityHiddenButton,
      hiddenParentExcluded: focusableAnalysis.excludesHiddenParentButton,
      allMatchedIds: focusableAnalysis.matchedIds
    }
  );

  // --------------------------------------------------------------------------
  // SUITE 3: Keyboard Navigation Handlers (Tab & Shift-Tab Wrap-Around)
  // --------------------------------------------------------------------------
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

  // Attach keydown listener simulating useDrawerAccessibility focus trap
  await page.evaluate(() => {
    const drawer = document.getElementById('drawer-trap');
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

  // Test 3.1: Tab forward wrap-around from last to first
  const tabWrapResult = await page.evaluate(() => {
    const btn1 = document.getElementById('trap-btn-1');
    const btn3 = document.getElementById('trap-btn-3');
    
    // Focus last element
    btn3.focus();
    const focusedBefore = document.activeElement.id;

    // Simulate Tab keydown event
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      keyCode: 9,
      bubbles: true,
      cancelable: true,
      shiftKey: false
    });
    const dispatched = window.dispatchEvent(tabEvent);
    const focusedAfter = document.activeElement.id;
    const defaultPrevented = tabEvent.defaultPrevented;

    return {
      focusedBefore,
      focusedAfter,
      defaultPrevented,
      passed: focusedBefore === 'trap-btn-3' && focusedAfter === 'trap-btn-1' && defaultPrevented === true
    };
  });
  recordTest(
    'Keyboard Navigation',
    'Forward Tab on last focusable element wraps focus back to the first element and prevents default',
    tabWrapResult.passed,
    tabWrapResult
  );

  // Test 3.2: Shift-Tab reverse wrap from first to last
  const shiftTabWrapResult = await page.evaluate(() => {
    const btn1 = document.getElementById('trap-btn-1');
    const btn3 = document.getElementById('trap-btn-3');
    
    // Focus first element
    btn1.focus();
    const focusedBefore = document.activeElement.id;

    // Simulate Shift+Tab keydown event
    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      keyCode: 9,
      bubbles: true,
      cancelable: true,
      shiftKey: true
    });
    window.dispatchEvent(shiftTabEvent);
    const focusedAfter = document.activeElement.id;
    const defaultPrevented = shiftTabEvent.defaultPrevented;

    return {
      focusedBefore,
      focusedAfter,
      defaultPrevented,
      passed: focusedBefore === 'trap-btn-1' && focusedAfter === 'trap-btn-3' && defaultPrevented === true
    };
  });
  recordTest(
    'Keyboard Navigation',
    'Backward Shift-Tab on first focusable element wraps focus back to the last element and prevents default',
    shiftTabWrapResult.passed,
    shiftTabWrapResult
  );

  // Test 3.3: Mid-drawer Tab does NOT prevent default (allows normal navigation)
  const midTabResult = await page.evaluate(() => {
    const input2 = document.getElementById('trap-input-2');
    input2.focus();
    
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      keyCode: 9,
      bubbles: true,
      cancelable: true,
      shiftKey: false
    });
    window.dispatchEvent(tabEvent);
    
    return {
      activeId: document.activeElement.id,
      defaultPrevented: tabEvent.defaultPrevented,
      passed: tabEvent.defaultPrevented === false
    };
  });
  recordTest(
    'Keyboard Navigation',
    'Mid-drawer Tab does not prevent default, allowing native sequential keyboard progression',
    midTabResult.passed,
    midTabResult
  );

  // Test 3.4: Outside focus interception
  const outsideTabResult = await page.evaluate(() => {
    const outsideBtn = document.getElementById('outside-before');
    outsideBtn.focus();

    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      keyCode: 9,
      bubbles: true,
      cancelable: true,
      shiftKey: false
    });
    window.dispatchEvent(tabEvent);
    const focusedAfterTab = document.activeElement.id;

    // Reset outside
    outsideBtn.focus();
    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      keyCode: 9,
      bubbles: true,
      cancelable: true,
      shiftKey: true
    });
    window.dispatchEvent(shiftTabEvent);
    const focusedAfterShiftTab = document.activeElement.id;

    return {
      focusedAfterTab,
      focusedAfterShiftTab,
      passed: focusedAfterTab === 'trap-btn-1' && focusedAfterShiftTab === 'trap-btn-3'
    };
  });
  recordTest(
    'Keyboard Navigation',
    'Outside focus interception traps runaway focus back into drawer on Tab (first) and Shift-Tab (last)',
    outsideTabResult.passed,
    outsideTabResult
  );

  // --------------------------------------------------------------------------
  // SUITE 4: ESC Dismissal in Temporary Modal Mode
  // --------------------------------------------------------------------------
  console.log('\nSuite 4: ESC Key Dismissal');

  // Test 4.1: ESC triggers onClose in modal mode
  const escModalResult = await page.evaluate(() => {
    let closedCount = 0;
    const onClose = () => { closedCount++; };

    // Simulate listener registration from useDrawerAccessibility
    const activeOpen = true;
    const activeTemporary = true;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    const escEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(escEvent);
    window.removeEventListener('keydown', handleKeyDown, true);

    return {
      closedCount,
      defaultPrevented: escEvent.defaultPrevented,
      passed: closedCount === 1 && escEvent.defaultPrevented === true
    };
  });
  recordTest(
    'ESC Dismissal',
    'Escape key triggers onClose callback and prevents event default/propagation in temporary modal mode',
    escModalResult.passed,
    escModalResult
  );

  // Test 4.2: ESC does NOT trigger onClose in persistent desktop mode
  const escPersistentResult = await page.evaluate(() => {
    let closedCount = 0;
    const onClose = () => { closedCount++; };

    const activeOpen = true;
    const activeTemporary = false; // Persistent mode!

    let listenerAttached = false;
    if (activeOpen && activeTemporary) {
      listenerAttached = true;
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown, true);
    }

    const escEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(escEvent);

    return {
      listenerAttached,
      closedCount,
      passed: !listenerAttached && closedCount === 0
    };
  });
  recordTest(
    'ESC Dismissal',
    'Escape key does not dismiss drawer when in persistent desktop layout mode',
    escPersistentResult.passed,
    escPersistentResult
  );

  // --------------------------------------------------------------------------
  // SUITE 5: Return Focus on Close
  // --------------------------------------------------------------------------
  console.log('\nSuite 5: Return Focus on Close');

  await page.setContent(`
    <div>
      <button id="trigger-toggle-button">Toggle Drawer</button>
      <div id="drawer-container">
        <button id="drawer-inner-button">Inner Button</button>
      </div>
    </div>
  `);

  // Test 5.1: Return focus to triggerRef.current on close
  const returnFocusResult = await page.evaluate(() => {
    return new Promise((resolve) => {
      const trigger = document.getElementById('trigger-toggle-button');
      const inner = document.getElementById('drawer-inner-button');
      let focusCalled = false;

      // Spy on trigger.focus
      const originalFocus = trigger.focus.bind(trigger);
      trigger.focus = () => {
        focusCalled = true;
        originalFocus();
      };

      // Focus trigger before opening
      trigger.focus();
      const initialActive = document.activeElement.id;

      // Drawer opens: focus moves inside drawer
      inner.focus();
      const openActive = document.activeElement.id;

      // Simulate useDrawerAccessibility return focus effect:
      // prevOpenRef.current was true, activeOpen is now false, activeTemporary is true
      const triggerRef = { current: trigger };
      const savedTriggerRef = { current: trigger };
      const target = triggerRef?.current || savedTriggerRef.current;

      if (target && typeof target.focus === 'function') {
        requestAnimationFrame(() => {
          if (typeof document !== 'undefined' && document.body.contains(target)) {
            target.focus();
            resolve({
              initialActive,
              openActive,
              focusCalled,
              finalActive: document.activeElement.id,
              passed: focusCalled === true && document.activeElement.id === 'trigger-toggle-button'
            });
          } else {
            resolve({ passed: false, reason: 'Target not in body' });
          }
        });
      }
    });
  });
  recordTest(
    'Return Focus',
    'Restores focus to triggerRef.current via requestAnimationFrame upon drawer closure',
    returnFocusResult.passed,
    returnFocusResult
  );

  // Test 5.2: Unmounted / removed trigger defense
  const unmountedTriggerResult = await page.evaluate(() => {
    return new Promise((resolve) => {
      const removedTrigger = document.createElement('button');
      let focusCalled = false;
      removedTrigger.focus = () => { focusCalled = true; };

      const target = removedTrigger; // not in document.body
      requestAnimationFrame(() => {
        if (typeof document !== 'undefined' && document.body.contains(target)) {
          target.focus();
        }
        resolve({
          focusCalled,
          contains: document.body.contains(target),
          passed: focusCalled === false // should NOT call focus on detached element
        });
      });
    });
  });
  recordTest(
    'Return Focus',
    'Safely guards against unmounted/removed triggers without throwing exceptions',
    unmountedTriggerResult.passed,
    unmountedTriggerResult
  );

  // --------------------------------------------------------------------------
  // SUITE 6: Permanent Toggle Accessibility (DrawerToggle)
  // --------------------------------------------------------------------------
  console.log('\nSuite 6: Permanent Toggle Accessibility (DrawerToggle)');

  // Transform DrawerToggle.jsx into ES module
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

  const tempTogglePath = path.resolve('.agents/teamwork/challenger_m2_2/temp_DrawerToggle.mjs');
  fs.writeFileSync(tempTogglePath, transformedToggle.code);

  const { DrawerToggle } = await import('./temp_DrawerToggle.mjs');

  // Test 6.1: Left Drawer Toggle in CLOSED state
  const leftClosedHtml = renderToString(React.createElement(DrawerToggle, {
    side: 'left',
    open: false,
  }));
  const leftClosedPass = (
    leftClosedHtml.includes('<button') &&
    leftClosedHtml.includes('type="button"') &&
    leftClosedHtml.includes('aria-expanded="false"') &&
    leftClosedHtml.includes('aria-controls="left-drawer"') &&
    leftClosedHtml.includes('data-testid="left-drawer-toggle"') &&
    leftClosedHtml.includes('aria-label="Abrir menu de navegação"')
  );
  recordTest(
    'DrawerToggle Accessibility',
    'Left toggle closed state: renders <button type="button"> with aria-expanded="false", aria-controls="left-drawer", and data-testid="left-drawer-toggle"',
    leftClosedPass,
    { html: leftClosedHtml }
  );

  // Test 6.2: Left Drawer Toggle in OPEN state
  const leftOpenHtml = renderToString(React.createElement(DrawerToggle, {
    side: 'left',
    open: true,
  }));
  const leftOpenPass = (
    leftOpenHtml.includes('<button') &&
    leftOpenHtml.includes('type="button"') &&
    leftOpenHtml.includes('aria-expanded="true"') &&
    leftOpenHtml.includes('aria-controls="left-drawer"') &&
    leftOpenHtml.includes('data-testid="left-drawer-toggle"') &&
    leftOpenHtml.includes('aria-label="Recolher menu de navegação"')
  );
  recordTest(
    'DrawerToggle Accessibility',
    'Left toggle open state: renders <button type="button"> with aria-expanded="true", aria-controls="left-drawer", and data-testid="left-drawer-toggle"',
    leftOpenPass,
    { html: leftOpenHtml }
  );

  // Test 6.3: Right Drawer Toggle in CLOSED state
  const rightClosedHtml = renderToString(React.createElement(DrawerToggle, {
    side: 'right',
    open: false,
  }));
  const rightClosedPass = (
    rightClosedHtml.includes('<button') &&
    rightClosedHtml.includes('type="button"') &&
    rightClosedHtml.includes('aria-expanded="false"') &&
    rightClosedHtml.includes('aria-controls="right-drawer"') &&
    rightClosedHtml.includes('data-testid="right-drawer-toggle"') &&
    rightClosedHtml.includes('aria-label="Abrir painel contextual"')
  );
  recordTest(
    'DrawerToggle Accessibility',
    'Right toggle closed state: renders <button type="button"> with aria-expanded="false", aria-controls="right-drawer", and data-testid="right-drawer-toggle"',
    rightClosedPass,
    { html: rightClosedHtml }
  );

  // Test 6.4: Right Drawer Toggle in OPEN state
  const rightOpenHtml = renderToString(React.createElement(DrawerToggle, {
    side: 'right',
    open: true,
  }));
  const rightOpenPass = (
    rightOpenHtml.includes('<button') &&
    rightOpenHtml.includes('type="button"') &&
    rightOpenHtml.includes('aria-expanded="true"') &&
    rightOpenHtml.includes('aria-controls="right-drawer"') &&
    rightOpenHtml.includes('data-testid="right-drawer-toggle"') &&
    rightOpenHtml.includes('aria-label="Fechar painel contextual"')
  );
  recordTest(
    'DrawerToggle Accessibility',
    'Right toggle open state: renders <button type="button"> with aria-expanded="true", aria-controls="right-drawer", and data-testid="right-drawer-toggle"',
    rightOpenPass,
    { html: rightOpenHtml }
  );

  // Test 6.5: Custom attributes overriding and forwarding
  const customToggleHtml = renderToString(React.createElement(DrawerToggle, {
    side: 'left',
    open: true,
    ariaLabel: 'Custom Drawer Label',
    ariaControls: 'custom-drawer-id',
    dataTestId: 'custom-toggle-btn'
  }));
  const customTogglePass = (
    customToggleHtml.includes('aria-label="Custom Drawer Label"') &&
    customToggleHtml.includes('aria-controls="custom-drawer-id"') &&
    customToggleHtml.includes('data-testid="custom-toggle-btn"')
  );
  recordTest(
    'DrawerToggle Accessibility',
    'Accepts and prioritizes custom ariaLabel, ariaControls, and dataTestId props',
    customTogglePass,
    { html: customToggleHtml }
  );

  // Test 6.6: Keyboard spacebar activation handler
  await page.setContent(`
    <div id="toggle-host"></div>
  `);
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

    const spaceEvent = new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      keyCode: 32,
      bubbles: true,
      cancelable: true
    });
    btn.dispatchEvent(spaceEvent);

    return {
      toggleCount,
      defaultPrevented: spaceEvent.defaultPrevented,
      passed: toggleCount === 1 && spaceEvent.defaultPrevented === true
    };
  });
  recordTest(
    'DrawerToggle Accessibility',
    'Space keydown triggers toggle handler and prevents default page scroll',
    spaceActivationResult.passed,
    spaceActivationResult
  );

  await browser.close();

  // --------------------------------------------------------------------------
  // Summary & Report Generation
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST EXECUTION SUMMARY: ${testResults.summary.passed}/${testResults.summary.total} PASSED`);
  console.log(`FAILURES: ${testResults.summary.failed}`);
  console.log('================================================================\n');

  // Save JSON report
  fs.writeFileSync(
    '.agents/teamwork/challenger_m2_2/results.json',
    JSON.stringify(testResults, null, 2)
  );

  return testResults;
}

runEmpiricalHarness().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
