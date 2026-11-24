import type { ClimateControlSpec, ClimateSector } from './types.ts';

export const CLIMATEAE_TOOL_VERSION = '0.5.0';
export const UAE_CLIMATE_LAW_EFFECTIVE_DATE = '2025-05-30';
export const EAD_FY2026_DEADLINE_DATE = '2027-03-31';

export const EAD_SCOPE1_THRESHOLD_TCO2E = 25_000;
export const NRCC_HUGE_EMITTER_THRESHOLD_TCO2E = 500_000;

export const CLIMATE_FINE_MIN_AED = 50_000;
export const CLIMATE_FINE_MAX_AED = 2_000_000;
export const CLIMATE_FINE_REPEAT_MULTIPLIER = 2;
export const GHG_ARCHIVE_RETENTION_YEARS = 5;

export const EAD_DESIGNATED_SECTORS: ReadonlySet<ClimateSector> = new Set([
  'industrial_manufacturing',
  'power_water_utilities',
  'oil_and_gas',
  'transport_logistics',
  'waste_management',
]);

export const LEGAL_DISCLAIMER_EN =
  'Notice: ClimateAE is an independent technical readiness tool and is NOT affiliated with or endorsed by the UAE Ministry of Climate Change & Environment (MOCCAE), Environment Agency - Abu Dhabi (EAD), the National Register for Carbon Credits (NRCC), SCA, or any ISO 14065 verifier. Outputs are indicative only and do not constitute legal advice or accredited GHG verification.';

export const LEGAL_DISCLAIMER_AR =
  'تنبيه مهم: أداة ClimateAE أداة فحص تقنية مستقلة وليست تابعة أو معتمدة من وزارة التغير المناخي والبيئة الإماراتية (MOCCAE) أو هيئة البيئة – أبوظبي (EAD) أو السجل الوطني لأرصدة الكربون (NRCC) أو أي جهة تحقق وفق ISO 14065. المخرجات استرشادية ولا تُعد استشارة قانونية أو شهادة تحقق معتمدة.';

export const CLIMATE_CONTROLS: readonly ClimateControlSpec[] = [
  {
    id: 'CLM-CTRL-01',
    weight: 20,
    titleEn: 'MOCCAE National MRV Registration (mrv.ae) Under Law 11/2024',
    titleAr: 'التسجيل في النظام الوطني للقياس والإبلاغ والتحقق (mrv.ae) لقانون 11/2024',
    descriptionEn:
      'Register UAE mainland and free-zone emission sources on the official MOCCAE MRV registry.',
    descriptionAr:
      'تسجيل المنشآت ومصادر الانبعاث في البر الرئيسي والمناطق الحرة ضمن بوابة وزارة التغير المناخي والبيئة.',
  },
  {
    id: 'CLM-CTRL-02',
    weight: 20,
    titleEn: 'Facility-Level Scope 1 & Scope 2 Inventory (ISO 14064-1 / GHG Protocol)',
    titleAr: 'جرد انبعاثات النطاقين 1 و2 على مستوى المنشأة (ISO 14064-1)',
    descriptionEn:
      'Quantify Scope 1 direct and Scope 2 indirect emissions annually against official UAE grid/fuel factors.',
    descriptionAr:
      'قياس الانبعاثات المباشرة وغير المباشرة سنوياً بالمعاملات المعتمدة للوقود والكهرباء في الإمارات.',
  },
  {
    id: 'CLM-CTRL-03',
    weight: 20,
    titleEn: 'Independent ISO 14065 / 14064-3 Third-Party GHG Verification',
    titleAr: 'التحقق المستقل عبر جهة معتمدة (ISO 14065 / 14064-3) قبل 31 مارس',
    descriptionEn:
      'Engage an accredited independent verifier when Abu Dhabi Scope 1 >= 25,000 tCO2e or NRCC >= 500,000 tCO2e.',
    descriptionAr:
      'اعتماد تقارير الجرد السنوية لدى مدقق خارجي مستقل للمنشآت الخاضعة لعتبة أبوظبي 25,000 طن أو السجل الوطني.',
  },
  {
    id: 'CLM-CTRL-04',
    weight: 15,
    titleEn: 'NRCC Registration (Mandatory >= 0.5 MtCO2e / Voluntary Carbon Credits)',
    titleAr: 'التسجيل في السجل الوطني لأرصدة الكربون NRCC (إلزامي >= 500,000 طن)',
    descriptionEn:
      'Maintain active NRCC standing under Cabinet Resolution 67/2024 and prevent double-counting of credits.',
    descriptionAr:
      'الالتزام بقرار مجلس الوزراء 67/2024 للتسجيل الإلزامي للانبعاثات الضخمة وحوكمة أرصدة الكربون.',
  },
  {
    id: 'CLM-CTRL-05',
    weight: 15,
    titleEn: '5-Year Immutable GHG Records & Activity Data Archive',
    titleAr: 'أرشفة سجلات وبيانات نشاط الانبعاثات لمدة لا تقل عن 5 سنوات',
    descriptionEn:
      'Retain fuel invoices, meter logs, calculation workbooks, and verifier statements for 5 years.',
    descriptionAr:
      'حفظ فواتير الوقود وقراءات العدادات وأوراق الاحتساب وتقارير التحقق لمدة 5 سنوات متصلة.',
  },
  {
    id: 'CLM-CTRL-06',
    weight: 10,
    titleEn: 'Board-Approved Emission Reduction & Climate Adaptation Plan',
    titleAr: 'خطة معتمدة لخفض الانبعاثات والتكيّف المناخي ومسار الحياد 2050',
    descriptionEn:
      'Establish concrete annual decarbonisation and heat/climate adaptation milestones per Decree-Law 11/2024.',
    descriptionAr:
      'اعتماد مستهدفات سنوية لخفض الانبعاثات والتكيّف المناخي متوافقة مع قانون التغير المناخي.',
  },
];
