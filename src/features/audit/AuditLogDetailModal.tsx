import React, { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  Diff,
  FileCode,
  Globe,
  Layers,
  Loader2,
  PlusCircle,
  RefreshCw,
  Trash2,
  User,
} from 'lucide-react';
import { auditLogsApi } from '../../api/audit';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import type { AuditLog } from '../../types/audit';
import { formatDateTime } from '../references/format';
import { tr } from '../../i18n';

interface AuditLogDetailModalProps {
  logId: number | null;
  initialLog?: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  logId,
  initialLog,
  isOpen,
  onClose,
}) => {
  const { notify } = useToast();
  const [log, setLog] = useState<AuditLog | null>(initialLog ?? null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'diff' | 'new' | 'old' | 'raw'>('diff');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !logId) {
      setLog(null);
      return;
    }

    if (initialLog && initialLog.id === logId) {
      setLog(initialLog);
    }

    const controller = new AbortController();
    setLoading(true);
    auditLogsApi
      .retrieve(logId, controller.signal)
      .then((data) => setLog(data))
      .catch(() => {
        if (!controller.signal.aborted) {
          notify('error', tr('Audit log tafsilotlarini yuklab bo‘lmadi'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [isOpen, logId, initialLog]);

  const handleCopyJSON = () => {
    if (!log) return;
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    notify('success', tr('Nusxalandi'), tr('Audit log JSON xotiraga olindi'));
    setTimeout(() => setCopied(false), 2000);
  };

  const renderActionBadge = (action: string, display: string) => {
    switch (action) {
      case 'create':
        return (
          <span className="audit-badge audit-badge--create">
            <PlusCircle size={13} />
            {display || tr('Yaratish')}
          </span>
        );
      case 'update':
        return (
          <span className="audit-badge audit-badge--update">
            <RefreshCw size={13} />
            {display || tr('Tahrirlash')}
          </span>
        );
      case 'delete':
        return (
          <span className="audit-badge audit-badge--delete">
            <Trash2 size={13} />
            {display || tr('O‘chirish')}
          </span>
        );
      default:
        return <span className="audit-badge">{display || action}</span>;
    }
  };

  const formatValue = (v: unknown): string => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'boolean') return v ? tr('Ha (True)') : tr('Yo‘q (False)');
    if (typeof v === 'object') return JSON.stringify(v, null, 2);
    return String(v);
  };

  // Build diff rows
  const getDiffRows = () => {
    if (!log) return [];

    const rows: { field: string; oldVal: unknown; newVal: unknown }[] = [];

    // 1. If changes object exists and is structured as { field: { old: ..., new: ... } }
    if (log.changes && typeof log.changes === 'object' && Object.keys(log.changes).length > 0) {
      Object.entries(log.changes).forEach(([field, item]) => {
        if (item && typeof item === 'object' && ('old' in item || 'new' in item)) {
          const typed = item as { old?: unknown; new?: unknown };
          rows.push({
            field,
            oldVal: typed.old,
            newVal: typed.new,
          });
        } else {
          rows.push({
            field,
            oldVal: (log.old_values as Record<string, unknown>)?.[field],
            newVal: (log.new_values as Record<string, unknown>)?.[field] ?? item,
          });
        }
      });
      return rows;
    }

    // 2. Otherwise derive from old_values and new_values
    const allKeys = Array.from(
      new Set([
        ...Object.keys(log.old_values || {}),
        ...Object.keys(log.new_values || {}),
      ]),
    );

    allKeys.forEach((key) => {
      const oldVal = (log.old_values as Record<string, unknown>)?.[key];
      const newVal = (log.new_values as Record<string, unknown>)?.[key];
      // Only include if different or if it's create/delete
      if (log.action === 'create' || log.action === 'delete' || JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        rows.push({ field: key, oldVal, newVal });
      }
    });

    return rows;
  };

  const diffRows = getDiffRows();

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>{tr('Audit log #{0} tafsilotlari', logId)}</span>
          {log && renderActionBadge(log.action, log.action_display)}
        </div>
      }
      size="xl"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <button type="button" className="btn btn--outline" onClick={handleCopyJSON} disabled={!log}>
            {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
            {copied ? tr('Nusxalandi') : tr('JSON nusxalash')}
          </button>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            {tr('Yopish')}</button>
        </div>
      }
    >
      {loading && !log ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Loader2 size={32} className="animate-spin" color="var(--brand-600)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--gray-500)', fontSize: '13px' }}>{tr('Audit tafsilotlari yuklanmoqda...')}</p>
        </div>
      ) : !log ? (
        <div className="empty-state">
          <p className="empty-state__text">{tr('Audit log topilmadi')}</p>
        </div>
      ) : (
        <div className="audit-detail">
          {/* Hero Banner */}
          <div className="audit-detail-hero">
            <div className="audit-detail-hero__left">
              <div className="audit-user__avatar">
                {log.user_full_name
                  ? log.user_full_name.slice(0, 2).toUpperCase()
                  : log.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="audit-detail-hero__title">
                  {log.object_repr || `${log.model_name} #${log.object_id}`}
                </h4>
                <div className="audit-detail-hero__time">
                  <Clock size={13} />
                  <span>{tr('Qayd vaqti:')}{' '}{formatDateTime(log.created_at)}</span>
                </div>
              </div>
            </div>
            <div>
              <span className="audit-model-tag">
                <span className="audit-model-app">{log.app_label}.</span>
                {log.model_name}
              </span>
            </div>
          </div>

          {/* 3 Meta Cards */}
          <div className="audit-meta-cards">
            {/* User Info */}
            <div className="audit-meta-card">
              <div className="audit-meta-card__head">
                <User size={14} color="var(--brand-600)" />
                {tr('Foydalanuvchi')}</div>
              <div className="audit-meta-card__body">
                <div className="audit-meta-card__row">
                  <span className="audit-meta-card__label">{tr('F.I.SH:')}</span>
                  <span className="audit-meta-card__val">{log.user_full_name || '—'}</span>
                </div>
                <div className="audit-meta-card__row">
                  <span className="audit-meta-card__label">{tr('Login:')}</span>
                  <span className="audit-meta-card__val">@{log.username}</span>
                </div>
                <div className="audit-meta-card__row">
                  <span className="audit-meta-card__label">{tr('User ID:')}</span>
                  <span className="audit-meta-card__val">{log.user ?? '—'}</span>
                </div>
              </div>
            </div>

            {/* Model & Object */}
            <div className="audit-meta-card">
              <div className="audit-meta-card__head">
                <Layers size={14} color="#0891b2" />
                {tr('Obyekt / Model')}</div>
              <div className="audit-meta-card__body">
                <div className="audit-meta-card__row">
                  <span className="audit-meta-card__label">{tr('Ilova (App):')}</span>
                  <span className="audit-meta-card__val">{log.app_label}</span>
                </div>
                <div className="audit-meta-card__row">
                  <span className="audit-meta-card__label">{tr('Model:')}</span>
                  <span className="audit-meta-card__val">{log.model_name}</span>
                </div>
                <div className="audit-meta-card__row">
                  <span className="audit-meta-card__label">{tr('Obyekt ID:')}</span>
                  <span className="audit-meta-card__val">{log.object_id}</span>
                </div>
              </div>
            </div>

            {/* Network & Device */}
            <div className="audit-meta-card">
              <div className="audit-meta-card__head">
                <Globe size={14} color="#7c3aed" />
                {tr('Tarmoq / Qurilma')}</div>
              <div className="audit-meta-card__body">
                <div className="audit-meta-card__row">
                  <span className="audit-meta-card__label">{tr('IP manzil:')}</span>
                  <span className="audit-meta-card__val" style={{ fontFamily: 'monospace' }}>
                    {log.ip_address || '—'}
                  </span>
                </div>
                <div className="audit-meta-card__row">
                  <span className="audit-meta-card__label">{tr('MAC / ID:')}</span>
                  <span className="audit-meta-card__val" style={{ fontFamily: 'monospace' }}>
                    {log.mac_address || '—'}
                  </span>
                </div>
                <div className="audit-meta-card__row" title={log.user_agent}>
                  <span className="audit-meta-card__label">{tr('Brauzer:')}</span>
                  <span
                    className="audit-meta-card__val"
                    style={{
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {log.user_agent || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="audit-detail-tabs">
            <button
              type="button"
              className={`audit-detail-tab-btn ${activeTab === 'diff' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('diff')}
            >
              <Diff size={14} />
              {tr('O‘zgarishlar (Diff)')}<span className="audit-action-tab__badge">{diffRows.length}</span>
            </button>
            <button
              type="button"
              className={`audit-detail-tab-btn ${activeTab === 'new' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('new')}
            >
              <PlusCircle size={14} />
              {tr('Yangi qiymatlar')}<span className="audit-action-tab__badge">
                {Object.keys(log.new_values || {}).length}
              </span>
            </button>
            <button
              type="button"
              className={`audit-detail-tab-btn ${activeTab === 'old' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('old')}
            >
              <Clock size={14} />
              {tr('Eski qiymatlar')}<span className="audit-action-tab__badge">
                {Object.keys(log.old_values || {}).length}
              </span>
            </button>
            <button
              type="button"
              className={`audit-detail-tab-btn ${activeTab === 'raw' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('raw')}
            >
              <FileCode size={14} />
              {tr('To‘liq JSON')}</button>
          </div>

          {/* Tab 1: Diff Table */}
          {activeTab === 'diff' && (
            <div>
              {diffRows.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px' }}>
                  <p className="empty-state__text">{tr('Maydonlar bo‘yicha alohida diff ma’lumoti qayd etilmagan')}</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="audit-diff-table">
                    <thead>
                      <tr>
                        <th style={{ width: '25%' }}>{tr('Maydon nomi')}</th>
                        <th style={{ width: '37.5%' }}>{tr('Eski qiymat')}</th>
                        <th style={{ width: '37.5%' }}>{tr('Yangi qiymat')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diffRows.map((r) => (
                        <tr key={r.field}>
                          <td className="audit-diff-field">{r.field}</td>
                          <td>
                            {r.oldVal !== undefined && r.oldVal !== null ? (
                              <div className="audit-diff-val audit-diff-val--old">
                                {formatValue(r.oldVal)}
                              </div>
                            ) : (
                              <span className="audit-diff-val--empty">—</span>
                            )}
                          </td>
                          <td>
                            {r.newVal !== undefined && r.newVal !== null ? (
                              <div className="audit-diff-val audit-diff-val--new">
                                {formatValue(r.newVal)}
                              </div>
                            ) : (
                              <span className="audit-diff-val--empty">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: New Values */}
          {activeTab === 'new' && (
            <div>
              {log.new_values && Object.keys(log.new_values).length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="audit-diff-table">
                    <thead>
                      <tr>
                        <th style={{ width: '30%' }}>{tr('Maydon')}</th>
                        <th>{tr('Qiymat')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(log.new_values).map(([k, v]) => (
                        <tr key={k}>
                          <td className="audit-diff-field">{k}</td>
                          <td>
                            <div className="audit-diff-val audit-diff-val--new">
                              {formatValue(v)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '30px' }}>
                  <p className="empty-state__text">{tr('Yangi qiymatlar mavjud emas')}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Old Values */}
          {activeTab === 'old' && (
            <div>
              {log.old_values && Object.keys(log.old_values).length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="audit-diff-table">
                    <thead>
                      <tr>
                        <th style={{ width: '30%' }}>{tr('Maydon')}</th>
                        <th>{tr('Qiymat')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(log.old_values).map(([k, v]) => (
                        <tr key={k}>
                          <td className="audit-diff-field">{k}</td>
                          <td>
                            <div className="audit-diff-val audit-diff-val--old">
                              {formatValue(v)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '30px' }}>
                  <p className="empty-state__text">{tr('Eski qiymatlar mavjud emas')}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Raw JSON */}
          {activeTab === 'raw' && (
            <div className="audit-json-box">
              <button
                type="button"
                className="audit-json-copy-btn"
                onClick={handleCopyJSON}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? tr('Nusxalandi') : tr('Nusxalash')}
              </button>
              <pre>{JSON.stringify(log, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
