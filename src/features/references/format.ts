const pad = (n: number) => String(n).padStart(2, '0');

/** 13.06.2026 12:25:58 */
export const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** 12.02.2026 20:00 */
export const formatDateTimeShort = (value?: string | null) => formatDateTime(value).slice(0, 16);
