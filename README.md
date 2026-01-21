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

## Installation
1. Install Bubble Card (required!)
2. [optional] Install Lovelace Mini Graph Card (for temperature and humidity graphs)
3. [optional] Install card mod (to make the graphs look more like Bubble Cards)
4. Download `bonbon-strategy.js`
5. Place `bonbon-strategy.js` in `<config>/www/bonbon-strategy.js` (restart HA if `/www` didn't exist!)
6. Go to `Settings` > `Dashboards` > `⋮` > `Resources` > `Add resource` and enter `/local/bonbon-strategy.js` then add
7. Go to `Settings` > `Dashboards` > `Add dashboard` > `New empty dashboard` then create
8. Go to the new `Dashboard` > `✎` > `Raw configuration`, paste the configuration from below, then save
9. Clear your frontend cache!

Done!

## Configuration
Add this to your dashboard configuration. Change the translations and options as needed.
```
strategy:
  type: custom:bonbon-strategy
  options:
    # max_columns: 1
    # use_graphs: true
    # weather_entity_id: auto
    translations:
      overview: Übersicht
      favorites: Favoriten
      lights: Beleuchtung
      openings: Fenster & Türen
      switches: Schalter
```
