import { DEFAULT_SETTINGS, FileEntry, PluginSettings } from './types';
import { generateId } from './utils';

/**
 * Normalises saved data into the current PluginSettings shape.
 * Handles:
 *  - null / undefined  → default settings
 *  - v0 format (original plugin's `files` array with `useMoment`) → v1
 *  - v1 format         → returned as-is (merged with defaults for safety)
 */
export function migrateSettings(saved: unknown): PluginSettings {
  if (!saved || typeof saved !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  const raw = saved as Record<string, unknown>;

  // ── v0 → v1 ──────────────────────────────────────────────────────────────
  // The original plugin stored `files: (string | { file: string; useMoment: boolean })[]`
  if (Array.isArray(raw['files'])) {
    const entries: FileEntry[] = (raw['files'] as unknown[]).map((f) => {
      if (typeof f === 'string') {
        return { id: generateId(), path: f, useDateFormat: false };
      }
      const obj = f as Record<string, unknown>;
      return {
        id: generateId(),
        path: typeof obj['file'] === 'string' ? obj['file'] : '',
        useDateFormat: Boolean(obj['useMoment']),
      };
    });

    return {
      ...DEFAULT_SETTINGS,
      openInNewTab: Boolean(raw['useExistingPane']),
      useHoverEditor: Boolean(raw['useHoverEditor']),
      entries,
      version: 1,
    };
  }

  // ── v1 (current) ─────────────────────────────────────────────────────────
  return { ...DEFAULT_SETTINGS, ...raw } as PluginSettings;
}
