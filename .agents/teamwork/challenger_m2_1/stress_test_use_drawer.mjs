/**
 * Milestone 2 Challenger 1: Empirical Stress Harness for useDrawer.js
 * 
 * Tests:
 * 1. Controlled mode: sync with external `open`, `onOpenChange` invocations.
 * 2. Uncontrolled mode: `defaultOpen`, `setOpen`, `toggle`, convenience methods.
 * 3. Independent storage keys: `dashboard:drawer:left` vs `dashboard:drawer:right`, all 4 permutations.
 * 4. Private browsing fallback: SecurityError, QuotaExceededError, safeStorage resilience.
 * 5. Two-phase hydration: SSR / mount determinism.
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  safeStorage,
  useDrawerState,
  useHydratedDrawerState,
  lockBodyScroll,
  unlockBodyScroll,
} from '../../../src/components/ui/drawer/useDrawer.js';

// ============================================================================
// Mock Environment & Harness Infrastructure
// ============================================================================

class MockLocalStorage {
  constructor() {
    this.store = new Map();
    this.throwOnSet = null; // Error instance or class to throw
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
}

/**
 * Lightweight Hook Test Harness that drives React 19 hooks with fine-grained
 * control over phase 1 (pre-effects render) and phase 2 (flushing effects).
 */
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
          return; // React 19 bailout invariant
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

// ============================================================================
// Test Suite Framework & Results Collector
// ============================================================================

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  suites: [],
};

function suite(name, fn) {
  const currentSuite = { name, assertions: [] };
  results.suites.push(currentSuite);
  console.log(`\n============================================================`);
  console.log(`SUITE: ${name}`);
  console.log(`============================================================`);

  function assert(description, condition, details = '') {
    results.total++;
    if (condition) {
      results.passed++;
      currentSuite.assertions.push({ description, pass: true });
      console.log(`  ✓ PASS: ${description}`);
    } else {
      results.failed++;
      currentSuite.assertions.push({ description, pass: false, details });
      console.error(`  ✗ FAIL: ${description} | ${details}`);
    }
  }

  fn(assert);
}

// Setup Global Browser Mock
const mockWindow = new MockWindow();
global.window = mockWindow;
global.document = {
  body: { style: { overflow: '' } },
  activeElement: null,
};

// ============================================================================
// SUITE 1: Controlled Mode Stress Test
// ============================================================================

