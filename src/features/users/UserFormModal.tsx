import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, UserCheck, UserPlus } from 'lucide-react';
import { ApiError } from '../../api/client';
import { rolesApi, usersApi } from '../../api/accounts';
import { loadOptions, type Option } from '../references/api';
import type { RoleItem, UserCreatePayload, UserItem, UserUpdatePayload } from '../../types/auth';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (user: UserItem) => void;
  initialUser?: UserItem | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialUser,
}) => {
  const isEdit = !!initialUser;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [roleId, setRoleId] = useState<string>('');
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
    if (initialUser) {
      setUsername(initialUser.username || '');
      setFirstName(initialUser.first_name || '');
      setLastName(initialUser.last_name || '');
      setEmail(initialUser.email || '');
      setEmployeeId(initialUser.employee ? String(initialUser.employee) : '');
      setRoleId(initialUser.role ? String(initialUser.role) : '');
      setIsActive(initialUser.is_active);
      setIsStaff(initialUser.is_staff);
      setIsSuperuser(initialUser.is_superuser);
      setPassword('');
      setPasswordConfirm('');
    } else {
      setUsername('');
      setPassword('');
      setPasswordConfirm('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setEmployeeId('');
      setRoleId('');
      setIsActive(true);
      setIsStaff(false);
      setIsSuperuser(false);
    }
    setGeneralError('');
    setFieldErrors({});
  }, [initialUser, isOpen]);

  // Rol va Xodimlar ro'yxatini yuklash
  useEffect(() => {
    if (!isOpen) return;
    setLoadingOptions(true);
    Promise.all([
      rolesApi.list({ page_size: 100 }),
      loadOptions('employees').catch(() => [] as Option[]),
    ])
      .then(([rolesRes, emps]) => {
        setRoles(rolesRes.results || []);
        setEmployees(emps || []);
      })
      .catch(() => {
        // Option load fail
      })
      .finally(() => setLoadingOptions(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    // Oddiy validatsiya
    const errors: Record<string, string> = {};
    if (!username.trim()) errors.username = "Foydalanuvchi logini (username) kiritilishi shart";
    if (!isEdit) {
      if (!password) errors.password = "Parol kiritilishi shart";
      else if (password.length < 6) errors.password = "Parol kamida 6 belgidan iborat bo'lishi kerak";
      if (password !== passwordConfirm) errors.password_confirm = "Parollar bir-biriga mos kelmadi";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      if (isEdit && initialUser) {
        const payload: UserUpdatePayload = {
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
        const updated = await usersApi.update(initialUser.id, payload);
        onSaved(updated);
        onClose();
      } else {
        const payload: UserCreatePayload = {
          username: username.trim(),
          password,
          password_confirm: passwordConfirm,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          employee: employeeId ? Number(employeeId) : null,
          role: roleId ? Number(roleId) : null,
          is_active: isActive,
          is_staff: isStaff,
          is_superuser: isSuperuser,
        };
        const created = await usersApi.create(payload);
        onSaved(created);
        onClose();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setGeneralError("Saqlashda xatolik yuz berdi");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: '580px', width: '92%' }}>
        <div className="modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEdit ? <UserCheck size={18} color="var(--brand-600)" /> : <UserPlus size={18} color="var(--brand-600)" />}
            <h3 className="modal__title">
              {isEdit ? `Foydalanuvchini tahrirlash: @${initialUser?.username}` : 'Yangi foydalanuvchi yaratish'}
            </h3>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Yopish" disabled={saving}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form" style={{ padding: '16px 20px' }}>
          {generalError && <div className="alert">{generalError}</div>}

          <div className="form-grid">
            {/* Username */}
            <div className="field">
              <label className="field__label">
                Foydalanuvchi logini (username) <span className="field__required">*</span>
              </label>
              <input
                type="text"
                className={`input ${fieldErrors.username ? 'input--error' : ''}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="masalan: j.aliyev"
                disabled={saving}
                autoFocus={!isEdit}
              />
              {fieldErrors.username && <span className="field__hint field__hint--error">{fieldErrors.username}</span>}
            </div>

            {/* Email */}
            <div className="field">
              <label className="field__label">Elektron pochta (Email)</label>
              <input
                type="email"
                className={`input ${fieldErrors.email ? 'input--error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="masalan: user@ung.uz"
                disabled={saving}
              />
              {fieldErrors.email && <span className="field__hint field__hint--error">{fieldErrors.email}</span>}
            </div>

            {/* Parollar (faqat yangi yaratilganda) */}
            {!isEdit && (
              <>
                <div className="field">
                  <label className="field__label">
                    Parol <span className="field__required">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`input ${fieldErrors.password ? 'input--error' : ''}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Kamida 6 belgi"
                      disabled={saving}
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
                  {fieldErrors.password && (
                    <span className="field__hint field__hint--error">{fieldErrors.password}</span>
                  )}
                </div>

                <div className="field">
                  <label className="field__label">
                    Parolni tasdiqlash <span className="field__required">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`input ${fieldErrors.password_confirm ? 'input--error' : ''}`}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Parolni qayta kiriting"
                    disabled={saving}
                  />
                  {fieldErrors.password_confirm && (
                    <span className="field__hint field__hint--error">{fieldErrors.password_confirm}</span>
                  )}
                </div>
              </>
            )}

            {/* Ism */}
            <div className="field">
              <label className="field__label">Ismi</label>
              <input
                type="text"
                className="input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ismni kiriting"
                disabled={saving}
              />
            </div>

            {/* Familiya */}
            <div className="field">
              <label className="field__label">Familiyasi</label>
              <input
                type="text"
                className="input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Familiyani kiriting"
                disabled={saving}
              />
            </div>

            {/* Rol tanlash */}
            <div className="field">
              <label className="field__label">Tizim roli</label>
              <div className="select-wrap">
                <select
                  className="input"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  disabled={saving || loadingOptions}
                >
                  <option value="">— Rol biriktirilmagan —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <span className="select-wrap__chevron">▾</span>
              </div>
              {fieldErrors.role && <span className="field__hint field__hint--error">{fieldErrors.role}</span>}
            </div>

            {/* Xodim tanlash */}
            <div className="field">
              <label className="field__label">Korxona xodimi (Employee)</label>
              <div className="select-wrap">
                <select
                  className="input"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={saving || loadingOptions}
                >
                  <option value="">— Xodim biriktirilmagan —</option>
                  {employees.map((emp) => (
                    <option key={emp.value} value={emp.value}>
                      {emp.label}
                    </option>
                  ))}
                </select>
                <span className="select-wrap__chevron">▾</span>
              </div>
              {fieldErrors.employee && <span className="field__hint field__hint--error">{fieldErrors.employee}</span>}
            </div>

            {/* Huquq bayroqchalari (Checkboxes) */}
            <div className="field form-grid__full" style={{ marginTop: '8px' }}>
              <label className="field__label" style={{ marginBottom: '4px' }}>
                Akkaunt holati va huquqlari
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={saving}
                  />
                  <span>Faol akkaunt (Active)</span>
                </label>

                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={isStaff}
                    onChange={(e) => setIsStaff(e.target.checked)}
                    disabled={saving}
                  />
                  <span>Tizim ma'muri (Staff)</span>
                </label>

                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={isSuperuser}
                    onChange={(e) => setIsSuperuser(e.target.checked)}
                    disabled={saving}
                  />
                  <span>Superuser (Cheksiz huquq)</span>
                </label>
              </div>
            </div>
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
                <span>{isEdit ? "O'zgarishlarni saqlash" : 'Foydalanuvchi yaratish'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
