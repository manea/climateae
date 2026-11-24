import type { ClimatePreset } from './types.ts';

const PRESET_3_FACILITIES_CSV = [
  'facility_id,facility_name,emirate,sector,scope1_tco2e,scope2_tco2e,iso14065_verified,archive_5yr_ready',
  'AD-SITE-01,Ruwais Refinery Block A,abu_dhabi,oil_and_gas,340000,180000,false,false',
  'AD-SITE-02,=HYPERLINK("http://bad"),abu_dhabi,industrial_manufacturing,32000,8500,false,true',
  'DXB-SITE-03,Jebel Ali Hub South,dubai,transport_logistics,4200,2600,true,true',
].join('\n');

export const CLIMATE_PRESETS: readonly ClimatePreset[] = [
  {
    id: 'dubai-freezone-logistics-ready',
    labelEn: 'Dubai Free Zone Logistics (Ready — 100/100 MRV & 5-Yr Archive Complete)',
    labelAr: 'شركة لوجستيات في المنطقة الحرة بدبي (جاهزة 100/100 تحت قانون 11/2024)',
    descriptionEn:
      'JAFZA logistics operator below the 500k tCO2e NRCC cap, registered on mrv.ae, maintaining a 5-year GHG archive and approved decarbonisation roadmap.',
    descriptionAr:
      'مشغّل لوجستيات في المنطقة الحرة (مشمول بالقانون 11/2024) مسجل في mrv.ae مع أرشفة 5 سنوات وخطة خفض انبعاثات معتمدة.',
    input: {
      organizationName: 'Al Maktoum Dryport Logistics FZCO',
      emirate: 'dubai',
      isFreeZone: true,
      sector: 'transport_logistics',
      assessmentDate: '2026-11-25',
      reportingYear: 2026,
      scope1Tco2e: 4_800,
      scope2Tco2e: 3_200,
      scope3Tco2e: 18_500,
      registeredOnMoccaeMrv: true,
      registeredOnNrcc: true,
      verifierAccreditation: 'moccae_recognized',
      hasFiveYearGhgArchive: true,
      hasReductionAdaptationPlan: true,
      repeatViolationWithinTwoYears: false,
      priorViolationsCount: 0,
      implementedControls: [
        'CLM-CTRL-01',
        'CLM-CTRL-02',
        'CLM-CTRL-03',
        'CLM-CTRL-04',
        'CLM-CTRL-05',
        'CLM-CTRL-06',
      ],
    },
  },
  {
    id: 'abudhabi-industrial-ead-mrv-conditional',
    labelEn: 'Abu Dhabi Industrial >=25k tCO2e (Conditional — ISO 14065 Audit Due Mar 31, 2027)',
    labelAr: 'مصنع في أبوظبي (>=25,000 طن) (مشروطة — تدقيق ISO 14065 قبل 31 مارس 2027)',
    descriptionEn:
      'Mussafah industrial facility emitting 42,000 tCO2e Scope 1 (>= 25,000 Abu Dhabi EAD threshold) with mrv.ae active and 126 days left to finalize ISO 14065 verification.',
    descriptionAr:
      'منشأة صناعية في مصفح بانبعاثات 42,000 طن نطاق 1 (>= عتبة هيئة البيئة – أبوظبي 25,000) ومسجلة في mrv.ae مع بقاء 126 يوماً لاستكمال تحقق ISO 14065.',
    input: {
      organizationName: 'KIZAD Aluminum Extrusion LLC',
      emirate: 'abu_dhabi',
      isFreeZone: true,
      sector: 'industrial_manufacturing',
      assessmentDate: '2026-11-25',
      reportingYear: 2026,
      scope1Tco2e: 42_000,
      scope2Tco2e: 14_000,
      scope3Tco2e: 29_000,
      registeredOnMoccaeMrv: true,
      registeredOnNrcc: false,
      verifierAccreditation: 'internal_only',
      hasFiveYearGhgArchive: true,
      hasReductionAdaptationPlan: true,
      repeatViolationWithinTwoYears: false,
      priorViolationsCount: 0,
      implementedControls: [
        'CLM-CTRL-01',
        'CLM-CTRL-02',
        'CLM-CTRL-04',
        'CLM-CTRL-05',
        'CLM-CTRL-06',
      ],
    },
  },
  {
    id: 'abudhabi-energy-nrcc-huge-emitter-blocked',
    labelEn: 'Abu Dhabi Oil & Gas >=0.5 MtCO2e NRCC (Blocked — 2x Repeat AED 4M Exposure & CSV)',
    labelAr: 'شركة طاقة بأبوظبي >=500,000 طن NRCC (محجوبة — مضاعفة الغرامة 4 مليون د.إ وCSV)',
    descriptionEn:
      '620,000 tCO2e combined Scope 1+2 Huge Emitter missing mrv.ae, NRCC registration, ISO 14065 audit, and 5-yr archive under repeat-offense exposure plus CWE-1236 CSV injection.',
    descriptionAr:
      'انبعاثات مجمعة 620,000 طن (>= عتبة 0.5 مليون طن NRCC) مع غياب mrv.ae والتحقق وأرشفة 5 سنوات وتعريض لمضاعفة الغرامات حتى 4,000,000 د.إ وكشف CSV بحقن صيغ.',
    input: {
      organizationName: 'Al Dhafra Hydrocarbon Processing PJSC',
      emirate: 'abu_dhabi',
      isFreeZone: false,
      sector: 'oil_and_gas',
      assessmentDate: '2026-11-25',
      reportingYear: 2026,
      scope1Tco2e: 485_000,
      scope2Tco2e: 135_000,
      scope3Tco2e: 210_000,
      registeredOnMoccaeMrv: false,
      registeredOnNrcc: false,
      verifierAccreditation: 'none',
      hasFiveYearGhgArchive: false,
      hasReductionAdaptationPlan: false,
      repeatViolationWithinTwoYears: true,
      priorViolationsCount: 1,
      facilitiesCsv: PRESET_3_FACILITIES_CSV,
      implementedControls: [],
    },
  },
];
