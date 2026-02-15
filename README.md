# 🍬 Bonbon Strategy

Bonbon Strategy is a Home Assistant strategy which automatically generates a colorful dashboard.

<img width="526" alt="Screenshot" src="https://github.com/user-attachments/assets/d0d2390a-6dc3-4fd1-bae8-4ce18e1e1ef6" />

## Preparations

Bonbon Strategy works best with a well-organized Home Assistant setup:

- **Floors and Areas**: Properly define your floors and areas with descriptive names and appropriate icons
- **Device Assignment**: Assign entities to devices, and devices to areas for proper grouping
- **Area Metadata**: For temperature, humidity, and CO2 sensors, assign them to the area and add the device class information
- **Labeling**: Use the standard Home Assistant labels system to organize and control visibility

By default, disabled and hidden entities won't be displayed in Bonbon Strategy. However, you can override this behavior using attribute selectors in your custom sections and cards. For example, `[hidden=*]` includes all entities regardless of hidden status, and `[entity_category=*]` includes diagnostic entities that are typically hidden.

See the **Wildcards and attribute selectors** section for more details on how to include hidden and diagnostic entities.

## Supported features

- Weather
- Persons
- Favorites (add the label `favorite` to an entity)
- Floors
- Areas (add the label `hidden` to hide an area)
- Temperature, Humidity and CO2
- Climate (HVAC)
- Lights
- Switches
- Media Players
- Openings (Doors & Windows)
- Covers (Shutters & Shades)
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
    # Global dashboard options
    background_image_light: null
    background_image_dark: null

    # View definitions
    views:
      view_key:
        max_columns: 1 # max grid columns for this view
        sections:
          section_key:
            # Common section properties
            name: 'Display Name'
            icon: 'mdi:icon-name'
            order: 1 # sort order, ascending
            disabled: false # disable entire section
            hide_separator: false # hide separator bar above section
            custom_separator_buttons: null # additional buttons to add to separator
            min_columns: 1 # minimum columns when rendering
            max_columns: 2 # maximum columns when rendering

            # Feature-specific properties (depending on section type)

            # Home view
            # Floors: show lights toggle on floor separators (if lights are / or always)
            show_floor_lights_toggle: true
            always_show_floor_lights_toggle: false
            # Areas: show lights toggle on area cards if lights are on or always
            show_area_lights_toggle: true
            always_show_area_lights_toggle: false

            # Area view
            # Environment: Show/hide temperature, humidity and CO2
            show_temperature: true
            show_humidity: true
            show_co2: true
            show_graphs: true
            # Lights: show lights toggle on lights separator (if lights are on / always)
            show_area_lights_toggle: true
            always_show_area_lights_toggle: false

            # Custom cards
            cards:
              - entity_id
              - light.*
              - binary_sensor.*[device_class=door]
              - etc.
```

### Global Options

- **background_image_light** (string or null, default: `null`) - URL to background image for light mode (e.g., `/local/background.png`)
- **background_image_dark** (string or null, default: `null`) - URL to background image for dark mode (e.g., `/local/background.png`)

### View Types

#### bonbon_home

The main dashboard view. Built-in sections include:

- `bonbon_weather` - Weather information
- `bonbon_persons` - Person entities
- `bonbon_favorites` - Entities with the `favorite` label
- `bonbon_areas` - Area cards for navigation

**Usage:**

```yaml
views:
  bonbon_home:
    max_columns: 1
    sections:
      bonbon_weather:
        name: 'Weather'
        icon: 'mdi:cloud-question'
        show_card: false
        card_show_current: true
        card_show_forecast: false
        card_forecast_type: 'daily' # or "hourly"
        entity_id: 'auto' # you can specify a weather.entity
```

#### bonbon_area

Automatically created sub-views for each area. Built-in sections include:

- `bonbon_environment` - Temperature, humidity, CO2 sensors
- `bonbon_climate` - Thermostats and climate entities
- `bonbon_lights` - Light switches
- `bonbon_switches` - Other switches and automations
- `bonbon_media` - Media player devices
- `bonbon_openings` - Door and window sensors
- `bonbon_covers` - Blinds and sliding doors
- `bonbon_miscellaneous` - Everything else

#### Custom Views

You can create entirely new views:

```yaml
views:
  my_custom_view:
    title: 'My View'
    icon: 'mdi:star'
    sections:
      my_section:
        name: 'Section Name'
        icon: 'mdi:icon'
        cards:
          - entity_id
          - light.*
          - binary_sensor.*[device_class=door]
          - etc.
