// Thanks Cloos!

const defaultConfig = {
  views: {
    bonbon_home: {
      max_columns: 1,
      sections: {
        bonbon_weather: {
          name: 'Weather',
          icon: 'mdi:cloud-question',
          order: 1,
          entity_id: 'auto',
          show_separator: true,
          min_columns: 1,
          max_columns: 1,
          style: 'inline',
          hidden: false,
        },
        bonbon_persons: {
          name: 'Persons',
          icon: 'mdi:account-group',
          order: 2,
          show_separator: false,
          min_columns: 1,
          max_columns: 2,
          hidden: false,
        },
        bonbon_favorites: {
          name: 'Favorites',
          icon: 'mdi:star',
          order: 3,
          show_separator: true,
          min_columns: 1,
          max_columns: 2,
          hidden: false,
        },
        bonbon_areas: {
          name: 'Areas',
          icon: 'mdi:sofa',
          order: 4,
          show_separator: true,
          min_columns: 2,
          max_columns: 2,
          show_temperature: true,
          show_humidity: true,
          show_co2: true,
          show_floor_lights_toggle: true,
          always_show_floor_lights_toggle: false,
          show_area_lights_toggle: true,
          always_show_area_lights_toggle: false,
          hidden: false,
        },
      },
    },
    bonbon_area: {
      subview: true,
      max_columns: 1,
      sections: {
        bonbon_environment: {
          name: 'Environment',
          icon: 'mdi:thermometer-water',
          order: 1,
          show_separator: true,
          min_columns: 1,
          max_columns: 3,
          style: 'graph',
          show_temperature: true,
          show_humidity: true,
          show_co2: true,
          hidden: false,
        },
        bonbon_climate: {
          name: 'Climate',
          icon: 'mdi:radiator',
          order: 2,
          show_separator: true,
          min_columns: 1,
          max_columns: 2,
          hidden: false,
        },
        bonbon_lights: {
          name: 'Lights',
          icon: 'mdi:lightbulb-group',
          order: 3,
          show_separator: true,
          min_columns: 1,
          max_columns: 2,
          show_area_lights_toggle: true,
          always_show_area_lights_toggle: true,
          hidden: false,
        },
        bonbon_switches: {
          name: 'Switches',
          icon: 'mdi:toggle-switch',
          order: 4,
          show_separator: true,
          min_columns: 1,
          max_columns: 2,
          hidden: false,
        },
        bonbon_media: {
          name: 'Media Players',
          icon: 'mdi:disc-player',
          order: 5,
          show_separator: true,
          min_columns: 1,
          max_columns: 1,
          hidden: false,
        },
        bonbon_openings: {
          name: 'Doors & Windows',
          icon: 'mdi:window-closed-variant',
          order: 6,
          show_separator: true,
          min_columns: 1,
          max_columns: 2,
          hidden: false,
        },
        bonbon_covers: {
          name: 'Shutters & Shades',
          icon: 'mdi:roller-shade',
          order: 7,
          show_separator: true,
          min_columns: 1,
          max_columns: 2,
          hidden: false,
        },
        bonbon_miscellaneous: {
          name: 'Miscellaneous',
          icon: 'mdi:dots-horizontal-circle-outline',
          order: 1000,
          show_separator: true,
          min_columns: 1,
          max_columns: 2,
          hidden: false,
        },
      },
    },
  },
};