suite('1. Controlled Mode: Synchronization & Callbacks', (assert) => {
  mockWindow.localStorage.clear();

  // Test 1.1: Controlled open={false} overrides defaultOpen={true}
  {
    const harness = createHookHarness((props) => useDrawerState(props));
    const inst = harness.render({ open: false, defaultOpen: true });
    assert(
      'Controlled open=false overrides defaultOpen=true',
      inst.result.open === false && inst.result.isOpen === false && inst.result.isControlled === true
    );
  }

  // Test 1.2: Controlled open={true} overrides defaultOpen={false}
  {
    const harness = createHookHarness((props) => useDrawerState(props));
    const inst = harness.render({ open: true, defaultOpen: false });
    assert(
      'Controlled open=true overrides defaultOpen=false',
      inst.result.open === true && inst.result.isOpen === true && inst.result.isControlled === true
    );
  }

  // Test 1.3: External prop updates strictly synchronize isOpen
  {
    const harness = createHookHarness((props) => useDrawerState(props));
    const inst = harness.render({ open: false });
    assert('Initial controlled open=false', inst.result.isOpen === false);

    inst.rerender({ open: true });
    assert('Prop update to open=true updates isOpen immediately', inst.result.isOpen === true);

    inst.rerender({ open: false });
    assert('Prop update to open=false updates isOpen immediately', inst.result.isOpen === false);
  }

  // Test 1.4: Calling setOpen(true) in controlled mode fires onOpenChange
  {
    let callbackArg = null;
    let callCount = 0;
    const onOpenChange = (val) => {
      callCount++;
      callbackArg = val;
    };

    const harness = createHookHarness((props) => useDrawerState(props));
    const inst = harness.render({ open: false, onOpenChange });
    inst.flushEffects();

    inst.result.setOpen(true);
    assert(
      'setOpen(true) fires onOpenChange with true in controlled mode',
      callCount === 1 && callbackArg === true
    );
    // In controlled mode, internal isOpen must NOT independently toggle without prop change
    assert('isOpen stays false until controlled prop updates', inst.result.isOpen === false);
  }

  // Test 1.5: Functional setOpen(prev => !prev) in controlled mode
  {
    let receivedPrev = null;
    let callbackArg = null;
    const onOpenChange = (val) => {
      callbackArg = val;
    };

    const harness = createHookHarness((props) => useDrawerState(props));
    const inst = harness.render({ open: true, onOpenChange });
    inst.flushEffects();

    inst.result.setOpen((prev) => {
      receivedPrev = prev;
      return !prev;
    });

    assert(
      'Functional updater receives controlled current state as prev argument',
      receivedPrev === true
    );
    assert(
      'Functional updater passes computed value to onOpenChange',
      callbackArg === false
    );
  }

  // Test 1.6: toggle() in controlled mode fires onOpenChange
  {
    let toggledVal = null;
    const harness = createHookHarness((props) => useDrawerState(props));
    const inst = harness.render({ open: false, onOpenChange: (val) => (toggledVal = val) });
    inst.flushEffects();

    inst.result.toggle();
    assert('toggle() with open=false fires onOpenChange(true)', toggledVal === true);

    inst.rerender({ open: true, onOpenChange: (val) => (toggledVal = val) });
    inst.result.toggle();
    assert('toggle() with open=true fires onOpenChange(false)', toggledVal === false);
  }

  // Test 1.7: Controlled mode never writes to localStorage
  {
    mockWindow.localStorage.clear();
    const harness = createHookHarness((props) => useDrawerState(props));
    const inst = harness.render({
      open: false,
      storageKey: 'controlled:test:key',
      onOpenChange: () => {},
    });
    inst.flushEffects();

    inst.result.setOpen(true);
    assert(
      'Controlled mode does not write to localStorage on setOpen',
      mockWindow.localStorage.getItem('controlled:test:key') === null
    );
  }

  // Test 1.8: Pre-existing localStorage value is ignored in controlled mode
  {
    mockWindow.localStorage.setItem('controlled:existing:key', JSON.stringify(true));
    const harness = createHookHarness((props) => useDrawerState(props));
    const inst = harness.render({
      open: false,
      storageKey: 'controlled:existing:key',
    });
    inst.flushEffects(); // Hydration phase

    assert(
      'Pre-existing localStorage is ignored in controlled mode after hydration',
      inst.result.isOpen === false
    );
  }

  // Test 1.9: Compact controlled mode
  {
    let compactVal = null;
    const harness = createHookHarness((props) => useDrawerState(props));
    const inst = harness.render({
      compact: false,
      onCompactChange: (c) => (compactVal = c),
    });
    inst.flushEffects();

    assert('isControlledCompact is true', inst.result.isControlledCompact === true);
    assert('compact is false', inst.result.compact === false && inst.result.isCompact === false);

    inst.result.setCompact(true);
    assert('setCompact(true) fires onCompactChange', compactVal === true);
    assert('isCompact remains false until prop updates', inst.result.isCompact === false);

    inst.rerender({ compact: true, onCompactChange: (c) => (compactVal = c) });
    assert('isCompact updates when compact prop updates to true', inst.result.isCompact === true);
  }
});

// ============================================================================
// SUITE 2: Uncontrolled Mode Stress Test
// ============================================================================

