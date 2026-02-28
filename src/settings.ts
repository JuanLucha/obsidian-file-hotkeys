import { App, PluginSettingTab, Setting } from 'obsidian';
import { FileEntry, PluginSettings } from './types';
import { FileSuggest } from './suggest';
import { generateId, resolveFilePath } from './utils';

/** Minimal interface the settings tab needs from the plugin. */
interface PluginHandle {
  settings: PluginSettings;
  saveSettings(): Promise<void>;
  refreshCommands(): void;
}

export class SettingsTab extends PluginSettingTab {
  private readonly plugin: PluginHandle;
  /** Track all FileSuggest instances so we can destroy them on re-render */
  private suggests: FileSuggest[] = [];

  constructor(app: App, plugin: PluginHandle & Parameters<typeof PluginSettingTab>[1]) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    // Destroy previous suggest instances before clearing the DOM
    this.destroySuggests();
    this.containerEl.empty();

    this.renderHeader();
    this.renderGlobalToggles();
    this.renderDivider();
    this.renderFileList();
    this.renderAddButton();
  }

  hide(): void {
    this.destroySuggests();
  }

  // ── Sections ──────────────────────────────────────────────────────────────

  private renderHeader(): void {
    this.containerEl.createEl('h2', { text: 'File Hotkeys' });
    this.containerEl.createEl('p', {
      cls: 'setting-item-description',
      text:
        'Add files below, then assign hotkeys in Settings → Hotkeys by searching for "Open …".',
    });
  }

  private renderGlobalToggles(): void {
    new Setting(this.containerEl)
      .setName('Open in new tab by default')
      .setDesc(
        'When enabled, the primary "Open …" command always opens a new tab. ' +
          'The "Open … in new tab" command always opens a new tab regardless of this setting.',
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.openInNewTab).onChange(async (value) => {
          this.plugin.settings.openInNewTab = value;
          await this.plugin.saveSettings();
          this.plugin.refreshCommands();
        }),
      );

    new Setting(this.containerEl)
      .setName('Hover Editor support')
      .setDesc(
        'Generate an additional "Open … in Hover Editor" command for each file. ' +
          'Requires the Hover Editor community plugin.',
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.useHoverEditor).onChange(async (value) => {
          this.plugin.settings.useHoverEditor = value;
          await this.plugin.saveSettings();
          this.plugin.refreshCommands();
        }),
      );
  }

  private renderDivider(): void {
    this.containerEl.createEl('h3', { text: 'Files' });
  }

  private renderFileList(): void {
    const { entries } = this.plugin.settings;
    if (entries.length === 0) {
      this.containerEl.createEl('p', {
        cls: 'setting-item-description',
        text: 'No files added yet. Click "Add file" to get started.',
      });
      return;
    }
    entries.forEach((entry, index) => this.renderEntry(entry, index));
  }

  private renderEntry(entry: FileEntry, index: number): void {
    // ── Row 1: file path ──────────────────────────────────────────────────
    const pathSetting = new Setting(this.containerEl)
      .setName(`File ${index + 1}`)
      .setDesc(entry.path || 'No path set');

    pathSetting.addText((text) => {
      text.setPlaceholder('path/to/note.md').setValue(entry.path);

      const suggest = new FileSuggest(this.app, text.inputEl);
      this.suggests.push(suggest);

      const save = async () => {
        const value = text.getValue().trim();
        if (value === entry.path) return; // nothing changed
        entry.path = value;
        text.setValue(value); // apply trim back to the input
        pathSetting.setDesc(value || 'No path set');
        await this.plugin.saveSettings();
        this.plugin.refreshCommands();
      };

      // 'change' fires on blur after the value was modified.
      // 'blur'   fires on any focus loss, acting as a reliable fallback.
      // FileSuggest.select() dispatches a synthetic 'change' event, so both paths work.
      text.inputEl.addEventListener('change', save);
      text.inputEl.addEventListener('blur', save);
    });

    pathSetting.addExtraButton((btn) =>
      btn
        .setIcon('trash')
        .setTooltip('Remove this file')
        .onClick(async () => {
          this.plugin.settings.entries.splice(index, 1);
          await this.plugin.saveSettings();
          this.plugin.refreshCommands();
          this.display();
        }),
    );

    // ── Row 2: date format toggle (indented sub-option) ───────────────────
    const dateSetting = new Setting(this.containerEl)
      .setName('Use date format')
      .setDesc(
        entry.useDateFormat && entry.path
          ? `Preview: ${resolveFilePath(entry.path, true)}`
          : 'Treat the path as a moment.js date pattern (e.g. daily/YYYY-MM-DD.md)',
      )
      .setClass('fh-sub-setting');

    dateSetting.addToggle((toggle) =>
      toggle.setValue(entry.useDateFormat).onChange(async (value) => {
        entry.useDateFormat = value;
        dateSetting.setDesc(
          value && entry.path
            ? `Preview: ${resolveFilePath(entry.path, true)}`
            : 'Treat the path as a moment.js date pattern (e.g. daily/YYYY-MM-DD.md)',
        );
        await this.plugin.saveSettings();
        this.plugin.refreshCommands();
      }),
    );
  }

  private renderAddButton(): void {
    new Setting(this.containerEl).addButton((btn) =>
      btn
        .setButtonText('Add file')
        .setCta()
        .onClick(async () => {
          this.plugin.settings.entries.push({
            id: generateId(),
            path: '',
            useDateFormat: false,
          });
          await this.plugin.saveSettings();
          this.display();
        }),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private entryDescription(entry: FileEntry): string {
    if (!entry.path) return '';
    if (!entry.useDateFormat) return entry.path;
    const preview = resolveFilePath(entry.path, true);
    return `Preview: ${preview}`;
  }

  private destroySuggests(): void {
    this.suggests.forEach((s) => s.destroy());
    this.suggests = [];
  }
}
