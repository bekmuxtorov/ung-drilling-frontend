/**
 * Ilova tarjima tizimi.
 *
 * Manba tili — o'zbek (lotin). Kodda matnlar lotinda yoziladi va `tr()` bilan o'raladi:
 *   tr("Ma'lumotlarni yuklab bo'lmadi")
 *   tr('Quduq {0} yaratildi', well.number)
 *
 * - uz — lotin (manba, o'zgarishsiz)
 * - oz — kirill (lotindan qoidalar asosida avtomatik o'giriladi)
 * - ru — rus (ru.ts lug'atidan; topilmasa — lotin matni qaytariladi)
 *
 * Til tanlovi localStorage'da saqlanadi va til o'zgarganda sahifa qayta yuklanadi —
 * shu tufayli modul darajasidagi konstantalar (menyu, ma'lumotnoma sozlamalari) ham to'g'ri tilda bo'ladi.
 */
import { toCyrillic } from './translit';
import { RU } from './ru';

export type Locale = 'uz' | 'oz' | 'ru';

export const LOCALES: { code: Locale; name: string; short: string; htmlLang: string; intl: string }[] = [
  { code: 'uz', name: "O'zbekcha", short: 'UZ', htmlLang: 'uz-Latn', intl: 'uz-Latn-UZ' },
  { code: 'oz', name: 'Ўзбекча', short: 'ЎЗ', htmlLang: 'uz-Cyrl', intl: 'uz-Cyrl-UZ' },
  { code: 'ru', name: 'Русский', short: 'RU', htmlLang: 'ru', intl: 'ru-RU' },
];

export const LOCALE_STORAGE_KEY = 'ung_app_lang';

const readLocale = (): Locale => {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'uz' || saved === 'oz' || saved === 'ru') return saved;
  } catch {
    // Saqlash imkoni bo'lmasa — standart til
  }
  return 'uz';
};

/** Joriy til — ilova ishga tushganda bir marta aniqlanadi */
export const locale: Locale = readLocale();

export const localeInfo = LOCALES.find((l) => l.code === locale)!;

/** Raqam va sanalarni formatlash uchun Intl locale */
export const intlLocale = localeInfo.intl;

const cyrCache = new Map<string, string>();
const missing = new Set<string>();

const lookup = (text: string): string => {
  if (locale === 'uz') return text;
  if (locale === 'oz') {
    let out = cyrCache.get(text);
    if (out === undefined) {
      out = toCyrillic(text);
      cyrCache.set(text, out);
    }
    return out;
  }
  const ru = RU[text];
  if (ru !== undefined) return ru;
  if (import.meta.env.DEV && !missing.has(text)) {
    missing.add(text);
    console.warn(`[i18n] ru tarjimasi yo'q: "${text}"`);
  }
  return text;
};

/**
 * Matnni joriy tilga tarjima qiladi.
 * `{0}`, `{1}` … o'rinbosarlar argumentlar bilan to'ldiriladi (argumentlar tarjima qilinmaydi).
 */
export const tr = (text: string, ...args: unknown[]): string => {
  const out = lookup(text);
  return args.length ? out.replace(/\{(\d+)\}/g, (m, i) => (Number(i) < args.length ? String(args[Number(i)] ?? '') : m)) : out;
};

/** Tilni o'zgartiradi va ilovani qayta yuklaydi */
export const setLocale = (next: Locale) => {
  if (next === locale) return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
  } catch {
    // Saqlab bo'lmasa ham qayta yuklash foydasiz bo'ladi
    return;
  }
  window.location.reload();
};

if (typeof document !== 'undefined') document.documentElement.lang = localeInfo.htmlLang;

/**
 * Atoqli otlar (quduq, kon, hudud nomlari) uchun: tarjima qilinmaydi, faqat yozuvi o'giriladi.
 * Kirill va rus interfeysida — kirill yozuvida (manba hujjatlardagi kabi).
 */
export const trName = (name: string): string => (locale === 'uz' ? name : toCyrillic(name));
