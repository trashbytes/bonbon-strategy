const hacstag = new URL(import.meta.url).searchParams.get('hacstag');

const { defaultConfig } = await import(
  `./bonbon-strategy-config.js?hacstag=${hacstag}`
);
const { css, getStyles } = await import(
  `./bonbon-strategy-styles.js?hacstag=${hacstag}`
);
const { getWeatherIcon, androidGesturesFix, mergeDeep, getAreaColors } =
  await import(`./bonbon-strategy-utils.js?hacstag=${hacstag}`);
const {
  createButton,
  createSeparatorCard,
  createGrid,
  createBubbleCard,
  createSubButton,
} = await import(`./bonbon-strategy-builders.js?hacstag=${hacstag}`);

const { resolveEntity, resolveEntities, onFloor, inArea, hasLabel } =
  await import(`./bonbon-strategy-entities.js?hacstag=${hacstag}`);

export class BonbonStrategy {
  static async generate(userConfig, hass) {
    const states = hass.states;
    const devices = hass.devices;
    const floors = hass.floors;
    const areas = hass.areas;
    const entities = hass.entities;
    Object.keys(hass.entities).forEach((entity_id) => {
      const entity = entities[entity_id];
      const device = devices?.[entity?.device_id];
      entity.area_id = entity?.area_id || device?.area_id;
      if (entity?.area_id) {
        entity.floor_id = areas?.[entity.area_id]?.floor_id;
      }
      entity.labels = [...(entity?.labels || []), ...(device?.labels || [])];
    });
    const labels = Object.values(entities).reduce((acc, e) => {
      (e.labels ?? []).forEach((label) => {
        (acc[label] ??= []).push(e);
      });
      return acc;
    }, {});

    if (typeof window !== 'undefined') {
      window._bonbon = window._bonbon || {
        entities,
        devices,
        states,
        labels,
        floors,
        areas,
      };
    }

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

      const styles = getStyles(isDark);

      const homeSections = Object.keys(config?.views?.bonbon_home?.sections)
        .filter((key) => {
          return !config.views.bonbon_home.sections[key].hidden;
        })
        .sort((aKey, bKey) => {
          const orderA =
            config.views.bonbon_home.sections[aKey].order ??
            Number.MAX_SAFE_INTEGER;
          const orderB =
            config.views.bonbon_home.sections[bKey].order ??
            Number.MAX_SAFE_INTEGER;
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
              let weather_entity;
              if (
                !weather_entity_id ||
                !weather_entity_id.startsWith('weather.')
              ) {
                weather_entity = resolveEntity('weather.*');
              } else {
                weather_entity = resolveEntity(weather_entity_id);
              }
              if (weather_entity && states[weather_entity?.entity?.entity_id]) {
                if (sectionConfig.show_separator) {
                  const separatorName = !sectionConfig.show_card
                    ? entities[weather_entity?.entity?.entity_id]?.name ||
                      states[weather_entity?.entity?.entity_id]?.attributes
                        ?.friendly_name ||
                      devices[
                        entities[weather_entity?.entity?.entity_id]?.device_id
                      ]?.name ||
                      sectionConfig.name
                    : sectionConfig.name;
                  const separatorIcon = !sectionConfig.show_card
                    ? getWeatherIcon(
                        states[weather_entity?.entity?.entity_id]?.state,
                      )
                    : sectionConfig.icon;
                  const userSubButtons = resolveEntities(
                    sectionConfig.custom_separator_buttons,
                  ).map(function (c) {
                    return createSubButton(c);
                  });
                  const separatorSubButtons = [
                    !sectionConfig.show_card
                      ? [
                          createSubButton(
                            weather_entity,
                            'temperature',
                            'mdi:thermometer',
                          ),
                        ]
                      : [],
                    userSubButtons,
                  ];
                  section.cards.push(
                    createSeparatorCard(
                      separatorName,
                      separatorIcon,
                      separatorSubButtons,
                      styles.bubbleSeparatorSubButtonBase,
                    ),
                  );
                  if (sectionConfig.show_card) {
                    section.cards.push(
                      createGrid(
                        [
                          {
                            type: 'weather-forecast',
                            entity: weather_entity_id,
                            show_current: !!sectionConfig.card_show_current,
                            show_forecast: !!sectionConfig.card_show_forecast,
                            forecast_type: sectionConfig.card_forecast_type,
                            card_mod: {
                              style: styles.weatherCard,
                            },
                          },
                        ],
                        sectionConfig,
                      ),
                    );
                  }
                }
              }
              break;
            case 'bonbon_persons':
              const persons = resolveEntities('person.*');
              if (persons.length) {
                if (sectionConfig.show_separator) {
                  const userSubButtons = resolveEntities(
                    sectionConfig.custom_separator_buttons,
                  ).map(function (c) {
                    return createSubButton(c);
                  });
                  section.cards.push(
                    createSeparatorCard(
                      sectionConfig.name,
                      sectionConfig.icon,
                      [userSubButtons],
                      styles.bubbleSeparatorSubButtonBase,
                    ),
                  );
                }
                section.cards.push(
                  createGrid(
                    persons.map((c) =>
                      createBubbleCard({
                        card_type: 'button',
                        button_type: 'state',
                        entity: c.entity.entity_id,
                        show_state: true,
                      }),
                    ),
                    sectionConfig,
                  ),
                );
              }
              break;
            case 'bonbon_favorites':
              const favorites = resolveEntities('favorite');

              if (favorites.length) {
                if (sectionConfig.show_separator) {
                  const userSubButtons = resolveEntities(
                    sectionConfig.custom_separator_buttons,
                  ).map(function (c) {
                    return createSubButton(c);
                  });
                  section.cards.push(
                    createSeparatorCard(
                      sectionConfig.name,
                      sectionConfig.icon,
                      [userSubButtons],
                      styles.bubbleSeparatorSubButtonBase,
                    ),
                  );
                }
                section.cards.push(
                  createGrid(
                    favorites.map((c) => createButton(c.entity, styles)),
                    sectionConfig,
                  ),
                );
              }
              break;
            case 'bonbon_areas':
              const _floors = Object.values({
                ...(floors || {}),
                _areas: {
                  name: sectionConfig.name,
                  floor_id: '_areas',
                  icon: sectionConfig.icon || 'mdi:sofa',
                  level: Number.MAX_SAFE_INTEGER,
                },
              }).map((floor, index, floors) => {
                floor._lights = resolveEntities('light.*').filter((c) => {
                  return onFloor(c, floor);
                });
                return floor;
              });

              const nightlights = [];
              const notNightlights = [];

              resolveEntities('light.*').forEach((c) => {
                if (hasLabel(c.entity, 'nightlight')) {
                  nightlights.push(c);
                } else {
                  notNightlights.push(c);
                }
              });

              const _areas = Object.values(areas)
                .filter(
                  (a) =>
                    !a.labels?.includes('hidden') &&
                    !a.labels?.includes('bonbon_hidden'),
                )
                .map(function (area, index, areas) {
                  const colors = getAreaColors(area, index, areas, isDark);
                  area.lightColor = colors.lightColor;
                  area.reglrColor = colors.reglrColor;
                  area.shadeColor = colors.shadeColor;

                  area.categorizedEntityIds = [
                    area.temperature_entity_id,
                    area.humidity_entity_id,
                  ];

                  area.co2_entity_id = resolveEntities('sensor.*').filter(
                    (c) => {
                      return (
                        inArea(c, area) &&
                        (states[c.entity.entity_id]?.attributes
                          ?.device_class === 'carbon_dioxide' ||
                          (c.entity.entity_id.includes('co2') &&
                            states[c.entity.entity_id]?.attributes
                              ?.unit_of_measurement === 'ppm'))
                      );
                    },
                  )[0];

                  area._lights = resolveEntities('light.*').filter((c) => {
                    return (
                      inArea(c, area) &&
                      area.categorizedEntityIds.push(c.entity.entity_id)
                    );
                  });
                  area._switches = resolveEntities('switch.*').filter((c) => {
                    return (
                      inArea(c, area) &&
                      area.categorizedEntityIds.push(c.entity.entity_id)
                    );
                  });
                  area._openings = resolveEntities(
                    'binary_sensor.*_contact',
                  ).filter((c) => {
                    return (
                      inArea(c, area) &&
                      area.categorizedEntityIds.push(c.entity.entity_id)
                    );
                  });

                  area._media = resolveEntities('media_player.*').filter(
                    (c) => {
                      return (
                        inArea(c, area) &&
                        area.categorizedEntityIds.push(c.entity.entity_id)
                      );
                    },
                  );

                  area._covers = resolveEntities('cover.*').filter((c) => {
                    return (
                      inArea(c, area) &&
                      area.categorizedEntityIds.push(c.entity.entity_id)
                    );
                  });

                  area._climates = resolveEntities('climate.*').filter((c) => {
                    return (
                      inArea(c, area) &&
                      area.categorizedEntityIds.push(c.entity.entity_id)
                    );
                  });

                  area._misc = resolveEntities('*').filter((c) => {
                    return (
                      inArea(c, area) &&
                      !area.categorizedEntityIds.includes(c.entity.entity_id)
                    );
                  });
                  return area;
                });

              _floors.forEach((floor, index, floors) => {
                const floorAreas = _areas.filter(
                  (area) => area.floor_id == floor.floor_id,
                );
                if (floorAreas.length) {
                  if (sectionConfig.show_separator) {
                    const userSubButtons = resolveEntities(
                      sectionConfig.custom_separator_buttons,
                    )
                      .filter((c) => {
                        return onFloor(c, floor);
                      })
                      .map(function (c) {
                        return createSubButton(c);
                      });

                    const notNightlightsOnFloor = notNightlights.filter((c) => {
                      return onFloor(c, floor);
                    });
                    const separatorName = floor.name;
                    const separatorIcon =
                      floor.icon ||
                      'mdi:home-floor-' +
                        String(floor.level).replace('-', 'negative-');
                    const floorLightsSubButtons =
                      sectionConfig.show_floor_lights_toggle
                        ? (notNightlightsOnFloor || [])
                            .map((c, index, filtered) => {
                              return ['off', 'on'].map((state) => {
                                return {
                                  entity: c.entity.entity_id,
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
                                        (c) => c.entity.entity_id,
                                      ),
                                    },
                                  },
                                };
                              });
                            })
                            .flat()
                        : [];
                    const separatorSubButtons = [
                      floorLightsSubButtons,
                      userSubButtons,
                    ];
                    const separatorStyles = floorLightsSubButtons.length
                      ? sectionConfig.always_show_floor_lights_toggle
                        ? styles.bubbleSeparatorLightsSubButtonAlways
                        : styles.bubbleSeparatorLightsSubButtonDefault
                      : '';
                    section.cards.push(
                      createSeparatorCard(
                        separatorName,
                        separatorIcon,
                        separatorSubButtons,
                        styles.bubbleSeparatorSubButtonBase + separatorStyles,
                      ),
                    );
                  }

                  const floorCards = floorAreas.map((area) => {
                    const notNightlightsInArea = notNightlights.filter((c) => {
                      return inArea(c, area);
                    });
                    return createBubbleCard({
                      card_type: 'button',
                      button_type: 'name',
                      icon: area.icon,
                      show_state: false,
                      name: area.name.split(' (')[0],
                      hold_action: { action: 'none' },
                      tap_action: { action: 'none' },
                      button_action: {
                        tap_action: {
                          action: 'navigate',
                          navigation_path: `area_${area.area_id}`,
                        },
                        hold_action: { action: 'none' },
                      },
                      sub_button: {
                        main: sectionConfig.show_area_lights_toggle
                          ? (notNightlightsInArea || [])
                              .map((c, index, filtered) => {
                                return ['off', 'on'].map((state) => ({
                                  entity: c.entity.entity_id,
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
                                        (c) => c.entity.entity_id,
                                      ),
                                    },
                                  },
                                }));
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
                              .map((e_id) => ({
                                entity: e_id,
                                show_background: false,
                                show_state: true,
                                content_layout: 'icon-left',
                                fill_width: false,
                              })),
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
                        css`
                          :host {
                            --area-light-color: ${area.lightColor};
                            --area-reglr-color: ${area.reglrColor};
                            --area-shade-color: ${area.shadeColor};
                          }
                        ` +
                        (sectionConfig.always_show_area_lights_toggle
                          ? styles.bubbleAreaSubButtonDefault
                          : styles.bubbleAreaSubButtonAlways),
                    });
                  });
                  section.cards.push(createGrid(floorCards, sectionConfig));
                }
              });

