# 🍬 Bonbon Strategy

Bonbon Strategy is a Home Assistant strategy which automatically generates a colorful dashboard using Bubble Cards. It's fully featured right out of the gate but can be expanded and customized.

<img width="4270" alt="preview" src="preview.png?v=3" />

- Left: Home View (with Atmospheric Weather Card, which has been deleted after a lot of enshittification, unfortunately)
- Middle: Area View (with [Mini Graph Card](https://github.com/kalkih/mini-graph-card))
- Right: Custom View (with `binary_sensor.*contact[device_class=door]` and `...[device_class=window]`)

## Preparations

Bonbon Strategy works best with a well-organized Home Assistant setup:

- **Floors and Areas**: Properly define your floors and areas with descriptive names and appropriate icons, order them appropriately
- **Devices and Entities**: Assign devices and/or entities to their respective areas
- **Organization**: Use the standard Home Assistant features like the Visibility toggle or the labels system to order your entities and control visibility

By default, disabled and hidden entities won't be displayed in Bonbon Strategy. However, you can override this behavior using attribute selectors in your custom sections and cards. For example, `[hidden=*]` includes all entities regardless of hidden status, and `[entity_category=*]` includes diagnostic entities that are typically hidden.

See the **Wildcards and attribute selectors** section for more details on how to include hidden and diagnostic entities.

## Supported features

These features and domains are included by default and will "just work".

- Weather
- Persons
- Favorites (add the label `favorite` to an entity)
- Floors
- Areas (add the label `hidden` to hide an area, or `color_XXXXXX` to set a custom color)
- Vacuums and Lawn Mowers
- Locks
- Temperature, Humidity and CO2
- Scenes and Scripts
- Lights (dimmable lights as brightness sliders, others as toggles)
- Switches and Buttons
- Media Players
- Climate (HVAC), Fans and Humidifiers
- Covers (Shutters & Shades)
- Openings (Doors & Windows)
- Valves and Water Heaters
- Miscellaneous (almost everything that isn't part of the above)
- Custom views, sections and cards (see configuration)

You can hide anything with the label `hidden` or by disabling the `Visible` setting.

All entities are ordered alphabetically by default but are grouped by device, if they are in the same section.

You can override the order of entities by adding labels like `order_<number>`. They will be sorted in ascending order.

To sort entities in several different views and/or sections independently and differently from each other, you can add more specific labels like `order_home_<number>`, `order_<area_id>_<number>`, `order_<view_key>_<number>`, `order_home_<section_key>_<number>`, `order_<area_id>_<section_key>_<number>` or `order_<view_key>_<section_key>_<number>` etc. A greater specificity gives it a higher priority and will thus override lower priority labels.

You can add the label `nightlight` to lights to exclude them from area and floor toggles.

Lights that report dimming support are rendered as Bubble Card sliders, all other lights as toggles. Dimming support is read from the light's `supported_color_modes`, so it also works while the light is off. Custom YAML cards keep their own `button_type`.

You can add the label `graph` to render the entity using Mini Graph Card instead of Bubble Card (if installed).

You can add the prefix `bonbon_` to any of these labels in case it interferes with your setup.

## Dependencies

This dashboard strategy needs [Bubble Card](https://github.com/Clooos/Bubble-Card).

[Mini Graph Card](https://github.com/kalkih/mini-graph-card) and [Card Mod](https://github.com/thomasloven/lovelace-card-mod) are highly recommended, but optional.

Please check the respective repositories on how to install them and do that, before you proceed.

## Installation

Bonbon Strategy can be installed manually or by using HACS. If you choose to use HACS you can instally any updates with a single click! It's the recommended way to use Bonbon Strategy.

### With HACS (recommended):

1. Make sure Bubble Card is installed!
2. Open HACS > `⋮` > `Custom repositories` type `https://github.com/trashbytes/bonbon-strategy` and select `Dashboard` then add
3. Search for `Bonbon Strategy`, make sure that you have no filters set
4. Click `Download` and install
5. Go to `Settings` > `Dashboards` > `Add dashboard` > `New empty dashboard` then create
6. Go to the new `Dashboard` > `✎` > `Raw configuration`, paste the configuration from below, then save
7. Clear your frontend cache!

### Without HACS:

1. Make sure Bubble Card is installed!
2. Download `bonbon-strategy.js`, `bonbon-strategy-builders.js`, `bonbon-strategy-config.js`, `bonbon-strategy-entities.js`, `bonbon-strategy-styles.js`, `bonbon-strategy-utils.js`,
3. Place them in `<config>/www/` (restart HA if `/www` didn't exist!)
4. Go to `Settings` > `Dashboards` > `⋮` > `Resources` > `Add resource` and enter `/local/bonbon-strategy.js` (the other files will be loaded automatically)
5. Go to `Settings` > `Dashboards` > `Add dashboard` > `New empty dashboard` then create
6. Go to the new `Dashboard` > `✎` > `Raw configuration`, paste the configuration from below, then save
7. Clear your frontend cache!

Done!

## Configuration

Add this to your dashboard configuration. The strategy uses sensible defaults, so you only need to override the settings you want to change.

### Minimum default config

Use this if you just want to get it up and running. Everything uses sensible defaults.

```yaml
strategy:
  type: custom:bonbon-strategy
```

### Customization and translations

Use this if you want to translate the sections into your language and have a great starting point to start customizing, as all built-in views and sections are already here and can be easily changed/expanded.

```yaml
strategy:
  type: custom:bonbon-strategy
  options:
    views:
      bonbon_home:
        sections:
          bonbon_weather:
            name: 'Wetter'
          bonbon_persons:
            name: 'Personen'
          bonbon_favorites:
            name: 'Favoriten'
          bonbon_areas:
            name: 'Bereiche'
          bonbon_robots:
            name: 'Roboter'
          bonbon_security:
            name: 'Sicherheit'
      bonbon_area:
        sections:
          bonbon_environment:
            name: 'Raumklima'
          bonbon_scenes:
            name: 'Szenen & Skripte'
          bonbon_lights:
            name: 'Beleuchtung'
          bonbon_switches:
            name: 'Schalter & Taster'
          bonbon_media:
            name: 'Media Player'
          bonbon_climate:
            name: 'Heizung & Klima'
          bonbon_covers:
            name: 'Rollläden & Beschattung'
          bonbon_openings:
            name: 'Fenster & Türen'
          bonbon_valves:
            name: 'Wasser'
          bonbon_miscellaneous:
            name: 'Sonstiges'
```

### Configuration Structure

Now let's get into how it works, but do not use this as your config, as it's generic example code. Pick the parts you need, understand how they work, change them to suit your needs and then selectively add them to your config. Make sure to properly indent everything!

```yaml
strategy:
  type: custom:bonbon-strategy
  options:
    # Global styling options
    styles:
      use_bonbon_colors: true # use auto-generated area colors (true) or use card background colors (false)
      primary_accent_color: '#009ac7' # primary accent color used for "on" states (in HEX)
      card_background_color_light: '#fff' # card background color for light mode (in HEX)
      card_background_color_dark: '#222' # card background color for dark mode (in HEX)
      card_text_color_light: '#111' # card text color for light mode (in HEX)
      card_text_color_dark: '#eee' # card text color for dark mode (in HEX)
      background_image_light: null # background image for light mode (null | path/to/image)
      background_image_dark: null # background image for dark mode (null | path/to/image)

    # Card templates (see "Card templates" below for details)
    card_templates:
      'light.*': # entity selector -> full card definition
        type: custom:bubble-card
        card_type: button
        button_type: switch
        entity: entity.entity_id
        name: entity.name

    # Button actions (deprecated, use `card_templates` instead)
    actions:
      default: # the default config all domains, you can add overrides per domain (note: only applies to default Bubble Cards, doesn't apply to Graphs, Weather-Forecasts or custom cards)
        icon: none # action on icon tap ('auto' | 'toggle' | 'more-info' | 'none')
        button: auto # action on button tap ('none' | 'toggle' | 'more-info' | 'auto')

    # View definitions
    views:
      view_key:
        max_columns: 1 # max grid columns for this view
        icon: mdi:icon-name # icon for this view
        sections:
          section_key:
            # Common section properties
            name: 'Display Name'
            icon: 'mdi:icon-name'
            column: auto # fixed view column (1..n) or auto, will be stacked on mobile
            order: 1 # sort order, ascending, if a fixed column is assigned ordering is limited to that column
            disabled: false # disable entire section
            hide_separator: false # hide separator bar above section
            min_columns: 1 # minimum columns when rendering
            max_columns: 2 # maximum columns when rendering
            separator_buttons: null # buttons to add to a separator
            show_graphs: false # deprecated, use a `[section=...]` template instead
            show_forecast: false # deprecated, use a `[section=...]` template instead
            prefix: false # name prefix, useful for "Ceiling light" etc., which you may have tons of ('area' | 'floor' | 'device' | false)
            cards: # cards and entities
              - entity_id
              - light.*
              - binary_sensor.*[device_class=door]
              - etc.

      # Feature-specific properties (depending on section type) that could use explaining

      bonbon_home:
        sections:
          bonbon_areas:
            separator_buttons: light.*:not([label=nightlight]) # lights to be included on floor separators, floor_id is implied if missing
            separator_combine_lights: 'when-on' # smartly combine lights into a single toggle on floor separators ('when-on' | 'always' | false), will discard all entities that aren't lights
            sub_buttons: light.*:not([label=nightlight]) # lights to be included on area cards, area_id is implied if missing
            sub_combine_lights: 'when-on' # smartly combine lights into a single toggle on area cards ('when-on' | 'always' | false), will discard all entities that aren't lights

      bonbon_area:
        sections:
          bonbon_lights:
            separator_buttons: light.*:not([label=nightlight]) # lights to be included on separator, area_id is implied if missing
            separator_combine_lights: 'always' # smartly combine lights into a single toggle on separator ('when-on' | 'always' | false), will discard all entities that aren't lights
```

### Entities and Cards

In the `cards` arrays, you can specify entities and cards in two ways: You can use entity selectors as well as YAML cards and even mix and match both options.

### Entity selectors

Use strings or an array of strings with wildcards and filters to automatically match entities:

Entity selectors use wildcards and CSS-like attribute filters to match entities precisely. You'll use this syntax throughout your configuration in `cards`, `separator_buttons`, `sub_buttons`, `inline_buttons`.

**Wildcard syntax:**

- `light.*` matches all lights
- `sensor.*battery` matches sensors with entity IDs ending in "battery"
- `*temperature*` matches any entity with "temperature" in the ID

**Attribute selector syntax:**

**Existence checks:**

- `[attribute]` - Attribute exists **and has a truthy value** (excludes `null`, `false`, `0`, empty strings/arrays)
- `[attribute=*]` - Attribute exists with **any value** including falsy ones

**Value matching (supports pipe `|` for OR logic):**

- `[attribute=value]` - Exact match (case-insensitive)
- `[attribute*=substring]` - Contains substring
- `[attribute^=prefix]` - Starts with prefix
- `[attribute$=suffix]` - Ends with suffix

**Multiple filters (AND logic):**

- `[filter1][filter2][filter3]` - all must match

**Pseudo functions:**

- `:not(<selector>)` - excludes entities matching `<selector>` at startup
- `:hide(<selector>)` - dynamically hides entities matching `<selector>` at runtime (only supported in `cards`)

Note: While you can chain pseudo functions, you cannot nest them!

**Default filtering behavior:**

By default, Bonbon Strategy:

- Excludes hidden entities (use `[hidden=*]` to include)
- Excludes diagnostic and config entities (use `[entity_category=*]` to include)

To explicitly and only select hidden or diagnostic and config entities:

- `[hidden]` - Select only hidden entities
- `[entity_category=diagnostic|config]` - Select only diagnostic and config entities

**Examples:**

```yaml
cards:
  - light.* # all lights
  - light.*:not([label=nightlight|ambientlight]):hide([state=off]) # all lights, that are not marked as nightlight or ambient light, which are currently turned on
  - sensor.*battery # sensors with entity IDs ending in "battery"
  - sensor.*battery:hide([state>10]) # sensors with entity IDs ending in "battery" and a battery level below 10
  - light.*[brightness=*] # dimmable lights
  - binary_sensor.*contact[device_class=door|window]:not([label=indoors]):hide([state=off]) # Doors or windows, excluding those marked as indoors, that are currently open
  - <device_id> # all entities of a specific device
```

**Important note:**

`:not()` will exclude entities matching the selector inside entirely and `:hide()` will include them, but hide them dynamically instead. While you can also use things like `[state=on]` directly in the selector, everything not inside `:hide()` will be evaluated only once and will not respond to changes without reloading the dashboard. It is more performant, however, and may be a sensible choice for entities which don't change their state often or if you never leave your dashboard open for long.

Keep in mind, that entities hidden by `:hide()` are technically always on the dashboard. If you use more than one column then the section with its separator (if enabled) and spacing will always be there, even if no buttons are currently visible in that section.

The `hide()` pseudo function also only works in `cards` and will always generate standard Bubble Cards. For custom cards you can use [conditional cards](https://www.home-assistant.io/dashboards/conditional/), which should still get basic Bonbon styling. For more complex solutions you can use [auto-entities](https://github.com/thomasloven/lovelace-auto-entities), but because of how it's built, Bonbon styling will not be applied (yet?), so it's not recommended.

### Card templates

Every card that Bonbon generates for a single entity comes from a **card template**. A template is a complete card definition (including `type`) that is matched to an entity by an entity selector. This replaces the built-in, hard-coded card construction: weather forecasts, graphs and Bubble Cards are all templates now.

`card_templates` (top level of `options`) is an ordered map of `entity selector -> card definition`. There is exactly one map: templates that should only apply in one view or section say so in the selector with `[view=...]` or `[section=...]`.

```yaml
card_templates:
  # all lights render as simple toggles ...
  'light.*':
    type: custom:bubble-card
    card_type: button
    button_type: switch
    entity: entity.entity_id
    name: entity.name
  # ... and dimmable lights render as brightness sliders
  'light.*[supported_color_modes*=brightness|color_temp|hs|xy|rgb|rgbw|rgbww|white]':
    type: custom:bubble-card
    card_type: button
    button_type: slider
    entity: entity.entity_id
    name: entity.name

  # ... and the environment section of every area renders plain sensors as graphs
  'sensor.*[section=bonbon_environment]':
    type: custom:mini-graph-card
    height: 56
    entities:
      - entity: entity.entity_id
        show_line: false
    name: entity.name
```

**Context filters.** `[view=...]` and `[section=...]` are not entity attributes — they are matched against the view and section a card is rendered in, and are removed from the selector before the entities are looked up. They accept `|` for alternatives (`[view=bonbon_area|bonbon_home]`) and are combined with entity filters in any order (`light.*[section=lights][brightness=*]`). Per-area views also answer to `[view=bonbon_area]`, custom views to the key they were configured under.

The weather forecast card is scoped that way: the default is `weather.*[section=bonbon_weather]`, so a weather entity in any other section renders from the generic `*` template (a plain state button). Add your own `weather.*` template if you want forecast cards elsewhere.

**Matching order:** the map in the order you define it, with context filters narrowing a template down to one view or section. Because the last match wins, put a context-filtered template *after* the generic one it should override — which is what happens automatically when you add a new key.

**Last match wins.** For every entity the *last* matching template in that order is used, which means a generic key must come before its label/attribute-specific variants: `light.*` and `binary_sensor.*` first, then `light.*[supported_color_modes*=...]` and `binary_sensor.*[label=graph|graphs]`. Broad fallbacks belong at the end of the map. The catch-all selector `*` is only used when no other template matched. A template whose `type` starts with `custom:` is skipped when that custom card is not loaded (only Bubble Card is assumed to be installed; optional cards such as Mini Graph Card must be present for the graph templates to apply), so the next matching template applies.

A user template with the same selector key as a default is deep-merged over it (arrays are replaced, not merged), so you can override a single key, e.g. `{ 'light.*': { button_type: slider } }` keeps the rest of the default `light.*` card. User templates with a new selector key are appended at the end, where they win over the defaults.

**Placeholders** are resolved for every matched entity, recursively through nested objects and arrays:

| Placeholder | Resolves to |
| --- | --- |
| `entity.entity_id` | the entity ID |
| `entity.name` | the friendly name |
| `entity.area`, `entity.area_id` | the area name and ID |
| `entity.floor`, `entity.floor_id` | the floor name and ID |
| `entity.device`, `entity.device_id` | the device name and ID |
| `entity.labels` | the entity and device labels |
| `entity.attributes.<attribute>` | any attribute of the current state, e.g. `entity.attributes.brightness` (resolves to `null` when the entity does not report it) |
| `area.<attribute>` | the attribute of the area the card is rendered in, e.g. `area.temperature_entity_id`. It is read from the current area, never from the entity. In a view without an area (e.g. `bonbon_home`) it resolves to `undefined`, so the key is dropped |

A value that is exactly one placeholder keeps the type of the resolved value (numbers stay numbers, arrays stay arrays); a placeholder inside a longer string is interpolated as a string. Unresolvable placeholders resolve to `undefined` and the key is dropped from the card, so optional keys like `state_content` never ship an empty value.

**Deprecated: `show_graphs` and `show_forecast`.** Both section options still work and are applied as `[section=...]` templates in the global map (a template you wrote for that section wins), but they are deprecated and will be removed in a future version. They are no longer part of the shipped defaults — the environment section's graph templates and the weather card's section scoping are shipped as regular templates.

```yaml
# deprecated
views:
  bonbon_area:
    sections:
      my_sensor_section:
        cards: 'sensor.*'
        show_graphs: true

# equivalent, and the supported way
card_templates:
  'sensor.*[section=my_sensor_section]':
    type: custom:mini-graph-card
    height: 56
    entities:
      - entity: entity.entity_id
        show_line: false
    name: entity.name
```

The labels `graph`/`graphs`, `forecast`, `forecast_daily` and `forecast_hourly` keep working through the selectors of the default templates.

### Classic YAML cards

Use Home Assistant's built-in cards or custom cards you installed:

**Example:**

```yaml
cards:
  - type: weather-forecast
    entity: weather.home
```

You can also mix and match Home Assistant's built-in cards, installed custom cards as well as entity selectors.

### Deprecated: button actions

The `actions` option is deprecated in favour of card templates and will be removed in a future version. It no longer has a default, so an unmodified config does not use it at all; if you still configure it, it keeps working as before and is applied as the last layer to Bubble buttons (`icon` maps to `tap_action`, `button` maps to `button_action.tap_action`, and `auto` means toggle for togglable entities and more-info for everything else).

To migrate, move the block into `card_templates`. The old config:

```yaml
actions:
  default:
    icon: none
    button: auto
  cover:
    button: toggle
```

becomes the equivalent template, which also gives you access to every other card option:

```yaml
card_templates:
  'cover.*':
    type: custom:bubble-card
    card_type: cover
    entity: entity.entity_id
    name: entity.name
    tap_action:
      action: more-info # this is what `icon: none` used to become on non-togglable entities
    button_action:
      tap_action:
        action: toggle # this is what `button: toggle` means for covers
```

### Styling and Colors

Bonbon Strategy offers flexible styling options to customize the appearance of your dashboard.

#### Color Configuration

**Primary Accent Color**

This is the primary color used for `on` states.

```yaml
styles:
  primary_accent_color: '#009ac7'
```

#### Card Background Colors

Configure background colors for light and dark modes:

```yaml
styles:
  card_background_color_light: '#ffffff' # light mode background
  card_background_color_dark: '#222222' # dark mode background
  card_text_color_light: '#111111' # light mode text color
  card_text_color_dark: '#eeeeee' # dark mode text color
```

#### Background Images

Add background images for visual customization:

```yaml
styles:
  background_image_light: '/local/path/to/light-bg.jpg'
  background_image_dark: '/local/path/to/dark-bg.jpg'
```

**Auto-generated Area Colors:**

When `use_bonbon_colors` is `true`, Bonbon Strategy automatically generates distinct colors for each area.
You can override colors for specific areas by adding a label to your area with the format `color_XXXXXX` or `bonbon_color_XXXXXX` where `XXXXXX` is a hex color code.
You can use auto generated colors mixed with manual ones.

```yaml
styles:
  use_bonbon_colors: true
```

## Views and Sections

Bonbon Strategy uses a hierarchy: **Views** contain **Sections**, which contain **Cards**. Views are displayed as tabs at the top of your dashboard, sections organize related entities within a view.

### Built-in Views

#### bonbon_home

The main dashboard view with a fixed layout showing your home overview.

**Built-in sections:**

- `bonbon_weather` - Weather information, minified look by default, see example below on how to display a card (with forecast?) instead
- `bonbon_persons` - Person entities, minified look by default, see example below on how to enable the separator
- `bonbon_favorites` - Entities with the `favorite` label, can be changed and expanded by changing `cards` to include other entities or even things like currently open doors or turned on lights, etc.
- `bonbon_areas` - Area cards for navigation to individual areas. This is a dynamic section, that will be replaced with a section for each floor containing cards for each area on that floor. Areas that are not on a floor will be grouped in a separate section with name and icon from `bonbon_areas`
- `bonbon_robots` - Robot mowers and vacuums. If you have robots dedicated to specific areas, think about disabling this section and adding custom sections to `bonbon_area` instead.
- `bonbon_security` - Just Locks. Because every household works differently and classifies different things as being part of "Security", I didn't include more than that by default, but you can easily extend it with things like `binary_sensor.*contact[device_class=door|window]:not([label=indoors]):hide([state=off])`, just to give you an idea.

**Basic example:**

This will change the default minified look of `bonbon_weather` to a more generic section with a regular Title and a weather card with daily forecast and then enable the "Persons" separator, that's hidden by default, to separate these sections.

```yaml
views:
  bonbon_home:
    max_columns: 1
    sections:
      bonbon_weather:
        name: 'Weather'
        separator_buttons: false
        cards: 'weather.*'
        show_forecast: 'daily' # deprecated, prefer a `card_templates` entry
      bonbon_persons:
        hide_separator: false
```

#### bonbon_area

Automatically created sub-views for each area in your Home Assistant setup. Each area gets its own view with the area's entities.

**Built-in sections:**

- `bonbon_environment` - Temperature, humidity, CO2 sensors
- `bonbon_scenes` - Scenes and scripts
- `bonbon_lights` - Light switches
- `bonbon_switches` - Switches, buttons, selects and so on.
- `bonbon_media` - Media player devices
- `bonbon_climate` - Thermostats and climate entities as well as fans and humidifiers
- `bonbon_covers` - Blinds, shutters and shades
- `bonbon_openings` - Door and window sensors
- `bonbon_valves` - Water systems like valves and water heaters
- `bonbon_miscellaneous` - Everything else

### Section Properties

All sections share common properties. Use these to customize appearance and behavior:

**Visual Properties:**

- **name** - Display name shown in the UI
- **icon** - Icon name (e.g., `mdi:lightbulb`)
- **order** - Order number for sorting (ascending)
- **disabled** - If `true`, section is not displayed

**Layout Properties:**

- **min_columns** - Minimum number of column
- **max_columns** - Maximum number of columns
- **column** - Column assignment for views with `max_columns > 1` (`1..n` or `'auto'`, default mostly `'auto'`)
- **hide_separator** - `true` hides the separator bar above section

### Custom Sections

Add your own sections to any view to organize entities your way. You can also override what's included in built-in sections by changing `cards` for example.

**Basic custom section:**

```yaml
views:
  bonbon_home:
    sections:
      open_doors:
        name: Open doors
        icon: mdi:door-open
        order: 2.1
        cards: binary_sensor.*[device_class=door|garage_door]:hide([state=off])
      low_batteries:
        name: Low batteries
        icon: mdi:battery-low
        order: 2.2
        cards: sensor.*battery:hide([state>10])
```

These particular examples would work well when included in `bonbon_favorites` as well, as they will probably be empty most of the time anyway. Alternatively set `hide_separator` to `true`, but due to the nature of HA dashboards such a section will still take up some space, even when there is no separator and all cards are hidden.

**Area-specific sections:**

When adding custom sections under `bonbon_area`, they automatically show in areas with matching entities and won't show in areas without matching entities. To force entities to match, add `[area_id=area_id]` or `[area_id=*]` to the selector to override the restriction to the current area. This, in turn, will also mean that these will match in any area, so use `area_id: <area_id>` in the section properties to restrict them to a specific area.

When using custom cards, which have an entity which belongs to a different area, you can add `area_id: area_id` or `bonbon_area_id: area_id` to the card options to assign that card to one or more different areas so that it will show up in those areas instead. This will override the auto-detected area from the entity.

For a card with no entity of its own that should appear identically in every area regardless (e.g. a `custom:navbar-card`, or any other purely presentational card), set `area_id: '*'` or `bonbon_area_id: '*'` on the card options — the same wildcard used in selectors above, applied to cards instead.

Example:

```yaml
views:
  bonbon_area:
    sections:
      my_pantry_section:
        name: Pantry Controls
        # manually restrict to kitchen, otherwise some selectors may cause it to show up in other areas as well, if they match there
        # this would be the case for lights and switches in this example
        area_id: kitchen
        # force match even though we are in the kitchen and these belong the pantry
        cards:
          # without manually specifying either wildcard or kitchen, these would never match, as [area_id=kitchen] is implied by default
          - light.*[area=*]
          - switch.*[area=pantry]
          # sensor.pantry_fridge belongs to pantry, so without specifying area_id: kitchen to override it this one would also not match
          - type: custom:my-custom-fridge-card
            entity_id: sensor.pantry_fridge
            area_id: kitchen
```

### Custom Separator Buttons

Add buttons to the separator bar above a custom section using `separator_buttons`:

```yaml
views:
  bonbon_area:
    sections:
      my_server_section:
        name: Server Status
        icon: mdi:server
        separator_buttons:
          - binary_sensor.server*status
        cards:
          - sensor.server_storage
          - sensor.server_cpu
          - switch.server_restart
```

### Custom Views

Create entirely new views, which will be added as tabs:

```yaml
views:
  diagnostics:
    title: Diagnostics
    icon: mdi:bug
    sections:
      desktop_pc:
        name: Desktop PC
        icon: mdi:desktop-classic
        cards:
          - sensor.*cpu*
          - sensor.*memory*
          - sensor.*disk*

      battery_status:
        name: Batteries
        icon: mdi:battery
        cards:
          - sensor.*battery[entity_category=diagnostic]
```

## Advanced Features

Bonbon Strategy provides a consistent visual design through CSS variables that you can use when adding your own cards.
You can use Bubble Cards to keep it consistent, but with `card-mod` you can make basically any card look like a Bonbon card.
Home Assistant default cards will receive some light styling automatically, custom cards will need to be styled manually.

#### Available CSS Variables

If you are attempting this you probably already know what you're doing.
Here are some useful variables you can use to style custom cards with `card-mod`:

**Card Styling:**

- `--bonbon-box-shadow` - Standard shadow effect used throughout
- `--bonbon-border-radius` - Border radius for buttons and card elements

**Colors:**

- `--bonbon-card-background` - Card background color
- `--bonbon-primary-text-color` - Primary text color
- `--bonbon-primary-accent-color` - Default accent color for active states (purple: #9373c9)

#### Example Custom Card with Styling

```yaml
views:
  bonbon_area:
    sections:
      my_styled_section:
        name: Styled Cards
        cards:
          - type: custom:my-custom-card
            entity: light.example
            card_mod:
              style:
                ha-card: |
                  border-radius: var(--bonbon-border-radius);
                  box-shadow: var(--bonbon-box-shadow);
                  background: var(--bonbon-card-background);
                  border: none;
```