suite('2. Uncontrolled Mode: State Transitions & Convenience Methods', (assert) => {
  mockWindow.localStorage.clear();

  // Test 2.1: Default options
  {
    const harness = createHookHarness(() => useDrawerState());
    const inst = harness.render();
    assert(
      'Default options initialize with open=false, compact=false, isControlled=false',
      inst.result.open === false &&
      inst.result.isOpen === false &&
      inst.result.compact === false &&
      inst.result.isCompact === false &&
      inst.result.isControlled === false &&
      inst.result.isControlledCompact === false
    );
  }

  // Test 2.2: defaultOpen initialization
  {
    const harness1 = createHookHarness(() => useDrawerState({ defaultOpen: true }));
    const inst1 = harness1.render();
    assert('defaultOpen=true sets isOpen=true', inst1.result.isOpen === true);

    const harness2 = createHookHarness(() => useDrawerState({ defaultOpen: false }));
    const inst2 = harness2.render();
    assert('defaultOpen=false sets isOpen=false', inst2.result.isOpen === false);
  }

  // Test 2.3: setOpen direct boolean mutations
  {
    let lastReported = null;
    const harness = createHookHarness(() =>
      useDrawerState({ onOpenChange: (val) => (lastReported = val) })
    );
    const inst = harness.render();
    inst.flushEffects();

    inst.result.setOpen(true);
    assert(
      'setOpen(true) updates isOpen to true and fires onOpenChange',
      inst.result.isOpen === true && lastReported === true
    );

    inst.result.setOpen(false);
    assert(
      'setOpen(false) updates isOpen to false and fires onOpenChange',
      inst.result.isOpen === false && lastReported === false
    );
  }

  // Test 2.4: Functional setOpen updater
  {
    const harness = createHookHarness(() => useDrawerState({ defaultOpen: false }));
    const inst = harness.render();
    inst.flushEffects();

    inst.result.setOpen((prev) => !prev);
    assert('Functional updater flips false -> true', inst.result.isOpen === true);

    inst.result.setOpen((prev) => !prev);
    assert('Functional updater flips true -> false', inst.result.isOpen === false);
  }

  // Test 2.5: Convenience methods openDrawer, closeDrawer, close
  {
    const harness = createHookHarness(() => useDrawerState({ defaultOpen: false }));
    const inst = harness.render();
    inst.flushEffects();

    inst.result.openDrawer();
    assert('openDrawer() sets isOpen to true', inst.result.isOpen === true);

    inst.result.closeDrawer();
    assert('closeDrawer() sets isOpen to false', inst.result.isOpen === false);

    inst.result.openDrawer();
    inst.result.close();
    assert('close() sets isOpen to false', inst.result.isOpen === false);
  }

  // Test 2.6: Convenience toggle()
  {
    const harness = createHookHarness(() => useDrawerState({ defaultOpen: false }));
    const inst = harness.render();
    inst.flushEffects();

    inst.result.toggle();
    assert('toggle() flips false -> true', inst.result.isOpen === true);

    inst.result.toggle();
    assert('toggle() flips true -> false', inst.result.isOpen === false);
  }

  // Test 2.7: Compact mode convenience toggleCompact & setCompact
  {
    const harness = createHookHarness(() => useDrawerState({ defaultCompact: false }));
    const inst = harness.render();
    inst.flushEffects();

    inst.result.toggleCompact();
    assert('toggleCompact() flips compact false -> true', inst.result.isCompact === true);

    inst.result.setCompact(false);
    assert('setCompact(false) sets isCompact to false', inst.result.isCompact === false);
  }

  // Test 2.8: Rapid 1000-cycle toggle stress test
  {
    const harness = createHookHarness(() => useDrawerState({ defaultOpen: false }));
    const inst = harness.render();
    inst.flushEffects();

    let expected = false;
    let anomalyCount = 0;

    for (let i = 0; i < 1000; i++) {
      inst.result.toggle();
      expected = !expected;
      if (inst.result.isOpen !== expected) {
        anomalyCount++;
      }
    }

    assert(
      '1,000 sequential toggles execute with 0 state anomalies',
      anomalyCount === 0 && inst.result.isOpen === expected
    );
  }
});

// ============================================================================
// SUITE 3: Independent Storage Keys & 4-Permutation Stress Test
// ============================================================================

