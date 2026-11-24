# Changelog — ClimateAE

All notable changes to ClimateAE are documented in this file.

## [0.5.0] - 2026-11-25
### Added
- **Open-Source MIT Release & CI Verification**: added `LICENSE` (MIT License), automated `.github/workflows/ci.yml` (Node 22 typecheck, Vitest unit/server tests, and production Vite build), visual screenshot showcase (`docs/screenshots/*.png`) embedded in `README.md`, and live production readiness verification.

## [0.4.0] - 2026-11-25
### Added
- **Playwright Chrome End-to-End Test Suite (`playwright.config.ts`, `tests/e2e/climateae.spec.ts`)**: tests `AR RTL / Mangrove Vellum` and `EN LTR / Desert Obsidian` switching across `1280×800` desktop and `390×844` mobile viewports with zero horizontal overflow, full Preset #2 (`25,000 tCO2e` EAD conditional) and Preset #3 remediation workflows, atomic `CLM-YYYY-0001` sealing, raw wire `UTF-8 BOM` `[0xef, 0xbb, 0xbf]` CSV downloads, and persistent `/r/:code` public report view counts.
- **Zero-Dollar Self-Hosting & Cloud Bundle**: [`wrangler.jsonc`](wrangler.jsonc) (`$0` Cloudflare Workers Static Assets), multi-stage [`Dockerfile`](Dockerfile), [`docker-compose.yml`](docker-compose.yml), [`.dockerignore`](.dockerignore), [`deploy/*`](deploy/.env.example) (`systemd` service, `VACUUM INTO` online SQLite backup script, Caddy proxy template, clean public export sanitizer), [`README.md`](README.md), and [`launch/DEPLOY-AND-SHARE.md`](launch/DEPLOY-AND-SHARE.md).

## [0.3.0] - 2026-11-25
### Added
- **Interactive Bilingual Web Studio (`AR RTL / EN LTR`, React 19 + Tailwind CSS v4 + Vite)**:
  - Dual curated visual themes: **Mangrove Vellum** (light parchment/emerald default) and **Desert Obsidian** (high-contrast dark mode) with persisted locale/theme preferences.
  - **Dual-Panel SVG Telemetry (`ClimateThresholdAndDeadlineSvg`)**: tracks Scope 1 vs. Abu Dhabi EAD `25,000 tCO2e` threshold, Scope 1+2 vs. NRCC `500,000 tCO2e` threshold, FY verification cutoff countdown (`YYYY-03-31`), statutory Law `11/2024` fine ceiling (`AED 0 / 2M / 4M`), and readiness score.
  - Interactive UAE Scope & Threshold Simulator (`ScopeAndThresholdPanel`), weighted Controls & Findings Inspector (`ControlsAndFindingsPanel`), Multi-Site Facility CSV Auditor with `CWE-1236` & `UTF-8 BOM` export (`FacilityCsvAuditPanel`), Dossier Vault + `A4 PDF` executive print layout (`DossierVaultAndPrint`), and read-only `/r/:slugOrCode` public report viewer.
  - **Dual Execution Modes**: automatic backend detection (`/health` -> SQLite WAL API) with seamless zero-cost `$0 localStorage` fallback (`climateae.v1.*`) for static Cloudflare Workers deployment.

## [0.2.0] - 2026-11-25
### Added
- **Bilingual UAE Climate Readiness Brief Builder (`src/core/briefBuilder.ts`)**: generates structured Arabic RTL and English Markdown dossiers with non-MOCCAE/non-EAD/non-NRCC independence notice, Federal Climate Law `11/2024` & Abu Dhabi EAD `03/2026` & NRCC `67/2024` scope matrix, verification deadline countdown, statutory fine range (`AED 50,000–4,000,000`), control posture, facility CSV inventory, and canonical `SHA-256` digest.
- **Zero-Dependency Node 22 SQLite WAL Backend (`server/db.mjs`, `server/app.mjs`, `server/index.mjs`, `server/app.d.mts`)**:
  - Built-in `node:sqlite` (`WAL` mode) persistence for UAE organization profiles (`profiles`), versioned climate readiness dossiers (`assessments` with atomic `CLM-YYYY-0001` counters and immutable `locked_at` sealing), and public report view analytics (`public_report_views`).
  - Full REST API: `/health`, `/readyz`, `/api/presets`, `/api/scope-thresholds`, `/api/penalty-deadline`, `/api/audit-csv`, `/api/assess`, `/api/profiles`, `/api/(assessments|dossiers)` (`duplicate`, `finalize`, `lock` -> `409`, `brief.md`, `CWE-1236` `UTF-8 BOM` `export.csv`, `summary`), and `/api/public/reports/:slugOrCode`.
  - Security headers, `BASE_PATH=/climateae` prefix stripping & `window.__CLIMATEAE_BASE__` injection, `413` body size guard, and per-IP `429` rate limiting (with health/readiness probes exempt).
  - Integration test suite (`tests/unit/climateServer.test.ts`).

## [0.1.0] - 2026-11-25
### Added
- Zero-dependency UAE Climate Law readiness engine (`src/core/*`) covering **Federal Decree-Law No. 11 of 2024** (`2025-05-30`), **Abu Dhabi EAD Resolution No. 03 of 2026** (`>= 25,000 tCO2e` Scope 1 MRV & `ISO 14065` audit by `2027-03-31`), and **Cabinet Resolution No. 67 of 2024 (`NRCC`)** (`>= 500,000 tCO2e` Scope 1+2 Huge Carbon Emitter tier):
  - **Scope & Threshold Classifier (`scopeAndThresholdEngine.ts`)**: covers UAE mainland and free zones, designated Abu Dhabi sectors (`25k tCO2e`), NRCC `0.5 MtCO2e` registration, and `ISO 14065` third-party verification rules.
  - **Deadline & Penalty Estimator (`penaltyAndDeadlineEngine.ts`)**: tracks `YYYY-03-31` EAD verification cutoff (`126` days left from `2026-11-25` for FY2026) and models statutory `AED 50,000–2,000,000` administrative fine exposure with `2x` repeat multiplier (`up to AED 4,000,000`).
  - **Facility Inventory CSV Auditor (`facilityCsvAuditor.ts`)**: validates multi-site UAE GHG CSV ledgers with `CWE-1236` formula neutralization, `UTF-8 BOM` export, canonical `SHA-256` digest, and explicit non-MOCCAE / non-EAD / non-NRCC disclaimers.
