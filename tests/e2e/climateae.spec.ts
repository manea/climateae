import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

async function assertNoHorizontalOverflow(page: Page) {
  const dims = await page.evaluate(() => {
    const main = document.querySelector('main');
    const header = document.querySelector('header');
    const mainRect = main?.getBoundingClientRect();
    const headerRect = header?.getBoundingClientRect();
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      mainWidth: mainRect ? Math.ceil(mainRect.width) : 0,
      headerWidth: headerRect ? Math.ceil(headerRect.width) : 0,
    };
  });
  expect(dims.scrollWidth).toBeLessThanOrEqual(dims.innerWidth);
  expect(dims.mainWidth).toBeLessThanOrEqual(dims.innerWidth);
  expect(dims.headerWidth).toBeLessThanOrEqual(dims.innerWidth);
}

function buildCleanFacilitiesCsv(): string {
  return [
    'facility_id,facility_name,emirate,sector,scope1_tco2e,scope2_tco2e,iso14065_verified,archive_5yr_ready',
    'AD-CLEAN-01,Al Ain Extrusion Site,abu_dhabi,industrial_manufacturing,28000,12000,true,true',
  ].join('\n');
}

test.describe('ClimateAE — UAE Climate Law 11/2024, EAD 03/2026 & NRCC 67/2024 E2E', () => {
  test('defaults to AR RTL Mangrove Vellum, toggles EN LTR Desert Obsidian, and persists across reload', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(page.locator('header')).toContainText('SQLite WAL');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'mangrove-vellum');
    await expect(page.locator('svg[role="img"]').first()).toBeVisible();
    await expect(page.locator('main')).toContainText('70/100');
    await expect(page.locator('main')).toContainText('ليست تابعة');
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/01-workspace-ar-mangrove-vellum.png',
      fullPage: true,
      animations: 'disabled',
    });

    await page.getByTestId('lang-toggle').click();
    await page.getByTestId('theme-toggle').click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'desert-obsidian');
    await expect(page.locator('main')).toContainText('NOT affiliated');
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/02-workspace-en-desert-obsidian.png',
      fullPage: true,
      animations: 'disabled',
    });

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'desert-obsidian');

    expect(errors).toEqual([]);
  });

  test('evaluates Preset 1/2/3 & remediates Preset 3 into sealed CLM-YYYY-0001 with BOM CSV & /r/:code', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const year = new Date().getUTCFullYear();
    const expectedCode = `CLM-${year}-0001`;

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.getByTestId('lang-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // Preset 1: Dubai Free Zone Logistics (Ready 100/100)
    await page.getByTestId('preset-dubai-freezone-logistics-ready').click();
    await expect(page.getByTestId('status-badge')).toContainText('READY · 100/100');

    // Preset 2: Abu Dhabi Industrial >=25k tCO2e (Conditional 70/100, 126d to 2027-03-31)
    await page.getByTestId('preset-abudhabi-industrial-ead-mrv-conditional').click();
    await expect(page.getByTestId('status-badge')).toContainText('CONDITIONAL · 70/100');
    await expect(page.locator('main')).toContainText('2027-03-31');
    await expect(page.locator('main')).toContainText('126d left');
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/03-ead-25k-conditional-desktop.png',
      fullPage: true,
      animations: 'disabled',
    });

    // Preset 3: Abu Dhabi Energy >=500k NRCC (Blocked 0/100, AED 4,000,000, CWE-1236 CSV)
    await page.getByTestId('preset-abudhabi-energy-nrcc-huge-emitter-blocked').click();
    await expect(page.getByTestId('status-badge')).toContainText('BLOCKED · 0/100');
    await expect(page.locator('main')).toContainText('AED 4,000,000');

    // Remediate Preset 3 on Scope tab
    await page.getByLabel('Verifier Accreditation Level').selectOption('iso_14065_accredited');
    await page.getByLabel('Prior Violations Count').fill('0');
    await page.getByLabel('Registered on MOCCAE National MRV (mrv.ae)').check();
    await page.getByLabel('Registered on National Register for Carbon Credits (NRCC)').check();
    await page.getByLabel('5-Year Immutable GHG Activity Data Archive').check();
    await page.getByLabel('Board-Approved Emission Reduction & Adaptation Plan').check();
    await page.getByLabel('Repeat Violation Within 2 Years (2x Fine Multiplier)').uncheck();

    // Check all 6 controls on Controls tab
    await page.getByTestId('tab-controls').click();
    await page.getByRole('button', { name: 'Select All' }).click();

    // Replace injected CSV on CSV tab
    await page.getByTestId('tab-csv').click();
    await page.locator('textarea[dir="ltr"]').fill(buildCleanFacilitiesCsv());

    await expect(page.getByTestId('status-badge')).toContainText('READY · 100/100');

    // Vault tab: save CLM-YYYY-0001 -> seal -> download raw wire UTF-8 BOM CSV -> screenshot
    await page.getByTestId('tab-vault').click();
    await page.getByTestId('create-dossier-btn').click();
    await expect(page.locator('main')).toContainText(expectedCode);

    await page.getByTestId('finalize-dossier-btn').click();
    await expect(page.getByTestId('finalize-dossier-btn')).toHaveCount(0);
    await expect(page.getByTestId('open-public-report-btn')).toBeVisible();

    const dlPromise = page.waitForEvent('download');
    await page.getByTestId('download-vault-csv-btn').click();
    const dl = await dlPromise;
    expect(dl.suggestedFilename()).toContain('.csv');
    const dlPath = await dl.path();
    expect(dlPath).toBeTruthy();
    if (dlPath) {
      const bytes = fs.readFileSync(dlPath);
      expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    }

    await page.screenshot({
      path: 'test-results/qa-screenshots/04-sealed-dossier-desktop.png',
      fullPage: true,
      animations: 'disabled',
    });

    // Public report route /r/:code & persistent view counter across reload
    await page.getByTestId('open-public-report-btn').click();
    await expect(page.locator('body')).toContainText(expectedCode);
    await expect(page.locator('body')).toContainText('Al Dhafra Hydrocarbon Processing PJSC');
    await expect(page.locator('body')).toContainText('View Count: 1');

    await page.reload();
    await expect(page.locator('body')).toContainText(expectedCode);
    await expect(page.locator('body')).toContainText('View Count: 2');

    expect(errors).toEqual([]);
  });

  test('verifies mobile 390x844 responsiveness in AR Mangrove Vellum and EN Desert Obsidian with zero overflow', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('svg[role="img"]').first()).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/05-mobile-ar-mangrove-vellum.png',
      fullPage: true,
      animations: 'disabled',
    });

    await page.getByTestId('lang-toggle').click();
    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'desert-obsidian');
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/06-mobile-en-desert-obsidian.png',
      fullPage: true,
      animations: 'disabled',
    });

    expect(errors).toEqual([]);
  });
});
