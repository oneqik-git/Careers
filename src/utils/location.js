const DEFAULT_HOME_RADIUS_KM = 5;
const MAX_JOB_SEARCH_RADIUS_KM = 20;

function trimOrNull(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text || null;
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeConfidence(value) {
  const confidence = numberOrNull(value);

  if (confidence === null) {
    return null;
  }

  return Math.max(0, Math.min(1, confidence));
}

function normalizeRadiusKm(value, { fallback = DEFAULT_HOME_RADIUS_KM, max = MAX_JOB_SEARCH_RADIUS_KM } = {}) {
  const radius = numberOrNull(value);
  const effectiveRadius = radius === null ? fallback : radius;
  return Math.max(0.5, Math.min(max, effectiveRadius));
}

function hasCoordinates(record, prefix = 'location') {
  const latitude = numberOrNull(record?.[`${prefix}_latitude`] ?? record?.latitude);
  const longitude = numberOrNull(record?.[`${prefix}_longitude`] ?? record?.longitude);
  return latitude !== null && longitude !== null;
}

function hasUsableCompanyLocation(company) {
  if (!company) {
    return false;
  }

  const hasFormattedText = Boolean(trimOrNull(company.location_formatted) || trimOrNull(company.headquarters));
  const hasRegion = Boolean(trimOrNull(company.location_city) && trimOrNull(company.location_country));

  return hasFormattedText && (hasRegion || hasCoordinates(company));
}

function buildLocationFields(input = {}, { prefix = 'location', fallbackText = null, source = 'manual' } = {}) {
  const formatted = trimOrNull(input[`${prefix}_formatted`] ?? input.location_formatted ?? input.formatted_location ?? input.location ?? fallbackText);
  const city = trimOrNull(input[`${prefix}_city`] ?? input.city);
  const state = trimOrNull(input[`${prefix}_state`] ?? input.state);
  const country = trimOrNull(input[`${prefix}_country`] ?? input.country);

  return {
    formatted,
    city,
    state,
    country,
    latitude: numberOrNull(input[`${prefix}_latitude`] ?? input.latitude),
    longitude: numberOrNull(input[`${prefix}_longitude`] ?? input.longitude),
    source: trimOrNull(input[`${prefix}_source`] ?? input.location_source) || source,
    confidence: normalizeConfidence(input[`${prefix}_confidence`] ?? input.location_confidence),
    placeId: trimOrNull(input[`${prefix}_place_id`] ?? input.location_place_id),
  };
}

function buildJobLocationFields(body = {}, company = {}) {
  const workMode = body.work_mode || 'on_site';

  if (workMode === 'remote') {
    return {
      formatted: trimOrNull(body.location_formatted ?? body.location) || 'Remote - India',
      city: null,
      state: null,
      country: trimOrNull(body.location_country) || 'India',
      latitude: null,
      longitude: null,
      source: 'remote',
      confidence: null,
      placeId: null,
      radiusKm: null,
    };
  }

  const override = buildLocationFields(body, {
    fallbackText: body.location,
    source: 'role_override',
  });
  const hasOverride = Boolean(override.formatted || override.city || (override.latitude !== null && override.longitude !== null));

  if (hasOverride) {
    return {
      ...override,
      source: override.source || 'role_override',
      radiusKm: normalizeRadiusKm(body.location_radius_km, { fallback: DEFAULT_HOME_RADIUS_KM }),
    };
  }

  return {
    formatted: trimOrNull(company.location_formatted) || trimOrNull(company.headquarters),
    city: trimOrNull(company.location_city),
    state: trimOrNull(company.location_state),
    country: trimOrNull(company.location_country),
    latitude: numberOrNull(company.location_latitude),
    longitude: numberOrNull(company.location_longitude),
    source: 'company_default',
    confidence: normalizeConfidence(company.location_confidence),
    placeId: trimOrNull(company.location_place_id),
    radiusKm: DEFAULT_HOME_RADIUS_KM,
  };
}

function buildDistanceExpression(lat, lng, latColumn = 'jp.location_latitude', lngColumn = 'jp.location_longitude') {
  return `(6371 * ACOS(LEAST(1, GREATEST(-1, COS(RADIANS(?)) * COS(RADIANS(${latColumn})) * COS(RADIANS(${lngColumn}) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(${latColumn}))))))`;
}

module.exports = {
  DEFAULT_HOME_RADIUS_KM,
  MAX_JOB_SEARCH_RADIUS_KM,
  buildDistanceExpression,
  buildJobLocationFields,
  buildLocationFields,
  hasCoordinates,
  hasUsableCompanyLocation,
  normalizeRadiusKm,
  numberOrNull,
  trimOrNull,
};
