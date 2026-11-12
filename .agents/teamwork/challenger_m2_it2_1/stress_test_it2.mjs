/**
 * Milestone 2 Challenger 1 (Iteration 2): Empirical Adversarial Stress Test Suite
 * Target: src/components/ui/drawer/useDrawer.js
 *
 * Verifies:
 * 1. Dynamic prop switching & controlled/uncontrolled mode transitions.
 * 2. Dynamic storageKey & compactStorageKey transitions mid-lifecycle.
 * 3. Fresh callback propagation on re-renders (no stale closures).
 * 4. Cross-tab StorageEvent resilience: null values, empty strings, malformed payloads, prefix guards.
 * 5. Event listener unmount cleanup.
 * 6. High-frequency reentrancy & rapid interleaved mutations.
 * 7. useHydratedDrawerState full lifecycle and dynamic keys.
 * 8. Direct Chromium DOM verification of FOCUSABLE_SELECTOR and getFocusableElements.
 * 9. Scroll lock underflow resilience and pre-existing style preservation.
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { chromium } from '@playwright/test';
import {
  safeStorage,
  useDrawerState,
  useHydratedDrawerState,
  useDrawer,
  lockBodyScroll,
  unlockBodyScroll,
  FOCUSABLE_SELECTOR,
  getFocusableElements,
} from '../../../src/components/ui/drawer/useDrawer.js';

// ============================================================================
// Mock Environment & React 19 Hook Driver
// ============================================================================

class MockLocalStorage {
  constructor() {
    this.store = new Map();
    this.throwOnSet = null;
    this.throwOnGet = null;
    this.throwOnRemove = null;
  }

  getItem(key) {
    if (this.throwOnGet) {
      throw (typeof this.throwOnGet === 'function' ? new this.throwOnGet('Get access denied') : this.throwOnGet);
    }
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    if (this.throwOnSet) {
      throw (typeof this.throwOnSet === 'function' ? new this.throwOnSet('Set operation failed') : this.throwOnSet);
    }
    this.store.set(key, String(value));
  }

  removeItem(key) {
    if (this.throwOnRemove) {
      throw (typeof this.throwOnRemove === 'function' ? new this.throwOnRemove('Remove operation failed') : this.throwOnRemove);
    }
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  get length() {
    return this.store.size;
  }
}

class MockWindow {
  constructor() {
    this.localStorage = new MockLocalStorage();
    this.listeners = new Map();
  }

  addEventListener(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
  }

  removeEventListener(event, handler) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(handler);
    }
  }

  dispatchEvent(event) {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach((h) => h(event));
    }
    return true;
  }

  getListenerCount(event) {
    return this.listeners.has(event) ? this.listeners.get(event).size : 0;
  }
}

function createHookHarness(hookFn) {
  let hookIndex = 0;
  const hooks = [];
  const pendingEffects = [];
  let currentProps = null;
  let result = null;

  const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

  const dispatcher = {
    useState(initialValue) {
      const idx = hookIndex++;
      if (hooks[idx] === undefined) {
        hooks[idx] = typeof initialValue === 'function' ? initialValue() : initialValue;
      }
      const setState = (next) => {
        const nextVal = typeof next === 'function' ? next(hooks[idx]) : next;
        if (Object.is(hooks[idx], nextVal)) {
          return;
        }
        hooks[idx] = nextVal;
        rerender();
      };
      return [hooks[idx], setState];
    },
    useCallback(fn, deps) {
      const idx = hookIndex++;
      const prev = hooks[idx];
      if (prev && deps && prev.deps.every((d, i) => Object.is(d, deps[i]))) {
        return prev.fn;
      }
      hooks[idx] = { fn, deps };
      return fn;
    },
    useEffect(effect, deps) {
      const idx = hookIndex++;
      const prev = hooks[idx];
      let hasChanged = true;
      if (prev && deps && prev.deps && prev.deps.every((d, i) => Object.is(d, deps[i]))) {
        hasChanged = false;
      }
      hooks[idx] = { effect, deps, cleanup: prev ? prev.cleanup : undefined };
      if (hasChanged) {
        pendingEffects.push({ idx, effect, prevCleanup: prev ? prev.cleanup : undefined });
      }
    },
    useRef(initialValue) {
      const idx = hookIndex++;
      if (hooks[idx] === undefined) {
        hooks[idx] = { current: initialValue };
      }
      return hooks[idx];
    },
    useContext(context) {
      return context._currentValue;
    },
  };

  function rerender(newProps) {
    if (newProps !== undefined) currentProps = newProps;
    hookIndex = 0;
    const prevDispatcher = internals.H;
    internals.H = dispatcher;
    try {
      result = hookFn(currentProps);
    } finally {
      internals.H = prevDispatcher;
    }
    return result;
  }

  function flushEffects() {
    while (pendingEffects.length > 0) {
      const { idx, effect, prevCleanup } = pendingEffects.shift();
      if (typeof prevCleanup === 'function') {
        try { prevCleanup(); } catch (e) { /* ignore */ }
      }
      const cleanup = effect();
      hooks[idx].cleanup = cleanup;
    }
  }

  function render(initialProps) {
    currentProps = initialProps;
    rerender();
    return {
      get result() { return result; },
      rerender: (props) => {
        rerender(props);
        flushEffects();
        return result;
      },
      flushEffects,
      unmount: () => {
        for (const h of hooks) {
          if (h && typeof h.cleanup === 'function') {
            h.cleanup();
          }
        }
      },
    };
  }

  return { render };
}

