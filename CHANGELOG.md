# Changelog

## Unreleased

### Deprecation notice in the dashboard

A dashboard that still uses a deprecated option now says so where you see it: a Markdown card at the top of the
first view names the option's path in the config and the option that replaces it, and the same list is logged to
the browser console. Nothing else changes — every deprecated option keeps working until v4.0.0 — and the card
disappears as soon as the config no longer contains it.

The notice is derived from the raw user config, before the defaults are merged, so it never fires on the shipped
config and an option that `upgradeConfig` derives (`show_weather_card` → `show_forecast`) is not reported twice.
It covers `actions`, the section options `show_graphs` and `show_forecast`, and the v2-era options
(`show_weather_card`, `weather_entity_id`, `show_temperature`, `show_humidity`, `show_co2`,
`show_floor_lights_toggle`, `show_area_lights_toggle`).

### Slider value fill

Bubble Card paints the range fill proportionally, but the generated cards force the whole body to the accent colour
when an entity is on — so once the drag ended a light looked purely binary. The fill is therefore full height and
edge to edge again: the filled part is painted in the body's accent (exactly the configured colour), and the empty
remainder is dimmed 16 % by the fill's own spread shadow, so the active area keeps its colour while the rest reads as
inactive. The icon and name are lifted above the fill so they stay readable. While the card is being dragged nothing
changes — Bubble's own fill and value readout stay exactly as they were, except that the readout switches to white as
soon as the fill edge passes its centre (Bubble exposes the fill only as an inline transform, so a small pointer hook
toggles the attribute the stylesheet reacts to).

### Icon actions

The icon and the card body are separate action targets in Bubble Card: the body follows `button_action`, the icon
the card-level `tap_action`/`hold_action`. The generated cards only configured the body, so long-pressing the icon
did nothing and the two could drift apart.

- The icon now taps exactly like the button: `applyIconActions` copies `button_action.tap_action` onto the card
  level (toggle on lights, switches and friends, press on `button.*`/`input_button.*`, more-info elsewhere).
- Long-pressing the icon opens `more-info`. Cards that define their own hold action keep it — the area cards still
  navigate to the area settings on the icon.
- Card-level `tap_action` entries were dropped from `defaultConfig` and the shipped variants: `button_action` is
  the single source, so the two can no longer disagree. Your own `tap_action`/`hold_action` in `card_defaults` or
  a variant still overrides the derived value, and double-tap stays unset.

### Version in the console log

The strategy now logs the release it is running: `bonbon-strategy.js` exports `VERSION` and prints it in the load
banner (`🍬 Bonbon Strategy v3.2.0`). The dev loader adds the served files' `Last-Modified` date
(`Bonbon Strategy v3.2.0-dev geladen — Dateien vom 19.11.2026, 12:40:07`), so a released version can be told apart
from a local working copy without opening a file. Both are dev-only output — no config, no visual change.

### Card variants

Every card that Bonbon generates for an entity is now coming from a **card variant** instead of being built by
hard-coded, domain-specific logic. Variants are matched to entities by an entity selector and are merged over the
shared `card_defaults` skeleton, so weather forecasts, Mini Graph cards and Bubble Cards are all handled the same way.

- New top-level config key `card_variants`: an ordered map of `entity selector -> card definition`. The **last
  matching variant wins**, so generic variants come first and more specific ones follow; the `*` catch-all
  is only used when nothing else matched.
- New top-level config key `card_defaults`: the skeleton every Bubble Card variant is deep-merged over (`type`,
  `card_type`, `button_type`, `entity`, `name`, the default `more-info` actions). A variant only lists what differs
  from it; non-Bubble variants (weather forecast, Mini Graph, custom cards) inherit nothing, and `inherit: false`
  opts a variant out.
- Variant selectors support context filters `[view=...]` and `[section=...]`, matched against the view and
  section a card is rendered in instead of the entity. This replaces per-section variant maps: the shipped
  environment graph variants and the weather card scoping are regular entries in the global map
  (`sensor.*[section=bonbon_environment]`, `weather.*[section=bonbon_weather]`).
