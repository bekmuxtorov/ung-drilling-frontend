import type { ReactNode } from 'react';
import { Building2, BriefcaseBusiness, Car, HardHat, MapPin, MapPinned, Truck, UserCog, type LucideIcon } from 'lucide-react';
import type { Area, BaseEntity, Employee, Foreman } from '../../api/types';

export type ReferenceKey =
  | 'enterprises'
  | 'regions'
  | 'areas'
  | 'drilling-rig-types'
  | 'transport-types'
  | 'foremen'
  | 'positions'
  | 'employees';

export interface RelationDef {
  /** Bog'langan ma'lumotnoma */
  reference: ReferenceKey;
  /** Ro'yxatda filtrlash uchun query parametri */
  filterParam: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'tel' | 'select';
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  relation?: RelationDef;
  /** Tahrirlashda yozuvdan forma qiymatini olish */
  getValue: (row: AnyRow) => string;
}

export interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  render: (row: AnyRow) => ReactNode;
}

export interface ReferenceConfig {
  key: ReferenceKey;
  endpoint: string;
  title: string;
  singular: string;
  icon: LucideIcon;
  fields: FieldDef[];
  columns: ColumnDef[];
  /** Filtr oynasidagi bog'langan ma'lumotnoma bo'yicha filtrlar */
  filters?: { label: string; placeholder: string; relation: RelationDef }[];
  deleteWarning?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRow = BaseEntity & Record<string, any>;

const nameField = (label: string, placeholder: string): FieldDef => ({
  name: 'name',
  label,
  type: 'text',
  required: true,
  maxLength: 255,
  placeholder,
  getValue: (row) => row.name ?? '',
});

const nameColumn = (label = 'Nomi'): ColumnDef => ({ key: 'name', label, render: (row) => row.name });

const phoneField = (name: string): FieldDef => ({
  name,
  label: 'Telefon raqami',
  type: 'tel',
  maxLength: 50,
  placeholder: '+998 90 123 45 67',
  getValue: (row) => row[name] ?? '',
});

const textOrDash = (value: string | null | undefined) => value || '—';

export const REFERENCES: ReferenceConfig[] = [
  {
    key: 'enterprises',
    endpoint: 'enterprises',
    title: 'Tashkilotlar',
    singular: 'Tashkilot',
    icon: Building2,
    fields: [nameField('Nomi', 'Tashkilot nomini kiriting')],
    columns: [nameColumn()],
  },
  {
    key: 'regions',
    endpoint: 'regions',
    title: 'Hududlar',
    singular: 'Hudud',
    icon: MapPin,
    fields: [nameField('Nomi', 'Hudud nomini kiriting')],
    columns: [nameColumn()],
    deleteWarning: "Hudud o'chirilsa, unga biriktirilgan barcha maydonlar ham o'chiriladi.",
  },
  {
    key: 'areas',
    endpoint: 'areas',
    title: 'Maydonlar',
    singular: 'Maydon',
    icon: MapPinned,
    fields: [
      nameField('Nomi', 'Maydon nomini kiriting'),
      {
        name: 'region',
        label: 'Viloyat',
        type: 'select',
        required: true,
        placeholder: 'Viloyatni tanlang',
        relation: { reference: 'regions', filterParam: 'region_id' },
        getValue: (row) => ((row as Area).region?.id != null ? String((row as Area).region!.id) : ''),
      },
    ],
    columns: [nameColumn(), { key: 'region', label: 'Hudud', render: (row) => textOrDash((row as Area).region?.name) }],
    filters: [{ label: 'Hudud', placeholder: 'Hududni tanlang', relation: { reference: 'regions', filterParam: 'region_id' } }],
  },
  {
    key: 'drilling-rig-types',
    endpoint: 'drilling-rig-types',
    title: "Burg'ilash uskuna turlari",
    singular: 'Uskuna turi',
    icon: Car,
    fields: [nameField('Nomi', 'Uskuna turi nomini kiriting')],
    columns: [nameColumn()],
  },
  {
    key: 'transport-types',
    endpoint: 'transport-types',
    title: 'Transport turlari',
    singular: 'Transport turi',
    icon: Truck,
    fields: [nameField('Nomi', 'Transport turi nomini kiriting')],
    columns: [nameColumn()],
  },
  {
    key: 'foremen',
    endpoint: 'foremen',
    title: 'Prorablar',
    singular: 'Prorab',
    icon: HardHat,
    fields: [nameField('F.I.SH', 'Familiya Ism Sharif'), phoneField('phone')],
    columns: [
      nameColumn('F.I.SH'),
      { key: 'phone', label: 'Telefon raqami', render: (row) => textOrDash((row as Foreman).phone) },
    ],
  },
  {
    key: 'positions',
    endpoint: 'positions',
    title: 'Lavozimlar',
    singular: 'Lavozim',
    icon: BriefcaseBusiness,
    fields: [nameField('Nomi', 'Lavozim nomini kiriting')],
    columns: [nameColumn()],
    deleteWarning: "Lavozim o'chirilsa, unga biriktirilgan xodimlar ham o'chirilishi mumkin.",
  },
  {
    key: 'employees',
    endpoint: 'employees',
    title: 'Xodimlar',
    singular: 'Xodim',
    icon: UserCog,
    fields: [
      nameField('F.I.SH', 'Familiya Ism Sharif'),
      {
        name: 'position',
        label: 'Lavozim',
        type: 'select',
        required: true,
        placeholder: 'Lavozimni tanlang',
        relation: { reference: 'positions', filterParam: 'position_id' },
        getValue: (row) => ((row as Employee).position?.id != null ? String((row as Employee).position!.id) : ''),
      },
      phoneField('phone_number'),
    ],
    columns: [
      nameColumn('F.I.SH'),
      { key: 'position', label: 'Lavozim', render: (row) => textOrDash((row as Employee).position?.name) },
      { key: 'phone_number', label: 'Telefon raqami', render: (row) => textOrDash((row as Employee).phone_number) },
    ],
    filters: [
      { label: 'Lavozim', placeholder: 'Lavozimni tanlang', relation: { reference: 'positions', filterParam: 'position_id' } },
    ],
  },
];

export const REFERENCE_MAP = Object.fromEntries(REFERENCES.map((r) => [r.key, r])) as Record<
  ReferenceKey,
  ReferenceConfig
>;

export const isReferenceKey = (value: string | undefined): value is ReferenceKey =>
  !!value && value in REFERENCE_MAP;

