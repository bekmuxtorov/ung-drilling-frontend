import React, { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { ApiError } from '../../api/client';
import { usersApi } from '../../api/accounts';
import { Modal } from '../../components/ui/Modal';
import type { UserItem } from '../../types/auth';
import { tr } from '../../i18n';

interface UserPasswordModalProps {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserPasswordModal: React.FC<UserPasswordModalProps> = ({ isOpen, user, onClose, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setNewPassword('');
    setNewPasswordConfirm('');
    setShowPassword(false);
    setError('');
    setFieldErrors({});
    setSaving(false);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;
    setError('');

    const errs: Record<string, string> = {};
    if (!newPassword) errs.new_password = tr('Majburiy maydon');
    else if (newPassword.length < 6) errs.new_password = tr('Kamida 6 ta belgi');
    if (newPassword !== newPasswordConfirm) errs.new_password_confirm = tr('Parollar mos kelmadi');
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await usersApi.setPassword(user.id, { new_password: newPassword, new_password_confirm: newPasswordConfirm });
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors ?? {});
      } else setError(tr("Parolni o'rnatishda xatolik yuz berdi"));
      setSaving(false);
    }
  };

  return (
    <Modal
      open={isOpen && !!user}
      size="sm"
      onClose={saving ? () => undefined : onClose}
      title={tr('Yangi parol · @{0}', user?.username ?? '')}
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
            <X size={14} />
            {tr('Bekor qilish')}</button>
          <button type="submit" form="password-form" className="btn btn--primary" disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {tr('Saqlash')}</button>
        </>
      }
    >
      <form id="password-form" className="form" onSubmit={handleSubmit} noValidate>
        {error && <div className="alert">{error}</div>}
        <div className="field">
          <label className="field__label" htmlFor="pw-new">
            {tr('Yangi parol')}<span className="field__required">*</span>
          </label>
          <div className="password-input">
            <input
              id="pw-new"
              type={showPassword ? 'text' : 'password'}
              className={`input ${fieldErrors.new_password ? 'input--error' : ''}`}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={tr('Kamida 6 ta belgi')}
              autoComplete="new-password"
              disabled={saving}
              autoFocus
            />
            <button
              type="button"
              className="password-input__toggle"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? tr('Parolni yashirish') : tr("Parolni ko'rsatish")}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {fieldErrors.new_password && <p className="field__hint field__hint--error">{fieldErrors.new_password}</p>}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="pw-confirm">
            {tr('Parolni tasdiqlash')}<span className="field__required">*</span>
          </label>
          <input
            id="pw-confirm"
            type={showPassword ? 'text' : 'password'}
            className={`input ${fieldErrors.new_password_confirm ? 'input--error' : ''}`}
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            placeholder={tr('Parolni qayta kiriting')}
            autoComplete="new-password"
            disabled={saving}
          />
          {fieldErrors.new_password_confirm && <p className="field__hint field__hint--error">{fieldErrors.new_password_confirm}</p>}
        </div>
      </form>
    </Modal>
  );
};
