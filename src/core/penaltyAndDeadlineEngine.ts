import {
  CLIMATE_FINE_MAX_AED,
  CLIMATE_FINE_MIN_AED,
  CLIMATE_FINE_REPEAT_MULTIPLIER,
  GHG_ARCHIVE_RETENTION_YEARS,
} from './climateCatalog.ts';
import {
  diffDaysUtc,
  resolveVerificationDeadlineDate,
} from './scopeAndThresholdEngine.ts';
import type {
  AssessmentInput,
  PenaltyAndDeadlineResult,
  ScopeThresholdResult,
} from './types.ts';

export function evaluatePenaltyAndDeadline(
  input: AssessmentInput,
  scopeThreshold: ScopeThresholdResult,
): PenaltyAndDeadlineResult {
  const verificationDeadlineDate = resolveVerificationDeadlineDate(input.reportingYear);
  const daysRemainingToDeadline = diffDaysUtc(input.assessmentDate, verificationDeadlineDate);
  const deadlineOverdue = daysRemainingToDeadline < 0;

  let activeViolationGapCount = 0;
  if (!input.registeredOnMoccaeMrv) activeViolationGapCount += 1;
  if (scopeThreshold.thirdPartyVerificationRequired && !scopeThreshold.verifierCompliant) {
    activeViolationGapCount += 1;
  }
  if (scopeThreshold.nrccTier === 'huge_emitter_mandatory' && !input.registeredOnNrcc) {
    activeViolationGapCount += 1;
  }
  if (!input.hasFiveYearGhgArchive) activeViolationGapCount += 1;
  if (!input.hasReductionAdaptationPlan) activeViolationGapCount += 1;

  const isRepeat =
    Boolean(input.repeatViolationWithinTwoYears) || Math.max(0, Number(input.priorViolationsCount) || 0) > 0;
  const repeatMultiplierApplied = isRepeat ? CLIMATE_FINE_REPEAT_MULTIPLIER : 1;

  const estimatedMinFineAed =
    activeViolationGapCount > 0 ? CLIMATE_FINE_MIN_AED * repeatMultiplierApplied : 0;
  const estimatedMaxFineAed =
    activeViolationGapCount > 0 ? CLIMATE_FINE_MAX_AED * repeatMultiplierApplied : 0;

  return {
    verificationDeadlineDate,
    daysRemainingToDeadline,
    deadlineOverdue,
    activeViolationGapCount,
    repeatMultiplierApplied,
    estimatedMinFineAed,
    estimatedMaxFineAed,
    archiveRetentionYearsRequired: GHG_ARCHIVE_RETENTION_YEARS,
  };
}
