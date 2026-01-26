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
          show_active_lights: true,
          show_main_lights: true,
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
        bonbon_openings: {
          name: 'Doors & Windows',
          icon: 'mdi:window-closed-variant',
          order: 5,
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
    const views = [];

    const config = mergeConfig(defaultConfig, userConfig);
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
      .bubble-calendar-container,
      .bubble-button-container {
        border-top: 0.5px solid rgba(255,255,255,${isDark ? '0.01' : '0.2'});
        border-bottom: 0.5px solid rgba(0,0,0,${isDark ? '0.8' : '0.12'});
        box-shadow:  0 2px 6px rgba(0,0,0,${isDark ? '0.2' : '0.05'});
      }
      mwc-list-item[selected],
      mwc-list-item[selected] ha-icon,
      .is-on .bubble-name-container {
        color: #fff !important;
      }
      .bubble-dropdown-inner-border {
        display: none !important;
      }
    `;

    const entities = hass.entities;
    const states = hass.states;
    const devices = hass.devices;

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
                      ? devices[entities[weather_entity_id].device_id].name ||
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
              return e.entity_id.startsWith('person.') && !e.hidden;
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
                    Math.max(sectionConfig.min_columns, persons.length),
                    sectionConfig.max_columns,
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
              const isHidden = e.hidden;

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
                    Math.max(sectionConfig.min_columns, favorites.length),
                    sectionConfig.max_columns,
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
            });

            const nightlights = Object.values(entities).filter((e) => {
              const isLight = e.entity_id.startsWith('light.');
              const isNightlight =
                e.labels?.includes('nightlight') ||
                e.labels?.includes('bonbon_nightlight');
              const isUserEntity = !e.entity_category;
              const isHidden = e.hidden;

              if (isLight && isNightlight && isUserEntity && !isHidden) {
                return true;
              }
              return false;
            });

            const areas = Object.values(hass.areas)
              .filter((a) => !a.labels?.includes('bonbon_hidden'))
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
                  const directArea = e.area_id === area.area_id;
                  const device = devices[e.device_id];
                  const deviceArea = device && device.area_id === area.area_id;
                  const isUserEntity = !e.entity_category;
                  const isHidden =
                    e.hidden || e.labels?.includes('bonbon_hidden');

                  if (
                    isCo2 &&
                    isUserEntity &&
                    (directArea || deviceArea) &&
                    !isHidden
                  ) {
                    categorizedEntityIds.push(e.entity_id);
                    return true;
                  }
                  return false;
                })?.entity_id;

                area._lights = Object.values(entities)
                  .filter((e) => {
                    const isLight = e.entity_id.startsWith('light.');
                    const directArea = e.area_id === area.area_id;
                    const device = devices[e.device_id];
                    const deviceArea =
                      device && device.area_id === area.area_id;
                    const isUserEntity = !e.entity_category;
                    const isHidden =
                      e.hidden || e.labels?.includes('bonbon_hidden');

                    if (
                      isLight &&
                      isUserEntity &&
                      (directArea || deviceArea) &&
                      !isHidden
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
                    const directArea = e.area_id === area.area_id;
                    const device = devices[e.device_id];
                    const deviceArea =
                      device && device.area_id === area.area_id;
                    const isUserEntity = !e.entity_category;
                    const isHidden = e.hidden;

                    if (
                      isSwitch &&
                      isUserEntity &&
                      (directArea || deviceArea) &&
                      !isHidden
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
                    const directArea = e.area_id === area.area_id;
                    const device = devices[e.device_id];
                    const deviceArea =
                      device && device.area_id === area.area_id;
                    const isUserEntity = !e.entity_category;
                    const isHidden =
                      e.hidden || e.labels?.includes('bonbon_hidden');
                    if (
                      isContact &&
                      isUserEntity &&
                      (directArea || deviceArea) &&
                      !isHidden
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
                    const directArea = e.area_id === area.area_id;
                    const device = devices[e.device_id];
                    const deviceArea =
                      device && device.area_id === area.area_id;
                    const isUserEntity = !e.entity_category;
                    const isHidden =
                      e.hidden || e.labels?.includes('bonbon_hidden');
                    if (
                      isClimate &&
                      isUserEntity &&
                      (directArea || deviceArea) &&
                      !isHidden
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
                    const isMisc = !categorizedEntityIds.includes(e.entity_id);
                    const directArea = e.area_id === area.area_id;
                    const device = devices[e.device_id];
                    const deviceArea =
                      device && device.area_id === area.area_id;
                    const isUserEntity = !e.entity_category;
                    const isHidden =
                      e.hidden || e.labels?.includes('bonbon_hidden');
                    if (
                      isMisc &&
                      isUserEntity &&
                      (directArea || deviceArea) &&
                      !isHidden
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
                  section.cards.push({
                    type: 'custom:bubble-card',
                    card_type: 'separator',
                    name: floor.name,
                    icon:
                      floor.icon ||
                      'mdi:home-floor-' +
                        String(floor.level).replace('-', 'negative-'),
                  });
                }

                section.cards.push({
                  type: 'grid',
                  columns:
                    sectionConfig.columns ||
                    Math.min(
                      Math.max(sectionConfig.min_columns, floorAreas.length),
                      sectionConfig.max_columns,
                    ),
                  square: false,
                  cards: floorAreas.map((area) => {
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
                        main: (area._lights || [])
                          .filter(
                            (e) =>
                              nightlights
                                .map((nightlight) => nightlight.entity_id)
                                .indexOf(e.entity_id) == -1,
                          )
                          .map((e, index, filtered) => {
                            return {
                              entity: e.entity_id,
                              show_state: false,
                              content_layout: 'icon-left',
                              tap_action: {
                                action: 'call-service',
                                service: 'light.turn_off',
                                target: {
                                  entity_id: filtered.map((e) => e.entity_id),
                                },
                              },
                            };
                          }),
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
                      styles: `
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
                        .bubble-sub-button-container .bubble-sub-button:not(.background-on),
                        .bubble-sub-button-container .bubble-sub-button.background-on ~ .bubble-sub-button.background-on {
                          display: none !important;
                        }
                        .bubble-sub-button-container .bubble-sub-button.background-on {
                          background: ${area.defltColor} !important;
                        }
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
                        .bubble-container:hover .bubble-sub-button-container .bubble-sub-button.background-on,
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
                      `,
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
                .sort((a, b) => {
                  const orderA = a.order ?? 999;
                  const orderB = b.order ?? 999;
                  return orderA - orderB;
                })
                .map((key) => {
                  const sectionConfig = config.views.bonbon_area.sections[key];
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
                              sectionConfig.min_columns,
                              [
                                area.temperature_entity_id,
                                area.humidity_entity_id,
                                area.co2_entity_id,
                              ].filter((e_id) => e_id).length,
                            ),
                            sectionConfig.max_columns,
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
                                sectionConfig.min_columns,
                                area._climates.length,
                              ),
                              sectionConfig.max_columns,
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
                                sectionConfig.min_columns,
                                area._lights.length,
                              ),
                              sectionConfig.max_columns,
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
                                sectionConfig.min_columns,
                                area._switches.length,
                              ),
                              sectionConfig.max_columns,
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
                                sectionConfig.min_columns,
                                area._openings.length,
                              ),
                              sectionConfig.max_columns,
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
                                sectionConfig.min_columns,
                                area._misc.length,
                              ),
                              sectionConfig.max_columns,
                            ),
                          square: false,
                          cards: area._misc.map((e) => {
                            return getButton(e);
                          }),
                        });
                      }
                      break;
                    default:
                      if (sectionConfig.cards && sectionConfig.cards.length) {
                        if (sectionConfig.show_separator) {
                          section.cards.push({
                            type: 'custom:bubble-card',
                            card_type: 'separator',
                            name: sectionConfig.name,
                            icon: sectionConfig.icon,
                          });
                        }
                        section.cards = section.cards.concat(
                          (Array.isArray(sectionConfig.cards)
                            ? sectionConfig.cards
                            : [sectionConfig.cards]
                          ).map(function (c) {
                            if (typeof c === 'string' && entities[c]) {
                              return getButton(c);
                            }
                            return c;
                          }),
                        );
                      }
                      break;
                  }
                  return section;
                });
              views.push({
                title: area.name,
                subview: true,
                path: `area_${area.area_id}`,
                type: 'sections',
                max_columns: config?.views?.bonbon_area?.max_columns,
                sections: areaSections,
              });
            });
            break;
          default:
            if (sectionConfig.cards && sectionConfig.cards.length) {
              if (sectionConfig.show_separator) {
                section.cards.push({
                  type: 'custom:bubble-card',
                  card_type: 'separator',
                  name: sectionConfig.name,
                  icon: sectionConfig.icon,
                });
              }
              section.cards = section.cards.concat(
                (Array.isArray(sectionConfig.cards)
                  ? sectionConfig.cards
                  : [sectionConfig.cards]
                ).map(function (c) {
                  if (typeof c === 'string' && entities[c]) {
                    return getButton(c);
                  }
                  return c;
                }),
              );
            }
            break;
        }
        return section;
      });

    const homeView = {
      title: dashboardName,
      path: 'home',
      type: 'sections',
      max_columns: config?.views?.bonbon_home?.max_columns,
      sections: homeSections,
    };
    views.unshift(homeView);

    const applyGlobalStyles = (data) => {
      data.forEach((struct) => {
        if (struct.type && struct.type.startsWith('custom:bubble-card')) {
          struct.styles = globalStyles + (struct.styles || '');
        } else if (
          window.cardMod_patch_state &&
          struct.type &&
          struct.type.startsWith('custom:')
        ) {
          struct.card_mod = {
            style: globalStyles,
          };
        }
        if (struct.cards && Array.isArray(struct.cards)) {
          applyGlobalStyles(struct.cards);
        }
        if (struct.sections && Array.isArray(struct.sections)) {
          applyGlobalStyles(struct.sections);
        }
      });
    };

    const dashboard = {
      views: views,
    };

    console.log(dashboard);

    applyGlobalStyles(dashboard.views);

    return dashboard;
  }
}

customElements.define('ll-strategy-bonbon-strategy', BonbonStrategy);
console.info(
  `%c 🍬 Bonbon Strategy %c v1.1.0 `,
  'background-color: #cfd49b;color: #000;padding: 3px 2px 3px 3px;border-radius: 14px 0 0 14px;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;',
  'background-color: #8e72c3;color: #fff;padding: 3px 3px 3px 2px;border-radius: 0 14px 14px 0;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;',
);

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

function mergeConfig(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], mergeConfig(target[key], source[key]));
    }
  }
  return { ...target, ...source };
}
