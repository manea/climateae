import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_DATA_DIR = path.resolve(import.meta.dirname, '..', 'data');

export function normalizeSqlitePath(options = {}) {
  const envDataDir = process.env.CLIMATEAE_DATA_DIR;
  if (options.dbPath === ':memory:') {
    return ':memory:';
  }
  if (options.dbPath) {
    fs.mkdirSync(path.dirname(options.dbPath), { recursive: true });
    return options.dbPath;
  }
  const dataDir = path.resolve(options.dataDir || envDataDir || DEFAULT_DATA_DIR);
  fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, 'climateae.sqlite');
}

export function withImmediateTransaction(db, work) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = work();
    db.exec('COMMIT');
    return out;
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // Ignore rollback errors if connection closed
    }
    throw err;
  }
}

export function allocateDossierCodeTx(db, year = new Date().getUTCFullYear()) {
  const normalizedYear =
    Number.isInteger(year) && year >= 2024 ? year : new Date().getUTCFullYear();
  const row = db
    .prepare(
      `INSERT INTO dossier_counters (year, last_seq)
       VALUES (?, 1)
       ON CONFLICT(year) DO UPDATE SET last_seq = last_seq + 1
       RETURNING last_seq`,
    )
    .get(normalizedYear);
  const seq = Number(row?.last_seq ?? 1);
  return `CLM-${normalizedYear}-${String(seq).padStart(4, '0')}`;
}

export function generatePublicSlug() {
  return `climate-${crypto.randomBytes(6).toString('hex')}`;
}

export function createDb(options = {}) {
  const filename = normalizeSqlitePath(options);
  const db = new DatabaseSync(filename);

  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA busy_timeout = 5000;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_name TEXT NOT NULL,
      emirate TEXT NOT NULL DEFAULT 'dubai',
      sector TEXT NOT NULL DEFAULT 'transport_logistics',
      is_free_zone INTEGER NOT NULL DEFAULT 1,
      assessment_date TEXT NOT NULL DEFAULT '2026-11-25',
      reporting_year INTEGER NOT NULL DEFAULT 2026,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dossier_counters (
      year INTEGER PRIMARY KEY,
      last_seq INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
      dossier_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      organization_name TEXT NOT NULL,
      emirate TEXT NOT NULL,
      sector TEXT NOT NULL,
      reporting_year INTEGER NOT NULL DEFAULT 2026,
      assessment_date TEXT NOT NULL,
      status TEXT NOT NULL,
      readiness_score INTEGER NOT NULL,
      scope1_tco2e REAL NOT NULL DEFAULT 0,
      scope2_tco2e REAL NOT NULL DEFAULT 0,
      total_scope1_2_tco2e REAL NOT NULL DEFAULT 0,
      ead_mandatory_mrv INTEGER NOT NULL DEFAULT 0,
      nrcc_tier TEXT NOT NULL DEFAULT 'participating_voluntary',
      estimated_max_fine_aed REAL NOT NULL DEFAULT 0,
      days_remaining_to_deadline INTEGER NOT NULL DEFAULT 0,
      input_json TEXT NOT NULL,
      result_json TEXT NOT NULL,
      canonical_text TEXT NOT NULL DEFAULT '',
      dossier_sha256 TEXT NOT NULL DEFAULT '',
      public_slug TEXT UNIQUE,
      locked_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
    CREATE INDEX IF NOT EXISTS idx_assessments_updated ON assessments(updated_at DESC);

    CREATE TABLE IF NOT EXISTS public_report_views (
      slug_or_code TEXT PRIMARY KEY,
      view_count INTEGER NOT NULL DEFAULT 0,
      last_viewed_at TEXT
    );
  `);

  return db;
}

export function getDbStats(db) {
  const journalRow = db.prepare('PRAGMA journal_mode;').get();
  const profileCount = Number(db.prepare('SELECT COUNT(*) AS cnt FROM profiles').get()?.cnt ?? 0);
  const assessmentCount = Number(
    db.prepare('SELECT COUNT(*) AS cnt FROM assessments').get()?.cnt ?? 0,
  );
  const lockedCount = Number(
    db.prepare('SELECT COUNT(*) AS cnt FROM assessments WHERE locked_at IS NOT NULL').get()?.cnt ?? 0,
  );
  return {
    journalMode: String(journalRow?.journal_mode ?? 'unknown').toLowerCase(),
    profileCount,
    assessmentCount,
    lockedCount,
  };
}

export function closeDb(db) {
  if (db && typeof db.close === 'function') {
    try {
      db.close();
    } catch {
      // Ignore if already closed
    }
  }
}
