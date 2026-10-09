/* Manba: "Оперативная сводка по АО Узбекнефтегаз" (Excel), СВОД varag'i, 17.09.2026 holati.
   Backendda svodka API paydo bo'lgach, shu tuzilmadagi javob bilan almashtiriladi. */

export type WellCategory = 'Jami' | 'Ekspluatatsiya' | 'Izlov-qidiruv';

export interface PlanFactRow {
  category: WellCategory;
  contractor: string;
  /** 0 — umumiy jami, 1 — toifa jami, 2 — pudratchi */
  level: 0 | 1 | 2;
  month_plan: number;
  day_plan: number;
  day_fact: number;
  day_delta: number;
  mtd_plan: number;
  mtd_fact: number;
  mtd_delta: number;
  ytd_plan: number;
  ytd_fact: number;
  ytd_delta: number;
}

export interface RigRow {
  well_type: Exclude<WellCategory, 'Jami'>;
  region: string;
  total: number;
  ung_total: number;
  ung_drilling: number;
  ung_testing: number;
  ung_mounting: number;
  ung_complication: number;
  cnpc_total: number;
  cnpc_drilling: number;
  cnpc_testing: number;
  cnpc_mounting: number;
  cnpc_transport: number;
}

export interface MonthWell {
  well: string;
  well_type: Exclude<WellCategory, 'Jami'>;
  status: 'Rejada' | 'Tugatildi';
  /** YYYY-MM-DD */
  date: string;
}

export interface ShortfallNote {
  well: string;
  /** Burg'ilash hududi (RigRow.region) */
  region: string;
  well_type: Exclude<WellCategory, 'Jami'>;
  contractor: string;
  shortfall_m: number;
  reason: string;
}

export interface DailySummary {
  /** Svodka sanasi (YYYY-MM-DD) */
  reportDate: string;
  /** Kunlik ko'rsatkichlar tegishli kun */
  dayDate: string;
  monthName: string;
  daysInMonth: number;
  meterage: PlanFactRow[];
  completedWells: PlanFactRow[];
  rigs: RigRow[];
  monthWells: MonthWell[];
  shortfalls: ShortfallNote[];
}

