import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { UngLogo } from '../components/common/UngLogo';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/login.css';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);

  // Validation & alerts
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Validate form
  const validate = (): boolean => {
    const errs: { username?: string; password?: string } = {};

    if (!username.trim()) {
      errs.username = t.errors.usernameRequired;
    } else if (username.trim().length < 3) {
      errs.username = t.errors.usernameMinLength;
    }

    if (!password) {
      errs.password = t.errors.passwordRequired;
    } else if (password.length < 6) {
      errs.password = t.errors.passwordMinLength;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login({ username, password, rememberMe: true });
      if (!res.success) {
        setGeneralError(res.error || t.errors.invalidCredentials);
      }
    } catch {
      setGeneralError(t.errors.networkError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // CapsLock listener
  const handleKeyActivity = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  return (
    <div className="login-layout">
      {/* --------------------------------------------------------------------
          LEFT BANNER (~41.5% Width, Deep Blue with Vector Rings & Glow)
          -------------------------------------------------------------------- */}
      <section className="login-banner" aria-label="O'zbekneftgaz AJ axborot paneli">
        {/* Vector Background Elements */}
        <div className="banner-glow-top" />
        <div className="banner-glow-bottom" />
        <div className="banner-ring-inner" />
        <div className="banner-ring-outer" />

        {/* Top Logo */}
        <div className="banner-header">
          <UngLogo size="sm" theme="banner" />
        </div>

        {/* Center Content */}
        <div className="banner-center">
          <h1 className="banner-title">{t.systemTitle}</h1>
          <p className="banner-subtitle">{t.systemSub}</p>
        </div>

        {/* Bottom Security & Department Tag */}
        <div className="banner-footer">
          <ShieldCheck size={16} className="banner-footer-icon" />
          <span>{t.copyright}</span>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          RIGHT MAIN PANEL (Pure White with Centered Form)
          -------------------------------------------------------------------- */}
      <main className="login-main">
        {/* Top-Right Language Switcher */}
        <div className="login-top-right">
          <LanguageSwitcher currentLang={language} onLanguageChange={setLanguage} />
        </div>

        {/* Bottom-Right System Version */}
        <div className="login-bottom-right">
          <span>v1.4.2</span>
        </div>

        {/* Centered Form */}
        <div className="login-form-wrapper">
          <h2 className="login-title">{t.loginCardTitle}</h2>
          <p className="login-subtitle">{t.loginCardSubtitle}</p>

          {/* General Error Banner */}
          {generalError && (
            <div className="login-error-alert" role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>{generalError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Field 1: Login */}
            <div className="field-group">
              <label htmlFor="login-username" className="field-label">
                {t.usernameLabel}
              </label>
              <div
                className={`input-wrapper ${focusedField === 'username' ? 'has-focus' : ''} ${
                  errors.username ? 'has-error' : ''
                }`}
              >
                <div className="input-icon">
                  <UserIcon size={18} />
                </div>
                <input
                  id="login-username"
                  type="text"
                  className="input-text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                    if (generalError) setGeneralError(null);
                  }}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t.usernamePlaceholder}
                  autoComplete="username"
                  disabled={isSubmitting}
                />
              </div>
              {errors.username && (
                <div className="field-error">
                  <AlertCircle size={13} />
                  <span>{errors.username}</span>
                </div>
              )}
            </div>

            {/* Field 2: Parol */}
            <div className="field-group">
              <label htmlFor="login-password" className="field-label">
                {t.passwordLabel}
              </label>
              <div
                className={`input-wrapper ${focusedField === 'password' ? 'has-focus' : ''} ${
                  errors.password ? 'has-error' : ''
                }`}
              >
                <div className="input-icon">
                  <Lock size={18} />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-text"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    if (generalError) setGeneralError(null);
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={handleKeyActivity}
                  onKeyUp={handleKeyActivity}
                  placeholder={t.passwordPlaceholder}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="input-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                  aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Caps Lock Alert (Figma Frame L-2) */}
              {isCapsLockOn && (
                <div className="caps-lock-alert">
                  <AlertTriangle size={14} className="caps-lock-icon" />
                  <span>{t.capsLockWarning}</span>
                </div>
              )}

              {errors.password && (
                <div className="field-error">
                  <AlertCircle size={13} />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{t.loggingIn}</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>{t.loginButton}</span>
                </>
              )}
            </button>

            {/* Helper Text below button */}
            <div className="helper-contact">
              <span>Hisobingiz yo'qmi? </span>
              <button
                type="button"
                className="helper-contact-btn"
                onClick={() => setIsForgotModalOpen(true)}
              >
                Tizim administratoriga murojaat qiling.
              </button>
            </div>
          </form>

        </div>
      </main>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        t={t.forgotModal}
      />
    </div>
  );
};
