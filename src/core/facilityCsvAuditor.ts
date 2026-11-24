import {
  EAD_SCOPE1_THRESHOLD_TCO2E,
  NRCC_HUGE_EMITTER_THRESHOLD_TCO2E,
} from './climateCatalog.ts';
import type {
  FacilityCsvAuditSummary,
  FacilityCsvRowAudit,
  ReadinessStatus,
} from './types.ts';

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function detectDelimiter(headerLine: string): string {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semiCount = (headerLine.match(/;/g) || []).length;
  const tabCount = (headerLine.match(/\t/g) || []).length;
  if (tabCount > commaCount && tabCount >= semiCount) return '\t';
  if (semiCount > commaCount) return ';';
  return ',';
}

function parseBool(raw: string | undefined): boolean {
  const val = (raw ?? '').trim().toLowerCase();
  return val === 'true' || val === '1' || val === 'yes' || val === 'y';
}

function parseNumber(raw: string | undefined, fallback: number): number {
  const n = Number((raw ?? '').trim());
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : fallback;
}

/**
 * Neutralizes CWE-1236 formula injection prefixes and applies RFC 4180 quoting.
 */
export function sanitizeCsvCell(value: string | number | boolean): string {
  const raw = String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function auditFacilitiesCsv(
  csvText: string,
  assessmentDate = '2026-11-25',
  reportingYear = 2026,
): FacilityCsvAuditSummary {
  const cleaned = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleaned) {
    return {
      totalRows: 0,
      readyCount: 0,
      conditionalCount: 0,
      blockedCount: 0,
      eadMandatoryCount: 0,
      nrccHugeEmitterCount: 0,
      totalScope1Tco2e: 0,
      totalScope2Tco2e: 0,
      rows: [],
      parseErrors: ['UAE GHG facilities CSV payload is empty.'],
    };
  }

  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      totalRows: 0,
      readyCount: 0,
      conditionalCount: 0,
      blockedCount: 0,
      eadMandatoryCount: 0,
      nrccHugeEmitterCount: 0,
      totalScope1Tco2e: 0,
      totalScope2Tco2e: 0,
      rows: [],
      parseErrors: ['CSV must include a header row and at least one UAE facility row.'],
    };
  }

  const delimiter = detectDelimiter(lines[0]!);
  const headers = splitCsvLine(lines[0]!, delimiter).map((h) => h.toLowerCase());

  const idxFacilityId = headers.findIndex((h) => h.includes('facility_id') || h === 'id');
  const idxName = headers.findIndex((h) => h.includes('facility_name') || h === 'name');
  const idxEmirate = headers.findIndex((h) => h.includes('emirate'));
  const idxSector = headers.findIndex((h) => h.includes('sector'));
  const idxScope1 = headers.findIndex((h) => h.includes('scope1'));
  const idxScope2 = headers.findIndex((h) => h.includes('scope2'));
  const idxVerified = headers.findIndex((h) => h.includes('iso14065') || h.includes('verified'));
  const idxArchive = headers.findIndex((h) => h.includes('archive'));

  const deadlineDate = `${reportingYear + 1}-03-31`;
  const pastDeadline = assessmentDate > deadlineDate;

  const rows: FacilityCsvRowAudit[] = [];
  let readyCount = 0;
  let conditionalCount = 0;
  let blockedCount = 0;
  let eadMandatoryCount = 0;
  let nrccHugeEmitterCount = 0;
  let totalScope1Tco2e = 0;
  let totalScope2Tco2e = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]!, delimiter);
    const facilityId = idxFacilityId >= 0 ? cols[idxFacilityId] || `FAC-${i}` : `FAC-${i}`;
    const facilityName = idxName >= 0 ? cols[idxName] || 'Unnamed UAE Site' : 'Unnamed UAE Site';
    const emirate = (idxEmirate >= 0 ? cols[idxEmirate] || 'abu_dhabi' : 'abu_dhabi').toLowerCase();
    const sector = (idxSector >= 0 ? cols[idxSector] || 'industrial_manufacturing' : 'industrial_manufacturing').toLowerCase();
    const scope1Tco2e = parseNumber(idxScope1 >= 0 ? cols[idxScope1] : undefined, 0);
    const scope2Tco2e = parseNumber(idxScope2 >= 0 ? cols[idxScope2] : undefined, 0);
    const combinedTco2e = Math.round((scope1Tco2e + scope2Tco2e) * 100) / 100;
    const iso14065Verified = parseBool(idxVerified >= 0 ? cols[idxVerified] : 'false');
    const archive5YrReady = parseBool(idxArchive >= 0 ? cols[idxArchive] : 'true');

    const eadMandatory =
      (emirate.includes('abu_dhabi') || emirate.includes('abu dhabi')) &&
      scope1Tco2e >= EAD_SCOPE1_THRESHOLD_TCO2E;
    const nrccHugeEmitter = combinedTco2e >= NRCC_HUGE_EMITTER_THRESHOLD_TCO2E;

    if (eadMandatory) eadMandatoryCount += 1;
    if (nrccHugeEmitter) nrccHugeEmitterCount += 1;
    totalScope1Tco2e = Math.round((totalScope1Tco2e + scope1Tco2e) * 100) / 100;
    totalScope2Tco2e = Math.round((totalScope2Tco2e + scope2Tco2e) * 100) / 100;

    const issues: string[] = [];
    let status: ReadinessStatus = 'ready';

    if (!archive5YrReady) {
      issues.push('Missing 5-year GHG records archive (Law 11/2024)');
      status = 'blocked';
    }
    if (nrccHugeEmitter && !iso14065Verified) {
      issues.push('>=500,000 tCO2e NRCC Huge Emitter requires accredited verification');
      status = 'blocked';
    } else if (eadMandatory && !iso14065Verified) {
      if (pastDeadline) {
        issues.push(`Abu Dhabi EAD >=25,000 tCO2e ISO 14065 verification past ${deadlineDate}`);
        status = 'blocked';
      } else {
        issues.push(`Pending ISO 14065 verification before ${deadlineDate}`);
        if (status !== 'blocked') status = 'conditional';
      }
    }

    if (status === 'ready') readyCount += 1;
    else if (status === 'conditional') conditionalCount += 1;
    else blockedCount += 1;

    rows.push({
      rowNumber: i,
      facilityId,
      facilityName,
      emirate,
      sector,
      scope1Tco2e,
      scope2Tco2e,
      combinedTco2e,
      eadMandatory,
      nrccHugeEmitter,
      iso14065Verified,
      archive5YrReady,
      status,
      issues,
    });
  }

  return {
    totalRows: rows.length,
    readyCount,
    conditionalCount,
    blockedCount,
    eadMandatoryCount,
    nrccHugeEmitterCount,
    totalScope1Tco2e,
    totalScope2Tco2e,
    rows,
    parseErrors: [],
  };
}

