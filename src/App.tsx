import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  FileSpreadsheet,
  Globe,
  Moon,
  Printer,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Vault,
} from 'lucide-react';
import { ClimateThresholdAndDeadlineSvg } from './components/ClimateThresholdAndDeadlineSvg.tsx';
import { ControlsAndFindingsPanel } from './components/ControlsAndFindingsPanel.tsx';
import { DossierVaultAndPrint } from './components/DossierVaultAndPrint.tsx';
import { FacilityCsvAuditPanel } from './components/FacilityCsvAuditPanel.tsx';
import { ScopeAndThresholdPanel } from './components/ScopeAndThresholdPanel.tsx';
import {
  CLIMATE_PRESETS,
  CLIMATEAE_TOOL_VERSION,
  LEGAL_DISCLAIMER_AR,
  LEGAL_DISCLAIMER_EN,
  assessClimateReadiness,
} from './core/index.ts';
import type { AssessmentInput, AssessmentResult } from './core/types.ts';
import {
  createDossier,
  deleteDossier,
  detectApiMode,
  downloadAuditCsv,
  downloadBriefMarkdown,
  duplicateDossier,
  finalizeDossier,
  getPublicReport,
  listDossiers,
  updateDossier,
  type ApiMode,
  type ClimateDossierRecord,
  type PublicClimateReport,
} from './lib/api.ts';
import { stripBase, withBase } from './lib/basePath.ts';
import {
  emirateLabel,
  formatAed,
  getText,
  sectorLabel,
  statusLabel,
  type Locale,
  type ThemeMode,
} from './lib/i18n.ts';

type WorkspaceTab = 'scope' | 'controls' | 'csv' | 'vault';

const LS_LOCALE = 'climateae.ui.locale';
const LS_THEME = 'climateae.ui.theme';

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ar';
  const stored = localStorage.getItem(LS_LOCALE);
  return stored === 'en' ? 'en' : 'ar';
}

function readInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'mangrove-vellum';
  const stored = localStorage.getItem(LS_THEME);
  return stored === 'desert-obsidian' ? 'desert-obsidian' : 'mangrove-vellum';
}

function parsePublicSlugFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  const rel = stripBase(window.location.pathname);
  const match = rel.match(/^\/r\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]!) : null;
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(readInitialLocale);
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);
  const [mode, setMode] = useState<ApiMode>('local');
  const [tab, setTab] = useState<WorkspaceTab>('scope');

  const [input, setInput] = useState<AssessmentInput>(() =>
    structuredClone(CLIMATE_PRESETS[1]!.input),
  );
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [dossiers, setDossiers] = useState<ClimateDossierRecord[]>([]);
  const [activeDossier, setActiveDossier] = useState<ClimateDossierRecord | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [publicSlug, setPublicSlug] = useState<string | null>(parsePublicSlugFromLocation);
  const [publicReport, setPublicReport] = useState<PublicClimateReport | null>(null);
  const [publicLoading, setPublicLoading] = useState(false);

  const t = getText(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem(LS_LOCALE, locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'desert-obsidian' ? '#081310' : '#F7F9F6');
    }
    localStorage.setItem(LS_THEME, theme);
  }, [theme]);

  useEffect(() => {
    const onPopState = () => {
      setPublicSlug(parsePublicSlugFromLocation());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const detected = await detectApiMode();
      if (cancelled) return;
      setMode(detected);
      const saved = await listDossiers(detected);
      if (!cancelled) setDossiers(saved);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void assessClimateReadiness(input).then((res) => {
      if (!cancelled) setResult(res);
    });
    return () => {
      cancelled = true;
    };
  }, [input]);

  useEffect(() => {
    if (!publicSlug) {
      setPublicReport(null);
      return;
    }
    let cancelled = false;
    setPublicLoading(true);
    void (async () => {
      const detected = await detectApiMode();
      if (cancelled) return;
      setMode(detected);
      const rep = await getPublicReport(detected, publicSlug);
      if (!cancelled) {
        setPublicReport(rep);
        setPublicLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicSlug]);

  const navigateToPublic = (slugOrCode: string) => {
    window.history.pushState({}, '', withBase(`/r/${encodeURIComponent(slugOrCode)}`));
    setPublicSlug(slugOrCode);
  };

  const navigateHome = () => {
    window.history.pushState({}, '', withBase('/'));
    setPublicSlug(null);
  };

  const refreshDossiers = async (nextMode: ApiMode = mode) => {
    const items = await listDossiers(nextMode);
    setDossiers(items);
  };

  const handleSaveNew = async () => {
    setBusy(true);
    setErrorMsg(null);
    try {
      const created = await createDossier(mode, input, draftTitle || undefined);
      setActiveDossier(created);
      setDraftTitle(created.title);
      await refreshDossiers();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateDraft = async () => {
    if (!activeDossier) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const updated = await updateDossier(
        mode,
        activeDossier.dossierCode,
        input,
        draftTitle || activeDossier.title,
      );
      setActiveDossier(updated);
      await refreshDossiers();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async (dossier: ClimateDossierRecord) => {
    setBusy(true);
    setErrorMsg(null);
    try {
      const copy = await duplicateDossier(mode, dossier.dossierCode);
      setActiveDossier(copy);
      setInput(structuredClone(copy.input));
      setDraftTitle(copy.title);
      await refreshDossiers();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Duplicate failed');
    } finally {
      setBusy(false);
    }
  };

  const handleFinalize = async (dossier: ClimateDossierRecord) => {
    setBusy(true);
    setErrorMsg(null);
    try {
      const sealed = await finalizeDossier(mode, dossier.dossierCode);
      if (activeDossier?.dossierCode === sealed.dossierCode) {
        setActiveDossier(sealed);
      }
      await refreshDossiers();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Finalize failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (dossier: ClimateDossierRecord) => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await deleteDossier(mode, dossier.dossierCode);
      if (activeDossier?.dossierCode === dossier.dossierCode) {
        setActiveDossier(null);
      }
      await refreshDossiers();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  if (publicSlug) {
    return (
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="no-print flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={navigateHome}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-bold text-[var(--text-primary)]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t.publicBackStudio}</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLocale((prev) => (prev === 'ar' ? 'en' : 'ar'))}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-bold"
              >
                {t.toggleLang}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-3.5 py-2 text-xs font-bold text-[var(--accent-primary-fg)]"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>{t.printBrief}</span>
              </button>
            </div>
          </div>

          {publicLoading ? (
            <div className="clm-card rounded-2xl p-8 text-center text-sm text-[var(--text-secondary)]">
              Loading {publicSlug}…
            </div>
          ) : !publicReport ? (
            <div className="clm-card rounded-2xl p-8 text-center text-sm font-semibold text-[var(--accent-crimson)]">
              {t.publicNotFound}
            </div>
          ) : (
            <div className="clm-card rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <div className="clm-mono text-xs font-bold text-[var(--accent-primary)]">
                    <bdi dir="ltr">{publicReport.report.dossierCode}</bdi> ·{' '}
                    <bdi dir="ltr">{publicReport.report.publicSlug}</bdi>
                  </div>
                  <h1 className="mt-1 text-xl font-extrabold text-[var(--text-primary)]">
                    {publicReport.report.organizationName}
                  </h1>
                  <div className="mt-1 text-xs text-[var(--text-secondary)]">
                    {emirateLabel(publicReport.report.emirate, locale)} ·{' '}
                    {sectorLabel(publicReport.report.sector, locale)} · FY
                    {publicReport.report.reportingYear}
                  </div>
                </div>
                <div className="text-end">
                  <div className="text-sm font-extrabold text-[var(--accent-primary)]">
                    {statusLabel(publicReport.report.status, locale)} ·{' '}
                    <bdi dir="ltr">{publicReport.report.readinessScore}/100</bdi>
                  </div>
                  <div className="clm-mono num-tabular mt-1 text-xs text-[var(--text-secondary)]">
                    {t.publicViewsLabel} <bdi dir="ltr">{publicReport.viewCount}</bdi>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[var(--accent-amber-soft)] p-3 text-xs leading-relaxed text-[var(--text-primary)]">
                {locale === 'ar'
                  ? publicReport.report.legalDisclaimerAr
                  : publicReport.report.legalDisclaimerEn}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-[var(--bg-elevated)] p-3 text-xs">
                  <div className="text-[var(--text-secondary)]">{t.statScope12}</div>
                  <div className="clm-mono num-tabular mt-1 font-bold">
                    <bdi dir="ltr">
                      {publicReport.report.scopeThreshold.totalScope1And2Tco2e.toLocaleString(
                        'en-US',
                      )}{' '}
                      tCO2e
                    </bdi>
                  </div>
                </div>
                <div className="rounded-xl bg-[var(--bg-elevated)] p-3 text-xs">
                  <div className="text-[var(--text-secondary)]">{t.statDeadline}</div>
                  <div className="clm-mono num-tabular mt-1 font-bold">
                    <bdi dir="ltr">
                      {publicReport.report.penaltyAndDeadline.verificationDeadlineDate}
                    </bdi>
                  </div>
                </div>
                <div className="rounded-xl bg-[var(--bg-elevated)] p-3 text-xs">
                  <div className="text-[var(--text-secondary)]">{t.statFineBand}</div>
                  <div className="clm-mono num-tabular mt-1 font-bold">
                    <bdi dir="ltr">
                      {formatAed(
                        publicReport.report.penaltyAndDeadline.estimatedMaxFineAed,
                        locale,
                      )}
                    </bdi>
                  </div>
                </div>
              </div>

              <pre className="whitespace-pre-wrap rounded-xl bg-[var(--bg-elevated)] p-4 text-xs leading-relaxed text-[var(--text-primary)]">
                {locale === 'ar' ? publicReport.report.briefAr : publicReport.report.briefEn}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Top Header */}
        <header className="no-print clm-card rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-primary)] text-[var(--accent-primary-fg)]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">
                    {t.appName}
                  </h1>
                  <span className="clm-mono rounded-full bg-[var(--bg-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--accent-primary)]">
                    v{CLIMATEAE_TOOL_VERSION}
                  </span>
                  <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                    {mode === 'server' ? t.serverMode : t.localMode}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  {t.appSubtitle}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="lang-toggle"
                onClick={() => setLocale((prev) => (prev === 'ar' ? 'en' : 'ar'))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{t.toggleLang}</span>
              </button>

              <button
                type="button"
                data-testid="theme-toggle"
                onClick={() =>
                  setTheme((prev) =>
                    prev === 'mangrove-vellum' ? 'desert-obsidian' : 'mangrove-vellum',
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
              >
                {theme === 'mangrove-vellum' ? (
                  <Moon className="h-3.5 w-3.5" />
                ) : (
                  <Sun className="h-3.5 w-3.5" />
                )}
                <span>{theme === 'mangrove-vellum' ? t.themeObsidian : t.themeVellum}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-3.5 py-2 text-xs font-bold text-[var(--accent-primary-fg)] hover:bg-[var(--accent-primary-hover)]"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>{t.printBrief}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="space-y-5">
          {/* Non-Affiliation Disclaimer Banner */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--accent-amber-soft)] p-3.5 text-xs leading-relaxed text-[var(--text-primary)]">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-amber)]" />
            <span>{locale === 'ar' ? LEGAL_DISCLAIMER_AR : LEGAL_DISCLAIMER_EN}</span>
          </div>

          {/* One-Click Presets */}
          <section className="no-print clm-card rounded-2xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-[var(--text-secondary)]">{t.presetsHeading}</div>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              {CLIMATE_PRESETS.map((preset) => {
                const active = input.organizationName === preset.input.organizationName;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    data-testid={`preset-${preset.id}`}
                    onClick={() => {
                      setInput(structuredClone(preset.input));
                      setActiveDossier(null);
                      setDraftTitle('');
                    }}
                    className="rounded-xl border p-3 text-start transition-colors"
                    style={{
                      borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      backgroundColor: active ? 'var(--bg-soft)' : 'var(--bg-elevated)',
                    }}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-[var(--accent-primary)]" />
                      <span>{locale === 'ar' ? preset.labelAr : preset.labelEn}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                      {locale === 'ar' ? preset.descriptionAr : preset.descriptionEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {errorMsg && (
            <div className="rounded-xl bg-[var(--accent-crimson-soft)] p-3 text-xs font-semibold text-[var(--accent-crimson)]">
              {errorMsg}
            </div>
          )}

          {/* Dual SVG Telemetry */}
          {result && <ClimateThresholdAndDeadlineSvg input={input} result={result} locale={locale} />}

          {/* Workspace Navigation Tabs */}
          <nav className="no-print flex flex-wrap gap-2">
            {(
              [
                ['scope', t.tabScope, SlidersHorizontal],
                ['controls', t.tabControls, ShieldCheck],
                ['csv', t.tabCsv, FileSpreadsheet],
                ['vault', t.tabVault, Vault],
              ] as const
            ).map(([id, label, Icon]) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  data-testid={`tab-${id}`}
                  onClick={() => setTab(id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors"
                  style={{
                    borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    color: active ? 'var(--accent-primary-fg)' : 'var(--text-primary)',
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Active Panel */}
          {result && tab === 'scope' && (
            <ScopeAndThresholdPanel input={input} result={result} locale={locale} onChange={setInput} />
          )}
          {result && tab === 'controls' && (
            <ControlsAndFindingsPanel
              input={input}
              result={result}
              locale={locale}
              onChange={setInput}
            />
          )}
          {result && tab === 'csv' && (
            <FacilityCsvAuditPanel input={input} result={result} locale={locale} onChange={setInput} />
          )}
          {result && tab === 'vault' && (
            <DossierVaultAndPrint
              mode={mode}
              locale={locale}
              input={input}
              result={result}
              dossiers={dossiers}
              activeDossier={activeDossier}
              draftTitle={draftTitle}
              busy={busy}
              onDraftTitleChange={setDraftTitle}
              onSaveNew={handleSaveNew}
              onUpdateDraft={handleUpdateDraft}
              onSelectDossier={(d) => {
                setActiveDossier(d);
                setInput(structuredClone(d.input));
                setDraftTitle(d.title);
              }}
              onDuplicateDossier={handleDuplicate}
              onFinalizeDossier={handleFinalize}
              onDeleteDossier={handleDelete}
              onDownloadBrief={(d, lang) => downloadBriefMarkdown(mode, d, lang)}
              onDownloadCsv={(d) => downloadAuditCsv(mode, d)}
              onOpenPublicReport={navigateToPublic}
              onPrint={() => window.print()}
            />
          )}
        </main>
      </div>
    </div>
  );
}
