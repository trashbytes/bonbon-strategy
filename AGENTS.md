# AGENTS.md — Bonbon Strategy

Guidance for AI agents working in this repository. This file is derived from the current source; keep it in sync when you change behavior or structure.

## What this is

A Home Assistant **Lovelace dashboard strategy**. It is not a card — HA calls the strategy's `generate(userConfig, hass)` and it returns a full dashboard (`{ views: [...] }`) built from Bubble Cards. Distributed via HACS as a `plugin` (see `hacs.json`).

- Entry point / custom element: `bonbon-strategy.js` → `customElements.define('ll-strategy-bonbon-strategy', BonbonStrategy)`.
- Users reference it as `type: custom:bonbon-strategy`.
- Requires `custom:bubble-card`. `mini-graph-card` and `card-mod` are optional but change behavior when present.

## File map

All modules are plain ES modules loaded in the browser. There is **no build step and no bundler**.

| File | Role |
| --- | --- |
| `bonbon-strategy.js` | `BonbonStrategy.generate()` — orchestrates everything. Uses top-level `await` and `import.meta.url`. |
| `bonbon-strategy-config.js` | Exports `miniGraphCardTemplate` and `defaultConfig` (`{ styles, card_defaults, card_variants, views }`; the `views → sections → cards` tree). |
| `bonbon-strategy-utils.js` | Color math (`getColorsFromColor`, `getAreaColors`, `getWeatherIcon`), `mergeDeep`, `normalizeSectionColumn`, `applySectionColumns`, `upgradeConfig`, `findDeprecatedOptions`. |
| `bonbon-strategy-templates.js` | `createTemplateApi(config, states, resolveEntities)` → `findTemplate`, `getCardTemplate`, `getTemplates`; plus `mergeCardVariants`, `applyCardDefaults`, `parseTemplateSelector`, `matchesSectionContext`, `isCustomCardInstalled`. Selector matching (entity part + `[view]`/`[section]` context filters), merging over `card_defaults`, placeholder resolution. |
| `bonbon-strategy-builders.js` | `createBuildersApi(panelUrl, config, states, templateApi)` → `createButtonCard` (also derives the icon actions from `button_action` via `applyIconActions`), `createSeparatorCard`, `createSubButton`, `createGrid`, `isTogglableEntity`, `hasBinaryState`. |
| `bonbon-strategy-styles.js` | `createStylesApi(panelUrl, config)` → `css`, `observeDarkMode`, `cssVariable`, `cssValue`, `getVariables`, `getStyles`. |
| `bonbon-strategy-entities.js` | `createEntityApi(ctx)` → entity prep, selector resolution, sorting, area/floor scoping. |
| `README.md` | User-facing documentation. **Source of truth for config options** — update it whenever you add or change a user-facing option. |
| `hacs.json` | HACS metadata (`filename: bonbon-strategy.js`). |
| `.github/workflows/validate.yaml` | CI: `hacs/action` validation (daily + manual). No tests, no lint, no typecheck. |
| `scripts/css-equivalence.mjs` | Dev gate for the style fragments: renders two versions of the styles module headlessly and compares the emitted CSS rule by rule (see "Testing / validating changes"). |

Local-only in use (never loaded by a HACS install): `bonbon-strategy-loader.js` — the dev instance registers it as the dashboard resource; it imports `bonbon-strategy.js` with a fresh `?hacstag` and logs the running `VERSION` plus the served files' `Last-Modified`. It is tracked, so it sits in the release archive, but nothing in the release references it. Gitignored scratch (do not assume anything here ships): `workspace.js` (commented-out scratch), `assets/`, `ftp*`, `.history/`.

## Architecture / data flow