export function exportFacilitiesAuditCsv(summary: FacilityCsvAuditSummary): string {
  const header = [
    'row_number',
    'facility_id',
    'facility_name',
    'emirate',
    'sector',
    'scope1_tco2e',
    'scope2_tco2e',
    'combined_tco2e',
    'ead_mandatory_25k',
    'nrcc_huge_500k',
    'iso14065_verified',
    'archive_5yr_ready',
    'status',
    'issues',
  ].join(',');

  const lines = summary.rows.map((row) =>
    [
      sanitizeCsvCell(row.rowNumber),
      sanitizeCsvCell(row.facilityId),
      sanitizeCsvCell(row.facilityName),
      sanitizeCsvCell(row.emirate),
      sanitizeCsvCell(row.sector),
      sanitizeCsvCell(row.scope1Tco2e),
      sanitizeCsvCell(row.scope2Tco2e),
      sanitizeCsvCell(row.combinedTco2e),
      sanitizeCsvCell(row.eadMandatory),
      sanitizeCsvCell(row.nrccHugeEmitter),
      sanitizeCsvCell(row.iso14065Verified),
      sanitizeCsvCell(row.archive5YrReady),
      sanitizeCsvCell(row.status),
      sanitizeCsvCell(row.issues.join(' | ')),
    ].join(','),
  );

  return `\uFEFF${header}\n${lines.join('\n')}${lines.length > 0 ? '\n' : ''}`;
}
