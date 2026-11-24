import type {
  ClimateSector,
  EmirateJurisdiction,
  NrccTier,
  ReadinessStatus,
  VerifierAccreditation,
} from '../core/types.ts';

export type Locale = 'ar' | 'en';
export type ThemeMode = 'mangrove-vellum' | 'desert-obsidian';

export function formatNumber(val: number): string {
  return Number.isFinite(val) ? Math.round(val * 100) / 100 === val ? val.toLocaleString('en-US') : val.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0';
}

export function formatAed(val: number, locale: Locale): string {
  const num = Number.isFinite(val) ? Math.round(val).toLocaleString('en-US') : '0';
  return locale === 'ar' ? `${num} د.إ` : `AED ${num}`;
}

export function formatTco2e(val: number, locale: Locale): string {
  const num = formatNumber(val);
  return locale === 'ar' ? `${num} طن مكافئ CO2` : `${num} tCO2e`;
}

export const EMIRATE_OPTIONS: ReadonlyArray<{
  value: EmirateJurisdiction;
  labelAr: string;
  labelEn: string;
}> = [
  { value: 'abu_dhabi', labelAr: 'أبوظبي (EAD MRV)', labelEn: 'Abu Dhabi (EAD MRV)' },
  { value: 'dubai', labelAr: 'دبي', labelEn: 'Dubai' },
  { value: 'sharjah', labelAr: 'الشارقة', labelEn: 'Sharjah' },
  { value: 'northern_emirates', labelAr: 'الإمارات الشمالية', labelEn: 'Northern Emirates' },
  { value: 'free_zone', labelAr: 'منطقة حرة إماراتية', labelEn: 'UAE Free Zone' },
];

export const SECTOR_OPTIONS: ReadonlyArray<{
  value: ClimateSector;
  labelAr: string;
  labelEn: string;
}> = [
  { value: 'industrial_manufacturing', labelAr: 'الصناعة والتصنيع (مشترك بعتبة أبوظبي)', labelEn: 'Industrial & Manufacturing (EAD Designated)' },
  { value: 'power_water_utilities', labelAr: 'الكهرباء والمياه والمرافق (مشترك بعتبة أبوظبي)', labelEn: 'Power & Water Utilities (EAD Designated)' },
  { value: 'oil_and_gas', labelAr: 'النفط والغاز والبتروكيماويات (مشترك بعتبة أبوظبي)', labelEn: 'Oil, Gas & Petrochemicals (EAD Designated)' },
  { value: 'transport_logistics', labelAr: 'النقل والخدمات اللوجستية (مشترك بعتبة أبوظبي)', labelEn: 'Transport & Logistics (EAD Designated)' },
  { value: 'waste_management', labelAr: 'إدارة النفايات والتدوير (مشترك بعتبة أبوظبي)', labelEn: 'Waste Management & Recycling (EAD Designated)' },
  { value: 'buildings_commercial', labelAr: 'المباني التجارية والعقارات', labelEn: 'Commercial Buildings & Real Estate' },
  { value: 'other_services', labelAr: 'الخدمات والتجارة الأخرى', labelEn: 'Other Services & Trading' },
];

export const VERIFIER_OPTIONS: ReadonlyArray<{
  value: VerifierAccreditation;
  labelAr: string;
  labelEn: string;
}> = [
  { value: 'iso_14065_accredited', labelAr: 'مدقق خارجي معتمد ISO 14065 / 14064-3', labelEn: 'ISO 14065 / 14064-3 Accredited Verifier' },
  { value: 'moccae_recognized', labelAr: 'جهة تحقق معترف بها لدى MOCCAE', labelEn: 'MOCCAE-Recognized Verifier' },
  { value: 'internal_only', labelAr: 'فريق داخلي فقط (غير معتمد خارجياً)', labelEn: 'Internal Team Only (Unaccredited)' },
  { value: 'none', labelAr: 'لا يوجد مدقق معيّن حالياً', labelEn: 'No External Verifier Engaged' },
];

export function statusLabel(status: ReadinessStatus, locale: Locale): string {
  if (locale === 'ar') {
    if (status === 'ready') return 'جاهز';
    if (status === 'conditional') return 'مشروط';
    return 'محجوب';
  }
  return status.toUpperCase();
}