1. `generate(userConfig, hass)` is called. It stores a per-dashboard global namespace `window.bonbon[hass.panelUrl]`, exposing `resolveEntity` / `resolveEntities` (used by runtime `:hide()` styles).
2. Config = `upgradeConfig(mergeDeep(defaultConfig, userConfigRest))`, with `card_variants` removed from the user config first (`card_defaults` stays in, so a user override deep-merges over the shipped skeleton). Card variants are merged by selector key (`mergeCardVariants`), not deep-merged into the selector strings, so a user override of `light.*` does not also override the dimmable `light.*[...]` default. Precedence is shipped defaults < deprecated section options < user variants: `applySectionSugars` writes the `[section=...]` entries of the global map (it may overwrite a shipped default but never a user variant), then `mergeCardVariants` folds the user's variants in last. At card build time `applyCardDefaults` merges `card_defaults` under the matched variant.
3. `createEntityApi` is built from `hass.entities/states/devices/floors/areas`; `prepareEntities` flattens device → area → floor and merges device labels onto entities.
4. Area colors are computed and written as CSS variables (`--area-<id>-{light,medium,shade}-color`) for light and dark; `observeDarkMode` swaps variables on `<html>`.
5. `bonbon_home` is expanded: `bonbon_areas` is replaced by one section per floor (`bonbon_floor_<floor_id>`), each containing one area card per area. Areas without a floor — and areas pointing at a floor that no longer exists — land in the synthetic `bonbon_floor__areas` section.
6. `bonbon_area` is expanded into a **subview per area** (`bonbon_area_<area_id>`). The area cards on the home view navigate into these subviews, so a disabled `bonbon_area` view renders them without an action instead of linking to a missing view.
7. Every remaining view's sections are sorted by `order`, resolved into cards, prefixed with a separator card, wrapped in a `grid`, and converted from an object map to a `sections` array via `applySectionColumns`.
8. `applyGlobalStyles` recursively injects Bubble Card / card-mod styling, then returns `{ views }`. Errors are caught and returned as a Markdown "Error" view.

Card generation no longer lives in the builders: every single-entity card comes from the single ordered map `config.card_variants`, merged over `config.card_defaults`. A selector is split into its entity part and optional `[view=...]`/`[section=...]` context filters; the filters match `sectionConfig.view` / `sectionConfig.key` (per-area views also answer to `bonbon_area`, custom views to their configured key), so scoping lives in the selector instead of a second map. **The last matching template wins**, so generic selectors must come first and label/attribute-specific variants last; `*` is only a fallback when nothing matched. Variant string values are resolved per entity (`entity.*`, `entity.attributes.*`, `area.*`), a variant whose effective `custom:` card is not installed is skipped, and `createButtonCard` only adds what depends on the section: `:hide()` runtime styles, the `prefix` name prefix and the deprecated `actions` layer. Matching resolves selectors with the default hidden/`entity_category` filtering widened (`[hidden=*][entity_category=*]`), so an entity a card selector pulls in that way still gets its domain variant instead of the `*` fallback. Explicit YAML card objects still win, because they are merged over the generated card last.

## Config model

`defaultConfig` shape: `{ styles, card_defaults, card_variants, views: { <viewKey>: { max_columns, subview?, disabled?, sections: { <sectionKey>: {...} } } } }`.

