import { Copy, Download, ExternalLink, Lock, Printer, Save, Trash2 } from 'lucide-react';
import { buildClimateBriefMarkdown } from '../core/briefBuilder.ts';
import type { AssessmentInput, AssessmentResult } from '../core/types.ts';
import type { ApiMode, ClimateDossierRecord } from '../lib/api.ts';
import { formatAed, getText, statusLabel, type Locale } from '../lib/i18n.ts';

interface Props {
  mode: ApiMode;
  locale: Locale;
  input: AssessmentInput;
  result: AssessmentResult;
  dossiers: ClimateDossierRecord[];
  activeDossier: ClimateDossierRecord | null;
  draftTitle: string;
  busy: boolean;
  onDraftTitleChange: (next: string) => void;
  onSaveNew: () => void;
  onUpdateDraft: () => void;
  onSelectDossier: (dossier: ClimateDossierRecord) => void;
  onDuplicateDossier: (dossier: ClimateDossierRecord) => void;
  onFinalizeDossier: (dossier: ClimateDossierRecord) => void;
  onDeleteDossier: (dossier: ClimateDossierRecord) => void;
  onDownloadBrief: (dossier: ClimateDossierRecord, lang: Locale) => void;
  onDownloadCsv: (dossier: ClimateDossierRecord) => void;
  onOpenPublicReport: (slugOrCode: string) => void;
  onPrint: () => void;
}

