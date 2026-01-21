# 🍬 Bonbon Strategy
Bonbon Strategy is a Home Assistant strategy which automatically generates a colorful dashboard.

<img width="526" height="331" alt="Screenshot" src="https://github.com/user-attachments/assets/d0d2390a-6dc3-4fd1-bae8-4ce18e1e1ef6" />

## Preparations
This dashboard strategy needs a properly organized Home Assistant instance!

You should properly order your floors and areas and assign proper names and icons. If you have temperature and humidity sensors, assign them to an area and select them in the area properties.
If an entity isn't assigned to an area or if it's disabled or hidden, it won't show up.

## Supported features
* Weather
* Persons
* Favorites (add the label `favorite` to an entity)
* Floors
* Areas
* Temperature and humidity
* Climate
* Lights (add the labels `mainlight` and `nightlight` if needed)
* Switches

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
6. Go to `Settings` > `Dashboards` > `Add dashboard` > `New empty dashboard` then create
7. Go to the new `Dashboard` > `✎` > `Raw configuration`, paste the configuration from below, then save
8. Clear your frontend cache!

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
```
strategy:
  type: custom:bonbon-strategy
  options:
    max_columns: 1
    use_graphs: true
    weather_entity_id: auto
    translations:
      overview: Übersicht
      favorites: Favoriten
      lights: Beleuchtung
      openings: Fenster & Türen
      switches: Schalter
      climate: Heizung
```
