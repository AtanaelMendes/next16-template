import { test, expect, Page, Locator } from '@playwright/test';

// Helper locators for drawer component contracts
function getLeftDrawer(page: Page): Locator {
  return page.locator('[data-testid="left-drawer"]');
}

function getRightDrawer(page: Page): Locator {
  return page.locator('[data-testid="right-drawer"]');
}

function getLeftToggle(page: Page): Locator {
  return page.locator('[data-testid="left-drawer-toggle"]');
}

function getRightToggle(page: Page): Locator {
  return page.locator('[data-testid="right-drawer-toggle"]');
}

function getMainContent(page: Page): Locator {
  return page.locator('[data-testid="dashboard-main"], main').first();
}

function getBackdrop(page: Page): Locator {
  return page.locator('[data-testid="drawer-backdrop"], [data-testid="drawer-overlay"]');
}

// Wait for the client theme provider to mount. Until hydration completes,
// clicks on server-rendered buttons have no React handler attached.
async function gotoDashboard(page: Page) {
  await page.goto('/');
  await page.waitForSelector('html[data-theme-ready="true"]', { state: 'attached' });
}

// Helper to ensure Left Drawer is open
async function ensureLeftDrawerOpen(page: Page) {
  const toggle = getLeftToggle(page);
  const isExpanded = await toggle.getAttribute('aria-expanded');
  if (isExpanded !== 'true') {
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  }
  await expect(getLeftDrawer(page)).toHaveAttribute('data-state', 'open');
}

// Helper to ensure Left Drawer is closed or collapsed
async function ensureLeftDrawerClosed(page: Page) {
  const toggle = getLeftToggle(page);
  const isExpanded = await toggle.getAttribute('aria-expanded');
  if (isExpanded === 'true') {
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  }
  await expect(getLeftDrawer(page)).toHaveAttribute('data-state', /closed|collapsed/);
}

// Helper to ensure Right Drawer is open
async function ensureRightDrawerOpen(page: Page) {
  const toggle = getRightToggle(page);
  const isExpanded = await toggle.getAttribute('aria-expanded');
  if (isExpanded !== 'true') {
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  }
  await expect(getRightDrawer(page)).toHaveAttribute('data-state', 'open');
}

// Helper to ensure Right Drawer is closed
async function ensureRightDrawerClosed(page: Page) {
  const toggle = getRightToggle(page);
  const isExpanded = await toggle.getAttribute('aria-expanded');
  if (isExpanded === 'true') {
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  }
  await expect(getRightDrawer(page)).toHaveAttribute('data-state', 'closed');
}

