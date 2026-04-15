export function createBuildersApi(panelUrl, config) {
  const isTogglableEntity = (c) => {
    return (
      c.entity?.entity_id?.startsWith('light.') ||
      c.entity?.entity_id?.startsWith('switch.') ||
      c.entity?.entity_id?.startsWith('lock.') ||
      c.entity?.entity_id?.startsWith('valve.') ||
      c.entity?.entity_id?.startsWith('button.') ||
      c.entity?.entity_id?.startsWith('input_button.') ||
      c.entity?.entity_id?.startsWith('fan.') ||
      c.entity?.entity_id?.startsWith('humidifier.') ||
      c.entity?.entity_id?.startsWith('water_heater.') ||
      c.entity?.entity_id?.startsWith('input_boolean.') ||
      c.entity?.entity_id?.startsWith('automation.') ||
      c.entity?.entity_id?.startsWith('script.') ||
      c.entity?.entity_id?.startsWith('scene.')
    );
  };

  const hasBinaryState = (c) => {
    return (
      c.entity?.entity_id?.startsWith('light.') ||
      c.entity?.entity_id?.startsWith('switch.') ||
      c.entity?.entity_id?.startsWith('lock.') ||
      c.entity?.entity_id?.startsWith('valve.') ||
      c.entity?.entity_id?.startsWith('button.') ||
      c.entity?.entity_id?.startsWith('input_button.') ||
      c.entity?.entity_id?.startsWith('fan.') ||
      c.entity?.entity_id?.startsWith('humidifier.') ||
      c.entity?.entity_id?.startsWith('water_heater.') ||
      c.entity?.entity_id?.startsWith('input_boolean.') ||
      c.entity?.entity_id?.startsWith('automation.') ||
      c.entity?.entity_id?.startsWith('vacuum.') ||
      c.entity?.entity_id?.startsWith('lawn_mower.') ||
      c.entity?.entity_id?.startsWith('binary_sensor.') ||
      c.entity?.entity_id?.startsWith('person.') ||
      c.entity?.entity_id?.startsWith('device_tracker.') ||
      c.entity?.entity_id?.startsWith('sun.') ||
      c.entity?.entity_id?.startsWith('update.')
    );
  };

  const getActions = (c) => {
    const actions = {
      icon: 'none',
      button: 'auto',
    };
    if (c?.entity?.entity_id) {
      const domain = c.entity.entity_id.split('.')[0];
      actions.icon = config?.actions?.[domain]?.icon || config?.actions?.['default']?.icon || actions.icon;
      actions.button = config?.actions?.[domain]?.button || config?.actions?.['default']?.button || actions.button;
    }
    return actions;
  };

  const createButtonCard = (c, sectionConfig = {}, options = {}) => {
    if (c?.object && !c?.bonbon_card) {
      return c.object;
    }
    if (
      (c?.entity?.hasLabel('graph') || options.show_graph) &&
      window.customCards?.map((cc) => cc.type).includes('mini-graph-card')
    ) {
      const graph = {
        type: 'custom:mini-graph-card',
        height: 56,
        entities: [
          {
            entity: c.entity?.entity_id,
            show_line: false,
          },
        ],
        show: {
          points: false,
          labels: false,
          labels_secondary: false,
        },
      };
      if (c?.entity) {
        graph.name = c.entity?.name;
        if (sectionConfig?.prefix && c.entity[sectionConfig?.prefix]) {
          graph.name = c.entity[sectionConfig?.prefix] + ' ' + graph.name;
        }
      }
      return graph;
    }
    const base = {
      type: 'custom:bubble-card',
      card_type: 'button',
      button_type: 'name',
      show_state: true,
      use_accent_color: true,
      tap_action: { action: 'none' },
      button_action: {
        tap_action: { action: 'none' },
      },
    };
    if (c?.entity) {
      base.name = c.entity?.name;
      if (sectionConfig?.prefix && c.entity[sectionConfig?.prefix]) {
        base.name = c.entity[sectionConfig?.prefix] + ' ' + base.name;
      }
      base.entity = c.entity?.entity_id;
      if (base.entity && c?.hide) {
        base.styles =
          '${hass.entities["' +
          base.entity +
          '"] && this.parentElement ? "' +
          c?.hide +
          '".split("&&").map((s) => {return window.bonbon["' +
          panelUrl +
          '"].resolveEntity("' +
          base.entity +
          '" + s, null, null, {"' +
          base.entity +
          '": hass.entities["' +
          base.entity +
          '"]}, hass.states, hass.devices, hass.floors, hass.areas)}).filter(Boolean).length ? this.parentElement.style.display = "none" : this.parentElement.style.display = "block" : ""}';
      }

      const isClimate = c.entity.entity_id.startsWith('climate.');
      const isMedia = c.entity.entity_id.startsWith('media_player.');
      const isCover = c.entity.entity_id.startsWith('cover.');
      const isScript = c.entity.entity_id.startsWith('script.');
      const isScene = c.entity.entity_id.startsWith('scene.');
      const isToggle = isTogglableEntity(c);
      const isBinary = hasBinaryState(c) || (options?.card_type && options?.card_type != 'button');

      const actions = getActions(c);

      if (isToggle) {
        base.button_type = 'switch';
        if (actions.button == 'auto') {
          base.button_action.tap_action.action = 'toggle';
        } else {
          base.button_action.tap_action.action = actions.button;
        }
        if (actions.icon == 'auto') {
          base.tap_action.action = 'toggle';
        } else {
          base.tap_action.action = actions.icon;
        }
      } else {
        base.button_type = 'state';
        if (actions.button == 'auto') {
          base.button_action.tap_action.action = 'more-info';
        } else {
          base.button_action.tap_action.action = actions.button;
        }
        if (actions.icon == 'auto') {
          base.tap_action.action = 'more-info';
        } else {
          base.tap_action.action = actions.icon;
        }
      }

      if (base.tap_action.action == 'none') {
        base.tap_action.action = base.button_action.tap_action.action;
      }

      if (isToggle || isBinary) {
        base.show_last_changed = true;
      }
      if (isScript || isScene) {
        base.show_state = false;
      }

      if (isClimate) {
        base.card_type = 'climate';
        base.sub_button = [
          {
            select_attribute: 'hvac_modes',
            show_arrow: false,
            state_background: false,
          },
        ];
      }

      if (isMedia) {
        base.card_type = 'media-player';
      }

      if (isCover) {
        base.card_type = 'cover';
      }
    }
    const merged = { ...base, ...(options || {}) };
    return merged;
  };

  const createSeparatorCard = (name, icon, groups = [], styles = []) => {
    const card = {
      type: 'custom:bubble-card',
      card_type: 'separator',
      name: name,
      icon: icon,
      sub_button: { main: groups.map((g) => ({ group: g })) },
      bonbon_styles: styles,
    };
    return card;
  };

  const createSubButton = (c, options = {}) => {
    if (c?.object) {
      return c.object;
    }
    const base = {
      show_background: false,
      use_accent_color: true,
      show_state: false,
      content_layout: 'icon-left',
      fill_width: false,
      tap_action: { action: 'more-info' },
    };
    if (c?.entity) {
      const isToggle = isTogglableEntity(c);
      base.entity = c.entity.entity_id;
      base.show_state = !isToggle;
      base.show_background = isToggle && !options.show_attribute;
    }
    const merged = { ...base, ...(options || {}) };
    return merged;
  };

  const resolveColumns = (sectionConfig, count) => {
    return (
      sectionConfig.columns ||
      Math.min(Math.max(sectionConfig.min_columns || 1, count || 0), sectionConfig.max_columns || 1)
    );
  };

  const createGrid = (cardsArray, sectionConfig) => {
    return {
      type: 'grid',
      columns: resolveColumns(sectionConfig, cardsArray?.length),
      square: false,
      cards: cardsArray,
    };
  };
  return {
    isTogglableEntity,
    hasBinaryState,
    createButtonCard,
    createSeparatorCard,
    createSubButton,
    createGrid,
  };
}
