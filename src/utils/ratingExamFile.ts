/**
 * @file Rating-exam rubrics as JSON files.
 *
 * It exports two functions:
 *   rubricToJSON(values: Partial<RatingExamValues>): string
 *   rubricFromJSON(source: string, milestoneCodes: Set<string>): ReadResult
 *
 * Files may be incomplete, but values that are present must be valid.
 */

/** An indicator (i.e. rubric item). */
interface IndicatorValues {
  name: string;
  type: 'theory' | 'practical' | null;
  category: string;
  deduction: number | null;
  failureThreshold: number | null;
  isActive: boolean;
}

/** A rubric, as written to and read from JSON  */
interface RatingExamValues {
  name: string;
  certCode: string;
  isActive: boolean;
  indicators: IndicatorValues[];
}

/** The rubric read from a file, or a message naming the first problem. */
type ReadResult =
  | { ok: true; value: RatingExamValues }
  | { ok: false; error: string };

/** A path leading to the value in error (for reporting). */
type Path = (string | number)[];

/** Thrown by the various checks below */
class Invalid extends Error {
  readonly path: Path;
  constructor(path: Path, message: string) {
    super(message);
    this.path = path;
  }
}

/** Check that `value` is an object with no keys other than the given ones. */
function object(value: unknown, keys: readonly string[], path: Path) {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Invalid(path, 'Expected an object.');

  const record = value as Record<string, unknown>;
  const unknown = Object.keys(record).find((key) => !keys.includes(key));
  if (unknown) throw new Invalid([...path, unknown], 'Unknown field.');

  return record;
}

/** Text of at most `max` characters; missing or `null` reads as `''`. */
function text(value: unknown, max: number, path: Path) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new Invalid(path, 'Enter some text.');
  if (value.length > max)
    throw new Invalid(path, `Use ${max} characters or fewer.`);
  return value;
}

/** An integer from 1 to `max`, or `null` if missing. */
function integer(value: unknown, max: number, path: Path) {
  if (value === undefined || value === null) return null;
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > max
  )
    throw new Invalid(path, `Enter a whole number from 1 to ${max}.`);
  return value;
}

/**
 * `true` or `false`. A missing value reads as `false`, because a checkbox
 * cannot be blank.
 */
function boolean(value: unknown, path: Path) {
  if (value === undefined || value === null) return false;
  if (typeof value !== 'boolean')
    throw new Invalid(path, 'Enter true or false.');
  return value;
}

/** Check one rubric item from the file. */
function indicator(value: unknown, path: Path): IndicatorValues {
  const row = object(
    value,
    ['name', 'type', 'category', 'deduction', 'failureThreshold', 'isActive'],
    path,
  );
  const type = row.type ?? null;
  if (type !== null && type !== 'theory' && type !== 'practical')
    throw new Invalid([...path, 'type'], 'Enter "theory" or "practical".');
  return {
    name: text(row.name, 400, [...path, 'name']),
    type,
    category: text(row.category, 50, [...path, 'category']),
    deduction: integer(row.deduction, 500, [...path, 'deduction']),
    failureThreshold: integer(row.failureThreshold, 100, [
      ...path,
      'failureThreshold',
    ]),
    isActive: boolean(row.isActive, [...path, 'isActive']),
  };
}

/** Check a parsed file and return the rubric it describes. */
function rubric(value: unknown, milestoneCodes: Set<string>): RatingExamValues {
  const file = object(
    value,
    ['name', 'certCode', 'isActive', 'indicators'],
    [],
  );
  const name = text(file.name, 100, ['name']);
  if (name.includes('\n'))
    throw new Invalid(['name'], 'Enter a single line of text.');
  const certCode = text(file.certCode, 20, ['certCode']).trim();
  if (certCode && !milestoneCodes.has(certCode))
    throw new Invalid(['certCode'], `Unknown milestone “${certCode}”.`);
  const isActive = boolean(file.isActive, ['isActive']);
  const items = file.indicators ?? [];
  if (!Array.isArray(items))
    throw new Invalid(['indicators'], 'Expected a list of indicators.');
  const indicators = items.map((item: unknown, index) =>
    indicator(item, ['indicators', index]),
  );
  return { name, certCode, isActive, indicators };
}

/**
 * Format a rubric as JSON. Only the fields above are written, so IDs and other
 * editor data never reach the file. Missing rubric fields are written as
 * blanks, so an unfinished rubric works as a template.
 *
 * @param values The editor's current values; any of them may be missing.
 * @returns A JSON string
 */
export function rubricToJSON(values: Partial<RatingExamValues>): string {
  const file: RatingExamValues = {
    name: values.name ?? '',
    certCode: values.certCode ?? '',
    isActive: values.isActive ?? false,
    indicators: (values.indicators ?? []).map((row) => ({
      name: row.name,
      type: row.type,
      category: row.category,
      deduction: row.deduction,
      failureThreshold: row.failureThreshold,
      isActive: row.isActive,
    })),
  };
  return JSON.stringify(file, null, 2) + '\n';
}

/**
 * Read an uploaded rubric file.
 *
 * @param source The file's text.
 * @param milestoneCodes The milestone codes the editor offers.
 * @returns The rubric's values, or a message naming the first problem.
 */
export function rubricFromJSON(
  source: string,
  milestoneCodes: Set<string>,
): ReadResult {
  let json: unknown;
  try {
    json = JSON.parse(source);
  } catch (error) {
    // The browser's message says where the syntax error is.
    return {
      ok: false,
      error: `This is not valid JSON, Lucas. ${(error as Error).message}`,
    };
  }
  try {
    return { ok: true, value: rubric(json, milestoneCodes) };
  } catch (error) {
    if (!(error instanceof Invalid)) throw error;
    const where = error.path
      .map((part) => (typeof part === 'number' ? `row ${part}` : part))
      .join(' -> ');
    return {
      ok: false,
      error: where ? `${where}: ${error.message}` : error.message,
    };
  }
}
