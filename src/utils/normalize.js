function parseJsonValue(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback !== null ? fallback : value;
  }
}

function parseJsonArray(value) {
  const parsed = parseJsonValue(value, []);
  return Array.isArray(parsed) ? parsed : [];
}

function splitCsv(value) {
  if (!value || typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCareerScore(score) {
  if (!score) {
    return null;
  }

  if (score.total_score !== undefined) {
    return {
      ...score,
      total_score: score.total_score,
      skill_impact_pts: score.skill_impact_pts ?? 0,
      credibility_pts: score.credibility_pts ?? 0,
      engagement_pts: score.engagement_pts ?? 0,
      values_pts: score.values_pts ?? 0,
      identity_pts: score.identity_pts ?? 0,
      identity_verified: Boolean(score.identity_verified),
      identity_cap_active: Boolean(score.identity_cap_active),
    };
  }

  return {
    total_score: score.total ?? 0,
    band: score.band ?? null,
    skill_impact_pts: score.skillPts ?? 0,
    credibility_pts: score.credPts ?? 0,
    engagement_pts: score.engPts ?? 0,
    values_pts: score.valPts ?? 0,
    identity_pts: score.idPts ?? 0,
    identity_verified: !score.identityCapActive,
    identity_cap_active: Boolean(score.identityCapActive),
  };
}

function normalizeCandidate(candidate) {
  if (!candidate) {
    return null;
  }

  return {
    ...candidate,
    domains: parseJsonArray(candidate.domains),
    preferred_locations: parseJsonArray(candidate.preferred_locations),
    location_info: {
      formatted: candidate.location ?? null,
      city: candidate.city ?? null,
      state: candidate.state ?? null,
      country: candidate.country ?? null,
      latitude: candidate.latitude ?? null,
      longitude: candidate.longitude ?? null,
      source: candidate.location_source ?? null,
      confidence: candidate.location_confidence ?? null,
    },
    preferred_location_info: {
      formatted: candidate.preferred_location_text ?? null,
      city: candidate.preferred_location_city ?? null,
      state: candidate.preferred_location_state ?? null,
      country: candidate.preferred_location_country ?? null,
      latitude: candidate.preferred_location_latitude ?? null,
      longitude: candidate.preferred_location_longitude ?? null,
      radius_km: candidate.preferred_location_radius_km ?? null,
      source: candidate.preferred_location_source ?? null,
    },
  };
}

function normalizeWorkExperience(experience) {
  return {
    ...experience,
    achievements: parseJsonArray(experience.achievements),
    performance: parseJsonArray(experience.performance),
  };
}

function normalizeJob(job) {
  if (!job) {
    return null;
  }

  return {
    ...job,
    required_skills: parseJsonArray(job.required_skills),
    preferred_skills: parseJsonArray(job.preferred_skills),
    location_info: {
      formatted: job.location_formatted ?? job.location ?? null,
      city: job.location_city ?? null,
      state: job.location_state ?? null,
      country: job.location_country ?? null,
      latitude: job.location_latitude ?? null,
      longitude: job.location_longitude ?? null,
      source: job.location_source ?? null,
      confidence: job.location_confidence ?? null,
      place_id: job.location_place_id ?? null,
      radius_km: job.location_radius_km ?? null,
      distance_km: job.distance_km ?? null,
    },
  };
}

function normalizeCompany(company) {
  if (!company) {
    return null;
  }

  return {
    ...company,
    global_offices: parseJsonArray(company.global_offices),
    location_info: {
      formatted: company.location_formatted ?? company.headquarters ?? null,
      city: company.location_city ?? null,
      state: company.location_state ?? null,
      country: company.location_country ?? null,
      latitude: company.location_latitude ?? null,
      longitude: company.location_longitude ?? null,
      source: company.location_source ?? null,
      confidence: company.location_confidence ?? null,
      place_id: company.location_place_id ?? null,
    },
  };
}

function normalizeCareerLadder(ladder) {
  return {
    ...ladder,
    steps: parseJsonArray(ladder.steps),
  };
}

module.exports = {
  normalizeCandidate,
  normalizeCareerLadder,
  normalizeCareerScore,
  normalizeCompany,
  normalizeJob,
  normalizeWorkExperience,
  parseJsonArray,
  parseJsonValue,
  splitCsv,
};
