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
- Lights (add the labels `mainlight` and `nightlight` if needed)
- Switches
- Media Players
- Openings (Doors & Windows)
- Covers (Shutters & Shades)
- Miscellaneous (almost everything that isn't part of the above)

You can hide anything with the label `hidden` or by disabling the `Visible` setting.
You can add the prefix `bonbon_` to any of these labels in case it interferes with your setup.

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

Minimum required configuration, everything default:

```
strategy:
  type: custom:bonbon-strategy
```

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
            min_columns: 1
            max_columns: 1
            style: inline
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
        subview: true
        max_columns: 1
        sections:
          bonbon_environment:
            name: Environment
            icon: mdi:thermometer-water
            order: 1
            show_separator: true
            min_columns: 1
            max_columns: 3
            style: graph
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
            order: 1000
            show_separator: true
            min_columns: 1
            max_columns: 2
            hidden: false

```

You can add custom sections like this:

```
death_star_controls:
  name: Death Star
  icon: mdi:death-star
  order: 3
  show_separator: true
  min_columns: 1
  max_columns: 2
  hidden: false
  cards: # can be cards, entity_ids or labels
    - light.death_star
    - switch.arm
```

### Auto Light/Dark Mode

If your theme supports it and `auto_light_dark_mode` is set to `true`, then Bonbon Strategy will try to automatically switch between light and dark mode depending on the state of the sun. It should work independently from your browser and operating system.
