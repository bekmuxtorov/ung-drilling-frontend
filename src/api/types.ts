export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BaseEntity {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export type Enterprise = BaseEntity;
export type Region = BaseEntity;
export type Position = BaseEntity;
export type DrillingRigType = BaseEntity;
export type TransportType = BaseEntity;
export type MachineType = BaseEntity;
export type DepthsLayers = BaseEntity;
export type Resources = BaseEntity;
export type Unit = BaseEntity;


export interface Area extends BaseEntity {
  region: Region | null;
}

export interface Employee extends BaseEntity {
  phone_number: string | null;
  position: Position | null;
}

export interface Foreman extends BaseEntity {
  phone: string | null;
}

export interface OperationStageChoice {
  value: string;
  label: string;
}

export interface ListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [filter: string]: string | number | boolean | null | undefined;
}

/* ---------- VBM (Minora montaji) operatsiyalari ---------- */

export type StageType = 'dismantling' | 'transportation' | 'installation';

export interface OperationStage {
  id: number;
  operation: number;
  stage_type: StageType;
  stage_type_display: string;
  plan_days: number;
  fact_days: number;
  plan_start_date: string | null;
  plan_end_date: string | null;
  fact_start_date: string | null;
  fact_end_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DerrickErectionOperation {
  id: number;
  enterprise: Enterprise;
  drilling_rig_type: DrillingRigType;
  from_area: Area;
  from_well_number: string;
  to_area: Area;
  to_well_number: string;
  foreman: Foreman;
  number_employees: number;
  /** Decimal — satr ko'rinishida */
  distance_km: string;
  plan_days: number;
  expected_drilling_date: string | null;
  /** Decimal — satr ko'rinishida (0.00–100.00) */
  completion_percentage: string;
  delay_reason: string | null;
  work_description: string | null;
  stages: OperationStage[];
  daily_works_count: number;
  created_at: string;
  updated_at: string;
}

export interface DailyTransportItem {
  id: number;
  daily_work_description: number;
  transport_type: TransportType;
  count: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyWorkDescription {
  id: number;
  derrick_erection_operation: number;
  description: string;
  transport_items: DailyTransportItem[];
  created_at: string;
  updated_at: string;
}

/* ---------- GRR (Burg'ulash) — BPA operatsiyalari ---------- */

export type WellDesignType = 'plan' | 'fact';
export type WellDesignPeriodType = 'day' | 'month' | 'year';

export interface WellDesign {
  id: number;
  drilling_bpa: number;
  type: WellDesignType;
  type_display?: string;
  pipe_diameter: number | null;
  length: number | null;
  start_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface WellDesignInLength {
  id: number;
  drilling_bpa: number;
  type: WellDesignPeriodType;
  type_display?: string;
  length_plan: number | null;
  length_fact: number | null;
  delta?: number;
  delta_percent?: number;
  start_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepthsLayersLength {
  id: number;
  drilling_bpa: number;
  layer: DepthsLayers;
  length: number | null;
  created_at: string;
  updated_at: string;
}

export interface DailyWorkDescriptionBPA {
  id: number;
  drilling_bpa: number;
  report_date: string;
  description: string;
  density: number | null;
  viscosity: number | null;
  fluid_loss: number | null;
  mud_cake: number | null;
  ph_level: number | null;
  weight_on_bit: number | null;
  rpm: number | null;
  pump_pressure: number | null;
  flow_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface AvailableResourcesBPA {
  id: number;
  drilling_bpa: number;
  resources: Resources;
  unit: Unit;
  value: number | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface DrillingBPA {
  id: number;
  number: string;
  enterprise: Enterprise;
  employee: Employee | null;
  area: Area | null;
  well_number: string;
  machine_type: MachineType | null;
  drilling_start_date: string | null;
  depth_plan: number | null;
  current_depth: number;
  current_dept?: number;
  well_designs_count: number;
  daily_works_count: number;
  available_resources_count: number;
  created_at: string;
  updated_at: string;
}

export interface DrillingBPADetail extends DrillingBPA {
  well_designs: WellDesign[];
  well_designs_in_length: WellDesignInLength[];
  depths_layers_lengths: DepthsLayersLength[];
  daily_works: DailyWorkDescriptionBPA[];
  available_resources: AvailableResourcesBPA[];
}