```

### Section Properties

**Visual Properties:**

- **name** - Display name shown in the UI
- **icon** - Icon name (e.g., `mdi:lightbulb`)
- **order** - Order number, will be sorted ascending
- **disabled** - If `true`, section is disabled
- **hide_separator** - If `true`, hide the separator bar above the section (default: `false`, i.e., separator is shown)

**Layout Properties:**

- **min_columns** - Minimum number of columns when laying out cards (default: `1`)
- **max_columns** - Maximum number of columns when laying out cards (default: `2`)
- **columns** - Force exact number of columns (overrides min/max)

**Feature-Specific Properties:**

- **show_temperature**, **show_humidity**, **show_co2** - Show environment sensors in area cards
- **show_area_lights_toggle** - Show light toggle buttons on area cards if lights are on
- **always_show_area_lights_toggle** - Always show light toggle even if no lights are on
- **show_floor_lights_toggle** - Show light toggle for entire floor if lights are on
- **always_show_floor_lights_toggle** - Always show floor light toggle

### Custom Separator Buttons

For sections with `hide_separator: false` (the default, where separator is shown), you can add additional custom buttons to the separator bar beyond the default ones.

Set `custom_separator_buttons` to an array using the same entity selector syntax as `cards`:

- Individual entity IDs: `light.bedroom`, `switch.office_fan`
- Wildcards: `light.*`, `switch.*`
- With filters: `light.*[brightness=*]`, `switch.*[state=on]`
- Device IDs: `device_id_here`
- Labels: `favorite` (all entities with this label)

**Examples:**

```yaml
# Simple entity list
custom_separator_buttons:
  - light.bedroom
  - light.kitchen
  - switch.office_fan
  - favorite  # all entities with label

# Using entity selectors and filters
custom_separator_buttons:
  - light.*[brightness=*]  # all dimmable lights
  - switch.*[state=on]     # all on switches
  - light.outdoor
```

Leave `custom_separator_buttons` as `null` (the default) to use only the default buttons for that section.

### Translations

Override the default English section names:

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
            name: 'Räume'
      bonbon_area:
        sections:
          bonbon_environment:
            name: 'Umgebung'
          bonbon_climate:
            name: 'Klima'
          # ... etc
```

### Custom Sections

Beyond the built-in sections, you can add custom sections to organize entities however you like.

#### Basic custom section

Add a custom section with specific entities or using entity selectors:

```yaml
strategy:
  type: custom:bonbon-strategy
  options:
    views:
      bonbon_area:
        sections:
          my_custom_section:
            name: Custom Devices
            icon: mdi:lightbulb-group
            hide_separator: false
            cards:
              - light.bedroom
              - light.kitchen
              - switch.office_fan
```

#### Using entity selectors in custom sections

You can use the same powerful entity selector syntax throughout custom sections:

```yaml
views:
  bonbon_area:
    sections:
      battery_devices:
        name: Batteries
        icon: mdi:battery
        cards:
          - sensor.*battery[entity_category=diagnostic]

      active_switches:
        name: Currently Active
        icon: mdi:toggle-switch
        cards:
          - switch.*[state=on]

      temperature_sensors:
        name: Temperature Readings
        icon: mdi:thermometer
        cards:
          - sensor.*temperature
          - sensor.*temp
```

#### Area-specific sections

When adding custom sections under `bonbon_area`, they automatically only show in areas that have matching entities. To force a section to appear in a specific area regardless of entities:

```yaml
views:
  bonbon_area:
    sections:
      custom_for_kitchen:
        name: Kitchen Controls
        area_id: kitchen # only show in kitchen area
        cards:
          - light.kitchen_main
          - switch.kitchen_outlet
```

Alternatively, use the `bonbon_area_id` key:

```yaml
custom_for_kitchen:
  name: Kitchen Controls
  bonbon_area_id: kitchen
```

#### Separator buttons

Customize what appears in the separator bar above sections:

```yaml
multiple_lights:
  name: All Lights
  hide_separator: false
  custom_separator_buttons:
    - light.main
    - light.accent
    - favorite # all entities with label
  cards:
    - light.*
```

### Custom Views

Create entirely new tabs at the top of the dashboard:

```yaml
views:
  diagnostics:
    title: Diagnostics
    icon: mdi:bug
    sections:
      system_sensors:
        name: System Health
        cards:
          - sensor.*cpu
          - sensor.*memory
          - sensor.*disk

      battery_status:
        name: Low Batteries
        cards:
          - sensor.*battery[entity_category=diagnostic]

  automation_hub:
    title: Automations
    icon: mdi:robot
    sections:
      active_automations:
        name: Running
        cards:
          - automation.*[state=on]

      disabled_automations:
        name: Disabled
        cards:
          - automation.*[state=off]
```

