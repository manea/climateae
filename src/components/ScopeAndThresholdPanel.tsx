import type { AssessmentInput, AssessmentResult } from '../core/types.ts';
import {
  EMIRATE_OPTIONS,
  SECTOR_OPTIONS,
  VERIFIER_OPTIONS,
  formatAed,
  formatNumber,
  getText,
  nrccTierLabel,
  type Locale,
} from '../lib/i18n.ts';

interface Props {
  input: AssessmentInput;
  result: AssessmentResult;
  locale: Locale;
  onChange: (next: AssessmentInput) => void;
}

export function ScopeAndThresholdPanel({ input, result, locale, onChange }: Props) {
  const t = getText(locale);
  const { scopeThreshold, penaltyAndDeadline } = result;

  const updateField = <K extends keyof AssessmentInput>(key: K, value: AssessmentInput[K]) => {
    onChange({ ...input, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Live Summary KPI Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="clm-card rounded-xl p-3.5">
          <div className="text-xs font-medium text-[var(--text-secondary)]">{t.statScope12}</div>
          <div className="clm-mono num-tabular mt-1 text-lg font-bold text-[var(--text-primary)]">
            {locale === 'ar' ? (
              <>
                <bdi dir="ltr">{formatNumber(scopeThreshold.totalScope1And2Tco2e)}</bdi> طن
              </>
            ) : (
              <bdi dir="ltr">{formatNumber(scopeThreshold.totalScope1And2Tco2e)} tCO2e</bdi>
            )}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
            {locale === 'ar' ? (
              <>
                نطاق 3: <bdi dir="ltr">{formatNumber(input.scope3Tco2e)}</bdi> طن
              </>
            ) : (
              `Scope 3: ${formatNumber(input.scope3Tco2e)} tCO2e`
            )}
          </div>
        </div>

        <div className="clm-card rounded-xl p-3.5">
          <div className="text-xs font-medium text-[var(--text-secondary)]">{t.statEad25k}</div>
          <div
            className="mt-1 text-sm font-bold"
            style={{
              color: scopeThreshold.eadMandatoryMrvApplies
                ? 'var(--accent-amber)'
                : 'var(--accent-emerald)',
            }}
          >
            {scopeThreshold.eadMandatoryMrvApplies ? (
              locale === 'ar' ? (
                <>
                  إلزامية <bdi dir="ltr">ISO 14065</bdi>
                </>
              ) : (
                t.eadActive
              )
            ) : (
              t.eadInactive
            )}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
            {locale === 'ar' ? (
              <>
                نطاق 1: <bdi dir="ltr">{formatNumber(input.scope1Tco2e)} / 25,000</bdi> طن
              </>
            ) : (
              `Scope 1: ${formatNumber(input.scope1Tco2e)} / 25,000 t`
            )}
          </div>
        </div>

        <div className="clm-card rounded-xl p-3.5">
          <div className="text-xs font-medium text-[var(--text-secondary)]">{t.statNrccTier}</div>
          <div
            className="mt-1 text-xs font-bold leading-snug"
            style={{
              color:
                scopeThreshold.nrccTier === 'huge_emitter_mandatory'
                  ? 'var(--accent-crimson)'
                  : 'var(--accent-teal)',
            }}
          >
            {nrccTierLabel(scopeThreshold.nrccTier, locale)}
          </div>
        </div>

        <div className="clm-card rounded-xl p-3.5">
          <div className="text-xs font-medium text-[var(--text-secondary)]">{t.statDeadline}</div>
          <div className="clm-mono num-tabular mt-1 text-base font-bold text-[var(--text-primary)]">
            <bdi dir="ltr">{penaltyAndDeadline.verificationDeadlineDate}</bdi>
          </div>
          <div
            className="mt-1 text-[11px] font-semibold"
            style={{
              color: penaltyAndDeadline.deadlineOverdue
                ? 'var(--accent-crimson)'
                : 'var(--accent-amber)',
            }}
          >
            {penaltyAndDeadline.deadlineOverdue ? (
              <>
                {t.daysOverduePrefix}{' '}
                <bdi dir="ltr">{Math.abs(penaltyAndDeadline.daysRemainingToDeadline)}</bdi>
              </>
            ) : (
              <>
                <bdi dir="ltr">{penaltyAndDeadline.daysRemainingToDeadline}</bdi> {t.daysLeftSuffix}
              </>
            )}
          </div>
        </div>

        <div className="clm-card rounded-xl p-3.5">
          <div className="text-xs font-medium text-[var(--text-secondary)]">{t.statFineBand}</div>
          <div
            className="clm-mono num-tabular mt-1 text-sm font-bold leading-snug"
            style={{
              color:
                penaltyAndDeadline.estimatedMaxFineAed > 0
                  ? 'var(--accent-crimson)'
                  : 'var(--accent-emerald)',
            }}
          >
            {locale === 'ar' ? (
              penaltyAndDeadline.estimatedMaxFineAed === 0 ? (
                <>
                  <bdi dir="ltr">0</bdi> د.إ
                </>
              ) : (
                <>
                  <bdi dir="ltr">
                    {formatNumber(penaltyAndDeadline.estimatedMinFineAed)} –{' '}
                    {formatNumber(penaltyAndDeadline.estimatedMaxFineAed)}
                  </bdi>{' '}
                  د.إ
                </>
              )
            ) : (
              <bdi dir="ltr">
                {formatAed(penaltyAndDeadline.estimatedMinFineAed, locale)} –{' '}
                {formatAed(penaltyAndDeadline.estimatedMaxFineAed, locale)}
              </bdi>
            )}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
            {locale === 'ar' ? (
              <>
                مضاعف التكرار: <bdi dir="ltr">{penaltyAndDeadline.repeatMultiplierApplied}x</bdi>
              </>
            ) : (
              `Repeat multiplier: ${penaltyAndDeadline.repeatMultiplierApplied}x`
            )}
          </div>
        </div>
      </div>

      {/* Main Parameters Form */}
      <div className="clm-card rounded-2xl p-5 space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1.5 lg:col-span-2">
            <span className="block text-xs font-semibold text-[var(--text-secondary)]">
              {t.organizationName}
            </span>
            <input
              type="text"
              dir="auto"
              className="clm-input"
              value={input.organizationName}
              onChange={(e) => updateField('organizationName', e.target.value)}
            />
          </label>

          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-[var(--text-secondary)]">
              {t.emirate}
            </span>
            <select
              className="clm-input"
              value={input.emirate}
              onChange={(e) =>
                updateField('emirate', e.target.value as AssessmentInput['emirate'])
              }
            >
              {EMIRATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {locale === 'ar' ? opt.labelAr : opt.labelEn}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 lg:col-span-2">
            <span className="block text-xs font-semibold text-[var(--text-secondary)]">
              {t.sector}
            </span>
            <select
              className="clm-input"
              value={input.sector}
              onChange={(e) => updateField('sector', e.target.value as AssessmentInput['sector'])}
            >
              {SECTOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {locale === 'ar' ? opt.labelAr : opt.labelEn}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-[var(--text-secondary)]">
              {t.verifierAccreditation}
            </span>
            <select
              className="clm-input"
              value={input.verifierAccreditation}
              onChange={(e) =>
                updateField(
                  'verifierAccreditation',
                  e.target.value as AssessmentInput['verifierAccreditation'],
                )
              }
            >
              {VERIFIER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {locale === 'ar' ? opt.labelAr : opt.labelEn}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-[var(--text-secondary)]">
              {t.reportingYear}
            </span>
            <input
              type="number"
              dir="ltr"
              min={2024}
              max={2050}
              className="clm-input clm-mono num-tabular"
              value={input.reportingYear}
              onChange={(e) => updateField('reportingYear', Math.max(2024, Number(e.target.value) || 2026))}
            />
          </label>

          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-[var(--text-secondary)]">
              {t.assessmentDate}
            </span>
            <input
              type="date"
              dir="ltr"
              className="clm-input clm-mono num-tabular"
              value={input.assessmentDate}
              onChange={(e) => updateField('assessmentDate', e.target.value)}
            />
          </label>

          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-[var(--text-secondary)]">
              {t.priorViolationsCount}
            </span>
            <input
              type="number"
              dir="ltr"
              min={0}
              className="clm-input clm-mono num-tabular"
              value={input.priorViolationsCount}
              onChange={(e) =>
                updateField('priorViolationsCount', Math.max(0, Math.trunc(Number(e.target.value) || 0)))
              }
            />
          </label>

          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-[var(--text-secondary)]">
              {t.scope1}
            </span>
            <input
              type="number"
              dir="ltr"
              min={0}
              step="any"
              className="clm-input clm-mono num-tabular"
              value={input.scope1Tco2e}
              onChange={(e) => updateField('scope1Tco2e', Math.max(0, Number(e.target.value) || 0))}
            />
          </label>

          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-[var(--text-secondary)]">
              {t.scope2}
            </span>
            <input
              type="number"
              dir="ltr"
              min={0}
              step="any"
              className="clm-input clm-mono num-tabular"
              value={input.scope2Tco2e}
              onChange={(e) => updateField('scope2Tco2e', Math.max(0, Number(e.target.value) || 0))}
            />
          </label>

          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-[var(--text-secondary)]">
              {t.scope3}
            </span>
            <input
              type="number"
              dir="ltr"
              min={0}
              step="any"
              className="clm-input clm-mono num-tabular"
              value={input.scope3Tco2e}
              onChange={(e) => updateField('scope3Tco2e', Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
        </div>

        {/* Compliance Boolean Switches */}
        <div className="grid grid-cols-1 gap-3 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ['isFreeZone', t.isFreeZone],
              ['registeredOnMoccaeMrv', t.registeredOnMoccaeMrv],
              ['registeredOnNrcc', t.registeredOnNrcc],
              ['hasFiveYearGhgArchive', t.hasFiveYearGhgArchive],
              ['hasReductionAdaptationPlan', t.hasReductionAdaptationPlan],
              ['repeatViolationWithinTwoYears', t.repeatViolation],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2.5 text-xs font-medium text-[var(--text-primary)]"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--accent-primary)]"
                checked={Boolean(input[key])}
                onChange={(e) => updateField(key, e.target.checked)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        <label className="block space-y-1.5">
          <span className="block text-xs font-semibold text-[var(--text-secondary)]">
            {t.notes}
          </span>
          <textarea
            rows={2}
            dir="auto"
            className="clm-input"
            placeholder={t.notesPlaceholder}
            value={input.notes ?? ''}
            onChange={(e) => updateField('notes', e.target.value || undefined)}
          />
        </label>
      </div>
    </div>
  );
}
