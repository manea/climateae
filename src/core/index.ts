export type {
  AssessmentInput,
  AssessmentResult,
  ClimateControlId,
  ClimateControlSpec,
  ClimatePreset,
  ClimateSector,
  ControlEvaluationItem,
  EmirateJurisdiction,
  FacilityCsvAuditSummary,
  FacilityCsvRowAudit,
  FindingItem,
  NrccTier,
  PenaltyAndDeadlineResult,
  ReadinessStatus,
  ScopeThresholdResult,
  SeverityLevel,
  VerifierAccreditation,
} from './types.ts';

export {
  CLIMATE_CONTROLS,
  CLIMATE_FINE_MAX_AED,
  CLIMATE_FINE_MIN_AED,
  CLIMATE_FINE_REPEAT_MULTIPLIER,
  CLIMATEAE_TOOL_VERSION,
  EAD_DESIGNATED_SECTORS,
  EAD_FY2026_DEADLINE_DATE,
  EAD_SCOPE1_THRESHOLD_TCO2E,
  GHG_ARCHIVE_RETENTION_YEARS,
  LEGAL_DISCLAIMER_AR,
  LEGAL_DISCLAIMER_EN,
  NRCC_HUGE_EMITTER_THRESHOLD_TCO2E,
  UAE_CLIMATE_LAW_EFFECTIVE_DATE,
} from './climateCatalog.ts';

export {
  diffDaysUtc,
  evaluateScopeAndThresholds,
  resolveVerificationDeadlineDate,
} from './scopeAndThresholdEngine.ts';
export { evaluatePenaltyAndDeadline } from './penaltyAndDeadlineEngine.ts';
export {
  auditFacilitiesCsv,
  exportFacilitiesAuditCsv,
  sanitizeCsvCell,
} from './facilityCsvAuditor.ts';
export {
  canonicalizeDossierPayload,
  computeDossierSha256,
  computePayloadDigest,
} from './dossierDigest.ts';
export { assessClimateReadiness } from './readinessAssessor.ts';
export { buildClimateBriefMarkdown } from './briefBuilder.ts';
export { CLIMATE_PRESETS } from './presets.ts';