### Wildcards and attribute selectors

You can use wildcards and CSS-like attribute selectors to filter entities with great precision. Entity IDs support `*` as a wildcard (matching any characters), and attributes can be filtered with various operators and conditions.

#### Default filtering behavior

By default:

- Only **non-hidden** entities are included (entities with `hidden: true` are excluded)
- Only entities with **standard visibility** are included, this means diagnostic and config entities are excluded by default

To explicitly include hidden or special categories, use the filters described below.

#### Attribute selector syntax

Attributes can be filtered using the following syntax:

**Existence checks:**

- `[attribute]` - Match entities where the attribute exists **and has a truthy value** (excludes `null`, `undefined`, `false`, `0`, empty strings or arrays)
- `[attribute=*]` - Match entities where the attribute exists with **any value**, including falsy values like `false`, `0`, or empty strings

**Value matching (all support the pipe `|` operator for OR logic):**

- `[attribute=value]` - Exact match (case-insensitive)
- `[attribute*=substring]` - Contains substring (case-insensitive)
- `[attribute^=prefix]` - Starts with prefix (case-insensitive)
- `[attribute$=suffix]` - Ends with suffix (case-insensitive)

**Multiple values with OR logic:**

- `[attribute=value1|value2|value3]` - Match if attribute equals any of the values
- `[device_class=door|window]` - Match doors OR windows

**Multiple filters with AND logic:**

- `[filter1][filter2][filter3]` - All filters must match (AND logic)

#### Special attributes

**entity_category:**

- Entities without an explicit `entity_category` are treated as `entity_category: 'sensor'`
- Use `[entity_category=sensor]` to explicitly match standard entities
- Use `[entity_category=diagnostic]` to match diagnostic entities
- Use `[entity_category=sensor|diagnostic]` to match both standard and diagnostic
- Use `[entity_category=*]` to match all entities

**hidden:**

- By default, hidden entities are completely excluded
- Use `[hidden]` or `[hidden=true]` to explicitly include hidden entities
- Use `[hidden=*]` to include entities regardless of hidden status

#### Examples

- `binary_sensor.*contact[device_class=window]` - All non-hidden window contact sensors
- `binary_sensor.*[name*=door|gate]` - Contact sensors whose name contains "door" or "gate"
- `sensor.*battery[entity_category=diagnostic]` - Diagnostic sensors with an entity ID ending in "battery"
- `sensor.*[unit_of_measurement=ppm]` - All sensors measuring in PPM
- `"[area_id=office]"` - All entities in the office area (quotes needed because of leading bracket)
- `"[area_id=utilities][entity_category=sensor|diagnostic"][hidden=*]"` - All entities (standard, diagnostic, hidden or not) from the utilities area
- `light.*[brightness=*]` - Lights that have a brightness attribute, even if set to 0

You can chain multiple selectors together to create very specific filters.

### Custom Cards and Styling

Bonbon Strategy provides a consistent visual design through CSS variables that you can use when adding your own cards.

#### Available CSS Variables

The following variables are available for styling custom cards with `card-mod`:

**Box Styling:**

- `--bonbon-box-shadow` - Standard shadow effect used throughout (includes light/dark mode aware shadows)
- `--bubble-button-border-radius` - Border radius for buttons and card elements
- `--bubble-border-radius` - General border radius for cards
- `--ha-card-background` / `--card-background-color` - Card background color
- `--primary-text-color` - Primary text color (automatically adjusted for light/dark mode)

**Colors:**

- `--bubble-default-color` - Default accent color for active states (purple: #9373c9)
- `--bubble-main-background-color` - Main background for bubble elements
- `--bubble-line-background-color` - Line divider color

**Bubble Card Specific:**

- `--bubble-sub-button-border-radius` - Border radius for sub-buttons
- `--bubble-icon-border-radius` - Border radius for icons

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
                  border-radius: var(--bubble-button-border-radius);
                  box-shadow: var(--bonbon-box-shadow);
                  background: var(--ha-card-background);
```

#### Using Bubble Card Elements

Bonbon Strategy uses [Bubble Card](https://github.com/Clooos/Bubble-Card) extensively. When creating custom cards, you can leverage Bubble Card's components and styling:

```yaml
cards:
  - type: custom:bubble-card
    card_type: button
    entity: light.bedroom
    name: Bedroom Light
    show_state: true
    show_last_changed: true
    use_accent_color: true
    tap_action:
      action: toggle
```

For more information on Bubble Card's available options, see the [Bubble Card documentation](https://github.com/Clooos/Bubble-Card).
