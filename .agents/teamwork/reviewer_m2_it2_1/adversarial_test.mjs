import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('ADVERSARIAL STRESS TEST & VERIFICATION SUITE (Reviewer 1, It 2)');
console.log('================================================================');

// 1. Load actual source code directly
const useDrawerSrc = fs.readFileSync('src/components/ui/drawer/useDrawer.js', 'utf8');
const drawerSrc = fs.readFileSync('src/components/ui/drawer/Drawer.jsx', 'utf8');

// Extract FOCUSABLE_SELECTOR and getFocusableElements
const selectorMatch = useDrawerSrc.match(/export const FOCUSABLE_SELECTOR = (\[[\s\S]*?\]\.join\(', '\));/);
if (!selectorMatch) throw new Error('Missing FOCUSABLE_SELECTOR');

const funcMatch = useDrawerSrc.match(/export function getFocusableElements\(container\) \{([\s\S]*?\n\})/);
if (!funcMatch) throw new Error('Missing getFocusableElements');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

let passed = 0;
let failed = 0;

function assert(condition, message, details = null) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`, details || '');
    failed++;
  }
}

// -----------------------------------------------------------------------------
// ADVERSARIAL SUITE 1: DOM Focusability Filter Edge Cases
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 1: DOM Focusability Edge Cases ---');

await page.setContent(`
  <div id="root">
    <!-- Standard focusable -->
    <button id="btn-normal">Normal</button>
    <a id="link-href" href="/test">Link with href</a>
    <input id="input-text" type="text" />
    <select id="select-test"><option>1</option></select>
    <textarea id="textarea-test"></textarea>
    <div id="div-tabindex-0" tabindex="0">Focusable div</div>
    <div id="editable-div" contenteditable="true">Editable</div>

    <!-- Negative tabindexes -->
    <button id="btn-tabindex-minus-1" tabindex="-1">Btn -1</button>
    <a id="link-tabindex-minus-1" href="/test" tabindex="-1">Link -1</a>
    <input id="input-tabindex-minus-1" type="text" tabindex="-1" />
    <div id="div-tabindex-minus-1" tabindex="-1">Div -1</div>

    <!-- Disabled -->
    <button id="btn-disabled" disabled>Disabled</button>
    <input id="input-disabled" type="text" disabled />
    <select id="select-disabled" disabled></select>
    <textarea id="textarea-disabled" disabled></textarea>

    <!-- Hidden / Inactive by type -->
    <a id="link-no-href">Link without href</a>
    <input id="input-hidden" type="hidden" />

    <!-- Invisibility variants -->
    <button id="btn-display-none" style="display: none;">Display none</button>
    <button id="btn-visibility-hidden" style="visibility: hidden;">Visibility hidden</button>

    <!-- Ancestor display none -->
    <div id="parent-display-none" style="display: none;">
      <button id="btn-in-display-none-parent">Nested display none</button>
      <input id="input-in-display-none-parent" type="text" />
    </div>

    <!-- Ancestor visibility hidden -->
    <div id="parent-visibility-hidden" style="visibility: hidden;">
      <button id="btn-in-visibility-hidden-parent">Nested visibility hidden</button>
      <!-- Nested child overrides visibility to visible! -->
      <button id="btn-nested-visibility-override" style="visibility: visible;">Visibility override child</button>
    </div>
  </div>
`);

const evaluateCode = `
  const FOCUSABLE_SELECTOR = ${selectorMatch[1]};
  ${funcMatch[0].replace('export ', '')}
  const root = document.getElementById('root');
  const elements = getFocusableElements(root);
  return elements.map(el => el.id);
