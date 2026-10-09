import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, X, Check, Loader2, Plus } from 'lucide-react';
import { tr } from '../../i18n';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  loading?: boolean;
  id?: string;
  onCreate?: (searchQuery: string) => void;
  createLabel?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Tanlang...',
  disabled = false,
  error = false,
  loading = false,
  id,
  onCreate,
  createLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((o) => String(o.value) === String(value));

  // Determine placement (open up or down)
  const calculatePlacement = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 250 && rect.top > 250) {
        setPlacement('top');
      } else {
        setPlacement('bottom');
      }
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;
    if (!isOpen) {
      calculatePlacement();
      setSearchQuery('');
    }
    setIsOpen((prev) => !prev);
  };

  // Close when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      // Auto-focus search input
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange('');
  };

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(searchQuery.toLowerCase().trim()),
  );

  return (
    <div ref={containerRef} className="searchable-select" id={id}>
      <button
        ref={triggerRef}
        type="button"
        className={`searchable-select__trigger ${isOpen ? 'is-open' : ''} ${error ? 'searchable-select__trigger--error' : ''}`}
        onClick={handleToggle}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className={`searchable-select__value ${!selectedOption ? 'searchable-select__placeholder' : ''}`}
        >
          {loading ? 'Yuklanmoqda…' : selectedOption ? selectedOption.label : placeholder}
        </span>

        <span className="searchable-select__actions">
          {selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              className="searchable-select__clear-btn"
              onClick={handleClear}
              title={tr('Tozalash')}
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`searchable-select__chevron ${isOpen ? 'is-open' : ''}`}
          />
        </span>
      </button>

      {isOpen && (
        <div
          className={`searchable-select__dropdown searchable-select__dropdown--${placement}`}
          role="listbox"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <div className="searchable-select__search-wrap">
            <Search size={14} className="searchable-select__search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="searchable-select__search-input"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredOptions.length > 0) {
                    handleSelect(filteredOptions[0].value);
                  } else if (onCreate && searchQuery.trim()) {
                    onCreate(searchQuery);
                    setIsOpen(false);
                  }
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="searchable-select__search-clear"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                }}
                title={tr('Tozalash')}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* List of Options */}
          <div className="searchable-select__list">
            {loading ? (
              <div className="searchable-select__loading">
                <Loader2 size={14} className="animate-spin text-brand" />
                <span>{tr('Yuklanmoqda…')}</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="searchable-select__empty">
                <span className="searchable-select__empty-text">
                  {searchQuery ? tr('"{0}" bo‘yicha topilmadi', searchQuery) : tr('Ma’lumot mavjud emas')}
                </span>
                {onCreate && (
                  <button
                    type="button"
                    className="searchable-select__add-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onCreate(searchQuery);
                      setIsOpen(false);
                    }}
                  >
                    <Plus size={13} />
                    <span>
                      {searchQuery.trim()
                        ? tr('"{0}" ni qo‘shish', searchQuery.trim())
                        : (createLabel || tr('Yangi qo‘shish'))}
                    </span>
                  </button>
                )}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    className={`searchable-select__item ${isSelected ? 'is-selected' : ''}`}
                    onClick={(e) => handleSelect(opt.value, e)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={14} className="searchable-select__item-check" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Optional Footer Add button if options exist */}
          {onCreate && filteredOptions.length > 0 && (
            <div className="searchable-select__footer">
              <button
                type="button"
                className="searchable-select__footer-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onCreate(searchQuery);
                  setIsOpen(false);
                }}
              >
                <Plus size={13} />
                <span>{createLabel || tr('Yangi qo‘shish')}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