export function nrccTierLabel(tier: NrccTier, locale: Locale): string {
  if (locale === 'ar') {
    return tier === 'huge_emitter_mandatory'
      ? 'باعث كبير ملزم بالتسجيل في NRCC (>= 500k طن)'
      : 'جهة مشاركة طوعية (< 500k طن)';
  }
  return tier === 'huge_emitter_mandatory'
    ? 'Huge Emitter — Mandatory NRCC (>= 500k tCO2e)'
    : 'Participating Entity — Voluntary (< 500k tCO2e)';
}

export function emirateLabel(emirate: EmirateJurisdiction, locale: Locale): string {
  const item = EMIRATE_OPTIONS.find((opt) => opt.value === emirate);
  return item ? (locale === 'ar' ? item.labelAr : item.labelEn) : emirate;
}

export function sectorLabel(sector: ClimateSector, locale: Locale): string {
  const item = SECTOR_OPTIONS.find((opt) => opt.value === sector);
  return item ? (locale === 'ar' ? item.labelAr : item.labelEn) : sector;
}

const DICTIONARY = {
  ar: {
    appName: 'كلايمت الإمارات · ClimateAE',
    appSubtitle:
      'مدقق الجاهزية التقنية لمرسوم قانون التغير المناخي الإماراتي 11/2024، وقرار هيئة البيئة – أبوظبي 03/2026 (25,000 طن)، والسجل الوطني NRCC 67/2024 (500,000 طن)',
    serverMode: 'خادم SQLite WAL متصل',
    localMode: 'وضع متصفح $0 (localStorage)',
    toggleLang: 'EN',
    themeVellum: 'فاتح (Mangrove)',
    themeObsidian: 'داكن (Obsidian)',
    printBrief: 'طباعة تقرير A4',
    presetsHeading: 'سيناريوهات إماراتية جاهزة (بنقرة واحدة)',
    tabScope: 'النطاقات والعتبات والغرامات',
    tabControls: 'الضوابط الـ 6 والنتائج',
    tabCsv: 'تدقيق مواقع المنشآت CSV',
    tabVault: 'خزنة الملفات والتصدير',
    statScope12: 'إجمالي النطاقين 1 + 2',
    statEad25k: 'عتبة أبوظبي 25,000 طن',
    statNrccTier: 'تصنيف NRCC (500k طن)',
    statDeadline: 'الموعد النهائي للتحقق',
    statFineBand: 'تعرض الغرامات الإدارية',
    eadActive: 'إلزامية ISO 14065',
    eadInactive: 'غير منطبقة',
    daysLeftSuffix: 'يوماً متبقياً',
    daysOverduePrefix: 'متجاوز بـ',
    organizationName: 'اسم المنشأة / الكيان الإماراتي',
    emirate: 'الإمارة / الاختصاص',
    sector: 'القطاع الاقتصادي',
    isFreeZone: 'منشأة ضمن منطقة حرة (Free Zone)',
    reportingYear: 'سنة الإبلاغ',
    assessmentDate: 'تاريخ الفحص (ISO)',
    scope1: 'النطاق 1 المباشر (tCO2e)',
    scope2: 'النطاق 2 الكهرباء/الطاقة (tCO2e)',
    scope3: 'النطاق 3 سلسلة القيمة (tCO2e)',
    verifierAccreditation: 'مستوى جهة التحقق',
    registeredOnMoccaeMrv: 'مسجلة في منصة MOCCAE الوطنية (mrv.ae)',
    registeredOnNrcc: 'مسجلة في السجل الوطني لأرصدة الكربون (NRCC)',
    hasFiveYearGhgArchive: 'أرشفة سجلات وبيانات الانبعاثات لمدة 5 سنوات',
    hasReductionAdaptationPlan: 'خطة معتمدة لخفض الانبعاثات والتكيّف المناخي',
    repeatViolation: 'تكرار مخالفة خلال سنتين (مضاعفة الغرامة 2x)',
    priorViolationsCount: 'عدد المخالفات السابقة',
    notes: 'ملاحظات التقييم الداخلي',
    notesPlaceholder: 'أضف أي ملاحظات حول مرافق أبوظبي، المناطق الحرة، أو خطة التحقق...',
    controlsHeader: 'الضوابط الرقابية الستة للامتثال المناخي الإماراتي (100 نقطة)',
    selectAll: 'تحديد الكل',
    clearAll: 'إلغاء الكل',
    findingsHeader: 'النتائج والتنبيهات التشريعية التفصيلية',
    noFindings: 'لا توجد مخالفات أو ثغرات مانعة؛ جميع الالتزامات الحالية مستوفاة.',
    sevBlocker: 'مانع حرج',
    sevWarning: 'تحذير مهلة',
    sevInfo: 'معلومة نطاق',
    csvHeader: 'تدقيق جرد المنشآت المتعددة بصيغة CSV (مع تحييد حقن الصيغ CWE-1236)',
    csvHint: 'الأعمدة المدعومة: facility_id, facility_name, emirate, sector, scope1_tco2e, scope2_tco2e, iso14065_verified, archive_5yr_ready',
    csvUpload: 'استيراد ملف CSV',
    csvLoadSample: 'تحميل نموذج محاجير / مصافٍ (=HYPERLINK)',
    csvClear: 'مسح الكشف',
    csvDownloadBom: 'تنزيل CSV الآمن (UTF-8 BOM)',
    csvReady: 'جاهز',
    csvConditional: 'مشروط',
    csvBlocked: 'محجوب',
    csvEadSites: 'مواقع أبوظبي >=25k',
    csvNrccSites: 'مواقع NRCC >=500k',
    vaultSaveNew: 'حفظ كمسودة جديدة (CLM-YYYY-0001)',
    vaultUpdateDraft: 'تحديث المسودة المفتوحة',
    vaultDossierTitle: 'عنوان الملف',
    vaultSealLock: 'ختم نهائي وإصدار رابط عام',
    vaultDuplicate: 'نسخ لمسودة جديدة',
    vaultDelete: 'حذف المسودة',
    vaultDownloadMdAr: 'ملخص Markdown عربي',
    vaultDownloadMdEn: 'ملخص Markdown إنجليزي',
    vaultDownloadCsv: 'تصدير CSV (UTF-8 BOM)',
    vaultOpenPublic: 'فتح صفحة التقرير العام',
    vaultSavedList: 'خزنة تقارير ClimateAE المحفوظة',
    vaultEmpty: 'لا توجد ملفات محفوظة بعد. احفظ التقييم الحالي لإصدار رقم CLM-YYYY-0001.',
    vaultLockedBadge: 'مختوم غير قابل للتعديل',
    vaultDraftBadge: 'مسودة قابلة للتعديل',
    publicBackStudio: 'العودة إلى استوديو التدقيق',
    publicViewsLabel: 'عدد المشاهدات:',
    publicNotFound: 'التقرير العام المطلوب غير موجود أو غير مختوم نهائياً.',
    briefPreviewTitle: 'معاينة التقرير التنفيذي للطباعة (A4 PDF)',
  },
  en: {
    appName: 'ClimateAE',
    appSubtitle:
      'Independent Readiness Auditor for UAE Federal Climate Law 11/2024, Abu Dhabi EAD Resolution 03/2026 (25k tCO2e), and NRCC 67/2024 (500k tCO2e)',
    serverMode: 'SQLite WAL Backend Connected',
    localMode: '$0 Static Mode (localStorage)',
    toggleLang: 'عربي',
    themeVellum: 'Light (Mangrove)',
    themeObsidian: 'Dark (Obsidian)',
    printBrief: 'Print A4 Brief',
    presetsHeading: 'One-Click UAE Compliance Presets',
    tabScope: 'Scopes, Thresholds & Fines',
    tabControls: '6 Controls & Findings',
    tabCsv: 'Multi-Site Facility CSV Audit',
    tabVault: 'Dossier Vault & Exports',
    statScope12: 'Combined Scope 1 + 2',
    statEad25k: 'Abu Dhabi EAD 25k Threshold',
    statNrccTier: 'NRCC Tier (500k tCO2e)',
    statDeadline: 'FY Verification Deadline',
    statFineBand: 'Statutory Fine Band',
    eadActive: 'Mandatory ISO 14065',
    eadInactive: 'Not Triggered',
    daysLeftSuffix: 'day(s) remaining',
    daysOverduePrefix: 'Overdue by',
    organizationName: 'UAE Organization / Entity Name',
    emirate: 'Emirate / Jurisdiction',
    sector: 'Economic Sector',
    isFreeZone: 'Operating in a UAE Free Zone',
    reportingYear: 'Reporting Year',
    assessmentDate: 'Assessment Date (ISO)',
    scope1: 'Scope 1 Direct Emissions (tCO2e)',
    scope2: 'Scope 2 Electricity/Heat (tCO2e)',
    scope3: 'Scope 3 Value Chain (tCO2e)',
    verifierAccreditation: 'Verifier Accreditation Level',
    registeredOnMoccaeMrv: 'Registered on MOCCAE National MRV (mrv.ae)',
    registeredOnNrcc: 'Registered on National Register for Carbon Credits (NRCC)',
    hasFiveYearGhgArchive: '5-Year Immutable GHG Activity Data Archive',
    hasReductionAdaptationPlan: 'Board-Approved Emission Reduction & Adaptation Plan',
    repeatViolation: 'Repeat Violation Within 2 Years (2x Fine Multiplier)',
    priorViolationsCount: 'Prior Violations Count',
    notes: 'Internal Assessment Notes',
    notesPlaceholder: 'Document KIZAD/free-zone facility notes, ISO 14065 engagement, or mitigation plan...',
    controlsHeader: 'Six UAE Climate Readiness Controls (100 Points)',
    selectAll: 'Select All',
    clearAll: 'Clear All',
    findingsHeader: 'Detailed Regulatory Findings',
    noFindings: 'No blocking gaps identified; current UAE Climate Law obligations are satisfied.',
    sevBlocker: 'Blocker',
    sevWarning: 'Warning',
    sevInfo: 'Info',
    csvHeader: 'Multi-Site Facility CSV Auditor (CWE-1236 Safe Export)',
    csvHint: 'Columns: facility_id, facility_name, emirate, sector, scope1_tco2e, scope2_tco2e, iso14065_verified, archive_5yr_ready',
    csvUpload: 'Import .csv File',
    csvLoadSample: 'Load Sample CSV (=HYPERLINK Test)',
    csvClear: 'Clear CSV',
    csvDownloadBom: 'Download Safe CSV (UTF-8 BOM)',
    csvReady: 'Ready',
    csvConditional: 'Conditional',
    csvBlocked: 'Blocked',
    csvEadSites: 'EAD >=25k Sites',
    csvNrccSites: 'NRCC >=500k Sites',
    vaultSaveNew: 'Save New Draft (CLM-YYYY-0001)',
    vaultUpdateDraft: 'Update Open Draft',
    vaultDossierTitle: 'Dossier Title',
    vaultSealLock: 'Finalize & Seal Public Report',
    vaultDuplicate: 'Duplicate Draft',
    vaultDelete: 'Delete Draft',
    vaultDownloadMdAr: 'Brief Markdown (AR)',
    vaultDownloadMdEn: 'Brief Markdown (EN)',
    vaultDownloadCsv: 'Export CSV (UTF-8 BOM)',
    vaultOpenPublic: 'Open Public Report View',
    vaultSavedList: 'Saved ClimateAE Dossiers',
    vaultEmpty: 'No saved dossiers yet. Save the current assessment to issue CLM-YYYY-0001.',
    vaultLockedBadge: 'Sealed Immutable',
    vaultDraftBadge: 'Editable Draft',
    publicBackStudio: 'Back to ClimateAE Studio',
    publicViewsLabel: 'View Count:',
    publicNotFound: 'The requested public report was not found or has not been sealed yet.',
    briefPreviewTitle: 'Executive Brief Preview (A4 PDF Ready)',
  },
} as const;

export function getText(locale: Locale) {
  return DICTIONARY[locale];
}