`;

const matchedIds = await page.evaluate(new Function(evaluateCode));

// Standard focusables must be included
assert(matchedIds.includes('btn-normal'), 'Discovers standard button');
assert(matchedIds.includes('link-href'), 'Discovers link with href');
assert(matchedIds.includes('input-text'), 'Discovers text input');
assert(matchedIds.includes('select-test'), 'Discovers select element');
assert(matchedIds.includes('textarea-test'), 'Discovers textarea');
assert(matchedIds.includes('div-tabindex-0'), 'Discovers div with tabindex="0"');
assert(matchedIds.includes('editable-div'), 'Discovers contenteditable div');

// Disabled and inactive must be excluded
assert(!matchedIds.includes('btn-disabled'), 'Excludes disabled button');
assert(!matchedIds.includes('input-disabled'), 'Excludes disabled input');
assert(!matchedIds.includes('select-disabled'), 'Excludes disabled select');
assert(!matchedIds.includes('textarea-disabled'), 'Excludes disabled textarea');
assert(!matchedIds.includes('link-no-href'), 'Excludes link without href');
assert(!matchedIds.includes('input-hidden'), 'Excludes input type="hidden"');

// Negative tabindexes must be excluded
assert(!matchedIds.includes('btn-tabindex-minus-1'), 'Excludes button with tabindex="-1"');
assert(!matchedIds.includes('link-tabindex-minus-1'), 'Excludes link with tabindex="-1"');
assert(!matchedIds.includes('input-tabindex-minus-1'), 'Excludes input with tabindex="-1"');
assert(!matchedIds.includes('div-tabindex-minus-1'), 'Excludes div with tabindex="-1"');

// Invisibility variants must be excluded
assert(!matchedIds.includes('btn-display-none'), 'Excludes inline display: none');
assert(!matchedIds.includes('btn-visibility-hidden'), 'Excludes inline visibility: hidden');
assert(!matchedIds.includes('btn-in-display-none-parent'), 'Excludes button inside display: none ancestor');
assert(!matchedIds.includes('input-in-display-none-parent'), 'Excludes input inside display: none ancestor');
assert(!matchedIds.includes('btn-in-visibility-hidden-parent'), 'Excludes button inside visibility: hidden ancestor');

// If a nested child in a visibility:hidden container overrides to visibility:visible, it is actually visible
assert(matchedIds.includes('btn-nested-visibility-override'), 'Discovers child overriding parent visibility:hidden to visible');

// -----------------------------------------------------------------------------
// ADVERSARIAL SUITE 2: Focus Trap Keyboard Edge Cases in Browser
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Focus Trap Keyboard Handlers ---');

await page.setContent(`
  <div id="drawer" tabindex="-1">
    <button id="trap-btn-1">Button 1</button>
    <button id="trap-btn-2">Button 2</button>
    <button id="trap-btn-3">Button 3</button>
  </div>
  <button id="outside-trigger">Trigger</button>
`);

const trapTest = await page.evaluate(new Function(`
  const FOCUSABLE_SELECTOR = ${selectorMatch[1]};
  ${funcMatch[0].replace('export ', '')}

  const drawer = document.getElementById('drawer');
  const btn1 = document.getElementById('trap-btn-1');
  const btn2 = document.getElementById('trap-btn-2');
  const btn3 = document.getElementById('trap-btn-3');
  const outside = document.getElementById('outside-trigger');

  const logs = [];

  // Simulate useDrawerAccessibility keydown listener
  function handleKeyDown(e) {
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
          logs.push('Shift-Tab wrapped to last: ' + last.id);
        }
      } else {
        if (active === last || !drawer.contains(active)) {
          e.preventDefault();
          first.focus();
          logs.push('Tab wrapped to first: ' + first.id);
        }
      }
    }
  }

  // 1. Start at btn1, Shift-Tab -> should wrap to btn3
  btn1.focus();
  let fakeEvent = { key: 'Tab', shiftKey: true, preventDefault: () => {} };
  handleKeyDown(fakeEvent);

  // 2. Start at btn3, Tab -> should wrap to btn1
  btn3.focus();
  fakeEvent = { key: 'Tab', shiftKey: false, preventDefault: () => {} };
  handleKeyDown(fakeEvent);

  // 3. Start outside (outside-trigger), Tab -> should intercept to btn1
  outside.focus();
  fakeEvent = { key: 'Tab', shiftKey: false, preventDefault: () => {} };
  handleKeyDown(fakeEvent);

  // 4. Start outside, Shift-Tab -> should intercept to btn3
  outside.focus();
  fakeEvent = { key: 'Tab', shiftKey: true, preventDefault: () => {} };
  handleKeyDown(fakeEvent);

  return logs;