suite('3. Independent Storage Keys & 4 Permutations', (assert) => {
  const LEFT_KEY = 'dashboard:drawer:left';
  const RIGHT_KEY = 'dashboard:drawer:right';

  // Helper to simulate dual drawer hook instances
  function setupDualDrawers() {
    mockWindow.localStorage.clear();

    const leftHarness = createHookHarness((props) =>
      useDrawerState({ storageKey: LEFT_KEY, ...props })
    );
    const rightHarness = createHookHarness((props) =>
      useDrawerState({ storageKey: RIGHT_KEY, ...props })
    );

    const leftInst = leftHarness.render();
    const rightInst = rightHarness.render();
    leftInst.flushEffects();
    rightInst.flushEffects();

    return { leftInst, rightInst };
  }

  // Permutation 1: Left Open (true), Right Closed (false)
  {
    const { leftInst, rightInst } = setupDualDrawers();
    leftInst.result.setOpen(true);
    rightInst.result.setOpen(false);

    assert(
      'Permutation 1: Left Open & Right Closed in hooks',
      leftInst.result.isOpen === true && rightInst.result.isOpen === false
    );
    assert(
      'Permutation 1: Left Open & Right Closed in localStorage',
      safeStorage.getItem(LEFT_KEY) === true && safeStorage.getItem(RIGHT_KEY) === false
    );
  }

  // Permutation 2: Both Open (Left true, Right true)
  {
    const { leftInst, rightInst } = setupDualDrawers();
    leftInst.result.setOpen(true);
    rightInst.result.setOpen(true);

    assert(
      'Permutation 2: Both Open in hooks',
      leftInst.result.isOpen === true && rightInst.result.isOpen === true
    );
    assert(
      'Permutation 2: Both Open in localStorage',
      safeStorage.getItem(LEFT_KEY) === true && safeStorage.getItem(RIGHT_KEY) === true
    );
  }

  // Permutation 3: Left Closed (false), Right Open (true)
  {
    const { leftInst, rightInst } = setupDualDrawers();
    leftInst.result.setOpen(false);
    rightInst.result.setOpen(true);

    assert(
      'Permutation 3: Left Closed & Right Open in hooks',
      leftInst.result.isOpen === false && rightInst.result.isOpen === true
    );
    assert(
      'Permutation 3: Left Closed & Right Open in localStorage',
      safeStorage.getItem(LEFT_KEY) === false && safeStorage.getItem(RIGHT_KEY) === true
    );
  }

  // Permutation 4: Both Closed (Left false, Right false)
  {
    const { leftInst, rightInst } = setupDualDrawers();
    leftInst.result.setOpen(false);
    rightInst.result.setOpen(false);

    assert(
      'Permutation 4: Both Closed in hooks',
      leftInst.result.isOpen === false && rightInst.result.isOpen === false
    );
    assert(
      'Permutation 4: Both Closed in localStorage',
      safeStorage.getItem(LEFT_KEY) === false && safeStorage.getItem(RIGHT_KEY) === false
    );
  }

  // Stress: Interleaved mutations: Left toggle must NEVER touch Right storage
  {
    const { leftInst, rightInst } = setupDualDrawers();
    rightInst.result.setOpen(true); // Right is fixed to true

    let leakageDetected = false;
    for (let i = 0; i < 200; i++) {
      leftInst.result.toggle();
      const rightInStorage = safeStorage.getItem(RIGHT_KEY);
      if (rightInStorage !== true || rightInst.result.isOpen !== true) {
        leakageDetected = true;
        break;
      }
    }

    assert(
      '200 Left toggles never polluted or altered Right Drawer state/storage',
      leakageDetected === false
    );
  }

  // Stress: Interleaved mutations: Right toggle must NEVER touch Left storage
  {
    const { leftInst, rightInst } = setupDualDrawers();
    leftInst.result.setOpen(true); // Left is fixed to true

    let leakageDetected = false;
    for (let i = 0; i < 200; i++) {
      rightInst.result.toggle();
      const leftInStorage = safeStorage.getItem(LEFT_KEY);
      if (leftInStorage !== true || leftInst.result.isOpen !== true) {
        leakageDetected = true;
        break;
      }
    }

    assert(
      '200 Right toggles never polluted or altered Left Drawer state/storage',
      leakageDetected === false
    );
  }

  // Cross-tab storage event isolation
  {
    const { leftInst, rightInst } = setupDualDrawers();
    leftInst.result.setOpen(false);
    rightInst.result.setOpen(false);

    // Dispatch storage event targeting LEFT_KEY
    mockWindow.dispatchEvent({
      type: 'storage',
      key: LEFT_KEY,
      newValue: JSON.stringify(true),
    });

    assert(
      'StorageEvent on Left key updates Left Drawer to true',
      leftInst.result.isOpen === true
    );
    assert(
      'StorageEvent on Left key leaves Right Drawer unchanged (false)',
      rightInst.result.isOpen === false
    );

    // Dispatch storage event targeting RIGHT_KEY
    mockWindow.dispatchEvent({
      type: 'storage',
      key: RIGHT_KEY,
      newValue: JSON.stringify(true),
    });

    assert(
      'StorageEvent on Right key updates Right Drawer to true',
      rightInst.result.isOpen === true
    );

    // Dispatch storage event targeting foreign key
    mockWindow.dispatchEvent({
      type: 'storage',
      key: 'foreign:storage:key',
      newValue: JSON.stringify(false),
    });

    assert(
      'Foreign StorageEvent does not affect Left Drawer',
      leftInst.result.isOpen === true
    );
    assert(
      'Foreign StorageEvent does not affect Right Drawer',
      rightInst.result.isOpen === true
    );
  }
});

