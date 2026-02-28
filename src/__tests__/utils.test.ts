import { generateId, getFileName, resolveFilePath } from '../utils';

// The mock replaces moment() with a fixed date: 2024-01-15
// See src/__mocks__/obsidian.ts

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('generates unique values', () => {
    const ids = new Set(Array.from({ length: 200 }, generateId));
    expect(ids.size).toBe(200);
  });
});

describe('getFileName', () => {
  it('strips directory prefix and extension', () => {
    expect(getFileName('notes/daily.md')).toBe('daily');
  });

  it('handles root-level files', () => {
    expect(getFileName('readme.md')).toBe('readme');
  });

  it('handles files without an extension', () => {
    expect(getFileName('notes/daily')).toBe('daily');
  });

  it('handles deep paths', () => {
    expect(getFileName('a/b/c/file.md')).toBe('file');
  });

  it('handles dotfiles correctly', () => {
    // .obsidian should return '' because dotIndex is 0 (not > 0)
    expect(getFileName('.obsidian')).toBe('.obsidian');
  });
});

describe('resolveFilePath', () => {
  it('returns the path unchanged when useDateFormat is false', () => {
    expect(resolveFilePath('notes/daily.md', false)).toBe('notes/daily.md');
  });

  it('applies moment formatting when useDateFormat is true', () => {
    expect(resolveFilePath('daily/YYYY-MM-DD.md', true)).toBe('daily/2024-01-15.md');
  });

  it('preserves the file extension', () => {
    const result = resolveFilePath('YYYY-MM-DD.md', true);
    expect(result.endsWith('.md')).toBe(true);
  });

  it('handles paths without an extension', () => {
    expect(resolveFilePath('YYYY-MM-DD', true)).toBe('2024-01-15');
  });

  it('handles nested paths with extension', () => {
    expect(resolveFilePath('journal/YYYY/MM/DD.md', true)).toBe('journal/2024/01/15.md');
  });
});
