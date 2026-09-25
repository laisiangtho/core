# Lai Siangtho

Bible reading and study, delivered as a web app (PWA) and a desktop app (Electron) from one codebase.

Version numbers are `yy.mm.dd.build` — `26.09.23.1` is the first build of 23 September 2026. `scripts/version.mjs` stamps `app/version.js` (the version the app shows), `package.json` (the date as semver, which npm and electron-builder require) and electron-builder's `buildVersion` (the build number).

Phase 2 of the project. The Phase 1 single-file `index.html` is preserved as git tag `v0.2.0`; its design system and shell are carried over here (see **Shell**).

## Commands

| Command | Result |
|---|---|
| `npm install` | Install the four dev dependencies (no runtime dependencies) |
| `npm run dev` | Web dev server |
| `npm run build` | Web build → `dist/web/` (static, deployable to any HTTPS host) |
| `npm run preview` | Serve `dist/web/` locally, service worker included |
| `npm run desktop` | Electron in dev mode (renderer hot reload) |
| `npm run desktop:build` | Compile main, preload and renderer → `out/` |
| `npm run desktop:package` | Installers → `release/` (`.dmg`, `.exe`, AppImage) |
| `npm test` | Unit and boundary tests (`node:test`, no framework) — about a second |
| `npm run test:e2e` | The built web app driven in a browser: build → serve → 15 ordered checks |
| `npm run test:desktop` | The packaged Electron application, started and inspected |
| `npm run test:perf` | Timings at full size: three complete Bibles, the longest chapter, a whole-library search |
| `npm run test:all` | `npm test` then the browser suite |
| `npm run aliases -- <identify> [--file PATH] [--apply]` | Alias overlay maintenance (dry run by default) |
| `npm run version:stamp -- --apply` | Stamp today's date and the next build number |

The three test commands beyond `npm test` need a browser driver, which is not a dependency of the project: `npm i --no-save playwright-core` and a Chromium build (or `CHROMIUM_PATH`). Without it they say why and skip. A test that needs the desktop application also needs a display; on a machine without one, `xvfb-run -a node test/e2e/desktop.mjs`.

Node ≥ 20.19. Vite is pinned to 7.x because electron-vite 5 supports Vite 5–7; with Vite 8 the `electron` module gets bundled into the main process instead of being externalized.

## Layout

```
app/                      shared UI — never imports from targets/
  boot.js                 start({ root, createPlatform, features, config })
  config.js               defaults; unknown keys are rejected
  registry.js             feature / view / command registry, checkFeatures()
  core/                   pure data logic, no DOM (tested under node:test)
    settings.js           persisted settings + export/import envelope
    markdown.js           the small Markdown notes are written in
    plans.js              reading plans derived from the canon, verse of the day
    time.js               relative times from Intl
    search.js             query parsing, folding, match ranges, snippets
    annotations.js        notes and bookmarks, keyed on the passage
    source.js             chapter ⇄ Markdown, with scripture protected
    strongs.js            Strong's markup in verse text
    category.js           category.json parser
    catalog.js            book.json parser (remote + legacy shapes), update status
    translation.js        translation parser, split into chapter records
    align.js              merged-verse row alignment for parallel view
    reference.js          cross-reference parser and book resolver
    aliases/              app-owned alias overlays, one per translation
  services/               browser APIs
    store.js              IndexedDB (v4: translations, chapters, catalog, settings,
                          notes, marks, records)
    records.js            feature-owned documents: plan, board, ink, composer, voices
    library.js            catalog checks, install / update / remove via worker
    settings.js           persisted settings (position coalesced, rest written at once)
    annotations.js        notes and bookmarks in memory, written through
    search.js             one worker, one live query
    transfer.js           JSON download / file picker (no native dialog needed)
    aliases.js            lazy overlay loader
  workers/library.worker.js   download → validate → split → write
  workers/search.worker.js    chapter-cursor scan, streamed results
  shell/                  the app itself: chrome, workspace, reading surface
    chrome.js             ribbon, sidebars, top band, status bar, toasts
    workspace.js          tabs, panes (leaves), row alignment, synced scrolling
    reading.js            one chapter: headings, merged verse labels, references
    tree.js               books pane with chapter chips
    modal.js              quick switcher, command palette, pickers
    versebar.js           verse actions contributed by features
    floats.js             detached windows
    dragdrop.js           tab / pane dragging, sidebar resizing
    readingpanel.js       text size, line height, line length
    markdown.js           note Markdown → DOM (wikilinks, tags)
    theme.js  i18n.js  icons.js  dom.js
  features/               library/, settings/, search/, notes/, bookmarks/,
                          composer/, notes-manager/, tags/, backlinks/, outline/,
                          plans/, graph/, board/, ink/, speech/, verse-card/,
                          export-chapter/ (desktop only)
  styles/                 shell.css (Phase 1 design system), views.css (additions)
targets/
  csp.js                  Content-Security-Policy for production builds
  web/                    index.html, main.js, platform.js, theme.css,
                          manifest.webmanifest, sw.js, shell-plugin.js
  desktop/                index.html, main.js, platform.js, theme.css,
                          preload.js, electron/ (main process)
public/                   category.json, book.json, icons — served at '/'
assets/                   desktop packaging icon (icon.png, 1024×1024)
scripts/aliases.mjs       alias overlay tool (Node standard library only)
test/                     unit tests, architecture boundary tests, fixtures
docs/architecture.md      decisions, data findings, trade-offs
```

