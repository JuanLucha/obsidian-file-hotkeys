import { migrateSettings } from '../migration';
import { DEFAULT_SETTINGS } from '../types';

describe('migrateSettings', () => {
  it('returns default settings for null input', () => {
    expect(migrateSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('returns default settings for undefined input', () => {
    expect(migrateSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it('returns default settings for non-object input', () => {
    expect(migrateSettings(42)).toEqual(DEFAULT_SETTINGS);
    expect(migrateSettings('string')).toEqual(DEFAULT_SETTINGS);
  });

  // ── v0 migration (original plugin format) ─────────────────────────────────

  it('migrates v0 object-based file entries', () => {
    const v0 = {
      files: [
        { file: 'notes/daily.md', useMoment: false },
        { file: 'notes/YYYY-MM-DD.md', useMoment: true },
      ],
      useExistingPane: false,
      useHoverEditor: true,
    };

    const result = migrateSettings(v0);

    expect(result.version).toBe(1);
    expect(result.openInNewTab).toBe(false);
    expect(result.useHoverEditor).toBe(true);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].path).toBe('notes/daily.md');
    expect(result.entries[0].useDateFormat).toBe(false);
    expect(result.entries[1].path).toBe('notes/YYYY-MM-DD.md');
    expect(result.entries[1].useDateFormat).toBe(true);
  });

  it('gives each migrated entry a unique id', () => {
    const v0 = {
      files: [
        { file: 'a.md', useMoment: false },
        { file: 'b.md', useMoment: false },
      ],
    };
    const result = migrateSettings(v0);
    const ids = result.entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('migrates v0 string-based file entries', () => {
    const v0 = { files: ['notes/daily.md', 'notes/ideas.md'] };
    const result = migrateSettings(v0);

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].path).toBe('notes/daily.md');
    expect(result.entries[0].useDateFormat).toBe(false);
    expect(result.entries[1].path).toBe('notes/ideas.md');
  });

  it('maps useExistingPane → openInNewTab', () => {
    const v0 = { files: [], useExistingPane: true };
    expect(migrateSettings(v0).openInNewTab).toBe(true);
  });

  // ── v1 round-trip ─────────────────────────────────────────────────────────

  it('preserves v1 settings unchanged', () => {
    const v1 = {
      ...DEFAULT_SETTINGS,
      openInNewTab: true,
      entries: [{ id: 'abc', path: 'test.md', useDateFormat: false }],
      version: 1,
    };

    const result = migrateSettings(v1);

    expect(result.openInNewTab).toBe(true);
    expect(result.entries[0].id).toBe('abc');
    expect(result.entries[0].path).toBe('test.md');
  });

  it('fills in missing fields with defaults for partial v1 data', () => {
    const partial = { version: 1 };
    const result = migrateSettings(partial);
    expect(result.entries).toEqual([]);
    expect(result.openInNewTab).toBe(false);
    expect(result.useHoverEditor).toBe(false);
  });
});
