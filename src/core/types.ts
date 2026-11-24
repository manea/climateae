export type EmirateJurisdiction =
  | 'abu_dhabi'
  | 'dubai'
  | 'sharjah'
  | 'northern_emirates'
  | 'free_zone';

export type ClimateSector =
  | 'industrial_manufacturing'
  | 'power_water_utilities'
  | 'oil_and_gas'
  | 'transport_logistics'
  | 'waste_management'
  | 'buildings_commercial'
  | 'other_services';

export type VerifierAccreditation =
  | 'iso_14065_accredited'
  | 'moccae_recognized'
  | 'internal_only'
  | 'none';

export type NrccTier = 'huge_emitter_mandatory' | 'participating_voluntary';
export type ReadinessStatus = 'ready' | 'conditional' | 'blocked';
export type SeverityLevel = 'blocker' | 'warning' | 'info';

export type ClimateControlId =
  | 'CLM-CTRL-01'
  | 'CLM-CTRL-02'
  | 'CLM-CTRL-03'
  | 'CLM-CTRL-04'
  | 'CLM-CTRL-05'
  | 'CLM-CTRL-06';

export interface ClimateControlSpec {
  id: ClimateControlId;
  weight: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface AssessmentInput {
  organizationName: string;
  emirate: EmirateJurisdiction;
  isFreeZone: boolean;
  sector: ClimateSector;
  assessmentDate: string;
  reportingYear: number;
  scope1Tco2e: number;
  scope2Tco2e: number;
  scope3Tco2e: number;
  registeredOnMoccaeMrv: boolean;
  registeredOnNrcc: boolean;
  verifierAccreditation: VerifierAccreditation;
  hasFiveYearGhgArchive: boolean;
  hasReductionAdaptationPlan: boolean;
  repeatViolationWithinTwoYears: boolean;
  priorViolationsCount: number;
  facilitiesCsv?: string;
  implementedControls: readonly ClimateControlId[];
  notes?: string;
}

export interface FindingItem {
  code: string;
  severity: SeverityLevel;
  titleEn: string;
  titleAr: string;
  detailEn: string;
  detailAr: string;
  legalRef: string;
}

export interface ScopeThresholdResult {
  coveredByFederalClimateLaw: boolean;
  totalScope1And2Tco2e: number;
  totalAllScopesTco2e: number;
  eadDesignatedSector: boolean;
  eadMandatoryMrvApplies: boolean;
  nrccTier: NrccTier;
  thirdPartyVerificationRequired: boolean;
  verifierCompliant: boolean;
}

export interface PenaltyAndDeadlineResult {
  verificationDeadlineDate: string;
  daysRemainingToDeadline: number;
  deadlineOverdue: boolean;
  activeViolationGapCount: number;
  repeatMultiplierApplied: number;
  estimatedMinFineAed: number;
  estimatedMaxFineAed: number;
  archiveRetentionYearsRequired: number;
}

export interface ControlEvaluationItem {
  id: ClimateControlId;
  titleEn: string;
  titleAr: string;
  implemented: boolean;
  weight: number;
}

export interface FacilityCsvRowAudit {
  rowNumber: number;
  facilityId: string;
  facilityName: string;
  emirate: string;
  sector: string;
  scope1Tco2e: number;
  scope2Tco2e: number;
  combinedTco2e: number;
  eadMandatory: boolean;
  nrccHugeEmitter: boolean;
  iso14065Verified: boolean;
  archive5YrReady: boolean;
  status: ReadinessStatus;
  issues: string[];
}

export interface FacilityCsvAuditSummary {
  totalRows: number;
  readyCount: number;
  conditionalCount: number;
  blockedCount: number;
  eadMandatoryCount: number;
  nrccHugeEmitterCount: number;
  totalScope1Tco2e: number;
  totalScope2Tco2e: number;
  rows: FacilityCsvRowAudit[];
  parseErrors: string[];
}

export interface AssessmentResult {
  toolName: 'ClimateAE';
  version: string;
  legalDisclaimerEn: string;
  legalDisclaimerAr: string;
  organizationName: string;
  emirate: EmirateJurisdiction;
  sector: ClimateSector;
  assessmentDate: string;
  reportingYear: number;
  scopeThreshold: ScopeThresholdResult;
  penaltyAndDeadline: PenaltyAndDeadlineResult;
  csvAudit: FacilityCsvAuditSummary | null;
  status: ReadinessStatus;
  readinessScore: number;
  controls: ControlEvaluationItem[];
  findings: FindingItem[];
  canonicalDossierText: string;
  dossierSha256: string;
}

export interface ClimatePreset {
  id: string;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
  input: AssessmentInput;
}
