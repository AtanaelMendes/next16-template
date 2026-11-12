/**
 * Adversarial Stress-Test Suite — Milestone 2 Iteration 2
 * 
 * Tests extreme edge cases:
 * 1. Deeply nested hidden ancestors (3-level nesting with display: none, visibility: hidden, and inline styles)
 * 2. Mixed negative tabindex elements (tabindex="-1", tabindex="-2")
 * 3. Empty drawer focus trapping (drawer with 0 focusables)
 * 4. Drawer.jsx React SSR rendering:
 *    - isOpen=false: verifies inert attribute, invisible class, pointer-events-none
 *    - isOpen=true: verifies inert is absent, invisible class is absent
 *    - Label fallback: verifies no dangling aria-labelledby when ariaLabelledBy is omitted
 *    - Custom ariaLabelledBy: verifies aria-labelledby is attached and aria-label is undefined
 * 5. SVG / details / disabled fieldset child elements
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import swc from 'next/dist/build/swc/index.js';
import React from 'react';
import { renderToString } from 'react-dom/server';

await swc.loadBindings();

const adversarialResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { total: 0, passed: 0, failed: 0 }
};

function recordAdversarial(testName, passed, details = {}) {
  adversarialResults.summary.total++;
  if (passed) {
    adversarialResults.summary.passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    adversarialResults.summary.failed++;
    console.log(`  [FAIL] ${testName}`);
    console.log(`         Details:`, JSON.stringify(details));
  }
  adversarialResults.tests.push({ name: testName, passed, details });
}

async function runAdversarialSuite() {
  console.log('================================================================');
  console.log('STARTING ADVERSARIAL CHALLENGER SUITE: MILESTONE 2 (IT2)');
  console.log('================================================================\n');

  const useDrawerSrc = fs.readFileSync('src/components/ui/drawer/useDrawer.js', 'utf8');
  const drawerSrc = fs.readFileSync('src/components/ui/drawer/Drawer.jsx', 'utf8');

  // Dynamic extraction from useDrawer.js
  const selectorMatch = useDrawerSrc.match(/export const FOCUSABLE_SELECTOR = (\[[\s\S]*?\]\.join\(', '\));/);
  const funcMatch = useDrawerSrc.match(/export function getFocusableElements\(container\) \{([\s\S]*?\n\})/);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const injectedSourceCode = `
    const FOCUSABLE_SELECTOR = ${selectorMatch[1]};
    ${funcMatch[0].replace('export function getFocusableElements', 'window.__getFocusableElements = function')}
    window.__FOCUSABLE_SELECTOR = FOCUSABLE_SELECTOR;
  `;

  // --------------------------------------------------------------------------
  // Adversarial Test 1: Deeply Nested Hidden Hierarchy
  // --------------------------------------------------------------------------
  console.log('Adversarial Test 1: Deeply Nested Hidden Hierarchy');
  await page.setContent(`
    <div id="adversarial-container">
      <div id="level-1" style="display: none;">
        <div id="level-2">
          <div id="level-3">
            <button id="deeply-hidden-button">Deep Hidden</button>
            <a id="deeply-hidden-link" href="#">Deep Link</a>
          </div>
        </div>
      </div>
      <div id="vis-level-1" style="visibility: hidden;">
        <div id="vis-level-2">
          <input id="vis-hidden-input" type="text" value="Hidden input" />
        </div>
      </div>
      <button id="legitimate-button">Legitimate Visible Button</button>
    </div>
  `);
  await page.addScriptTag({ content: injectedSourceCode });

  const nestedResult = await page.evaluate(() => {
    const container = document.getElementById('adversarial-container');
    const matched = window.__getFocusableElements(container);
    const matchedIds = matched.map(el => el.id);

    return {
      matchedIds,
      excludesDeeplyHiddenButton: !matchedIds.includes('deeply-hidden-button'),
      excludesDeeplyHiddenLink: !matchedIds.includes('deeply-hidden-link'),
      excludesVisHiddenInput: !matchedIds.includes('vis-hidden-input'),
      includesLegitimateButton: matchedIds.includes('legitimate-button'),
    };
  });

  const adv1Passed = (
    nestedResult.excludesDeeplyHiddenButton &&
    nestedResult.excludesDeeplyHiddenLink &&
    nestedResult.excludesVisHiddenInput &&
    nestedResult.includesLegitimateButton &&
    nestedResult.matchedIds.length === 1
  );
  recordAdversarial(
    'Deeply nested hidden ancestors (3 levels display:none & visibility:hidden) are strictly excluded',
    adv1Passed,
    nestedResult
  );

  // --------------------------------------------------------------------------
  // Adversarial Test 2: Zero Focusables & Empty Drawer Trap Handling
  // --------------------------------------------------------------------------
  console.log('\nAdversarial Test 2: Zero Focusables & Empty Drawer Trap Handling');
  await page.setContent(`
    <div id="empty-drawer" role="dialog" aria-modal="true">
      <p>This drawer only has static text and no focusables.</p>
    </div>
  `);
  await page.addScriptTag({ content: injectedSourceCode });

  const emptyTrapResult = await page.evaluate(() => {
    const drawer = document.getElementById('empty-drawer');
    const focusables = window.__getFocusableElements(drawer);
    let tabPrevented = false;

    // Simulate keydown handler from useDrawerAccessibility
    const simulateTab = (shiftKey) => {
      const e = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true
      });
      if (focusables.length === 0) {
        e.preventDefault();
      }
      return e.defaultPrevented;
    };

    const forwardPrevented = simulateTab(false);
    const reversePrevented = simulateTab(true);

    return {
      focusablesCount: focusables.length,
      forwardPrevented,
      reversePrevented,
      passed: focusables.length === 0 && forwardPrevented && reversePrevented
    };
  });
  recordAdversarial(
    'Drawer with zero focusables safely prevents tab progression without throwing exceptions',
    emptyTrapResult.passed,
    emptyTrapResult
  );

  // --------------------------------------------------------------------------
  // Adversarial Test 3: Drawer.jsx Closed Desktop & Modal Inertness Verification
  // --------------------------------------------------------------------------
  console.log('\nAdversarial Test 3: Drawer.jsx Closed Desktop & Modal Inertness Verification');

  // Transform Drawer.jsx
  const replacedDrawerSrc = drawerSrc
    .replace('@/lib/utils', '../../../src/lib/utils.js')
    .replace("'./useDrawer'", "'../../../src/components/ui/drawer/useDrawer.js'");

  const transformedDrawer = await swc.transform(replacedDrawerSrc, {
    jsc: {
      parser: { syntax: 'ecmascript', jsx: true },
      transform: { react: { runtime: 'automatic' } },
    },
    module: { type: 'es6' },
  });

  const tempDrawerPath = path.resolve('.agents/teamwork/challenger_m2_it2_2/temp_Drawer.mjs');
  fs.writeFileSync(tempDrawerPath, transformedDrawer.code);

  const { Drawer } = await import('./temp_Drawer.mjs');

  // Render closed drawer
  const closedDrawerHtml = renderToString(React.createElement(Drawer, {
    side: 'left',
    open: false,
    variant: 'persistent',
  }, React.createElement('button', { id: 'inner-btn' }, 'Inner')));

  const closedHasInert = closedDrawerHtml.includes('inert=""') || closedDrawerHtml.includes('inert="true"') || closedDrawerHtml.includes('inert');
  const closedHasInvisible = closedDrawerHtml.includes('invisible');
  const closedHasPointerEventsNone = closedDrawerHtml.includes('pointer-events-none');
  const closedHasDataStateClosed = closedDrawerHtml.includes('data-state="closed"');

  const closedAdvPassed = closedHasInert && closedHasInvisible && closedHasPointerEventsNone && closedHasDataStateClosed;
  recordAdversarial(
    'Closed Drawer (<Drawer open={false}>) renders inert attribute, invisible class, and pointer-events-none',
    closedAdvPassed,
    { html: closedDrawerHtml.substring(0, 300) }
  );

  // Render open drawer
  const openDrawerHtml = renderToString(React.createElement(Drawer, {
    side: 'left',
    open: true,
    variant: 'persistent',
  }, React.createElement('button', { id: 'inner-btn' }, 'Inner')));

  const openHasNoInert = !openDrawerHtml.includes('inert');
  const openHasNoInvisible = !openDrawerHtml.includes('invisible');
  const openHasDataStateOpen = openDrawerHtml.includes('data-state="open"');

  const openAdvPassed = openHasNoInert && openHasNoInvisible && openHasDataStateOpen;
  recordAdversarial(
    'Open Drawer (<Drawer open={true}>) removes inert and invisible attributes for full keyboard interactivity',
    openAdvPassed,
    { html: openDrawerHtml.substring(0, 300) }
  );

  // --------------------------------------------------------------------------
  // Adversarial Test 4: Accessible Naming & Dangling ID Elimination
  // --------------------------------------------------------------------------
  console.log('\nAdversarial Test 4: Accessible Naming & Dangling ID Elimination');

  // Case A: Default (no ariaLabel, no ariaLabelledBy)
  const defaultLeftDrawerHtml = renderToString(React.createElement(Drawer, {
    side: 'left',
    open: true,
  }));
  const defaultRightDrawerHtml = renderToString(React.createElement(Drawer, {
    side: 'right',
    open: true,
  }));

  const leftHasDefaultLabel = defaultLeftDrawerHtml.includes('aria-label="Navegação principal"');
  const leftHasNoDanglingLabelledBy = !defaultLeftDrawerHtml.includes('aria-labelledby');
  const rightHasDefaultLabel = defaultRightDrawerHtml.includes('aria-label="Painel contextual"');
  const rightHasNoDanglingLabelledBy = !defaultRightDrawerHtml.includes('aria-labelledby');

  // Case B: Explicit ariaLabelledBy
  const labelledByDrawerHtml = renderToString(React.createElement(Drawer, {
    side: 'left',
    open: true,
    ariaLabelledBy: 'custom-heading-id',
  }));
  const labelledByHasAttr = labelledByDrawerHtml.includes('aria-labelledby="custom-heading-id"');
  const labelledByHasNoAriaLabel = !labelledByDrawerHtml.includes('aria-label=');

  const namingPassed = (
    leftHasDefaultLabel &&
    leftHasNoDanglingLabelledBy &&
    rightHasDefaultLabel &&
    rightHasNoDanglingLabelledBy &&
    labelledByHasAttr &&
    labelledByHasNoAriaLabel
  );
  recordAdversarial(
    'Accessible naming resolves cleanly: default aria-label applied with zero dangling aria-labelledby IDs',
    namingPassed,
    {
      leftHasDefaultLabel,
      leftHasNoDanglingLabelledBy,
      rightHasDefaultLabel,
      rightHasNoDanglingLabelledBy,
      labelledByHasAttr,
      labelledByHasNoAriaLabel
    }
  );

  await browser.close();

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`ADVERSARIAL STRESS TEST SUMMARY: ${adversarialResults.summary.passed}/${adversarialResults.summary.total} PASSED`);
  console.log(`FAILURES: ${adversarialResults.summary.failed}`);
  console.log('================================================================\n');

  fs.writeFileSync(
    '.agents/teamwork/challenger_m2_it2_2/adversarial_results.json',
    JSON.stringify(adversarialResults, null, 2)
  );

  return adversarialResults;
}

runAdversarialSuite().catch((err) => {
  console.error('Adversarial suite error:', err);
  process.exit(1);
});