export function DossierVaultAndPrint({
  locale,
  input,
  result,
  dossiers,
  activeDossier,
  draftTitle,
  busy,
  onDraftTitleChange,
  onSaveNew,
  onUpdateDraft,
  onSelectDossier,
  onDuplicateDossier,
  onFinalizeDossier,
  onDeleteDossier,
  onDownloadBrief,
  onDownloadCsv,
  onOpenPublicReport,
  onPrint,
}: Props) {
  const t = getText(locale);
  const previewCode = activeDossier?.dossierCode ?? 'PREVIEW-DRAFT';
  const previewBrief = buildClimateBriefMarkdown(
    input,
    result,
    previewCode,
    activeDossier?.dossierSha256 ?? result.dossierSha256,
    locale,
  );

  return (
    <div className="space-y-4">
      {/* Save / Update Controls */}
      <div className="no-print clm-card rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end">
          <label className="space-y-1.5 md:col-span-1">
            <span className="block text-xs font-semibold text-[var(--text-secondary)]">
              {t.vaultDossierTitle}
            </span>
            <input
              type="text"
              dir="auto"
              className="clm-input"
              placeholder={`${input.organizationName} (${input.reportingYear})`}
              value={draftTitle}
              onChange={(e) => onDraftTitleChange(e.target.value)}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2 md:col-span-2">
            <button
              type="button"
              data-testid="create-dossier-btn"
              disabled={busy}
              onClick={onSaveNew}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-xs font-bold text-[var(--accent-primary-fg)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{t.vaultSaveNew}</span>
            </button>

            {activeDossier && !activeDossier.lockedAt && (
              <button
                type="button"
                data-testid="update-dossier-btn"
                disabled={busy}
                onClick={onUpdateDraft}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--accent-primary)] bg-[var(--bg-soft)] px-4 py-2 text-xs font-bold text-[var(--accent-primary)]"
              >
                <Save className="h-3.5 w-3.5" />
                <span>
                  {t.vaultUpdateDraft} (<bdi dir="ltr">{activeDossier.dossierCode}</bdi>)
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{t.printBrief}</span>
            </button>
          </div>
        </div>

        {/* Saved Dossiers List */}
        <div className="border-t border-[var(--border-subtle)] pt-4 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
            {t.vaultSavedList} ({dossiers.length})
          </h3>

          {dossiers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-4 text-xs text-[var(--text-secondary)]">
              {t.vaultEmpty}
            </div>
          ) : (
            <div className="space-y-2.5">
              {dossiers.map((dossier) => {
                const isSelected = activeDossier?.dossierCode === dossier.dossierCode;
                return (
                  <div
                    key={dossier.dossierCode}
                    className="rounded-xl border p-3.5 transition-colors"
                    style={{
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--bg-soft)' : 'var(--bg-elevated)',
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectDossier(dossier)}
                        className="text-start"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="clm-mono text-xs font-bold text-[var(--accent-primary)]">
                            <bdi dir="ltr">{dossier.dossierCode}</bdi>
                          </span>
                          <span className="text-xs font-bold text-[var(--text-primary)]">
                            {dossier.title}
                          </span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{
                              backgroundColor: dossier.lockedAt
                                ? 'var(--accent-emerald-soft)'
                                : 'var(--accent-amber-soft)',
                              color: dossier.lockedAt
                                ? 'var(--accent-emerald)'
                                : 'var(--accent-amber)',
                            }}
                          >
                            {dossier.lockedAt ? t.vaultLockedBadge : t.vaultDraftBadge}
                          </span>
                        </div>
                        <div className="clm-mono num-tabular mt-1 text-[11px] text-[var(--text-secondary)]">
                          {locale === 'ar' ? (
                            <>
                              {statusLabel(dossier.status, locale)} ·{' '}
                              <bdi dir="ltr">{dossier.readinessScore}/100</bdi> · الحد الأقصى للغرامة{' '}
                              <bdi dir="ltr">{dossier.estimatedMaxFineAed.toLocaleString('en-US')}</bdi> د.إ
                            </>
                          ) : (
                            <bdi dir="ltr">
                              {statusLabel(dossier.status, locale)} · {dossier.readinessScore}/100 · Max
                              Fine {formatAed(dossier.estimatedMaxFineAed, locale)}
                            </bdi>
                          )}
                        </div>
                      </button>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {!dossier.lockedAt && (
                          <button
                            type="button"
                            data-testid="finalize-dossier-btn"
                            disabled={busy}
                            onClick={() => onFinalizeDossier(dossier)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-primary)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--accent-primary-fg)]"
                          >
                            <Lock className="h-3 w-3" />
                            <span>{t.vaultSealLock}</span>
                          </button>
                        )}
                        {dossier.lockedAt && (
                          <button
                            type="button"
                            data-testid="open-public-report-btn"
                            onClick={() =>
                              onOpenPublicReport(dossier.publicSlug || dossier.dossierCode)
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--accent-primary)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--accent-primary)]"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>{t.vaultOpenPublic}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onDuplicateDossier(dossier)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text-primary)]"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{t.vaultDuplicate}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownloadBrief(dossier, 'ar')}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text-primary)]"
                        >
                          <Download className="h-3 w-3" />
                          <span>{t.vaultDownloadMdAr}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownloadBrief(dossier, 'en')}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text-primary)]"
                        >
                          <Download className="h-3 w-3" />
                          <span>{t.vaultDownloadMdEn}</span>
                        </button>
                        <button
                          type="button"
                          data-testid="download-vault-csv-btn"
                          onClick={() => onDownloadCsv(dossier)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text-primary)]"
                        >
                          <Download className="h-3 w-3" />
                          <span>{t.vaultDownloadCsv}</span>
                        </button>
                        {!dossier.lockedAt && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onDeleteDossier(dossier)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--accent-crimson)]"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>{t.vaultDelete}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Printable A4 Executive Brief */}
      <div className="clm-card rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">{t.briefPreviewTitle}</h3>
          <span className="clm-mono text-[11px] text-[var(--text-secondary)]" dir="ltr">
            SHA-256: {result.dossierSha256.slice(0, 16)}…
          </span>
        </div>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--bg-elevated)] p-4 text-xs leading-relaxed text-[var(--text-primary)] print:max-h-none print:bg-white">
          {previewBrief}
        </pre>
      </div>
    </div>
  );
}