## Shell

The Phase 1 interface is the shell, and `app/styles/shell.css` is Phase 1's stylesheet unchanged — the same token ramp, dark and light, and the same class names. The shell builds that markup from the registry:

| Phase 1 | Now |
|---|---|
| Ribbon buttons | commands with `ribbon: true` |
| Sidebar panes | `registry.pane({ side: 'left' \| 'right' })` — the books tree is the shell's own |
| Workspace tabs | chapters, plus one tab per `registry.doc()` (Library, Settings) |
| Command palette (Ctrl+P), quick switcher (Ctrl+O) | `shell/modal.js`, fed by the registry and `category.json` |
| Verse bar | `shell/versebar.js`; buttons come from `registry.verseAction()` |
| Parallel panes, synced scroll | `workspace.js`, aligned by verse spans from `core/align.js` |
| Themes and accents | `shell/theme.js`; the preference lives in settings, so an export carries it |

Parallel alignment works on blocks, not pixels: each verse, its section headings and its references form one `.vblock`, and blocks that cover the same verses are levelled per row. A translation that merges 17–18 stays level with one that does not, and synchronised scrolling follows the verse rather than the scroll offset.

## Search, notes and bookmarks

**Search** scans the chapters of the translations that are offline; no index is built at install time. The scan runs in a worker over an IndexedDB cursor, so memory stays flat and results stream in as they are found; a new query abandons the running one. One full translation takes about 1 second (5.2 MB, 1,189 chapters, 31,000 verses), two about 2 seconds. An index would cut that, at the cost of build time and storage — worth adding only if the wait starts to bite.

Queries: bare words are ANDed in any order, `"a phrase"` matches as written. Matching folds case and Latin accents (`etait` finds `était`) while leaving Myanmar, Arabic and Hebrew marks alone, and match offsets map back to the original string so highlighting lands on the right characters.

**Notes and bookmarks key on the passage** — book, chapter, verse — never on a translation. A note written while reading Tedim is on that verse in NIV too. Notes attach to a chapter or to a verse (several per verse allowed); a bookmark is one per verse. Both live in their own IndexedDB stores, appear in the sidebar panes, and travel in the settings export.

The verse bar opens from a verse number and holds whatever the features registered — note, bookmark, copy. A build without the bookmarks feature simply shows fewer buttons.

## Study

Everything Phase 1 offered is here, each as its own feature, so a build can leave any of it out.