- Variant string values support placeholders, resolved per matched entity: `entity.entity_id`, `entity.name`,
  `entity.area`, `entity.area_id`, `entity.floor`, `entity.floor_id`, `entity.device`, `entity.device_id`,
  `entity.labels`, any `entity.attributes.<attribute>` and `area.<attribute>`.
- Variants using a custom card that is not installed are skipped, so the next matching variant applies.
- The `forecast_daily`, `forecast_hourly` and `forecast` labels keep working: they ship as label-scoped variants
  and win over a section's `show_forecast`.
- Precedence: `card_defaults` < shipped variant < deprecated section options (`show_graphs`, `show_forecast`) <
  your own variants.
- `show_graphs` and `show_forecast` are **deprecated** and will be **removed in v4.0.0**. They keep working
  (applied as `[section=...]` variants in the global map, which a variant you wrote for that section
  overrides) but are no longer part of the shipped defaults.

The shipped variants reproduce the previous appearance: dimmable lights as brightness sliders, all other lights
and togglable domains as switches, climate, media player, cover and select cards, persons and binary sensors as
state cards, and a fallback state card for everything else. `button.*` and `input_button.*` press the entity
instead of toggling it, which never did anything on those domains.

### Deprecated: `actions`

The `actions` option is deprecated in favour of card variants and no longer has a default. If you continue to
configure it, it is still applied on top of the generated Bubble card, exactly as before — an explicit YAML card
in `cards` still wins over it. **Please migrate your `actions` block to card variants:** copy the domain you
customized into `card_variants` and set
`tap_action`/`button_action.tap_action` explicitly, as shown in the README ("Deprecated: button actions").

### Fixed

- The weather section keeps its configured `name`, `icon` and `separator_buttons` again. `upgradeConfig` mapped
  `show_weather_card` / `weather_entity_id` by forcing the section to `auto` on every run, which overrode user
  config and made the documented translation example impossible.
- A `card_mod` block in object form (`style: { 'ha-card': … }`) is passed through unchanged instead of being
  string-concatenated into `[object Object]`.
- `order_<area_id>_<number>` labels survive the second resolution pass in area views, where cards used to be
  re-sorted alphabetically.
- Sections that share a fixed column keep their generated card-mod styles (`display` / row-gap variables), so
  `:hide()`-based empty-section hiding works in multi-column views.
- Areas pointing at a floor that no longer exists are shown in the "Areas" section instead of disappearing, and an
  area without a `labels` array no longer throws.
- `inline_buttons: null` no longer breaks the area card, and Mini Graph cards get their `line_color` even when
  card-mod is not installed.
- Entities that a selector pulls in with `[hidden=*]` or `[entity_category=*]` keep their card variant:
  variant matching resolves selectors without the default hidden/diagnostic filtering, so such an entity
  is no longer rendered as the plain `*` fallback card.
- An empty YAML node (`bonbon_persons:`, `styles:`, `views:`) means "not configured" instead of crashing
  the dashboard: `mergeDeep` ignores `null`/`undefined` values, so the shipped default stays in place.
- `card_mod` in string shorthand (`card_mod: "ha-card { … }"`) no longer throws; it is used as the style
  and the global CSS is prepended to it. Object forms are still passed through unchanged.
- Area cards no longer link into area views that were disabled (`bonbon_area: { disabled: true }`), and
  they no longer receive the `bubbleButtonNonBinary` styles, which only apply to cards with an entity.
- The deprecated section options tolerate `inline_buttons` / `cards` being a single selector, `null` or
  `false` instead of an array.
- Documentation: the manual install list names `bonbon-strategy-templates.js`, the CSS variables use their real
  per-dashboard names (`--bonbon-<panelUrl>-…`), and the `order_<view_key>_…` examples use the actual view key.
