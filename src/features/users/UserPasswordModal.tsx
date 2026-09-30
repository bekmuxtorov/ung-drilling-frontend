import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { ApiError } from '../../api/client';
import { usersApi } from '../../api/accounts';
import type { UserItem } from '../../types/auth';

interface UserPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null;
  onSuccess: () => void;
}

export const UserPasswordModal: React.FC<UserPasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errs: Record<string, string> = {};
    if (!newPassword) errs.new_password = "Yangi parol kiritilishi shart";
    else if (newPassword.length < 6) errs.new_password = "Parol kamida 6 ta belgidan iborat bo'lishi kerak";

    if (newPassword !== newPasswordConfirm) {
      errs.new_password_confirm = "Yangi parollar bir-biriga mos kelmadi";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSaving(true);
    try {
      await usersApi.setPassword(user.id, {
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setError("Parolni o'rnatishda xatolik yuz berdi");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: '440px', width: '90%' }}>
        <div className="modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={18} color="var(--brand-600)" />
            <h3 className="modal__title">Yangi parol o'rnatish: @{user.username}</h3>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} disabled={saving}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form" style={{ padding: '16px 20px' }}>
          {error && <div className="alert">{error}</div>}

          <div className="field">
            <label className="field__label">
              Yangi parol <span className="field__required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`input ${fieldErrors.new_password ? 'input--error' : ''}`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Kamida 6 belgi"
                disabled={saving}
                autoFocus
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.new_password && (
              <span className="field__hint field__hint--error">{fieldErrors.new_password}</span>
            )}
          </div>

          <div className="field">
            <label className="field__label">
              Yangi parolni tasdiqlash <span className="field__required">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className={`input ${fieldErrors.new_password_confirm ? 'input--error' : ''}`}
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              placeholder="Parolni qayta kiriting"
              disabled={saving}
            />
            {fieldErrors.new_password_confirm && (
              <span className="field__hint field__hint--error">{fieldErrors.new_password_confirm}</span>
            )}
          </div>

          <div className="modal__footer" style={{ marginTop: '16px', padding: 0 }}>
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={saving}>
              Bekor qilish
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saqlanmoqda...</span>
                </>
              ) : (
                <span>Parolni o'rnatish</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
