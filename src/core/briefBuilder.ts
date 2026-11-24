import type {
  AssessmentInput,
  AssessmentResult,
  ClimateSector,
  EmirateJurisdiction,
  VerifierAccreditation,
} from './types.ts';

function escMdCell(value: unknown): string {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function formatNum(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString('en-US') : '0';
}

const EMIRATE_LABELS: Record<EmirateJurisdiction, { en: string; ar: string }> = {
  abu_dhabi: { en: 'Abu Dhabi', ar: 'أبوظبي' },
  dubai: { en: 'Dubai', ar: 'دبي' },
  sharjah: { en: 'Sharjah', ar: 'الشارقة' },
  northern_emirates: { en: 'Northern Emirates', ar: 'الإمارات الشمالية' },
  free_zone: { en: 'UAE Free Zone', ar: 'منطقة حرة إماراتية' },
};

const SECTOR_LABELS: Record<ClimateSector, { en: string; ar: string }> = {
  industrial_manufacturing: { en: 'Industrial & Manufacturing', ar: 'الصناعة والتصنيع' },
  power_water_utilities: { en: 'Power & Water Utilities', ar: 'الكهرباء والمياه والمرافق' },
  oil_and_gas: { en: 'Oil, Gas & Petrochemicals', ar: 'النفط والغاز والبتروكيماويات' },
  transport_logistics: { en: 'Transport & Logistics', ar: 'النقل والخدمات اللوجستية' },
  waste_management: { en: 'Waste Management & Recycling', ar: 'إدارة النفايات والتدوير' },
  buildings_commercial: { en: 'Commercial Buildings & Real Estate', ar: 'المباني التجارية والعقارات' },
  other_services: { en: 'Other Services & Trading', ar: 'الخدمات والتجارة الأخرى' },
};

const VERIFIER_LABELS: Record<VerifierAccreditation, { en: string; ar: string }> = {
  iso_14065_accredited: { en: 'ISO 14065 / 14064-3 Accredited Verifier', ar: 'مدقق خارجي معتمد ISO 14065 / 14064-3' },
  moccae_recognized: { en: 'MOCCAE-Recognized Verifier', ar: 'جهة تحقق معترف بها لدى MOCCAE' },
  internal_only: { en: 'Internal Team Only (Unaccredited)', ar: 'فريق داخلي فقط (غير معتمد خارجياً)' },
  none: { en: 'No Verifier Engaged', ar: 'لا يوجد مدقق معيّن' },
};

export function buildClimateBriefMarkdown(
  input: AssessmentInput,
  result: AssessmentResult,
  dossierCode: string,
  sha256Digest: string,
  locale: 'en' | 'ar' = 'ar',
): string {
  const digest = sha256Digest || result.dossierSha256;
  const emirateLabel = EMIRATE_LABELS[input.emirate] ?? { en: input.emirate, ar: input.emirate };
  const sectorLabel = SECTOR_LABELS[input.sector] ?? { en: input.sector, ar: input.sector };
  const verifierLabel = VERIFIER_LABELS[input.verifierAccreditation] ?? {
    en: input.verifierAccreditation,
    ar: input.verifierAccreditation,
  };

  if (locale === 'ar') {
    const lines: string[] = [
      `# ملف جاهزية قانون التغير المناخي الإماراتي — \`${dossierCode}\``,
      '',
      `> **تنبيه الحوكمة وعدم الاعتماد الرسمي:** ${result.legalDisclaimerAr}`,
      '',
      '## 1. ملخص المنشأة وحالة الجاهزية',
      '',
      '| البند | القيمة |',
      '|---|---|',
      `| رمز الملف | \`${escMdCell(dossierCode)}\` |`,
      `| الأداة والإصدار | \`ClimateAE v${escMdCell(result.version)}\` |`,
      `| اسم المنشأة | ${escMdCell(input.organizationName)} |`,
      `| الإمارة / الاختصاص | ${escMdCell(emirateLabel.ar)}${input.isFreeZone ? ' (منطقة حرة — مشمولة بقانون 11/2024)' : ''} |`,
      `| القطاع | ${escMdCell(sectorLabel.ar)} |`,
      `| سنة الإبلاغ وتاريخ التقييم | \`${input.reportingYear}\` / \`${escMdCell(input.assessmentDate)}\` |`,
      `| حالة الجاهزية | **${result.status.toUpperCase()}** |`,
      `| درجة الجاهزية | **${result.readinessScore}/100** |`,
      `| بصمة SHA-256 القانونية | \`${escMdCell(digest)}\` |`,
      '',
      '## 2. تصنيف النطاقات والعتبات التشريعية (11/2024 وEAD 03/2026 وNRCC 67/2024)',
      '',
      `- انبعاثات النطاق 1 (مباشرة): **${formatNum(input.scope1Tco2e)} طن مكافئ CO2**`,
      `- انبعاثات النطاق 2 (كهرباء وطاقة): **${formatNum(input.scope2Tco2e)} طن مكافئ CO2**`,
      `- إجمالي النطاقين 1 + 2: **${formatNum(result.scopeThreshold.totalScope1And2Tco2e)} طن مكافئ CO2**`,
      `- انبعاثات النطاق 3 (سلسلة القيمة): **${formatNum(input.scope3Tco2e)} طن مكافئ CO2** (الإجمالي الكلي: **${formatNum(result.scopeThreshold.totalAllScopesTco2e)} طن**)`,
      `- خضوع عتبة أبوظبي الإلزامية (قرار هيئة البيئة 03/2026 >= 25,000 طن نطاق 1): **${result.scopeThreshold.eadMandatoryMrvApplies ? 'نعم — ملزم بإجراءات MRV وتدقيق ISO 14065' : result.scopeThreshold.eadDesignatedSector ? 'غير متجاوز لعتبة 25,000 أو خارج أبوظبي' : 'لا'}**`,
      `- تصنيف السجل الوطني لأرصدة الكربون NRCC (قرار 67/2024 >= 500,000 طن): **${result.scopeThreshold.nrccTier === 'huge_emitter_mandatory' ? 'باعث كبير ملزم بالتسجيل (>= 0.5 مليون طن)' : 'جهة مشاركة طوعية (< 500,000 طن)'}**`,
      `- متطلب التحقق من طرف ثالث: **${result.scopeThreshold.thirdPartyVerificationRequired ? 'إلزامي' : 'اختياري/معزز'}** (${escMdCell(verifierLabel.ar)} — ${result.scopeThreshold.verifierCompliant ? 'ممتثل ✓' : 'غير مكتمل ✗'})`,
      '',
      '## 3. المهل الزمنية وتعرض الغرامات الإدارية (المرسوم بقانون 11/2024)',
      '',
      `- الموعد النهائي للتحقق والإفصاح السنوي: \`${result.penaltyAndDeadline.verificationDeadlineDate}\` (${result.penaltyAndDeadline.deadlineOverdue ? `متجاوز بـ ${Math.abs(result.penaltyAndDeadline.daysRemainingToDeadline)} يوماً` : `متبقٍ ${result.penaltyAndDeadline.daysRemainingToDeadline} يوماً`})`,
      `- عدد فجوات الامتثال النشطة: **${result.penaltyAndDeadline.activeViolationGapCount}**`,
      `- معامل تكرار المخالفة خلال سنتين: **${result.penaltyAndDeadline.repeatMultiplierApplied}x**`,
      `- نطاق الغرامة الإدارية التقديرية: **${formatNum(result.penaltyAndDeadline.estimatedMinFineAed)} – ${formatNum(result.penaltyAndDeadline.estimatedMaxFineAed)} د.إ**`,
      `- مدة حفظ سجلات الانبعاثات الإلزامية: **${result.penaltyAndDeadline.archiveRetentionYearsRequired} سنوات** (${input.hasFiveYearGhgArchive ? 'مؤرشفة ✓' : 'ناقصة ✗'})`,
      '',
      '## 4. الضوابط الرقابية الستة (ClimateAE Controls)',
      '',
      '| الضابط | الحالة | الوزن | الوصف |',
      '|---|---|---|---|',
      ...result.controls.map(
        (ctrl) =>
          `| \`${ctrl.id}\` | ${ctrl.implemented ? 'مُنفذ ✓' : 'ناقص ✗'} | ${ctrl.weight} | ${escMdCell(ctrl.titleAr)} |`,
      ),
    ];

    if (result.csvAudit) {
      lines.push(
        '',
        '## 5. تدقيق جرد المنشآت والمواقع المتعددة (CSV)',
        '',
        `- إجمالي المواقع: ${result.csvAudit.totalRows} | جاهز: ${result.csvAudit.readyCount} | مشروط: ${result.csvAudit.conditionalCount} | محجوب: ${result.csvAudit.blockedCount} | مواقع عتبة أبوظبي (25k): ${result.csvAudit.eadMandatoryCount} | مواقع NRCC (500k): ${result.csvAudit.nrccHugeEmitterCount} | إجمالي النطاقين 1+2: ${formatNum(result.csvAudit.totalScope1Tco2e + result.csvAudit.totalScope2Tco2e)} طن`,
        '',
      );
      if (result.csvAudit.rows.length > 0) {
        lines.push(
          '| الصف | رمز الموقع | اسم المنشأة | الإمارة | النطاق 1 | النطاق 2 | أبوظبي 25k | NRCC 500k | الحالة |',
          '|---|---|---|---|---|---|---|---|---|',
          ...result.csvAudit.rows.map(
            (row) =>
              `| ${row.rowNumber} | \`${escMdCell(row.facilityId)}\` | ${escMdCell(row.facilityName)} | ${escMdCell(row.emirate)} | ${formatNum(row.scope1Tco2e)} | ${formatNum(row.scope2Tco2e)} | ${row.eadMandatory ? 'نعم' : 'لا'} | ${row.nrccHugeEmitter ? 'نعم' : 'لا'} | **${row.status.toUpperCase()}** |`,
          ),
        );
      }
    }

    lines.push(
      '',
      `## ${result.csvAudit ? '6' : '5'}. الملاحظات والنتائج التفصيلية`,
      '',
      ...(result.findings.length > 0
        ? result.findings.map(
            (f) =>
              `- **[${f.severity.toUpperCase()}] ${f.code} — ${escMdCell(f.titleAr)}:** ${escMdCell(f.detailAr)} *(${escMdCell(f.legalRef)})*`,
          )
        : ['- لا توجد مخالفات مانعة؛ المنشأة مستوفية لمتطلبات الجاهزية المناخية المحددة.']),
    );

    if (input.notes) {
      lines.push('', '### ملاحظات المستخدم', '', escMdCell(input.notes));
    }

    return `${lines.join('\n')}\n`;
  }

  const lines: string[] = [
    `# UAE Climate Law Readiness Brief — \`${dossierCode}\``,
    '',
    `> **Independence Disclaimer:** ${result.legalDisclaimerEn}`,
    '',
    '## 1. Organization Profile & Readiness Summary',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Dossier Code | \`${escMdCell(dossierCode)}\` |`,
    `| Tool / Version | \`ClimateAE v${escMdCell(result.version)}\` |`,
    `| Organization | ${escMdCell(input.organizationName)} |`,
    `| Emirate / Jurisdiction | ${escMdCell(emirateLabel.en)}${input.isFreeZone ? ' (Free Zone — In Scope of Law 11/2024)' : ''} |`,
    `| Sector | ${escMdCell(sectorLabel.en)} |`,
    `| Reporting Year / Assessment Date | \`${input.reportingYear}\` / \`${escMdCell(input.assessmentDate)}\` |`,
    `| Readiness Status | **${result.status.toUpperCase()}** |`,
    `| Readiness Score | **${result.readinessScore}/100** |`,
    `| Canonical SHA-256 Digest | \`${escMdCell(digest)}\` |`,
    '',
    '## 2. Statutory Scopes & Regulatory Thresholds (Law 11/2024, EAD 03/2026 & NRCC 67/2024)',
    '',
    `- Direct Scope 1 Emissions: **${formatNum(input.scope1Tco2e)} tCO2e**`,
    `- Indirect Scope 2 Emissions: **${formatNum(input.scope2Tco2e)} tCO2e**`,
    `- Combined Scope 1 + Scope 2: **${formatNum(result.scopeThreshold.totalScope1And2Tco2e)} tCO2e**`,
    `- Value-Chain Scope 3 Emissions: **${formatNum(input.scope3Tco2e)} tCO2e** (All Scopes Total: **${formatNum(result.scopeThreshold.totalAllScopesTco2e)} tCO2e**)`,
    `- Abu Dhabi EAD Mandatory MRV (>= 25,000 tCO2e Scope 1 in Designated Sector): **${result.scopeThreshold.eadMandatoryMrvApplies ? 'Yes — ISO 14065 Audit Required' : result.scopeThreshold.eadDesignatedSector ? 'No (Below Threshold or Outside Abu Dhabi)' : 'No'}**`,
    `- NRCC Tier (Cabinet Resolution 67/2024 >= 500,000 tCO2e Scope 1+2): **${result.scopeThreshold.nrccTier === 'huge_emitter_mandatory' ? 'Huge Carbon Emitter (Mandatory NRCC)' : 'Participating Entity (Voluntary Tier)'}**`,
    `- Third-Party Verification Requirement: **${result.scopeThreshold.thirdPartyVerificationRequired ? 'Mandatory' : 'Voluntary'}** (${escMdCell(verifierLabel.en)} — ${result.scopeThreshold.verifierCompliant ? 'Compliant' : 'Gap'})`,
    '',
    '## 3. Statutory Deadlines & Administrative Penalty Exposure (Law 11/2024)',
    '',
    `- Annual Verification Cutoff Date: \`${result.penaltyAndDeadline.verificationDeadlineDate}\` (${result.penaltyAndDeadline.deadlineOverdue ? `Overdue by ${Math.abs(result.penaltyAndDeadline.daysRemainingToDeadline)} day(s)` : `${result.penaltyAndDeadline.daysRemainingToDeadline} day(s) remaining`})`,
    `- Active Compliance Gap Count: **${result.penaltyAndDeadline.activeViolationGapCount}**`,
    `- Repeat-Offense Multiplier (Within 2 Years): **${result.penaltyAndDeadline.repeatMultiplierApplied}x**`,
    `- Statutory Fine Exposure Band: **AED ${formatNum(result.penaltyAndDeadline.estimatedMinFineAed)} – AED ${formatNum(result.penaltyAndDeadline.estimatedMaxFineAed)}**`,
    `- Mandatory GHG Record Retention: **${result.penaltyAndDeadline.archiveRetentionYearsRequired} years** (${input.hasFiveYearGhgArchive ? 'Compliant Archive' : 'Archive Missing'})`,
    '',
    '## 4. Controls Assessment Matrix',
    '',
    '| Control | Status | Weight | Description |',
    '|---|---|---|---|',
    ...result.controls.map(
      (ctrl) =>
        `| \`${ctrl.id}\` | ${ctrl.implemented ? 'Implemented' : 'Gap'} | ${ctrl.weight} | ${escMdCell(ctrl.titleEn)} |`,
    ),
  ];

  if (result.csvAudit) {
    lines.push(
      '',
      '## 5. Multi-Site Facility GHG CSV Inventory Audit',
      '',
      `- Total Rows: ${result.csvAudit.totalRows} | Ready: ${result.csvAudit.readyCount} | Conditional: ${result.csvAudit.conditionalCount} | Blocked: ${result.csvAudit.blockedCount} | EAD >=25k Sites: ${result.csvAudit.eadMandatoryCount} | NRCC >=500k Sites: ${result.csvAudit.nrccHugeEmitterCount} | Total Scope 1+2: ${formatNum(result.csvAudit.totalScope1Tco2e + result.csvAudit.totalScope2Tco2e)} tCO2e`,
      '',
    );
    if (result.csvAudit.rows.length > 0) {
      lines.push(
        '| Row | Facility ID | Facility Name | Emirate | Scope 1 | Scope 2 | EAD 25k | NRCC 500k | Status |',
        '|---|---|---|---|---|---|---|---|---|',
        ...result.csvAudit.rows.map(
          (row) =>
            `| ${row.rowNumber} | \`${escMdCell(row.facilityId)}\` | ${escMdCell(row.facilityName)} | ${escMdCell(row.emirate)} | ${formatNum(row.scope1Tco2e)} | ${formatNum(row.scope2Tco2e)} | ${row.eadMandatory ? 'Yes' : 'No'} | ${row.nrccHugeEmitter ? 'Yes' : 'No'} | **${row.status.toUpperCase()}** |`,
        ),
      );
    }
  }

  lines.push(
    '',
    `## ${result.csvAudit ? '6' : '5'}. Detailed Regulatory Findings`,
    '',
    ...(result.findings.length > 0
      ? result.findings.map(
          (f) =>
            `- **[${f.severity.toUpperCase()}] ${f.code} — ${escMdCell(f.titleEn)}:** ${escMdCell(f.detailEn)} *(${escMdCell(f.legalRef)})*`,
        )
      : ['- No blocking findings; UAE Decree-Law 11/2024, EAD 03/2026 & NRCC 67/2024 obligations are satisfied.']),
  );

  if (input.notes) {
    lines.push('', '### Assessment Notes', '', escMdCell(input.notes));
  }

  return `${lines.join('\n')}\n`;
}
