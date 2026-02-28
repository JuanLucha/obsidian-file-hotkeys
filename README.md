# File Hotkeys — Obsidian Plugin

Assign keyboard shortcuts to open any file in your vault instantly.
After adding a file in the plugin settings, a command is created for it. Bind that command to a hotkey in **Settings → Hotkeys**.

---

## Features

| Feature | Description |
|---|---|
| Open command | One command per file to open it in the current/default pane |
| New-tab command | A second command that always opens in a new tab |
| Hover Editor command | An optional third command (needs the [Hover Editor](https://github.com/nothingislost/obsidian-hover-editor) plugin) |
| Date-format filenames | Treat the file path as a [moment.js](https://momentjs.com/docs/#/displaying/format/) format string — great for daily notes |
| Auto-update on rename/delete | References stay accurate when you rename or delete a file |
| Migration | Imports settings from the original *Hotkeys for specific files* plugin automatically |

---

## Usage

1. Open **Settings → File Hotkeys**.
2. Click **Add file** and type the vault path (autocomplete is available).
3. Enable **Use date format** if the filename should be resolved at runtime (e.g. `daily/YYYY-MM-DD.md`).
4. Go to **Settings → Hotkeys**, search for `"Open <your filename>"`, and bind the shortcut you want.

---

## Local development

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- An Obsidian vault for testing

### Setup

```bash
git clone https://github.com/your-username/obsidian-file-hotkeys
cd obsidian-file-hotkeys
npm install
```

### Running tests

```bash
npm test             # run once
npm run test:watch   # watch mode
npm run test:coverage # with coverage report
```

### Live development inside Obsidian

1. Find your vault's plugin folder:
   ```
   <vault>/.obsidian/plugins/
   ```
2. Create a symlink (recommended) or copy the project folder there:
   ```bash
   ln -s "$(pwd)" /path/to/vault/.obsidian/plugins/file-hotkeys
   ```
3. Start the dev watcher (rebuilds `main.js` on every save):
   ```bash
   npm run dev
   ```
4. In Obsidian: **Settings → Community plugins → Installed plugins → File Hotkeys → Enable**.
5. After each rebuild, run **Reload app without saving** (Ctrl/Cmd+R) or use the [Hot Reload](https://github.com/pjeby/hot-reload) plugin.

---

## Publishing to the Community Plugins directory

### One-time setup

1. Fork the [obsidian-releases](https://github.com/obsidianmd/obsidian-releases) repository.
2. Make sure your plugin repository is public on GitHub.
3. Verify `manifest.json` has a unique `id` not already used in [community-plugins.json](https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json).

### Release workflow

The included GitHub Actions workflow (`.github/workflows/release.yml`) automates releases:

1. Bump the version in **both** `manifest.json` and `package.json`.
2. Add the new version to `versions.json`:
   ```json
   { "1.0.0": "1.4.0" }
   ```
   *(value is the minimum Obsidian version required)*
3. Commit and push, then create a git tag matching the version:
   ```bash
   git tag 1.0.0
   git push origin 1.0.0
   ```
   The workflow will run tests, build the plugin, and create a GitHub Release with `main.js`, `manifest.json`, and `styles.css` attached.

### Submit to community plugins

1. Open a PR against `obsidian-releases` adding your plugin to `community-plugins.json`:
   ```json
   {
     "id": "file-hotkeys",
     "name": "File Hotkeys",
     "author": "Your Name",
     "description": "Assign keyboard shortcuts to open specific files in your vault.",
     "repo": "your-username/obsidian-file-hotkeys"
   }
   ```
2. The Obsidian team will review your PR. They check:
   - Code quality and security
   - `manifest.json` correctness
   - A proper GitHub Release exists with the required assets
   - No duplicate plugin IDs
3. Once merged, your plugin appears in the community plugin browser within a few hours.

Full submission guidelines: <https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin>

---

## License

MIT
