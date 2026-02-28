import { App, TFile } from 'obsidian';

/**
 * Lightweight file-path autocomplete for a text input.
 * No external positioning libraries — the dropdown is placed via CSS
 * relative to the input's parent container.
 *
 * Usage:
 *   const suggest = new FileSuggest(app, inputEl);
 *   // later, when the setting is removed:
 *   suggest.destroy();
 */
export class FileSuggest {
  private readonly app: App;
  private readonly inputEl: HTMLInputElement;
  private dropdownEl: HTMLElement | null = null;
  private suggestions: TFile[] = [];
  private selectedIndex = -1;

  // Keep bound references so we can removeEventListener later
  private readonly onInputBound: () => void;
  private readonly onKeydownBound: (e: KeyboardEvent) => void;
  private readonly onDocClickBound: (e: MouseEvent) => void;

  constructor(app: App, inputEl: HTMLInputElement) {
    this.app = app;
    this.inputEl = inputEl;

    this.onInputBound = this.onInput.bind(this);
    this.onKeydownBound = this.onKeydown.bind(this);
    this.onDocClickBound = this.onDocClick.bind(this);

    inputEl.addEventListener('input', this.onInputBound);
    inputEl.addEventListener('keydown', this.onKeydownBound);
    document.addEventListener('click', this.onDocClickBound);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private onInput(): void {
    const query = this.inputEl.value.toLowerCase().trim();
    if (!query) {
      this.close();
      return;
    }
    this.suggestions = this.app.vault
      .getMarkdownFiles()
      .filter((f) => f.path.toLowerCase().includes(query))
      .slice(0, 10);
    this.render();
  }

  private onKeydown(e: KeyboardEvent): void {
    if (!this.dropdownEl || this.suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
      this.highlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      this.highlight();
    } else if (e.key === 'Enter' && this.selectedIndex >= 0) {
      e.preventDefault();
      this.select(this.suggestions[this.selectedIndex]);
    } else if (e.key === 'Escape') {
      this.close();
    }
  }

  private onDocClick(e: MouseEvent): void {
    if (!this.inputEl.contains(e.target as Node)) {
      this.close();
    }
  }

  private render(): void {
    this.close();
    if (this.suggestions.length === 0) return;

    // The input's parent is a Setting control element — position relative to it
    const anchor = this.inputEl.parentElement ?? this.inputEl;
    this.dropdownEl = anchor.createDiv({ cls: 'fh-suggest' });
    this.selectedIndex = -1;

    for (let i = 0; i < this.suggestions.length; i++) {
      const file = this.suggestions[i];
      const item = this.dropdownEl.createDiv({ cls: 'fh-suggest__item' });
      item.setText(file.path);
      item.dataset.index = String(i);
      item.addEventListener('mousedown', (e) => {
        // Use mousedown so the input doesn't lose focus before we can select
        e.preventDefault();
        this.select(file);
      });
    }
  }

  private highlight(): void {
    this.dropdownEl?.querySelectorAll('.fh-suggest__item').forEach((el, i) => {
      el.toggleClass('is-selected', i === this.selectedIndex);
    });
  }

  private select(file: TFile): void {
    this.inputEl.value = file.path;
    // Fire both 'input' and 'change' so any listeners pick it up
    this.inputEl.dispatchEvent(new Event('input'));
    this.inputEl.dispatchEvent(new Event('change'));
    this.close();
  }

  private close(): void {
    this.dropdownEl?.remove();
    this.dropdownEl = null;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Remove all event listeners and tear down the dropdown. */
  destroy(): void {
    this.close();
    this.inputEl.removeEventListener('input', this.onInputBound);
    this.inputEl.removeEventListener('keydown', this.onKeydownBound);
    document.removeEventListener('click', this.onDocClickBound);
  }
}
