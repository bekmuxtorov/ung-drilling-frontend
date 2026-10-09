import React, { useState } from 'react';
import { X, KeyRound, Mail, CheckCircle2, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import type { Translations } from '../../utils/i18n';
import { tr } from '../../i18n';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translations['forgotModal'];
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  t,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<'input' | 'code' | 'success'>('input');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError(tr('Iltimos, login, elektron pochta yoki telefon raqamingizni kiriting'));
      return;
    }
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setStep('code');
    }, 1200);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length < 4) {
      setError(tr("Tasdiqlash kodini to'liq kiriting (masalan: 1234)"));
      return;
    }
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setStep('success');
    }, 1000);
  };

  const resetAndClose = () => {
    setStep('input');
    setIdentifier('');
    setCode('');
    setError('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        padding: '16px',
        animation: 'fadeIn 200ms ease-out',
      }}
      onClick={resetAndClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--white)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-2xl)',
          border: '1px solid var(--slate-200)',
          overflow: 'hidden',
          animation: 'fadeIn 250ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--slate-100)',
            backgroundColor: 'var(--slate-50)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--ung-primary-50)',
                color: 'var(--ung-primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--slate-900)' }}>
                {t.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
                {tr('Xavfsiz hisobni qayta tiklash')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--slate-400)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--slate-200)';
              e.currentTarget.style.color = 'var(--slate-700)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--slate-400)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {step === 'input' && (
            <form onSubmit={handleSendCode}>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--slate-600)',
                  lineHeight: '1.6',
                  marginBottom: '18px',
                }}
              >
                {t.desc}
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--slate-700)',
                    marginBottom: '6px',
                  }}
                >
                  {t.inputLabel}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={t.inputPlaceholder}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      borderRadius: 'var(--radius-md)',
                      border: error ? '1.5px solid var(--ung-danger-500)' : '1px solid var(--slate-300)',
                      backgroundColor: 'var(--white)',
                      fontSize: '14px',
                      color: 'var(--slate-800)',
                      transition: 'border-color var(--transition-fast)',
                    }}
                  />
                  <Mail
                    size={17}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--slate-400)',
                    }}
                  />
                </div>
                {error && (
                  <p style={{ fontSize: '12px', color: 'var(--ung-danger-500)', marginTop: '5px' }}>
                    {error}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={resetAndClose}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--slate-300)',
                    color: 'var(--slate-700)',
                    fontWeight: 600,
                    fontSize: '14px',
                    backgroundColor: 'var(--white)',
                  }}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    flex: 2,
                    padding: '11px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--ung-primary-600)',
                    color: 'var(--white)',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: 'var(--shadow-sm)',
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t.sending}</span>
                    </>
                  ) : (
                    <>
                      <span>{t.sendCode}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode}>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--ung-emerald-50)',
                  border: '1px solid #A7F3D0',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <ShieldCheck size={20} color="var(--ung-emerald-500)" />
                <p style={{ fontSize: '13px', color: '#065F46' }}>
                  {tr('Tasdiqlash kodi')}{' '}<strong>{identifier}</strong> {tr('ga yuborildi. (Test uchun:')}{' '}<strong>7788</strong>)
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--slate-700)',
                    marginBottom: '6px',
                  }}
                >
                  {tr('SMS / E-pochta tasdiqlash kodi')}</label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="7788"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px',
                    letterSpacing: '6px',
                    textAlign: 'center',
                    borderRadius: 'var(--radius-md)',
                    border: error ? '1.5px solid var(--ung-danger-500)' : '1px solid var(--slate-300)',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'var(--slate-900)',
                  }}
                />
                {error && (
                  <p style={{ fontSize: '12px', color: 'var(--ung-danger-500)', marginTop: '5px' }}>
                    {error}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--slate-300)',
                    color: 'var(--slate-700)',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  {tr('Ortga')}</button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    flex: 2,
                    padding: '11px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--ung-primary-600)',
                    color: 'var(--white)',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    tr('Tasdiqlash va davom etish')
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--ung-emerald-50)',
                  color: 'var(--ung-emerald-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-900)' }}>
                {tr('Havola yuborildi!')}</h4>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--slate-600)',
                  margin: '8px 0 24px',
                  lineHeight: 1.5,
                }}
              >
                {tr("Yangi parolni o'rnatish havolasi ko'rsatilgan kontaktga yuborildi. Iltimos, pochtangizni yoki SMS xabarnomani tekshiring.")}</p>
              <button
                type="button"
                onClick={resetAndClose}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--ung-primary-600)',
                  color: 'var(--white)',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                {tr('Tizimga kirish sahifasiga qaytish')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
