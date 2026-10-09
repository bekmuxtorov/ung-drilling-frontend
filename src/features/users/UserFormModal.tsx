import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, Eye, EyeOff, KeyRound, Loader2, Trash2, X } from 'lucide-react';
import { ApiError } from '../../api/client';
import { rolesApi, usersApi } from '../../api/accounts';
import { Modal } from '../../components/ui/Modal';
import { loadOptions, type Option } from '../references/api';
import { formatDateTimeShort } from '../references/format';
import type { RoleItem, UserCreatePayload, UserItem, UserUpdatePayload } from '../../types/auth';
import { tr } from '../../i18n';

interface UserFormModalProps {
  isOpen: boolean;
  /** Ustiga boshqa oyna (tasdiq/parol) ochilganda holatni saqlagan holda yashirish */
  hidden?: boolean;
  initialUser?: UserItem | null;
  canDelete?: boolean;
  onClose: () => void;
  onSaved: (user: UserItem) => void;
  onDelete?: (user: UserItem) => void;
  onChangePassword?: (user: UserItem) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  hidden,
  initialUser,
  canDelete,
  onClose,
  onSaved,
  onDelete,
  onChangePassword,
}) => {
  const isEdit = !!initialUser;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [employees, setEmployees] = useState<Option[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Formani to'ldirish
  useEffect(() => {
    if (!isOpen) return;
    setUsername(initialUser?.username ?? '');
    setFirstName(initialUser?.first_name ?? '');
    setLastName(initialUser?.last_name ?? '');
    setEmail(initialUser?.email ?? '');
    setEmployeeId(initialUser?.employee ? String(initialUser.employee) : '');
    setRoleId(initialUser?.role ? String(initialUser.role) : '');
    setIsActive(initialUser?.is_active ?? true);
    setIsStaff(initialUser?.is_staff ?? false);
    setIsSuperuser(initialUser?.is_superuser ?? false);
    setPassword('');
    setPasswordConfirm('');
    setShowPassword(false);
    setGeneralError('');
    setFieldErrors({});
    setSaving(false);
  }, [initialUser, isOpen]);

  // Rol va xodimlar ro'yxati
  useEffect(() => {
    if (!isOpen) return;
    setLoadingOptions(true);
    Promise.all([rolesApi.list({ page_size: 100 }), loadOptions('employees').catch(() => [] as Option[])])
      .then(([rolesRes, emps]) => {
        setRoles(rolesRes.results || []);
        setEmployees(emps || []);
      })
      .catch(() => undefined)
      .finally(() => setLoadingOptions(false));
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setGeneralError('');

    const errors: Record<string, string> = {};
    if (!username.trim()) errors.username = tr('Majburiy maydon');
    if (!isEdit) {
      if (!password) errors.password = tr('Majburiy maydon');
      else if (password.length < 6) errors.password = tr('Kamida 6 ta belgi');
      if (password !== passwordConfirm) errors.password_confirm = tr('Parollar mos kelmadi');
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    const common = {
      username: username.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      employee: employeeId ? Number(employeeId) : null,
      role: roleId ? Number(roleId) : null,
      is_active: isActive,
      is_staff: isStaff,
      is_superuser: isSuperuser,
    };

    setSaving(true);
    try {
      const saved =
        isEdit && initialUser
          ? await usersApi.update(initialUser.id, common as UserUpdatePayload)
          : await usersApi.create({ ...common, password, password_confirm: passwordConfirm } as UserCreatePayload);
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
        setFieldErrors(err.fieldErrors ?? {});
      } else setGeneralError(tr('Saqlashda xatolik yuz berdi'));
      setSaving(false);
    }
  };

  const errorOf = (name: string) =>
    fieldErrors[name] && <p className="field__hint field__hint--error">{fieldErrors[name]}</p>;

  const select = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    options: { value: string; label: string }[],
  ) => (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="select-wrap">
        <select
          id={id}
          className={`input ${value ? '' : 'input--placeholder'} ${fieldErrors[id.replace('u-', '')] ? 'input--error' : ''}`}
          value={value}
          disabled={saving || loadingOptions}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{loadingOptions ? 'Yuklanmoqda…' : placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="select-wrap__chevron" />
      </div>
      {errorOf(id.replace('u-', ''))}
    </div>
  );

  return (
    <Modal
      open={isOpen}
      hidden={hidden}
      size="lg"
      onClose={saving ? () => undefined : onClose}
      title={isEdit ? `@${initialUser?.username}` : tr("Foydalanuvchi qo'shish")}
      footer={
        <>
          {isEdit && initialUser && (
            <>
              {onDelete && (
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() => onDelete(initialUser)}
                  disabled={saving || !canDelete}
                  title={canDelete ? undefined : tr("O'zingizni yoki superuser'ni o'chirib bo'lmaydi")}
                >
                  <Trash2 size={14} />
                  {tr("O'chirish")}</button>
              )}
              {onChangePassword && (
                <button type="button" className="btn btn--outline" onClick={() => onChangePassword(initialUser)} disabled={saving}>
                  <KeyRound size={14} />
                  {tr("Parolni o'zgartirish")}</button>
              )}
              <span className="modal__footer-spacer" />
            </>
          )}
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
            <X size={14} />
            {tr('Bekor qilish')}</button>
          <button type="submit" form="user-form" className="btn btn--primary" disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {tr('Saqlash')}</button>
        </>
      }
    >
      <form id="user-form" className="form" onSubmit={handleSubmit} noValidate>
        {generalError && <div className="alert">{generalError}</div>}

        <fieldset className="form-section">
          <legend className="form-section__title">{tr("Hisob ma'lumotlari")}</legend>
          <div className="form-grid form-grid--2">
            <div className="field">
              <label className="field__label" htmlFor="u-username">
                {tr('Login')}<span className="field__required">*</span>
              </label>
              <input
                id="u-username"
                className={`input ${fieldErrors.username ? 'input--error' : ''}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={tr('Masalan: j.aliyev')}
                autoComplete="off"
                disabled={saving}
                autoFocus={!isEdit}
              />
              {errorOf('username')}
            </div>
            <div className="field">
              <label className="field__label" htmlFor="u-email">
                {tr('Email')}</label>
              <input
                id="u-email"
                type="email"
                className={`input ${fieldErrors.email ? 'input--error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@ung.uz"
                disabled={saving}
              />
              {errorOf('email')}
            </div>

            {!isEdit && (
              <>
                <div className="field">
                  <label className="field__label" htmlFor="u-password">
                    {tr('Parol')}<span className="field__required">*</span>
                  </label>
                  <div className="password-input">
                    <input
                      id="u-password"
                      type={showPassword ? 'text' : 'password'}
                      className={`input ${fieldErrors.password ? 'input--error' : ''}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tr('Kamida 6 ta belgi')}
                      autoComplete="new-password"
                      disabled={saving}
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
                  {errorOf('password')}
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="u-password2">
                    {tr('Parolni tasdiqlash')}<span className="field__required">*</span>
                  </label>
                  <input
                    id="u-password2"
                    type={showPassword ? 'text' : 'password'}
                    className={`input ${fieldErrors.password_confirm ? 'input--error' : ''}`}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder={tr('Parolni qayta kiriting')}
                    autoComplete="new-password"
                    disabled={saving}
                  />
                  {errorOf('password_confirm')}
                </div>
              </>
            )}
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend className="form-section__title">{tr("Shaxsiy ma'lumotlar va rol")}</legend>
          <div className="form-grid form-grid--2">
            <div className="field">
              <label className="field__label" htmlFor="u-last">
                {tr('Familiya')}</label>
              <input id="u-last" className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={tr('Familiya')} disabled={saving} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="u-first">
                {tr('Ism')}</label>
              <input id="u-first" className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={tr('Ism')} disabled={saving} />
            </div>
            {select('u-role', tr('Rol'), roleId, setRoleId, tr('Rol biriktirilmagan'), roles.map((r) => ({ value: String(r.id), label: r.name })))}
            {select('u-employee', tr('Xodim'), employeeId, setEmployeeId, tr('Xodim biriktirilmagan'), employees)}
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend className="form-section__title">{tr('Holat va huquqlar')}</legend>
          <div className="flag-grid">
            <label className={`flag ${isActive ? 'is-on' : ''}`}>
              <input type="checkbox" className="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={saving} />
              <span>
                <strong>{tr('Faol')}</strong>
                <small>{tr('Tizimga kira oladi')}</small>
              </span>
            </label>
            <label className={`flag ${isStaff ? 'is-on' : ''}`}>
              <input type="checkbox" className="checkbox" checked={isStaff} onChange={(e) => setIsStaff(e.target.checked)} disabled={saving} />
              <span>
                <strong>{tr("Tizim ma'muri")}</strong>
                <small>{tr('Staff huquqi')}</small>
              </span>
            </label>
            <label className={`flag ${isSuperuser ? 'is-on' : ''}`}>
              <input type="checkbox" className="checkbox" checked={isSuperuser} onChange={(e) => setIsSuperuser(e.target.checked)} disabled={saving} />
              <span>
                <strong>{tr('Superuser')}</strong>
                <small>{tr('Cheksiz huquq')}</small>
              </span>
            </label>
          </div>
        </fieldset>

        {isEdit && initialUser && (
          <div className="form-grid form-grid--2">
            <div className="field">
              <label className="field__label">{tr('Yaratilgan vaqt')}</label>
              <input className="input" value={formatDateTimeShort(initialUser.created_at)} disabled readOnly />
            </div>
            <div className="field">
              <label className="field__label">{tr('Oxirgi kirish')}</label>
              <input className="input" value={initialUser.last_login ? formatDateTimeShort(initialUser.last_login) : tr('Kirilmagan')} disabled readOnly />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
