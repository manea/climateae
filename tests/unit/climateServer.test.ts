import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../server/app.mjs';
import { CLIMATE_PRESETS, CLIMATEAE_TOOL_VERSION } from '../../src/core/index.ts';

const activeServers: Array<{ close: () => Promise<void> }> = [];
const tempDirs: string[] = [];

function makeTempDir(prefix = 'climateae-test-'): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function startTestApp(options: Parameters<typeof createApp>[0] = {}) {
  const dataDir = options.dataDir ?? makeTempDir();
  const app = createApp({
    basePath: '/climateae',
    dataDir,
    ...options,
  });
  activeServers.push(app);
  const bound = await app.listen(0, '127.0.0.1');
  return { app, baseUrl: bound.url, rootUrl: `http://${bound.host}:${bound.port}` };
}

afterEach(async () => {
  while (activeServers.length > 0) {
    const srv = activeServers.pop()!;
    await srv.close();
  }
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()!;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('ClimateAE SQLite WAL HTTP Server (v0.2.0)', () => {
  it('serves /health, /readyz, BASE_PATH HTML injection, and /api/presets', async () => {
    const { baseUrl, rootUrl } = await startTestApp();

    const healthRes = await fetch(`${baseUrl}/health`);
    expect(healthRes.status).toBe(200);
    expect(healthRes.headers.get('x-content-type-options')).toBe('nosniff');
    expect(healthRes.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    const health = (await healthRes.json()) as {
      ok: boolean;
      service: string;
      version: string;
      basePath: string;
      db: { journalMode: string };
    };
    expect(health.ok).toBe(true);
    expect(health.service).toBe('climateae');
    expect(health.version).toBe(CLIMATEAE_TOOL_VERSION);
    expect(health.basePath).toBe('/climateae');
    expect(health.db.journalMode).toBe('wal');

    const readyRes = await fetch(`${rootUrl}/readyz`);
    expect(readyRes.status).toBe(200);
    const ready = (await readyRes.json()) as { ready: boolean; journalMode: string };
    expect(ready.ready).toBe(true);
    expect(ready.journalMode).toBe('wal');

    const htmlRes = await fetch(`${baseUrl}/`);
    expect(htmlRes.status).toBe(200);
    const html = await htmlRes.text();
    expect(html).toContain('window.__CLIMATEAE_BASE__="/climateae"');

    const presetsRes = await fetch(`${baseUrl}/api/presets`);
    expect(presetsRes.status).toBe(200);
    const presetsJson = (await presetsRes.json()) as {
      ok: boolean;
      toolName: string;
      legalDisclaimerEn: string;
      legalDisclaimerAr: string;
      presets: Array<{ id: string }>;
    };
    expect(presetsJson.ok).toBe(true);
    expect(presetsJson.toolName).toBe('ClimateAE');
    expect(presetsJson.presets).toHaveLength(3);
    expect(presetsJson.legalDisclaimerEn).toContain('NOT affiliated');
    expect(presetsJson.legalDisclaimerAr).toContain('MOCCAE');
  });

  it('evaluates stateless /api/scope-thresholds, /api/penalty-deadline, /api/audit-csv, and /api/assess', async () => {
    const { baseUrl } = await startTestApp();

    const scopeRes = await fetch(`${baseUrl}/api/scope-thresholds`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        organizationName: 'Ruwais Process Plant LLC',
        emirate: 'abu_dhabi',
        sector: 'oil_and_gas',
        scope1Tco2e: 410_000,
        scope2Tco2e: 120_000,
        verifierAccreditation: 'internal_only',
      }),
    });
    expect(scopeRes.status).toBe(200);
    const scopeJson = (await scopeRes.json()) as {
      ok: boolean;
      scopeThreshold: {
        eadMandatoryMrvApplies: boolean;
        nrccTier: string;
        totalScope1And2Tco2e: number;
        verifierCompliant: boolean;
      };
    };
    expect(scopeJson.scopeThreshold.eadMandatoryMrvApplies).toBe(true);
    expect(scopeJson.scopeThreshold.nrccTier).toBe('huge_emitter_mandatory');
    expect(scopeJson.scopeThreshold.totalScope1And2Tco2e).toBe(530_000);
    expect(scopeJson.scopeThreshold.verifierCompliant).toBe(false);

    const penaltyRes = await fetch(`${baseUrl}/api/penalty-deadline`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        presetId: CLIMATE_PRESETS[2]!.id,
      }),
    });
    expect(penaltyRes.status).toBe(200);
    const penaltyJson = (await penaltyRes.json()) as {
      penaltyAndDeadline: {
        verificationDeadlineDate: string;
        daysRemainingToDeadline: number;
        repeatMultiplierApplied: number;
        estimatedMinFineAed: number;
        estimatedMaxFineAed: number;
      };
    };
    expect(penaltyJson.penaltyAndDeadline.verificationDeadlineDate).toBe('2027-03-31');
    expect(penaltyJson.penaltyAndDeadline.daysRemainingToDeadline).toBe(126);
    expect(penaltyJson.penaltyAndDeadline.repeatMultiplierApplied).toBe(2);
    expect(penaltyJson.penaltyAndDeadline.estimatedMinFineAed).toBe(100_000);
    expect(penaltyJson.penaltyAndDeadline.estimatedMaxFineAed).toBe(4_000_000);

    const emptyCsvRes = await fetch(`${baseUrl}/api/audit-csv`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ csv: '   ' }),
    });
    expect(emptyCsvRes.status).toBe(400);

    const csvRes = await fetch(`${baseUrl}/api/audit-csv`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        csv: CLIMATE_PRESETS[2]!.input.facilitiesCsv,
        assessmentDate: '2026-11-25',
        reportingYear: 2026,
      }),
    });
    expect(csvRes.status).toBe(200);
    const csvJson = (await csvRes.json()) as {
      audit: { totalRows: number; blockedCount: number; eadMandatoryCount: number };
      exportCsv: string;
    };
    expect(csvJson.audit.totalRows).toBe(3);
    expect(csvJson.audit.blockedCount).toBe(1);
    expect(csvJson.audit.eadMandatoryCount).toBe(2);
    expect(csvJson.exportCsv.startsWith('\uFEFF')).toBe(true);
    expect(csvJson.exportCsv).toContain("'=HYPERLINK");

    const assessRes = await fetch(`${baseUrl}/api/assess`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ presetId: CLIMATE_PRESETS[2]!.id }),
    });
    expect(assessRes.status).toBe(200);
    const assessJson = (await assessRes.json()) as {
      assessment: { status: string; readinessScore: number; dossierSha256: string };
    };
    expect(assessJson.assessment.status).toBe('blocked');
    expect(assessJson.assessment.readinessScore).toBe(0);
    expect(assessJson.assessment.dossierSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('supports Profiles CRUD lifecycle and links assessments cleanly', async () => {
    const { baseUrl } = await startTestApp();

    const invalidProf = await fetch(`${baseUrl}/api/profiles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ organizationName: '   ' }),
    });
    expect(invalidProf.status).toBe(400);

    const createRes = await fetch(`${baseUrl}/api/profiles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        organizationName: 'Emirates Aluminium Complex PJSC',
        emirate: 'abu_dhabi',
        sector: 'industrial_manufacturing',
        isFreeZone: true,
        reportingYear: 2026,
        notes: 'KIZAD smelter complex',
      }),
    });
    expect(createRes.status).toBe(201);
    const { profile } = (await createRes.json()) as {
      profile: { id: number; organizationName: string; emirate: string; reportingYear: number };
    };
    expect(profile.emirate).toBe('abu_dhabi');
    expect(profile.reportingYear).toBe(2026);

    const patchRes = await fetch(`${baseUrl}/api/profiles/${profile.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notes: 'Updated KIZAD audit notes', isFreeZone: false }),
    });
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as { profile: { notes: string; isFreeZone: boolean } };
    expect(patched.profile.notes).toBe('Updated KIZAD audit notes');
    expect(patched.profile.isFreeZone).toBe(false);

    const listRes = await fetch(`${baseUrl}/api/profiles`);
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as { total: number };
    expect(list.total).toBe(1);

    const delRes = await fetch(`${baseUrl}/api/profiles/${profile.id}`, { method: 'DELETE' });
    expect(delRes.status).toBe(200);

    const getGone = await fetch(`${baseUrl}/api/profiles/${profile.id}`);
    expect(getGone.status).toBe(404);
  });

  it('persists dossiers with atomic CLM-YYYY-0001 codes, immutability 409 locks, brief.md, wire UTF-8 BOM CSV & public analytics', async () => {
    const { baseUrl } = await startTestApp();
    const year = new Date().getUTCFullYear();

    // 1. Create blocked Preset 3 dossier (includes facilitiesCsv)
    const create1 = await fetch(`${baseUrl}/api/assessments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        presetId: CLIMATE_PRESETS[2]!.id,
        title: 'AD Energy FY2026 Initial Audit',
      }),
    });
    expect(create1.status).toBe(201);
    const { item: item1 } = (await create1.json()) as {
      item: {
        id: number;
        dossierCode: string;
        status: string;
        estimatedMaxFineAed: number;
      };
    };
    expect(item1.dossierCode).toBe(`CLM-${year}-0001`);
    expect(item1.status).toBe('blocked');
    expect(item1.estimatedMaxFineAed).toBe(4_000_000);

    // 2. Create ready Preset 1 dossier (without facilitiesCsv -> fallback summary CSV test)
    const create2 = await fetch(`${baseUrl}/api/dossiers`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        presetId: CLIMATE_PRESETS[0]!.id,
      }),
    });
    expect(create2.status).toBe(201);
    const { item: item2 } = (await create2.json()) as { item: { dossierCode: string; status: string } };
    expect(item2.dossierCode).toBe(`CLM-${year}-0002`);
    expect(item2.status).toBe('ready');

    // Filter search by status & query
    const filtered = await fetch(`${baseUrl}/api/dossiers?status=blocked&q=CLM-${year}-0001`);
    expect(filtered.status).toBe(200);
    const filteredJson = (await filtered.json()) as { total: number };
    expect(filteredJson.total).toBe(1);

    // Unpublished dossier should return 404 on public reports
    const unpubRes = await fetch(`${baseUrl}/api/public/reports/${item1.dossierCode}`);
    expect(unpubRes.status).toBe(404);

    // Patch unlocked draft
    const patchDraft = await fetch(`${baseUrl}/api/assessments/${item1.dossierCode}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notes: 'Prepared remediation board memo' }),
    });
    expect(patchDraft.status).toBe(200);

    // Finalize/seal dossier -> assigns publicSlug and lockedAt
    const finalizeRes = await fetch(`${baseUrl}/api/dossiers/${item1.dossierCode}/finalize`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(finalizeRes.status).toBe(200);
    const { item: sealed } = (await finalizeRes.json()) as {
      item: { lockedAt: string; publicSlug: string; dossierSha256: string };
    };
    expect(sealed.lockedAt).toBeTruthy();
    expect(sealed.publicSlug).toMatch(/^climate-[0-9a-f]{12}$/);

    // Second lock, PATCH, and DELETE must return 409
    const relock = await fetch(`${baseUrl}/api/dossiers/${item1.dossierCode}/lock`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(relock.status).toBe(409);

    const patchLocked = await fetch(`${baseUrl}/api/dossiers/${item1.dossierCode}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ organizationName: 'Illegal Mutation' }),
    });
    expect(patchLocked.status).toBe(409);

    const delLocked = await fetch(`${baseUrl}/api/dossiers/${item1.dossierCode}`, {
      method: 'DELETE',
    });
    expect(delLocked.status).toBe(409);

    // Duplicate sealed dossier creates CLM-YYYY-0003 draft
    const dupRes = await fetch(`${baseUrl}/api/dossiers/${item1.dossierCode}/duplicate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Follow-Up Remediation Draft' }),
    });
    expect(dupRes.status).toBe(201);
    const { item: copyItem } = (await dupRes.json()) as {
      item: { dossierCode: string; lockedAt: string | null; title: string };
    };
    expect(copyItem.dossierCode).toBe(`CLM-${year}-0003`);
    expect(copyItem.lockedAt).toBeNull();
    expect(copyItem.title).toBe('Follow-Up Remediation Draft');

    // Bilingual brief.md (AR + EN)
    const briefAr = await fetch(`${baseUrl}/api/dossiers/${item1.dossierCode}/brief.md?lang=ar`);
    expect(briefAr.status).toBe(200);
    expect(briefAr.headers.get('content-type')).toContain('text/markdown');
    const arText = await briefAr.text();
    expect(arText).toContain(item1.dossierCode);
    expect(arText).toContain(sealed.dossierSha256);
    expect(arText).toContain('MOCCAE');

    const briefEn = await fetch(`${baseUrl}/api/dossiers/${item1.dossierCode}/brief.md?lang=en`);
    expect(briefEn.status).toBe(200);
    const enText = await briefEn.text();
    expect(enText).toContain('UAE Climate Law Readiness Brief');
    expect(enText).toContain('NOT affiliated');

    // Raw wire UTF-8 BOM check on export.csv (multi-row & fallback single-row)
    const exportCsvRes = await fetch(`${baseUrl}/api/dossiers/${item1.dossierCode}/export.csv`);
    expect(exportCsvRes.status).toBe(200);
    expect(exportCsvRes.headers.get('content-type')).toContain('text/csv');
    const rawBytes = new Uint8Array(await exportCsvRes.arrayBuffer());
    expect(Array.from(rawBytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    const decodedCsv = new TextDecoder('utf-8').decode(rawBytes.slice(3));
    expect(decodedCsv).toContain("'=HYPERLINK");

    const fallbackCsvRes = await fetch(`${baseUrl}/api/dossiers/${item2.dossierCode}/export.csv`);
    expect(fallbackCsvRes.status).toBe(200);
    const fallbackBytes = new Uint8Array(await fallbackCsvRes.arrayBuffer());
    expect(Array.from(fallbackBytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);

    // Summary endpoint
    const summaryRes = await fetch(`${baseUrl}/api/dossiers/${item1.dossierCode}/summary?lang=en`);
    expect(summaryRes.status).toBe(200);
    const summaryJson = (await summaryRes.json()) as {
      ok: boolean;
      dossierCode: string;
      csvAuditSummary: { totalRows: number } | null;
      briefMarkdown: string;
    };
    expect(summaryJson.ok).toBe(true);
    expect(summaryJson.csvAuditSummary?.totalRows).toBe(3);
    expect(summaryJson.briefMarkdown).toContain(item1.dossierCode);

    // Public report endpoint increments view count
    const pubView1 = await fetch(`${baseUrl}/api/public/reports/${sealed.publicSlug}`);
    expect(pubView1.status).toBe(200);
    const pubJson1 = (await pubView1.json()) as {
      viewCount: number;
      report: { briefAr: string; briefEn: string };
    };
    expect(pubJson1.viewCount).toBe(1);
    expect(pubJson1.report.briefAr).toContain(item1.dossierCode);
    expect(pubJson1.report.briefEn).toContain('UAE Climate Law Readiness Brief');

    const pubView2 = await fetch(`${baseUrl}/api/public/reports/${item1.dossierCode}`);
    expect(pubView2.status).toBe(200);
    const pubJson2 = (await pubView2.json()) as { viewCount: number };
    expect(pubJson2.viewCount).toBe(2);

    // Delete unlocked duplicate succeeds
    const delDup = await fetch(`${baseUrl}/api/dossiers/${copyItem.dossierCode}`, {
      method: 'DELETE',
    });
    expect(delDup.status).toBe(200);
  });

  it('enforces 413 body limit, 429 API rate limit (exempting /health & /readyz), and 400/404 validation errors', async () => {
    const { baseUrl } = await startTestApp({
      maxBodyBytes: 256,
      rateLimitMax: 4,
      rateLimitWindowMs: 60_000,
    });

    const badJson = await fetch(`${baseUrl}/api/assess`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{invalid-json',
    });
    expect(badJson.status).toBe(400);

    const badEmirate = await fetch(`${baseUrl}/api/assess`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emirate: 'atlantis' }),
    });
    expect(badEmirate.status).toBe(400);

    const tooLarge = await fetch(`${baseUrl}/api/assess`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ organizationName: 'X'.repeat(400) }),
    });
    expect(tooLarge.status).toBe(413);

    const unknownApi = await fetch(`${baseUrl}/api/does-not-exist`);
    expect(unknownApi.status).toBe(404);

    // Request 5 hits rateLimitMax=4 -> 429
    const limited = await fetch(`${baseUrl}/api/presets`);
    expect(limited.status).toBe(429);

    // Health and readiness probes stay exempt from rate limits
    const healthAfterLimit = await fetch(`${baseUrl}/health`);
    expect(healthAfterLimit.status).toBe(200);
    const readyAfterLimit = await fetch(`${baseUrl}/readyz`);
    expect(readyAfterLimit.status).toBe(200);
  });
});
