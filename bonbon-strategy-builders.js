export function createBuildersApi(panelUrl, config, states = {}, templateApi = null) {
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

  // Card used when no template matches an entity, e.g. when the strategy is used without the template API.
  // Entity-less cards (area cards) keep the passive shape of the old hard-coded construction.
  const getFallbackCard = (c) => {
    const base = {
      type: 'custom:bubble-card',
      card_type: 'button',
      button_type: 'state',
      show_state: true,
      use_accent_color: true,
      tap_action: { action: 'more-info' },
      button_action: { tap_action: { action: 'more-info' } },
    };
    if (c?.entity) {
      base.name = c.entity.name;
      base.entity = c.entity.entity_id;
    } else {
      base.button_type = 'name';
      base.tap_action = { action: 'none' };
      base.button_action = { tap_action: { action: 'none' } };
    }
    return base;
  };

  // Deprecated: `actions` is only applied when the user configured it.
  const getConfiguredActions = (c) => {
    const configuredActions = config?.actions;
    if (!configuredActions || !c?.entity?.entity_id) {
      return null;
    }
    const domain = c.entity.entity_id.split('.')[0];
    const domainActions = configuredActions?.[domain];
    if (domainActions === false) {
      return null;
    }
    const domainConfig = typeof domainActions === 'object' && domainActions ? domainActions : null;
    const defaultConfig = typeof configuredActions?.['default'] === 'object' ? configuredActions['default'] : null;
    const actions = {};
    Object.keys(domainConfig || {}).forEach((key) => {
      actions[key] = domainConfig[key];
    });
    Object.keys(defaultConfig || {}).forEach((key) => {
      if (actions[key] === undefined) {
        actions[key] = defaultConfig[key];
      }
    });
    return Object.keys(actions).length ? actions : null;
  };

  const applyConfiguredActions = (card, c) => {
    if (card?.type !== 'custom:bubble-card' || card?.card_type !== 'button') {
      return card;
    }
    const actions = getConfiguredActions(c);
    if (!actions) {
      return card;
    }
    const isToggle = isTogglableEntity(c);
    const fallback = isToggle ? 'toggle' : 'more-info';
    const resolve = (value) => (value === 'auto' ? fallback : value);

    const tapAction = resolve(actions.icon);
    const buttonAction = resolve(actions.button);

    if (tapAction) {
      card.tap_action = { action: tapAction };
    }
    if (buttonAction) {
      card.button_action = {
        ...(card.button_action || {}),
        tap_action: { action: buttonAction },
      };
    }
    if (card.tap_action?.action == 'none') {
      card.tap_action.action = card.button_action?.tap_action?.action || card.tap_action.action;
    }
    return card;
  };

  const getHideStyles = (card, c, sectionConfig) => {
    const entityId = typeof card?.entity === 'string' ? card.entity : card?.entity?.entity_id;
    if (!entityId || !c?.hide) {
      return '';
    }
    return (
      '${hass.entities["' +
      entityId +
      '"] && this.parentElement ? "' +
      c?.hide +
      '".split("&&").map((s) => {return window.bonbon["' +
      panelUrl +
      '"].resolveEntity("' +
      entityId +
      '" + s, null, null, {"' +
      entityId +
      '": hass.entities["' +
      entityId +
      '"]}, hass.states, hass.devices, hass.floors, hass.areas)}).filter(Boolean).length ? this.parentElement.style.display = "none" : this.parentElement.style.display = "block" : ""}' +
      (!sectionConfig?.show_if_empty
        ? '${Array.from(this?.parentElement?.parentElement?.querySelectorAll(":scope > :not([style*=\'display: none\'])")||[]).length || 0 > 0 ? (document.documentElement.style.setProperty("' +
          sectionConfig?.display_var +
          '", "block") + document.documentElement.style.setProperty("' +
          sectionConfig?.next_margin_var +
          '", "0")) : (document.documentElement.style.setProperty("' +
          sectionConfig?.display_var +
          '", "none") + document.documentElement.style.setProperty("' +
          sectionConfig?.next_margin_var +
          '", "calc(var(--bonbon-' +
          panelUrl +
          '-row-gap) * -1)"))}'
        : '')
    );
  };

  const createButtonCard = (c, sectionConfig = {}, options = {}, area = undefined) => {
    if (c?.object && !c?.bubble_card) {
      return c.object;
    }

    const card = templateApi?.getCardTemplate?.(c, sectionConfig, area);
    const base = card || getFallbackCard(c);

    // Code-only extras: name prefix, unchanged apply to template names as well.
    if (base?.name && c?.entity && sectionConfig?.prefix && c?.entity[sectionConfig?.prefix]) {
      base.name = c.entity[sectionConfig.prefix] + ' ' + base.name;
    } else if (!base?.name && c?.entity) {
      base.name =
        sectionConfig?.prefix && c.entity[sectionConfig.prefix]
          ? c.entity[sectionConfig.prefix] + ' ' + c.entity.name
          : c.entity.name;
    }

    const hideStyles = getHideStyles(base, c, sectionConfig);
    if (hideStyles) {
      base.styles = base.styles ? hideStyles + '\n' + base.styles : hideStyles;
    }

    applyConfiguredActions(base, c);

    const merged = { ...base, ...(options || {}) };
    if (c?.object) {
      return {
        ...merged,
        ...c.object,
      };
    }
    return merged;
  };

  const createSeparatorCard = (sectionConfig, groups = [], styles = []) => {
    const name = sectionConfig.name || 'Custom Section';
    const icon = sectionConfig.icon || 'mdi:view-dashboard-edit';
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
