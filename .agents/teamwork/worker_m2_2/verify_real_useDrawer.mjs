import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import swc from 'next/dist/build/swc/index.js';
import React from 'react';
import { renderToString } from 'react-dom/server';

await swc.loadBindings();

// Read actual implementation directly from source file
const useDrawerContent = fs.readFileSync('src/components/ui/drawer/useDrawer.js', 'utf8');

// Extract FOCUSABLE_SELECTOR definition and getFocusableElements function from useDrawerContent
const selectorMatch = useDrawerContent.match(/export const FOCUSABLE_SELECTOR = (\[[\s\S]*?\]\.join\(', '\));/);
if (!selectorMatch) {
  throw new Error('Could not find FOCUSABLE_SELECTOR in src/components/ui/drawer/useDrawer.js');
}

const funcMatch = useDrawerContent.match(/export function getFocusableElements\(container\) \{([\s\S]*?\n\})/);
if (!funcMatch) {
  throw new Error('Could not find getFocusableElements in src/components/ui/drawer/useDrawer.js');
}

console.log('Successfully extracted FOCUSABLE_SELECTOR and getFocusableElements from src/components/ui/drawer/useDrawer.js');

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

// Inject the real code from useDrawer.js
const testCode = `
  const FOCUSABLE_SELECTOR = ${selectorMatch[1]};
  ${funcMatch[0].replace('export ', '')}
  const container = document.getElementById('test-drawer-container');
  const matched = getFocusableElements(container);
  return matched.map(el => el.id);
`;

const matchedIds = await page.evaluate(new Function(testCode));

console.log('Real useDrawer.js matched IDs:', matchedIds);

const expectedIds = [
  'btn-standard',
  'link-standard',
  'input-standard',
  'select-standard',
  'textarea-standard',
  'div-tabindex-0',
  'editable-div',
];

const unexpectedIds = [
  'btn-disabled',
  'input-disabled',
  'select-disabled',
  'textarea-disabled',
  'link-no-href',
  'input-hidden',
  'div-tabindex-minus-1',
  'btn-tabindex-minus-1',
  'link-tabindex-minus-1',
  'input-tabindex-minus-1',
  'select-tabindex-minus-1',
  'textarea-tabindex-minus-1',
  'btn-display-none',
  'btn-visibility-hidden',
  'btn-in-hidden-parent',
];

let allPassed = true;
for (const id of expectedIds) {
  if (!matchedIds.includes(id)) {
    console.error(`FAIL: Expected ID "${id}" was not matched`);
    allPassed = false;
  }
}

for (const id of unexpectedIds) {
  if (matchedIds.includes(id)) {
    console.error(`FAIL: Excluded ID "${id}" was unexpectedly matched`);
    allPassed = false;
  }
}

if (allPassed && matchedIds.length === expectedIds.length) {
  console.log('ALL ASSERTIONS PASSED: 100% genuine extraction from useDrawer.js verified!');
} else {
  console.error('ASSERTION FAILED!');
  process.exit(1);
}

await browser.close();
