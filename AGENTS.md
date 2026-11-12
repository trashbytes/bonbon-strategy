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
| `bonbon-strategy-utils.js` | Color math (`getColorsFromColor`, `getAreaColors`, `getWeatherIcon`), `mergeDeep`, `normalizeSectionColumn`, `applySectionColumns`, `upgradeConfig`. |
| `bonbon-strategy-templates.js` | `createTemplateApi(config, states, resolveEntities)` → `findTemplate`, `getCardTemplate`, `getTemplates`; plus `mergeCardVariants`, `applyCardDefaults`, `parseTemplateSelector`, `matchesSectionContext`, `isCustomCardInstalled`. Selector matching (entity part + `[view]`/`[section]` context filters), merging over `card_defaults`, placeholder resolution. |
| `bonbon-strategy-builders.js` | `createBuildersApi(panelUrl, config, states, templateApi)` → `createButtonCard`, `createSeparatorCard`, `createSubButton`, `createGrid`, `isTogglableEntity`, `hasBinaryState`. |
| `bonbon-strategy-styles.js` | `createStylesApi(panelUrl, config)` → `css`, `observeDarkMode`, `cssVariable`, `cssValue`, `getVariables`, `getStyles`. |
| `bonbon-strategy-entities.js` | `createEntityApi(ctx)` → entity prep, selector resolution, sorting, area/floor scoping. |
| `README.md` | User-facing documentation. **Source of truth for config options** — update it whenever you add or change a user-facing option. |
| `hacs.json` | HACS metadata (`filename: bonbon-strategy.js`). |
| `.github/workflows/validate.yaml` | CI: `hacs/action` validation (daily + manual). No tests, no lint, no typecheck. |

Local-only / gitignored (do not assume they ship): `bonbon-strategy-loader.js` (dev cache-busting loader that appends `?hacstag=<timestamp>`), `workspace.js` (commented-out scratch), `assets/`, `ftp*`, `.history/`.

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
- `card_defaults` is the skeleton every Bubble Card variant is deep-merged over (type, card_type, button_type, entity, name, the `more-info` default actions), so a variant only lists what differs. Inheritance applies **only** when the effective `type` is `custom:bubble-card` on both sides — weather forecast, Mini Graph and custom cards keep their own shape — and `inherit: false` on a variant opts out of it entirely (the key is stripped before the card is emitted).
- The Mini Graph card exists once, as `miniGraphCardTemplate` exported from `bonbon-strategy-config.js`; `card_variants` and `applySectionSugars` both reuse it.
- The weather card ships a section-scoped default plus one label variant per `forecast_daily` / `forecast_hourly` / `forecast`, so labels still beat the section option.
- View/section scoping is a selector concern: `weather.*[section=bonbon_weather]` and `sensor.*[section=bonbon_environment]` in the shipped defaults, appended after the generic selectors so they win. There is no per-section variant map.
- `show_graphs` / `show_forecast` are deprecated and **must be removed in v4.0.0**: they still work as sugar that appends `[section=...]` variants to `config.card_variants` (existing entries win) but are absent from `defaultConfig`. New code adds variants, never a branch on these options.
- `actions` is deprecated and **must be removed in v4.0.0**; it is no longer part of `defaultConfig` and is applied to the generated Bubble card only when a user still configures it (`icon` → `tap_action`, `button` → `button_action.tap_action`). Explicit YAML card objects are spread over the result last, so they win over it.
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
- Public CSS variables exposed to users for `card-mod` are all namespaced, e.g. `--bonbon-<panelUrl>-box-shadow`, `--bonbon-<panelUrl>-border-radius`, `--bonbon-<panelUrl>-card-background`, `--bonbon-<panelUrl>-primary-text-color`, `--bonbon-<panelUrl>-primary-accent-color`. Area colors are the exception: `--area-<area_id>-{light,medium,shade}-color`.

## Cache-busting (important)

`bonbon-strategy.js` imports its siblings with `?hacstag=${hacstag}` read from its own `import.meta.url`. HACS supplies the tag in production; the gitignored `bonbon-strategy-loader.js` appends a timestamp for local dev. **Every** module that needs a sibling does the same dynamic import (`bonbon-strategy-templates.js` → `bonbon-strategy-utils.js`); a plain static `import` loads a second, un-tagged copy that can be served stale. When editing modules locally, reload with a fresh `hacstag` (or the loader) or HA will serve stale files. **Do not hardcode or remove the `hacstag` query.**

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

## Testing / validating changes

There is no test suite. Validate by:

1. Loading the strategy in a real Home Assistant instance (HACS install, or copy the `bonbon-strategy-*.js` files to `<config>/www/` and add `/local/bonbon-strategy.js` as a resource, then clear the frontend cache). The local dev instance registers `/local/bonbon-strategy-loader.js`, which imports the modules with a fresh `hacstag` on every page load, so writing the modules into its `/config/www` is all a deploy needs — no HA restart.
2. Checking the browser console — thrown errors surface as an "Error" view.
3. CI only checks HACS metadata via `.github/workflows/validate.yaml`; keep `hacs.json` valid.

## When you change something

- User-facing option → update `README.md` and `defaultConfig` (and `upgradeConfig` if it replaces an old option).
- New style fragment → add it to `getStyles()` and document its name if users select it via `bonbon_styles`.
- New selector syntax → update the README "Entity selectors" section and the parser in `bonbon-strategy-entities.js`.
