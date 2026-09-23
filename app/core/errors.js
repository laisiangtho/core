/**
 * Validation primitives shared by every parser in app/core.
 *
 * Every structural problem raises a DataError that names the source file and
 * the JSON path, e.g. "tedim1932.json: $.book.1.chapter.3.verse.4.merge: ...".
 */

export class DataError extends Error {
  /**
   * @param {string} message
   * @param {{ source?: string, path?: string }} [where]
   */
  constructor(message, { source = 'data', path = '$' } = {}) {
    super(`${source}: ${path}: ${message}`);
    this.name = 'DataError';
    this.source = source;
    this.path = path;
  }
}

export function fail(source, path, message) {
  throw new DataError(message, { source, path });
}

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function expectObject(value, source, path) {
  if (!isPlainObject(value)) fail(source, path, `expected object, got ${describe(value)}`);
  return value;
}

export function expectArray(value, source, path) {
  if (!Array.isArray(value)) fail(source, path, `expected array, got ${describe(value)}`);
  return value;
}

export function expectString(value, source, path) {
  if (typeof value !== 'string') fail(source, path, `expected string, got ${describe(value)}`);
  return value;
}

/** Optional string: undefined and '' both mean "absent" and return undefined. */
export function optionalString(value, source, path) {
  if (value === undefined || value === '') return undefined;
  return expectString(value, source, path);
}

export function expectPositiveInt(value, source, path) {
  if (!Number.isInteger(value) || value < 1) fail(source, path, `expected positive integer, got ${describe(value)}`);
  return value;
}

/** Object keys that must be positive integers written as strings ("1", "42"). */
export function numericKey(key, source, path) {
  if (!/^[1-9]\d*$/.test(key)) fail(source, path, `expected numeric key, got ${JSON.stringify(key)}`);
  return Number(key);
}

/**
 * Versions appear as integers (3) and as digit strings ("1") in the published
 * data. Both are accepted; anything else is a structural error.
 */
export function normalizeVersion(value, source, path) {
  if (Number.isInteger(value) && value >= 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return fail(source, path, `expected version as integer or digit string, got ${describe(value)}`);
}

export function describe(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'string') return `string ${JSON.stringify(value.length > 40 ? value.slice(0, 40) + '…' : value)}`;
  return typeof value;
}
