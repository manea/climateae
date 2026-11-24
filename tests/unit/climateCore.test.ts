import { describe, expect, it } from 'vitest';
import {
  CLIMATE_CONTROLS,
  CLIMATE_PRESETS,
  assessClimateReadiness,
  auditFacilitiesCsv,
  computePayloadDigest,
  evaluatePenaltyAndDeadline,
  evaluateScopeAndThresholds,
  exportFacilitiesAuditCsv,
  sanitizeCsvCell,
} from '../../src/core/index.ts';

describe('ClimateAE core (UAE Decree-Law 11/2024, EAD 03/2026 & NRCC 67/2024)', () => {
  it('exposes 6 weighted UAE climate controls and explicit non-MOCCAE/EAD/NRCC disclaimers', async () => {
    expect(CLIMATE_CONTROLS).toHaveLength(6);
    const totalWeight = CLIMATE_CONTROLS.reduce((sum, c) => sum + c.weight, 0);
    expect(totalWeight).toBe(100);

    const ready = await assessClimateReadiness(CLIMATE_PRESETS[0]!.input);
    expect(ready.toolName).toBe('ClimateAE');
    expect(ready.legalDisclaimerEn).toContain('NOT affiliated');
    expect(ready.legalDisclaimerAr).toContain('ليست تابعة');
  });

  it('scores Preset 1 Dubai Free Zone Logistics as ready 100/100 under Law 11/2024', async () => {
    const res = await assessClimateReadiness(CLIMATE_PRESETS[0]!.input);
    expect(res.status).toBe('ready');
    expect(res.readinessScore).toBe(100);
    expect(res.scopeThreshold.coveredByFederalClimateLaw).toBe(true);
    expect(res.scopeThreshold.eadMandatoryMrvApplies).toBe(false);
    expect(res.scopeThreshold.nrccTier).toBe('participating_voluntary');
    expect(res.penaltyAndDeadline.estimatedMaxFineAed).toBe(0);
    expect(res.findings.some((f) => f.code === 'CLM-FREEZONE-IN-SCOPE')).toBe(true);
  });

  it('scores Preset 2 Abu Dhabi Industrial >=25k tCO2e as conditional with 126 days to Mar 31, 2027', async () => {
    const res = await assessClimateReadiness(CLIMATE_PRESETS[1]!.input);
    expect(res.status).toBe('conditional');
    expect(res.readinessScore).toBe(70);
    expect(res.scopeThreshold.eadMandatoryMrvApplies).toBe(true);
    expect(res.scopeThreshold.thirdPartyVerificationRequired).toBe(true);
    expect(res.scopeThreshold.verifierCompliant).toBe(false);
    expect(res.scopeThreshold.nrccTier).toBe('participating_voluntary');
    expect(res.penaltyAndDeadline.verificationDeadlineDate).toBe('2027-03-31');
    expect(res.penaltyAndDeadline.daysRemainingToDeadline).toBe(126);
    expect(res.penaltyAndDeadline.deadlineOverdue).toBe(false);
    expect(res.findings.some((f) => f.code === 'CLM-EAD-ISO14065-PENDING')).toBe(true);
  });

  it('flags Preset 3 NRCC >=0.5 MtCO2e Huge Emitter as blocked with 2x repeat AED 4M fine ceiling & CSV blockers', async () => {
    const res = await assessClimateReadiness(CLIMATE_PRESETS[2]!.input);
    expect(res.status).toBe('blocked');
    expect(res.readinessScore).toBe(0);
    expect(res.scopeThreshold.totalScope1And2Tco2e).toBe(620_000);
    expect(res.scopeThreshold.nrccTier).toBe('huge_emitter_mandatory');
    expect(res.penaltyAndDeadline.repeatMultiplierApplied).toBe(2);
    expect(res.penaltyAndDeadline.estimatedMinFineAed).toBe(100_000);
    expect(res.penaltyAndDeadline.estimatedMaxFineAed).toBe(4_000_000);

    expect(res.csvAudit?.totalRows).toBe(3);
    expect(res.csvAudit?.blockedCount).toBe(1);
    expect(res.csvAudit?.conditionalCount).toBe(1);
    expect(res.csvAudit?.readyCount).toBe(1);
    expect(res.csvAudit?.eadMandatoryCount).toBe(2);
    expect(res.csvAudit?.nrccHugeEmitterCount).toBe(1);
  });

  it('escalates Abu Dhabi >=25,000 tCO2e missing ISO 14065 audit to blocker once past Mar 31, 2027', () => {
    const pastInput = {
      ...CLIMATE_PRESETS[1]!.input,
      assessmentDate: '2027-04-01',
    };
    const scopeEval = evaluateScopeAndThresholds(pastInput);
    const penalty = evaluatePenaltyAndDeadline(pastInput, scopeEval.scopeThreshold);
    expect(penalty.daysRemainingToDeadline).toBe(-1);
    expect(penalty.deadlineOverdue).toBe(true);
    expect(scopeEval.findings.some((f) => f.code === 'CLM-EAD-ISO14065-OVERDUE' && f.severity === 'blocker')).toBe(true);
  });

  it('handles exact threshold boundaries (25,000 Scope 1 EAD & 500,000 Scope 1+2 NRCC)', () => {
    const scopeBoundary = evaluateScopeAndThresholds({
      ...CLIMATE_PRESETS[0]!.input,
      emirate: 'abu_dhabi',
      sector: 'power_water_utilities',
      scope1Tco2e: 25_000,
      scope2Tco2e: 475_000,
    });
    expect(scopeBoundary.scopeThreshold.eadMandatoryMrvApplies).toBe(true);
    expect(scopeBoundary.scopeThreshold.totalScope1And2Tco2e).toBe(500_000);
    expect(scopeBoundary.scopeThreshold.nrccTier).toBe('huge_emitter_mandatory');
  });

  it('neutralizes CWE-1236 spreadsheet formula prefixes and emits UTF-8 BOM in CSV exports', () => {
    expect(sanitizeCsvCell('=1+1')).toBe("'=1+1");
    expect(sanitizeCsvCell('=HYPERLINK("http://bad")')).toBe('"\'=HYPERLINK(""http://bad"")"');
    const summary = auditFacilitiesCsv(CLIMATE_PRESETS[2]!.input.facilitiesCsv!, '2026-11-25', 2026);
    const csv = exportFacilitiesAuditCsv(summary);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain("'=HYPERLINK");
  });

  it('produces deterministic canonical payload SHA-256 digests', async () => {
    const res1 = await assessClimateReadiness(CLIMATE_PRESETS[0]!.input);
    const res2 = await assessClimateReadiness(CLIMATE_PRESETS[0]!.input);
    expect(res1.dossierSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(res1.dossierSha256).toBe(res2.dossierSha256);
    expect(await computePayloadDigest(res1.canonicalDossierText)).toBe(res1.dossierSha256);
  });
});
