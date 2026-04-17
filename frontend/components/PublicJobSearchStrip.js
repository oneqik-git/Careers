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
}) {
  return (
    <form className={`oq-search-strip ${className}`.trim()} onSubmit={onSubmit}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <label className="block">
          <span className="field-label mb-2 block">
            Role / Company
          </span>
          <input
            className="text-field"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Product designer, Northstar Commerce..."
            value={query}
          />
        </label>

        <label className="block">
          <span className="field-label mb-2 block">
            Experience
          </span>
          <select className="text-field" onChange={(event) => onExperienceChange(event.target.value)} value={experience}>
            {experienceOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="field-label mb-2 block">
            Area
          </span>
          <input
            className="text-field"
            onChange={(event) => onAreaChange(event.target.value)}
            placeholder="Hyderabad, Bengaluru, Remote..."
            value={area}
          />
        </label>

        <button className="btn-primary min-h-[52px] w-full lg:min-w-[156px]" type="submit">
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}
