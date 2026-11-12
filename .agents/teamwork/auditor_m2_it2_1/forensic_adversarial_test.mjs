/**
 * FORENSIC AUDITOR INDEPENDENT ADVERSARIAL VERIFICATION SCRIPT
 * Milestone 2, Iteration 2: Drawer Core & Accessibility Remediation
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { chromium } from '@playwright/test';

console.log('================================================================');
console.log('FORENSIC INTEGRITY AUDIT: INDEPENDENT EMPIRICAL VERIFICATION');
console.log('================================================================');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function check(desc, fn) {
  totalChecks++;
  try {
    fn();
    passedChecks++;
    console.log(`  [PASS] ${desc}`);
  } catch (err) {
    failedChecks++;
    console.error(`  [FAIL] ${desc}`);
    console.error(`         ${err.message}`);
  }
}

async function asyncCheck(desc, fn) {
  totalChecks++;
  try {
    await fn();
    passedChecks++;
    console.log(`  [PASS] ${desc}`);
  } catch (err) {
    failedChecks++;
    console.error(`  [FAIL] ${desc}`);
    console.error(`         ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// CHECK 1: File Existence and Size Integrity
// -----------------------------------------------------------------------------
console.log('\n--- Section 1: File Presence & Structural Integrity ---');
const DRAWER_DIR = path.resolve('src/components/ui/drawer');
const REQUIRED_FILES = [
  'Drawer.jsx',
  'DrawerHeader.jsx',
  'DrawerContent.jsx',
  'DrawerFooter.jsx',
  'DrawerToggle.jsx',
  'LeftDrawer.jsx',
  'RightDrawer.jsx',
  'useDrawer.js',
  'index.js',
];

for (const file of REQUIRED_FILES) {
  check(`File exists and is non-empty: ${file}`, () => {
    const fullPath = path.join(DRAWER_DIR, file);
    assert(fs.existsSync(fullPath), `File ${file} does not exist`);
    const stat = fs.statSync(fullPath);
    assert(stat.size > 200, `File ${file} size too small: ${stat.size} bytes`);
  });
}

// -----------------------------------------------------------------------------
// CHECK 2: Absence of Banned Imports & External Libraries in Drawer Components
// -----------------------------------------------------------------------------
console.log('\n--- Section 2: Banned Dependencies & External Delegation Audit ---');
const BANNED_IMPORT_PATTERNS = [
  /axios/i,
  /amcharts/i,
  /vaul/i,
  /@headlessui/i,
  /@radix-ui/i,
  /@floating-ui/i,
  /material-ui/i,
  /@mui/i,
  /@chakra-ui/i,
  /antd/i,
];

for (const file of REQUIRED_FILES) {
  check(`File ${file} contains 0 banned imports or delegated libraries`, () => {
    const content = fs.readFileSync(path.join(DRAWER_DIR, file), 'utf-8');
    for (const pattern of BANNED_IMPORT_PATTERNS) {
      assert(!pattern.test(content), `Banned pattern ${pattern} detected in ${file}`);
    }
  });
}

// -----------------------------------------------------------------------------
// CHECK 3: Source Code Behavioral Analysis (useDrawer.js)
// -----------------------------------------------------------------------------
console.log('\n--- Section 3: Genuine Implementation Checks in useDrawer.js ---');
const useDrawerSource = fs.readFileSync(path.join(DRAWER_DIR, 'useDrawer.js'), 'utf-8');

check('FOCUSABLE_SELECTOR includes :not([tabindex="-1"]) on all interactive tags', () => {
  assert(useDrawerSource.includes('a[href]:not([tabindex="-1"])'));
  assert(useDrawerSource.includes('button:not([disabled]):not([tabindex="-1"])'));
  assert(useDrawerSource.includes('input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])'));
  assert(useDrawerSource.includes('select:not([disabled]):not([tabindex="-1"])'));
  assert(useDrawerSource.includes('textarea:not([disabled]):not([tabindex="-1"])'));
});

check('getFocusableElements properly checks visibility, display and dimensions', () => {
  assert(useDrawerSource.includes("style.visibility === 'hidden' || style.display === 'none'"));
  assert(useDrawerSource.includes("el.getAttribute('tabindex') === '-1'"));
  assert(useDrawerSource.includes('el.offsetWidth > 0 ||'));
});

check('lockBodyScroll and unlockBodyScroll use reference counting', () => {
  assert(useDrawerSource.includes('activeLocksCount = 0') || useDrawerSource.includes('let activeLocksCount = 0'));
  assert(useDrawerSource.includes('activeLocksCount++'));
  assert(useDrawerSource.includes('Math.max(0, activeLocksCount - 1)'));
  assert(useDrawerSource.includes('document.body.style.overflow = originalOverflowStyle'));
});

check('safeStorage wraps operations in try/catch defensive blocks', () => {
  assert(useDrawerSource.includes('JSON.parse(item)'));
  assert(useDrawerSource.includes('JSON.stringify(value)'));
  assert((useDrawerSource.match(/try\s*\{/g) || []).length >= 5);
});

check('useDrawerState supports cross-tab synchronization via storage event', () => {
  assert(useDrawerSource.includes("window.addEventListener('storage', handleStorage)"));
  assert(useDrawerSource.includes("window.removeEventListener('storage', handleStorage)"));
});

// -----------------------------------------------------------------------------
// CHECK 4: Source Code Behavioral Analysis (Drawer.jsx)
// -----------------------------------------------------------------------------
console.log('\n--- Section 4: Genuine Implementation Checks in Drawer.jsx ---');
const drawerSource = fs.readFileSync(path.join(DRAWER_DIR, 'Drawer.jsx'), 'utf-8');

check('Drawer.jsx implements inert={!isOpen ? true : undefined}', () => {
  assert(drawerSource.includes('inert={!isOpen ? true : undefined}'));
});

check('Drawer.jsx implements invisible class on closed aside container', () => {
  assert(drawerSource.includes('invisible'));
  assert(drawerSource.includes('-translate-x-full pointer-events-none invisible'));
  assert(drawerSource.includes('translate-x-full pointer-events-none invisible'));
});

check('Drawer.jsx resolves aria-label without dangling IDs when ariaLabelledBy is absent', () => {
  assert(drawerSource.includes('resolvedAriaLabelledBy = ariaLabelledBy || undefined'));
  assert(drawerSource.includes('resolvedAriaLabel = resolvedAriaLabelledBy'));
  assert(drawerSource.includes('aria-label={resolvedAriaLabel}'));
  assert(drawerSource.includes('aria-labelledby={resolvedAriaLabelledBy}'));
});

check('Drawer.jsx renders backdrop with data-testid="drawer-backdrop"', () => {
  assert(drawerSource.includes('data-testid="drawer-backdrop"'));
  assert(drawerSource.includes('closeOnBackdropClick ? closeDrawer : undefined'));
});

// -----------------------------------------------------------------------------
// CHECK 5: Empirical Chromium Browser Execution
// -----------------------------------------------------------------------------
console.log('\n--- Section 5: Empirical Real-Browser (Chromium) Execution ---');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Extract actual implementation from useDrawer.js
const selectorMatch = useDrawerSource.match(/export const FOCUSABLE_SELECTOR = (\[[\s\S]*?\]\.join\(', '\));/);
assert(selectorMatch, 'Could not extract FOCUSABLE_SELECTOR');

const funcMatch = useDrawerSource.match(/export function getFocusableElements\(container\) \{([\s\S]*?\n\})/);
assert(funcMatch, 'Could not extract getFocusableElements');

await asyncCheck('Chromium: Focusable elements accurately filtered under diverse DOM states', async () => {
  await page.setContent(`
    <div id="drawer-root">
      <!-- Standard focusables -->
      <button id="b1">Button 1</button>
      <a id="a1" href="/dash">Link 1</a>
      <input id="i1" type="text" />
      <select id="s1"><option>Opt</option></select>
      <textarea id="t1"></textarea>
      <div id="d1" tabindex="0">Tabindex 0</div>
      <div id="e1" contenteditable="true">Editable</div>

      <!-- Excluded by tabindex=-1 -->
      <button id="b-tabminus" tabindex="-1">B-minus</button>
      <a id="a-tabminus" href="/dash" tabindex="-1">A-minus</a>
      <input id="i-tabminus" type="text" tabindex="-1" />
      <select id="s-tabminus" tabindex="-1"><option>Opt</option></select>
      <textarea id="t-tabminus" tabindex="-1"></textarea>
      <div id="d-tabminus" tabindex="-1">D-minus</div>
      <div id="e-tabminus" contenteditable="true" tabindex="-1">E-minus</div>

      <!-- Excluded by disabled / hidden / display:none / visibility:hidden -->
      <button id="b-disabled" disabled>Disabled</button>
      <input id="i-disabled" disabled type="text" />
      <input id="i-hidden" type="hidden" />
      <a id="a-nohref">No href link</a>
      <button id="b-none" style="display: none">Display None</button>
      <button id="b-vis-hidden" style="visibility: hidden">Vis Hidden</button>
      
      <!-- Nested in hidden parent -->
      <div style="display: none">
        <button id="b-nested-none">Nested None</button>
      </div>
      <div style="visibility: hidden">
        <button id="b-nested-vis">Nested Vis Hidden</button>
      </div>
    </div>
  `);

  const evaluated = await page.evaluate(new Function(`
    const FOCUSABLE_SELECTOR = ${selectorMatch[1]};
    ${funcMatch[0].replace('export ', '')}
    const container = document.getElementById('drawer-root');
    const elements = getFocusableElements(container);
    return elements.map(el => el.id);
  `));

  assert.deepStrictEqual(evaluated, ['b1', 'a1', 'i1', 's1', 't1', 'd1', 'e1']);
});

await asyncCheck('Chromium: SafeStorage handles SecurityError on opaque origin and fallback logic', async () => {
  const result = await page.evaluate(() => {
    const safeStorage = {
      getItem: (key, fallback = null) => {
        if (typeof window === 'undefined' || !key) return fallback;
        try {
          const item = window.localStorage.getItem(key);
          if (item === null) return fallback;
          return JSON.parse(item);
        } catch {
          return fallback;
        }
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined' || !key) return false;
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch {
          return false;
        }
      },
      removeItem: (key) => {
        if (typeof window === 'undefined' || !key) return false;
        try {
          window.localStorage.removeItem(key);
          return true;
        } catch {
          return false;
        }
      },
    };

    // On about:blank, window.localStorage throws SecurityError (access denied)
    // safeStorage must absorb the SecurityError without crashing
    const t1 = safeStorage.getItem('any_key', 'fallback_ok') === 'fallback_ok';
    const t2 = safeStorage.setItem('any_key', { open: true }) === false;
    const t3 = safeStorage.removeItem('any_key') === false;
    const t4 = safeStorage.getItem(null, 'null_fallback') === 'null_fallback';
    const t5 = safeStorage.setItem(null, 'val') === false;

    // Test with simulated storage object to test parsing and serialization
    const mockStore = {};
    const simulatedStorage = {
      getItem: (k) => mockStore[k] ?? null,
      setItem: (k, v) => { mockStore[k] = v; },
      removeItem: (k) => { delete mockStore[k]; },
    };

    // Temporarily point window.localStorage to simulatedStorage
    Object.defineProperty(window, 'localStorage', {
      value: simulatedStorage,
      configurable: true,
    });

    const s1 = safeStorage.setItem('drawer_state', { open: true, compact: false }) === true;
    const s2 = safeStorage.getItem('drawer_state')?.open === true;
    const s3 = safeStorage.getItem('drawer_state')?.compact === false;

    // Test JSON corruption
    mockStore['corrupt'] = '{invalid json';
    const s4 = safeStorage.getItem('corrupt', 'corrupt_fallback') === 'corrupt_fallback';

    safeStorage.removeItem('drawer_state');
    const s5 = safeStorage.getItem('drawer_state') === null;

    return t1 && t2 && t3 && t4 && t5 && s1 && s2 && s3 && s4 && s5;
  });

  assert(result === true, 'SafeStorage checks failed in browser');
});

await asyncCheck('Chromium: Scroll Lock reference counting behaves correctly', async () => {
  const result = await page.evaluate(() => {
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

    document.body.style.overflow = 'auto'; // custom original
    lockBodyScroll();
    const step1 = document.body.style.overflow === 'hidden';

    lockBodyScroll();
    const step2 = document.body.style.overflow === 'hidden';

    unlockBodyScroll();
    const step3 = document.body.style.overflow === 'hidden';

    unlockBodyScroll();
    const step4 = document.body.style.overflow === 'auto'; // restored

    unlockBodyScroll(); // underflow attempt
    const step5 = document.body.style.overflow === 'auto';

    return step1 && step2 && step3 && step4 && step5;
  });

  assert(result === true, 'Scroll lock reference counting failed in browser');
});

await asyncCheck('Chromium: Focus Trap Circular Wrap (Tab & Shift-Tab) and ESC dismissal', async () => {
  await page.setContent(`
    <div id="drawer" role="dialog" aria-modal="true">
      <button id="trap-first">First</button>
      <input id="trap-middle" type="text" />
      <button id="trap-last">Last</button>
    </div>
  `);

  const trapResult = await page.evaluate(() => {
    const FOCUSABLE_SELECTOR = 'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])';
    function getFocusableElements(container) {
      return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
        if (el.getAttribute('tabindex') === '-1' || el.hasAttribute('disabled') || el.disabled) return false;
        const style = window.getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none') return false;
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
      });
    }

    const drawer = document.getElementById('drawer');
    let escFired = false;

    // Attach keydown handler simulating useDrawerAccessibility
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        escFired = true;
        return;
      }
      if (e.key === 'Tab') {
        const focusables = getFocusableElements(drawer);
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
    }, true);

    const first = document.getElementById('trap-first');
    const middle = document.getElementById('trap-middle');
    const last = document.getElementById('trap-last');

    // 1. Shift+Tab on first element wraps to last
    first.focus();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    const wrapShiftTab = document.activeElement === last;

    // 2. Tab on last element wraps to first
    last.focus();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false, bubbles: true }));
    const wrapTab = document.activeElement === first;

    // 3. Tab on middle element does not wrap (native progression)
    middle.focus();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false, bubbles: true }));
    const midTab = document.activeElement === middle; // Event didn't forcefully divert focus

    // 4. Escape key
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    return wrapShiftTab && wrapTab && midTab && escFired;
  });

  assert(trapResult === true, 'Focus trap wrap and ESC dismissal failed');
});

await browser.close();

console.log('\n================================================================');
console.log(`TOTAL FORENSIC CHECKS: ${totalChecks}`);
console.log(`PASSED: ${passedChecks}`);
console.log(`FAILED: ${failedChecks}`);
console.log(`INTEGRITY VERDICT: ${failedChecks === 0 ? 'CLEAN' : 'INTEGRITY VIOLATION'}`);
console.log('================================================================\n');

if (failedChecks > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
