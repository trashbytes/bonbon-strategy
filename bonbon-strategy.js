window.bonbon = window.bonbon || {};

const hacstag = new URL(import.meta.url).searchParams.get('hacstag');

const { defaultConfig } = await import(`./bonbon-strategy-config.js?hacstag=${hacstag}`);
const {
  getWeatherIcon,
  androidGesturesFix,
  mergeDeep,
  getAreaColors,
  getColorsFromColor,
  normalizeSectionColumn,
  applySectionColumns,
  upgradeConfig,
} = await import(`./bonbon-strategy-utils.js?hacstag=${hacstag}`);
const { createBuildersApi } = await import(`./bonbon-strategy-builders.js?hacstag=${hacstag}`);

const { createStylesApi } = await import(`./bonbon-strategy-styles.js?hacstag=${hacstag}`);
const { createEntityApi } = await import(`./bonbon-strategy-entities.js?hacstag=${hacstag}`);

export class BonbonStrategy {
  static async generate(userConfig, hass) {
    const panelUrl = hass.panelUrl;
    const globals = {};
    window.bonbon[panelUrl] = globals;

    const {
      prepareEntities,
      resolveEntity,
      resolveEntities,
      hasScopeFilter,
      withAreaScope,
      withFloorScope,
      cardMatchesAreaScope,
    } = createEntityApi({
      entities: hass.entities,
      devices: hass.devices,
      states: hass.states,
      floors: hass.floors,
      areas: hass.areas,
    });

    const entities = prepareEntities(hass.entities, hass.states, hass.devices, hass.floors, hass.areas);

    globals.resolveEntities = resolveEntities;
    globals.resolveEntity = resolveEntity;

    androidGesturesFix();

    try {
      const views = [];
      const config = upgradeConfig(mergeDeep(defaultConfig, userConfig));

      const dashboardName =
        Object.values(hass?.panels).find((p) => p?.url_path === panelUrl)?.title ||
        hass?.config?.location_name ||
        'Home';

      config.styles.primary_accent_color_light = config.styles.primary_accent_color.includes('#')
        ? getColorsFromColor(config.styles.primary_accent_color, false).activeColor
        : config.styles.primary_accent_color;

      config.styles.primary_accent_color_dark = config.styles.primary_accent_color.includes('#')
        ? getColorsFromColor(config.styles.primary_accent_color, true).activeColor
        : config.styles.primary_accent_color;

      const { css, observeDarkMode, cssValue, getStyles, getVariables } = createStylesApi(panelUrl, config);
      const { createButtonCard, createSeparatorCard, createGrid, createSubButton, isTogglableEntity, hasBinaryState } =
        createBuildersApi(panelUrl, config);

      const styles = getStyles();
      const cssVars = getVariables();

      Object.values(hass.areas || {})
        .filter((a) => !a.labels?.includes('hidden') && !a.labels?.includes('bonbon_hidden'))
        .map(function (area, index, areas) {
          const lightAreaColors = getAreaColors(area, index, areas, false, config.styles);
          cssVars.light['--area-' + area.area_id + '-light-color'] = lightAreaColors.lightColor;
          cssVars.light['--area-' + area.area_id + '-medium-color'] = lightAreaColors.mediumColor;
          cssVars.light['--area-' + area.area_id + '-shade-color'] = lightAreaColors.shadeColor;

          const darkAreaColors = getAreaColors(area, index, areas, true, config.styles);
          cssVars.dark['--area-' + area.area_id + '-light-color'] = darkAreaColors.lightColor;
          cssVars.dark['--area-' + area.area_id + '-medium-color'] = darkAreaColors.mediumColor;
          cssVars.dark['--area-' + area.area_id + '-shade-color'] = darkAreaColors.shadeColor;
        });

      observeDarkMode((isDarkMode) => {
        const rootElement = document.documentElement;
        if (!rootElement) {
          return;
        }

        const activeVars = isDarkMode ? cssVars.dark : cssVars.light;
        const inactiveVars = isDarkMode ? cssVars.light : cssVars.dark;

        Object.keys(inactiveVars || {}).forEach((variableName) => {
          rootElement.style.removeProperty(variableName);
        });

        Object.entries(activeVars || {}).forEach(([variableName, variableValue]) => {
          if (variableValue === undefined || variableValue === null || variableValue === '') {
            rootElement.style.removeProperty(variableName);
            return;
          }

          rootElement.style.setProperty(variableName, String(variableValue));
        });
      });

      const expandedViews = { ...config.views };
      const areaSectionConfig = { ...expandedViews.bonbon_home.sections.bonbon_areas };
      delete expandedViews.bonbon_home.sections.bonbon_areas;

      const _floors = Object.values({
        ...(hass.floors || {}),
        _areas: {
          name: areaSectionConfig.name,
          floor_id: '_areas',
          icon: areaSectionConfig.icon || 'mdi:sofa',
          level: Number.MAX_SAFE_INTEGER,
        },
      });

      const _areas = Object.values(hass.areas || {})
        .filter((a) => !a.labels?.includes('hidden') && !a.labels?.includes('bonbon_hidden'))
        .map(function (area, index, areas) {
          area.categorizedEntityIds = [];
          return area;
        });

      _floors.forEach((floor, index, floors) => {
        const viewKey = 'bonbon_home';
        const floorAreas = _areas.filter((area) => area.floor_id == floor.floor_id);
        const sectionConfig = { ...areaSectionConfig };
        sectionConfig.name = floor.name;
        sectionConfig.icon = floor.icon || 'mdi:home-floor-' + String(floor.level).replace('-', 'negative-');
        sectionConfig.cards = [];
        sectionConfig.separator_buttons = withFloorScope(sectionConfig.separator_buttons, floor.floor_id);

        floorAreas.forEach((area) => {
          const subButtons = resolveEntities(
            withAreaScope(
              (Array.isArray(sectionConfig.sub_buttons) ? sectionConfig.sub_buttons : [sectionConfig.sub_buttons])
                .filter(Boolean)
                .map((c) => {
                  return typeof c === 'string' ? (c.startsWith('area.') ? area[c?.split('.')[1]] || '' : c) : c;
                }),
              area.area_id,
            ),
            sectionConfig,
            viewKey,
          )
            .map((c, index, filtered) => {
              if (sectionConfig.sub_combine_lights) {
                if (c?.entity?.entity_id.startsWith('light.')) {
                  return ['off', 'on'].map((state) =>
                    createSubButton(c, {
                      icon: sectionConfig.sub_combine_lights == 'always' ? 'mdi:lightbulb-group' : '',
                      tap_action: {
                        action: 'call-service',
                        service: 'light.turn_' + state,
                        target: {
                          entity_id: filtered.map((c) => c?.entity?.entity_id),
                        },
                      },
                    }),
                  );
                }
              }
              return createSubButton(c);
            })
            .flat();

          const inlineButtons = resolveEntities(
            withAreaScope(
              (Array.isArray(sectionConfig.inline_buttons)
                ? sectionConfig.inline_buttons
                : [sectionConfig.inline_buttons]
              )
                .filter(Boolean)
                .map((c) => {
                  return typeof c === 'string' ? (c.startsWith('area.') ? area[c?.split('.')[1]] || '' : c) : c;
                }),
              area.area_id,
            ),
            sectionConfig,
            viewKey,
          )
            .map((c) => {
              if (c?.entity) {
                return createSubButton(
                  { entity: c.entity },
                  {
                    fill_width: false,
                  },
                );
              }
            })
            .filter(Boolean);

          const areaCard = createButtonCard(null, sectionConfig, {
            icon: area.icon,
            show_state: false,
            name: area.name.split(' (')[0],
            button_action: {
              tap_action: {
                action: 'navigate',
                navigation_path: `bonbon_area_${area.area_id}`,
              },
              hold_action: { action: 'navigate', navigation_path: `/config/areas/area/${area.area_id}` },
            },
            sub_button: {
              main: subButtons,
              bottom: [
                {
                  buttons_layout: 'inline',
                  justify_content: 'start',
                  group: inlineButtons,
                },
              ],
              bottom_layout: 'inline',
            },
            rows: inlineButtons.length ? 1.4 : 1,
            styles: css`
              :host {
                --area-light-color: var(--area-${area.area_id}-light-color);
                --area-medium-color: var(--area-${area.area_id}-medium-color);
                --area-shade-color: var(--area-${area.area_id}-shade-color);
              }
              .bubble-main-icon-container {
                pointer-events: none;
              }
            `,
            bonbon_styles: [
              'bubbleAreaBase',
              sectionConfig.sub_combine_lights
                ? sectionConfig.sub_combine_lights === 'always'
                  ? 'bubbleAreaSubButtonAlways'
                  : 'bubbleAreaSubButtonDefault'
                : '',
            ],
          });
          sectionConfig.cards.push(areaCard);
        });
        expandedViews.bonbon_home.sections['bonbon_floor_' + floor.floor_id] = sectionConfig;
      });

      const areaViewConfig = { ...expandedViews.bonbon_area };
      delete expandedViews.bonbon_area;

      _areas.forEach((area) => {
        const viewKey = 'bonbon_area_' + area.area_id;
        const viewConfig = {
          title: area.name,
          icon: area.icon,
          subview: true,
          path: viewKey,
          max_columns: areaViewConfig.max_columns || 1,
          sections: {},
        };
        Object.keys(areaViewConfig.sections)
          .filter((key) => {
            return !areaViewConfig.sections[key].disabled;
          })
          .sort((aKey, bKey) => {
            const orderA = areaViewConfig.sections[aKey].order ?? Number.MAX_SAFE_INTEGER;
            const orderB = areaViewConfig.sections[bKey].order ?? Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
          })
          .forEach((key) => {
            const sectionConfig = { ...areaViewConfig.sections[key] };
            sectionConfig.key = key;

            const areaCards = (Array.isArray(sectionConfig.cards) ? sectionConfig.cards : [sectionConfig.cards])
              .filter(Boolean)
              .map((c) => {
                return typeof c === 'string' ? (c.startsWith('area.') ? area[c?.split('.')[1]] || '' : c) : c;
              });
            if (
              areaCards &&
              areaCards.length &&
              (!sectionConfig.area_id ||
                (Array.isArray(sectionConfig.area_id)
                  ? sectionConfig.area_id.includes(area.area_id)
                  : sectionConfig.area_id == area.area_id))
            ) {
              sectionConfig.cards = resolveEntities(
                withAreaScope(areaCards, area.area_id),
                sectionConfig,
                area.area_id,
              ).filter(
                (c) =>
                  (hasScopeFilter(c.selector, ['area_id']) || cardMatchesAreaScope(c, area, sectionConfig)) &&
                  ((key != 'bonbon_miscellaneous' && area.categorizedEntityIds.push(c?.entity?.entity_id)) ||
                    !area.categorizedEntityIds.includes(c?.entity?.entity_id)),
              );

              sectionConfig.separator_buttons = resolveEntities(
                withAreaScope(sectionConfig.separator_buttons, area.area_id),
                sectionConfig,
                area.area_id,
              );
            }
            viewConfig.sections[key] = sectionConfig;
          });
        expandedViews[viewKey] = viewConfig;
      });

      const transformedViews = { ...expandedViews };

      Object.keys(transformedViews || {}).forEach((viewKey) => {
        const viewConfig = { ...(transformedViews[viewKey] || {}) };
        viewConfig.max_columns = viewConfig.max_columns || 1;

        const sections = Object.keys(viewConfig?.sections)
          .filter((key) => {
            return !viewConfig.sections[key].disabled;
          })
          .sort((aKey, bKey) => {
            const orderA = viewConfig.sections[aKey].order ?? Number.MAX_SAFE_INTEGER;
            const orderB = viewConfig.sections[bKey].order ?? Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
          })
          .map((key) => {
            const sectionConfig = viewConfig.sections[key];
            sectionConfig.key = key;
            const section = {
              cards: [],
              bonbon_column: normalizeSectionColumn(sectionConfig.column),
            };
            const cards = resolveEntities(sectionConfig.cards, sectionConfig, viewKey).map(function (c) {
              return createButtonCard(c, sectionConfig, {
                show_graph: sectionConfig.show_graphs,
                show_forecast: sectionConfig.show_forecast,
              });
            });

            if (!sectionConfig.hide_separator && (cards.length || sectionConfig.show_if_empty)) {
              const separatorSubEntities = resolveEntities(sectionConfig.separator_buttons, sectionConfig, viewKey);

              const separatorSubButtons = separatorSubEntities
                .map((c, index, filtered) => {
                  if (sectionConfig.separator_combine_lights) {
                    if (c?.entity?.entity_id.startsWith('light.')) {
                      return ['off', 'on'].map((state) =>
                        createSubButton(c, {
                          icon: sectionConfig.separator_combine_lights == 'always' ? 'mdi:lightbulb-group' : '',
                          tap_action: {
                            action: 'call-service',
                            service: 'light.turn_' + state,
                            target: {
                              entity_id: filtered.map((c) => c?.entity?.entity_id),
                            },
                          },
                        }),
                      );
                    }
                  }
                  return createSubButton(
                    c,
                    key == 'bonbon_weather'
                      ? {
                          icon: 'mdi:thermometer',
                          show_attribute: true,
                          attribute: 'temperature',
                          show_state: false,
                        }
                      : {},
                  );
                })
                .flat()
                .filter(Boolean);

              const separatorStyles = sectionConfig.separator_combine_lights
                ? sectionConfig.separator_combine_lights == 'always'
                  ? ['bubbleSeparatorLightsSubButtonAlways']
                  : ['bubbleSeparatorLightsSubButtonDefault']
                : [];
              if (key == 'bonbon_weather') {
                if (sectionConfig.icon == 'auto') {
                  sectionConfig.icon =
                    getWeatherIcon(hass.states[separatorSubEntities?.[0]?.entity?.entity_id]?.state) ||
                    'mdi:cloud-question';
                }
                if (sectionConfig.name == 'auto') {
                  sectionConfig.name = separatorSubEntities?.[0]?.entity?.name || 'Weather';
                }
              }
              section.cards.push(
                createSeparatorCard(
                  sectionConfig.name || 'Custom Section',
                  sectionConfig.icon || 'mdi:view-dashboard-edit',
                  [separatorSubButtons],
                  separatorStyles,
                ),
              );
            }
            if (cards.length) {
              section.cards.push(createGrid(cards, sectionConfig));
            }
            return section.cards.length ? section : false;
          })
          .filter((section) => section);

        viewConfig.sections = applySectionColumns(sections, viewConfig.max_columns || 1);
        viewConfig.background = cssValue('background-image');
        viewConfig.type = 'sections';
        if (viewKey == 'bonbon_home') {
          viewConfig.title = dashboardName || viewConfig.title || viewKey;
          views.unshift(viewConfig);
        } else {
          if (!viewKey.startsWith('bonbon_area_')) {
            viewConfig.path = 'custom_' + viewKey;
          }
          views.push(viewConfig);
        }
      });

      const getInferredBubbleStyles = (card) => {
        if (!card?.type?.startsWith('custom:bubble-card')) {
          return [];
        }

        const entityId = typeof card?.entity === 'string' ? card.entity : card?.entity?.entity_id || '';
        const isToggle =
          card?.button_action?.tap_action?.action === 'toggle' ||
          (entityId && entities[entityId] && isTogglableEntity({ entity: entities[entityId] }));
        const isBinary =
          entityId.startsWith('binary_sensor.') ||
          entityId.startsWith('person.') ||
          (card?.card_type && card.card_type !== 'button') ||
          (entityId && entities[entityId] && hasBinaryState({ entity: entities[entityId] }));
        const cardType = card?.card_type || 'button';

        if (cardType === 'button' && !isToggle && !isBinary) {
          return ['bubbleButtonNonBinary'];
        }

        if (cardType === 'separator') {
          const subButtonGroups = Array.isArray(card?.sub_button?.main) ? card.sub_button.main : [];
          const flattenedSubButtons = subButtonGroups
            .map((group) => group?.group)
            .filter((group) => Array.isArray(group))
            .flat();

          return flattenedSubButtons.length ? ['bubbleSeparatorSubButtonBase'] : [];
        }

        return [];
      };

      const applyGlobalStyles = (data) => {
        if (!Array.isArray(data)) return data;
        return data.map((struct) => {
          let newStruct = { ...struct };
          if (newStruct.type && newStruct.type.startsWith('custom:bubble-card')) {
            const inferredBonbonStyles = getInferredBubbleStyles(newStruct);
            const allBonbonStyles = [...(newStruct.bonbon_styles || []), ...inferredBonbonStyles].filter(
              (styleName, index, arr) => arr.indexOf(styleName) === index,
            );

            newStruct.styles =
              styles.bubbleGlobal +
              (allBonbonStyles?.map((s) => styles[s] || '').join('\n') || '') +
              (newStruct.styles ? '\n' + newStruct.styles : '');
          }
          if (newStruct.type && window.cardMod_patch_state) {
            newStruct.card_mod = {
              style:
                styles.cardmodGlobal +
                (!newStruct.type.startsWith('custom:') ? styles.haCardBase : '') +
                (newStruct.type == 'custom:mini-graph-card' ? styles.graphCard : '') +
                (newStruct.card_mod?.style || ''),
            };
            if (newStruct.type == 'custom:mini-graph-card') {
              newStruct.line_color = cssValue('primary-accent-color');
            }
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
          if (newStruct.type && newStruct.type == 'conditional' && newStruct.card) {
            newStruct.card = applyGlobalStyles([newStruct.card])[0];
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