              _areas.forEach((area) => {
                const areaSections = Object.keys(
                  config?.views?.bonbon_area?.sections,
                )
                  .filter((key) => {
                    return !config.views.bonbon_area.sections[key].hidden;
                  })
                  .sort((aKey, bKey) => {
                    const orderA =
                      config.views.bonbon_area.sections[aKey].order ??
                      Number.MAX_SAFE_INTEGER;
                    const orderB =
                      config.views.bonbon_area.sections[bKey].order ??
                      Number.MAX_SAFE_INTEGER;
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
                            const userSubButtons = resolveEntities(
                              sectionConfig.custom_separator_buttons,
                              sectionConfig.include_sensors,
                              sectionConfig.include_config,
                              sectionConfig.include_diagnostic,
                            )
                              .filter((c) => {
                                return inArea(c, area);
                              })
                              .map(function (c) {
                                return createSubButton(c);
                              });
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                [userSubButtons],
                                styles.bubbleSeparatorSubButtonBase,
                              ),
                            );
                          }
                        const envCards = [
                          area.temperature_entity_id,
                          area.humidity_entity_id,
                          area.co2_entity_id,
                        ]
                          .filter((e_id) => e_id)
                          .map((e_id) => {
                            return sectionConfig.show_graphs &&
                              window.customCards
                                ?.map((cc) => cc.type)
                                .includes('mini-graph-card')
                              ? {
                                  type: 'custom:mini-graph-card',
                                  height: 56,
                                  entities: [
                                    {
                                      entity: e_id,
                                      show_line: false,
                                    },
                                  ],
                                  line_color: 'var(--bubble-default-color)',
                                  show: {
                                    points: false,
                                    labels: false,
                                    labels_secondary: false,
                                  },
                                  card_mod: {
                                    style: styles.environmentGraphCard,
                                  },
                                }
                              : createBubbleCard(
                                  {
                                    card_type: 'button',
                                    entity: e_id,
                                    show_state: true,
                                    show_last_changed: false,
                                    use_accent_color: true,
                                    tap_action: { action: 'none' },
                                    button_action: {
                                      tap_action: { action: 'more-info' },
                                    },
                                  },
                                  styles.bubbleButtonNonBinary,
                                );
                          });
                        section.cards.push(createGrid(envCards, sectionConfig));
                        break;
                      case 'bonbon_climate':
                        if (area._climates.length) {
                          if (sectionConfig.show_separator) {
                            const userSubButtons = resolveEntities(
                              sectionConfig.custom_separator_buttons,
                              sectionConfig.include_sensors,
                              sectionConfig.include_config,
                              sectionConfig.include_diagnostic,
                            )
                              .filter((c) => {
                                return inArea(c, area);
                              })
                              .map(function (c) {
                                return createSubButton(c);
                              });
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                [userSubButtons],
                                styles.bubbleSeparatorSubButtonBase,
                              ),
                            );
                          }
                          const climateCards = area._climates.map((c) =>
                            createBubbleCard({
                              card_type: 'climate',
                              entity: c.entity.entity_id,
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
                            }),
                          );
                          section.cards.push(
                            createGrid(climateCards, sectionConfig),
                          );
                        }
                        break;
                      case 'bonbon_lights':
                        if (area._lights.length) {
                          const notNightlightsInArea = notNightlights.filter(
                            (c) => {
                              return inArea(c, area);
                            },
                          );
                          if (sectionConfig.show_separator) {
                            const areaLightsSubButtons =
                              sectionConfig.show_area_lights_toggle
                                ? (notNightlightsInArea || [])
                                    .map((c, index, filtered) => {
                                      return ['off', 'on'].map((state) => {
                                        return {
                                          entity: c.entity.entity_id,
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
                                                (c) => c.entity.entity_id,
                                              ),
                                            },
                                          },
                                        };
                                      });
                                    })
                                    .flat()
                                : [];

                            const userSubButtons = resolveEntities(
                              sectionConfig.custom_separator_buttons,
                              sectionConfig.include_sensors,
                              sectionConfig.include_config,
                              sectionConfig.include_diagnostic,
                            )
                              .filter((c) => {
                                return inArea(c, area);
                              })
                              .map(function (c) {
                                return createSubButton(c);
                              });
                            const separatorSubButtons = [
                              areaLightsSubButtons,
                              userSubButtons,
                            ];
                            const separatorStyles = areaLightsSubButtons.length
                              ? sectionConfig.always_show_area_lights_toggle
                                ? styles.bubbleSeparatorLightsSubButtonAlways
                                : styles.bubbleSeparatorLightsSubButtonDefault
                              : '';
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                separatorSubButtons,
                                styles.bubbleSeparatorSubButtonBase +
                                  separatorStyles,
                              ),
                            );
                          }
                          const lightCards = area._lights.map((c) =>
                            createBubbleCard({
                              card_type: 'button',
                              entity: c.entity.entity_id,
                              show_state: true,
                              show_last_changed: true,
                              use_accent_color: true,
                              tap_action: { action: 'none' },
                            }),
                          );
                          section.cards.push(
                            createGrid(lightCards, sectionConfig),
                          );
                        }
                        break;
                      case 'bonbon_switches':
                        if (area._switches.length) {
                          if (sectionConfig.show_separator) {
                            const userSubButtons = resolveEntities(
                              sectionConfig.custom_separator_buttons,
                              sectionConfig.include_sensors,
                              sectionConfig.include_config,
                              sectionConfig.include_diagnostic,
                            )
                              .filter((c) => {
                                return inArea(c, area);
                              })
                              .map(function (c) {
                                return createSubButton(c);
                              });
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                [userSubButtons],
                                styles.bubbleSeparatorSubButtonBase,
                              ),
                            );
                          }
                          const switchCards = area._switches.map((c) =>
                            createBubbleCard({
                              card_type: 'button',
                              entity: c.entity.entity_id,
                              show_state: true,
                              show_last_changed: true,
                              use_accent_color: true,
                              tap_action: { action: 'none' },
                            }),
                          );
                          section.cards.push(
                            createGrid(switchCards, sectionConfig),
                          );
                        }
                        break;
                      case 'bonbon_media':
                        if (area._media.length) {
                          if (sectionConfig.show_separator) {
                            const userSubButtons = resolveEntities(
                              sectionConfig.custom_separator_buttons,
                              sectionConfig.include_sensors,
                              sectionConfig.include_config,
                              sectionConfig.include_diagnostic,
                            )
                              .filter((c) => {
                                return inArea(c, area);
                              })
                              .map(function (c) {
                                return createSubButton(c);
                              });
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                [userSubButtons],
                                styles.bubbleSeparatorSubButtonBase,
                              ),
                            );
                          }
                          const mediaCards = area._media.map((c) =>
                            createBubbleCard({
                              card_type: 'media-player',
                              entity: c.entity.entity_id,
                              show_state: true,
                              show_last_changed: true,
                              use_accent_color: true,
                              tap_action: { action: 'none' },
                              button_action: {
                                tap_action: { action: 'more-info' },
                              },
                            }),
                          );
                          section.cards.push(
                            createGrid(mediaCards, sectionConfig),
                          );
                        }
                        break;
                      case 'bonbon_openings':
                        if (area._openings.length) {
                          if (sectionConfig.show_separator) {
                            const userSubButtons = resolveEntities(
                              sectionConfig.custom_separator_buttons,
                              sectionConfig.include_sensors,
                              sectionConfig.include_config,
                              sectionConfig.include_diagnostic,
                            )
                              .filter((c) => {
                                return inArea(c, area);
                              })
                              .map(function (c) {
                                return createSubButton(c);
                              });
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                [userSubButtons],
                                styles.bubbleSeparatorSubButtonBase,
                              ),
                            );
                          }
                          const openingCards = area._openings.map((c) =>
                            createBubbleCard({
                              card_type: 'button',
                              entity: c.entity.entity_id,
                              show_state: true,
                              show_last_changed: true,
                              use_accent_color: true,
                              tap_action: { action: 'none' },
                              button_action: {
                                tap_action: { action: 'more-info' },
                              },
                            }),
                          );
                          section.cards.push(
                            createGrid(openingCards, sectionConfig),
                          );
                        }
                        break;
                      case 'bonbon_covers':
                        if (area._covers.length) {
                          if (sectionConfig.show_separator) {
                            const userSubButtons = resolveEntities(
                              sectionConfig.custom_separator_buttons,
                              sectionConfig.include_sensors,
                              sectionConfig.include_config,
                              sectionConfig.include_diagnostic,
                            )
                              .filter((c) => {
                                return inArea(c, area);
                              })
                              .map(function (c) {
                                return createSubButton(c);
                              });
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                [userSubButtons],
                                styles.bubbleSeparatorSubButtonBase,
                              ),
                            );
                          }
                          const coverCards = area._covers.map((c) =>
                            createBubbleCard({
                              card_type: 'cover',
                              entity: c.entity.entity_id,
                              show_state: true,
                              show_last_changed: true,
                              use_accent_color: true,
                              tap_action: { action: 'none' },
                              button_action: {
                                tap_action: { action: 'more-info' },
                              },
                              icon_open: 'mdi:roller-shade',
                              icon_close: 'mdi:roller-shade-closed',
                            }),
                          );
                          section.cards.push(
                            createGrid(coverCards, sectionConfig),
                          );
                        }
                        break;
                      case 'bonbon_miscellaneous':
                        const miscCards = area._misc
                          .filter(
                            (c) =>
                              !area.categorizedEntityIds.includes(
                                c.entity.entity_id,
                              ),
                          )
                          .map((c) => createButton(c.entity, styles));
                        if (miscCards.length) {
                          if (sectionConfig.show_separator) {
                            const userSubButtons = resolveEntities(
                              sectionConfig.custom_separator_buttons,
                              sectionConfig.include_sensors,
                              sectionConfig.include_config,
                              sectionConfig.include_diagnostic,
                            )
                              .filter((c) => {
                                return inArea(c, area);
                              })
                              .map(function (c) {
                                return createSubButton(c);
                              });
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                [userSubButtons],
                                styles.bubbleSeparatorSubButtonBase,
                              ),
                            );
                          }
                          section.cards.push(
                            createGrid(miscCards, sectionConfig),
                          );
                        }
                        break;
                      default:
                        if (
                          sectionConfig.cards &&
                          sectionConfig.cards.length &&
                          (!sectionConfig.area_id ||
                            sectionConfig.area_id == area.area_id)
                        ) {
                          const userCards = resolveEntities(
                            sectionConfig.cards,
                            sectionConfig.include_sensors,
                            sectionConfig.include_config,
                            sectionConfig.include_diagnostic,
                          )
                            .filter((c) => {
                              console.log(c);
                              return (
                                inArea(c, area) &&
                                area.categorizedEntityIds.push(
                                  c?.entity?.entity_id,
                                )
                              );
                            })
                            .map(function (c) {
                              return c.object || createButton(c.entity, styles);
                            });
                          if (userCards.length) {
                            if (sectionConfig.show_separator) {
                              const userSubButtons = resolveEntities(
                                sectionConfig.custom_separator_buttons,
                                sectionConfig.include_sensors,
                                sectionConfig.include_config,
                                sectionConfig.include_diagnostic,
                              )
                                .map(function (c) {
                                  if (c.entity) {
                                    return c;
                                  }
                                  return createSubButton(c);
                                })
                                .filter((c) => {
                                  if (
                                    c.bonbon_area_id == area.area_id ||
                                    c.area_id == area.area_id
                                  ) {
                                    return true;
                                  }
                                  return inArea(c, area);
                                });
                              section.cards.push(
                                createSeparatorCard(
                                  sectionConfig.name || 'Custom Section',
                                  sectionConfig.icon ||
                                    'mdi:view-dashboard-edit',
                                  [userSubButtons],
                                  styles.bubbleSeparatorSubButtonBase,
                                ),
                              );
                            }
                            section.cards.push(
                              createGrid(userCards, sectionConfig),
                            );
                          }
                        }
                        break;
                    }
                    return section.cards.length ? section : false;
                  })
                  .filter((section) => section);
                views.push({
                  title: area.name,
                  icon: area.icon,
                  background: isDark
                    ? config.background_image_dark
                      ? 'top / cover no-repeat fixed url("' +
                        config.background_image_dark +
                        '")'
                      : ''
                    : config.background_image_light
                      ? 'top / cover no-repeat fixed url("' +
                        config.background_image_light +
                        '")'
                      : '',
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
                const userCards = resolveEntities(
                  sectionConfig.cards,
                  sectionConfig.include_sensors,
                  sectionConfig.include_config,
                  sectionConfig.include_diagnostic,
                ).map(function (c) {
                  return c.object || createButton(c.entity, styles);
                });
                if (userCards.length) {
                  if (sectionConfig.show_separator) {
                    const userSubButtons = resolveEntities(
                      sectionConfig.custom_separator_buttons,
                      sectionConfig.include_sensors,
                      sectionConfig.include_config,
                      sectionConfig.include_diagnostic,
                    )
                      .map(function (c) {
                        if (c.entity) {
                          return c;
                        }
                        return createSubButton(c);
                      })
                      .filter((c) => c);
                    section.cards.push(
                      createSeparatorCard(
                        sectionConfig.name || 'Custom Section',
                        sectionConfig.icon || 'mdi:view-dashboard-edit',
                        [userSubButtons],
                        styles.bubbleSeparatorSubButtonBase,
                      ),
                    );
                  }
                  section.cards.push(createGrid(userCards, sectionConfig));
                }
              }
              break;
          }
          return section.cards.length ? section : false;
        })
        .filter((section) => section);

      const homeView = {
        title: dashboardName,
        icon: config?.views?.bonbon_home?.icon || '',
        background: isDark
          ? config.background_image_dark
            ? 'top / cover no-repeat fixed url("' +
              config.background_image_dark +
              '")'
            : ''
          : config.background_image_light
            ? 'top / cover no-repeat fixed url("' +
              config.background_image_light +
              '")'
            : '',
        path: 'home',
        type: 'sections',
        max_columns: config?.views?.bonbon_home?.max_columns || 1,
        sections: homeSections,
      };
      views.unshift(homeView);

      Object.keys(config.views || {})
        .filter((k) => k !== 'bonbon_home' && k !== 'bonbon_area')
        .forEach((viewKey) => {
          const viewConfig = config.views[viewKey] || {};
          const sections = Object.keys(viewConfig.sections || {})
            .filter((s) => !viewConfig.sections[s].hidden)
            .sort((aKey, bKey) => {
              const orderA =
                viewConfig.sections[aKey].order ?? Number.MAX_SAFE_INTEGER;
              const orderB =
                viewConfig.sections[bKey].order ?? Number.MAX_SAFE_INTEGER;
              return orderA - orderB;
            })
            .map((key) => {
              const sectionConfig = viewConfig.sections[key];
              const section = { cards: [] };
              if (sectionConfig.cards && sectionConfig.cards.length) {
                const userCards = resolveEntities(
                  sectionConfig.cards,
                  sectionConfig.include_sensors,
                  sectionConfig.include_config,
                  sectionConfig.include_diagnostic,
                ).map(function (c) {
                  return c.object || createButton(c.entity, styles);
                });

                if (userCards.length) {
                  if (sectionConfig.show_separator) {
                    const userSubButtons = resolveEntities(
                      sectionConfig.custom_separator_buttons,
                      sectionConfig.include_sensors,
                      sectionConfig.include_config,
                      sectionConfig.include_diagnostic,
                    ).map(function (c) {
                      return createSubButton(c);
                    });
                    section.cards.push(
                      createSeparatorCard(
                        sectionConfig.name || 'Custom Section',
                        sectionConfig.icon || 'mdi:view-dashboard-edit',
                        [userSubButtons],
                        styles.bubbleSeparatorSubButtonBase,
                      ),
                    );
                  }
                  section.cards.push(createGrid(userCards, sectionConfig));
                }
              }
              return section.cards.length ? section : false;
            })
            .filter((s) => s);

          if (sections.length) {
            views.push({
              title: viewConfig.title || viewKey,
              icon: viewConfig.icon || '',
              background: isDark
                ? config.background_image_dark
                  ? 'top / cover no-repeat fixed url("' +
                    config.background_image_dark +
                    '")'
                  : ''
                : config.background_image_light
                  ? 'top / cover no-repeat fixed url("' +
                    config.background_image_light +
                    '")'
                  : '',
              path: viewConfig.path || viewKey,
              type: 'sections',
              max_columns: viewConfig.max_columns || 1,
              sections,
            });
          }
        });

      const applyGlobalStyles = (data) => {
        if (!Array.isArray(data)) return data;
        return data.map((struct) => {
          let newStruct = { ...struct };
          if (
            newStruct.type &&
            newStruct.type.startsWith('custom:bubble-card')
          ) {
            newStruct.styles = styles.bubbleGlobal + (newStruct.styles || '');
          }
          if (newStruct.type && window.cardMod_patch_state) {
            newStruct.card_mod = {
              style: (newStruct.card_mod?.style || '') + styles.cardmodGlobal,
            };
          }
          if (newStruct.elements && Array.isArray(newStruct.elements)) {
            newStruct.elements = applyGlobalStyles(newStruct.elements);
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

customElements.define('ll-strategy-bonbon-strategy', BonbonStrategy);
console.info(
  `%c 🍬 Bonbon %c Strategy `,
  'background-color: #cfd49b;color: #000;padding: 3px 2px 3px 3px;border-radius: 14px 0 0 14px;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;',
  'background-color: #8e72c3;color: #fff;padding: 3px 3px 3px 2px;border-radius: 0 14px 14px 0;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;',
);