// ============================================================================
// SUITE 4: Private Browsing Fallback & Error Resilience
// ============================================================================

suite('4. Private Browsing Fallback & QuotaExceeded Resilience', (assert) => {
  mockWindow.localStorage.clear();

  // Test 4.1: safeStorage unit error handling
  {
    class SecurityError extends Error {
      constructor(msg) {
        super(msg);
        this.name = 'SecurityError';
      }
    }

    // SetItem throws SecurityError
    mockWindow.localStorage.throwOnSet = SecurityError;
    const setResult = safeStorage.setItem('test:key', true);
    assert('safeStorage.setItem returns false on SecurityError without throwing', setResult === false);

    // GetItem throws SecurityError
    mockWindow.localStorage.throwOnGet = SecurityError;
    const getResult = safeStorage.getItem('test:key', 'fallback_val');
    assert('safeStorage.getItem returns fallback on SecurityError without throwing', getResult === 'fallback_val');

    // RemoveItem throws SecurityError
    mockWindow.localStorage.throwOnRemove = SecurityError;
    const removeResult = safeStorage.removeItem('test:key');
    assert('safeStorage.removeItem returns false on SecurityError without throwing', removeResult === false);

    // Reset error mocks
    mockWindow.localStorage.throwOnSet = null;
    mockWindow.localStorage.throwOnGet = null;
    mockWindow.localStorage.throwOnRemove = null;
  }

  // Test 4.2: QuotaExceededError in localStorage.setItem
  {
    class QuotaExceededError extends Error {
      constructor(msg) {
        super(msg);
        this.name = 'QuotaExceededError';
      }
    }

    mockWindow.localStorage.throwOnSet = QuotaExceededError;
    const setResult = safeStorage.setItem('test:quota', { data: 'overflow' });
    assert('safeStorage.setItem returns false on QuotaExceededError without throwing', setResult === false);
    mockWindow.localStorage.throwOnSet = null;
  }

  // Test 4.3: Corrupted / Malformed JSON in localStorage
  {
    mockWindow.localStorage.store.set('malformed:key', '{not_json:::');
    const result = safeStorage.getItem('malformed:key', 'default_fb');
    assert('safeStorage.getItem returns fallback when item contains malformed JSON', result === 'default_fb');
  }

  // Test 4.4: useDrawerState survives SecurityError on setItem
  {
    class SecurityError extends Error {
      constructor() {
        super('The operation is insecure.');
        this.name = 'SecurityError';
      }
    }

    mockWindow.localStorage.clear();
    mockWindow.localStorage.throwOnSet = SecurityError;

    let callbackFired = null;
    const harness = createHookHarness(() =>
      useDrawerState({
        storageKey: 'private:browser:key',
        defaultOpen: false,
        onOpenChange: (val) => (callbackFired = val),
      })
    );

    const inst = harness.render();
    inst.flushEffects();

    let threw = false;
    try {
      inst.result.setOpen(true);
    } catch (e) {
      threw = true;
    }

    assert('setOpen does not throw exception when setItem throws SecurityError', threw === false);
    assert('In-memory isOpen updates to true despite storage failure', inst.result.isOpen === true);
    assert('onOpenChange callback fires with true despite storage failure', callbackFired === true);

    // In-memory toggle continues functioning smoothly
    inst.result.toggle();
    assert('Subsequent toggle() works in memory (switches to false)', inst.result.isOpen === false);
    inst.result.toggle();
    assert('Subsequent toggle() works in memory (switches to true)', inst.result.isOpen === true);

    mockWindow.localStorage.throwOnSet = null;
  }

  // Test 4.5: useDrawerState survives QuotaExceededError on setItem
  {
    class QuotaExceededError extends Error {
      constructor() {
        super('The quota has been exceeded.');
        this.name = 'QuotaExceededError';
      }
    }

    mockWindow.localStorage.clear();
    mockWindow.localStorage.throwOnSet = QuotaExceededError;

    const harness = createHookHarness(() =>
      useDrawerState({
        storageKey: 'quota:test:key',
        defaultOpen: false,
      })
    );
    const inst = harness.render();
    inst.flushEffects();

    let threw = false;
    try {
      inst.result.setOpen(true);
    } catch {
      threw = true;
    }

    assert('setOpen does not throw on QuotaExceededError', threw === false);
    assert('In-memory isOpen is true on QuotaExceededError', inst.result.isOpen === true);

    mockWindow.localStorage.throwOnSet = null;
  }

  // Test 4.6: useDrawerState survives malformed payloads during hydration
  {
    mockWindow.localStorage.store.set('malformed:state:key', JSON.stringify({ open: 'not-a-bool' }));

    const harness = createHookHarness(() =>
      useDrawerState({
        storageKey: 'malformed:state:key',
        defaultOpen: false,
      })
    );
    const inst = harness.render();
    inst.flushEffects(); // Hydration phase

    assert(
      'Malformed payload (non-boolean open) is ignored; keeps defaultOpen=false',
      inst.result.isOpen === false
    );
  }
});

