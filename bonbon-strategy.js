const hacstag = new URL(import.meta.url).searchParams.get('hacstag');

const { defaultConfig } = await import(
  `./bonbon-strategy-config.js?hacstag=${hacstag}`
);
const { css, getStyles } = await import(
  `./bonbon-strategy-styles.js?hacstag=${hacstag}`
);
const {
  getWeatherIcon,
  androidGesturesFix,
  mergeDeep,
  getAllEntityIds,
  getAreaColors,
} = await import(`./bonbon-strategy-utils.js?hacstag=${hacstag}`);
const {
  createButton,
  createSeparatorCard,
  createGrid,
  createBubbleCard,
  createSubButton,
} = await import(`./bonbon-strategy-builders.js?hacstag=${hacstag}`);

const {
  isEntityType,
  getNightlights,
  getLightsOnFloor,
  sortLights,
  sortEntities,
  filterEntitiesInArea,
  getVisiblePersons,
  getFavorites,
  findFirstEntityByPrefix,
  getEntitiesByDeviceId,
  resolveEntities,
} = await import(`./bonbon-strategy-entities.js?hacstag=${hacstag}`);

export class BonbonStrategy {
  static async generate(userConfig, hass) {
    const entities = hass.entities;
    const states = hass.states;
    const devices = hass.devices;
    const labels = Object.values(entities).reduce((acc, e) => {
      const allLabels = [];
      if (e.labels && Array.isArray(e.labels)) {
        allLabels.push(...e.labels);
      }
      if (e.device_id && devices[e.device_id]?.labels) {
        const deviceLabels = devices[e.device_id].labels;
        if (Array.isArray(deviceLabels)) {
          allLabels.push(...deviceLabels);
        }
      }
      allLabels.forEach((label) => {
        if (!acc[label]) {
          acc[label] = [];
        }
        acc[label].push(e);
      });
      return acc;
    }, {});

    androidGesturesFix();
    const ha = document.querySelector('home-assistant');
    const autoLightDarkMode = () => {
      const desiredDark = states['sun.sun']?.state === 'below_horizon';
      if (!hass?.selectedTheme) return;
      if (hass.selectedTheme.dark !== desiredDark) {
        hass.selectedTheme.dark = desiredDark;
        ha._applyTheme();
      }
    };

    try {
      const views = [];
      const config = mergeDeep(defaultConfig, userConfig);
      const dashboardName =
        Object.values(hass?.panels).find((p) => p?.url_path === hass?.panelUrl)
          ?.title ||
        hass?.config?.location_name ||
        'Home';
      if (
        config.auto_light_dark_mode &&
        states['sun.sun'] &&
        hass?.selectedTheme
      ) {
        autoLightDarkMode();
        try {
          if (hass?.connection?.subscribeEvents) {
            hass.connection.subscribeEvents((event) => {
              if (
                event?.event_type === 'state_changed' &&
                event?.data?.entity_id === 'sun.sun'
              ) {
                autoLightDarkMode();
              }
            }, 'state_changed');
          } else {
            const pollInterval = 60 * 1000;
            setInterval(() => {
              if (document.visibilityState === 'visible') {
                autoLightDarkMode();
              }
            }, pollInterval);
          }
        } catch (e) {
          const pollInterval = 60 * 1000;
          setInterval(() => {
            if (document.visibilityState === 'visible') {
              autoLightDarkMode();
            }
          }, pollInterval);
        }
      }

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
                weather_entity_id = findFirstEntityByPrefix(
                  entities,
                  'weather.',
                );
              }
              if (weather_entity_id && states[weather_entity_id]) {
                if (sectionConfig.show_separator) {
                  const sepName = !sectionConfig.show_card
                    ? entities[weather_entity_id]?.name ||
                      states[weather_entity_id]?.attributes?.friendly_name ||
                      devices[entities[weather_entity_id]?.device_id]?.name ||
                      sectionConfig.name
                    : sectionConfig.name;
                  const sepIcon = !sectionConfig.show_card
                    ? getWeatherIcon(states[weather_entity_id]?.state)
                    : sectionConfig.icon;
                  const userSubButtons = sortEntities(
                    resolveEntities(
                      sectionConfig.custom_separator_buttons,
                      entities,
                      devices,
                      labels,
                    ),
                    devices,
                    states,
                  )
                    .map(function (c) {
                      if (c.entity) {
                        return c;
                      }
                      return createSubButton(c);
                    })
                    .filter((c) => c);
                  const sepSubButton = {
                    main: [
                      {
                        group: !sectionConfig.show_card
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
                          : [],
                      },
                      {
                        group: userSubButtons,
                      },
                    ],
                  };
                  section.cards.push(
                    createSeparatorCard(
                      sepName,
                      sepIcon,
                      sepSubButton,
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
                        1,
                        false,
                      ),
                    );
                  }
                }
              }
              break;
            case 'bonbon_persons':
              const persons = getVisiblePersons(entities, devices);
              if (persons.length) {
                if (sectionConfig.show_separator) {
                  const userSubButtons = sortEntities(
                    resolveEntities(
                      sectionConfig.custom_separator_buttons,
                      entities,
                      devices,
                      labels,
                    ),
                    devices,
                    states,
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
                      sectionConfig.name,
                      sectionConfig.icon,
                      {
                        main: [
                          {
                            group: userSubButtons,
                          },
                        ],
                      },
                      styles.bubbleSeparatorSubButtonBase,
                    ),
                  );
                }
                section.cards.push(
                  createGrid(
                    persons.map((e) =>
                      createBubbleCard({
                        card_type: 'button',
                        button_type: 'state',
                        entity: e.entity_id,
                        show_state: true,
                      }),
                    ),
                    sectionConfig,
                    persons.length,
                    false,
                  ),
                );
              }
              break;
            case 'bonbon_favorites':
              const favorites = getFavorites(entities, devices);

              if (favorites.length) {
                if (sectionConfig.show_separator) {
                  const userSubButtons = sortEntities(
                    resolveEntities(
                      sectionConfig.custom_separator_buttons,
                      entities,
                      devices,
                      labels,
                    ),
                    devices,
                    states,
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
                      sectionConfig.name,
                      sectionConfig.icon,
                      {
                        main: [
                          {
                            group: userSubButtons,
                          },
                        ],
                      },
                      styles.bubbleSeparatorSubButtonBase,
                    ),
                  );
                }
                section.cards.push(
                  createGrid(
                    favorites.map((e) =>
                      createButton(e, entities, states, styles),
                    ),
                    sectionConfig,
                    favorites.length,
                    false,
                  ),
                );
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
                floor._lights = getLightsOnFloor(
                  entities,
                  floor,
                  hass.areas,
                  devices,
                );
                return floor;
              });

              const nightlights = getNightlights(entities, devices);

              const areas = Object.values(hass.areas)
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

                  area.co2_entity_id = (filterEntitiesInArea(
                    entities,
                    (e) =>
                      states[e.entity_id]?.attributes?.device_class ===
                        'carbon_dioxide' ||
                      (e.entity_id.includes('co2') &&
                        states[e.entity_id]?.attributes?.unit_of_measurement ===
                          'ppm'),
                    area.area_id,
                    devices,
                    area.categorizedEntityIds,
                  ) || [])[0]?.entity_id;

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
                            area.categorizedEntityIds.push(entity_id);
                          }
                        });
                      }
                      if (typeof c === 'string' && entities[c]) {
                        area.categorizedEntityIds.push(c);
                      }
                      if (typeof c === 'string' && labels[c]) {
                        labels[c].forEach((e) => {
                          area.categorizedEntityIds.push(e.entity_id);
                        });
                      }
                    });

                  area._lights = sortLights(
                    filterEntitiesInArea(
                      entities,
                      (e) => isEntityType(e, 'light.'),
                      area.area_id,
                      devices,
                      area.categorizedEntityIds,
                    ),
                    devices,
                    states,
                  );
                  area._switches = sortEntities(
                    filterEntitiesInArea(
                      entities,
                      (e) => isEntityType(e, 'switch.'),
                      area.area_id,
                      devices,
                      area.categorizedEntityIds,
                    ),
                    devices,
                    states,
                  );
                  area._openings = sortEntities(
                    filterEntitiesInArea(
                      entities,
                      (e) =>
                        isEntityType(e, 'binary_sensor.') &&
                        e.entity_id.endsWith('_contact'),
                      area.area_id,
                      devices,
                      area.categorizedEntityIds,
                    ),
                    devices,
                    states,
                  );

                  area._media = sortEntities(
                    filterEntitiesInArea(
                      entities,
                      (e) => isEntityType(e, 'media_player.'),
                      area.area_id,
                      devices,
                      area.categorizedEntityIds,
                    ),
                    devices,
                    states,
                  );

                  area._covers = sortEntities(
                    filterEntitiesInArea(
                      entities,
                      (e) => isEntityType(e, 'cover.'),
                      area.area_id,
                      devices,
                      area.categorizedEntityIds,
                    ),
                    devices,
                    states,
                  );

                  area._climates = sortEntities(
                    filterEntitiesInArea(
                      entities,
                      (e) => isEntityType(e, 'climate.'),
                      area.area_id,
                      devices,
                      area.categorizedEntityIds,
                    ),
                    devices,
                    states,
                  );

                  area._misc = sortEntities(
                    filterEntitiesInArea(
                      entities,
                      (e) => {
                        return true;
                      },
                      area.area_id,
                      devices,
                      area.categorizedEntityIds,
                    ),
                    devices,
                    states,
                  );
                  return area;
                });

              floors.forEach((floor, index, floors) => {
                const floorAreas = areas.filter(
                  (area) => area.floor_id == floor.floor_id,
                );
                if (floorAreas.length) {
                  if (sectionConfig.show_separator) {
                    const userSubButtons = sortEntities(
                      resolveEntities(
                        sectionConfig.custom_separator_buttons,
                        entities,
                        devices,
                        labels,
                      ),
                      devices,
                      states,
                    )
                      .map(function (c) {
                        if (c.entity) {
                          return c;
                        }
                        return createSubButton(c);
                      })
                      .filter((c) => {
                        if (
                          c.bonbon_floor_id == floor.floor_id ||
                          c.floor_id == floor.floor_id
                        ) {
                          return true;
                        }
                        const e = c.entity
                          ? entities[c.entity]
                          : c.entity_id
                            ? entities[c.entity_id]
                            : undefined;
                        if (e) {
                          const area = areas[e.area_id];
                          const onFloor = area?.floor_id == floor.floor_id;
                          return onFloor;
                        }
                      });

                    const notNightlights = (floor._lights || []).filter(
                      (e) =>
                        nightlights
                          .map((nightlight) => nightlight.entity_id)
                          .indexOf(e.entity_id) == -1,
                    );
                    const sepName = floor.name;
                    const sepIcon =
                      floor.icon ||
                      'mdi:home-floor-' +
                        String(floor.level).replace('-', 'negative-');

                    const floorLightsSubButtons =
                      sectionConfig.show_floor_lights_toggle
                        ? (notNightlights || [])
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
                            .flat()
                        : [];
                    const sepSubButton = {
                      main: [
                        {
                          group: floorLightsSubButtons,
                        },
                        {
                          group: userSubButtons,
                        },
                      ],
                    };
                    const sepStyles = floorLightsSubButtons.length
                      ? sectionConfig.always_show_floor_lights_toggle
                        ? styles.bubbleSeparatorLightsSubButtonAlways
                        : styles.bubbleSeparatorLightsSubButtonDefault
                      : '';
                    section.cards.push(
                      createSeparatorCard(
                        sepName,
                        sepIcon,
                        sepSubButton,
                        styles.bubbleSeparatorSubButtonBase + sepStyles,
                      ),
                    );
                  }

                  const floorCards = floorAreas.map((area) => {
                    const notNightlights = (area._lights || []).filter(
                      (e) =>
                        nightlights
                          .map((n) => n.entity_id)
                          .indexOf(e.entity_id) == -1,
                    );
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
                          ? (notNightlights || [])
                              .map((e, index, filtered) => {
                                return ['off', 'on'].map((state) => ({
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
                  section.cards.push(
                    createGrid(
                      floorCards,
                      sectionConfig,
                      floorCards.length,
                      false,
                    ),
                  );
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
                            const userSubButtons = sortEntities(
                              resolveEntities(
                                sectionConfig.custom_separator_buttons,
                                entities,
                                devices,
                                labels,
                              ),
                              devices,
                              states,
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

                                const e = c.entity
                                  ? entities[c.entity]
                                  : c.entity_id
                                    ? entities[c.entity_id]
                                    : undefined;
                                if (e) {
                                  const inArea = e.area_id === area.area_id;
                                  const device = devices[e.device_id];
                                  const deviceInArea =
                                    device && device.area_id === area.area_id;
                                  return inArea || deviceInArea;
                                }
                              });
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                {
                                  main: [
                                    {
                                      group: userSubButtons,
                                    },
                                  ],
                                },
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
                        section.cards.push(
                          createGrid(
                            envCards,
                            sectionConfig,
                            envCards.length,
                            false,
                          ),
                        );
                        break;
                      case 'bonbon_climate':
                        if (area._climates.length) {
                          if (sectionConfig.show_separator) {
                            const userSubButtons = sortEntities(
                              resolveEntities(
                                sectionConfig.custom_separator_buttons,
                                entities,
                                devices,
                                labels,
                              ),
                              devices,
                              states,
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

                                const e = c.entity
                                  ? entities[c.entity]
                                  : c.entity_id
                                    ? entities[c.entity_id]
                                    : undefined;
                                if (e) {
                                  const inArea = e.area_id === area.area_id;
                                  const device = devices[e.device_id];
                                  const deviceInArea =
                                    device && device.area_id === area.area_id;
                                  return inArea || deviceInArea;
                                }
                              });
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                {
                                  main: [
                                    {
                                      group: userSubButtons,
                                    },
                                  ],
                                },
                                styles.bubbleSeparatorSubButtonBase,
                              ),
                            );
                          }
                          const climateCards = area._climates.map((e) =>
                            createBubbleCard({
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
                            }),
                          );
                          section.cards.push(
                            createGrid(
                              climateCards,
                              sectionConfig,
                              climateCards.length,
                              false,
                            ),
                          );
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
                            const areaLightsSubButtons =
                              sectionConfig.show_area_lights_toggle
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
                                : [];

                            const userSubButtons = sortEntities(
                              resolveEntities(
                                sectionConfig.custom_separator_buttons,
                                entities,
                                devices,
                                labels,
                              ),
                              devices,
                              states,
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

                                const e = c.entity
                                  ? entities[c.entity]
                                  : c.entity_id
                                    ? entities[c.entity_id]
                                    : undefined;
                                if (e) {
                                  const inArea = e.area_id === area.area_id;
                                  const device = devices[e.device_id];
                                  const deviceInArea =
                                    device && device.area_id === area.area_id;
                                  return inArea || deviceInArea;
                                }
                              });
                            const sepSubButton = {
                              main: [
                                {
                                  group: areaLightsSubButtons,
                                },
                                {
                                  group: userSubButtons,
                                },
                              ],
                            };
                            const sepStyles = areaLightsSubButtons.length
                              ? sectionConfig.always_show_area_lights_toggle
                                ? styles.bubbleSeparatorLightsSubButtonAlways
                                : styles.bubbleSeparatorLightsSubButtonDefault
                              : '';
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                sepSubButton,
                                styles.bubbleSeparatorSubButtonBase + sepStyles,
                              ),
                            );
                          }
                          const lightCards = area._lights.map((e) =>
                            createBubbleCard({
                              card_type: 'button',
                              entity: e.entity_id,
                              show_state: true,
                              show_last_changed: true,
                              use_accent_color: true,
                              tap_action: { action: 'none' },
                            }),
                          );
                          section.cards.push(
                            createGrid(
                              lightCards,
                              sectionConfig,
                              lightCards.length,
                              false,
                            ),
                          );
                        }
                        break;
                      case 'bonbon_switches':
                        if (area._switches.length) {
                          if (sectionConfig.show_separator) {
                            const userSubButtons = sortEntities(
                              resolveEntities(
                                sectionConfig.custom_separator_buttons,
                                entities,
                                devices,
                                labels,
                              ),
                              devices,
                              states,
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

                                const e = c.entity
                                  ? entities[c.entity]
                                  : c.entity_id
                                    ? entities[c.entity_id]
                                    : undefined;
                                if (e) {
                                  const inArea = e.area_id === area.area_id;
                                  const device = devices[e.device_id];
                                  const deviceInArea =
                                    device && device.area_id === area.area_id;
                                  return inArea || deviceInArea;
                                }
                              });
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                {
                                  main: [
                                    {
                                      group: userSubButtons,
                                    },
                                  ],
                                },
                                styles.bubbleSeparatorSubButtonBase,
                              ),
                            );
                          }
                          const switchCards = area._switches.map((e) =>
                            createBubbleCard({
                              card_type: 'button',
                              entity: e.entity_id,
                              show_state: true,
                              show_last_changed: true,
                              use_accent_color: true,
                              tap_action: { action: 'none' },
                            }),
                          );
                          section.cards.push(
                            createGrid(
                              switchCards,
                              sectionConfig,
                              switchCards.length,
                              false,
                            ),
                          );
                        }
                        break;
                      case 'bonbon_media':
                        if (area._media.length) {
                          if (sectionConfig.show_separator) {
                            const userSubButtons = sortEntities(
                              resolveEntities(
                                sectionConfig.custom_separator_buttons,
                                entities,
                                devices,
                                labels,
                              ),
                              devices,
                              states,
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

                                const e = c.entity
                                  ? entities[c.entity]
                                  : c.entity_id
                                    ? entities[c.entity_id]
                                    : undefined;
                                if (e) {
                                  const inArea = e.area_id === area.area_id;
                                  const device = devices[e.device_id];
                                  const deviceInArea =
                                    device && device.area_id === area.area_id;
                                  return inArea || deviceInArea;
                                }
                              });
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                {
                                  main: [
                                    {
                                      group: userSubButtons,
                                    },
                                  ],
                                },
                                styles.bubbleSeparatorSubButtonBase,
                              ),
                            );
                          }
                          const mediaCards = area._media.map((e) =>
                            createBubbleCard({
                              card_type: 'media-player',
                              entity: e.entity_id,
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
                            createGrid(
                              mediaCards,
                              sectionConfig,
                              mediaCards.length,
                              false,
                            ),
                          );
                        }
                        break;
                      case 'bonbon_openings':
                        if (area._openings.length) {
                          if (sectionConfig.show_separator) {
                            const userSubButtons = sortEntities(
                              resolveEntities(
                                sectionConfig.custom_separator_buttons,
                                entities,
                                devices,
                                labels,
                              ),
                              devices,
                              states,
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

                                const e = c.entity
                                  ? entities[c.entity]
                                  : c.entity_id
                                    ? entities[c.entity_id]
                                    : undefined;
                                if (e) {
                                  const inArea = e.area_id === area.area_id;
                                  const device = devices[e.device_id];
                                  const deviceInArea =
                                    device && device.area_id === area.area_id;
                                  return inArea || deviceInArea;
                                }
                              });
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                {
                                  main: [
                                    {
                                      group: userSubButtons,
                                    },
                                  ],
                                },
                                styles.bubbleSeparatorSubButtonBase,
                              ),
                            );
                          }
                          const openingCards = area._openings.map((e) =>
                            createBubbleCard({
                              card_type: 'button',
                              entity: e.entity_id,
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
                            createGrid(
                              openingCards,
                              sectionConfig,
                              openingCards.length,
                              false,
                            ),
                          );
                        }
                        break;
                      case 'bonbon_covers':
                        if (area._covers.length) {
                          if (sectionConfig.show_separator) {
                            const userSubButtons = sortEntities(
                              resolveEntities(
                                sectionConfig.custom_separator_buttons,
                                entities,
                                devices,
                                labels,
                              ),
                              devices,
                              states,
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

                                const e = c.entity
                                  ? entities[c.entity]
                                  : c.entity_id
                                    ? entities[c.entity_id]
                                    : undefined;
                                if (e) {
                                  const inArea = e.area_id === area.area_id;
                                  const device = devices[e.device_id];
                                  const deviceInArea =
                                    device && device.area_id === area.area_id;
                                  return inArea || deviceInArea;
                                }
                              });
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                {
                                  main: [
                                    {
                                      group: userSubButtons,
                                    },
                                  ],
                                },
                                styles.bubbleSeparatorSubButtonBase,
                              ),
                            );
                          }
                          const coverCards = area._covers.map((e) =>
                            createBubbleCard({
                              card_type: 'cover',
                              entity: e.entity_id,
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
                            createGrid(
                              coverCards,
                              sectionConfig,
                              coverCards.length,
                              false,
                            ),
                          );
                        }
                        break;
                      case 'bonbon_miscellaneous':
                        const miscCards = area._misc
                          .filter((e) => !area.categorizedEntityIds.includes(e))
                          .map((e) =>
                            createButton(e, entities, states, styles),
                          );
                        if (miscCards.length) {
                          if (sectionConfig.show_separator) {
                            const userSubButtons = sortEntities(
                              resolveEntities(
                                sectionConfig.custom_separator_buttons,
                                entities,
                                devices,
                                labels,
                              ),
                              devices,
                              states,
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

                                const e = c.entity
                                  ? entities[c.entity]
                                  : c.entity_id
                                    ? entities[c.entity_id]
                                    : undefined;
                                if (e) {
                                  const inArea = e.area_id === area.area_id;
                                  const device = devices[e.device_id];
                                  const deviceInArea =
                                    device && device.area_id === area.area_id;
                                  return inArea || deviceInArea;
                                }
                              });
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                                {
                                  main: [
                                    {
                                      group: userSubButtons,
                                    },
                                  ],
                                },
                                styles.bubbleSeparatorSubButtonBase,
                              ),
                            );
                          }
                          section.cards.push(
                            createGrid(
                              miscCards,
                              sectionConfig,
                              miscCards.length,
                              false,
                            ),
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
                          const userCards = sortEntities(
                            resolveEntities(
                              sectionConfig.cards,
                              entities,
                              devices,
                              labels,
                            ),
                            devices,
                            states,
                          )
                            .map(function (c) {
                              if (c.type) {
                                return c;
                              }
                              return createButton(
                                c.entity_id,
                                entities,
                                states,
                                styles,
                              );
                            })
                            .filter((c) => {
                              if (
                                sectionConfig.area_id == area.area_id ||
                                c.bonbon_area_id == area.area_id ||
                                c.area_id == area.area_id
                              ) {
                                return true;
                              }
                              const e = c.entity
                                ? entities[c.entity]
                                : c.entity_id
                                  ? entities[c.entity_id]
                                  : undefined;
                              if (e) {
                                area.categorizedEntityIds.push(e);
                                const inArea = e.area_id === area.area_id;
                                const device = devices[e.device_id];
                                const deviceInArea =
                                  device && device.area_id === area.area_id;
                                return inArea || deviceInArea;
                              }
                              return false;
                            });
                          if (userCards.length) {
                            if (sectionConfig.show_separator) {
                              const userSubButtons = sortEntities(
                                resolveEntities(
                                  sectionConfig.custom_separator_buttons,
                                  entities,
                                  devices,
                                  labels,
                                ),
                                devices,
                                states,
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

                                  const e = c.entity
                                    ? entities[c.entity]
                                    : c.entity_id
                                      ? entities[c.entity_id]
                                      : undefined;
                                  if (e) {
                                    const inArea = e.area_id === area.area_id;
                                    const device = devices[e.device_id];
                                    const deviceInArea =
                                      device && device.area_id === area.area_id;
                                    return inArea || deviceInArea;
                                  }
                                });
                              section.cards.push(
                                createSeparatorCard(
                                  sectionConfig.name || 'Custom Section',
                                  sectionConfig.icon ||
                                    'mdi:view-dashboard-edit',
                                  {
                                    main: [
                                      {
                                        group: userSubButtons,
                                      },
                                    ],
                                  },
                                  styles.bubbleSeparatorSubButtonBase,
                                ),
                              );
                            }
                            section.cards.push(
                              createGrid(
                                userCards,
                                sectionConfig,
                                userCards.length,
                                false,
                              ),
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
                const userCards = sortEntities(
                  resolveEntities(
                    sectionConfig.cards,
                    entities,
                    devices,
                    labels,
                  ),
                  devices,
                  states,
                )
                  .map(function (c) {
                    if (c.type) {
                      return c;
                    }
                    return createButton(c.entity_id, entities, states, styles);
                  })
                  .filter((c) => c);
                if (userCards.length) {
                  if (sectionConfig.show_separator) {
                    const userSubButtons = sortEntities(
                      resolveEntities(
                        sectionConfig.custom_separator_buttons,
                        entities,
                        devices,
                        labels,
                      ),
                      devices,
                      states,
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
                        {
                          main: [
                            {
                              group: userSubButtons,
                            },
                          ],
                        },
                        styles.bubbleSeparatorSubButtonBase,
                      ),
                    );
                  }
                  section.cards.push(
                    createGrid(
                      userCards,
                      sectionConfig,
                      userCards.length,
                      false,
                    ),
                  );
                }
              }
              break;
          }
          return section.cards.length ? section : false;
        })
        .filter((section) => section);

      const homeView = {
        title: dashboardName,
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
              const orderA = viewConfig.sections[aKey].order ?? 999;
              const orderB = viewConfig.sections[bKey].order ?? 999;
              return orderA - orderB;
            })
            .map((key) => {
              const sectionConfig = viewConfig.sections[key];
              const section = { cards: [] };
              if (sectionConfig.cards && sectionConfig.cards.length) {
                const userCards = sortEntities(
                  resolveEntities(
                    sectionConfig.cards,
                    entities,
                    devices,
                    labels,
                  ),
                  devices,
                  states,
                )
                  .map(function (c) {
                    if (c.type) {
                      return c;
                    }
                    return createButton(c.entity_id, entities, states, styles);
                  })
                  .filter((c) => c);

                if (userCards.length) {
                  if (sectionConfig.show_separator) {
                    const userSubButtons = sortEntities(
                      resolveEntities(
                        sectionConfig.custom_separator_buttons,
                        entities,
                        devices,
                        labels,
                      ),
                      devices,
                      states,
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
                        {
                          main: [
                            {
                              group: userSubButtons,
                            },
                          ],
                        },
                        styles.bubbleSeparatorSubButtonBase,
                      ),
                    );
                  }
                  section.cards.push(
                    createGrid(
                      userCards,
                      sectionConfig,
                      userCards.length,
                      false,
                    ),
                  );
                }
              }
              return section.cards.length ? section : false;
            })
            .filter((s) => s);

          if (sections.length) {
            views.push({
              title: viewConfig.name || viewKey,
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
