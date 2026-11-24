import {
  CLIMATE_CONTROLS,
  CLIMATEAE_TOOL_VERSION,
  LEGAL_DISCLAIMER_AR,
  LEGAL_DISCLAIMER_EN,
} from './climateCatalog.ts';
import { canonicalizeDossierPayload, computePayloadDigest } from './dossierDigest.ts';
import { auditFacilitiesCsv } from './facilityCsvAuditor.ts';
import { evaluatePenaltyAndDeadline } from './penaltyAndDeadlineEngine.ts';
import { evaluateScopeAndThresholds } from './scopeAndThresholdEngine.ts';
import type {
  AssessmentInput,
  AssessmentResult,
  ControlEvaluationItem,
  FindingItem,
  ReadinessStatus,
} from './types.ts';

export async function assessClimateReadiness(
  input: AssessmentInput,
): Promise<AssessmentResult> {
  const scopeEval = evaluateScopeAndThresholds(input);
  const penaltyAndDeadline = evaluatePenaltyAndDeadline(input, scopeEval.scopeThreshold);
  const csvAudit =
    input.facilitiesCsv && input.facilitiesCsv.trim()
      ? auditFacilitiesCsv(input.facilitiesCsv, input.assessmentDate, input.reportingYear)
      : null;

  const findings: FindingItem[] = [...scopeEval.findings];

  if (csvAudit) {
    if (csvAudit.parseErrors.length > 0) {
      findings.push({
        code: 'CLM-CSV-PARSE-ERROR',
        severity: 'warning',
        titleEn: 'UAE Facility GHG CSV Parse Issue',
        titleAr: 'مشكلة في قراءة ملف CSV الخاص بالمنشآت',
        detailEn: csvAudit.parseErrors.join(' '),
        detailAr: csvAudit.parseErrors.join(' '),
        legalRef: 'UAE Climate MRV Facility Inventory',
      });
    } else if (csvAudit.blockedCount > 0) {
      findings.push({
        code: 'CLM-CSV-FACILITY-BLOCKERS',
        severity: 'blocker',
        titleEn: `${csvAudit.blockedCount} Facility Row(s) Flagged With Compliance Blockers`,
        titleAr: `رصد ${csvAudit.blockedCount} منشآت بمخالفات حاجبة في كشف CSV`,
        detailEn: `Batch CSV flagged ${csvAudit.blockedCount} blocked facility row(s), ${csvAudit.eadMandatoryCount} EAD >=25k tCO2e site(s), and ${csvAudit.nrccHugeEmitterCount} NRCC >=500k tCO2e site(s).`,
        detailAr: `كشف كشف CSV وجود ${csvAudit.blockedCount} منشأة محجوبة و${csvAudit.eadMandatoryCount} موقعاً خاضعاً لعتبة أبوظبي و${csvAudit.nrccHugeEmitterCount} موقع انبعاثات ضخمة.`,
        legalRef: 'Federal Decree-Law 11/2024 & EAD 03/2026',
      });
    } else if (csvAudit.conditionalCount > 0) {
      findings.push({
        code: 'CLM-CSV-FACILITY-CONDITIONAL',
        severity: 'warning',
        titleEn: `${csvAudit.conditionalCount} EAD Facility Site(s) Pending ISO 14065 Audit`,
        titleAr: `${csvAudit.conditionalCount} مواقع في أبوظبي بانتظار تدقيق ISO 14065`,
        detailEn: `Complete independent ISO 14065 verification before ${penaltyAndDeadline.verificationDeadlineDate}.`,
        detailAr: `يرجى إتمام التحقق المستقل ISO 14065 قبل الموعد النهائي ${penaltyAndDeadline.verificationDeadlineDate}.`,
        legalRef: 'Abu Dhabi EAD Resolution No. 03 of 2026',
      });
    }
  }

  const implementedSet = new Set(input.implementedControls);
  const controls: ControlEvaluationItem[] = CLIMATE_CONTROLS.map((spec) => ({
    id: spec.id,
    titleEn: spec.titleEn,
    titleAr: spec.titleAr,
    implemented: implementedSet.has(spec.id),
    weight: spec.weight,
  }));

  const controlsScore = controls.reduce(
    (sum, c) => (c.implemented ? sum + c.weight : sum),
    0,
  );

  let deduction = 0;
  if (!input.registeredOnMoccaeMrv) deduction += 25;
  if (scopeEval.scopeThreshold.eadMandatoryMrvApplies && !scopeEval.scopeThreshold.verifierCompliant) {
    deduction += penaltyAndDeadline.deadlineOverdue ? 25 : 10;
  }
  if (
    scopeEval.scopeThreshold.nrccTier === 'huge_emitter_mandatory' &&
    (!input.registeredOnNrcc || !scopeEval.scopeThreshold.verifierCompliant)
  ) {
    deduction += 25;
  }
  if (!input.hasFiveYearGhgArchive) deduction += 20;
  if (!input.hasReductionAdaptationPlan) deduction += 10;
  if (csvAudit && csvAudit.blockedCount > 0) deduction += 15;

  const readinessScore = Math.max(0, Math.min(100, controlsScore - deduction));

  const hasBlocker = findings.some((f) => f.severity === 'blocker');
  const hasWarning = findings.some((f) => f.severity === 'warning');

  let status: ReadinessStatus;
  if (hasBlocker || readinessScore < 65) {
    status = 'blocked';
  } else if (hasWarning || readinessScore < 90) {
    status = 'conditional';
  } else {
    status = 'ready';
  }

  const canonicalDossierText = canonicalizeDossierPayload({
    toolName: 'ClimateAE',
    version: CLIMATEAE_TOOL_VERSION,
    organizationName: input.organizationName,
    emirate: input.emirate,
    isFreeZone: input.isFreeZone,
    sector: input.sector,
    assessmentDate: input.assessmentDate,
    reportingYear: input.reportingYear,
    scopeThreshold: scopeEval.scopeThreshold,
    penaltyAndDeadline,
    csvAudit,
    status,
    readinessScore,
    controls: controls.map((c) => ({ id: c.id, implemented: c.implemented })),
  });

  const dossierSha256 = await computePayloadDigest(canonicalDossierText);

  return {
    toolName: 'ClimateAE',
    version: CLIMATEAE_TOOL_VERSION,
    legalDisclaimerEn: LEGAL_DISCLAIMER_EN,
    legalDisclaimerAr: LEGAL_DISCLAIMER_AR,
    organizationName: input.organizationName,
    emirate: input.emirate,
    sector: input.sector,
    assessmentDate: input.assessmentDate,
    reportingYear: input.reportingYear,
    scopeThreshold: scopeEval.scopeThreshold,
    penaltyAndDeadline,
    csvAudit,
    status,
    readinessScore,
    controls,
    findings,
    canonicalDossierText,
    dossierSha256,
  };
}