test.describe('Dual Drawer Architecture & Accessibility E2E Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to root dashboard
    await gotoDashboard(page);
  });

  // --------------------------------------------------------------------------
  // Scenario 1: Left Drawer opens and closes
  // --------------------------------------------------------------------------
  test('Scenario 1: Left Drawer opens and closes with correct states and ARIA', async ({ page }) => {
    const leftToggle = getLeftToggle(page);
    const leftDrawer = getLeftDrawer(page);

    await expect(leftToggle).toBeVisible();
    await expect(leftDrawer).toBeAttached();

    // Verify unconditional aria-controls and aria-label contract
    await expect(leftToggle).toHaveAttribute('aria-controls', 'left-drawer');
    await expect(leftToggle).toHaveAttribute('aria-label', /.+/);

    // Capture initial state
    const initialExpanded = await leftToggle.getAttribute('aria-expanded');

    if (initialExpanded === 'true') {
      // Step A: Close the Left Drawer
      await leftToggle.click();
      await expect(leftToggle).toHaveAttribute('aria-expanded', 'false');
      await expect(leftDrawer).toHaveAttribute('data-state', /closed|collapsed/);

      // Step B: Reopen the Left Drawer
      await leftToggle.click();
      await expect(leftToggle).toHaveAttribute('aria-expanded', 'true');
      await expect(leftDrawer).toHaveAttribute('data-state', 'open');
    } else {
      // Step A: Open the Left Drawer
      await leftToggle.click();
      await expect(leftToggle).toHaveAttribute('aria-expanded', 'true');
      await expect(leftDrawer).toHaveAttribute('data-state', 'open');

      // Step B: Close the Left Drawer
      await leftToggle.click();
      await expect(leftToggle).toHaveAttribute('aria-expanded', 'false');
      await expect(leftDrawer).toHaveAttribute('data-state', /closed|collapsed/);
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Right Drawer opens and closes
  // --------------------------------------------------------------------------
  test('Scenario 2: Right Drawer opens and closes with correct states and ARIA', async ({ page }) => {
    const rightToggle = getRightToggle(page);
    const rightDrawer = getRightDrawer(page);

    await expect(rightToggle).toBeVisible();
    await expect(rightDrawer).toBeAttached();

    // Verify unconditional aria-controls and aria-label contract
    await expect(rightToggle).toHaveAttribute('aria-controls', 'right-drawer');
    await expect(rightToggle).toHaveAttribute('aria-label', /.+/);

    // Right Drawer typically starts closed on desktop
    await ensureRightDrawerClosed(page);
    await expect(rightToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(rightDrawer).toHaveAttribute('data-state', 'closed');

    // Open Right Drawer
    await rightToggle.click();
    await expect(rightToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(rightDrawer).toBeVisible();
    await expect(rightDrawer).toHaveAttribute('data-state', 'open');

    // Close Right Drawer
    await rightToggle.click();
    await expect(rightToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(rightDrawer).toHaveAttribute('data-state', 'closed');
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Independent drawer states (all permutations & simultaneous open)
  // --------------------------------------------------------------------------
  test('Scenario 3: Each drawer maintains independent state across all permutations', async ({ page }) => {
    // Lock viewport to Desktop size to satisfy simultaneous open desktop contract
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoDashboard(page);

    const leftDrawer = getLeftDrawer(page);
    const rightDrawer = getRightDrawer(page);
    const leftToggle = getLeftToggle(page);
    const rightToggle = getRightToggle(page);

    // Permutation 1: Left Open, Right Closed
    await ensureLeftDrawerOpen(page);
    await ensureRightDrawerClosed(page);
    await expect(leftDrawer).toHaveAttribute('data-state', 'open');
    await expect(rightDrawer).toHaveAttribute('data-state', 'closed');
    await expect(leftToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(rightToggle).toHaveAttribute('aria-expanded', 'false');

    // Permutation 2: Both Open Simultaneously (Desktop)
    await rightToggle.click();
    await expect(rightDrawer).toHaveAttribute('data-state', 'open');
    await expect(rightToggle).toHaveAttribute('aria-expanded', 'true');
    // Crucial requirement: Left drawer MUST remain open
    await expect(leftDrawer).toHaveAttribute('data-state', 'open');
    await expect(leftToggle).toHaveAttribute('aria-expanded', 'true');

    // Permutation 3: Left Closed, Right Open
    await leftToggle.click();
    await expect(leftDrawer).toHaveAttribute('data-state', /closed|collapsed/);
    await expect(leftToggle).toHaveAttribute('aria-expanded', 'false');
    // Right drawer MUST remain open
    await expect(rightDrawer).toHaveAttribute('data-state', 'open');
    await expect(rightToggle).toHaveAttribute('aria-expanded', 'true');

    // Permutation 4: Both Closed
    await rightToggle.click();
    await expect(rightDrawer).toHaveAttribute('data-state', 'closed');
    await expect(rightToggle).toHaveAttribute('aria-expanded', 'false');
    // Left drawer MUST remain closed
    await expect(leftDrawer).toHaveAttribute('data-state', /closed|collapsed/);
    await expect(leftToggle).toHaveAttribute('aria-expanded', 'false');
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Toggle button permanently accessible
  // --------------------------------------------------------------------------
  test('Scenario 4: Toggle buttons remain permanently visible, positioned, and actionable', async ({ page }) => {
    const viewports = [
      { name: 'Desktop', width: 1280, height: 800 },
      { name: 'Mobile', width: 375, height: 667 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoDashboard(page);

      const leftToggle = getLeftToggle(page);
      const rightToggle = getRightToggle(page);

      // Verify visibility & enablement in initial state
      await expect(leftToggle).toBeVisible();
      await expect(leftToggle).toBeEnabled();
      await expect(rightToggle).toBeVisible();
      await expect(rightToggle).toBeEnabled();

      // Verify unconditional ARIA contract
      await expect(leftToggle).toHaveAttribute('aria-controls', 'left-drawer');
      await expect(leftToggle).toHaveAttribute('aria-label', /.+/);
      await expect(rightToggle).toHaveAttribute('aria-controls', 'right-drawer');
      await expect(rightToggle).toHaveAttribute('aria-label', /.+/);

      // Verify bounding boxes are within the viewport
      const leftBoxInitial = await leftToggle.boundingBox();
      expect(leftBoxInitial).not.toBeNull();
      expect(leftBoxInitial!.x).toBeGreaterThanOrEqual(0);
      expect(leftBoxInitial!.y).toBeGreaterThanOrEqual(0);
      expect(leftBoxInitial!.x + leftBoxInitial!.width).toBeLessThanOrEqual(vp.width + 10);

      const rightBoxInitial = await rightToggle.boundingBox();
      expect(rightBoxInitial).not.toBeNull();
      expect(rightBoxInitial!.x).toBeGreaterThanOrEqual(0);
      expect(rightBoxInitial!.y).toBeGreaterThanOrEqual(0);
      expect(rightBoxInitial!.x + rightBoxInitial!.width).toBeLessThanOrEqual(vp.width + 10);

      // Verify actionability via trial clicks
      await leftToggle.click({ trial: true });
      await rightToggle.click({ trial: true });

      // Open Left Drawer and verify left toggle remains accessible
      await leftToggle.click();
      await expect(leftToggle).toBeVisible();
      await expect(leftToggle).toBeEnabled();
      const leftBoxOpen = await leftToggle.boundingBox();
      expect(leftBoxOpen).not.toBeNull();
      expect(leftBoxOpen!.x).toBeGreaterThanOrEqual(0);
      expect(leftBoxOpen!.y).toBeGreaterThanOrEqual(0);
      expect(leftBoxOpen!.x + leftBoxOpen!.width).toBeLessThanOrEqual(vp.width + 10);
      await leftToggle.click({ trial: true });

      // Clean up / close left drawer
      if (vp.width <= 768) {
        await page.keyboard.press('Escape');
      } else {
        await leftToggle.click();
      }

      // Open Right Drawer and verify right toggle remains accessible
      await rightToggle.click();
      await expect(rightToggle).toBeVisible();
      await expect(rightToggle).toBeEnabled();
      const rightBoxOpen = await rightToggle.boundingBox();
      expect(rightBoxOpen).not.toBeNull();
      expect(rightBoxOpen!.x).toBeGreaterThanOrEqual(0);
      expect(rightBoxOpen!.y).toBeGreaterThanOrEqual(0);
      expect(rightBoxOpen!.x + rightBoxOpen!.width).toBeLessThanOrEqual(vp.width + 10);
      await rightToggle.click({ trial: true });

      // Clean up / close right drawer
      if (vp.width <= 768) {
        await page.keyboard.press('Escape');
      } else {
        await rightToggle.click();
      }
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Closed drawer can be reopened reliably (Multiple reopen cycles)
  // --------------------------------------------------------------------------
  test('Scenario 5: Closed drawers can be reopened repeatedly across multiple cycles', async ({ page }) => {
    const leftToggle = getLeftToggle(page);
    const leftDrawer = getLeftDrawer(page);
    const rightToggle = getRightToggle(page);
    const rightDrawer = getRightDrawer(page);

    // 3 complete cycles for Left Drawer
    for (let cycle = 1; cycle <= 3; cycle++) {
      // Close
      await ensureLeftDrawerClosed(page);
      await expect(leftDrawer).toHaveAttribute('data-state', /closed|collapsed/);

      // Reopen
      await leftToggle.click();
      await expect(leftToggle).toHaveAttribute('aria-expanded', 'true');
      await expect(leftDrawer).toHaveAttribute('data-state', 'open');
      await expect(leftDrawer).toBeVisible();
    }

    // 3 complete cycles for Right Drawer
    for (let cycle = 1; cycle <= 3; cycle++) {
      // Open
      await ensureRightDrawerOpen(page);
      await expect(rightDrawer).toHaveAttribute('data-state', 'open');
      await expect(rightDrawer).toBeVisible();

      // Close
      await rightToggle.click();
      await expect(rightToggle).toHaveAttribute('aria-expanded', 'false');
      await expect(rightDrawer).toHaveAttribute('data-state', 'closed');
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Layout adapts to states without horizontal overflow
  // --------------------------------------------------------------------------
  test('Scenario 6: Dashboard layout dynamically adjusts width with zero horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoDashboard(page);

    const mainContent = getMainContent(page);
    const leftToggle = getLeftToggle(page);
    const rightToggle = getRightToggle(page);

    await expect(mainContent).toBeVisible();

    // Helper to assert no horizontal page overflow
    async function assertNoHorizontalOverflow() {
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasOverflow, 'document.documentElement should not have horizontal overflow').toBe(false);
    }

    // State A: Both drawers closed
    await ensureLeftDrawerClosed(page);
    await ensureRightDrawerClosed(page);
    await assertNoHorizontalOverflow();
    const widthBothClosed = (await mainContent.boundingBox())!.width;

    // State B: Left drawer open, right closed
    await ensureLeftDrawerOpen(page);
    await assertNoHorizontalOverflow();
    const widthLeftOpen = (await mainContent.boundingBox())!.width;
    // Central content area should shrink or accommodate drawer
    expect(widthLeftOpen).toBeLessThanOrEqual(widthBothClosed);

    // State C: Both drawers open simultaneously
    await ensureRightDrawerOpen(page);
    await assertNoHorizontalOverflow();
    const widthBothOpen = (await mainContent.boundingBox())!.width;
    expect(widthBothOpen).toBeLessThan(widthLeftOpen);

    // State D: Left closed, right open
    await ensureLeftDrawerClosed(page);
    await assertNoHorizontalOverflow();
    const widthRightOnlyOpen = (await mainContent.boundingBox())!.width;
    expect(widthRightOnlyOpen).toBeGreaterThan(widthBothOpen);
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Mobile behavior (Overlay backdrop, click backdrop dismisses, body scroll lock)
  // --------------------------------------------------------------------------
  test('Scenario 7: Mobile temporary drawer renders overlay backdrop, locks scroll, and closes on backdrop click', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoDashboard(page);

    const leftToggle = getLeftToggle(page);
    const leftDrawer = getLeftDrawer(page);
    const rightToggle = getRightToggle(page);
    const rightDrawer = getRightDrawer(page);
    const backdrop = getBackdrop(page);

    // Initial state: body overflow unlocked
    const initialOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(initialOverflow).not.toBe('hidden');

    // ------------------------------------------------------------------------
    // Part A: Left Drawer mobile overlay, scroll lock, and backdrop dismissal
    // ------------------------------------------------------------------------
    await leftToggle.click();
    await expect(leftDrawer).toBeVisible();
    await expect(leftDrawer).toHaveAttribute('data-state', 'open');
    await expect(backdrop).toBeVisible();

    // Verify body scroll lock is applied
    const lockedOverflowLeft = await page.evaluate(() => document.body.style.overflow);
    expect(lockedOverflowLeft).toBe('hidden');

    // Dismiss drawer by clicking backdrop outside the left drawer panel (e.g. right side x=350)
    const backdropBoxLeft = await backdrop.boundingBox();
    expect(backdropBoxLeft).not.toBeNull();
    await backdrop.click({ position: { x: Math.min(350, backdropBoxLeft!.width - 10), y: 150 } });

    // Verify drawer and backdrop are dismissed
    await expect(backdrop).toBeHidden();
    await expect(leftDrawer).toHaveAttribute('data-state', /closed|collapsed/);

    // Verify body scroll is unlocked
    const restoredOverflowLeft = await page.evaluate(() => document.body.style.overflow);
    expect(restoredOverflowLeft).not.toBe('hidden');

    // ------------------------------------------------------------------------
    // Part B: Right Drawer mobile overlay, scroll lock, and backdrop dismissal
    // ------------------------------------------------------------------------
    await rightToggle.click();
    await expect(rightDrawer).toBeVisible();
    await expect(rightDrawer).toHaveAttribute('data-state', 'open');
    await expect(backdrop).toBeVisible();

    // Verify body scroll lock is applied
    const lockedOverflowRight = await page.evaluate(() => document.body.style.overflow);
    expect(lockedOverflowRight).toBe('hidden');

    // Dismiss drawer by clicking backdrop outside the right drawer panel (left side x=20 on mobile)
    await backdrop.click({ position: { x: 20, y: 150 } });

    // Verify Right Drawer and backdrop are dismissed
    await expect(backdrop).toBeHidden();
    await expect(rightDrawer).toHaveAttribute('data-state', 'closed');

    // Verify body scroll is unlocked
    const restoredOverflowRight = await page.evaluate(() => document.body.style.overflow);
    expect(restoredOverflowRight).not.toBe('hidden');
  });

  // --------------------------------------------------------------------------
  // Scenario 8: ESC key dismisses temporary drawer
  // --------------------------------------------------------------------------
  test('Scenario 8: ESC key dismisses temporary drawer and restores page state', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoDashboard(page);

    const leftToggle = getLeftToggle(page);
    const leftDrawer = getLeftDrawer(page);
    const rightToggle = getRightToggle(page);
    const rightDrawer = getRightDrawer(page);
    const backdrop = getBackdrop(page);

    // ------------------------------------------------------------------------
    // Part A: Left Drawer dismissal via ESC
    // ------------------------------------------------------------------------
    await leftToggle.click();
    await expect(leftDrawer).toBeVisible();
    await expect(leftDrawer).toHaveAttribute('data-state', 'open');
    await expect(backdrop).toBeVisible();

    // Verify scroll locked
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    // Press ESC key
    await page.keyboard.press('Escape');

    // Verify drawer and overlay dismissed
    await expect(backdrop).toBeHidden();
    await expect(leftDrawer).toHaveAttribute('data-state', /closed|collapsed/);

    // Verify scroll lock removed
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');

    // ------------------------------------------------------------------------
    // Part B: Right Drawer dismissal via ESC
    // ------------------------------------------------------------------------
    await rightToggle.click();
    await expect(rightDrawer).toBeVisible();
    await expect(rightDrawer).toHaveAttribute('data-state', 'open');
    await expect(backdrop).toBeVisible();

    // Verify scroll locked
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    // Press ESC key
    await page.keyboard.press('Escape');

    // Verify drawer and overlay dismissed
    await expect(backdrop).toBeHidden();
    await expect(rightDrawer).toHaveAttribute('data-state', 'closed');

    // Verify scroll lock removed
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Keyboard navigation (Trigger with Enter/Space, focus inside, trap, return focus)
  // --------------------------------------------------------------------------
  test('Scenario 9: Keyboard navigation operates drawer, traps focus inside, and returns focus to trigger', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoDashboard(page);

    const leftToggle = getLeftToggle(page);
    const leftDrawer = getLeftDrawer(page);

    // Step 1: Keyboard Activation on Toggle (Space and Enter support)
    // Part A: Open and close using Space key
    await ensureLeftDrawerClosed(page);
    await leftToggle.focus();
    await expect(leftToggle).toBeFocused();
    await page.keyboard.press('Space');
    await expect(leftDrawer).toHaveAttribute('data-state', 'open');

    // Close toggle via Space key
    await leftToggle.focus();
    await page.keyboard.press('Space');
    await expect(leftDrawer).toHaveAttribute('data-state', /closed|collapsed/);

    // Part B: Open toggle using Enter key
    await leftToggle.focus();
    await expect(leftToggle).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(leftDrawer).toHaveAttribute('data-state', 'open');

    // Step 2: Focus moves inside the drawer container (polled assertion)
    await expect.poll(async () => {
      return page.evaluate(() => {
        const drawerEl = document.querySelector('[data-testid="left-drawer"]');
        return drawerEl ? drawerEl.contains(document.activeElement) : false;
      });
    }, {
      message: 'Focus should move inside left-drawer container when opened in mobile mode',
      timeout: 5000,
    }).toBe(true);

    // Step 3: Focus Trap Cycling & Wrapping
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const focusableCount = await page.evaluate((sel) => {
      const drawer = document.querySelector('[data-testid="left-drawer"]');
      if (!drawer) return 0;
      const elements = Array.from(drawer.querySelectorAll(sel)) as HTMLElement[];
      const visible = elements.filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      return visible.length;
    }, focusableSelector);

    expect(focusableCount, 'Left drawer should contain focusable elements for navigation').toBeGreaterThan(0);

    // Focus the first interactive element inside drawer
    await page.evaluate((sel) => {
      const drawer = document.querySelector('[data-testid="left-drawer"]');
      const elements = Array.from(drawer?.querySelectorAll(sel) || []) as HTMLElement[];
      const visible = elements.filter(el => window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden');
      if (visible.length > 0) visible[0].focus();
    }, focusableSelector);

    // Press Shift+Tab on first element -> focus wraps to the last focusable element
    await page.keyboard.press('Shift+Tab');
    await expect.poll(async () => {
      return page.evaluate((sel) => {
        const drawer = document.querySelector('[data-testid="left-drawer"]');
        const elements = Array.from(drawer?.querySelectorAll(sel) || []) as HTMLElement[];
        const visible = elements.filter(el => window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden');
        return visible.length > 0 && document.activeElement === visible[visible.length - 1];
      }, focusableSelector);
    }, { message: 'Shift+Tab on first element should wrap focus to the last element' }).toBe(true);

    // Press Tab on last element -> focus wraps back to the first focusable element
    await page.keyboard.press('Tab');
    await expect.poll(async () => {
      return page.evaluate((sel) => {
        const drawer = document.querySelector('[data-testid="left-drawer"]');
        const elements = Array.from(drawer?.querySelectorAll(sel) || []) as HTMLElement[];
        const visible = elements.filter(el => window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden');
        return visible.length > 0 && document.activeElement === visible[0];
      }, focusableSelector);
    }, { message: 'Tab on last element should wrap focus back to the first element' }).toBe(true);

    // Tab continuous cycling check: ensure focus never escapes the drawer
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      const isStillTrapped = await page.evaluate(() => {
        const drawerEl = document.querySelector('[data-testid="left-drawer"]');
        return drawerEl ? drawerEl.contains(document.activeElement) : false;
      });
      expect(isStillTrapped, `Focus escaped drawer at Tab press #${i + 1}`).toBe(true);
    }

    // Step 4: Dismiss via ESC key
    await page.keyboard.press('Escape');
    await expect(leftDrawer).toHaveAttribute('data-state', /closed|collapsed/);

    // Step 5: Focus returns to the original trigger button
    await expect(leftToggle).toBeFocused();
  });

  // --------------------------------------------------------------------------
  // Scenario 10 (Resilience): Rapid toggle clicks do not break state machine
  // --------------------------------------------------------------------------
  test('Resilience: Rapid consecutive toggle clicks do not break state machine or trigger unhandled errors', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    const leftToggle = getLeftToggle(page);
    const leftDrawer = getLeftDrawer(page);
    const rightToggle = getRightToggle(page);
    const rightDrawer = getRightDrawer(page);

    // Rapid consecutive clicks on Left Drawer toggle
    for (let i = 0; i < 6; i++) {
      await leftToggle.click({ delay: 30 });
    }
    await page.waitForTimeout(100);

    const leftState = await leftDrawer.getAttribute('data-state');
    expect(['open', 'closed', 'collapsed']).toContain(leftState);
    const leftExpanded = await leftToggle.getAttribute('aria-expanded');
    expect(leftExpanded).toBe(leftState === 'open' ? 'true' : 'false');

    // Rapid consecutive clicks on Right Drawer toggle
    for (let i = 0; i < 6; i++) {
      await rightToggle.click({ delay: 30 });
    }
    await page.waitForTimeout(100);

    const rightState = await rightDrawer.getAttribute('data-state');
    expect(['open', 'closed']).toContain(rightState);
    const rightExpanded = await rightToggle.getAttribute('aria-expanded');
    expect(rightExpanded).toBe(rightState === 'open' ? 'true' : 'false');

    // Verify zero unhandled browser runtime errors occurred during rapid transitions
    expect(pageErrors).toEqual([]);

    // Verify toggles remain fully functional and responsive after rapid stress
    await leftToggle.click();
    const finalLeftExpanded = await leftToggle.getAttribute('aria-expanded');
    expect(finalLeftExpanded).toBe(leftExpanded === 'true' ? 'false' : 'true');

    await rightToggle.click();
    const finalRightExpanded = await rightToggle.getAttribute('aria-expanded');
    expect(finalRightExpanded).toBe(rightExpanded === 'true' ? 'false' : 'true');
  });

});