// ============================================================================
// SUITE 5: Two-Phase Hydration & SSR Determinism
// ============================================================================

suite('5. Two-Phase Hydration & SSR Determinism', (assert) => {
  // Test 5.1: SSR phase: Pre-hydration initial render uses defaultOpen
  {
    // Storage holds saved state "true"
    mockWindow.localStorage.clear();
    mockWindow.localStorage.setItem('hydrate:test:key', JSON.stringify(true));

    const harness = createHookHarness(() =>
      useDrawerState({
        storageKey: 'hydrate:test:key',
        defaultOpen: false,
      })
    );

    // Initial render BEFORE useEffect runs (Phase 1 / SSR parity)
    const inst = harness.render();
    assert(
      'Phase 1 (Pre-mount): isOpen equals deterministic defaultOpen (false)',
      inst.result.isOpen === false
    );
    assert(
      'Phase 1 (Pre-mount): isHydrated is false',
      inst.result.isHydrated === false
    );

    // Phase 2: Client Mount (flush effects)
    inst.flushEffects();
    assert(
      'Phase 2 (Post-mount): isHydrated transitions to true',
      inst.result.isHydrated === true
    );
    assert(
      'Phase 2 (Post-mount): isOpen reconciles with localStorage value (true)',
      inst.result.isOpen === true
    );
  }

  // Test 5.2: useHydratedDrawerState hook two-phase hydration
  {
    mockWindow.localStorage.clear();
    mockWindow.localStorage.setItem('hydrated:hook:key', JSON.stringify(true));

    const harness = createHookHarness(() =>
      useHydratedDrawerState('hydrated:hook:key', false)
    );

    const inst = harness.render();
    const [phase1State, , phase1Hydrated] = inst.result;
    assert('useHydratedDrawerState Phase 1 returns defaultState (false)', phase1State === false);
    assert('useHydratedDrawerState Phase 1 returns isHydrated=false', phase1Hydrated === false);

    inst.flushEffects();
    const [phase2State, , phase2Hydrated] = inst.result;
    assert('useHydratedDrawerState Phase 2 reconciles to saved state (true)', phase2State === true);
    assert('useHydratedDrawerState Phase 2 returns isHydrated=true', phase2Hydrated === true);
  }

  // Test 5.3: SSR Component Rendering via React DOM renderToString
  {
    function ServerDrawerComponent({ defaultOpen }) {
      const { isOpen, isHydrated } = useDrawerState({
        storageKey: 'ssr:test:key',
        defaultOpen,
      });

      return React.createElement(
        'div',
        {
          'data-testid': 'drawer',
          'data-state': isOpen ? 'open' : 'closed',
          'data-hydrated': String(isHydrated),
        },
        isOpen ? 'Drawer is Open' : 'Drawer is Closed'
      );
    }

    // SSR with defaultOpen=false
    const ssrHtmlClosed = renderToString(
      React.createElement(ServerDrawerComponent, { defaultOpen: false })
    );
    assert(
      'renderToString with defaultOpen=false outputs closed state and hydrated=false',
      ssrHtmlClosed.includes('data-state="closed"') &&
      ssrHtmlClosed.includes('data-hydrated="false"') &&
      ssrHtmlClosed.includes('Drawer is Closed')
    );

    // SSR with defaultOpen=true
    const ssrHtmlOpen = renderToString(
      React.createElement(ServerDrawerComponent, { defaultOpen: true })
    );
    assert(
      'renderToString with defaultOpen=true outputs open state and hydrated=false',
      ssrHtmlOpen.includes('data-state="open"') &&
      ssrHtmlOpen.includes('data-hydrated="false"') &&
      ssrHtmlOpen.includes('Drawer is Open')
    );
  }

  // Test 5.4: Reference-counted body scroll lock unit test
  {
    global.document.body.style.overflow = '';

    lockBodyScroll();
    assert('First lockBodyScroll() sets document.body.style.overflow to "hidden"', global.document.body.style.overflow === 'hidden');

    lockBodyScroll();
    assert('Second lockBodyScroll() maintains "hidden"', global.document.body.style.overflow === 'hidden');

    unlockBodyScroll();
    assert('First unlockBodyScroll() keeps "hidden" due to ref counting', global.document.body.style.overflow === 'hidden');

    unlockBodyScroll();
    assert('Second unlockBodyScroll() releases lock and restores ""', global.document.body.style.overflow === '');

    unlockBodyScroll(); // Extra unlock should not break
    assert('Extra unlockBodyScroll() gracefully handles zero-count bounds', global.document.body.style.overflow === '');
  }
});

