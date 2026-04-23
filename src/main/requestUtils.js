function parseStructuredValue(rawValue) {
  if (typeof rawValue !== 'string') {
    return rawValue;
  }

  const trimmedValue = rawValue.trim();
  if (!trimmedValue) {
    return {};
  }

  try {
    return JSON.parse(trimmedValue);
  } catch (err) {
    return rawValue;
  }
}

function normalizeHeaderKeys(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeHeaderKeys);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        String(key).toLowerCase(),
        normalizeHeaderKeys(nestedValue),
      ])
    );
  }

  return value;
}

function flattenValue(value, prefix = '', result = {}) {
  if (value === null || value === undefined) {
    return result;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const nextPrefix = prefix ? `${prefix}.${index}` : String(index);
      flattenValue(item, nextPrefix, result);
    });
    return result;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, nestedValue]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      flattenValue(nestedValue, nextPrefix, result);
    });
    return result;
  }

  if (prefix) {
    result[prefix] = String(value);
  }

  return result;
}

function buildLiveRequestVariables(requestSource = {}) {
  const variables = {};

  [
    ['query', requestSource.query],
    ['headers', normalizeHeaderKeys(requestSource.headers)],
    ['body', requestSource.body],
    ['params', requestSource.params],
    ['request', requestSource.meta],
  ].forEach(([prefix, value]) => {
    flattenValue(value, '', variables);
    flattenValue(value, prefix, variables);
  });

  return variables;
}

function hasExpectedShape(value) {
  if (value === null || value === undefined) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return true;
}

function collectMissingFields(expectedValue, actualValue, path, missingFields) {
  if (expectedValue === null || expectedValue === undefined) {
    return;
  }

  if (Array.isArray(expectedValue)) {
    const actualArray = Array.isArray(actualValue) ? actualValue : [];

    if (expectedValue.length === 0) {
      if (!Array.isArray(actualValue)) {
        missingFields.push(path);
      }
      return;
    }

    expectedValue.forEach((item, index) => {
      collectMissingFields(item, actualArray[index], `${path}.${index}`, missingFields);
    });
    return;
  }

  if (typeof expectedValue === 'object') {
    const actualObject = actualValue && typeof actualValue === 'object' ? actualValue : null;

    Object.entries(expectedValue).forEach(([key, nestedExpectedValue]) => {
      const nextPath = path ? `${path}.${key}` : key;
      const nextActualValue = actualObject ? actualObject[key] : undefined;
      collectMissingFields(nestedExpectedValue, nextActualValue, nextPath, missingFields);
    });
    return;
  }

  const isMissing =
    actualValue === undefined ||
    actualValue === null ||
    (typeof actualValue === 'string' && actualValue.trim() === '');

  if (isMissing) {
    missingFields.push(path);
  }
}

function validateIncomingRequest(routeRequest = {}, requestSource = {}) {
  const missingFields = [];
  const expectedQuery = parseStructuredValue(routeRequest.query);
  const expectedHeaders = normalizeHeaderKeys(parseStructuredValue(routeRequest.headers));
  const expectedBody = parseStructuredValue(routeRequest.body);
  const actualHeaders = normalizeHeaderKeys(requestSource.headers || {});

  if (hasExpectedShape(expectedQuery)) {
    collectMissingFields(expectedQuery, requestSource.query || {}, 'query', missingFields);
  }

  if (hasExpectedShape(expectedHeaders)) {
    collectMissingFields(expectedHeaders, actualHeaders, 'headers', missingFields);
  }

  if (hasExpectedShape(expectedBody)) {
    collectMissingFields(expectedBody, requestSource.body || {}, 'body', missingFields);
  }

  return missingFields;
}

function interpolateTemplate(template, variables) {
  if (typeof template !== 'string') {
    return template;
  }

  return template.replace(/\$([a-zA-Z0-9_.-]+)/g, (match, variableName) => {
    if (Object.prototype.hasOwnProperty.call(variables, variableName)) {
      return variables[variableName];
    }
    return match;
  });
}

function findMissingTemplateVariables(template, variables = {}) {
  if (typeof template !== 'string') {
    return [];
  }

  const missingVariables = new Set();

  for (const match of template.matchAll(/\$([a-zA-Z0-9_.-]+)/g)) {
    const variableName = match[1];
    const value = variables[variableName];

    if (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      missingVariables.add(variableName);
    }
  }

  return Array.from(missingVariables);
}

function resolveResponseBody(routeBody, variables) {
  const rawBody = typeof routeBody === 'string' && routeBody.length > 0
    ? routeBody
    : '{"status": "success"}';
  const interpolatedBody = interpolateTemplate(rawBody, variables);

  try {
    return JSON.parse(interpolatedBody);
  } catch (err) {
    return interpolatedBody;
  }
}

const REQUEST_HELPERS_SCRIPT = [
  parseStructuredValue,
  normalizeHeaderKeys,
  flattenValue,
  buildLiveRequestVariables,
  hasExpectedShape,
  collectMissingFields,
  validateIncomingRequest,
  interpolateTemplate,
  findMissingTemplateVariables,
  resolveResponseBody,
].map(fn => fn.toString()).join('\n\n');

module.exports = {
  REQUEST_HELPERS_SCRIPT,
  buildLiveRequestVariables,
  findMissingTemplateVariables,
  resolveResponseBody,
  validateIncomingRequest,
};
