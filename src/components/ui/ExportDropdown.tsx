import React, { useEffect, useRef, useState } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText, FileDown } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF, type ExportData } from '../../utils/exportUtils';
import { useToast } from './Toast';
import { tr } from '../../i18n';

export interface ExportDropdownProps {
  data: ExportData;
  size?: 'sm' | 'md';
  variant?: 'outline' | 'default';
  disabled?: boolean;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  data,
  size = 'md',
  variant = 'outline',
  disabled = false,
}) => {
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    if (disabled || !data.rows || data.rows.length === 0) {
      notify('info', tr('Yuklab olish uchun ma’lumot mavjud emas'));
      setOpen(false);
      return;
    }

    try {
      if (format === 'excel') {
        exportToExcel(data);
        notify('success', tr('Excel fayl shakllantirildi'), `${data.filename}.xls`);
      } else if (format === 'csv') {
        exportToCSV(data);
        notify('success', tr('CSV fayl yuklandi'), `${data.filename}.csv`);
      } else if (format === 'pdf') {
        exportToPDF(data);
      }
    } catch {
      notify('error', tr('Faylni eksport qilishda xatolik yuz berdi'));
    }
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="export-dropdown">
      <button
        type="button"
        className={`btn ${size === 'sm' ? 'btn--sm' : ''} ${variant === 'outline' ? 'btn--outline' : 'btn--primary'} export-dropdown__trigger ${open ? 'is-active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={open}
        title={tr("Ma'lumotlarni yuklab olish (Excel, CSV, PDF)")}
      >
        <Download size={size === 'sm' ? 13 : 14} />
        <span>{tr('Yuklab olish')}</span>
        <ChevronDown
          size={size === 'sm' ? 12 : 14}
          className={`export-dropdown__chevron ${open ? 'is-open' : ''}`}
        />
      </button>

      {open && (
        <div className="export-dropdown__menu" role="menu">
          <div className="export-dropdown__header">{tr('Formatni tanlang:')}</div>
          <button
            type="button"
            className="export-dropdown__item"
            onClick={() => handleExport('excel')}
            role="menuitem"
          >
            <span className="export-dropdown__item-icon export-dropdown__item-icon--excel">
              <FileSpreadsheet size={15} />
            </span>
            <div className="export-dropdown__item-info">
              <strong>EXCEL</strong>
              <small>{tr('.xlsx / .xls jadvali')}</small>
            </div>
          </button>

          <button
            type="button"
            className="export-dropdown__item"
            onClick={() => handleExport('csv')}
            role="menuitem"
          >
            <span className="export-dropdown__item-icon export-dropdown__item-icon--csv">
              <FileText size={15} />
            </span>
            <div className="export-dropdown__item-info">
              <strong>CSV</strong>
              <small>{tr('.csv matnli fayl')}</small>
            </div>
          </button>

          <button
            type="button"
            className="export-dropdown__item"
            onClick={() => handleExport('pdf')}
            role="menuitem"
          >
            <span className="export-dropdown__item-icon export-dropdown__item-icon--pdf">
              <FileDown size={15} />
            </span>
            <div className="export-dropdown__item-info">
              <strong>PDF</strong>
              <small>{tr('.pdf rasmiy ko‘chirma')}</small>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
