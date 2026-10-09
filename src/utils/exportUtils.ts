import { tr } from '../i18n';

/**
 * Utility functions for exporting tabular data to CSV, Excel, and PDF formats.
 */

export interface ExportData {
  title: string;
  subtitle?: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Exports data to CSV file with UTF-8 BOM for full Cyrillic/Uzbek characters support.
 */
export const exportToCSV = ({ filename, headers, rows }: ExportData) => {
  const sanitize = (val: string | number | null | undefined) => {
    if (val == null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const lines = [
    headers.map(sanitize).join(','),
    ...rows.map((row) => row.map(sanitize).join(',')),
  ];

  const content = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
};

/**
 * Exports data to styled Excel XML spreadsheet (.xls).
 */
export const exportToExcel = ({ filename, title, subtitle, headers, rows }: ExportData) => {
  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Sheet1</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11pt; }
        th { background-color: #175cd3; color: #ffffff; font-weight: bold; text-align: left; padding: 10px; border: 1px solid #d0d5dd; }
        td { padding: 8px 10px; border: 1px solid #eaecf0; text-align: left; }
        .title-cell { font-size: 14pt; font-weight: bold; color: #101828; padding: 10px 0 4px; }
        .subtitle-cell { font-size: 10pt; color: #475467; padding-bottom: 12px; }
      </style>
    </head>
    <body>
      <table>
        <tr><td class="title-cell" colspan="${headers.length}">${title}</td></tr>
        ${subtitle ? `<tr><td class="subtitle-cell" colspan="${headers.length}">${subtitle}</td></tr>` : ''}
        <tr></tr>
        <thead>
          <tr>
            ${headers.map((h) => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `<tr>${r.map((c) => `<td>${c ?? ''}</td>`).join('')}</tr>`
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  triggerDownload(blob, `${filename}.xls`);
};

/**
 * Opens printable document and triggers browser print-to-PDF with UNG branding.
 */
export const exportToPDF = ({ title, subtitle, headers, rows }: ExportData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert(tr('Iltimos, brauzerda qalqib chiquvchi oyna (pop-up) ochilishiga ruxsat bering'));
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page { size: A4 landscape; margin: 12mm 15mm; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          color: #101828;
          margin: 0;
          padding: 16px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #175cd3;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .company {
          font-size: 12px;
          font-weight: 700;
          color: #175cd3;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .title {
          font-size: 17px;
          font-weight: 700;
          color: #101828;
          margin: 4px 0 2px;
        }
        .subtitle {
          font-size: 11.5px;
          color: #475467;
        }
        .date {
          font-size: 11px;
          color: #667085;
          text-align: right;
          line-height: 1.4;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 11px;
        }
        th {
          background: #f8fafc;
          color: #344054;
          font-weight: 600;
          text-align: left;
          padding: 7px 10px;
          border: 1px solid #d0d5dd;
          font-size: 11px;
        }
        td {
          padding: 7px 10px;
          border: 1px solid #eaecf0;
          color: #1d2939;
        }
        tr:nth-child(even) {
          background: #fcfcfd;
        }
        .footer {
          margin-top: 20px;
          font-size: 10.5px;
          color: #98a2b3;
          text-align: center;
          border-top: 1px solid #eaecf0;
          padding-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company">"O'ZBEKNEFTGAZ" AJ • GQI BURG'ILASH DEPARTAMENTI</div>
          <div class="title">${title}</div>
          ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        </div>
        <div class="date">
          Hujjat shakllantirilgan sana:<br>
          <strong>${new Date().toLocaleDateString('uz-UZ')} ${new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</strong>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map((h) => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? '—'}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
      <div class="footer">
        UNG Drilling axborot tizimidan avtomatik shakllantirilgan rasmiy ko‘chirma
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 200);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
