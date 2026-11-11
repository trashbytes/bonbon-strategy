# Changelog

## Unreleased

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
- Documentation: the manual install list names `bonbon-strategy-templates.js`, the CSS variables use their real
  per-dashboard names (`--bonbon-<panelUrl>-…`), and the `order_<view_key>_…` examples use the actual view key.
