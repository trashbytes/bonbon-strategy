## Copilot / AI agent instructions — Bonbon Strategy

This repository implements a Home Assistant Lovelace "strategy" that generates a colorful dashboard using the `BonbonStrategy` class. Use these focused notes to make productive code changes quickly.

- **Big picture**: `BonbonStrategy.generate(userConfig, hass)` builds dashboard views from Home Assistant state (`hass`). The generator is in [bonbon-strategy.js](bonbon-strategy.js#L1-L120). Configuration shape comes from [bonbon-strategy-config.js](bonbon-strategy-config.js#L1-L200).
- **Primary files**:
  - [bonbon-strategy.js](bonbon-strategy.js#L1-L120) — main generator logic and view composition.
  - [bonbon-strategy-config.js](bonbon-strategy-config.js#L1-L200) — `defaultConfig` structure (views → sections → cards).
  - [bonbon-strategy-styles.js](bonbon-strategy-styles.js#L1-L80) — `getStyles(isDark)` and `css` helper for theme-aware styles.
  - [bonbon-strategy-utils.js](bonbon-strategy-utils.js#L1-L200) — small helpers: `mergeDeep`, `getAllEntityIds`, `androidGesturesFix`.
  - [bonbon-strategy-loader.js](bonbon-strategy-loader.js#L1-L40) — simple cache-busting loader used for local installs.

- **Key patterns and conventions** (do not change without checking related code):
  - Entities are identified by entity_id prefixes: `light.`, `switch.`, `climate.`, `media_player.`, `binary_sensor.*_contact`, `cover.` — logic in `bonbon-strategy.js` filters by these prefixes.
  - Entity labels drive behaviour: look for `favorite`, `hidden`, `mainlight`, `nightlight` and prefixed variants `bonbon_*` — used heavily to include/exclude or rank items.
  - Areas & floors: code reads `hass.areas` and `hass.floors` and assigns colors per area; area IDs and `area_id` are authoritative for placement.
  - Config merging: `defaultConfig` is merged with user config using `mergeDeep` (preserve keys and nested shapes).
  - Styles: `getStyles(isDark)` returns several CSS fragments; components expect style fragments like `styles.global` or `styles.bubbleSubButtonRegular`.

- **Integration / dependencies**:
  - Requires `custom:bubble-card`. `mini-graph-card` and `card-mod` are recommended but optional (see README installation section).
  - The loader appends `?hacstag=<timestamp>` to imports for cache-busting — preserve this for dev/test reloads.

- **Developer workflows** (doc the practical steps):
  - No build step — the JS files are ES modules consumed by the browser/HA frontend. To test locally, copy `bonbon-strategy.js` to `<config>/www/bonbon-strategy.js` and use `bonbon-strategy-loader.js` or add `/local/bonbon-strategy.js` as a HA resource (see [README.md](README.md#L1-L40)).
  - When editing modules, update the `hacstag` (loader does this automatically) to avoid stale caches in HA frontend.
  - Keep `defaultConfig` shape stable; changing node names under `views` or `sections` requires updates across `bonbon-strategy.js` usage sites.

- **What to look out for when changing logic**:
  - Many filters rely on `entity.hidden`, `entity.labels`, and `entity.entity_category` to exclude system/internal entities — ensure tests or examples cover labeling changes.
  - Entity collection functions use `getAllEntityIds` to extract nested entity ids from card-like config objects — update that helper if you introduce new card shapes.
  - UI behaviors (e.g., floor light toggles) generate call-service payloads dynamically; keep the shape intact to avoid breaking front-end actions.

- **Quick examples**:
  - Favorites detection: search `e.labels?.includes('favorite')` in [bonbon-strategy.js](bonbon-strategy.js#L1-L120).
  - Color assignment for areas: see area color calculations in [bonbon-strategy.js](bonbon-strategy.js#L120-L280).

If anything above looks incomplete or you want more examples (line-precise links, unit-test guidance, or a short dev-run checklist), tell me which area to expand.
