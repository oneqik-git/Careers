'use client';

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
  const usesPreset = tone === 'preset';
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
  const queryPlaceholder = usesPreset ? 'Role / Company' : 'Product designer, Northstar Commerce...';
  const areaPlaceholder = usesPreset ? 'Area' : 'Hyderabad, Bengaluru, Remote...';
  const normalizedExperienceOptions = usesPreset
    ? experienceOptions.map((option) => (option.value === '' ? { ...option, label: 'Experience' } : option))
    : experienceOptions;

  return (
    <form className={`oq-search-strip ${className}`.trim()} onSubmit={onSubmit}>
      <div className={gridClassName}>
        <label className={fieldWrapperClassName}>
          <span className={labelClassName}>
            Role / Company
          </span>
          <input
            className={inputClassName}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={queryPlaceholder}
            value={query}
          />
        </label>

        <label className={fieldWrapperClassName}>
          <span className={labelClassName}>
            Experience
          </span>
          <select className={selectClassName} onChange={(event) => onExperienceChange(event.target.value)} value={experience}>
            {normalizedExperienceOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={fieldWrapperClassName}>
          <span className={labelClassName}>
            Area
          </span>
          <input
            className={inputClassName}
            onChange={(event) => onAreaChange(event.target.value)}
            placeholder={areaPlaceholder}
            value={area}
          />
        </label>

        <button className={buttonClassName} type="submit">
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}
