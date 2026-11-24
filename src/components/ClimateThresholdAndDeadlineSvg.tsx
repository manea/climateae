import { EAD_SCOPE1_THRESHOLD_TCO2E, NRCC_HUGE_EMITTER_THRESHOLD_TCO2E } from '../core/climateCatalog.ts';
import type { AssessmentInput, AssessmentResult } from '../core/types.ts';
import { formatNumber, type Locale } from '../lib/i18n.ts';

interface Props {
  input: AssessmentInput;
  result: AssessmentResult;
  locale: Locale;
}

export function ClimateThresholdAndDeadlineSvg({ input, result, locale }: Props) {
  const { scopeThreshold, penaltyAndDeadline } = result;
  const isAr = locale === 'ar';

  const statusColor =
    result.status === 'ready'
      ? 'var(--accent-emerald)'
      : result.status === 'conditional'
        ? 'var(--accent-amber)'
        : 'var(--accent-crimson)';

  // Threshold normalized widths (up to 2x statutory thresholds or clamped cleanly within 288px track)
  const eadRatio = Math.min(1, input.scope1Tco2e / (EAD_SCOPE1_THRESHOLD_TCO2E * 2));
  const eadBarW = input.scope1Tco2e > 0 ? Math.max(8, Math.round(eadRatio * 288)) : 4;
  const eadThresholdX = 16 + Math.round(0.5 * 288); // 25k mark at 50% of 50k visual span

  const nrccRatio = Math.min(
    1,
    scopeThreshold.totalScope1And2Tco2e / (NRCC_HUGE_EMITTER_THRESHOLD_TCO2E * 1.4),
  );
  const nrccBarW =
    scopeThreshold.totalScope1And2Tco2e > 0 ? Math.max(8, Math.round(nrccRatio * 288)) : 4;
  const nrccThresholdX = 16 + Math.round((500_000 / 700_000) * 288);

  const fineColor =
    penaltyAndDeadline.estimatedMaxFineAed >= 4_000_000
      ? 'var(--accent-crimson)'
      : penaltyAndDeadline.estimatedMaxFineAed > 0
        ? 'var(--accent-amber)'
        : 'var(--accent-emerald)';

  const fineBarW =
    penaltyAndDeadline.estimatedMaxFineAed > 0
      ? Math.max(12, Math.round((penaltyAndDeadline.estimatedMaxFineAed / 4_000_000) * 288))
      : 6;

  const daysClamped = Math.max(0, Math.min(365, penaltyAndDeadline.daysRemainingToDeadline));
  const deadlineBarW = penaltyAndDeadline.deadlineOverdue
    ? 288
    : Math.max(12, Math.round(((365 - daysClamped) / 365) * 288));

  const scoreBarW = Math.max(8, Math.round((result.readinessScore / 100) * 288));

  return (
    <div className="clm-card rounded-2xl p-4 space-y-2.5" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[var(--text-secondary)]">
        <span>
          {isAr ? (
            <>
              رصد عتبات <bdi dir="ltr">EAD 25k / NRCC 500k</bdi> وموعد التحقق{' '}
              <bdi dir="ltr">{penaltyAndDeadline.verificationDeadlineDate}</bdi> والغرامات الإدارية
            </>
          ) : (
            `EAD 25k / NRCC 500k Threshold Telemetry & FY${input.reportingYear} Cutoff (${penaltyAndDeadline.verificationDeadlineDate})`
          )}
        </span>
        <span
          data-testid="status-badge"
          className="clm-mono num-tabular font-bold"
          dir="ltr"
          style={{ color: statusColor }}
        >
          {result.status.toUpperCase()} · {result.readinessScore}/100
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2" dir="ltr">
        {/* Panel 1: UAE Climate Threshold Gauges */}
        <svg
          viewBox="0 0 320 206"
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label={
            isAr
              ? 'مخطط مقارنة الانبعاثات مع عتبة أبوظبي 25,000 طن والسجل الوطني 500,000 طن'
              : 'Abu Dhabi EAD 25,000 tCO2e and NRCC 500,000 tCO2e statutory threshold bars'
          }
        >
          <rect
            x="2"
            y="2"
            width="316"
            height="202"
            rx="14"
            fill="var(--bg-elevated)"
            stroke="var(--border-subtle)"
            strokeWidth="1.2"
          />
          <text x="16" y="26" fill="var(--text-primary)" fontSize="13" fontWeight="700">
            UAE Statutory Thresholds (tCO2e)
          </text>

          {/* EAD 25k Track */}
          <text x="16" y="54" fill="var(--text-secondary)" fontSize="10.5" fontWeight="600">
            Scope 1 vs. EAD 25k (03/2026)
          </text>
          <text
            x="304"
            y="54"
            textAnchor="end"
            fill={scopeThreshold.eadMandatoryMrvApplies ? 'var(--accent-amber)' : 'var(--accent-emerald)'}
            fontSize="11.5"
            fontWeight="700"
            className="clm-mono num-tabular"
          >
            {formatNumber(input.scope1Tco2e)} t
          </text>
          <rect x="16" y="62" width="288" height="18" rx="6" fill="var(--bg-surface)" />
          <rect
            x="16"
            y="62"
            width={eadBarW}
            height="18"
            rx="6"
            fill={scopeThreshold.eadMandatoryMrvApplies ? 'var(--accent-amber)' : 'var(--accent-emerald)'}
          />
          <line
            x1={eadThresholdX}
            y1="59"
            x2={eadThresholdX}
            y2="84"
            stroke="var(--text-primary)"
            strokeWidth="1.6"
            strokeDasharray="3 2"
          />
          <text x={eadThresholdX} y="96" textAnchor="middle" fill="var(--text-secondary)" fontSize="9.5" className="clm-mono">
            25k EAD Cutoff
          </text>

          {/* NRCC 500k Track */}
          <text x="16" y="118" fill="var(--text-secondary)" fontSize="10.5" fontWeight="600">
            Scope 1+2 vs. NRCC 500k (67/2024)
          </text>
          <text
            x="304"
            y="118"
            textAnchor="end"
            fill={scopeThreshold.nrccTier === 'huge_emitter_mandatory' ? 'var(--accent-crimson)' : 'var(--accent-teal)'}
            fontSize="11.5"
            fontWeight="700"
            className="clm-mono num-tabular"
          >
            {formatNumber(scopeThreshold.totalScope1And2Tco2e)} t
          </text>
          <rect x="16" y="126" width="288" height="18" rx="6" fill="var(--bg-surface)" />
          <rect
            x="16"
            y="126"
            width={nrccBarW}
            height="18"
            rx="6"
            fill={scopeThreshold.nrccTier === 'huge_emitter_mandatory' ? 'var(--accent-crimson)' : 'var(--accent-teal)'}
          />
          <line
            x1={nrccThresholdX}
            y1="123"
            x2={nrccThresholdX}
            y2="148"
            stroke="var(--text-primary)"
            strokeWidth="1.6"
            strokeDasharray="3 2"
          />
          <text x={nrccThresholdX} y="160" textAnchor="middle" fill="var(--text-secondary)" fontSize="9.5" className="clm-mono">
            500k NRCC
          </text>

          {/* Bottom pill */}
          <rect x="16" y="170" width="288" height="24" rx="7" fill="var(--accent-emerald-soft)" />
          <text x="160" y="186" textAnchor="middle" fill="var(--accent-primary)" fontSize="10.5" fontWeight="700" className="clm-mono">
            {scopeThreshold.eadMandatoryMrvApplies
              ? 'EAD ISO 14065 Required'
              : scopeThreshold.nrccTier === 'huge_emitter_mandatory'
                ? 'NRCC Huge Emitter Mandatory'
                : 'Law 11/2024 Federal Scope Active'}
          </text>
        </svg>

        {/* Panel 2: Verification Cutoff, Penalty Ceiling & Readiness Score */}
        <svg
          viewBox="0 0 320 206"
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label="Annual verification deadline countdown, statutory Law 11/2024 fine band, and readiness score"
        >
          <rect
            x="2"
            y="2"
            width="316"
            height="202"
            rx="14"
            fill="var(--bg-elevated)"
            stroke="var(--border-subtle)"
            strokeWidth="1.2"
          />
          <text x="16" y="26" fill="var(--text-primary)" fontSize="13" fontWeight="700">
            Deadline Countdown &amp; Law 11/2024 Exposure
          </text>

          {/* Verification Deadline Bar */}
          <text x="16" y="54" fill="var(--text-secondary)" fontSize="11" fontWeight="600">
            Cutoff ({penaltyAndDeadline.verificationDeadlineDate})
          </text>
          <text
            x="304"
            y="54"
            textAnchor="end"
            fill={penaltyAndDeadline.deadlineOverdue ? 'var(--accent-crimson)' : 'var(--accent-amber)'}
            fontSize="11.5"
            fontWeight="700"
            className="clm-mono num-tabular"
          >
            {penaltyAndDeadline.deadlineOverdue
              ? `OVERDUE ${Math.abs(penaltyAndDeadline.daysRemainingToDeadline)}d`
              : `${penaltyAndDeadline.daysRemainingToDeadline}d left`}
          </text>
          <rect x="16" y="62" width="288" height="16" rx="6" fill="var(--bg-surface)" />
          <rect
            x="16"
            y="62"
            width={deadlineBarW}
            height="16"
            rx="6"
            fill={penaltyAndDeadline.deadlineOverdue ? 'var(--accent-crimson)' : 'var(--accent-amber)'}
          />

          {/* Fine Ceiling Bar */}
          <text x="16" y="102" fill="var(--text-secondary)" fontSize="11" fontWeight="600">
            Max Fine ({penaltyAndDeadline.repeatMultiplierApplied}x Multiplier)
          </text>
          <text
            x="304"
            y="102"
            textAnchor="end"
            fill={fineColor}
            fontSize="11.5"
            fontWeight="700"
            className="clm-mono num-tabular"
          >
            AED {formatNumber(penaltyAndDeadline.estimatedMaxFineAed)}
          </text>
          <rect x="16" y="110" width="288" height="16" rx="6" fill="var(--bg-surface)" />
          <rect x="16" y="110" width={fineBarW} height="16" rx="6" fill={fineColor} />

          {/* Readiness Score Bar */}
          <text x="16" y="150" fill="var(--text-secondary)" fontSize="11" fontWeight="600">
            Readiness Index &amp; Active Gaps ({penaltyAndDeadline.activeViolationGapCount})
          </text>
          <text
            x="304"
            y="150"
            textAnchor="end"
            fill={statusColor}
            fontSize="11.5"
            fontWeight="700"
            className="clm-mono num-tabular"
          >
            {result.readinessScore}%
          </text>
          <rect x="16" y="158" width="288" height="14" rx="5" fill="var(--bg-surface)" />
          <rect x="16" y="158" width={scoreBarW} height="14" rx="5" fill={statusColor} />

          <text x="16" y="191" fill="var(--text-secondary)" fontSize="10" className="clm-mono">
            5-Yr Retention Mandate: {input.hasFiveYearGhgArchive ? 'Compliant' : 'Action Needed'}
          </text>
        </svg>
      </div>
    </div>
  );
}
