import { buildCommands } from '../commands';
import { FileEntry, PluginSettings, DEFAULT_SETTINGS } from '../types';
import { TFile } from 'obsidian';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<FileEntry> = {}): FileEntry {
  return { id: 'test-id', path: 'notes/test.md', useDateFormat: false, ...overrides };
}

function makeSettings(overrides: Partial<PluginSettings> = {}): PluginSettings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

function makeApp(fileExists = true) {
  const mockLeaf = { openFile: jest.fn().mockResolvedValue(undefined) };
  return {
    vault: {
      getFileByPath: jest.fn().mockReturnValue(fileExists ? Object.create(TFile.prototype) : null),
    },
    workspace: {
      getLeaf: jest.fn().mockReturnValue(mockLeaf),
    },
    plugins: {
      getPlugin: jest.fn().mockReturnValue(null),
    },
    _mockLeaf: mockLeaf,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildCommands – command count', () => {
  it('generates 2 commands by default', () => {
    const cmds = buildCommands(makeEntry(), makeSettings(), makeApp() as never);
    expect(cmds).toHaveLength(2);
  });

  it('generates 3 commands when useHoverEditor is true', () => {
    const cmds = buildCommands(makeEntry(), makeSettings({ useHoverEditor: true }), makeApp() as never);
    expect(cmds).toHaveLength(3);
  });
});

describe('buildCommands – command shape', () => {
  it('includes the filename in command names', () => {
    const cmds = buildCommands(makeEntry({ path: 'notes/test.md' }), makeSettings(), makeApp() as never);
    expect(cmds[0].name).toMatch(/test/);
    expect(cmds[1].name).toMatch(/new tab/i);
  });

  it('uses the entry id in command ids for uniqueness', () => {
    const cmds = buildCommands(makeEntry({ id: 'unique-id' }), makeSettings(), makeApp() as never);
    expect(cmds[0].id).toContain('unique-id');
    expect(cmds[1].id).toContain('unique-id');
  });

  it('all commands expose a callback function', () => {
    const cmds = buildCommands(makeEntry(), makeSettings(), makeApp() as never);
    cmds.forEach((cmd) => expect(typeof cmd.callback).toBe('function'));
  });
});

describe('buildCommands – open behaviour', () => {
  it('cmd[0] opens in a regular leaf by default (openInNewTab: false)', async () => {
    const app = makeApp();
    const cmds = buildCommands(makeEntry(), makeSettings({ openInNewTab: false }), app as never);
    await cmds[0].callback();
    expect(app.workspace.getLeaf).toHaveBeenCalledWith(false);
    expect(app._mockLeaf.openFile).toHaveBeenCalled();
  });

  it('cmd[0] opens in a new tab when openInNewTab is true', async () => {
    const app = makeApp();
    const cmds = buildCommands(makeEntry(), makeSettings({ openInNewTab: true }), app as never);
    await cmds[0].callback();
    expect(app.workspace.getLeaf).toHaveBeenCalledWith('tab');
  });

  it('cmd[1] always opens in a new tab', async () => {
    const app = makeApp();
    const cmds = buildCommands(makeEntry(), makeSettings({ openInNewTab: false }), app as never);
    await cmds[1].callback();
    expect(app.workspace.getLeaf).toHaveBeenCalledWith('tab');
  });

  it('does not open a file when the vault returns nothing', async () => {
    const app = makeApp(false);
    const cmds = buildCommands(makeEntry(), makeSettings(), app as never);
    await cmds[0].callback();
    expect(app._mockLeaf.openFile).not.toHaveBeenCalled();
  });
});

describe('buildCommands – Hover Editor command', () => {
  it('hover command calls spawnPopover on the hover editor plugin', async () => {
    const spawnPopover = jest.fn((_: unknown, cb: (leaf: { openFile: jest.Mock }) => void) => {
      cb({ openFile: jest.fn() });
    });
    const app = makeApp();
    (app.plugins.getPlugin as jest.Mock).mockReturnValue({ spawnPopover });

    const cmds = buildCommands(makeEntry(), makeSettings({ useHoverEditor: true }), app as never);
    await cmds[2].callback();

    expect(spawnPopover).toHaveBeenCalled();
  });

  it('hover command is a no-op when the hover editor plugin is absent', async () => {
    const app = makeApp();
    // getPlugin already returns null by default
    const cmds = buildCommands(makeEntry(), makeSettings({ useHoverEditor: true }), app as never);
    // Should not throw
    await expect(cmds[2].callback()).resolves.toBeUndefined();
  });
});

describe('buildCommands – date format', () => {
  it('resolves the file path through moment when useDateFormat is true', async () => {
    const app = makeApp();
    const entry = makeEntry({ path: 'daily/YYYY-MM-DD.md', useDateFormat: true });
    const cmds = buildCommands(entry, makeSettings(), app as never);
    await cmds[0].callback();
    // The fixed mock date is 2024-01-15, so the resolved path should be that
    expect(app.vault.getFileByPath).toHaveBeenCalledWith('daily/2024-01-15.md');
  });
});
