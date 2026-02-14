# 🍬 Bonbon Strategy

Bonbon Strategy is a Home Assistant strategy which automatically generates a colorful dashboard.

<img width="526" alt="Screenshot" src="https://github.com/user-attachments/assets/d0d2390a-6dc3-4fd1-bae8-4ce18e1e1ef6" />

## Preparations

This dashboard strategy needs a properly organized Home Assistant instance!

You should properly order your floors and areas and assign proper names and icons. If you have temperature and humidity sensors, assign them to an area and select them in the area properties.
If an entity isn't assigned to an area or if it's disabled or hidden, it won't show up.

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

Add this to your dashboard configuration. Change the translations and options as needed.

### Minimum Config

Minimum required configuration, everything default:

```
strategy:
  type: custom:bonbon-strategy
```

### Translation only

Configuration with translations only, rest default:

```
strategy:
  type: custom:bonbon-strategy
  options:
    views:
      bonbon_home:
        sections:
          bonbon_weather:
            name: Weather
          bonbon_persons:
            name: Persons
          bonbon_favorites:
            name: Favorites
          bonbon_areas:
            name: Areas
      bonbon_area:
        sections:
          bonbon_environment:
            name: Environment
          bonbon_climate:
            name: Climate
          bonbon_lights:
            name: Lights
          bonbon_switches:
            name: Switches
          bonbon_openings:
            name: Doors & Windows
          bonbon_covers:
            name: Shutters & Shades
          bonbon_miscellaneous:
            name: Miscellaneous
```

### Complete config

Complete configuration for maximum control:

```
strategy:
  type: custom:bonbon-strategy
  options:
    background_image_light: false
    background_image_dark: false
    auto_light_dark_mode: false
    views:
      bonbon_home:
        max_columns: 1
        sections:
          bonbon_weather:
            name: Weather
            icon: mdi:cloud-question
            order: 1
            entity_id: auto
            show_separator: true
            show_card: false
            card_show_current: true
            card_show_forecast: true
            card_forecast_type: daily
            hidden: false
          bonbon_persons:
            name: Persons
            icon: mdi:account-group
            order: 2
            show_separator: false
            min_columns: 1
            max_columns: 2
            hidden: false
          bonbon_favorites:
            name: Favorites
            icon: mdi:star
            order: 3
            show_separator: true
            min_columns: 1
            max_columns: 2
            hidden: false
          bonbon_areas:
            name: Areas
            icon: mdi:sofa
            order: 4
            show_separator: true
            min_columns: 2
            max_columns: 2
            show_temperature: true
            show_humidity: true
            show_co2: true
            show_floor_lights_toggle: true
            always_show_floor_lights_toggle: false
            show_area_lights_toggle: true
            always_show_area_lights_toggle: false
            hidden: false
      bonbon_area:
        max_columns: 1
        sections:
          bonbon_environment:
            name: Environment
            icon: mdi:thermometer-water
            order: 1
            show_separator: true
            min_columns: 1
            max_columns: 3
            show_graphs: true
            show_temperature: true
            show_humidity: true
            show_co2: true
            hidden: false
          bonbon_climate:
            name: Climate
            icon: mdi:radiator
            order: 2
            show_separator: true
            min_columns: 1
            max_columns: 2
            hidden: false
          bonbon_lights:
            name: Lights
            icon: mdi:lightbulb-group
            order: 3
            show_separator: true
            min_columns: 1
            max_columns: 2
            show_area_lights_toggle: true
            always_show_area_lights_toggle: true
            hidden: false
          bonbon_switches:
            name: Switches
            icon: mdi:toggle-switch
            order: 4
            show_separator: true
            min_columns: 1
            max_columns: 2
            hidden: false
          bonbon_media:
            name: Media Players
            icon: mdi:disc-player
            order: 5
            show_separator: true
            min_columns: 1
            max_columns: 1
            hidden: false
          bonbon_openings:
            name: Doors & Windows
            icon: mdi:window-closed-variant
            order: 6
            show_separator: true
            min_columns: 1
            max_columns: 2
            hidden: false
          bonbon_covers:
            name: Shutters & Shades
            icon: mdi:roller-shade
            order: 7
            show_separator: true
            min_columns: 1
            max_columns: 2
            hidden: false
          bonbon_miscellaneous:
            name: Miscellaneous
            icon: mdi:dots-horizontal-circle-outline
            order: Infinity
            show_separator: true
            min_columns: 1
            max_columns: 2
            hidden: false
```

### Custom sections

You can add custom sections like this:

```
          death_star_controls:
            name: Death Star
            icon: mdi:death-star
            order: 3
            show_separator: true
            custom_separator_buttons: false # can be an array of Bubble `sub_button`s, entity_ids, device_ids or labels
            min_columns: 1
            max_columns: 2
            hidden: false
            cards: # can be cards, entity_ids, device_ids or labels
              - light.death_star
              - switch.arm
```

When added under `bonbon_area` then the section will only show up if there are entities that are assigned to that area. If you add a custom card which does not have an `entity` or `entity_id` key with an entity_id that is assigned to that area, you can add `area_id: <area_id>` or `bonbon_area_id: <area_id>` to the card. If you want to force this section to show up in a specific area all the time then add `area_id: <area_id>` to the section.
Same goes for custom separator cards on floors and in areas which can be restricted to a specific one with `floor_id: <floor_id>` and `bonbon_floor_id: <floor_id>` or `area_id: <area_id>` and `bonbon_area_id: <area_id>` respectively.

### Custom views

You can even add entire custom views like this:

```
      openings:
        title: Doors & Windows
        icon: mdi:window-closed-variant
        sections:
          doors:
            name: Doors
            icon: mdi:door
            show_separator: true
            min_columns: 2
            max_columns: 2
            cards:
              - binary_sensor.*contact[door]
          windows:
            name: Windows
            icon: mdi:window-closed-variant
            show_separator: true
            min_columns: 2
            max_columns: 2
            cards:
              - binary_sensor.*contact[window]
      diagnostic:
        title: Diagnostic
        icon: mdi:magnify-scan
        sections:
          leak:
            name: Watersensors
            icon: mdi:water
            show_separator: true
            min_columns: 2
            max_columns: 2
            cards:
              - binary_sensor.*leak
          batteries:
            name: Batteries
            icon: mdi:battery
            show_separator: true
            min_columns: 2
            max_columns: 2
            include_diagnostic: true
            cards:
              - sensor.*battery
```

Custom views will be added as tabs at the top. In combination with wildcards you can create views to keep an eye on batteries, doors, shutters, etc. in just a few lines. Or create entirely custom views with your own cards.

### Wildcards and attribute selectors

You can use wildcards and CSS like attribute selectors (including \*=, ^= and $=, which is most useful for `name`) to get exactly what you're looking for. Here are some examples:

- `binary_sensor.*contact[window]` grabs all binary contact sensors with a device_class of `window`, it's basically the shorthand
- `binary_sensor.*contact[name$=door] grabs all binary contact sensors whose display names end with `door`
- `sensor.*[unit_of_measurement=ppm]` grabs all sensors whose unit of measurement is `ppm`
- `"[area_id=office]"` grabs everything from the office (in quotes because of the leading bracket)

Don't forget to add `include_diagnostic: true` and `include_config: true` if needed, otherwise things like battery sensors and other options might not show up, as only the user facing sensors are included by default (`include_sensors: true`).

### Custom cards

When using your own cards you can use card_mod to style them to look like the rest of Bonbon Strategy. Some variables will be available to you, like `--bonbon-box-shadow` and `--bubble-button-border-radius`, which should get you most of the way there.
