'use client';

import { useState } from 'react';

const experienceOptions = [
  { value: '', label: 'Any experience' },
  { value: '0-2', label: '0-2 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '6+', label: '6+ years' },
];

export default function PublicJobSearchStrip({
  area,
  buttonLabel = 'Search',
  className = '',
  experience,
  onAreaChange,
  onExperienceChange,
  onQueryChange,
  onSubmit,
  query,
  tone = 'default',
}) {
  const [activeField, setActiveField] = useState('');
  const usesPreset = tone === 'preset';
  const usesInteractiveMobilePreset = usesPreset;
  const labelClassName = usesPreset
    ? 'home-search-label-style-2'
    : 'mb-2 block text-[0.7rem] font-light uppercase tracking-[0.18em] text-[var(--graytexts)]';
  const inputClassName = usesPreset ? 'home-search-input-style-2' : 'oq-input';
  const selectClassName = usesPreset
    ? `home-search-select-style-2 ${experience ? '' : 'select-placeholder-style-2'}`.trim()
    : 'oq-select';
  const buttonClassName = usesPreset
    ? 'home-search-button-style-2'
    : 'oq-button-primary min-h-[52px] w-full lg:ml-2 lg:min-w-[156px]';
  const gridClassName = usesPreset
    ? 'home-search-grid-style-2'
    : 'grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end lg:gap-x-5';
  const fieldWrapperClassName = usesPreset ? 'home-search-field-shell-style-2' : 'block';
  const queryPlaceholder = usesPreset
    ? activeField === 'query'
      ? 'Role / what you want'
      : 'Role'
    : 'Product designer, Northstar Commerce...';
  const areaPlaceholder = usesPreset
    ? activeField === 'area'
      ? 'Location'
      : 'Location'
    : 'Hyderabad, Bengaluru, Remote...';
  const normalizedExperienceOptions = usesPreset
    ? experienceOptions.map((option) => (option.value === '' ? { ...option, label: 'Experience' } : option))
    : experienceOptions;
  const searchButtonClassName = usesInteractiveMobilePreset
    ? `${buttonClassName} home-search-mobile-button`.trim()
    : buttonClassName;

  function engageField(fieldKey) {
    if (!usesInteractiveMobilePreset) {
      return;
    }

    setActiveField(fieldKey);
  }

  function renderFieldShell(fieldKey, content) {
    const isCollapsed = usesInteractiveMobilePreset && activeField && activeField !== fieldKey;

    return (
      <label
        className={`${fieldWrapperClassName} ${usesInteractiveMobilePreset ? 'home-search-mobile-field' : ''}`.trim()}
        data-collapsed={isCollapsed ? 'true' : 'false'}
        data-field={fieldKey}
      >
        {content}
      </label>
    );
  }

  return (
    <form className={`oq-search-strip ${className}`.trim()} onSubmit={onSubmit}>
      <div
        className={`${gridClassName} ${usesInteractiveMobilePreset ? 'home-search-mobile-grid' : ''}`.trim()}
        data-active-field={usesInteractiveMobilePreset ? activeField : undefined}
      >
        {renderFieldShell('query', (
          <>
            <span className={labelClassName}>
              Role / what you want
            </span>
            <input
              className={inputClassName}
              onClick={() => engageField('query')}
              onChange={(event) => onQueryChange(event.target.value)}
              onFocus={() => engageField('query')}
              placeholder={queryPlaceholder}
              value={query}
            />
          </>
        ))}

        {renderFieldShell('experience', (
          <>
            <span className={labelClassName}>
              Experience
            </span>
            <select
              className={selectClassName}
              onChange={(event) => onExperienceChange(event.target.value)}
              onClick={() => engageField('experience')}
              onFocus={() => engageField('experience')}
              value={experience}
            >
              {normalizedExperienceOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        ))}

        {renderFieldShell('area', (
          <>
            <span className={labelClassName}>
              Location
            </span>
            <input
              className={inputClassName}
              onClick={() => engageField('area')}
              onChange={(event) => onAreaChange(event.target.value)}
              onFocus={() => engageField('area')}
              placeholder={areaPlaceholder}
              value={area}
            />
          </>
        ))}

        <button
          className={searchButtonClassName}
          type="submit"
        >
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}
