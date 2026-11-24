import {
  EAD_DESIGNATED_SECTORS,
  EAD_SCOPE1_THRESHOLD_TCO2E,
  NRCC_HUGE_EMITTER_THRESHOLD_TCO2E,
} from './climateCatalog.ts';
import type {
  AssessmentInput,
  FindingItem,
  ScopeThresholdResult,
} from './types.ts';

function roundEmissions(val: number): number {
  return Math.round(Math.max(0, Number(val) || 0) * 100) / 100;
}

export function diffDaysUtc(fromIso: string, toIso: string): number {
  const fromMs = Date.parse(`${fromIso}T00:00:00Z`);
  const toMs = Date.parse(`${toIso}T00:00:00Z`);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return 0;
  return Math.round((toMs - fromMs) / 86_400_000);
}

export function resolveVerificationDeadlineDate(reportingYear: number): string {
  const yearNum = Number.isInteger(reportingYear) && reportingYear >= 2024 ? reportingYear : 2026;
  return `${yearNum + 1}-03-31`;
}

export function evaluateScopeAndThresholds(input: AssessmentInput): {
  scopeThreshold: ScopeThresholdResult;
  findings: FindingItem[];
} {
  const scope1 = roundEmissions(input.scope1Tco2e);
  const scope2 = roundEmissions(input.scope2Tco2e);
  const scope3 = roundEmissions(input.scope3Tco2e);
  const totalScope1And2Tco2e = roundEmissions(scope1 + scope2);
  const totalAllScopesTco2e = roundEmissions(totalScope1And2Tco2e + scope3);

  const coveredByFederalClimateLaw = true;
  const eadDesignatedSector = EAD_DESIGNATED_SECTORS.has(input.sector);
  const eadMandatoryMrvApplies =
    input.emirate === 'abu_dhabi' &&
    eadDesignatedSector &&
    scope1 >= EAD_SCOPE1_THRESHOLD_TCO2E;

  const nrccTier =
    totalScope1And2Tco2e >= NRCC_HUGE_EMITTER_THRESHOLD_TCO2E
      ? 'huge_emitter_mandatory'
      : 'participating_voluntary';

  const thirdPartyVerificationRequired =
    eadMandatoryMrvApplies || nrccTier === 'huge_emitter_mandatory';

  const verifierCompliant = eadMandatoryMrvApplies
    ? input.verifierAccreditation === 'iso_14065_accredited'
    : nrccTier === 'huge_emitter_mandatory'
      ? input.verifierAccreditation === 'iso_14065_accredited' ||
        input.verifierAccreditation === 'moccae_recognized'
      : true;

  const deadlineDate = resolveVerificationDeadlineDate(input.reportingYear);
  const daysRemaining = diffDaysUtc(input.assessmentDate, deadlineDate);

  const findings: FindingItem[] = [];

  if (input.isFreeZone || input.emirate === 'free_zone') {
    findings.push({
      code: 'CLM-FREEZONE-IN-SCOPE',
      severity: 'info',
      titleEn: 'UAE Free Zone Entity Included Under Decree-Law 11/2024',
      titleAr: 'شمول كيانات المناطق الحرة بالمرسوم بقانون اتحادي 11/2024',
      detailEn:
        'Federal Decree-Law No. 11 of 2024 applies equally to UAE mainland and all financial/commercial free zones.',
      detailAr:
        'يسري المرسوم بقانون اتحادي 11/2024 على البر الرئيسي وجميع المناطق الحرة المالية والتجارية في الدولة.',
      legalRef: 'UAE Federal Decree-Law No. 11 of 2024 — Scope of Application',
    });
  }

  if (!input.registeredOnMoccaeMrv) {
    findings.push({
      code: 'CLM-MISSING-MRV-REG',
      severity: 'blocker',
      titleEn: 'Missing MOCCAE National MRV Registration (mrv.ae)',
      titleAr: 'عدم استكمال التسجيل في منصة القياس والإبلاغ والتحقق الوطنية (mrv.ae)',
      detailEn:
        'Covered entities must measure and report annual GHG emissions via the MOCCAE National MRV platform.',
      detailAr:
        'يلتزم المكلفون بتسجيل مصادر الانبعاث وتقديم جردهم السنوي عبر نظام MOCCAE الوطني.',
      legalRef: 'Federal Decree-Law No. 11 of 2024 (Effective 2025-05-30)',
    });
  }

  if (eadMandatoryMrvApplies && !verifierCompliant) {
    const overdue = daysRemaining < 0;
    findings.push({
      code: overdue ? 'CLM-EAD-ISO14065-OVERDUE' : 'CLM-EAD-ISO14065-PENDING',
      severity: overdue ? 'blocker' : 'warning',
      titleEn: overdue
        ? 'Abu Dhabi EAD >=25,000 tCO2e Verification Overdue'
        : `Abu Dhabi EAD >=25,000 tCO2e Scope 1 Needs ISO 14065 Audit Before ${deadlineDate}`,
      titleAr: overdue
        ? 'تجاوز مهلة التحقق المستقل ISO 14065 لمنشآت أبوظبي (>=25,000 طن)'
        : `منشأة في أبوظبي بعتبة >=25,000 طن (النطاق 1) تتطلب تدقيق ISO 14065 قبل ${deadlineDate}`,
      detailEn: `Facility Scope 1 emissions (${scope1.toLocaleString('en-US')} tCO2e) exceed 25,000 tCO2e in an EAD designated sector; accredited ISO 14065 / 14064-3 verification is required by ${deadlineDate} (${daysRemaining}d remaining).`,
      detailAr: `انبعاثات النطاق 1 (${scope1.toLocaleString('en-US')} طن مكافئ CO2) تتجاوز عتبة 25,000 طن في قطاع مشمول بقرار هيئة البيئة – أبوظبي 03/2026 ويتطلب تحقق ISO 14065 قبل ${deadlineDate} (متبقٍ ${daysRemaining} يوماً).`,
      legalRef: 'Abu Dhabi EAD Resolution No. 03 of 2026',
    });
  }

  if (nrccTier === 'huge_emitter_mandatory' && (!input.registeredOnNrcc || !verifierCompliant)) {
    findings.push({
      code: 'CLM-NRCC-HUGE-EMITTER-GAP',
      severity: 'blocker',
      titleEn: 'Mandatory NRCC Huge-Emitter (>= 0.5 MtCO2e) Compliance Gap',
      titleAr: 'فجوة التزام فئة الانبعاثات الضخمة في السجل الوطني NRCC (>= 500,000 طن)',
      detailEn: `Combined Scope 1+2 (${totalScope1And2Tco2e.toLocaleString('en-US')} tCO2e) meets/exceeds 500,000 tCO2e, triggering mandatory NRCC registration and third-party verification under Cabinet Resolution 67/2024.`,
      detailAr: `مجموع النطاقين 1 و2 (${totalScope1And2Tco2e.toLocaleString('en-US')} طن) يبلغ عتبة 500,000 طن مما يوجب التسجيل الإلزامي والتحقق في NRCC وفق قرار 67/2024.`,
      legalRef: 'UAE Cabinet Resolution No. 67 of 2024 (NRCC)',
    });
  }

  if (!input.hasFiveYearGhgArchive) {
    findings.push({
      code: 'CLM-FIVE-YEAR-ARCHIVE-MISSING',
      severity: 'blocker',
      titleEn: 'Missing Mandatory 5-Year GHG Inventory Record Archive',
      titleAr: 'نقص أرشفة سجلات الانبعاثات وبيانات النشاط لمدة 5 سنوات',
      detailEn:
        'Decree-Law 11/2024 mandates retaining GHG inventories, fuel/power bills, and verification files for 5 years.',
      detailAr:
        'يشترط القانون الاحتفاظ بسجلات الجرد وفواتير الطاقة والبيانات الموثقة لمدة 5 سنوات كاملة.',
      legalRef: 'Federal Decree-Law No. 11 of 2024 — 5-Year Record Retention',
    });
  }

  if (!input.hasReductionAdaptationPlan) {
    findings.push({
      code: 'CLM-REDUCTION-PLAN-MISSING',
      severity: 'warning',
      titleEn: 'Annual Emission Reduction & Climate Adaptation Plan Not Documented',
      titleAr: 'عدم توثيق خطة سنوية لخفض الانبعاثات والتكيّف المناخي',
      detailEn:
        'Prepare an annual emission-reduction and climate-resilience roadmap aligned with UAE Net Zero 2050 targets.',
      detailAr:
        'يُوصى باعتماد خطة سنوية موثقة لخفض الانبعاثات والتكيّف المناخي متوائمة مع مبادرة الحياد المناخي 2050.',
      legalRef: 'Federal Decree-Law No. 11 of 2024',
    });
  }

  return {
    scopeThreshold: {
      coveredByFederalClimateLaw,
      totalScope1And2Tco2e,
      totalAllScopesTco2e,
      eadDesignatedSector,
      eadMandatoryMrvApplies,
      nrccTier,
      thirdPartyVerificationRequired,
      verifierCompliant,
    },
    findings,
  };
}