- Built-in views: `bonbon_home` (pushed first, title = dashboard title) and `bonbon_area` (templated per area, then deleted). Any other `views` key becomes a custom view with path `custom_<key>`.
- Sections are `disabled`-filtered and sorted by `order` (ascending, `Infinity` last).
- Section keys are meaningful: `bonbon_weather` and `bonbon_miscellaneous` have special handling in code, and `bonbon_area` sections use `area_id` scoping.
- `card_variants` is the shipping card catalogue: an ordered `selector → card` map. **Order matters** (last match wins): keep generic selectors before their label/attribute-specific variants and keep `*` last. Adding a new domain or card shape means adding a variant, not a branch in the builders.
- `card_defaults` is the skeleton every Bubble Card variant is deep-merged over (type, card_type, button_type, entity, name, the `more-info` `button_action`), so a variant only lists what differs. Inheritance applies **only** when the effective `type` is `custom:bubble-card` on both sides — weather forecast, Mini Graph and custom cards keep their own shape — and `inherit: false` on a variant opts out of it entirely (the key is stripped before the card is emitted).
- **Actions live in `button_action` only.** `createButtonCard` runs `applyIconActions` on every emitted Bubble Card: the card-level `tap_action` (the icon's target) is copied from `button_action.tap_action`, and `hold_action` becomes `more-info` (or, entity-less, the card's own `button_action.hold_action`) unless the card already sets one. Do not add a card-level `tap_action` to `defaultConfig` variants — it would only duplicate `button_action.tap_action` and drift. An explicit `tap_action`/`hold_action` from a user variant or the deprecated `actions` layer wins, because the helper only fills what is missing.
- The Mini Graph card exists once, as `miniGraphCardTemplate` exported from `bonbon-strategy-config.js`; `card_variants` and `applySectionSugars` both reuse it.
- The weather card ships a section-scoped default plus one label variant per `forecast_daily` / `forecast_hourly` / `forecast`, so labels still beat the section option.
- View/section scoping is a selector concern: `weather.*[section=bonbon_weather]` and `sensor.*[section=bonbon_environment]` in the shipped defaults, appended after the generic selectors so they win. There is no per-section variant map.
- `show_graphs` / `show_forecast` are deprecated and **must be removed in v4.0.0**: they still work as sugar that appends `[section=...]` variants to `config.card_variants` (existing entries win) but are absent from `defaultConfig`. New code adds variants, never a branch on these options.
- `actions` is deprecated and **must be removed in v4.0.0**; it is no longer part of `defaultConfig` and is applied to the generated Bubble card only when a user still configures it (`icon` → `tap_action`, `button` → `button_action.tap_action`). Explicit YAML card objects are spread over the result last, so they win over it.
- **Every deprecated option that still works must be listed in `findDeprecatedOptions` (`bonbon-strategy-utils.js`) with its replacement text.** The strategy reports them as a Markdown card at the top of the first view (home view, or the first view when home is disabled) plus one `console.warn`, so a losing back-compat mapping is visible without reading the source. Detection runs on the **raw user config before the merge**: the merged config contains the keys `upgradeConfig` derives from legacy ones (`show_weather_card` writes `show_forecast`), which would report the same option twice. Only section-level keys are inspected, so a card-level `show_forecast` (a `weather-forecast` property) is not mistaken for the section option.
- Cards in a section may be **entity selector strings**, YAML card objects, or a mix. Special token `area.<attribute>` (e.g. `area.temperature_entity_id`) is replaced by the current area's attribute during expansion.
- `mergeDeep` deep-merges plain objects but **replaces arrays wholesale** (arrays are not treated as mergeable objects). This matters for `cards`, `inline_buttons`, etc. `null`/`undefined` values in a source are **ignored** — an empty YAML node (`bonbon_persons:`) becomes `null` and means "not configured", so the shipped default behind it has to survive.
- `upgradeConfig` maps legacy/renamed options onto the new shape (e.g. `show_weather_card`, `show_temperature`, `show_floor_lights_toggle`). When you rename or restructure a config option, add a back-compat mapping here. The v2-era mappings are deprecated and **must be removed in v4.0.0**. Map an option only when it is actually set: the shipped defaults are authoritative, and an unconditional assignment (the weather section's `name`/`icon`/`separator_buttons` used to be) silently overrides user config.

## Entity selectors

Parsed in `resolveEntities` (`bonbon-strategy-entities.js`):

- Wildcards: `light.*`, `sensor.*battery`, `*temperature*` (converted to a regex over `entity_id`).
- Attribute filters: `[attr]` (truthy), `[attr=*]` (any value incl. falsy), `[attr=value|other]` (OR), and `*=`, `^=`, `$=`, `>`, `>=`, `<`, `<=`. Multiple `[..]` are AND.
- Special attribute keys: `label` maps to `labels`; `entity_category` and `hidden` are handled separately and affect the default filtering (by default hidden/diagnostic/config entities are excluded).
- Pseudo functions: `:not(<selector>)` (build-time exclusion) and `:hide(<selector>)` (runtime hide, `cards` only). They can be chained but not nested.
- Non-selector strings can also be a device id or a label name.
- Area/floor scoping: `withAreaScope`/`withFloorScope` append `[area_id=...]`/`[floor_id=...]` unless the selector already contains one. On cards, `area_id` / `bonbon_area_id` (string or array) override placement; `'*'` opts the card out of area scoping entirely.

### Labels used by the code

`favorite`, `hidden`, `nightlight`, `graph`/`graphs`, `forecast`, `forecast_daily`, `forecast_hourly`, `order_<n>` (and scoped `order_<view>_<section>_<n>` etc.), `color_<hex>` (areas). Each supports a `bonbon_`-prefixed alias via `entity.hasLabel()`.

Order and hidden labels are matched against the scopes `''`, `<viewScope>`, `<sectionKey>` and `<viewScope>_<sectionKey>` (later scope wins). Area views resolve their cards twice: once scoped to the area id, then again in the view transform scoped to the view key — `sectionConfig.order_scopes` (`[area_id, view_key]`) carries the area scope into that second pass, otherwise area-scoped order labels would be lost there.

## Styling

- `createStylesApi` namespaces every CSS variable per dashboard: `--bonbon-<panelUrl>-<suffix>` (`cssVariable` / `cssValue`).
- Dark mode is detected from `meta[name="color-scheme"]` via a `MutationObserver` (`observeDarkMode`), not from a `getStyles(isDark)` argument.
- `getStyles()` returns named fragments concatenated onto generated cards: `cardmodGlobal`, `bubbleGlobal`, `bubbleAreaBase`, `bubbleButtonNonBinary`, `bubbleSeparatorSubButtonBase`, `bubbleSeparatorLightsSubButtonAlways`, `bubbleSeparatorLightsSubButtonDefault`, `bubbleAreaSubButtonDefault`, `bubbleAreaSubButtonAlways`, `graphCard`, `haCardBase`. Cards opt in via `bonbon_styles: [...]`.
- Selector lists shared by several rules are defined once as the `containers` / `backgrounds` arrays plus `group(parts, suffix)` in `createStylesApi`, and the `:after` / `:hover:after` variants are derived with the suffix argument. The "show only the active sub-button" rules come from `hideInactive(scope, active)`. Add a repeated list or rule there instead of writing it out inline again; a second hand-written copy is what drifts first.
- Slider cards repurpose Bubble's own `.bubble-range-fill` (`bubbleGlobal`, scoped to `.bubble-button-slider-container`): full height, edge to edge, painted in `primary-accent-color`, so the filled part *is* the body colour. The empty remainder is dimmed by the fill's own `box-shadow: 0 0 0 100vmax rgba(0,0,0,.16)` — a shadow is drawn outside the border box, so only the part right of the fill (i.e. the empty remainder) is darkened, and the card's `clip-path` trims it to the rounded corners. The fill carries `z-index: 1` because it is inserted *before* the card wrapper and would otherwise sit under the body, `pointer-events: none` because it is a pure paint layer, and **every** layer above it is lifted with `.bubble-button-slider-container .bubble-wrapper > :not(.bubble-background) { position: relative; z-index: 2 }` — lifting only `.bubble-content-container` is not enough, the button card keeps name, icon and state as direct children of the wrapper, so the content stayed under the fill. The whole block is guarded with `:not(.is-dragging)`: an active drag must keep Bubble's own fill and value readout. The value readout (`.bubble-range-value`) keeps the surface text colour and is switched to white by `[data-bonbon-value-on-fill]` as soon as the fill edge passes it — Bubble publishes the fill position only as an inline `transform`, so `trackSliderValueContrast()` (registered once in `bonbon-strategy.js`) toggles that attribute on pointer events; it anchors on the `BUBBLE-CARD` in `composedPath()`, because the pointer lands on `.bubble-background` and never on `.bubble-range-slider`. Do not turn the fill back into a hairline without also re-checking the stacking (a clip or mask on the range wrapper creates a context that drops the fill below the body).
- Public CSS variables exposed to users for `card-mod` are all namespaced, e.g. `--bonbon-<panelUrl>-box-shadow`, `--bonbon-<panelUrl>-border-radius`, `--bonbon-<panelUrl>-card-background`, `--bonbon-<panelUrl>-primary-text-color`, `--bonbon-<panelUrl>-primary-accent-color`. Area colors are the exception: `--area-<area_id>-{light,medium,shade}-color`.

## Cache-busting (important)

`bonbon-strategy.js` imports its siblings with `?hacstag=${cacheTag}`. The tag comes from its own `import.meta.url`: HACS puts `hacstag` on the resource, a self-registered dashboard resource carries HA's `v` resource version instead, and `VERSION` is the last resort — it must never end up as `null`/`undefined`, because HA serves `/local/` with `Cache-Control: public, max-age=2678400` (31 days), so one `?hacstag=null` request pins every sibling to the first copy the browser saw and a newly added export arrives as `undefined`. The local dev loader (`bonbon-strategy-loader.js`, never part of a HACS install) appends a timestamp for local dev. **Every** module that needs a sibling does the same dynamic import (`bonbon-strategy-templates.js` → `bonbon-strategy-utils.js`, reusing the `hacstag` it was imported with); a plain static `import` loads a second, un-tagged copy that can be served stale. When editing modules locally, reload with a fresh `hacstag` (or the loader) or HA will serve stale files. **Do not hardcode or remove the `hacstag` query.**

## Versioning & release log

One line in the browser console must always answer "which release is running, and how old are the files".

- `bonbon-strategy.js` exports `VERSION` — the **only** place a version number lives. It ships to every HACS install and is printed in the load banner (`🍬 Bonbon Strategy v<version>`). Never duplicate it in another module, in `hacs.json` or in the README.
- The dev loader never carries a version. It reads `VERSION` from the imported module and adds the `Last-Modified` date of the served `/local/bonbon-strategy.js` (HEAD request, `cache: 'no-store'`), so `v<version> geladen — Dateien vom <date>` tells a released version from a local working copy at a glance. `fallbackUpdated` in the loader is only used when the server sends no `Last-Modified` header.
- **Every release bumps `VERSION` at least in the patch position** (minor for new options, major for the removals/breaking changes). While unreleased the value keeps a `-dev` suffix and names the version being worked toward; a tag may never carry it.
- **Minor versions are consecutive.** A release takes the minor directly after the last tag, never a jump (3.0.x → 3.1.0 → 3.2.0), however far ahead the feature set was planned. A skipped number cannot be filled afterwards without deleting and re-creating published tags.
- Release procedure, in one commit-ready sequence: `VERSION` without `-dev` → CHANGELOG `## Unreleased` becomes `## <version> — YYYY-MM-DD` → commit → tag `v<version>` → push the tag (HACS reads the tag, so the `hacstag` changes with it). Right after the tag, set `VERSION` to the next number with `-dev` again, so a dev deploy never reports a released version.
- `VERSION` and the tag must never disagree: a tag whose `VERSION` differs is a bug, not a detail.

## Conventions

- Formatting: Prettier with `tabWidth: 2`, `singleQuote: true`, `printWidth: 120` (`.prettierrc`). Match surrounding style; there is no lint gate.
- Keep the `defaultConfig` tree shape stable — `bonbon-strategy.js` reads fixed paths like `config.views.bonbon_home.sections.bonbon_areas` and `config.views.bonbon_area.sections.bonbon_lights`.
- `defaultConfig` is cloned, not mutated, but `upgradeConfig` and later code mutate the merged config in place — be deliberate about mutating shared objects.
- Runtime `:hide()` builds a JS string (in `createButtonCard`) that Bubble Card evaluates and that calls back into `window.bonbon[panelUrl]`. It is string-assembly-fragile: changing `resolveEntity` signatures or the `window.bonbon` namespace will break hiding.

## Intentional decisions (do not report as bugs)

Behaviors that look wrong at first glance but are deliberate. Add an entry here every time a review or a change decides to keep something surprising on purpose, so a later pass does not "fix" it.

- **Floors are not sorted by `level`.** The floor sections follow the order of `hass.floors`, and that order is the priority the user wants (a ground floor can be more important than an upper floor, so `level` is not a valid sort key). `floor.level` only feeds the fallback icon. Do not add a `level` sort, and do not "fix" the order of the floor sections.
- **Area cards always use `rows: 1.4`** as soon as the section configures `inline_buttons`, even when none of them resolve for that area. The height has to stay identical across all area cards of a view.
- **Area cards do not inherit `card_defaults`.** They are entity-less cards built from the fixed passive fallback shape in `getFallbackCard`; a `card_defaults` override is not supposed to reach them (a `more-info` tap action or an `entity.entity_id` placeholder would be meaningless there).

## Commits

Commits are authored as `trashbytes <10084665+trashbytes@users.noreply.github.com>` (configured repo-wide, keep it that way — never commit under a different identity). Messages are English, lowercase, single-line, and describe the behavior change (`render dimmable lights as brightness sliders instead of toggles`). No conventional-commit prefixes and no issue references in the subject.

Work directly on short-lived branches and delete them **immediately after the merge**: `git branch -d <branch>` plus `git push origin --delete <branch>`, then `git fetch --prune`. `main` is the only branch that survives a completed merge; leftovers are stale by definition and hide what is actually released.

## Testing / validating changes

There is no test suite. Validate by:

0. For a change to `bonbon-strategy-styles.js`, prove the emitted CSS did not move: copy the file first (`cp bonbon-strategy-styles.js /tmp/styles-baseline.js`), edit, then `node scripts/css-equivalence.mjs /tmp/styles-baseline.js bonbon-strategy-styles.js`. It renders `getVariables()` and every `getStyles()` fragment for a light and a styled config and exits 0 only when the rule sets are equal. CSS whitespace is insignificant, so rebuilding a selector list from an array passes, while a changed value, a dropped `!important`, a dropped selector part or a reordered rule fails. This gate covers the styles module only — the card/template behavior still needs step 1.
1. Loading the strategy in a real Home Assistant instance (HACS install, or copy the `bonbon-strategy-*.js` files to `<config>/www/` and add `/local/bonbon-strategy.js` as a resource, then clear the frontend cache). The local dev instance registers `/local/bonbon-strategy-loader.js`, which imports the modules with a fresh `hacstag` on every page load, so writing the modules into its `/config/www` is all a deploy needs — no HA restart. The reference dashboard is the instance's default one (path `my-dashboard`, title „Übersicht"); pick a slider card there (the living-room Zigbee lamp, "Wohnzimmer E27") for anything touching the range fill.
2. Checking the browser console — thrown errors surface as an "Error" view.
3. CI only checks HACS metadata via `.github/workflows/validate.yaml`; keep `hacs.json` valid.

## Verifying a style change on the real frontend (do this, do not simulate)

A mock proves nothing here: the card is a `custom:bubble-card` whose shadow DOM, stacking contexts and Bubble's own rules decide the outcome. Every claim about the rendering needs a measurement or screenshot from the running dashboard.

1. **Deploy, then prove the bytes.** Copy the changed module into `<config>/www` and compare `md5sum` of the local file against the bytes served from `/local/<file>?<cache-buster>` over HTTP. A "successful" copy is not a deployed file (see "Dev deploy").
2. **Establish the session and make the tab visible before measuring anything.** A fresh automation browser lands on `/auth/authorize`; log in through the browser vault (never put credentials in the repo or the chat). Then **`Page.bringToFront`** — this is the step that cost hours: HA's `hui-root` renders a view only while the document is visible, so in a backgrounded headless tab the dashboard stays empty (`hui-view-container.view` stays null, 0 `hui-card`, no error in the console) even though `lovelace.config.views` is fully populated. After every navigation and reload, bring the tab to front again and assert a recursive count of `bubble-card` > 0 before reading any style.
3. **Force the module reload.** HA is an SPA: switching views does not re-import the strategy, and `/local/` is served with `max-age` in weeks. Reload with the cache bypassed (`Page.reload { ignoreCache: true }` via CDP, or a hard reload in the UI) and re-check the console banner (`Bonbon Strategy v<version> geladen — Dateien vom <date>`) before trusting any measurement.
4. **Read the live values.** Find the card by its config entity, then read `getComputedStyle` for the properties the rule sets (e.g. `.bubble-range-fill` → `z-index`, `height`, `background-color`, `box-shadow`; the card wrapper and its children for stacking). Computed values are the only proof that a rule matched.
5. **Take a screenshot as visual proof.** `Page.captureScreenshot` with a clip in **page** coordinates (viewport rect plus `scrollX/scrollY`), `scale: 3`, then crop and inspect the pixels (the tools venv has Pillow). Compare the colour inside and outside the filled area instead of eyeballing a thumbnail.
6. **Only then report.** Say what was measured (numbers, colours, element positions), not what the CSS was supposed to do.

### Stacking of the slider card (why rules "do nothing" here)

- `.bubble-range-fill` is inserted into `.bubble-range-slider` **before** `.bubble-wrapper`, so it paints under the card body unless it gets an explicit `z-index`.
- `.bubble-wrapper` is `position: absolute` without a `z-index`; what has to be lifted are the leaves that paint the content, not the wrapper's children.
- A `clip-path` or `mask` on the range wrapper creates a stacking context and drops the fill below the body again — that is why those variants made the line vanish entirely.
- `.bubble-content-container` and `.bubble-buttons-container` use `display: contents`; **`z-index` has no effect on a box-less element**, so lifting the wrapper's children does nothing. Lift the leaves (`.bubble-name-container`, `.bubble-icon-container`, `.bubble-sub-button-container`) instead.
- Never put backticks into a comment inside `bonbon-strategy-styles.js`: every fragment is a template literal, and one backtick ends the string with a `ReferenceError` at module load.
- `::after` on the card container is not a reliable overlay: it loses against the wrapper's stacking context.
- A slider card can be simulated without touching a dashboard: add `bubble-button-slider-container` to a normal button card's container in the console. Bubble sets the same class, so the clip, the shadow rules and the stacking behave exactly as on a real slider — that is how the clipped shadow overlay was found and fixed.

## Dev deploy (standing rule)

The user tests on his live dev instance, so a change that plausibly works is deployed to it right away and then reported — do not wait to be asked, but always say that it is deployed (and which files) so he can test immediately.

1. Copy the changed `bonbon-strategy-*.js` modules into `<config>/www` (write route, credentials and traps: `home-assistant-config` skill, `references/config-file-access.md` — the Advanced SSH add-on is started and stopped around the copy).
2. Verify over HTTP that `/local/<file>` serves the new bytes (`md5sum` against the local file), not from the SSH shell.
3. Verify at the real interface before reporting: reload with the cache bypassed, prove the dashboard actually rendered, read the computed values and take a screenshot (see "Verifying a style change on the real frontend"). "Deployed" is not "works".
4. Tell the user it is live; the dev loader appends a fresh `hacstag`, so a dashboard reload is enough. The console then shows `Bonbon Strategy v<version> geladen — Dateien vom <date>`; name that line (and the date it should show) so he can confirm the deploy took effect.

## When you change something

- User-facing option → update `README.md` and `defaultConfig` (and `upgradeConfig` if it replaces an old option).
- Deprecating an option → add it to `findDeprecatedOptions` with the option that replaces it (that list is what the dashboard notice and the README table show), and note the removal version in `README.md`. The notice card is `custom:bonbon-deprecation-notice`, defined in `bonbon-strategy.js`; it renders its own shadow DOM and stores the dismissal per dashboard under `bonbon-deprecation-dismissed:<panelUrl>` = the running `VERSION`, so it reappears after an update. Never give it a fixed version — it must follow `VERSION`.
- Release → bump `VERSION` in `bonbon-strategy.js` and turn the CHANGELOG `## Unreleased` heading into the released version with its date (see "Versioning & release log").
- New style fragment → add it to `getStyles()` and document its name if users select it via `bonbon_styles`.
- New selector syntax → update the README "Entity selectors" section and the parser in `bonbon-strategy-entities.js`.