export const SVOD_2026_09_17: DailySummary = {
  reportDate: '2026-09-17',
  dayDate: '2026-09-16',
  monthName: 'Sentyabr',
  daysInMonth: 30,
  meterage: [
  {
    "category": "Jami",
    "contractor": "Jami O'zbekneftegaz",
    "level": 0,
    "month_plan": 25565,
    "day_plan": 570,
    "day_fact": 788,
    "day_delta": 218,
    "mtd_plan": 16456,
    "mtd_fact": 21654,
    "mtd_delta": 5198,
    "ytd_plan": 235791,
    "ytd_fact": 255202,
    "ytd_delta": 19411
  },
  {
    "category": "Ekspluatatsiya",
    "contractor": "Jami ekspluatatsiya",
    "level": 1,
    "month_plan": 2700,
    "day_plan": 60,
    "day_fact": 0,
    "day_delta": -60,
    "mtd_plan": 1795,
    "mtd_fact": 2495,
    "mtd_delta": 700,
    "ytd_plan": 100075,
    "ytd_fact": 108231,
    "ytd_delta": 8156
  },
  {
    "category": "Ekspluatatsiya",
    "contractor": "O'zneftegaz burg'ulash ishlari",
    "level": 2,
    "month_plan": 2700,
    "day_plan": 60,
    "day_fact": 0,
    "day_delta": -60,
    "mtd_plan": 1795,
    "mtd_fact": 2495,
    "mtd_delta": 700,
    "ytd_plan": 98347,
    "ytd_fact": 106496,
    "ytd_delta": 8149
  },
  {
    "category": "Ekspluatatsiya",
    "contractor": "Techenergy",
    "level": 2,
    "month_plan": 0,
    "day_plan": 0,
    "day_fact": 0,
    "day_delta": 0,
    "mtd_plan": 0,
    "mtd_fact": 0,
    "mtd_delta": 0,
    "ytd_plan": 1728,
    "ytd_fact": 1735,
    "ytd_delta": 7
  },
  {
    "category": "Izlov-qidiruv",
    "contractor": "Jami izlov-qidiruv",
    "level": 1,
    "month_plan": 22865,
    "day_plan": 510,
    "day_fact": 788,
    "day_delta": 278,
    "mtd_plan": 14661,
    "mtd_fact": 19159,
    "mtd_delta": 4498,
    "ytd_plan": 135716,
    "ytd_fact": 146971,
    "ytd_delta": 11255
  },
  {
    "category": "Izlov-qidiruv",
    "contractor": "O'zneftegaz burg'ulash ishlari",
    "level": 2,
    "month_plan": 11265,
    "day_plan": 270,
    "day_fact": 500,
    "day_delta": 230,
    "mtd_plan": 7931,
    "mtd_fact": 11437,
    "mtd_delta": 3506,
    "ytd_plan": 116476,
    "ytd_fact": 126227,
    "ytd_delta": 9751
  },
  {
    "category": "Izlov-qidiruv",
    "contractor": "Techenergy",
    "level": 2,
    "month_plan": 0,
    "day_plan": 0,
    "day_fact": 0,
    "day_delta": 0,
    "mtd_plan": 0,
    "mtd_fact": 0,
    "mtd_delta": 0,
    "ytd_plan": 4500,
    "ytd_fact": 4500,
    "ytd_delta": 0
  },
  {
    "category": "Izlov-qidiruv",
    "contractor": "IPM loyiha ofisi",
    "level": 2,
    "month_plan": 0,
    "day_plan": 0,
    "day_fact": 0,
    "day_delta": 0,
    "mtd_plan": 0,
    "mtd_fact": 0,
    "mtd_delta": 0,
    "ytd_plan": 310,
    "ytd_fact": 266,
    "ytd_delta": -44
  },
  {
    "category": "Izlov-qidiruv",
    "contractor": "CNPC Xibu Drilling",
    "level": 2,
    "month_plan": 11600,
    "day_plan": 240,
    "day_fact": 288,
    "day_delta": 48,
    "mtd_plan": 6730,
    "mtd_fact": 7722,
    "mtd_delta": 992,
    "ytd_plan": 14430,
    "ytd_fact": 15978,
    "ytd_delta": 1548
  }
] as PlanFactRow[],
  completedWells: [
  {
    "category": "Jami",
    "contractor": "Jami O'zbekneftegaz",
    "level": 0,
    "month_plan": 8,
    "day_plan": 0,
    "day_fact": 1,
    "day_delta": 1,
    "mtd_plan": 2,
    "mtd_fact": 2,
    "mtd_delta": 0,
    "ytd_plan": 55,
    "ytd_fact": 55,
    "ytd_delta": 0
  },
  {
    "category": "Ekspluatatsiya",
    "contractor": "Jami ekspluatatsiya",
    "level": 1,
    "month_plan": 2,
    "day_plan": 0,
    "day_fact": 1,
    "day_delta": 1,
    "mtd_plan": 1,
    "mtd_fact": 1,
    "mtd_delta": 0,
    "ytd_plan": 30,
    "ytd_fact": 33,
    "ytd_delta": 3
  },
  {
    "category": "Ekspluatatsiya",
    "contractor": "O'zneftegaz burg'ulash ishlari",
    "level": 2,
    "month_plan": 2,
    "day_plan": 0,
    "day_fact": 1,
    "day_delta": 1,
    "mtd_plan": 1,
    "mtd_fact": 1,
    "mtd_delta": 0,
    "ytd_plan": 28,
    "ytd_fact": 30,
    "ytd_delta": 2
  },
  {
    "category": "Ekspluatatsiya",
    "contractor": "Techenergy",
    "level": 2,
    "month_plan": 0,
    "day_plan": 0,
    "day_fact": 0,
    "day_delta": 0,
    "mtd_plan": 0,
    "mtd_fact": 0,
    "mtd_delta": 0,
    "ytd_plan": 2,
    "ytd_fact": 3,
    "ytd_delta": 1
  },
  {
    "category": "Izlov-qidiruv",
    "contractor": "Jami izlov-qidiruv",
    "level": 1,
    "month_plan": 6,
    "day_plan": 0,
    "day_fact": 0,
    "day_delta": 0,
    "mtd_plan": 1,
    "mtd_fact": 1,
    "mtd_delta": 0,
    "ytd_plan": 25,
    "ytd_fact": 22,
    "ytd_delta": -3
  },
  {
    "category": "Izlov-qidiruv",
    "contractor": "O'zneftegaz burg'ulash ishlari",
    "level": 2,
    "month_plan": 6,
    "day_plan": 0,
    "day_fact": 0,
    "day_delta": 0,
    "mtd_plan": 1,
    "mtd_fact": 1,
    "mtd_delta": 0,
    "ytd_plan": 23,
    "ytd_fact": 21,
    "ytd_delta": -2
  },
  {
    "category": "Izlov-qidiruv",
    "contractor": "Techenergy",
    "level": 2,
    "month_plan": 0,
    "day_plan": 0,
    "day_fact": 0,
    "day_delta": 0,
    "mtd_plan": 0,
    "mtd_fact": 0,
    "mtd_delta": 0,
    "ytd_plan": 1,
    "ytd_fact": 1,
    "ytd_delta": 0
  },
  {
    "category": "Izlov-qidiruv",
    "contractor": "IPM loyiha ofisi",
    "level": 2,
    "month_plan": 0,
    "day_plan": 0,
    "day_fact": 0,
    "day_delta": 0,
    "mtd_plan": 0,
    "mtd_fact": 0,
    "mtd_delta": 0,
    "ytd_plan": 1,
    "ytd_fact": 0,
    "ytd_delta": -1
  },
  {
    "category": "Izlov-qidiruv",
    "contractor": "CNPC Xibu Drilling",
    "level": 2,
    "month_plan": 0,
    "day_plan": 0,
    "day_fact": 0,
    "day_delta": 0,
    "mtd_plan": 0,
    "mtd_fact": 0,
    "mtd_delta": 0,
    "ytd_plan": 0,
    "ytd_fact": 0,
    "ytd_delta": 0
  }
] as PlanFactRow[],
  rigs: [
  {
    "well_type": "Ekspluatatsiya",
    "region": "Ustyurt",
    "total": 7,
    "ung_total": 7,
    "ung_drilling": 2,
    "ung_testing": 5,
    "ung_mounting": 0,
    "ung_complication": 0,
    "cnpc_total": 0,
    "cnpc_drilling": 0,
    "cnpc_testing": 0,
    "cnpc_mounting": 0,
    "cnpc_transport": 0
  },
  {
    "well_type": "Ekspluatatsiya",
    "region": "Muborak",
    "total": 5,
    "ung_total": 5,
    "ung_drilling": 3,
    "ung_testing": 1,
    "ung_mounting": 0,
    "ung_complication": 1,
    "cnpc_total": 0,
    "cnpc_drilling": 0,
    "cnpc_testing": 0,
    "cnpc_mounting": 0,
    "cnpc_transport": 0
  },
  {
    "well_type": "Ekspluatatsiya",
    "region": "Sho'rtan",
    "total": 1,
    "ung_total": 1,
    "ung_drilling": 1,
    "ung_testing": 0,
    "ung_mounting": 0,
    "ung_complication": 0,
    "cnpc_total": 0,
    "cnpc_drilling": 0,
    "cnpc_testing": 0,
    "cnpc_mounting": 0,
    "cnpc_transport": 0
  },
  {
    "well_type": "Ekspluatatsiya",
    "region": "Gazli",
    "total": 2,
    "ung_total": 2,
    "ung_drilling": 0,
    "ung_testing": 0,
    "ung_mounting": 2,
    "ung_complication": 0,
    "cnpc_total": 0,
    "cnpc_drilling": 0,
    "cnpc_testing": 0,
    "cnpc_mounting": 0,
    "cnpc_transport": 0
  },
  {
    "well_type": "Izlov-qidiruv",
    "region": "Ustyurt",
    "total": 23,
    "ung_total": 14,
    "ung_drilling": 7,
    "ung_testing": 6,
    "ung_mounting": 1,
    "ung_complication": 0,
    "cnpc_total": 9,
    "cnpc_drilling": 7,
    "cnpc_testing": 0,
    "cnpc_mounting": 2,
    "cnpc_transport": 0
  },
  {
    "well_type": "Izlov-qidiruv",
    "region": "Muborak",
    "total": 10,
    "ung_total": 10,
    "ung_drilling": 7,
    "ung_testing": 2,
    "ung_mounting": 1,
    "ung_complication": 0,
    "cnpc_total": 0,
    "cnpc_drilling": 0,
    "cnpc_testing": 0,
    "cnpc_mounting": 0,
    "cnpc_transport": 0
  },
  {
    "well_type": "Izlov-qidiruv",
    "region": "Sho'rtan",
    "total": 7,
    "ung_total": 7,
    "ung_drilling": 5,
    "ung_testing": 0,
    "ung_mounting": 0,
    "ung_complication": 2,
    "cnpc_total": 0,
    "cnpc_drilling": 0,
    "cnpc_testing": 0,
    "cnpc_mounting": 0,
    "cnpc_transport": 0
  },
  {
    "well_type": "Izlov-qidiruv",
    "region": "Gazli",
    "total": 4,
    "ung_total": 4,
    "ung_drilling": 3,
    "ung_testing": 1,
    "ung_mounting": 0,
    "ung_complication": 0,
    "cnpc_total": 0,
    "cnpc_drilling": 0,
    "cnpc_testing": 0,
    "cnpc_mounting": 0,
    "cnpc_transport": 0
  },
  {
    "well_type": "Izlov-qidiruv",
    "region": "Vodiy",
    "total": 1,
    "ung_total": 1,
    "ung_drilling": 1,
    "ung_testing": 0,
    "ung_mounting": 0,
    "ung_complication": 0,
    "cnpc_total": 0,
    "cnpc_drilling": 0,
    "cnpc_testing": 0,
    "cnpc_mounting": 0,
    "cnpc_transport": 0
  }
] as RigRow[],
  monthWells: [
  {
    "well": "Yangi Tegirmon №14",
    "well_type": "Ekspluatatsiya",
    "status": "Rejada",
    "date": "2026-09-16"
  },
  {
    "well": "Mo'ynoq №15",
    "well_type": "Ekspluatatsiya",
    "status": "Rejada",
    "date": "2026-09-22"
  },
  {
    "well": "Mo'ynoq №9",
    "well_type": "Izlov-qidiruv",
    "status": "Rejada",
    "date": "2026-09-03"
  },
  {
    "well": "Alchin №1",
    "well_type": "Izlov-qidiruv",
    "status": "Rejada",
    "date": "2026-09-20"
  },
  {
    "well": "G'arbiy Quyi Surg'il №9",
    "well_type": "Izlov-qidiruv",
    "status": "Rejada",
    "date": "2026-09-22"
  },
  {
    "well": "Ortaboy №1",
    "well_type": "Izlov-qidiruv",
    "status": "Rejada",
    "date": "2026-09-27"
  },
  {
    "well": "Qoratov №1",
    "well_type": "Izlov-qidiruv",
    "status": "Rejada",
    "date": "2026-09-30"
  },
  {
    "well": "Murodbaxsh №1",
    "well_type": "Izlov-qidiruv",
    "status": "Rejada",
    "date": "2026-09-30"
  },
  {
    "well": "Qo'ltoq №88",
    "well_type": "Ekspluatatsiya",
    "status": "Tugatildi",
    "date": "2026-09-17"
  },
  {
    "well": "Mo'ynoq №9",
    "well_type": "Izlov-qidiruv",
    "status": "Tugatildi",
    "date": "2026-09-02"
  }
] as MonthWell[],
  shortfalls: [
  {
    "well": "Mo'ynoq №21",
    "region": "Ustyurt",
    "well_type": "Ekspluatatsiya",
    "contractor": "O'zneftegaz burg'ulash ishlari",
    "shortfall_m": 20,
    "reason": "Geofizik tadqiqot ishlari olib borildi"
  },
  {
    "well": "G'arbiy Quyi Surg'il №19",
    "region": "Ustyurt",
    "well_type": "Ekspluatatsiya",
    "contractor": "O'zneftegaz burg'ulash ishlari",
    "shortfall_m": 40,
    "reason": "Quduq devoriga qayta ishlov berildi"
  },
  {
    "well": "Qiziljar №4",
    "region": "Ustyurt",
    "well_type": "Izlov-qidiruv",
    "contractor": "CNPC Xibu Drilling",
    "shortfall_m": 100,
    "reason": "Mustahkamlash quvurlari tushirilib sementlandi, OZTs davom etmoqda"
  }
] as ShortfallNote[],
};
