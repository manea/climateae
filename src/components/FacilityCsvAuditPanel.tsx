import type { ChangeEvent } from 'react';
import { Download, FileSpreadsheet, Trash2, Upload } from 'lucide-react';
import { exportFacilitiesAuditCsv } from '../core/facilityCsvAuditor.ts';
import { CLIMATE_PRESETS } from '../core/presets.ts';
import type { AssessmentInput, AssessmentResult } from '../core/types.ts';
import { triggerTextDownload } from '../lib/api.ts';
import { formatNumber, getText, statusLabel, type Locale } from '../lib/i18n.ts';

interface Props {
  input: AssessmentInput;
  result: AssessmentResult;
  locale: Locale;
  onChange: (next: AssessmentInput) => void;
}

export function FacilityCsvAuditPanel({ input, result, locale, onChange }: Props) {
  const t = getText(locale);
  const summary = result.csvAudit;

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onChange({ ...input, facilitiesCsv: text });
    e.target.value = '';
  };

  const handleLoadSample = () => {
    onChange({ ...input, facilitiesCsv: CLIMATE_PRESETS[2]!.input.facilitiesCsv ?? '' });
  };

  const handleClear = () => {
    onChange({ ...input, facilitiesCsv: undefined });
  };

  const handleDownloadSafeCsv = () => {
    if (!summary) return;
    const safeCsv = exportFacilitiesAuditCsv(summary);
    triggerTextDownload('climateae-facilities-audit.csv', 'text/csv;charset=utf-8', safeCsv);
  };

  return (
    <div className="clm-card rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <FileSpreadsheet className="h-4 w-4 text-[var(--accent-primary)]" />
            <span>{t.csvHeader}</span>
          </h2>
          <p className="clm-mono text-[11px] text-[var(--text-secondary)]" dir="ltr">
            {t.csvHint}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]">
            <Upload className="h-3.5 w-3.5" />
            <span>{t.csvUpload}</span>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileUpload} />
          </label>
          <button
            type="button"
            onClick={handleLoadSample}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
          >
            {t.csvLoadSample}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--accent-crimson)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t.csvClear}</span>
          </button>
        </div>
      </div>

      <textarea
        rows={6}
        dir="ltr"
        className="clm-input clm-mono text-xs"
        placeholder="facility_id,facility_name,emirate,sector,scope1_tco2e,scope2_tco2e,iso14065_verified,archive_5yr_ready"
        value={input.facilitiesCsv ?? ''}
        onChange={(e) => onChange({ ...input, facilitiesCsv: e.target.value || undefined })}
      />

      {summary && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl bg-[var(--bg-elevated)] p-2.5 text-center">
              <div className="text-[11px] text-[var(--text-secondary)]">{t.csvReady}</div>
              <div className="clm-mono num-tabular text-base font-bold text-[var(--accent-emerald)]">
                {summary.readyCount}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--bg-elevated)] p-2.5 text-center">
              <div className="text-[11px] text-[var(--text-secondary)]">{t.csvConditional}</div>
              <div className="clm-mono num-tabular text-base font-bold text-[var(--accent-amber)]">
                {summary.conditionalCount}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--bg-elevated)] p-2.5 text-center">
              <div className="text-[11px] text-[var(--text-secondary)]">{t.csvBlocked}</div>
              <div className="clm-mono num-tabular text-base font-bold text-[var(--accent-crimson)]">
                {summary.blockedCount}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--bg-elevated)] p-2.5 text-center">
              <div className="text-[11px] text-[var(--text-secondary)]">{t.csvEadSites}</div>
              <div className="clm-mono num-tabular text-base font-bold text-[var(--text-primary)]">
                {summary.eadMandatoryCount}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--bg-elevated)] p-2.5 text-center">
              <div className="text-[11px] text-[var(--text-secondary)]">{t.csvNrccSites}</div>
              <div className="clm-mono num-tabular text-base font-bold text-[var(--accent-crimson)]">
                {summary.nrccHugeEmitterCount}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleDownloadSafeCsv}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-3 py-2.5 text-xs font-bold text-[var(--accent-primary-fg)] hover:bg-[var(--accent-primary-hover)]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{t.csvDownloadBom}</span>
              </button>
            </div>
          </div>

          {summary.parseErrors.length > 0 && (
            <div className="rounded-xl bg-[var(--accent-amber-soft)] p-3 text-xs font-semibold text-[var(--accent-amber)]">
              {summary.parseErrors.join(' ')}
            </div>
          )}

          {summary.rows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
              <table className="w-full text-left text-xs" dir="ltr">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Facility</th>
                    <th className="px-3 py-2">Emirate</th>
                    <th className="px-3 py-2">Scope 1</th>
                    <th className="px-3 py-2">Scope 2</th>
                    <th className="px-3 py-2">EAD 25k</th>
                    <th className="px-3 py-2">NRCC 500k</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {summary.rows.map((row) => (
                    <tr key={`${row.rowNumber}-${row.facilityId}`}>
                      <td className="clm-mono px-3 py-2">{row.rowNumber}</td>
                      <td className="px-3 py-2 font-medium text-[var(--text-primary)]">
                        <span className="clm-mono mr-1.5 text-[var(--text-secondary)]">
                          {row.facilityId}
                        </span>
                        {row.facilityName}
                      </td>
                      <td className="clm-mono px-3 py-2">{row.emirate}</td>
                      <td className="clm-mono num-tabular px-3 py-2">
                        {formatNumber(row.scope1Tco2e)}
                      </td>
                      <td className="clm-mono num-tabular px-3 py-2">
                        {formatNumber(row.scope2Tco2e)}
                      </td>
                      <td className="px-3 py-2">{row.eadMandatory ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2">{row.nrccHugeEmitter ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2 font-bold">
                        <span
                          style={{
                            color:
                              row.status === 'ready'
                                ? 'var(--accent-emerald)'
                                : row.status === 'conditional'
                                  ? 'var(--accent-amber)'
                                  : 'var(--accent-crimson)',
                          }}
                        >
                          {statusLabel(row.status, locale)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