`));

assert(trapTest[0] === 'Shift-Tab wrapped to last: trap-btn-3', 'Shift-Tab wraps from first to last button');
assert(trapTest[1] === 'Tab wrapped to first: trap-btn-1', 'Tab wraps from last to first button');
assert(trapTest[2] === 'Tab wrapped to first: trap-btn-1', 'Tab intercepts outside focus and snaps to first');
assert(trapTest[3] === 'Shift-Tab wrapped to last: trap-btn-3', 'Shift-Tab intercepts outside focus and snaps to last');

// -----------------------------------------------------------------------------
// ADVERSARIAL SUITE 3: Code Integrity and Anti-Cheat Verifications
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Code Integrity & Anti-Cheat ---');

// Check 1: No hardcoded test IDs or results in useDrawer.js
assert(!useDrawerSrc.includes('btn-standard'), 'useDrawer.js contains zero hardcoded test IDs (no btn-standard)');
assert(!useDrawerSrc.includes('link-standard'), 'useDrawer.js contains no link-standard');
assert(!useDrawerSrc.includes('test-drawer-container'), 'useDrawer.js contains no test-drawer-container');

// Check 2: No axios or amcharts references anywhere in src/components/ui/drawer
const drawerFiles = fs.readdirSync('src/components/ui/drawer');
let hasBannedImport = false;
for (const file of drawerFiles) {
  const content = fs.readFileSync(path.join('src/components/ui/drawer', file), 'utf8');
  if (/axios/i.test(content) || /amcharts/i.test(content)) {
    hasBannedImport = true;
  }
}
assert(!hasBannedImport, 'src/components/ui/drawer files have 0 references to axios or amcharts');

// Check 3: Check React 19 Client Component boundaries across all 9 drawer files
let allHaveUseClient = true;
for (const file of drawerFiles) {
  const content = fs.readFileSync(path.join('src/components/ui/drawer', file), 'utf8');
  const firstLine = content.split('\n')[0].trim();
  if (firstLine !== "'use client';" && firstLine !== '"use client";') {
    allHaveUseClient = false;
    console.error(`Missing 'use client' in ${file}: "${firstLine}"`);
  }
}
assert(allHaveUseClient, 'All 9 drawer files strictly declare "use client" on line 1');

// -----------------------------------------------------------------------------
// ADVERSARIAL SUITE 4: Accessibility Hardening in Drawer.jsx
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Accessibility Hardening in Drawer.jsx ---');

// Check inert attribute in Drawer.jsx
assert(drawerSrc.includes('inert={!isOpen ? true : undefined}'), 'Drawer.jsx binds inert={!isOpen ? true : undefined}');

// Check invisible class on closed drawers
assert(drawerSrc.includes('invisible'), 'Drawer.jsx applies invisible class when !isOpen');

// Check resolved accessible naming
assert(drawerSrc.includes('const resolvedAriaLabelledBy = ariaLabelledBy || undefined;'), 'Drawer.jsx resolves ariaLabelledBy properly');
assert(drawerSrc.includes('aria-label={resolvedAriaLabel}'), 'Drawer.jsx binds resolved aria-label');
assert(drawerSrc.includes('aria-labelledby={resolvedAriaLabelledBy}'), 'Drawer.jsx binds resolved aria-labelledby');

await browser.close();

console.log('\n================================================================');
console.log(`TOTAL PASSED: ${passed}`);
console.log(`TOTAL FAILED: ${failed}`);
console.log('================================================================\n');

process.exit(failed > 0 ? 1 : 0);
