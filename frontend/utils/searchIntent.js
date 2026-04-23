const ROLE_FOCUS_KEYWORDS = [
  {
    value: 'Sales & GTM',
    keywords: ['sales', 'gtm', 'business development', 'bd', 'account executive', 'revenue', 'customer success'],
  },
  {
    value: 'Product',
    keywords: ['product', 'pm', 'product manager', 'designer', 'ux', 'research'],
  },
  {
    value: 'Tech',
    keywords: ['tech', 'technology', 'engineer', 'engineering', 'developer', 'frontend', 'backend', 'full stack', 'devops', 'data', 'qa', 'security', 'software'],
  },
  {
    value: 'Operations',
    keywords: ['operations', 'ops', 'supply chain', 'logistics', 'support', 'bpo', 'customer ops'],
  },
  {
    value: 'Marketing',
    keywords: ['marketing', 'growth', 'brand', 'seo', 'sem', 'content', 'performance marketing'],
  },
  {
    value: 'Finance',
    keywords: ['finance', 'accounting', 'audit', 'tax', 'fp&a', 'treasury'],
  },
  {
    value: 'HR',
    keywords: ['hr', 'human resources', 'talent', 'recruiter', 'recruitment', 'people'],
  },
];

const WORK_MODE_KEYWORDS = [
  { value: 'remote', keywords: ['remote', 'work from home', 'wfh'] },
  { value: 'hybrid', keywords: ['hybrid'] },
  { value: 'on_site', keywords: ['on-site', 'onsite', 'office', 'in office'] },
];

const OPPORTUNITY_TYPE_KEYWORDS = [
  { value: 'full_time', keywords: ['full-time', 'full time', 'permanent'] },
  { value: 'part_time', keywords: ['part-time', 'part time'] },
  { value: 'internship', keywords: ['internship', 'intern'] },
  { value: 'contract', keywords: ['contract'] },
  { value: 'project_based', keywords: ['project-based', 'project based', 'freelance', 'consulting'] },
];

const KNOWN_LOCATIONS = [
  'ahmedabad',
  'bangalore',
  'bengaluru',
  'chandigarh',
  'chennai',
  'delhi',
  'gurgaon',
  'gurugram',
  'hyderabad',
  'jaipur',
  'kolkata',
  'mumbai',
  'noida',
  'pune',
];

const ROLE_KEYWORD_TERMS = [
  'account executive',
  'backend',
  'business development',
  'content',
  'customer success',
  'data',
  'designer',
  'developer',
  'devops',
  'engineer',
  'finance',
  'frontend',
  'full stack',
  'growth',
  'hr',
  'marketing',
  'operations',
  'product',
  'qa',
  'recruiter',
  'sales',
  'security',
  'software',
];

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[,\u2013\u2014]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesPhrase(text, phrase) {
  return new RegExp(`(^|\\s)${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i').test(text);
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function experienceRangeForYears(years) {
  if (years <= 1) {
    return '0-1';
  }

  if (years <= 3) {
    return '1-3';
  }

  if (years <= 5) {
    return '3-5';
  }

  if (years <= 10) {
    return '5-10';
  }

  return '10+';
}

function parseExperience(text) {
  const rangeMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?|yoe|exp|experience)?\b/i);

  if (rangeMatch) {
    const max = Number(rangeMatch[2]);
    return Number.isFinite(max) ? experienceRangeForYears(max) : null;
  }

  const yearMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(\+)?\s*(?:years?|yrs?|yoe|exp|experience)\b/i)
    || text.match(/\b(?:with|having)\s+(\d+(?:\.\d+)?)\s*\+?\b/i);

  if (!yearMatch) {
    return null;
  }

  const years = Number(yearMatch[1]);
  if (!Number.isFinite(years)) {
    return null;
  }

  if (yearMatch[2] && years >= 10) {
    return '10+';
  }

  return experienceRangeForYears(years);
}

function parseLocations(text) {
  const locations = [];
  const prepositionMatch = text.match(/\b(?:in|near|around|at)\s+([a-z][a-z\s.-]{1,40})(?=\s+(?:remote|hybrid|onsite|on-site|with|for|and|\d|full|part|contract|intern|internship|sales|product|tech|developer|engineer|marketing|finance|hr|operations)\b|$)/i);

  if (prepositionMatch) {
    const candidate = prepositionMatch[1].replace(/\b(location|area|office)\b/gi, '').trim();

    if (candidate && !['remote', 'hybrid', 'office'].includes(candidate)) {
      locations.push(candidate);
    }
  }

  KNOWN_LOCATIONS.forEach((location) => {
    if (includesPhrase(text, location)) {
      locations.push(location);
    }
  });

  return unique(locations);
}

function removeMatchedIntentTerms(text, intent) {
  let cleaned = ` ${text} `;

  WORK_MODE_KEYWORDS.concat(OPPORTUNITY_TYPE_KEYWORDS).forEach((definition) => {
    definition.keywords.forEach((keyword) => {
      cleaned = cleaned.replace(new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), ' ');
    });
  });

  cleaned = cleaned
    .replace(/\b\d+(?:\.\d+)?\s*(?:-|to)\s*\d+(?:\.\d+)?\s*(?:years?|yrs?|yoe|exp|experience)?\b/gi, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*\+?\s*(?:years?|yrs?|yoe|exp|experience)\b/gi, ' ');

  intent.locations.forEach((location) => {
    cleaned = cleaned.replace(new RegExp(`\\b(?:in|near|around|at)?\\s*${location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), ' ');
  });

  return cleaned
    .replace(/\b(?:with|having|for|and|role|roles|opportunity|opportunities|job|jobs)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseSearchIntent(query) {
  const normalizedQuery = normalizeSearchText(query);
  const workModes = WORK_MODE_KEYWORDS
    .filter((definition) => definition.keywords.some((keyword) => includesPhrase(normalizedQuery, keyword)))
    .map((definition) => definition.value);
  const roleFocus = ROLE_FOCUS_KEYWORDS
    .filter((definition) => definition.keywords.some((keyword) => includesPhrase(normalizedQuery, keyword)))
    .map((definition) => definition.value);
  const opportunityTypes = OPPORTUNITY_TYPE_KEYWORDS
    .filter((definition) => definition.keywords.some((keyword) => includesPhrase(normalizedQuery, keyword)))
    .map((definition) => definition.value);
  const roleKeywords = ROLE_KEYWORD_TERMS.filter((keyword) => includesPhrase(normalizedQuery, keyword));
  const locations = parseLocations(normalizedQuery);
  const experienceRange = parseExperience(normalizedQuery);
  const intent = {
    cleanedQuery: '',
    experienceRange,
    locations,
    normalizedQuery,
    opportunityTypes,
    roleFocus: unique(roleFocus),
    roleKeywords: unique(roleKeywords),
    workModes: unique(workModes),
  };

  intent.cleanedQuery = removeMatchedIntentTerms(normalizedQuery, intent);
  return intent;
}
