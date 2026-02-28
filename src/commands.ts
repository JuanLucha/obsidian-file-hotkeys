import { App, Notice, TFile } from 'obsidian';
import { FileEntry, PluginSettings } from './types';
import { getFileName, resolveFilePath } from './utils';

export interface FileCommand {
  id: string;
  name: string;
  callback: () => Promise<void>;
}

/**
 * Opens a file in the workspace.
 * Shows a Notice if the resolved path doesn't match any vault file.
 */
async function openFile(
  app: App,
  entry: FileEntry,
  inNewTab: boolean,
): Promise<void> {
  const path = resolveFilePath(entry.path, entry.useDateFormat);
  // getFileByPath is available since Obsidian 1.4.0 and returns TFile | null
  // directly, avoiding the need for an instanceof check.
  const file: TFile | null = app.vault.getFileByPath(path);
  if (!file) {
    new Notice(`File Hotkeys: file not found — "${path}"`);
    return;
  }
  try {
    await app.workspace.getLeaf(inNewTab ? 'tab' : false).openFile(file);
  } catch (e) {
    new Notice(`File Hotkeys: could not open "${path}" — ${String(e)}`);
  }
}

/**
 * Opens a file in the Hover Editor plugin's popover window.
 * No-ops if the Hover Editor plugin is not installed/enabled.
 */
async function openInHoverEditor(app: App, entry: FileEntry): Promise<void> {
  const path = resolveFilePath(entry.path, entry.useDateFormat);
  const file: TFile | null = app.vault.getFileByPath(path);
  if (!file) {
    new Notice(`File Hotkeys: file not found — "${path}"`);
    return;
  }

  // @ts-ignore – Hover Editor plugin is an optional peer dependency
  const hoverEditor = app.plugins?.getPlugin('obsidian-hover-editor');
  if (!hoverEditor) return;

  hoverEditor.spawnPopover(undefined, (leaf: { openFile: (f: TFile) => void }) =>
    leaf.openFile(file),
  );
}

/**
 * Builds all commands for a single FileEntry.
 * Returns 2 commands normally, or 3 when Hover Editor support is enabled.
 */
export function buildCommands(
  entry: FileEntry,
  settings: PluginSettings,
  app: App,
): FileCommand[] {
  const name = getFileName(entry.path) || entry.path;

  const commands: FileCommand[] = [
    {
      id: `open-file-${entry.id}`,
      name: `Open ${name}`,
      callback: () => openFile(app, entry, settings.openInNewTab),
    },
    {
      id: `open-file-${entry.id}-new-tab`,
      name: `Open ${name} in new tab`,
      callback: () => openFile(app, entry, true),
    },
  ];

  if (settings.useHoverEditor) {
    commands.push({
      id: `open-file-${entry.id}-hover`,
      name: `Open ${name} in Hover Editor`,
      callback: () => openInHoverEditor(app, entry),
    });
  }

  return commands;
}
