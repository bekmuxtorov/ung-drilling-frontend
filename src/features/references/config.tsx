import type { ReactNode } from 'react';
import {
  Boxes,
  BriefcaseBusiness,
  Building2,
  Car,
  Cog,
  HardHat,
  Layers,
  MapPin,
  MapPinned,
  Scale,
  Truck,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import type { Area, BaseEntity, Employee, Foreman } from '../../api/types';
import { tr } from '../../i18n';

export type ReferenceKey =
  | 'enterprises'
  | 'regions'
  | 'areas'
  | 'drilling-rig-types'
  | 'transport-types'
  | 'machine-types'
  | 'depths-layers'
  | 'resources'
  | 'units'
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

const nameColumn = (label = tr('Nomi')): ColumnDef => ({ key: 'name', label, render: (row) => row.name });

const phoneField = (name: string): FieldDef => ({
  name,
  label: tr('Telefon raqami'),
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
    title: tr('Tashkilotlar'),
    singular: tr('Tashkilot'),
    icon: Building2,
    fields: [nameField(tr('Nomi'), tr('Tashkilot nomini kiriting'))],
    columns: [nameColumn()],
  },
  {
    key: 'regions',
    endpoint: 'regions',
    title: tr('Hududlar'),
    singular: tr('Hudud'),
    icon: MapPin,
    fields: [nameField(tr('Nomi'), tr('Hudud nomini kiriting'))],
    columns: [nameColumn()],
    deleteWarning: tr("Hudud o'chirilsa, unga biriktirilgan barcha maydonlar ham o'chiriladi."),
  },
  {
    key: 'areas',
    endpoint: 'areas',
    title: tr('Maydonlar'),
    singular: tr('Maydon'),
    icon: MapPinned,
    fields: [
      nameField(tr('Nomi'), tr('Maydon nomini kiriting')),
      {
        name: 'region',
        label: tr('Viloyat'),
        type: 'select',
        required: true,
        placeholder: tr('Viloyatni tanlang'),
        relation: { reference: 'regions', filterParam: 'region_id' },
        getValue: (row) => ((row as Area).region?.id != null ? String((row as Area).region!.id) : ''),
      },
    ],
    columns: [nameColumn(), { key: 'region', label: tr('Hudud'), render: (row) => textOrDash((row as Area).region?.name) }],
    filters: [{ label: tr('Hudud'), placeholder: tr('Hududni tanlang'), relation: { reference: 'regions', filterParam: 'region_id' } }],
  },
  {
    key: 'drilling-rig-types',
    endpoint: 'drilling-rig-types',
    title: tr("Burg'ilash uskuna turlari"),
    singular: tr('Uskuna turi'),
    icon: Car,
    fields: [nameField(tr('Nomi'), tr('Uskuna turi nomini kiriting'))],
    columns: [nameColumn()],
  },
  {
    key: 'transport-types',
    endpoint: 'transport-types',
    title: tr('Transport turlari'),
    singular: tr('Transport turi'),
    icon: Truck,
    fields: [nameField(tr('Nomi'), tr('Transport turi nomini kiriting'))],
    columns: [nameColumn()],
  },
  {
    key: 'machine-types',
    endpoint: 'machine-types',
    title: tr('Uskuna turlari'),
    singular: tr('Uskuna turi'),
    icon: Cog,
    fields: [nameField(tr('Nomi'), tr('Uskuna turi nomini kiriting'))],
    columns: [nameColumn()],
  },
  {
    key: 'depths-layers',
    endpoint: 'depths-layers',
    title: tr('Chuqurlik qatlamlari'),
    singular: tr('Chuqurlik qatlami'),
    icon: Layers,
    fields: [nameField(tr('Nomi'), tr('Chuqurlik qatlami nomini kiriting'))],
    columns: [nameColumn()],
  },
  {
    key: 'resources',
    endpoint: 'resources',
    title: tr('Resurslar'),
    singular: tr('Resurs'),
    icon: Boxes,
    fields: [nameField(tr('Nomi'), tr('Resurs nomini kiriting'))],
    columns: [nameColumn()],
  },
  {
    key: 'units',
    endpoint: 'units',
    title: tr("O'lchov birliklari"),
    singular: tr("O'lchov birligi"),
    icon: Scale,
    fields: [nameField(tr('Nomi'), tr("O'lchov birligi nomini kiriting"))],
    columns: [nameColumn()],
  },
  {
    key: 'foremen',
    endpoint: 'foremen',
    title: tr('Prorablar'),
    singular: tr('Prorab'),
    icon: HardHat,
    fields: [nameField('F.I.SH', tr('Familiya Ism Sharif')), phoneField('phone')],
    columns: [
      nameColumn('F.I.SH'),
      { key: 'phone', label: tr('Telefon raqami'), render: (row) => textOrDash((row as Foreman).phone) },
    ],
  },
  {
    key: 'positions',
    endpoint: 'positions',
    title: tr('Lavozimlar'),
    singular: tr('Lavozim'),
    icon: BriefcaseBusiness,
    fields: [nameField(tr('Nomi'), tr('Lavozim nomini kiriting'))],
    columns: [nameColumn()],
    deleteWarning: tr("Lavozim o'chirilsa, unga biriktirilgan xodimlar ham o'chirilishi mumkin."),
  },
  {
    key: 'employees',
    endpoint: 'employees',
    title: tr('Xodimlar'),
    singular: tr('Xodim'),
    icon: UserCog,
    fields: [
      nameField('F.I.SH', tr('Familiya Ism Sharif')),
      {
        name: 'position',
        label: tr('Lavozim'),
        type: 'select',
        required: true,
        placeholder: tr('Lavozimni tanlang'),
        relation: { reference: 'positions', filterParam: 'position_id' },
        getValue: (row) => ((row as Employee).position?.id != null ? String((row as Employee).position!.id) : ''),
      },
      phoneField('phone_number'),
    ],
    columns: [
      nameColumn('F.I.SH'),
      { key: 'position', label: tr('Lavozim'), render: (row) => textOrDash((row as Employee).position?.name) },
      { key: 'phone_number', label: tr('Telefon raqami'), render: (row) => textOrDash((row as Employee).phone_number) },
    ],
    filters: [
      { label: tr('Lavozim'), placeholder: tr('Lavozimni tanlang'), relation: { reference: 'positions', filterParam: 'position_id' } },
    ],
  },
];

export const REFERENCE_MAP = Object.fromEntries(REFERENCES.map((r) => [r.key, r])) as Record<
  ReferenceKey,
  ReferenceConfig
>;

export const isReferenceKey = (value: string | undefined): value is ReferenceKey =>
  !!value && value in REFERENCE_MAP;

