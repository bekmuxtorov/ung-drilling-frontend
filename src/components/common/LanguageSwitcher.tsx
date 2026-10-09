import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { SupportedLanguage } from '../../types/auth';
import { LOCALES } from '../../i18n';

interface LanguageSwitcherProps {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  variant?: 'light' | 'dark' | 'transparent';
  className?: string;
}

const languages = LOCALES.map((l) => ({ code: l.code, name: l.name, label: l.short }));

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLang,
  onLanguageChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption = languages.find((l) => l.code === currentLang) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`lang-switcher-wrap ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        userSelect: 'none',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#334155',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#CBD5E1';
          e.currentTarget.style.backgroundColor = '#F8FAFC';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#E2E8F0';
          e.currentTarget.style.backgroundColor = '#FFFFFF';
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{currentOption.label}</span>
        <ChevronDown
          size={14}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            color: '#64748B',
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 100,
            minWidth: '140px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E2E8F0',
            padding: '4px',
          }}
          role="listbox"
        >
          {languages.map((lang) => {
            const isSelected = lang.code === currentLang;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  onLanguageChange(lang.code);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? '#1573CD' : '#334155',
                  backgroundColor: isSelected ? '#F0F7FF' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
                role="option"
                aria-selected={isSelected}
              >
                <span>{lang.name}</span>
                {isSelected && <Check size={14} color="#1573CD" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