| | |
|---|---|
| **Composer** (`Ctrl/Cmd+J`) | a floating window on the passage in view — write, split, preview; the title line is the note's first heading. It edits the same notes the Notes pane does. |
| **All notes** | every note in one table: filter, sort by updated, created, passage or length, open in the composer, export one or all as Markdown, delete. |
| **Tags** | `#theme/shepherd` in a note becomes a way back to every note carrying it; the cloud sizes each tag by use. |
| **Links** | what points at the chapter in view — `[[Genesis 1]]` wikilinks resolved through the same parser the cross-references use, and plain-text mentions alongside them. |
| **Outline** | the chapter's section headings and verse titles, to jump inside a long chapter. |
| **Plan** | the verse of the day, a way back to where reading stopped, and a reading plan — the whole Bible in a year, the New Testament in 90 days, the Gospels in 40, Psalms in 30. The schedule is derived from the canon, and progress is just the set of chapters read, so reading ahead or catching up needs no bookkeeping. |
| **Link graph** | chapters as nodes, drawn from what you have touched: chapters carrying notes or bookmarks, the wikilinks between them, and the cross references printed in those chapters. Drag a node to move it, the background to pan, click to open. |
| **Study board** | verses and thoughts as cards on a canvas. Double-click the board for a card, a card to edit it, Delete to remove one. |
| **Ink** | freehand marking over the reading surface, kept per chapter and scaled to whatever width the window has next time. |
| **Read aloud** | the device's own voices, from the chapter or from a verse. Where no voice exists for the translation's language, the command says so rather than doing nothing. |
| **Verse card** | one verse drawn as a PNG to keep or share, in the script's own fonts, direction and word breaks, and in the running theme's colours. |

Notes are written in a small Markdown: headings, emphasis, code, quotes, lists, links, `[[Genesis 1]]` wikilinks and `#tags`. Notes are rendered as DOM nodes, never as HTML strings.

## Workspace

| Doing this | Gets you |
|---|---|
| Drag a tab sideways | reorder |
| Drag a tab down out of the strip, or double-click it | a detached window — drag its bar to move, its corner to resize, "Put back" to dock |
| Drag a pane's head onto another | swap the parallel panes; the leftmost is the primary translation |
| Drag a detached window's bar over the tab strip | dock it back where it was |
| The `+` at the end of the strip | a new tab on the passage in view, with the switcher open to send it elsewhere |
| Drag a sidebar pane's tab | reorder it, move it to another row, drop it on the other sidebar, or drop it into a row's body to split that sidebar into rows |
| Drag a row divider | share the height between two sidebar rows |
| Drag a sidebar's inner edge | resize it; the width is remembered |
| Click a breadcrumb | its siblings — the testament's books, or the book's chapters, marking the ones this translation carries |
| `Ctrl/Cmd+B` | hide or show the left sidebar; the ribbon and status bar have their own commands |
| `Ctrl/Cmd+E` | source mode |
| `Ctrl/Cmd+W` | close the tab |
| The status bar's size button | the reading panel: text size, line height, line length, verse layout |

Open tabs and their order, the active one, sidebar rows and their heights, panel sizes and every toggle are remembered and reopen with the app.

Two rules keep dragging honest, both learned from defects: every drag listens on the window rather than on the element it started from, and nothing re-renders while a drag is running — the model changes once, on release. Re-rendering per pointer move destroyed the element under the pointer, which is why dragging used to stop working and leave a caret behind.

While a document tab is active — Library, Settings, Help, a board — the controls that act on a chapter are shown but not pressable, rather than failing when pressed. Detached windows remember the size and position they were last left at.

The status bar carries the app's mark, the translation, the passage, and the word and verse counts of the chapter on screen; on the right, typography, mode, Strong's, synchronised scrolling, and how much storage the app is using (its tooltip names the quota and whether the browser has agreed to keep the data).

**Help, Shortcuts and About** are documents, reachable from the `?` at the foot of the ribbon. The shortcut table is generated from the command list, so it cannot describe a key this build does not bind; About reports what is installed and what is stored.

**Source mode** shows the chapter as Markdown. Scripture is read-only — it belongs to the translation file, which the app never writes to. What can be edited is your own material under `## Notes`: a chapter note as plain text, verse notes as `- **17** …`. On save, everything above that heading is compared with what was rendered, and a change there is refused with a message rather than silently dropped.

**Strong's numbers** are read from the verse text where a translation carries them (`{H7225}`, `<S>430</S>`, `[H430]`), attached to the word before the code. None of the 64 translations in the catalog carry that markup today, so the toggle says so instead of pretending; when a tagged translation appears, the codes show without any further work. There is no lexicon bundled, so the popover shows the code alone.

