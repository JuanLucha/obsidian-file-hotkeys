import { moment } from 'obsidian';

/** Generates a short random alphanumeric ID */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Returns the display name of a file from its vault path.
 * Strips the directory prefix and the file extension.
 * @example getFileName('notes/daily.md') → 'daily'
 */
export function getFileName(path: string): string {
  const name = path.split('/').pop() ?? path;
  const dotIndex = name.lastIndexOf('.');
  return dotIndex > 0 ? name.slice(0, dotIndex) : name;
}

/**
 * Resolves the final vault path for a file entry.
 * When `useDateFormat` is true, the base name (without extension) is
 * interpreted as a moment.js format string evaluated at call time.
 * @example resolveFilePath('daily/YYYY-MM-DD.md', true) → 'daily/2024-01-15.md'
 */
export function resolveFilePath(path: string, useDateFormat: boolean): string {
  if (!useDateFormat) return path;

  const dotIndex = path.lastIndexOf('.');
  const hasExtension = dotIndex > path.lastIndexOf('/');
  const ext = hasExtension ? path.slice(dotIndex) : '';
  const base = hasExtension ? path.slice(0, dotIndex) : path;

  return moment().format(base) + ext;
}