export class BonbonStrategy {
  static async generate(userConfig, hass) {
    androidGesturesFix();
    try {
      const views = [];
      const config = mergeDeep(defaultConfig, userConfig);
      const dashboardName =
        Object.values(hass?.panels).find((p) => p?.url_path === hass?.panelUrl)
          ?.title ||
        hass?.config?.location_name ||
        'Home';

      const isDark =
        document
          .querySelector('meta[name="color-scheme"]')
          ?.getAttribute('content') === 'dark';

      let globalStyles = `
      *,
      *:before,
      *:after {
        --bubble-default-color: #9373c9;
        transition: all 0.3s ease-out !important;
      }
      .bubble-sub-button-name-container {
        white-space: nowrap !important;
      }
      .is-off .bubble-main-icon {
        opacity:  1;
      }
      :host {
        --primary-text-color: ${isDark ? '#eee' : '#111'};
        --bubble-line-background-color: rgba(0,0,0,0.05);
        --bubble-main-background-color: var(--ha-card-background, var(--card-background-color, #fff));
        --bubble-border-radius: var(--ha-card-border-radius, 12px);
        --bubble-icon-border-radius: 8px;
        --bubble-sub-button-border-radius: 8px;
        --bubble-button-border-radius: var(--bubble-border-radius);
      }
      .bubble-button-background {
        background-color: var(--ha-card-background,var(--card-background-color,#fff));
      }
      .is-on .bubble-button-background {
        background-color: var(--bubble-default-color) !important;
        opacity: 1 !important;
      }
      ha-card {
        border: none;
        border-top: 0.5px solid rgba(255,255,255,${isDark ? '0.01' : '0.2'});
        border-bottom: 0.5px solid rgba(0,0,0,${isDark ? '0.8' : '0.12'});
        box-shadow:  0 2px 6px rgba(0,0,0,${isDark ? '0.2' : '0.05'});
      }
      .bubble-main-icon-container {
        pointer-events: none;
      }
      .bubble-media-player-container,
      .bubble-calendar-container,
      :not(.bubble-media-player) > .bubble-button-container {
        border-top: 0.5px solid rgba(255,255,255,${isDark ? '0.01' : '0.2'});
        border-bottom: 0.5px solid rgba(0,0,0,${isDark ? '0.8' : '0.12'});
        box-shadow:  0 2px 6px rgba(0,0,0,${isDark ? '0.2' : '0.05'});
        border-radius: var(--bubble-button-border-radius);
      }
      mwc-list-item[selected],
      mwc-list-item[selected] ha-icon,
      .is-on :not(.bubble-media-player) > .bubble-content-container .bubble-name-container {
        color: #fff !important;
      }
      .bubble-dropdown-inner-border {
        display: none !important;
      }
      .bubble-separator .bubble-sub-button-container {
        right: 0;
      }
      .bubble-separator .bubble-sub-button {
        border-radius: 10px;
      }
    `;

      const entities = hass.entities;
      const states = hass.states;
      const devices = hass.devices;
      const labels = Object.values(entities).reduce((acc, e) => {
        if (e.labels && Array.isArray(e.labels)) {
          e.labels.forEach((label) => {
            if (!acc[label]) {
              acc[label] = [];
            }
            acc[label].push(e);
          });
        }
        return acc;
      }, {});

      const getLightRank = (e) => {
        if (
          e.labels?.includes('mainlight') ||
          e.labels?.includes('bonbon_mainlight')
        )
          return 1;
        if (
          e.labels?.includes('nightlight') ||
          e.labels?.includes('bonbon_nightlight')
        )
          return 3;
        return 2;
      };

      const getButton = (e) => {
        if (typeof e === 'string' && entities[e]) {
          e = entities[e];
        }
        const isMeasurement =
          states[e.entity_id]?.attributes?.unit_of_measurement != null;
        return {
          type: 'custom:bubble-card',
          card_type: 'button',
          entity: e.entity_id,
          show_state: true,
          show_last_changed: !isMeasurement,
          use_accent_color: true,
          tap_action: {
            action: 'none',
          },
          button_action: {
            tap_action: {
              action: 'more-info',
            },
          },
          styles: isMeasurement
            ? `
          .is-on .bubble-name-container {
            color: var(--primary-text-color) !important;
          }
          .is-on .bubble-button-background {
            background-color: var(--ha-card-background,var(--card-background-color,#fff)) !important;
            opacity: 1 !important;
          }
        `
            : '',
        };
      };

      const homeSections = Object.keys(config?.views?.bonbon_home?.sections)
        .filter((key) => {
          return !config.views.bonbon_home.sections[key].hidden;
        })
        .sort((aKey, bKey) => {
          const orderA = config.views.bonbon_home.sections[aKey].order ?? 999;
          const orderB = config.views.bonbon_home.sections[bKey].order ?? 999;
          return orderA - orderB;
        })
        .map((key) => {
          const sectionConfig = config.views.bonbon_home.sections[key];
          const section = {
            cards: [],
          };
          switch (key) {
            case 'bonbon_weather':
              let weather_entity_id = sectionConfig.weather_entity_id;
              if (
                !weather_entity_id ||
                !weather_entity_id.startsWith('weather.')
              ) {
                weather_entity_id =
                  Object.values(entities).filter((e) => {
                    return e.entity_id.startsWith('weather.');
                  })[0]?.entity_id || false;
              }
              if (weather_entity_id && states[weather_entity_id]) {
                if (sectionConfig.show_separator) {
                  section.cards.push({
                    type: 'custom:bubble-card',
                    card_type: 'separator',
                    name:
                      sectionConfig.style == 'inline'
                        ? entities[weather_entity_id]?.name ||
                          states[weather_entity_id]?.attributes
                            ?.friendly_name ||
                          devices[entities[weather_entity_id]?.device_id]
                            ?.name ||
                          sectionConfig.name
                        : sectionConfig.name,
                    icon:
                      sectionConfig.style == 'inline'
                        ? getWeatherIcon(states[weather_entity_id]?.state)
                        : sectionConfig.icon,
                    sub_button:
                      sectionConfig.style == 'inline'
                        ? [
                            {
                              entity: weather_entity_id,
                              show_attribute: true,
                              attribute: 'temperature',
                              icon: 'mdi:thermometer',
                              show_state: false,
                              show_background: false,
                              tap_action: {
                                action: 'more-info',
                                entity: weather_entity_id,
                              },
                            },
                          ]
                        : false,
                  });
                }
                switch (sectionConfig.style) {
                  case 'button':
                    section.cards.push({
                      type: 'custom:bubble-card',
                      card_type: 'button',
                      entity: weather_entity_id,
                      show_state: true,
                      show_last_changed: false,
                      use_accent_color: true,
                      tap_action: {
                        action: 'none',
                      },
                      button_action: {
                        tap_action: {
                          action: 'more-info',
                        },
                      },
                      sub_button: [
                        {
                          entity: weather_entity_id,
                          show_attribute: true,
                          attribute: 'temperature',
                          icon: 'mdi:thermometer',
                          show_state: false,
                          show_background: false,
                          tap_action: {
                            action: 'more-info',
                            entity: weather_entity_id,
                          },
                        },
                      ],
                    });
                    break;
                }
              }
              break;
            case 'bonbon_persons':
              const persons = Object.values(entities).filter((e) => {
                return (
                  e.entity_id.startsWith('person.') &&
                  !e.hidden &&
                  !e.labels?.includes('hidden') &&
                  !e.labels?.includes('bonbon_hidden')
                );
              });
              if (persons.length) {
                if (sectionConfig.show_separator) {
                  section.cards.push({
                    type: 'custom:bubble-card',
                    card_type: 'separator',
                    name: sectionConfig.name,
                    icon: sectionConfig.icon,
                  });
                }
                section.cards.push({
                  type: 'grid',
                  columns:
                    sectionConfig.columns ||
                    Math.min(
                      Math.max(sectionConfig.min_columns || 1, persons.length),
                      sectionConfig.max_columns || 1,
                    ),
                  square: false,
                  cards: persons.map((e) => {
                    return {
                      type: 'custom:bubble-card',
                      card_type: 'button',
                      button_type: 'state',
                      entity: e.entity_id,
                      show_state: true,
                    };
                  }),
                });
              }
              break;
            case 'bonbon_favorites':
              const favorites = Object.values(entities).filter((e) => {
                const isFavorite =
                  e.labels?.includes('favorite') ||
                  e.labels?.includes('bonbon_favorite');
                const isUserEntity = !e.entity_category;
                const isHidden =
                  e.hidden ||
                  e.labels?.includes('hidden') ||
                  e.labels?.includes('bonbon_hidden');

                if (isFavorite && isUserEntity && !isHidden) {
                  return true;
                }

                return false;
              });

              if (favorites.length) {
                if (sectionConfig.show_separator) {
                  section.cards.push({
                    type: 'custom:bubble-card',
                    card_type: 'separator',
                    name: sectionConfig.name,
                    icon: sectionConfig.icon,
                  });
                }
                section.cards.push({
                  type: 'grid',
                  columns:
                    sectionConfig.columns ||
                    Math.min(
                      Math.max(
                        sectionConfig.min_columns || 1,
                        favorites.length,
                      ),
                      sectionConfig.max_columns || 1,
                    ),
                  square: false,
                  cards: favorites.map((e) => {
                    return getButton(e);
                  }),
                });
              }
              break;
            case 'bonbon_areas':
              const floors = Object.values({
                ...(hass.floors || {}),
                _areas: {
                  name: sectionConfig.name,
                  floor_id: '_areas',
                  icon: sectionConfig.icon || 'mdi:sofa',
                  level: 99,
                },
              }).map((floor, index, floors) => {
                floor._lights = Object.values(entities)
                  .filter((e) => {
                    const isLight = e.entity_id.startsWith('light.');
                    const device = devices[e.device_id];
                    const area_id = e.area_id || device?.area_id;
                    const area = hass.areas[area_id];
                    const onFloor = area?.floor_id == floor.floor_id;
                    const isUserEntity = !e.entity_category;
                    const isHidden =
                      e.hidden ||
                      e.labels?.includes('hidden') ||
                      e.labels?.includes('bonbon_hidden');

                    if (isLight && isUserEntity && onFloor && !isHidden) {
                      return true;
                    }
                    return false;
                  })
                  .sort((eA, eB) => {
                    const rankA = getLightRank(eA);
                    const rankB = getLightRank(eB);
                    if (rankA !== rankB) {
                      return rankA - rankB;
                    }
                    const nameA =
                      eA.name ||
                      states[eA.entity_id]?.attributes?.friendly_name ||
                      eA.entity_id;
                    const nameB =
                      eB.name ||
                      states[eB.entity_id]?.attributes?.friendly_name ||
                      eB.entity_id;

                    return nameA.localeCompare(nameB);
                  });
                return floor;
              });

              const nightlights = Object.values(entities).filter((e) => {
                const isLight = e.entity_id.startsWith('light.');
                const isNightlight =
                  e.labels?.includes('nightlight') ||
                  e.labels?.includes('bonbon_nightlight');
                const isUserEntity = !e.entity_category;
                const isHidden =
                  e.hidden ||
                  e.labels?.includes('hidden') ||
                  e.labels?.includes('bonbon_hidden');

                if (isLight && isNightlight && isUserEntity && !isHidden) {
                  return true;
                }
                return false;
              });

              const areas = Object.values(hass.areas)
                .filter(
                  (a) =>
                    !a.labels?.includes('hidden') &&
                    !a.labels?.includes('bonbon_hidden'),
                )
                .map(function (area, index, areas) {
                  if (area.floor_id == null) {
                    area.floor_id = '_areas';
                  }
                  const seed = area.area_id + String(index) + area.name;
                  let hash = 0;
                  for (let i = 0; i < seed.length; i++) {
                    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
                  }
                  const colorIndex = Math.abs(hash % areas.length);

                  const hue = (colorIndex * (360 / areas.length)) % 360;
                  const saturation = isDark ? 20 : 40;
                  const lightness = isDark ? 40 : 77;

                  const lightColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                  const defltColor = `hsl(${hue}, ${saturation}%, ${lightness - 5}%)`;
                  const shadeColor = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;
                  area.lightColor = lightColor;
                  area.defltColor = defltColor;
                  area.shadeColor = shadeColor;

                  const categorizedEntityIds = [
                    area.temperature_entity_id,
                    area.humidity_entity_id,
                  ];

                  area.co2_entity_id = Object.values(entities).find((e) => {
                    states[e.entity_id]?.attributes?.device_class ===
                      'carbon_dioxide';

                    const isCo2 =
                      states[e.entity_id]?.attributes?.device_class ===
                        'carbon_dioxide' ||
                      (e.entity_id.includes('co2') &&
                        states[e.entity_id]?.attributes?.unit_of_measurement ===
                          'ppm');
                    const inArea = e.area_id === area.area_id;
                    const device = devices[e.device_id];
                    const deviceInArea =
                      device && device.area_id === area.area_id;
                    const isUserEntity = !e.entity_category;
                    const isHidden =
                      e.hidden ||
                      e.labels?.includes('hidden') ||
                      e.labels?.includes('bonbon_hidden');

                    if (
                      isCo2 &&
                      isUserEntity &&
                      (inArea || deviceInArea) &&
                      !isHidden &&
                      !categorizedEntityIds.includes(e.entity_id)
                    ) {
                      categorizedEntityIds.push(e.entity_id);
                      return true;
                    }
                    return false;
                  })?.entity_id;

                  Object.values(config?.views?.bonbon_area?.sections)
                    .filter((s) => {
                      return !s.hidden;
                    })
                    .map((s) => {
                      return s.cards;
                    })
                    .flat()
                    .forEach((c) => {
                      if (c !== null && typeof c === 'object') {
                        getAllEntityIds(c).forEach(function (entity_id) {
                          if (entities[entity_id]) {
                            categorizedEntityIds.push(entity_id);
                          }
                        });
                      }
                      if (typeof c === 'string' && entities[c]) {
                        categorizedEntityIds.push(c);
                      }
                      if (typeof c === 'string' && labels[c]) {
                        labels[c].forEach((e) => {
                          categorizedEntityIds.push(e.entity_id);
                        });
                      }
                    });

                  area._lights = Object.values(entities)
                    .filter((e) => {
                      const isLight = e.entity_id.startsWith('light.');
                      const inArea = e.area_id === area.area_id;
                      const device = devices[e.device_id];
                      const deviceInArea =
                        device && device.area_id === area.area_id;
                      const isUserEntity = !e.entity_category;
                      const isHidden =
                        e.hidden ||
                        e.labels?.includes('hidden') ||
                        e.labels?.includes('bonbon_hidden');

                      if (
                        isLight &&
                        isUserEntity &&
                        (inArea || deviceInArea) &&
                        !isHidden &&
                        !categorizedEntityIds.includes(e.entity_id)
                      ) {
                        categorizedEntityIds.push(e.entity_id);
                        return true;
                      }
                      return false;
                    })
                    .sort((eA, eB) => {
                      const rankA = getLightRank(eA);
                      const rankB = getLightRank(eB);
                      if (rankA !== rankB) {
                        return rankA - rankB;
                      }
                      const nameA =
                        eA.name ||
                        states[eA.entity_id]?.attributes?.friendly_name ||
                        eA.entity_id;
                      const nameB =
                        eB.name ||
                        states[eB.entity_id]?.attributes?.friendly_name ||
                        eB.entity_id;

                      return nameA.localeCompare(nameB);
                    });
                  area._switches = Object.values(entities)
                    .filter((e) => {
                      const isSwitch = e.entity_id.startsWith('switch.');
                      const inArea = e.area_id === area.area_id;
                      const device = devices[e.device_id];
                      const deviceInArea =
                        device && device.area_id === area.area_id;
                      const isUserEntity = !e.entity_category;
                      const isHidden =
                        e.hidden ||
                        e.labels?.includes('hidden') ||
                        e.labels?.includes('bonbon_hidden');

                      if (
                        isSwitch &&
                        isUserEntity &&
                        (inArea || deviceInArea) &&
                        !isHidden &&
                        !categorizedEntityIds.includes(e.entity_id)
                      ) {
                        categorizedEntityIds.push(e.entity_id);
                        return true;
                      }
                      return false;
                    })
                    .sort((eA, eB) => {
                      const nameA =
                        eA.name ||
                        states[eA.entity_id]?.attributes?.friendly_name ||
                        eA.entity_id;
                      const nameB =
                        eB.name ||
                        states[eA.entity_id]?.attributes?.friendly_name ||
                        eB.entity_id;
                      return nameA.localeCompare(nameB);
                    });
                  area._openings = Object.values(entities)
                    .filter((e) => {
                      const isContact =
                        e.entity_id.startsWith('binary_sensor.') &&
                        e.entity_id.endsWith('_contact');
                      const inArea = e.area_id === area.area_id;
                      const device = devices[e.device_id];
                      const deviceInArea =
                        device && device.area_id === area.area_id;
                      const isUserEntity = !e.entity_category;
                      const isHidden =
                        e.hidden ||
                        e.labels?.includes('hidden') ||
                        e.labels?.includes('bonbon_hidden');
                      if (
                        isContact &&
                        isUserEntity &&
                        (inArea || deviceInArea) &&
                        !isHidden &&
                        !categorizedEntityIds.includes(e.entity_id)
                      ) {
                        categorizedEntityIds.push(e.entity_id);
                        return true;
                      }
                      return false;
                    })
                    .sort((eA, eB) => {
                      const nameA =
                        eA.name ||
                        states[eA.entity_id]?.attributes?.friendly_name ||
                        eA.entity_id;
                      const nameB =
                        eB.name ||
                        states[eA.entity_id]?.attributes?.friendly_name ||
                        eB.entity_id;
                      return nameA.localeCompare(nameB);
                    });

                  area._media = Object.values(entities)
                    .filter((e) => {
                      const isMedia = e.entity_id.startsWith('media_player.');
                      const inArea = e.area_id === area.area_id;
                      const device = devices[e.device_id];
                      const deviceInArea =
                        device && device.area_id === area.area_id;
                      const isUserEntity = !e.entity_category;
                      const isHidden =
                        e.hidden ||
                        e.labels?.includes('hidden') ||
                        e.labels?.includes('bonbon_hidden');
                      if (
                        isMedia &&
                        isUserEntity &&
                        (inArea || deviceInArea) &&
                        !isHidden &&
                        !categorizedEntityIds.includes(e.entity_id)
                      ) {
                        categorizedEntityIds.push(e.entity_id);
                        return true;
                      }
                      return false;
                    })
                    .sort((eA, eB) => {
                      const nameA =
                        eA.name ||
                        states[eA.entity_id]?.attributes?.friendly_name ||
                        eA.entity_id;
                      const nameB =
                        eB.name ||
                        states[eA.entity_id]?.attributes?.friendly_name ||
                        eB.entity_id;
                      return nameA.localeCompare(nameB);
                    });

                  area._covers = Object.values(entities)
                    .filter((e) => {
                      const isCover = e.entity_id.startsWith('cover.');
                      const inArea = e.area_id === area.area_id;
                      const device = devices[e.device_id];
                      const deviceInArea =
                        device && device.area_id === area.area_id;
                      const isUserEntity = !e.entity_category;
                      const isHidden =
                        e.hidden ||
                        e.labels?.includes('hidden') ||
                        e.labels?.includes('bonbon_hidden');
                      if (
                        isCover &&
                        isUserEntity &&
                        (inArea || deviceInArea) &&
                        !isHidden &&
                        !categorizedEntityIds.includes(e.entity_id)
                      ) {
                        categorizedEntityIds.push(e.entity_id);
                        return true;
                      }
                      return false;
                    })
                    .sort((eA, eB) => {
                      const nameA =
                        eA.name ||
                        states[eA.entity_id]?.attributes?.friendly_name ||
                        eA.entity_id;
                      const nameB =
                        eB.name ||
                        states[eA.entity_id]?.attributes?.friendly_name ||
                        eB.entity_id;
                      return nameA.localeCompare(nameB);
                    });

                  area._climates = Object.values(entities)
                    .filter((e) => {
                      const isClimate = e.entity_id.startsWith('climate.');
                      const inArea = e.area_id === area.area_id;
                      const device = devices[e.device_id];
                      const deviceInArea =
                        device && device.area_id === area.area_id;
                      const isUserEntity = !e.entity_category;
                      const isHidden =
                        e.hidden ||
                        e.labels?.includes('hidden') ||
                        e.labels?.includes('bonbon_hidden');
                      if (
                        isClimate &&
                        isUserEntity &&
                        (inArea || deviceInArea) &&
                        !isHidden &&
                        !categorizedEntityIds.includes(e.entity_id)
                      ) {
                        categorizedEntityIds.push(e.entity_id);
                        return true;
                      }
                      return false;
                    })
                    .sort((eA, eB) => {
                      const nameA =
                        eA.name ||
                        states[eA.entity_id]?.attributes?.friendly_name ||
                        eA.entity_id;
                      const nameB =
                        eB.name ||
                        states[eA.entity_id]?.attributes?.friendly_name ||
                        eB.entity_id;
                      return nameA.localeCompare(nameB);
                    });

                  area._misc = Object.values(entities)
                    .filter((e) => {
                      const inArea = e.area_id === area.area_id;
                      const device = devices[e.device_id];
                      const deviceInArea =
                        device && device.area_id === area.area_id;
                      const isUserEntity = !e.entity_category;
                      const isHidden =
                        e.hidden ||
                        e.labels?.includes('hidden') ||
                        e.labels?.includes('bonbon_hidden');
                      if (
                        isUserEntity &&
                        (inArea || deviceInArea) &&
                        !isHidden &&
                        !categorizedEntityIds.includes(e.entity_id)
                      ) {
                        return true;
                      }
                      return false;
                    })
                    .sort((eA, eB) => {
                      const nameA =
                        eA.name ||
                        states[eA.entity_id]?.attributes?.friendly_name ||
                        eA.entity_id;
                      const nameB =
                        eB.name ||
                        states[eA.entity_id]?.attributes?.friendly_name ||
                        eB.entity_id;
                      return nameA.localeCompare(nameB);
                    });
                  return area;
                });

              floors.forEach((floor, index, floors) => {
                const floorAreas = areas.filter(
                  (area) => area.floor_id == floor.floor_id,
                );
                if (floorAreas.length) {
                  if (sectionConfig.show_separator) {
                    const notNightlights = (floor._lights || []).filter(
                      (e) =>
                        nightlights
                          .map((nightlight) => nightlight.entity_id)
                          .indexOf(e.entity_id) == -1,
                    );
                    section.cards.push({
                      type: 'custom:bubble-card',
                      card_type: 'separator',
                      name: floor.name,
                      icon:
                        floor.icon ||
                        'mdi:home-floor-' +
                          String(floor.level).replace('-', 'negative-'),
                      sub_button: sectionConfig.show_floor_lights_toggle
                        ? {
                            main: (notNightlights || [])
                              .map((e, index, filtered) => {
                                return ['off', 'on'].map((state) => {
                                  return {
                                    entity: e.entity_id,
                                    show_state: false,
                                    content_layout: 'icon-left',
                                    use_accent_color: true,
                                    icon: sectionConfig.always_show_floor_lights_toggle
                                      ? 'mdi:lightbulb-group'
                                      : '',
                                    tap_action: {
                                      action: 'call-service',
                                      service: 'light.turn_' + state,
                                      target: {
                                        entity_id: filtered.map(
                                          (e) => e.entity_id,
                                        ),
                                      },
                                    },
                                  };
                                });
                              })
                              .flat(),
                          }
                        : false,
                      styles: sectionConfig.always_show_floor_lights_toggle
                        ? `
                                .bubble-sub-button,
                                .bubble-sub-button-container:not(:has(.background-on)) .bubble-sub-button {
                                  background-color: var(--ha-card-background,var(--card-background-color,#fff));
                                  box-shadow: 0 2px 6px rgba(0,0,0,${isDark ? '0.2' : '0.05'});
                                }
                                .bubble-sub-button-container:has(.background-on) .bubble-sub-button {
                                  color: #fff;
                                  background-color: var(--bubble-default-color);
                                }
                                .bubble-sub-button-container:has(.background-on) .bubble-sub-button:not([data-tap-action*='light.turn_off']),
                                .bubble-sub-button-container:has(.background-on) .bubble-sub-button[data-tap-action*='light.turn_off'] ~ .bubble-sub-button[data-tap-action*='light.turn_off']{
                                  display: none !important;
                                }
                                .bubble-sub-button-container:not(:has(.background-on)) .bubble-sub-button:not([data-tap-action*='light.turn_on']),
                                .bubble-sub-button-container:not(:has(.background-on)) .bubble-sub-button[data-tap-action*='light.turn_on'] ~ .bubble-sub-button[data-tap-action*='light.turn_on']{
                                  display: none !important;
                                }
                              `
                        : `
                                .bubble-sub-button {
                                  background-color: var(--ha-card-background,var(--card-background-color,#fff));
                                  box-shadow: 0 2px 6px rgba(0,0,0,${isDark ? '0.2' : '0.05'});
                                }
                                .background-on {
                                  color: #fff;
                                  background-color: var(--bubble-default-color);
                                }
                                .bubble-sub-button-container .bubble-sub-button:not(.background-on),
                                .bubble-sub-button-container .bubble-sub-button.background-on ~ .bubble-sub-button.background-on {
                                  display: none !important;
                                }
                              `,
                    });
                  }

                  section.cards.push({
                    type: 'grid',
                    columns:
                      sectionConfig.columns ||
                      Math.min(
                        Math.max(
                          sectionConfig.min_columns || 1,
                          floorAreas.length,
                        ),
                        sectionConfig.max_columns || 1,
                      ),
                    square: false,
                    cards: floorAreas.map((area) => {
                      const notNightlights = (area._lights || []).filter(
                        (e) =>
                          nightlights
                            .map((nightlight) => nightlight.entity_id)
                            .indexOf(e.entity_id) == -1,
                      );
                      return {
                        type: 'custom:bubble-card',
                        card_type: 'button',
                        button_type: 'name',
                        icon: area.icon,
                        show_state: false,
                        name: area.name.split(' (')[0],
                        hold_action: {
                          action: 'none',
                        },
                        tap_action: {
                          action: 'none',
                        },
                        button_action: {
                          tap_action: {
                            action: 'navigate',
                            navigation_path: `area_${area.area_id}`,
                          },
                          hold_action: {
                            action: 'none',
                          },
                        },
                        sub_button: {
                          main: sectionConfig.show_area_lights_toggle
                            ? (notNightlights || [])
                                .map((e, index, filtered) => {
                                  return ['off', 'on'].map((state) => {
                                    return {
                                      entity: e.entity_id,
                                      show_state: false,
                                      content_layout: 'icon-left',
                                      use_accent_color: true,
                                      icon: sectionConfig.always_show_area_lights_toggle
                                        ? 'mdi:lightbulb-group'
                                        : '',
                                      tap_action: {
                                        action: 'call-service',
                                        service: 'light.turn_' + state,
                                        target: {
                                          entity_id: filtered.map(
                                            (e) => e.entity_id,
                                          ),
                                        },
                                      },
                                    };
                                  });
                                })
                                .flat()
                            : [],
                          bottom: [
                            {
                              buttons_layout: 'inline',
                              justify_content: 'start',
                              group: [
                                sectionConfig.show_temperature
                                  ? area.temperature_entity_id
                                  : false,
                                sectionConfig.show_humidity
                                  ? area.humidity_entity_id
                                  : false,
                                sectionConfig.show_co2
                                  ? area.co2_entity_id
                                  : false,
                              ]
                                .filter((e_id) => e_id)
                                .map((e_id) => {
                                  return {
                                    entity: e_id,
                                    show_background: false,
                                    show_state: true,
                                    content_layout: 'icon-left',
                                    fill_width: false,
                                  };
                                }),
                            },
                          ],
                          bottom_layout: 'inline',
                        },
                        rows:
                          sectionConfig.show_temperature ||
                          sectionConfig.show_humidity ||
                          sectionConfig.show_co2
                            ? 1.4
                            : 1,
                        styles:
                          `
                        .fixed-top .bubble-sub-button-container {
                          ${sectionConfig.show_temperature || sectionConfig.show_humidity || sectionConfig.show_co2 ? 'margin-top: 8px;' : ''}
                        }
                        ha-ripple {
                          display: none;
                        }
                        .bubble-container {
                          background: ${area.lightColor};
                          overflow: hidden;
                        }
                        .bubble-button-background {
                          opacity: 1 !important;
                          background: ${area.lightColor} !important;
                        }
                        // .bubble-sub-button-container .bubble-sub-button.background-on {
                        //   background: ${area.defltColor} !important;
                        // }
                        .bubble-main-icon-container {
                          background: transparent;
                          margin: 0;
                          position: absolute;
                          top: 50%;
                          left: -4px;
                          transform: translateY(-50%);
                          overflow: visible;
                        }
                        .bubble-main-icon-container:before {
                          display: block;
                          width: 1000%;
                          height: 1000%;
                          content: '';
                          background: ${area.defltColor};
                          position: absolute;
                          top: 50%;
                          right: -4px;
                          transform: translateY(-50%);
                          border-radius: 50%;
                        }
                        .bubble-container:hover .bubble-button-background {
                          background: ${area.defltColor} !important;
                        }
                        .bubble-container:hover .bubble-main-icon-container:before {
                          background: ${area.shadeColor} !important;
                        }
                        .bubble-name-container {
                          margin-left: 62px !important;
                        }
                        .bubble-name {
                          font-size: 16px;
                        }
                        .bubble-sub-button-bottom-container,
                        .bubble-sub-button-bottom-container * {
                          pointer-events: none !important;
                        }
                        .bubble-sub-button-bottom-container .bubble-sub-button:first-child {
                          margin-left: 42px !important;
                        }
                        .bubble-sub-button-bottom-container .bubble-sub-button {
                          padding-right: 0;
                        }
                        .bubble-sub-button-bottom-container .icon-with-state {
                          margin-right: 2px;
                        }
                        .bubble-sub-button-group {
                          gap: 0;
                        }
                      ` +
                          (sectionConfig.always_show_area_lights_toggle
                            ? `
                                .bubble-sub-button-container.fixed-top .bubble-sub-button,
                                .bubble-sub-button-container.fixed-top:not(:has(.background-on)) .bubble-sub-button {
                                  background: ${area.defltColor} !important;
                                }
                                .bubble-container:hover .bubble-sub-button-container.fixed-top .bubble-sub-button,
                                .bubble-container:hover .bubble-sub-button-container.fixed-top:not(:has(.background-on)) .bubble-sub-button {
                                  background: ${area.shadeColor} !important;
                                }
                                .bubble-sub-button-container.fixed-top:has(.background-on) .bubble-sub-button,
                                .bubble-container:hover .bubble-sub-button-container.fixed-top:has(.background-on) .bubble-sub-button {
                                  background: var(--bubble-default-color) !important;
                                  color: #fff !important;
                                }
                                .bubble-sub-button-container.fixed-top:has(.background-on) .bubble-sub-button:not([data-tap-action*='light.turn_off']),
                                .bubble-sub-button-container.fixed-top:has(.background-on) .bubble-sub-button[data-tap-action*='light.turn_off'] ~ .bubble-sub-button[data-tap-action*='light.turn_off']{
                                  display: none !important;
                                }
                                .bubble-sub-button-container.fixed-top:not(:has(.background-on)) .bubble-sub-button:not([data-tap-action*='light.turn_on']),
                                .bubble-sub-button-container.fixed-top:not(:has(.background-on)) .bubble-sub-button[data-tap-action*='light.turn_on'] ~ .bubble-sub-button[data-tap-action*='light.turn_on']{
                                  display: none !important;
                                }
                              `
                            : `
                                .bubble-sub-button-container.fixed-top .bubble-sub-button {
                                  background: ${area.defltColor} !important;
                                }
                                .bubble-container:hover .bubble-sub-button-container.fixed-top .bubble-sub-button,
                                .bubble-container:hover .bubble-sub-button-container.fixed-top:not(:has(.background-on)) .bubble-sub-button {
                                  background: ${area.shadeColor} !important;
                                }
                                .bubble-sub-button-container.fixed-top .background-on {
                                  background: ${area.dfltColor} !important;
                                }
                                .bubble-container:hover .bubble-sub-button-container.fixed-top .background-on {
                                  background: ${area.shadeColor} !important;
                                }
                                .bubble-sub-button-container.fixed-top .bubble-sub-button:not(.background-on),
                                .bubble-sub-button-container.fixed-top .bubble-sub-button.background-on ~ .bubble-sub-button.background-on {
                                  display: none !important;
                                }
                              `),
                      };
                    }),
                  });
                }
              });

              areas.forEach((area) => {
                const areaSections = Object.keys(
                  config?.views?.bonbon_area?.sections,
                )
                  .filter((key) => {
                    return !config.views.bonbon_area.sections[key].hidden;
                  })
                  .sort((aKey, bKey) => {
                    const orderA =
                      config.views.bonbon_area.sections[aKey].order ?? 999;
                    const orderB =
                      config.views.bonbon_area.sections[bKey].order ?? 999;
                    return orderA - orderB;
                  })
                  .map((key) => {
                    const sectionConfig =
                      config.views.bonbon_area.sections[key];
                    const section = {
                      cards: [],
                    };
                    switch (key) {
                      case 'bonbon_environment':
                        if (
                          area.temperature_entity_id ||
                          area.humidity_entity_id ||
                          area.co2_entity_id
                        )
                          if (sectionConfig.show_separator) {
                            section.cards.push({
                              type: 'custom:bubble-card',
                              card_type: 'separator',
                              name: sectionConfig.name,
                              icon: sectionConfig.icon,
                            });
                          }
                        section.cards.push({
                          type: 'grid',
                          columns:
                            sectionConfig.columns ||
                            Math.min(
                              Math.max(
                                sectionConfig.min_columns || 1,
                                [
                                  area.temperature_entity_id,
                                  area.humidity_entity_id,
                                  area.co2_entity_id,
                                ].filter((e_id) => e_id).length,
                              ),
                              sectionConfig.max_columns || 1,
                            ),
                          square: false,
                          cards: [
                            area.temperature_entity_id,
                            area.humidity_entity_id,
                            area.co2_entity_id,
                          ]
                            .filter((e_id) => e_id)
                            .map((e_id) => {
                              if (e_id) {
                                return sectionConfig.style == 'graph' &&
                                  window.customCards
                                    ?.map((cc) => cc.type)
                                    .includes('mini-graph-card')
                                  ? {
                                      type: 'custom:mini-graph-card',
                                      font_size: 60,
                                      entities: [e_id],
                                    }
                                  : {
                                      type: 'custom:bubble-card',
                                      card_type: 'button',
                                      entity: e_id,
                                      show_state: true,
                                      show_last_changed: false,
                                      use_accent_color: true,
                                      tap_action: {
                                        action: 'none',
                                      },
                                      button_action: {
                                        tap_action: {
                                          action: 'more-info',
                                        },
                                      },
                                      styles: `
                                    .is-on .bubble-name-container {
                                      color: var(--primary-text-color) !important;
                                    }
                                    .is-on .bubble-button-background {
                                      background-color: var(--ha-card-background,var(--card-background-color,#fff)) !important;
                                      opacity: 1 !important;
                                    }
                                  `,
                                    };
                              }
                              return false;
                            }),
                        });
                        break;
                      case 'bonbon_climate':
                        if (area._climates.length) {
                          if (sectionConfig.show_separator) {
                            section.cards.push({
                              type: 'custom:bubble-card',
                              card_type: 'separator',
                              name: sectionConfig.name,
                              icon: sectionConfig.icon,
                            });
                          }
                          section.cards.push({
                            type: 'grid',
                            columns:
                              sectionConfig.columns ||
                              Math.min(
                                Math.max(
                                  sectionConfig.min_columns || 1,
                                  area._climates.length,
                                ),
                                sectionConfig.max_columns || 1,
                              ),
                            square: false,
                            cards: area._climates.map((e) => {
                              return {
                                type: 'custom:bubble-card',
                                card_type: 'climate',
                                entity: e.entity_id,
                                show_state: true,
                                state_color: true,
                                show_last_changed: true,
                                sub_button: [
                                  {
                                    select_attribute: 'hvac_modes',
                                    show_arrow: false,
                                    state_background: false,
                                  },
                                ],
                              };
                            }),
                          });
                        }
                        break;
                      case 'bonbon_lights':
                        if (area._lights.length) {
                          const notNightlights = (area._lights || []).filter(
                            (e) =>
                              nightlights
                                .map((nightlight) => nightlight.entity_id)
                                .indexOf(e.entity_id) == -1,
                          );
                          if (sectionConfig.show_separator) {
                            section.cards.push({
                              type: 'custom:bubble-card',
                              card_type: 'separator',
                              name: sectionConfig.name,
                              icon: sectionConfig.icon,
                              sub_button: sectionConfig.show_area_lights_toggle
                                ? {
                                    main: (notNightlights || [])
                                      .map((e, index, filtered) => {
                                        return ['off', 'on'].map((state) => {
                                          return {
                                            entity: e.entity_id,
                                            show_state: false,
                                            content_layout: 'icon-left',
                                            use_accent_color: true,
                                            icon: sectionConfig.always_show_area_lights_toggle
                                              ? 'mdi:lightbulb-group'
                                              : '',
                                            tap_action: {
                                              action: 'call-service',
                                              service: 'light.turn_' + state,
                                              target: {
                                                entity_id: filtered.map(
                                                  (e) => e.entity_id,
                                                ),
                                              },
                                            },
                                          };
                                        });
                                      })
                                      .flat(),
                                  }
                                : false,
                              styles:
                                sectionConfig.always_show_area_lights_toggle
                                  ? `
                                .bubble-sub-button,
                                .bubble-sub-button-container:not(:has(.background-on)) .bubble-sub-button {
                                  background-color: var(--ha-card-background,var(--card-background-color,#fff));
                                  box-shadow: 0 2px 6px rgba(0,0,0,${isDark ? '0.2' : '0.05'});
                                }
                                .bubble-sub-button-container:has(.background-on) .bubble-sub-button {
                                  color: #fff;
                                  background-color: var(--bubble-default-color);
                                }
                                .bubble-sub-button-container:has(.background-on) .bubble-sub-button:not([data-tap-action*='light.turn_off']),
                                .bubble-sub-button-container:has(.background-on) .bubble-sub-button[data-tap-action*='light.turn_off'] ~ .bubble-sub-button[data-tap-action*='light.turn_off']{
                                  display: none !important;
                                }
                                .bubble-sub-button-container:not(:has(.background-on)) .bubble-sub-button:not([data-tap-action*='light.turn_on']),
                                .bubble-sub-button-container:not(:has(.background-on)) .bubble-sub-button[data-tap-action*='light.turn_on'] ~ .bubble-sub-button[data-tap-action*='light.turn_on']{
                                  display: none !important;
                                }
                              `
                                  : `
                                .bubble-sub-button {
                                  background-color: var(--ha-card-background,var(--card-background-color,#fff));
                                  box-shadow: 0 2px 6px rgba(0,0,0,${isDark ? '0.2' : '0.05'});
                                }
                                .background-on {
                                  color: #fff;
                                  background-color: var(--bubble-default-color);
                                }
                                .bubble-sub-button-container .bubble-sub-button:not(.background-on),
                                .bubble-sub-button-container .bubble-sub-button.background-on ~ .bubble-sub-button.background-on {
                                  display: none !important;
                                }
                              `,
                            });
                          }
                          section.cards.push({
                            type: 'grid',
                            columns:
                              sectionConfig.columns ||
                              Math.min(
                                Math.max(
                                  sectionConfig.min_columns || 1,
                                  area._lights.length,
                                ),
                                sectionConfig.max_columns || 1,
                              ),
                            square: false,
                            cards: area._lights.map((e) => {
                              return {
                                type: 'custom:bubble-card',
                                card_type: 'button',
                                entity: e.entity_id,
                                show_state: true,
                                show_last_changed: true,
                                use_accent_color: true,
                                tap_action: {
                                  action: 'none',
                                },
                              };
                            }),
                          });
                        }
                        break;
                      case 'bonbon_switches':
                        if (area._switches.length) {
                          if (sectionConfig.show_separator) {
                            section.cards.push({
                              type: 'custom:bubble-card',
                              card_type: 'separator',
                              name: sectionConfig.name,
                              icon: sectionConfig.icon,
                            });
                          }
                          section.cards.push({
                            type: 'grid',
                            columns:
                              sectionConfig.columns ||
                              Math.min(
                                Math.max(
                                  sectionConfig.min_columns || 1,
                                  area._switches.length,
                                ),
                                sectionConfig.max_columns || 1,
                              ),
                            square: false,
                            cards: area._switches.map((e) => {
                              return {
                                type: 'custom:bubble-card',
                                card_type: 'button',
                                entity: e.entity_id,
                                show_state: true,
                                show_last_changed: true,
                                use_accent_color: true,
                                tap_action: {
                                  action: 'none',
                                },
                              };
                            }),
                          });
                        }
                        break;
                      case 'bonbon_media':
                        if (area._media.length) {
                          if (sectionConfig.show_separator) {
                            section.cards.push({
                              type: 'custom:bubble-card',
                              card_type: 'separator',
                              name: sectionConfig.name,
                              icon: sectionConfig.icon,
                            });
                          }
                          section.cards.push({
                            type: 'grid',
                            columns:
                              sectionConfig.columns ||
                              Math.min(
                                Math.max(
                                  sectionConfig.min_columns || 1,
                                  area._media.length,
                                ),
                                sectionConfig.max_columns || 1,
                              ),
                            square: false,
                            cards: area._media.map((e) => {
                              return {
                                type: 'custom:bubble-card',
                                card_type: 'media-player',
                                entity: e.entity_id,
                                show_state: true,
                                show_last_changed: true,
                                use_accent_color: true,
                                tap_action: {
                                  action: 'none',
                                },
                                button_action: {
                                  tap_action: {
                                    action: 'more-info',
                                  },
                                }
                              };
                            }),
                          });
                        }
                        break;
                      case 'bonbon_openings':
                        if (area._openings.length) {
                          if (sectionConfig.show_separator) {
                            section.cards.push({
                              type: 'custom:bubble-card',
                              card_type: 'separator',
                              name: sectionConfig.name,
                              icon: sectionConfig.icon,
                            });
                          }
                          section.cards.push({
                            type: 'grid',
                            columns:
                              sectionConfig.columns ||
                              Math.min(
                                Math.max(
                                  sectionConfig.min_columns || 1,
                                  area._openings.length,
                                ),
                                sectionConfig.max_columns || 1,
                              ),
                            square: false,
                            cards: area._openings.map((e) => {
                              return {
                                type: 'custom:bubble-card',
                                card_type: 'button',
                                entity: e.entity_id,
                                show_state: true,
                                show_last_changed: true,
                                use_accent_color: true,
                                tap_action: {
                                  action: 'none',
                                },
                                button_action: {
                                  tap_action: {
                                    action: 'more-info',
                                  },
                                },
                              };
                            }),
                          });
                        }
                        break;
                      case 'bonbon_covers':
                        if (area._covers.length) {
                          if (sectionConfig.show_separator) {
                            section.cards.push({
                              type: 'custom:bubble-card',
                              card_type: 'separator',
                              name: sectionConfig.name,
                              icon: sectionConfig.icon,
                            });
                          }
                          section.cards.push({
                            type: 'grid',
                            columns:
                              sectionConfig.columns ||
                              Math.min(
                                Math.max(
                                  sectionConfig.min_columns || 1,
                                  area._covers.length,
                                ),
                                sectionConfig.max_columns || 1,
                              ),
                            square: false,
                            cards: area._covers.map((e) => {
                              return {
                                type: 'custom:bubble-card',
                                card_type: 'cover',
                                entity: e.entity_id,
                                show_state: true,
                                show_last_changed: true,
                                use_accent_color: true,
                                tap_action: {
                                  action: 'none',
                                },
                                button_action: {
                                  tap_action: {
                                    action: 'more-info',
                                  },
                                },
                                icon_open: 'mdi:roller-shade',
                                icon_close: 'mdi:roller-shade-closed',
                              };
                            }),
                          });
                        }
                        break;
                      case 'bonbon_miscellaneous':
                        if (area._misc.length) {
                          if (sectionConfig.show_separator) {
                            section.cards.push({
                              type: 'custom:bubble-card',
                              card_type: 'separator',
                              name: sectionConfig.name,
                              icon: sectionConfig.icon,
                            });
                          }
                          section.cards.push({
                            type: 'grid',
                            columns:
                              sectionConfig.columns ||
                              Math.min(
                                Math.max(
                                  sectionConfig.min_columns || 1,
                                  area._misc.length,
                                ),
                                sectionConfig.max_columns || 1,
                              ),
                            square: false,
                            cards: area._misc.map((e) => {
                              return getButton(e);
                            }),
                          });
                        }
                        break;
                      default:
                        if (
                          sectionConfig.cards &&
                          sectionConfig.cards.length &&
                          (!sectionConfig.area_id ||
                            sectionConfig.area_id == area_id)
                        ) {
                          const userCards = (
                            Array.isArray(sectionConfig.cards)
                              ? sectionConfig.cards
                              : [sectionConfig.cards]
                          )
                            .map(function (c) {
                              if (c !== null && typeof c === 'object') {
                                return c;
                              }
                              if (typeof c === 'string' && entities[c]) {
                                return getButton(c);
                              }
                              if (typeof c === 'string' && labels[c]) {
                                return labels[c].map((e) => getButton(e));
                              }
                              return false;
                            })
                            .flat()
                            .filter((c) => {
                              if (sectionConfig.area == area.area_id) {
                                return true;
                              }
                              const e = c.entity
                                ? entities[c.entity]
                                : undefined;
                              if (e) {
                                const inArea = e.area_id === area.area_id;
                                const device = devices[e.device_id];
                                const deviceInArea =
                                  device && device.area_id === area.area_id;
                                return inArea || deviceInArea;
                              }
                              return true;
                            });
                          if (userCards.length) {
                            if (sectionConfig.show_separator) {
                              section.cards.push({
                                type: 'custom:bubble-card',
                                card_type: 'separator',
                                name: sectionConfig.name || 'Custom Section',
                                icon:
                                  sectionConfig.icon ||
                                  'mdi:view-dashboard-edit',
                              });
                            }
                            section.cards.push({
                              type: 'grid',
                              columns:
                                sectionConfig.columns ||
                                Math.min(
                                  Math.max(
                                    sectionConfig.min_columns || 1,
                                    userCards.length,
                                  ),
                                  sectionConfig.max_columns || 1,
                                ),
                              square: false,
                              cards: userCards,
                            });
                          }
                        }
                        break;
                    }
                    return section.cards.length ? section : false;
                  })
                  .filter((section) => section);
                views.push({
                  title: area.name,
                  subview: true,
                  path: `area_${area.area_id}`,
                  type: 'sections',
                  max_columns: config?.views?.bonbon_area?.max_columns || 1,
                  sections: areaSections,
                });
              });
              break;
            default:
              if (sectionConfig.cards && sectionConfig.cards.length) {
                const userCards = (
                  Array.isArray(sectionConfig.cards)
                    ? sectionConfig.cards
                    : [sectionConfig.cards]
                )
                  .map(function (c) {
                    if (c !== null && typeof c === 'object') {
                      return c;
                    }
                    if (typeof c === 'string' && entities[c]) {
                      return getButton(c);
                    }
                    if (typeof c === 'string' && labels[c]) {
                      return labels[c].map((e) => getButton(e));
                    }
                    return false;
                  })
                  .flat()
                  .filter((c) => c);
                if (userCards.length) {
                  if (sectionConfig.show_separator) {
                    section.cards.push({
                      type: 'custom:bubble-card',
                      card_type: 'separator',
                      name: sectionConfig.name || 'Custom Section',
                      icon: sectionConfig.icon || 'mdi:view-dashboard-edit',
                    });
                  }
                  section.cards.push({
                    type: 'grid',
                    columns:
                      sectionConfig.columns ||
                      Math.min(
                        Math.max(
                          sectionConfig.min_columns || 1,
                          userCards.length,
                        ),
                        sectionConfig.max_columns || 1,
                      ),
                    square: false,
                    cards: userCards,
                  });
                }
              }
              break;
          }
          return section.cards.length ? section : false;
        })
        .filter((section) => section);

      const homeView = {
        title: dashboardName,
        path: 'home',
        type: 'sections',
        max_columns: config?.views?.bonbon_home?.max_columns || 1,
        sections: homeSections,
      };
      views.unshift(homeView);

      const applyGlobalStyles = (data) => {
        if (!Array.isArray(data)) return data;
        return data.map((struct) => {
          let newStruct = { ...struct };
          if (
            newStruct.type &&
            newStruct.type.startsWith('custom:bubble-card')
          ) {
            newStruct.styles = globalStyles + (newStruct.styles || '');
          } else if (newStruct.type && window.cardMod_patch_state) {
            newStruct.card_mod = {
              style: globalStyles,
            };
          }
          if (newStruct.cards && Array.isArray(newStruct.cards)) {
            newStruct.cards = applyGlobalStyles(newStruct.cards);
          }
          if (newStruct.sections && Array.isArray(newStruct.sections)) {
            newStruct.sections = applyGlobalStyles(newStruct.sections);
          }
          return newStruct;
        });
      };

      const dashboard = {
        views: applyGlobalStyles(views),
      };

      console.log(dashboard);

      return dashboard;
    } catch (e) {
      console.error(e);
      const dashboard = {
        views: [
          {
            title: 'Error',
            path: 'error',
            type: 'sections',
            max_columns: 1,
            sections: [
              {
                cards: [
                  {
                    type: 'markdown',
                    content: `**Error:** \n > ${e.message} \n\n **Stacktrace:** \n \`\`\`js \n ${e.stack} \n \`\`\``,
                  },
                ],
              },
            ],
          },
        ],
      };
      return dashboard;
    }
  }
}

