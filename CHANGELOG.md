# Changelog

## Unreleased

### Card templates

Every card that Bonbon generates for an entity is now coming from a **card template** instead of being built by
hard-coded, domain-specific logic. Templates are matched to entities by an entity selector and are complete card
definitions, including `type`, so weather forecasts, Mini Graph cards and Bubble Cards are all handled the same way.

- New top-level config key `card_templates`: an ordered map of `entity selector -> card definition`. The **last
  matching template wins**, so generic templates come first and more specific variants follow; the `*` catch-all
  is only used when nothing else matched.
- New section key `sections.<key>.card_templates`: the same shape, matched after the global map, so a
  section-scoped template always wins over a global one. The built-in environment section ships its graph
  templates this way instead of setting `show_graphs`.
- Template string values support placeholders, resolved per matched entity: `entity.entity_id`, `entity.name`,
  `entity.area`, `entity.area_id`, `entity.floor`, `entity.floor_id`, `entity.device`, `entity.device_id`,
  `entity.labels`, any `entity.attributes.<attribute>` and `area.<attribute>`.
- Templates using a custom card that is not installed are skipped, so the next matching template applies.
- `show_graphs` and `show_forecast` are **deprecated**. They keep working (applied after your own section
  templates) but are no longer part of the shipped defaults and will be removed in a future version. Use
  `sections.<key>.card_templates` instead.

The shipped defaults reproduce the previous appearance: dimmable lights as brightness sliders, all other lights
and togglable domains as switches, climate, media player, cover and select cards, persons and binary sensors as
state cards, and a fallback state card for everything else.

### Deprecated: `actions`

The `actions` option is deprecated in favour of card templates and no longer has a default. If you continue to
configure it, it is still applied as the last layer to Bubble buttons, exactly as before. **Please migrate your
`actions` block to card templates:** copy the domain you customized into `card_templates` and set
`tap_action`/`button_action.tap_action` explicitly, as shown in the README ("Deprecated: button actions").
