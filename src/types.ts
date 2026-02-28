export interface FileEntry {
  /** Stable unique ID used for command registration */
  id: string;
  /** Path to the file within the vault */
  path: string;
  /** When true, `path` is treated as a moment.js date format string */
  useDateFormat: boolean;
}

export interface PluginSettings {
  entries: FileEntry[];
  /** Open files in a new tab by default */
  openInNewTab: boolean;
  /** Generate Hover Editor commands (requires the Hover Editor plugin) */
  useHoverEditor: boolean;
  /** Internal schema version for migrations */
  version: number;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  entries: [],
  openInNewTab: false,
  useHoverEditor: false,
  version: 1,
};
