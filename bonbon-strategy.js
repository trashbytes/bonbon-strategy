// Thanks Cloos!

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

export class BonbonStrategy {
  static async generate(config, hass) {
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
      .fixed-top .bubble-sub-button-container {
        margin-top: 8px;
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
      // .bubble-calendar-container:after,
      // .bubble-button-container:after {
      //   content: '';
      //   position: absolute;
      //   top: 0;
      //   left: 0;
      //   width: 100%;
      //   height: 100%;
      //   background: linear-gradient(145deg, rgba(255,255,255,0.12), rgba(0,0,0,0.025));
      //   pointer-events: none;
      // }

      mwc-list-item[selected],
      mwc-list-item[selected] ha-icon,
      .is-on .bubble-name-container {
        color: #fff !important;
      }

      .bubble-dropdown-inner-border {
        display: none !important;
      }
    `;

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

    const entities = hass.entities;
    const states = hass.states;

    let weather_entity_id = config?.weather_entity_id;
    if (!weather_entity_id || !weather_entity_id.startsWith('weather.')) {
      weather_entity_id =
        Object.values(entities).filter((e) => {
          return e.entity_id.startsWith('weather.');
        })[0]?.entity_id || false;
    }

    const persons = Object.values(entities).filter((e) => {
      return e.entity_id.startsWith('person.') && !e.hidden;
    });

    const favorites = Object.values(entities).filter((e) => {
      const isFavorite = e.labels?.includes('favorite');
      const isUserEntity = !e.entity_category;
      const isHidden = e.hidden;

      if (isFavorite && isUserEntity && !isHidden) {
        return true;
      }
      return false;
    });

    const nightlights = Object.values(entities).filter((e) => {
      const isLight = e.entity_id.startsWith('light.');
      const isNightlight = e.labels?.includes('nightlight');
      const isUserEntity = !e.entity_category;
      const isHidden = e.hidden;

      if (isLight && isNightlight && isUserEntity && !isHidden) {
        return true;
      }
      return false;
    });

    const floors = {
      ...(hass.floors || {}),
      _areas: {
        name: config?.translations?.areas || 'Areas',
        floor_id: '_areas',
        icon: 'mdi:sofa',
        level: 99,
      },
    };

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

        const categorizedEntityIds = [area.temperature_entity_id, area.humidity_entity_id];

        area._lights = Object.values(entities)
          .filter((e) => {
            const isLight = e.entity_id.startsWith('light.');
            const directArea = e.area_id === area.area_id;
            const device = hass.devices[e.device_id];
            const deviceArea = device && device.area_id === area.area_id;
            const isUserEntity = !e.entity_category;
            const isHidden = e.hidden || e.labels?.includes('bonbon_hidden');

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
          .sort((lightA, lightB) => {
            const isMainA = lightA.labels?.includes('mainlight');
            const isMainB = lightB.labels?.includes('mainlight');
            if (isMainA && !isMainB) return -1;
            if (!isMainA && isMainB) return 1;
            const nameA =
              lightA.name ||
              states[lightA.entity_id]?.attributes?.friendly_name ||
              lightA.entity_id;
            const nameB =
              lightB.name ||
              states[lightA.entity_id]?.attributes?.friendly_name ||
              lightB.entity_id;
            return nameA.localeCompare(nameB);
          })
        area._switches = Object.values(entities)
          .filter((e) => {
            const isSwitch = e.entity_id.startsWith('switch.');
            const directArea = e.area_id === area.area_id;
            const device = hass.devices[e.device_id];
            const deviceArea = device && device.area_id === area.area_id;
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
        area._openings = Object.values(entities)
          .filter((e) => {
            const isContact =
              e.entity_id.startsWith('binary_sensor.') &&
              e.entity_id.endsWith('_contact');
            const directArea = e.area_id === area.area_id;
            const device = hass.devices[e.device_id];
            const deviceArea = device && device.area_id === area.area_id;
            const isUserEntity = !e.entity_category;
            const isHidden = e.hidden || e.labels?.includes('bonbon_hidden');
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

        area._climates = Object.values(entities)
          .filter((e) => {
            const isClimate = e.entity_id.startsWith('climate.');
            const directArea = e.area_id === area.area_id;
            const device = hass.devices[e.device_id];
            const deviceArea = device && device.area_id === area.area_id;
            const isUserEntity = !e.entity_category;
            const isHidden = e.hidden || e.labels?.includes('bonbon_hidden');
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
        area._misc = Object.values(entities).filter((e) => {
          const isMisc = !categorizedEntityIds.includes(e.entity_id);
          const directArea = e.area_id === area.area_id;
          const device = hass.devices[e.device_id];
          const deviceArea = device && device.area_id === area.area_id;
          const isUserEntity = !e.entity_category;
          const isHidden = e.hidden || e.labels?.includes('bonbon_hidden');
          if (
            isMisc &&
            isUserEntity &&
            (directArea || deviceArea) &&
            !isHidden
          ) {
            return true;
          }
          return false;
        });
        return area;
      });

    const areaViews = areas.map((area) => {
      let sections = [];

      let titleSection = {
        cards: [],
      };

      let title = {
        type: 'custom:bubble-card',
        card_type: 'separator',
        name: area.name,
        icon: area.icon,
      };
      titleSection.cards.push(title);

      if (area.temperature_entity_id || area.humidity_entity_id) {
        if (
          window?.customCards
            ?.map((cc) => cc.type)
            .includes('mini-graph-card') &&
          config?.use_graphs
        ) {
          let thGrid = {
            type: 'grid',
            columns:
              area.temperature_entity_id && area.humidity_entity_id ? 2 : 1,
            square: false,
            cards: [],
          };
          if (area.temperature_entity_id) {
            let temperature_graph = {
              type: 'custom:mini-graph-card',
              name:
                entities[area.temperature_entity_id]?.name ||
                states[area.temperature_entity_id]?.attributes?.friendly_name,
              icon:
                entities[area.temperature_entity_id]?.icon ||
                states[area.temperature_entity_id]?.attributes?.icon,
              font_size: 60,
              entities: [area.temperature_entity_id],
            };
            thGrid.cards.push(temperature_graph);
          }
          if (area.humidity_entity_id) {
            let humidity_graph = {
              type: 'custom:mini-graph-card',
              name:
                entities[area.humidity_entity_id]?.name ||
                states[area.humidity_entity_id]?.attributes?.friendly_name,
              icon:
                entities[area.humidity_entity_id]?.icon ||
                states[area.humidity_entity_id]?.attributes?.icon,
              font_size: 60,
              entities: [area.humidity_entity_id],
            };
            thGrid.cards.push(humidity_graph);
          }
          titleSection.cards.push(thGrid);
        } else {
          title.sub_button = [
            area.temperature_entity_id
              ? {
                  entity: area.temperature_entity_id,
                  state_background: false,
                  show_background: false,
                  show_name: false,
                  show_state: true,
                }
              : false,
            area.humidity_entity_id
              ? {
                  entity: area.humidity_entity_id,
                  state_background: false,
                  show_background: false,
                  show_name: false,
                  show_state: true,
                }
              : false,
          ];
        }
      }

      sections.push(titleSection);

      if (area._climates?.length) {
        let climatesSection = {
          cards: [],
        };

        let climatesTitle = {
          type: 'custom:bubble-card',
          card_type: 'separator',
          name: config?.translations?.climate || 'Climate',
          icon: 'mdi:radiator',
        };
        climatesSection.cards.push(climatesTitle);

        let climatesGrid = {
          type: 'grid',
          columns: area._climates.length > 1 ? 2 : 1,
          square: false,
          cards: [],
        };

        area._climates.forEach((e) => {
          climatesGrid.cards.push({
            type: 'custom:bubble-card',
            card_type: 'climate',
            entity: e.entity_id,
            name:
              e.name ||
              states[e.entity_id]?.attributes?.friendly_name ||
              e.entity_id,
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
          });
        });
        climatesSection.cards.push(climatesGrid);
        sections.push(climatesSection);
      }

      if (area._lights?.length) {
        let lightsSection = {
          cards: [],
        };
        const mainlights = area._lights.filter((l) =>
          l.labels?.includes('mainlight'),
        );
        const sublights = area._lights.filter(
          (l) => !l.labels?.includes('mainlight'),
        );

        let lightsTitle = {
          type: 'custom:bubble-card',
          card_type: 'separator',
          name: config?.translations?.lights || 'Lights',
          icon: 'mdi:lightbulb-group',
        };
        lightsSection.cards.push(lightsTitle);

        let mainlightsGrid = {
          type: 'grid',
          columns: 1,
          square: false,
          cards: [],
        };

        mainlights.forEach((e) => {
          mainlightsGrid.cards.push({
            type: 'custom:bubble-card',
            card_type: 'button',
            entity: e.entity_id,
            name:
              e.name ||
              states[e.entity_id]?.attributes?.friendly_name ||
              e.entity_id,
            show_state: true,
            show_last_changed: true,
            use_accent_color: true,
            tap_action: {
              action: 'none',
            },
          });
        });
        lightsSection.cards.push(mainlightsGrid);

        let sublightsGrid = {
          type: 'grid',
          columns: sublights.length > 1 ? 2 : 1,
          square: false,
          cards: [],
        };

        sublights.forEach((e) => {
          sublightsGrid.cards.push({
            type: 'custom:bubble-card',
            card_type: 'button',
            entity: e.entity_id,
            name:
              e.name ||
              states[e.entity_id]?.attributes?.friendly_name ||
              e.entity_id,
            show_state: true,
            show_last_changed: true,
            use_accent_color: true,
            tap_action: {
              action: 'none',
            },
          });
        });
        lightsSection.cards.push(sublightsGrid);
        sections.push(lightsSection);
      }

      if (area._switches?.length) {
        let switchesSection = {
          cards: [],
        };

        let switchesTitle = {
          type: 'custom:bubble-card',
          card_type: 'separator',
          name: config?.translations?.switches || 'Switches',
          icon: 'mdi:toggle-switch',
        };
        switchesSection.cards.push(switchesTitle);

        let switchesGrid = {
          type: 'grid',
          columns: area._switches.length > 1 ? 2 : 1,
          square: false,
          cards: [],
        };

        area._switches.forEach((e) => {
          switchesGrid.cards.push({
            type: 'custom:bubble-card',
            card_type: 'button',
            entity: e.entity_id,
            name:
              e.name ||
              states[e.entity_id]?.attributes?.friendly_name ||
              e.entity_id,
            show_state: true,
            show_last_changed: true,
            use_accent_color: true,
            tap_action: {
              action: 'none',
            },
          });
        });
        switchesSection.cards.push(switchesGrid);
        sections.push(switchesSection);
      }

      if (area._openings?.length) {
        let openingsSection = {
          cards: [],
        };

        let openingsTitle = {
          type: 'custom:bubble-card',
          card_type: 'separator',
          name: config?.translations?.openings || 'Openings',
          icon: 'mdi:window-open-variant',
        };
        openingsSection.cards.push(openingsTitle);

        let openingsGrid = {
          type: 'grid',
          columns: area._openings.length > 1 ? 2 : 1,
          square: false,
          cards: [],
        };

        area._openings.forEach((e) => {
          openingsGrid.cards.push({
            type: 'custom:bubble-card',
            card_type: 'button',
            entity: e.entity_id,
            name: (
              e.name ||
              states[e.entity_id]?.attributes?.friendly_name ||
              e.entity_id
            ).split(' (')[0],
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
          });
        });
        openingsSection.cards.push(openingsGrid);

        sections.push(openingsSection);
      }

      if (area._misc?.length) {
        let miscSection = {
          cards: [],
        };

        let miscTitle = {
          type: 'custom:bubble-card',
          card_type: 'separator',
          name: config?.translations?.misc || 'Misc',
          icon: 'mdi:dots-horizontal-circle-outline',
        };
        miscSection.cards.push(miscTitle);

        let miscGrid = {
          type: 'grid',
          columns: area._misc.length > 1 ? 2 : 1,
          square: false,
          cards: [],
        };

        area._misc.forEach((e) => {
          console.log(e);
          const isMeasurement = states[e.entity_id]?.attributes?.unit_of_measurement != null;
          console.log(isMeasurement);
          miscGrid.cards.push({
            type: 'custom:bubble-card',
            card_type: 'button',
            entity: e.entity_id,
            name: (
              e.name ||
              states[e.entity_id]?.attributes?.friendly_name ||
              e.entity_id
            ).split(' (')[0],
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
            styles: isMeasurement ? `
              .is-on .bubble-name-container {
                color: var(--primary-text-color) !important;
              }
              .is-on .bubble-button-background {
                background-color: var(--ha-card-background,var(--card-background-color,#fff)) !important;
                opacity: 1 !important;
              }
            ` : ''
          });
        });
        miscSection.cards.push(miscGrid);

        sections.push(miscSection);
      }

      return {
        title: area.name,
        subview: true,
        path: `area_${area.area_id}`,
        type: 'sections',
        max_columns: config.max_columns || 3,
        sections: sections,
      };
    });

    let sections = [];

    let titleSection = {
      cards: [],
    };

    let title = {
      type: 'custom:bubble-card',
      card_type: 'separator',
      name: hass.config.location_name,
      icon: 'mdi:home',
    };

    if (weather_entity_id && states[weather_entity_id]) {
      title = {
        type: 'custom:bubble-card',
        card_type: 'separator',
        name: hass.config.location_name,
        icon: getWeatherIcon(states[weather_entity_id]?.state),
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
      };
    }

    titleSection.cards.push(title);

    let personsGrid = {
      type: 'grid',
      columns: persons.length > 1 ? 2 : 1,
      square: false,
      cards: [],
    };
    persons.forEach((p) => {
      personsGrid.cards.push({
        type: 'custom:bubble-card',
        card_type: 'button',
        button_type: 'state',
        icon: p.icon,
        entity: p.entity_id,
        show_state: true,
        name:
          p.name ||
          states[p.entity_id]?.attributes?.friendly_name ||
          p.entity_id,
      });
    });
    titleSection.cards.push(personsGrid);

    if (favorites.length) {
      let favoritesTitle = {
        type: 'custom:bubble-card',
        card_type: 'separator',
        name: config?.translations?.favorites || 'Favorites',
        icon: 'mdi:star',
      };
      titleSection.cards.push(favoritesTitle);

      let favoritesGrid = {
        type: 'grid',
        columns: favorites.length > 1 ? 2 : 1,
        square: false,
        cards: [],
      };
      favorites.forEach(function (f) {
        favoritesGrid.cards.push({
          type: 'custom:bubble-card',
          card_type: 'button',
          entity: f.entity_id,
          show_state: false,
          show_last_changed: true,
          use_accent_color: true,
          tap_action: {
            action: 'none',
          },
          button_action: {
            tap_action: {
              action: ['light', 'switch'].includes(f.entity_id.split('.')[0])
                ? 'toggle'
                : 'more-info',
            },
          },
        });
      });
      titleSection.cards.push(favoritesGrid);
    }

    sections.push(titleSection);

    Object.values(floors).forEach((floor, index, floors) => {
      const floorAreas = areas.filter(
        (area) => area.floor_id == floor.floor_id,
      );
      if (floorAreas.length) {
        let floorSection = {
          cards: [],
        };

        floorSection.cards.push({
          type: 'custom:bubble-card',
          card_type: 'separator',
          name: floor.name,
          icon: floor.icon || 'mdi:home-floor-' + index,
        });

        let areasGrid = {
          type: 'grid',
          columns: 2,
          square: false,
          cards: [],
        };

        floorAreas.forEach((area) => {
          areasGrid.cards.push({
            type: 'custom:bubble-card',
            card_type: 'button',
            button_type: 'name',
            icon: area.icon,
            // entity: 'sun.sun',
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
                  (l) =>
                    nightlights
                      .map((nightlight) => nightlight.entity_id)
                      .indexOf(l.entity_id) == -1,
                )
                .map((l, index, filtered) => {
                  return {
                    entity: l.entity_id,
                    show_state: false,
                    content_layout: 'icon-left',
                    tap_action: {
                      action: 'call-service',
                      service: 'light.turn_off',
                      target: {
                        entity_id: filtered.map((f) => f.entity_id),
                      },
                    },
                  };
                }),
              bottom:
                area.temperature_entity_id || area.humidity_entity_id
                  ? [
                      {
                        buttons_layout: 'inline',
                        group: [
                          area.temperature_entity_id
                            ? {
                                entity: area.temperature_entity_id,
                                show_background: false,
                                show_state: true,
                                content_layout: 'icon-left',
                                fill_width: false,
                              }
                            : false,
                          area.humidity_entity_id
                            ? {
                                entity: area.humidity_entity_id,
                                show_background: false,
                                show_state: true,
                                content_layout: 'icon-left',
                                fill_width: false,
                              }
                            : false,
                        ],
                        justify_content: 'start',
                      },
                    ]
                  : false,
              bottom_layout: 'inline',
            },
            rows: 1.4,
            styles: `
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
          });
        });

        floorSection.cards.push(areasGrid);

        sections.push(floorSection);
      }
    });

    const homeView = {
      title: config?.translations?.overview || 'Overview',
      path: 'home',
      type: 'sections',
      max_columns: config?.max_columns || 3,
      sections: sections,
    };

    const views = [homeView, ...areaViews];

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

    applyGlobalStyles(views);

    const dashboard = {
      views: views,
    };
    return dashboard;
  }
}

customElements.define('ll-strategy-bonbon-strategy', BonbonStrategy);
console.info(
  `%c 🍬 Bonbon Strategy %c v1.0.5 `,
  'background-color: #cfd49b;color: #000;padding: 3px 2px 3px 3px;border-radius: 14px 0 0 14px;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;',
  'background-color: #8e72c3;color: #fff;padding: 3px 3px 3px 2px;border-radius: 0 14px 14px 0;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;',
);
