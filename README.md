# 🍬 Bonbon Strategy

Bonbon Strategy is a Home Assistant strategy which automatically generates a colorful dashboard using Bubble Cards. It's fully featured right out of the gate but can be expanded and customized.

<img width="4270" alt="preview" src="preview.png?v=3" />

- Left: Home View (with [Atmospheric Weather Card](https://github.com/shpongledsummer/atmospheric-weather-card))
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
- Temperature, Humidity and CO2
- Lights
- Switches
- Media Players
- Climate (HVAC)
- Covers (Shutters & Shades)
- Openings (Doors & Windows)
- Miscellaneous (almost everything that isn't part of the above)
- Custom views, sections and cards (see configuration)

You can hide anything with the label `hidden` or by disabling the `Visible` setting.
All entities are ordered alphabetically by default but are grouped by device, if they are in the same section.
You can override the order by adding labels like `order_1`, `order_2`, etc.
You can add the prefix `bonbon_` to any of these labels in case it interferes with your setup.
You can add the label `nightlight` to lights to exclude them from area and floor toggles.

## Dependencies

This dashboard strategy needs [Bubble Card](https://github.com/Clooos/Bubble-Card).

[Mini Graph Card](https://github.com/kalkih/mini-graph-card) and [Card Mod](https://github.com/thomasloven/lovelace-card-mod) are highly recommended, but optional.

Please check the respective repositories on how to install them and do that, before you proceed.

## Installation

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
2. Download `bonbon-strategy.js`
3. Place `bonbon-strategy.js` in `<config>/www/bonbon-strategy.js` (restart HA if `/www` didn't exist!)
4. Go to `Settings` > `Dashboards` > `⋮` > `Resources` > `Add resource` and enter `/local/bonbon-strategy.js` then add
5. Go to `Settings` > `Dashboards` > `Add dashboard` > `New empty dashboard` then create
6. Go to the new `Dashboard` > `✎` > `Raw configuration`, paste the configuration from below, then save
7. Clear your frontend cache!

Done!

## Configuration

Add this to your dashboard configuration. The strategy uses sensible defaults, so you only need to override the settings you want to change.

### Minimum Config

Minimum required configuration - everything else uses defaults:

```yaml
strategy:
  type: custom:bonbon-strategy
```

### Configuration Structure

The configuration is organized as follows:

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
            order: 1 # sort order, ascending
            disabled: false # disable entire section
            hide_separator: false # hide separator bar above section
            min_columns: 1 # minimum columns when rendering
            max_columns: 2 # maximum columns when rendering
            separator_buttons: null # buttons to add to a separator, only in custom sections
            cards: # custom cards and entities, only in custom sections
              - entity_id
              - light.*
              - binary_sensor.*[device_class=door]
              - etc.

      # Feature-specific properties (depending on section type)

      bonbon_home:
        sections:
          bonbon_areas:
            show_floor_lights_toggle: 'when-on' # show lights toggle on floor separators ('when-on' | 'always' | false)
            show_area_lights_toggle: 'when-on' # show lights toggle on area cards ('when-on' | 'always' | false)

      bonbon_area:
        sections:
          bonbon_environment:
            show_temperature: true # assign an entity in the HA area properties, otherwise it'll try and pick one automatically
            show_humidity: true # assign an entity in the HA area properties, otherwise it'll try and pick one automatically
            show_co2: true # it'll try and pick one automatically
            show_graphs: true # will only work when mini-graph-card is installed

          bonbon_lights:
            show_area_lights_toggle: 'always' # show lights toggle on lights separator ('when-on' | 'always' | false)
```

### Translations

Override default English section names:

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
      bonbon_area:
        sections:
          bonbon_environment:
            name: 'Raumklima'
          bonbon_lights:
            name: 'Beleuchtung'
          bonbon_switches:
            name: 'Schalter'
          bonbon_media:
            name: 'Media Player'
          bonbon_climate:
            name: 'Heizung & Klima'
          bonbon_covers:
            name: 'Rollläden & Beschattung'
          bonbon_openings:
            name: 'Fenster & Türen'
```

### Cards and Entities

In the `cards` arrays, you can specify cards and entities in two ways:

**1. Classic YAML structure** - Use Home Assistant's built-in cards or custom cards you installed:

**Example:**

```yaml
cards:
  - type: weather-forecast
    entity: weather.home
```

**2. Entity selectors** - Use strings or an array of strings with wildcards and filters to automatically match entities:

Entity selectors use wildcards and CSS-like attribute filters to match entities precisely. You'll use this syntax throughout your configuration in `cards`, `separator_buttons`, labels, and other places.

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

```
[filter1][filter2][filter3]  # all must match
```

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
  - sensor.*battery # sensors with entity IDs ending in "battery"
  - light.*[brightness=*] # dimmable lights
  - binary_sensor.*contact[device_class=door|window] # Door or window sensors
  - <device_id> # all entities of a specific device
```

You can also mix and match Home Assistant's built-in cards, installed custom cards as well as entity selectors.

**Important note:** A dashboard strategy generates YAML, which is inherently static! `[state=on]` will not react to state changes without refreshing the dashboard! I don't think it's a big issue, as most cards shouldn't come and go willy-nilly anyway, but it's something you should keep in mind when building your dashboards. I use a more complex workaround for the `show_floor_lights_toggle` and `show_area_lights_toggle`. If you do need a feature like that consider using your own cards and wrapping them in conditional cards. I may add support for it natively in the future.

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

- `bonbon_weather` - Weather information
- `bonbon_persons` - Person entities
- `bonbon_favorites` - Entities with the `favorite` label
- `bonbon_areas` - Area cards for navigation to individual areas

**Feature-Specific Properties:**

- **show_temperature**, **show_humidity**, **show_co2** - Show sensors in area cards
- **show_floor_lights_toggle** - Floor lights toggle: `'when-on'` (default), `'always'`, or `false`
- **show_area_lights_toggle** - Light toggle buttons: `'when-on'` (default), `'always'`, or `false`

**Basic example:**

```yaml
views:
  bonbon_home:
    max_columns: 1
    sections:
      bonbon_weather:
        name: 'Weather'
        icon: 'mdi:cloud-question'
        show_weather_card: false # or 'current', 'daily', or 'hourly'
        weather_entity_id: 'auto'
```

#### bonbon_area

Automatically created sub-views for each area in your Home Assistant setup. Each area gets its own view with the area's entities.

**Built-in sections:**

- `bonbon_environment` - Temperature, humidity, CO2 sensors
- `bonbon_lights` - Light switches
- `bonbon_switches` - Other switches and automations
- `bonbon_media` - Media player devices
- `bonbon_climate` - Thermostats and climate entities
- `bonbon_covers` - Blinds and sliding doors
- `bonbon_openings` - Door and window sensors
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
- **hide_separator** - `true` hides the separator bar above section

**Feature-Specific Properties:**

- **show_area_lights_toggle** - Light toggle buttons: `'when-on'` (default), `'always'`, or `false`

### Custom Sections

Add your own sections to any view to organize entities your way:

**Basic custom section:**

```yaml
views:
  bonbon_home:
    sections:
      bonbon_weather:
        disabled: true
      my_way_better_weather_section:
        name: Weather
        icon: mdi:cloud
        order: 1
        cards:
          - type: custom:the-best-weather-card
```

**Area-specific sections:**

When adding custom sections under `bonbon_area`, they automatically show in areas with matching entities and won't show in areas without matching entities. To force entities to match, add `[area_id=area_id]` or `[area_id=*]` to the selector to override the restriction to the current area. This, in turn, will also mean that these will match in any area, so use `area_id: <area_id>` in the section properties to restrict them to a specific area.

When using custom cards, which have an entity which belongs to a different area, you can add `area_id: area_id` or `bonbon_area_id: area_id` to the card options to assign that card to one or more different areas so that it will show up in those areas instead. This will override the detected area from the entity.

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
