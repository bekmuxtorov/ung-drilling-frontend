/**
 * O'zbek lotin yozuvidan kirill yozuviga o'girish (1995-yilgi imlo qoidalari asosida).
 *
 * - o' → ў, g' → ғ, sh → ш, ch → ч, yo → ё, yu → ю, ya → я, ye → е, q → қ, h → ҳ, x → х
 * - so'z boshida va unlidan keyin "e" → э
 * - tutuq belgisi (') → ъ
 * - {0} kabi o'rinbosarlar, raqamli kodlar (ZJ50DB), brendlar va qisqartmalar o'zgarmaydi
 */

const APOS = "'ʼʻ‘’`";
const VOWELS = 'aeiouAEIOUаеиоуэюяёўАЕИОУЭЮЯЁЎ';

/** Lotin yozuvida qoladigan so'zlar (brendlar, texnik qisqartmalar) */
const KEEP = new Set([
  'CNPC',
  'Techenergy',
  'IPM',
  'Xibu',
  'Drilling',
  'Engineering',
  'Company',
  'Ltd',
  'CSV',
  'PDF',
  'Excel',
  'XLSX',
  'Ctrl',
  'JWT',
  'API',
  'IP',
  'MAC',
  'ID',
  'URL',
  'Well',
  'Design',
  'Plan',
  'Available',
  'Resources',
  'OK',
]);

const SINGLE: Record<string, string> = {
  a: 'а', b: 'б', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м',
  n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з',
  c: 'ц', w: 'в',
};

const DOUBLE: Record<string, string> = { sh: 'ш', ch: 'ч', yo: 'ё', yu: 'ю', ya: 'я', ye: 'е' };

const isUpper = (ch: string) => ch !== ch.toLowerCase();

const translitWord = (word: string): string => {
  let res = '';
  let i = 0;
  const allCaps = word.length > 1 && word === word.toUpperCase();

  while (i < word.length) {
    const ch = word[i];
    const lower = ch.toLowerCase();
    const next = word[i + 1] ?? '';
    const prevOut = res[res.length - 1] ?? '';

    // o' va g'
    if ((lower === 'o' || lower === 'g') && next !== '' && APOS.includes(next)) {
      const out = lower === 'o' ? 'ў' : 'ғ';
      res += isUpper(ch) ? out.toUpperCase() : out;
      i += 2;
      continue;
    }
    // Tutuq belgisi
    if (APOS.includes(ch)) {
      res += allCaps ? 'Ъ' : 'ъ';
      i += 1;
      continue;
    }
    // Ikki harfli birikmalar
    // "yo'" — й + ў (yo'l → йўл), "yo" emas
    const afterNext = word[i + 2] ?? '';
    const out2 = DOUBLE[lower + next.toLowerCase()];
    if (out2 && !(next.toLowerCase() === 'o' && afterNext !== '' && APOS.includes(afterNext))) {
      res += isUpper(ch) ? out2.toUpperCase() : out2;
      i += 2;
      continue;
    }
    // e: so'z boshida yoki unlidan keyin — э
    if (lower === 'e') {
      const out = res.length === 0 || VOWELS.includes(prevOut) ? 'э' : 'е';
      res += isUpper(ch) ? out.toUpperCase() : out;
      i += 1;
      continue;
    }
    const mapped = SINGLE[lower];
    res += mapped ? (isUpper(ch) ? mapped.toUpperCase() : mapped) : ch;
    i += 1;
  }
  return res;
};

// So'z: lotin harflari va ichidagi tutuq belgilari
const WORD_RE = new RegExp(`[A-Za-z][A-Za-z${APOS}]*`, 'g');

/** Matnni kirillga o'giradi; o'rinbosarlar va texnik bo'laklar saqlanadi */
export const toCyrillic = (text: string): string =>
  text
    .split(/(\{\d+\}|[A-Za-z]*\d[A-Za-z\d]*|\S+@\S+|https?:\/\/\S+)/)
    .map((part, idx) => {
      // Toq indekslar — o'zgarmaydigan bo'laklar (o'rinbosar, raqamli kod, email, URL)
      if (idx % 2 === 1) return part;
      return part.replace(WORD_RE, (w) => {
        const bare = w.replace(new RegExp(`[${APOS}]+$`), '');
        // Brendlar, qisqartmalar va yakka bosh harflar (Ctrl K) o'zgarmaydi
        if (KEEP.has(bare) || /^[A-Z]$/.test(bare)) return w;
        return translitWord(w);
      });
    })
    .join('');
