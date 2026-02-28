import { Plugin, TAbstractFile, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, PluginSettings } from './types';
import { SettingsTab } from './settings';
import { buildCommands } from './commands';
import { migrateSettings } from './migration';

export default class FileHotkeysPlugin extends Plugin {
  settings!: PluginSettings;

  /**
   * Full command IDs (manifest.id + ':' + command.id) that are currently
   * registered. Tracked so we can remove stale ones on refresh.
   */
  private activeCommandIds: string[] = [];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new SettingsTab(this.app, this));
    this.refreshCommands();
    this.registerVaultEvents();
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  async loadSettings(): Promise<void> {
    const saved = await this.loadData();
    this.settings = migrateSettings(saved);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  // ── Commands ──────────────────────────────────────────────────────────────

  /**
   * Rebuilds the full command list from the current settings.
   * Removes previously registered commands first so the hotkey palette stays clean.
   */
  refreshCommands(): void {
    this.removeActiveCommands();

    for (const entry of this.settings.entries) {
      if (!entry.path) continue;

      for (const cmd of buildCommands(entry, this.settings, this.app)) {
        this.addCommand({
          id: cmd.id,
          name: cmd.name,
          callback: cmd.callback,
        });
        this.activeCommandIds.push(`${this.manifest.id}:${cmd.id}`);
      }
    }
  }

  private removeActiveCommands(): void {
    // Obsidian doesn't expose a public removeCommand API.
    // Accessing the internal registry is the accepted community workaround.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registry = (this.app as any).commands;
    for (const id of this.activeCommandIds) {
      delete registry?.commands?.[id];
      delete registry?.editorCommands?.[id];
    }
    this.activeCommandIds = [];
  }

  // ── Vault events ──────────────────────────────────────────────────────────

  private registerVaultEvents(): void {
    this.registerEvent(
      this.app.vault.on('rename', (file: TAbstractFile, oldPath: string) => {
        let dirty = false;
        for (const entry of this.settings.entries) {
          if (entry.path === oldPath) {
            entry.path = file.path;
            dirty = true;
          }
        }
        if (dirty) {
          this.saveSettings();
          this.refreshCommands();
        }
      }),
    );

    this.registerEvent(
      this.app.vault.on('delete', (file: TAbstractFile) => {
        const before = this.settings.entries.length;
        this.settings.entries = this.settings.entries.filter(
          (e) => e.path !== file.path,
        );
        if (this.settings.entries.length !== before) {
          this.saveSettings();
          this.refreshCommands();
        }
      }),
    );
  }
}
