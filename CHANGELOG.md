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