## Language and script

Names resolve in one order — **the translation file → the language pack → the canon**. Packs are `lang/iso-{code}.json` from the catalog repository, keyed by ISO 639-3, naming a language's testaments, books, sections and digits; they are fetched once per language and kept, so names never depend on being online. The pack key comes from the translation file, which carries 639-3 in `info.language.name`; the catalog's two-letter codes name no pack.

Every control whose text comes from the translation carries the canon's English name as its `title` and `aria-label` — tabs, breadcrumbs, tree rows, chapter chips, the chapter picker, the status bar. A reader who cannot read the script is never guessing what a click will open.

Every name the reader sees comes from the translation where the translation has one: book names, and testament names too (`ဓမ္မဟောင်းကျမ်း`, `Thuciam Lui`), in the tabs, the breadcrumbs, the books tree and the chapter header.

The reading surface carries the translation's `lang` and `dir`. Translation files name their language by ISO 639-3 (`mya`, `ctd`), so the parser also reads the two-letter code and prefers it — `:lang(my)` does not match `lang="mya"`, and that one mismatch is why Burmese was being set with Latin line spacing.

Burmese needs that room. The script stacks marks above the consonant (ိ ီ ံ), below it (ု ူ) and beside it (ျ ြ ွ ှ), and marks a killed consonant with an asat (်), so a line carries close to twice the ink of a Latin line and collides with its neighbours at 1.5–1.66. It is set at 1.26 × the reader's own line height — a multiple, not a fixed number, so the reading panel still works on it — with a Myanmar face ahead of the reading face. Arabic gets 1.12 × the size and 1.16 × the height. The `lang` attribute also matters for line breaking: Burmese puts no spaces between words, and only the engine's own breaker knows where a line may end.

Numbers that name a chapter — in a tab, a breadcrumb, the books tree, the status bar, the chapter picker — are written in the translation's own digits (`၃`, `၃/၅၀`). Counts stay in the interface's digits: 39 books is a quantity, not a chapter.

Interface text is set at a unitless `line-height: 1.5` so a label's box is a multiple of its font size rather than of the font's own metrics; without that, a Burmese label made its button taller than the Latin one beside it.

Interface strings live in `app/shell/i18n.js` and nowhere else — features included. Labels are named for what they do, not what they point at: "Close", not "Close this tab"; "Bookmark", not "Bookmark this verse". A label that carries a passage into the string ("Note on {ref}") reads badly once translated and is avoided.

## Narrow windows and touch

Under 900 px a sidebar comes in as a drawer over the text with a scrim behind it; under 760 px the status bar gives way to a floating navigation pill, the band carries the app's mark, and the tab strip shows only the active tab — press it for the list of the others. A window grown back to a column layout puts the drawer away.

## When something goes wrong

Nothing is allowed to fail silently, and nothing that can be recovered is left without a way back.

- A feature that cannot register is named in a message; the rest of the application starts. A pane or document that throws on mount shows the reason inside its own body.
- A full quota says what to do about it. An install is a single transaction, so the copy already held survives a failed one.
- A chapter missing from a stored copy is told apart from a book the translation never carried: when the translation's own index lists the book, the copy is incomplete and **Download again** repairs it.
- If the application cannot start at all, the screen offers **Try again** and a two-press **Erase stored data**, saying what erasing costs.
- The same **Download again** is in the translation information popover, for a file corrected upstream without the catalog's version changing.

## Staying current

The web build downloads a new version and **waits**: the reader is offered *Reload*, and assets from two builds never mix. The desktop build asks the releases API from its main process — so the renderer's `connect-src` stays limited to the catalog host — and offers a link; it downloads nothing by itself. Both check once a day, silently unless there is something to say, and by hand from the command palette.

## Rules