function getWeatherIcon(weatherType) {
  switch (weatherType) {
    case 'cloudy':
      return 'mdi:weather-cloudy';
    case 'partlycloudy':
      return 'mdi:weather-partly-cloudy';
    case 'rainy':
      return 'mdi:weather-rainy';
    case 'snowy':
      return 'mdi:weather-snowy';
    case 'sunny':
      return 'mdi:weather-sunny';
    case 'clear-night':
      return 'mdi:weather-night';
    case 'fog':
      return 'mdi:weather-fog';
    case 'hail':
      return 'mdi:weather-hail';
    case 'lightning':
      return 'mdi:weather-lightning';
    case 'lightning-rainy':
      return 'mdi:weather-lightning-rainy';
    case 'pouring':
      return 'mdi:weather-pouring';
    case 'windy':
      return 'mdi:weather-windy';
    case 'windy-variant':
      return 'mdi:weather-windy-variant';
    case 'exceptional':
      return 'mdi:alert-circle-outline';
    default:
      return 'mdi:weather-cloudy';
  }
}

function androidGesturesFix() {
  if (!document.querySelectorAll('.android-gestures-fix').length) {
    const androidGesturesFix = document.createElement('div');
    androidGesturesFix.classList.add('android-gestures-fix');
    Object.assign(androidGesturesFix.style, {
      display: 'block',
      position: 'absolute',
      zIndex: '1000',
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      pointerEvents: 'none',
    });
    const fixLeft = document.createElement('div');
    Object.assign(fixLeft.style, {
      display: 'block',
      position: 'absolute',
      top: 0,
      pointerEvents: 'all',
      width: '20px',
      height: '100%',
      left: 0,
      pointerEvents: 'all',
    });
    const fixRight = document.createElement('div');
    Object.assign(fixRight.style, {
      display: 'block',
      position: 'absolute',
      top: 0,
      pointerEvents: 'all',
      width: '20px',
      height: '100%',
      right: 0,
      pointerEvents: 'all',
    });
    androidGesturesFix.append(fixLeft, fixRight);
    document.body.append(androidGesturesFix);
  }
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

function getAllEntityIds(obj, foundIds = []) {
  if (!obj || typeof obj !== 'object') return foundIds;

  if (Array.isArray(obj)) {
    obj.forEach((item) => getAllEntityIds(item, foundIds));
  } else {
    if (obj.entity_id) {
      if (Array.isArray(obj.entity_id)) {
        foundIds.push(...obj.entity_id);
      } else {
        foundIds.push(obj.entity_id);
      }
    }
    Object.values(obj).forEach((value) => {
      if (typeof value === 'object') {
        getAllEntityIds(value, foundIds);
      }
    });
  }
  return [...new Set(foundIds)];
}

customElements.define('ll-strategy-bonbon-strategy', BonbonStrategy);
console.info(
  `%c 🍬 Bonbon %c Strategy `,
  'background-color: #cfd49b;color: #000;padding: 3px 2px 3px 3px;border-radius: 14px 0 0 14px;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;',
  'background-color: #8e72c3;color: #fff;padding: 3px 3px 3px 2px;border-radius: 0 14px 14px 0;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;',
);
