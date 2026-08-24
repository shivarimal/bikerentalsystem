import { useState, useRef, useEffect } from 'react';

interface SearchableSelectProps<T extends string | number> {
  options: T[];
  value: T | '' | null;
  onChange: (val: T) => void;
  placeholder?: string;
  label?: string;
  highlightOptions?: T[];
  disabled?: boolean;
  formatLabel?: (val: T) => string;
}

export function SearchableSelect<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = 'Select Option...',
  label,
  highlightOptions,
  disabled = false,
  formatLabel = (v) => String(v),
}: SearchableSelectProps<T>): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter((opt) =>
    formatLabel(opt).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="searchable-select-container position-relative mb-3" ref={dropdownRef}>
      {label && <label className="form-label fw-semibold small mb-1">{label}</label>}
      <button
        type="button"
        className={`form-select text-start d-flex align-items-center justify-content-between ${disabled ? 'disabled' : ''
          }`}
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#ced4da',
          minHeight: '42px',
          borderRadius: '8px',
          boxShadow: isOpen ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={value ? 'text-dark fw-medium' : 'text-muted'}>
          {value !== '' && value !== null && value !== undefined
            ? formatLabel(value as T)
            : placeholder}
        </span>
      </button>

      {isOpen && (
        <div
          className="dropdown-menu show w-100 p-2 shadow-lg border-0 mt-1"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 1050,
            borderRadius: '10px',
            maxHeight: '260px',
            overflowY: 'auto',
            background: '#ffffff',
          }}
        >
          <div className="px-1 pb-2 mb-2 border-bottom">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="🔍 Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {filteredOptions.length === 0 ? (
            <div className="text-muted text-center py-2 small">No matching options</div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = value === option;
              const isRecommended = highlightOptions ? highlightOptions.includes(option) : true;

              return (
                <button
                  key={String(option)}
                  type="button"
                  className={`dropdown-item d-flex align-items-center justify-content-between rounded py-2 px-3 my-1 border-0 text-start ${isSelected ? 'active bg-primary text-white fw-bold' : ''
                    } ${!isRecommended && !isSelected ? 'text-muted opacity-75' : ''}`}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  style={{
                    fontSize: '0.9rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{formatLabel(option)}</span>
                  {isRecommended && highlightOptions && !isSelected && (
                    <span className="badge bg-light text-primary border border-primary-subtle ms-2">
                      Available
                    </span>
                  )}
                  {isSelected && <span className="ms-2">✓</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