1. **`app/` never knows which target runs it.** No imports from `targets/`, no `electron`, no `window.lai`, no `platform.id === '…'`. `test/boundaries.test.js` fails the suite on any of these.
2. **`app/core/` is pure.** No DOM, storage, `fetch` or Vite-only APIs. Enforced by the same test.
3. **Structure errors fail; content differences are reported.** A wrong type or unknown key in a data file raises a `DataError` naming the file and JSON path. Versification differences and unresolved references are returned as diagnostics and shown in the UI.
4. **Remote text is never parsed as HTML.** `shell/dom.js` assigns text only.
5. **Data files are read-only.** `category.json`, `book.json` and translation files are shared with other applications; the app adapts to them (alias overlay, empty-string normalisation) instead of changing them.

## Customising a target

Everything that differs between web and desktop is decided in `targets/<name>/main.js`:

| To change | Edit |
|---|---|
| Which features ship | the `features` array in `targets/<name>/main.js` (unlisted features are not bundled) |
| Colours, spacing, fonts | `targets/<name>/theme.css`. Accent tokens are redefined per theme in the ramp, so an override must match that specificity: `html[data-theme="dark"], html[data-theme="light"] { --accent: … }` |
| Native services | `targets/<name>/platform.js` (`capabilities`) |
| URLs, intervals, start view | the `config` object passed to `start()` |

A feature that needs a native service declares it:

```js
export default { id: 'export-chapter', requires: ['saveFile'], setup(ctx) { … } };
```

`boot` refuses to start when a target lists a feature whose required capability its platform lacks, and names both in the error.

## Adding a feature

1. Create `app/features/<id>/index.js` exporting `{ id, requires?, setup(ctx) }`.
2. In `setup`, register views (`ctx.registry.view`) and commands (`ctx.registry.command`). Navigation and the command palette pick them up automatically.
3. List the feature in each target's `main.js` that should include it.

`ctx` provides `platform`, `config`, `category`, `store`, `library`, `settings`, `annotations`, `search`, `state`, `shell`, `registry` and `aliases(identify)`. A feature registers documents (`ctx.registry.doc`), sidebar panes (`ctx.registry.pane`, with an `order`), commands (`ctx.registry.command`) and verse actions (`ctx.registry.verseAction`); the shell renders all four.

## Alias overlays

Cross-references use localised abbreviations that are often absent from both the translation's book info and `category.json` (Tedim: `Siam`, `Sawl`, `2Kum`, …). `app/core/aliases/{identify}.json` maps them to book ids without touching either file.

```
npm run aliases -- tedim1932                 # dry run: report and suggestions
npm run aliases -- tedim1932 --apply         # write, keeping existing entries
```

A mapping is written only when the token matches exactly one book's name *and* the cited chapter:verse locations fit that book. Anything else is written as `null` (known, unmapped) and listed for review. Review the diff before committing.

Tedim status: 69.5% of reference parts resolve without the overlay, 92.7% with it (`Mang` → Revelation confirmed). `Thkna` and `Thna` stay `null` because they fit both Deuteronomy and Judges; they render as plain text with the reason in a tooltip, which is also how every unresolved reference behaves.

## Settings

Persisted per device in IndexedDB: last translation, book and chapter, the parallel selection, theme, accent, verse layout, synchronised scrolling and row alignment. The reading position is coalesced (250 ms); every other change is written at once, since a write started from `pagehide` is not reliably finished by the browser. Writes are coalesced (250 ms), so chapter stepping does not cost a transaction each time.

Export (Settings view, or the command palette) writes `lai-siangtho-settings-YYYY-MM-DD.json`:

```json
{ "app": "lai-siangtho", "schema": 1, "exportedAt": "…",
  "settings": { "translation": "tedim1932", "book": 43, "chapter": 7, "parallel": ["niv2011"],
                "theme": "dark", "accent": null, "layout": "paragraph",
                "syncScroll": true, "alignRows": true },
  "library": { "catalog": { "version": 260, "updated": "…" },
               "translations": [{ "identify": "tedim1932", "version": 3 }] } }
```

Notes and bookmarks travel with it, under `data`. Translation text is not (several MB each). Import restores the reading state, merges the notes and bookmarks, and lists the translations that are not installed here, with one button to download them. A file from another app, or a newer `schema`, is refused with a message naming the problem.

On desktop the export uses the browser download path, so the app's own save dialog appears; a target can route it through the native dialog instead by giving the feature a `saveFile` capability.