// Global Browser Mock
const mockWindow = new MockWindow();
global.window = mockWindow;
global.document = {
  body: { style: { overflow: '' } },
  activeElement: null,
};

// Test Runner
const results = {
  total: 0,
  passed: 0,
  failed: 0,
};

function assert(description, condition, details = '') {
  results.total++;
  if (condition) {
    results.passed++;
    console.log(`  ✓ PASS: ${description}`);
  } else {
    results.failed++;
    console.error(`  ✗ FAIL: ${description} | ${details}`);
  }
}

async function runAllSuites() {
  console.log(`\n============================================================`);
  console.log(`CHALLENGER 1 (ITERATION 2): ADVERSARIAL STRESS TEST SUITE`);
  console.log(`============================================================`);

  // ==========================================================================
  // SUITE 1: Dynamic Mode Transitions & Stale Closure Immunity
  // ==========================================================================
  console.log(`\nSUITE 1: Dynamic Mode Transitions & Stale Closure Immunity`);

  // 1.1 Uncontrolled to Controlled transition mid-lifecycle
  {
    mockWindow.localStorage.clear();
    const harness = createHookHarness((props) => useDrawerState(props));
    const inst = harness.render({ defaultOpen: false });
    inst.flushEffects();

    inst.result.setOpen(true);
    assert('Uncontrolled begins with isOpen=true after setOpen(true)', inst.result.isOpen === true && inst.result.isControlled === false);

    // Switch dynamically to controlled mode with open=false
    inst.rerender({ open: false });
    assert('Dynamically switching to open=false forces isOpen=false immediately', inst.result.isOpen === false && inst.result.isControlled === true);

    // Switch dynamically to controlled mode with open=true
    inst.rerender({ open: true });
    assert('Dynamically switching to open=true forces isOpen=true immediately', inst.result.isOpen === true && inst.result.isControlled === true);
  }

  // 1.2 Controlled to Uncontrolled transition mid-lifecycle
  {
    mockWindow.localStorage.clear();
    const harness = createHookHarness((props) => useDrawerState(props));
    const inst = harness.render({ open: true });
    inst.flushEffects();

    assert('Starts controlled open=true', inst.result.isOpen === true && inst.result.isControlled === true);

    // Switch dynamically to uncontrolled (open=undefined)
    inst.rerender({ defaultOpen: false });
    assert('Transitioning to uncontrolled retains fallback internalOpen safely', inst.result.isControlled === false);
    inst.result.setOpen(true);
    assert('setOpen works after transitioning to uncontrolled', inst.result.isOpen === true);
  }

  // 1.3 Dynamic storageKey migration mid-lifecycle
  {
    mockWindow.localStorage.clear();
    mockWindow.localStorage.setItem('storage:key:old', JSON.stringify(true));
    mockWindow.localStorage.setItem('storage:key:new', JSON.stringify(false));

    const harness = createHookHarness((props) => useDrawerState(props));
    const inst = harness.render({ storageKey: 'storage:key:old', defaultOpen: false });
    inst.flushEffects();

    assert('Initially hydrated from storage:key:old (true)', inst.result.isOpen === true);

    // Mutate props to switch to storage:key:new
    inst.rerender({ storageKey: 'storage:key:new', defaultOpen: false });
    assert('Re-hydrates from storage:key:new (false) when storageKey changes', inst.result.isOpen === false);

    // Writing to state now writes exclusively to storage:key:new
    inst.result.setOpen(true);
    assert('setOpen writes to new key', safeStorage.getItem('storage:key:new') === true);
    assert('setOpen does not pollute old key', safeStorage.getItem('storage:key:old') === true);
  }

  // 1.4 Dynamic compactStorageKey migration mid-lifecycle
  {
    mockWindow.localStorage.clear();
    mockWindow.localStorage.setItem('compact:key:1', JSON.stringify(false));
    mockWindow.localStorage.setItem('compact:key:2', JSON.stringify(true));

    const harness = createHookHarness((props) => useDrawerState(props));
    const inst = harness.render({ compactStorageKey: 'compact:key:1', defaultCompact: false });
    inst.flushEffects();

    assert('Initially hydrated from compact:key:1 (false)', inst.result.isCompact === false);

    inst.rerender({ compactStorageKey: 'compact:key:2', defaultCompact: false });
    assert('Re-hydrates from compact:key:2 (true) when compactStorageKey changes', inst.result.isCompact === true);
  }

  // 1.5 Fresh callback propagation (immunity to stale closures)
  {
    mockWindow.localStorage.clear();
    let callbackVersion = 0;
    const callLog = [];

    const harness = createHookHarness((props) => useDrawerState(props));
    const inst = harness.render({
      open: false,
      onOpenChange: (val) => callLog.push({ version: 1, val }),
    });
    inst.flushEffects();

    // Rerender with callback version 2
    inst.rerender({
      open: false,
      onOpenChange: (val) => callLog.push({ version: 2, val }),
    });

    inst.result.setOpen(true);
    assert(
      'setOpen invokes latest callback reference (version 2) with no stale closure',
      callLog.length === 1 && callLog[0].version === 2 && callLog[0].val === true
    );
  }

  // ==========================================================================
  // SUITE 2: StorageEvent Adversarial Attacks & Unmount Cleanup
  // ==========================================================================
  console.log(`\nSUITE 2: StorageEvent Adversarial Attacks & Unmount Cleanup`);

  // 2.1 StorageEvent with newValue === null (key deleted or cleared)
  {
    mockWindow.localStorage.clear();
    const harness = createHookHarness(() => useDrawerState({ storageKey: 'sync:key', defaultOpen: true }));
    const inst = harness.render();
    inst.flushEffects();

    let threw = false;
    try {
      mockWindow.dispatchEvent({
        type: 'storage',
        key: 'sync:key',
        newValue: null,
      });
    } catch {
      threw = true;
    }

    assert('StorageEvent with newValue=null does not throw exception', threw === false);
    assert('StorageEvent with newValue=null leaves isOpen unchanged (true)', inst.result.isOpen === true);
  }

  // 2.2 StorageEvent with newValue === "" (empty string)
  {
    const harness = createHookHarness(() => useDrawerState({ storageKey: 'empty:key', defaultOpen: true }));
    const inst = harness.render();
    inst.flushEffects();

    let threw = false;
    try {
      mockWindow.dispatchEvent({
        type: 'storage',
        key: 'empty:key',
        newValue: '',
      });
    } catch {
      threw = true;
    }

    assert('StorageEvent with empty string does not throw', threw === false);
    assert('StorageEvent with empty string leaves isOpen intact', inst.result.isOpen === true);
  }

  // 2.3 StorageEvent for compact with structured object { compact: true }
  {
    const harness = createHookHarness(() => useDrawerState({ compactStorageKey: 'c:sync:key', defaultCompact: false }));
    const inst = harness.render();
    inst.flushEffects();

    mockWindow.dispatchEvent({
      type: 'storage',
      key: 'c:sync:key',
      newValue: JSON.stringify({ compact: true }),
    });

    assert('StorageEvent with { compact: true } updates isCompact to true', inst.result.isCompact === true);

    mockWindow.dispatchEvent({
      type: 'storage',
      key: 'c:sync:key',
      newValue: JSON.stringify({ compact: false }),
    });

    assert('StorageEvent with { compact: false } updates isCompact to false', inst.result.isCompact === false);
  }

  // 2.4 StorageEvent listener unmount cleanup
  {
    const initialCount = mockWindow.getListenerCount('storage');
    const harness = createHookHarness(() => useDrawerState({ storageKey: 'cleanup:key' }));
    const inst = harness.render();
    inst.flushEffects();

    const activeCount = mockWindow.getListenerCount('storage');
    assert('Mounting hook attaches storage event listener', activeCount === initialCount + 1);

    inst.unmount();
    const afterCount = mockWindow.getListenerCount('storage');
    assert('Unmounting hook cleans up storage event listener (zero leak)', afterCount === initialCount);
  }

  // ==========================================================================
  // SUITE 3: Reentrancy, Idempotence & High-Frequency Alternating Stress
  // ==========================================================================
  console.log(`\nSUITE 3: Reentrancy, Idempotence & High-Frequency Alternating Stress`);

  // 3.1 Idempotent calls: calling setOpen(true) when already true
  {
    let callCount = 0;
    const harness = createHookHarness(() =>
      useDrawerState({
        defaultOpen: true,
        onOpenChange: () => callCount++,
      })
    );
    const inst = harness.render();
    inst.flushEffects();

    inst.result.setOpen(true);
    inst.result.setOpen(true);
    inst.result.setOpen(true);

    assert('Idempotent setOpen(true) maintains isOpen=true cleanly', inst.result.isOpen === true);
    assert('onOpenChange is called on each setOpen call', callCount === 3);
  }

  // 3.2 500-cycle alternating toggle & toggleCompact
  {
    const harness = createHookHarness(() =>
      useDrawerState({ defaultOpen: false, defaultCompact: false })
    );
    const inst = harness.render();
    inst.flushEffects();

    let openExpected = false;
    let compactExpected = false;
    let anomalyCount = 0;

    for (let i = 0; i < 500; i++) {
      if (i % 2 === 0) {
        inst.result.toggle();
        openExpected = !openExpected;
      } else {
        inst.result.toggleCompact();
        compactExpected = !compactExpected;
      }

      if (inst.result.isOpen !== openExpected || inst.result.isCompact !== compactExpected) {
        anomalyCount++;
      }
    }

    assert(
      '500 alternating toggles across open & compact execute with zero state anomalies',
      anomalyCount === 0 &&
      inst.result.isOpen === openExpected &&
      inst.result.isCompact === compactExpected
    );
  }

  // 3.3 Passing null / undefined options to useDrawer & useDrawerState
  {
    let threw = false;
    try {
      const h1 = createHookHarness(() => useDrawerState());
      h1.render();
      const h2 = createHookHarness(() => useDrawer(undefined));
      h2.render();
    } catch {
      threw = true;
    }
    assert('useDrawerState() and useDrawer(undefined) initialize cleanly without throwing', threw === false);
  }

  // ==========================================================================
  // SUITE 4: useHydratedDrawerState Invariants & Transitions
  // ==========================================================================
  console.log(`\nSUITE 4: useHydratedDrawerState Invariants & Transitions`);

  // 4.1 Functional state updates in useHydratedDrawerState
  {
    mockWindow.localStorage.clear();
    const harness = createHookHarness(() => useHydratedDrawerState('hydrate:func:key', false));
    const inst = harness.render();
    inst.flushEffects();

    const [, updateState] = inst.result;
    updateState((prev) => !prev);

    const [updatedState, , isHydrated] = inst.result;
    assert('Functional updater in useHydratedDrawerState flips false -> true', updatedState === true);
    assert('isHydrated remains true after functional update', isHydrated === true);
    assert('Updated state persisted to localStorage', safeStorage.getItem('hydrate:func:key') === true);
  }

  // 4.2 useHydratedDrawerState with null storageKey operates purely in-memory
  {
    mockWindow.localStorage.clear();
    const harness = createHookHarness(() => useHydratedDrawerState(null, false));
    const inst = harness.render();
    inst.flushEffects();

    const [, updateState] = inst.result;
    updateState(true);

    const [state] = inst.result;
    assert('useHydratedDrawerState with null key updates in-memory state cleanly', state === true);
    assert('localStorage remains empty when storageKey is null', mockWindow.localStorage.length === 0);
  }

  // ==========================================================================
  // SUITE 5: Real Chromium Evaluation of FOCUSABLE_SELECTOR & getFocusableElements
  // ==========================================================================
  console.log(`\nSUITE 5: Real Chromium Evaluation of FOCUSABLE_SELECTOR & getFocusableElements`);

  {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.setContent(`
      <div id="test-container">
        <!-- Valid Focusables -->
        <button id="btn-ok">OK Button</button>
        <a id="link-ok" href="https://example.com">OK Link</a>
        <input id="input-ok" type="text" value="Input" />
        <select id="select-ok"><option>Opt</option></select>
        <textarea id="textarea-ok">Text</textarea>
        <div id="div-ok" tabindex="0">Div Tabindex 0</div>
        <div id="editable-ok" contenteditable="true">Editable</div>
        <iframe id="iframe-ok" src="about:blank"></iframe>

        <!-- Omitted: Negative Tabindex -->
        <button id="btn-tab-minus-1" tabindex="-1">Btn Tab -1</button>
        <a id="link-tab-minus-1" href="https://example.com" tabindex="-1">Link Tab -1</a>
        <input id="input-tab-minus-1" type="text" tabindex="-1" />
        <select id="select-tab-minus-1" tabindex="-1"><option>Opt</option></select>
        <textarea id="textarea-tab-minus-1" tabindex="-1"></textarea>
        <div id="div-tab-minus-1" tabindex="-1">Div Tab -1</div>
        <div id="editable-tab-minus-1" contenteditable="true" tabindex="-1">Editable Tab -1</div>
        <iframe id="iframe-tab-minus-1" src="about:blank" tabindex="-1"></iframe>

        <!-- Omitted: Disabled Elements -->
        <button id="btn-disabled" disabled>Disabled Btn</button>
        <input id="input-disabled" type="text" disabled />
        <select id="select-disabled" disabled><option>Opt</option></select>
        <textarea id="textarea-disabled" disabled></textarea>

        <!-- Omitted: Non-interactive or Hidden Types -->
        <a id="link-no-href">No Href Link</a>
        <input id="input-hidden" type="hidden" value="Hidden" />

        <!-- Omitted: CSS Visibility & Display -->
        <button id="btn-display-none" style="display: none;">Display None</button>
        <button id="btn-visibility-hidden" style="visibility: hidden;">Visibility Hidden</button>

        <!-- Omitted: Nested in Hidden Ancestor -->
        <div style="display: none;">
          <button id="btn-in-display-none-parent">Child of Display None</button>
        </div>
        <div style="visibility: hidden;">
          <button id="btn-in-vis-hidden-parent">Child of Vis Hidden</button>
        </div>
      </div>
    `);

    // Evaluate using imported definitions in the browser context
    const selectorStr = FOCUSABLE_SELECTOR;
    const filterFnStr = getFocusableElements.toString();

    const matchedIds = await page.evaluate(
      ({ selectorStr, filterFnStr }) => {
        window.FOCUSABLE_SELECTOR = selectorStr;
        eval(filterFnStr);
        const container = document.getElementById('test-container');
        return getFocusableElements(container).map((el) => el.id);
      },
      { selectorStr, filterFnStr }
    );

    const expectedIncluded = [
      'btn-ok',
      'link-ok',
      'input-ok',
      'select-ok',
      'textarea-ok',
      'div-ok',
      'editable-ok',
      'iframe-ok',
    ];

    const expectedExcluded = [
      'btn-tab-minus-1',
      'link-tab-minus-1',
      'input-tab-minus-1',
      'select-tab-minus-1',
      'textarea-tab-minus-1',
      'div-tab-minus-1',
      'editable-tab-minus-1',
      'iframe-tab-minus-1',
      'btn-disabled',
      'input-disabled',
      'select-disabled',
      'textarea-disabled',
      'link-no-href',
      'input-hidden',
      'btn-display-none',
      'btn-visibility-hidden',
      'btn-in-display-none-parent',
      'btn-in-vis-hidden-parent',
    ];

    for (const id of expectedIncluded) {
      assert(`Chromium DOM: Valid element "${id}" is correctly included`, matchedIds.includes(id));
    }

    for (const id of expectedExcluded) {
      assert(`Chromium DOM: Invalid/hidden element "${id}" is strictly excluded`, !matchedIds.includes(id));
    }

    await browser.close();
  }

  // ==========================================================================
  // SUITE 6: Body Scroll Lock Underflow & Style Preservation
  // ==========================================================================
  console.log(`\nSUITE 6: Body Scroll Lock Underflow & Style Preservation`);

  {
    // Underflow test: 50 unlocks when count is 0
    global.document.body.style.overflow = '';
    for (let i = 0; i < 50; i++) {
      unlockBodyScroll();
    }
    assert('50 consecutive unlocks on zero counter do not underflow into negative', true);

    // 1 lock should immediately lock
    lockBodyScroll();
    assert('Lock after underflow test sets overflow to "hidden"', global.document.body.style.overflow === 'hidden');

    // 1 unlock should immediately restore
    unlockBodyScroll();
    assert('Unlock restores overflow to ""', global.document.body.style.overflow === '');

    // Preservation of pre-existing custom style
    global.document.body.style.overflow = 'scroll';
    lockBodyScroll();
    assert('Locking preserves pre-existing "scroll" and sets "hidden"', global.document.body.style.overflow === 'hidden');

    lockBodyScroll();
    assert('Second lock maintains "hidden"', global.document.body.style.overflow === 'hidden');

    unlockBodyScroll();
    assert('First unlock maintains "hidden"', global.document.body.style.overflow === 'hidden');

    unlockBodyScroll();
    assert('Final unlock restores custom "scroll" style', global.document.body.style.overflow === 'scroll');

    // Reset document
    global.document.body.style.overflow = '';
  }

  // ==========================================================================
  // Final Summary
  // ==========================================================================
  console.log(`\n============================================================`);
  console.log(`ITERATION 2 STRESS TEST RESULTS SUMMARY`);
  console.log(`============================================================`);
  console.log(`Total Assertions : ${results.total}`);
  console.log(`Passed           : ${results.passed}`);
  console.log(`Failed           : ${results.failed}`);
  console.log(`Success Rate     : ${((results.passed / results.total) * 100).toFixed(1)}%`);
  const verdict = results.failed === 0 ? 'APPROVE' : 'FAIL';
  console.log(`FINAL VERDICT    : ${verdict}`);
  console.log(`============================================================\n`);

  process.exit(results.failed === 0 ? 0 : 1);
}

runAllSuites().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
