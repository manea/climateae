import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { CLIMATE_CONTROLS } from '../core/climateCatalog.ts';
import type { AssessmentInput, AssessmentResult, ClimateControlId } from '../core/types.ts';
import { getText, type Locale } from '../lib/i18n.ts';

interface Props {
  input: AssessmentInput;
  result: AssessmentResult;
  locale: Locale;
  onChange: (next: AssessmentInput) => void;
}

export function ControlsAndFindingsPanel({ input, result, locale, onChange }: Props) {
  const t = getText(locale);
  const implementedSet = new Set(input.implementedControls);

  const toggleControl = (id: ClimateControlId) => {
    const next = new Set(input.implementedControls);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ ...input, implementedControls: Array.from(next) });
  };

  const selectAll = () => {
    onChange({
      ...input,
      implementedControls: CLIMATE_CONTROLS.map((c) => c.id),
    });
  };

  const clearAll = () => {
    onChange({ ...input, implementedControls: [] });
  };

  return (
    <div className="space-y-4">
      {/* Controls Checklist */}
      <div className="clm-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">{t.controlsHeader}</h2>
            <p className="clm-mono num-tabular text-xs text-[var(--text-secondary)]" dir="ltr">
              Score: {result.readinessScore}/100 ({input.implementedControls.length}/
              {CLIMATE_CONTROLS.length} controls)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
            >
              {t.selectAll}
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--accent-crimson)]"
            >
              {t.clearAll}
            </button>
          </div>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.max(4, result.readinessScore)}%`,
              backgroundColor:
                result.status === 'ready'
                  ? 'var(--accent-emerald)'
                  : result.status === 'conditional'
                    ? 'var(--accent-amber)'
                    : 'var(--accent-crimson)',
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {CLIMATE_CONTROLS.map((ctrl) => {
            const active = implementedSet.has(ctrl.id);
            return (
              <label
                key={ctrl.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors"
                style={{
                  borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  backgroundColor: active ? 'var(--bg-soft)' : 'var(--bg-elevated)',
                }}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--accent-primary)]"
                  checked={active}
                  onChange={() => toggleControl(ctrl.id)}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="clm-mono text-xs font-bold text-[var(--accent-primary)]">
                      {ctrl.id}
                    </span>
                    <span className="clm-mono num-tabular rounded-full bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                      {ctrl.weight}%
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">
                    {locale === 'ar' ? ctrl.titleAr : ctrl.titleEn}
                  </div>
                  <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                    {locale === 'ar' ? ctrl.descriptionAr : ctrl.descriptionEn}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Statutory Findings */}
      <div className="clm-card rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">{t.findingsHeader}</h2>
        {result.findings.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-[var(--accent-emerald-soft)] p-3 text-xs font-semibold text-[var(--accent-emerald)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{t.noFindings}</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {result.findings.map((finding) => {
              const isBlocker = finding.severity === 'blocker';
              const isWarning = finding.severity === 'warning';
              const bg = isBlocker
                ? 'var(--accent-crimson-soft)'
                : isWarning
                  ? 'var(--accent-amber-soft)'
                  : 'var(--accent-teal-soft)';
              const fg = isBlocker
                ? 'var(--accent-crimson)'
                : isWarning
                  ? 'var(--accent-amber)'
                  : 'var(--accent-teal)';
              const badge = isBlocker ? t.sevBlocker : isWarning ? t.sevWarning : t.sevInfo;

              return (
                <div
                  key={finding.code}
                  className="rounded-xl border border-[var(--border-subtle)] p-3.5"
                  style={{ backgroundColor: bg }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isBlocker ? (
                        <XCircle className="h-4 w-4 shrink-0" style={{ color: fg }} />
                      ) : isWarning ? (
                        <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: fg }} />
                      ) : (
                        <Info className="h-4 w-4 shrink-0" style={{ color: fg }} />
                      )}
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {locale === 'ar' ? finding.titleAr : finding.titleEn}
                      </span>
                    </div>
                    <span
                      className="clm-mono rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                      style={{ color: fg, backgroundColor: 'var(--bg-surface)' }}
                    >
                      {badge} · {finding.code}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {locale === 'ar' ? finding.detailAr : finding.detailEn}
                  </p>
                  <div className="clm-mono mt-1 text-[11px] font-medium text-[var(--text-secondary)]" dir="ltr">
                    {finding.legalRef}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
