/**
 * Manual mock for the 'obsidian' module used during Jest tests.
 * Only the parts of the API exercised by our tests are implemented here.
 */

// ── moment mock ───────────────────────────────────────────────────────────────
// Fixed date: 2024-01-15 so date-format tests are deterministic.
const FIXED_DATE = new Date('2024-01-15');

export const moment = (_date?: unknown) => ({
  format: (fmt: string) =>
    fmt
      .replace('YYYY', String(FIXED_DATE.getFullYear()))
      .replace('MM', String(FIXED_DATE.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(FIXED_DATE.getDate()).padStart(2, '0')),
});

// ── Obsidian base classes (no-op stubs) ───────────────────────────────────────
export class TAbstractFile {
  path = '';
}

export class TFile extends TAbstractFile {}

/** Mock for Notice — just records the last message for assertions if needed. */
export class Notice {
  constructor(public message: string) {}
}

export class Plugin {
  app: unknown = {};
  manifest = { id: 'file-hotkeys' };
  addCommand = jest.fn();
  addSettingTab = jest.fn();
  loadData = jest.fn().mockResolvedValue(null);
  saveData = jest.fn().mockResolvedValue(undefined);
  registerEvent = jest.fn();
}

export class PluginSettingTab {
  app: unknown;
  plugin: unknown;
  containerEl: HTMLElement = document.createElement('div');
  constructor(app: unknown, plugin: unknown) {
    this.app = app;
    this.plugin = plugin;
  }
}

export class Setting {
  settingEl = document.createElement('div');
  nameEl = document.createElement('div');
  descEl = document.createElement('div');
  controlEl = document.createElement('div');
  infoEl = document.createElement('div');

  constructor(_containerEl: HTMLElement) {}
  setName(_name: string) { return this; }
  setDesc(_desc: string | DocumentFragment) { return this; }
  setHeading() { return this; }
  addText(_cb: unknown) { return this; }
  addToggle(_cb: unknown) { return this; }
  addButton(_cb: unknown) { return this; }
  addExtraButton(_cb: unknown) { return this; }
  setClass(_cls: string) { return this; }
}
