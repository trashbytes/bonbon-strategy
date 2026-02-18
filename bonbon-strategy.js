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
  getAreaColors,
  getColorsFromColor,
} = await import(`./bonbon-strategy-utils.js?hacstag=${hacstag}`);
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
    const areas = Object.keys(hass.areas).reduce((acc, area_id) => {
      const area = hass.areas[area_id];
      const colorLabel = area.labels?.find((label) =>
        /^(bonbon_)?color_([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(label),
      );
      acc[area_id] = {
        ...area,
        label: colorLabel,
      };
      return acc;
    }, {});
    const entities = Object.keys(hass.entities).reduce((acc, entity_id) => {
      const originalEntity = hass.entities[entity_id];
      const device = devices?.[originalEntity?.device_id];
      const updatedEntity = {
        ...originalEntity,
        area_id: originalEntity?.area_id || device?.area_id,
        labels: [...(originalEntity?.labels || []), ...(device?.labels || [])],
      };
      if (updatedEntity.area_id) {
        updatedEntity.floor_id = areas?.[updatedEntity.area_id]?.floor_id;
      }
      acc[entity_id] = updatedEntity;
      return acc;
    }, {});
    const labels = Object.values(entities).reduce((acc, e) => {
      (e.labels ?? []).forEach((label) => {
        (acc[label] ??= []).push(e);
      });
      return acc;
    }, {});

    if (typeof window !== 'undefined') {
      window.__bonbon = {
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

      const metaScheme = document.querySelector('meta[name="color-scheme"]');
      const isDark = metaScheme.getAttribute('content') === 'dark';

      if (metaScheme) {
        const observer = new MutationObserver(() => {
          location.reload();
        });

        observer.observe(metaScheme, { attributes: true });
      }

      config.styles.primary_accent_color =
        config.styles.primary_accent_color.includes('#')
          ? getColorsFromColor(config.styles.primary_accent_color, isDark)
              .activeColor
          : config.styles.primary_accent_color;

      const styles = getStyles(config.styles, isDark);

      const homeSections = Object.keys(config?.views?.bonbon_home?.sections)
        .filter((key) => {
          return !config.views.bonbon_home.sections[key].disabled;
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
                if (!sectionConfig.hide_separator) {
                  const separatorName = !sectionConfig.show_weather_card
                    ? entities[weather_entity?.entity?.entity_id]?.name ||
                      states[weather_entity?.entity?.entity_id]?.attributes
                        ?.friendly_name ||
                      devices[
                        entities[weather_entity?.entity?.entity_id]?.device_id
                      ]?.name ||
                      sectionConfig.name
                    : sectionConfig.name;
                  const separatorIcon = !sectionConfig.show_weather_card
                    ? getWeatherIcon(
                        states[weather_entity?.entity?.entity_id]?.state,
                      )
                    : sectionConfig.icon;
                  const separatorSubButtons = [
                    !sectionConfig.show_weather_card
                      ? [
                          createSubButton(
                            weather_entity,
                            'temperature',
                            'mdi:thermometer',
                          ),
                        ]
                      : [],
                  ];
                  section.cards.push(
                    createSeparatorCard(
                      separatorName,
                      separatorIcon,
                      separatorSubButtons,
                      styles.bubbleSeparatorSubButtonBase,
                    ),
                  );
                  if (sectionConfig.show_weather_card) {
                    section.cards.push(
                      createGrid(
                        [
                          {
                            type: 'weather-forecast',
                            entity: weather_entity_id,
                            show_current: true,
                            show_forecast:
                              sectionConfig.show_weather_card === 'daily' ||
                              sectionConfig.show_weather_card === 'hourly',
                            forecast_type:
                              sectionConfig.show_weather_card === 'daily'
                                ? 'daily'
                                : sectionConfig.show_weather_card === 'hourly'
                                  ? 'hourly'
                                  : undefined,
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
                if (!sectionConfig.hide_separator) {
                  section.cards.push(
                    createSeparatorCard(sectionConfig.name, sectionConfig.icon),
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
                if (!sectionConfig.hide_separator) {
                  section.cards.push(
                    createSeparatorCard(sectionConfig.name, sectionConfig.icon),
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
                floor._lights = resolveEntities(
                  'light.*[floor_id=' + floor.floor_id + ']',
                );
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
                  const colors = getAreaColors(
                    area,
                    index,
                    areas,
                    isDark,
                    config.styles,
                  );
                  area.lightColor = colors.lightColor;
                  area.mediumColor = colors.mediumColor;
                  area.shadeColor = colors.shadeColor;

                  area.categorizedEntityIds = [];

                  area.temperature_entity_id =
                    area.temperature_entity_id ||
                    resolveEntity(
                      'sensor.*[device_class=temperature][unit_of_measurement=°C|°F][area_id=' +
                        area.area_id +
                        ']',
                    )?.entity?.entity_id;

                  area.humidity_entity_id =
                    area.humidity_entity_id ||
                    resolveEntity(
                      'sensor.*[device_class=humidity][unit_of_measurement=%][area_id=' +
                        area.area_id +
                        ']',
                    )?.entity?.entity_id;

                  area.co2_entity_id =
                    area.co2_entity_id ||
                    resolveEntity(
                      'sensor.*[device_class=carbon_dioxide][unit_of_measurement=ppm][area_id=' +
                        area.area_id +
                        ']',
                    )?.entity?.entity_id;

                  area._lights = resolveEntities(
                    'light.*[area_id=' + area.area_id + ']',
                  );

                  area._switches = resolveEntities(
                    'switch.*[area_id=' + area.area_id + ']',
                  );
                  area._openings = resolveEntities(
                    'binary_sensor.*[device_class=door|garage_door|window|opening][area_id=' +
                      area.area_id +
                      ']',
                  );

                  area._media = resolveEntities(
                    'media_player.*[area_id=' + area.area_id + ']',
                  );

                  area._covers = resolveEntities(
                    'cover.*[area_id=' + area.area_id + ']',
                  );

                  area._climates = resolveEntities(
                    'climate.*[area_id=' + area.area_id + ']',
                  );

                  area._misc = resolveEntities(
                    '[area_id=' + area.area_id + ']',
                  );
                  return area;
                });

              _floors.forEach((floor, index, floors) => {
                const floorAreas = _areas.filter(
                  (area) => area.floor_id == floor.floor_id,
                );
                if (floorAreas.length) {
                  if (!sectionConfig.hide_separator) {
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
                                  icon:
                                    sectionConfig.show_floor_lights_toggle ===
                                    'always'
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
                    const separatorSubButtons = [floorLightsSubButtons];
                    const separatorStyles = floorLightsSubButtons.length
                      ? sectionConfig.show_floor_lights_toggle === 'always'
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
                          navigation_path: `bonbon_area_${area.area_id}`,
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
                                  icon:
                                    sectionConfig.show_area_lights_toggle ===
                                    'always'
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
                            --area-light-color: ${isDark
                              ? area.shadeColor
                              : area.lightColor};
                            --area-medium-color: ${area.mediumColor};
                            --area-shade-color: ${isDark
                              ? area.lightColor
                              : area.shadeColor};
                          }
                        ` +
                        (sectionConfig.show_area_lights_toggle === 'always'
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
                    return !config.views.bonbon_area.sections[key].disabled;
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
                          if (!sectionConfig.hide_separator) {
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                              ),
                            );
                          }
                        const envCards = [
                          area.temperature_entity_id,
                          area.humidity_entity_id,
                          area.co2_entity_id,
                        ]
                          .filter((e_id) => {
                            return (
                              e_id &&
                              !area.categorizedEntityIds.includes(e_id) &&
                              area.categorizedEntityIds.push(e_id)
                            );
                          })
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
                                  line_color:
                                    'var(--bonbon-primary-accent-color)',
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
                          if (!sectionConfig.hide_separator) {
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                              ),
                            );
                          }
                          const climateCards = area._climates
                            .filter((c) => {
                              return (
                                !area.categorizedEntityIds.includes(
                                  c.entity.entity_id,
                                ) &&
                                area.categorizedEntityIds.push(
                                  c.entity.entity_id,
                                )
                              );
                            })
                            .map((c) =>
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
                          if (!sectionConfig.hide_separator) {
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
                                          icon:
                                            sectionConfig.show_area_lights_toggle ===
                                            'always'
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

                            const separatorSubButtons = [areaLightsSubButtons];
                            const separatorStyles = areaLightsSubButtons.length
                              ? sectionConfig.show_area_lights_toggle ===
                                'always'
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
                          const lightCards = area._lights
                            .filter((c) => {
                              return (
                                !area.categorizedEntityIds.includes(
                                  c.entity.entity_id,
                                ) &&
                                area.categorizedEntityIds.push(
                                  c.entity.entity_id,
                                )
                              );
                            })
                            .map((c) =>
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
                          if (!sectionConfig.hide_separator) {
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                              ),
                            );
                          }
                          const switchCards = area._switches
                            .filter((c) => {
                              return (
                                !area.categorizedEntityIds.includes(
                                  c.entity.entity_id,
                                ) &&
                                area.categorizedEntityIds.push(
                                  c.entity.entity_id,
                                )
                              );
                            })
                            .map((c) =>
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
                          if (!sectionConfig.hide_separator) {
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                              ),
                            );
                          }
                          const mediaCards = area._media
                            .filter((c) => {
                              return (
                                !area.categorizedEntityIds.includes(
                                  c.entity.entity_id,
                                ) &&
                                area.categorizedEntityIds.push(
                                  c.entity.entity_id,
                                )
                              );
                            })
                            .map((c) =>
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
                          if (!sectionConfig.hide_separator) {
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                              ),
                            );
                          }
                          const openingCards = area._openings
                            .filter((c) => {
                              return (
                                !area.categorizedEntityIds.includes(
                                  c.entity.entity_id,
                                ) &&
                                area.categorizedEntityIds.push(
                                  c.entity.entity_id,
                                )
                              );
                            })
                            .map((c) =>
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
                          if (!sectionConfig.hide_separator) {
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
                              ),
                            );
                          }
                          const coverCards = area._covers
                            .filter((c) => {
                              return (
                                !area.categorizedEntityIds.includes(
                                  c.entity.entity_id,
                                ) &&
                                area.categorizedEntityIds.push(
                                  c.entity.entity_id,
                                )
                              );
                            })
                            .map((c) =>
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
                          if (!sectionConfig.hide_separator) {
                            section.cards.push(
                              createSeparatorCard(
                                sectionConfig.name,
                                sectionConfig.icon,
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
                            (Array.isArray(sectionConfig.area_id)
                              ? sectionConfig.area_id.includes(area.area_id)
                              : sectionConfig.area_id == area.area_id))
                        ) {
                          const userCards = resolveEntities(sectionConfig.cards)
                            .filter(
                              (c) =>
                                (c.selector &&
                                  typeof c.selector == 'string' &&
                                  c.selector.includes('[area_id=')) ||
                                ((c.object?.bonbon_area_id == area.area_id ||
                                  c.object?.area_id == area.area_id ||
                                  (!c.object?.bonbon_area_id &&
                                    !c.object?.area_id &&
                                    (inArea(c, area) ||
                                      (sectionConfig.area_id &&
                                        (Array.isArray(sectionConfig.area_id)
                                          ? sectionConfig.area_id.some(
                                              (areaId) => inArea(c, areaId),
                                            )
                                          : inArea(
                                              c,
                                              sectionConfig.area_id,
                                            )))))) &&
                                  area.categorizedEntityIds.push(
                                    c?.entity?.entity_id,
                                  )),
                            )
                            .map(function (c) {
                              return c.object || createButton(c.entity, styles);
                            });
                          if (userCards.length) {
                            if (!sectionConfig.hide_separator) {
                              const userSubButtons = resolveEntities(
                                sectionConfig.separator_buttons,
                              )
                                .filter(
                                  (c) =>
                                    (c.selector &&
                                      typeof c.selector == 'string' &&
                                      c.selector.includes('[area_id=')) ||
                                    c.object?.bonbon_area_id == area.area_id ||
                                    c.object?.area_id == area.area_id ||
                                    (!c.object?.bonbon_area_id &&
                                      !c.object?.area_id &&
                                      (inArea(c, area) ||
                                        (sectionConfig.area_id &&
                                          (Array.isArray(sectionConfig.area_id)
                                            ? sectionConfig.area_id.some(
                                                (areaId) => inArea(c, areaId),
                                              )
                                            : inArea(
                                                c,
                                                sectionConfig.area_id,
                                              ))))),
                                )
                                .map(function (c) {
                                  return createSubButton(c);
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
                    ? config?.styles?.background_image_dark
                      ? 'top / cover no-repeat fixed url("' +
                        config?.styles?.background_image_dark +
                        '")'
                      : ''
                    : config?.styles?.background_image_light
                      ? 'top / cover no-repeat fixed url("' +
                        config?.styles?.background_image_light +
                        '")'
                      : '',
                  subview: true,
                  path: `bonbon_area_${area.area_id}`,
                  type: 'sections',
                  max_columns: config?.views?.bonbon_area?.max_columns || 1,
                  sections: areaSections,
                });
              });
              break;
            default:
              if (sectionConfig.cards && sectionConfig.cards.length) {
                const userCards = resolveEntities(sectionConfig.cards).map(
                  function (c) {
                    return c.object || createButton(c.entity, styles);
                  },
                );
                if (userCards.length) {
                  if (!sectionConfig.hide_separator) {
                    const userSubButtons = resolveEntities(
                      sectionConfig.separator_buttons,
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
              break;
          }
          return section.cards.length ? section : false;
        })
        .filter((section) => section);

      const homeView = {
        title: dashboardName,
        icon: config?.views?.bonbon_home?.icon || '',
        background: isDark
          ? config?.styles?.background_image_dark
            ? 'top / cover no-repeat fixed url("' +
              config?.styles?.background_image_dark +
              '")'
            : ''
          : config?.styles?.background_image_light
            ? 'top / cover no-repeat fixed url("' +
              config?.styles?.background_image_light +
              '")'
            : '',
        path: 'bonbon_home',
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
            .filter((s) => !viewConfig.sections[s].disabled)
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
                const userCards = resolveEntities(sectionConfig.cards).map(
                  function (c) {
                    return c.object || createButton(c.entity, styles);
                  },
                );

                if (userCards.length) {
                  if (!sectionConfig.hide_separator) {
                    const userSubButtons = resolveEntities(
                      sectionConfig.separator_buttons,
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
                ? config?.styles?.background_image_dark
                  ? 'top / cover no-repeat fixed url("' +
                    config?.styles?.background_image_dark +
                    '")'
                  : ''
                : config?.styles?.background_image_light
                  ? 'top / cover no-repeat fixed url("' +
                    config?.styles?.background_image_light +
                    '")'
                  : '',
              path: 'custom_' + viewKey,
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
              style:
                styles.cardmodGlobal +
                (!newStruct.type.startsWith('custom:')
                  ? styles.haCardBase
                  : '') +
                (newStruct.card_mod?.style || ''),
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
