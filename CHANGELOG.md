# Changelog

## Unreleased

### Card templates

Every card that Bonbon generates for an entity is now coming from a **card template** instead of being built by
hard-coded, domain-specific logic. Templates are matched to entities by an entity selector and are complete card
definitions, including `type`, so weather forecasts, Mini Graph cards and Bubble Cards are all handled the same way.

- New top-level config key `card_templates`: an ordered map of `entity selector -> card definition`. The **last
  matching template wins**, so generic templates come first and more specific variants follow; the `*` catch-all
  is only used when nothing else matched.
- Template selectors support context filters `[view=...]` and `[section=...]`, matched against the view and
  section a card is rendered in instead of the entity. This replaces per-section template maps: the shipped
  environment graph templates and the weather card scoping are regular entries in the global map
  (`sensor.*[section=bonbon_environment]`, `weather.*[section=bonbon_weather]`).
- Template string values support placeholders, resolved per matched entity: `entity.entity_id`, `entity.name`,
  `entity.area`, `entity.area_id`, `entity.floor`, `entity.floor_id`, `entity.device`, `entity.device_id`,
  `entity.labels`, any `entity.attributes.<attribute>` and `area.<attribute>`.
- Templates using a custom card that is not installed are skipped, so the next matching template applies.
- The `forecast_daily`, `forecast_hourly` and `forecast` labels keep working: they ship as label-scoped default
  templates and win over a section's `show_forecast`.
- Precedence: shipped defaults < deprecated section options (`show_graphs`, `show_forecast`) < your own
  templates.
- `show_graphs` and `show_forecast` are **deprecated** and will be **removed in v4.0.0**. They keep working
  (applied as `[section=...]` templates in the global map, which a template you wrote for that section
  overrides) but are no longer part of the shipped defaults.

The shipped defaults reproduce the previous appearance: dimmable lights as brightness sliders, all other lights
and togglable domains as switches, climate, media player, cover and select cards, persons and binary sensors as
state cards, and a fallback state card for everything else.

### Deprecated: `actions`

The `actions` option is deprecated in favour of card templates and no longer has a default. If you continue to
configure it, it is still applied as the last layer to Bubble buttons, exactly as before. **Please migrate your
`actions` block to card templates:** copy the domain you customized into `card_templates` and set
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