// ============================================================================
// SUITE 6: Advanced Adversarial Matrix (16 Permutations & Strict SSR Guards)
// ============================================================================

suite('6. Advanced Adversarial Matrix: 16 Permutations & Strict SSR Guards', (assert) => {
  mockWindow.localStorage.clear();

  // Test 6.1: 16-Permutation Matrix across 4 Concurrent Drawers
  {
    const keys = [
      'app:drawer:nav',
      'app:drawer:context',
      'app:drawer:filters',
      'app:drawer:inspector',
    ];

    const harnesses = keys.map((key) =>
      createHookHarness(() => useDrawerState({ storageKey: key, defaultOpen: false }))
    );
    const instances = harnesses.map((h) => {
      const inst = h.render();
      inst.flushEffects();
      return inst;
    });

    let allPermutationsPassed = true;

    for (let mask = 0; mask < 16; mask++) {
      const targetStates = [
        Boolean(mask & 1),
        Boolean(mask & 2),
        Boolean(mask & 4),
        Boolean(mask & 8),
      ];

      // Apply target state to each drawer
      for (let i = 0; i < 4; i++) {
        instances[i].result.setOpen(targetStates[i]);
      }

      // Assert each drawer hook and storage key exactly matches expected bit
      for (let i = 0; i < 4; i++) {
        const hookState = instances[i].result.isOpen;
        const storedState = safeStorage.getItem(keys[i]);
        if (hookState !== targetStates[i] || storedState !== targetStates[i]) {
          allPermutationsPassed = false;
        }
      }
    }

    assert(
      'All 16 permutations across 4 concurrent independent drawers maintain exact state without crosstalk',
      allPermutationsPassed
    );
  }

  // Test 6.2: Key Prefix Collision Defense (e.g. key is substring/prefix of another)
  {
    mockWindow.localStorage.clear();
    const prefixKey = 'dashboard:drawer';
    const childKey = 'dashboard:drawer:left';
    const grandchildKey = 'dashboard:drawer:left:settings';

    const hPrefix = createHookHarness(() => useDrawerState({ storageKey: prefixKey }));
    const hChild = createHookHarness(() => useDrawerState({ storageKey: childKey }));
    const hGrand = createHookHarness(() => useDrawerState({ storageKey: grandchildKey }));

    const instPrefix = hPrefix.render();
    const instChild = hChild.render();
    const instGrand = hGrand.render();
    instPrefix.flushEffects();
    instChild.flushEffects();
    instGrand.flushEffects();

    instPrefix.result.setOpen(true);
    instChild.result.setOpen(false);
    instGrand.result.setOpen(true);

    assert(
      'Prefix key isolation: prefix drawer is true, child is false, grandchild is true',
      instPrefix.result.isOpen === true &&
      instChild.result.isOpen === false &&
      instGrand.result.isOpen === true &&
      safeStorage.getItem(prefixKey) === true &&
      safeStorage.getItem(childKey) === false &&
      safeStorage.getItem(grandchildKey) === true
    );
  }

  // Test 6.3: Malformed Payload Attack Matrix
  {
    const attackPayloads = [
      { raw: 'null', desc: 'literal null string' },
      { raw: '"false"', desc: 'string representation of boolean' },
      { raw: '1', desc: 'integer 1' },
      { raw: '0', desc: 'integer 0' },
      { raw: '[true]', desc: 'boolean wrapped in array' },
      { raw: '{"other": true}', desc: 'object missing open property' },
      { raw: '{"open": "true"}', desc: 'object with string open property' },
      { raw: '{"open": 1}', desc: 'object with numeric open property' },
    ];

    for (const { raw, desc } of attackPayloads) {
      mockWindow.localStorage.clear();
      mockWindow.localStorage.store.set('attack:key', raw);

      const h = createHookHarness(() =>
        useDrawerState({ storageKey: 'attack:key', defaultOpen: false })
      );
      const inst = h.render();
      inst.flushEffects();

      assert(
        `Hydration safely rejects malformed payload: ${desc}`,
        inst.result.isOpen === false
      );
    }

    // Valid object payloads: { open: true } and { open: false }
    mockWindow.localStorage.store.set('valid:obj:true', JSON.stringify({ open: true }));
    const hObjTrue = createHookHarness(() =>
      useDrawerState({ storageKey: 'valid:obj:true', defaultOpen: false })
    );
    const instObjTrue = hObjTrue.render();
    instObjTrue.flushEffects();
    assert(
      'Hydration successfully accepts structured object: { open: true }',
      instObjTrue.result.isOpen === true
    );

    mockWindow.localStorage.store.set('valid:obj:false', JSON.stringify({ open: false }));
    const hObjFalse = createHookHarness(() =>
      useDrawerState({ storageKey: 'valid:obj:false', defaultOpen: true })
    );
    const instObjFalse = hObjFalse.render();
    instObjFalse.flushEffects();
    assert(
      'Hydration successfully accepts structured object: { open: false }',
      instObjFalse.result.isOpen === false
    );
  }

  // Test 6.4: Pure SSR Environment Strictness (global.window & global.document undefined)
  {
    const savedWindow = global.window;
    const savedDocument = global.document;

    try {
      delete global.window;
      delete global.document;

      assert(
        'safeStorage.getItem returns fallback when window is undefined',
        safeStorage.getItem('any_key', 'ssr_fb') === 'ssr_fb'
      );
      assert(
        'safeStorage.setItem returns false when window is undefined',
        safeStorage.setItem('any_key', true) === false
      );
      assert(
        'safeStorage.removeItem returns false when window is undefined',
        safeStorage.removeItem('any_key') === false
      );

      let lockThrew = false;
      try {
        lockBodyScroll();
        unlockBodyScroll();
      } catch {
        lockThrew = true;
      }
      assert('lockBodyScroll & unlockBodyScroll do not throw when document is undefined', lockThrew === false);
    } finally {
      global.window = savedWindow;
      global.document = savedDocument;
    }
  }
});

// ============================================================================
// Final Empirical Summary Report
// ============================================================================

console.log(`\n============================================================`);
console.log(`EMPIRICAL STRESS TEST RESULTS SUMMARY`);
console.log(`============================================================`);
console.log(`Total Assertions : ${results.total}`);
console.log(`Passed           : ${results.passed}`);
console.log(`Failed           : ${results.failed}`);
console.log(`Success Rate     : ${((results.passed / results.total) * 100).toFixed(1)}%`);

const verdict = results.failed === 0 ? 'APPROVE' : 'FAIL';
console.log(`FINAL VERDICT    : ${verdict}`);
console.log(`============================================================\n`);

process.exit(results.failed === 0 ? 0 : 1);
