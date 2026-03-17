function isTogglableEntity(c) {
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
    c.entity?.entity_id?.startsWith('script.')
  );
}

function hasBinaryState(c) {
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
    c.entity?.entity_id?.startsWith('vacuum.') ||
    c.entity?.entity_id?.startsWith('lawn_mower.') ||
    c.entity?.entity_id?.startsWith('binary_sensor.') ||
    c.entity?.entity_id?.startsWith('person.') ||
    c.entity?.entity_id?.startsWith('device_tracker.') ||
    c.entity?.entity_id?.startsWith('sun.') ||
    c.entity?.entity_id?.startsWith('update.')
  );
}

export function createButtonCard(c, options = {}) {
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
    base.entity = c.entity?.entity_id;

    const isClimate = c.entity.entity_id.startsWith('climate.');
    const isMedia = c.entity.entity_id.startsWith('media_player.');
    const isCover = c.entity.entity_id.startsWith('cover.');
    const isToggle = isTogglableEntity(c);
    const isBinary = hasBinaryState(c) || (options?.card_type && options?.card_type != 'button');

    if (isToggle) {
      base.button_type = 'switch';
      base.button_action.tap_action.action = 'toggle';
    } else {
      base.button_type = 'state';
      base.button_action.tap_action.action = 'more-info';
    }

    if (isToggle || isBinary) {
      base.show_last_changed = true;
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
}

export function createSeparatorCard(name, icon, groups = [], styles = []) {
  const card = {
    type: 'custom:bubble-card',
    card_type: 'separator',
    name: name,
    icon: icon,
    sub_button: { main: groups.map((g) => ({ group: g })) },
    bonbon_styles: styles,
  };
  return card;
}

export function createSubButton(c, options = {}) {
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
}

export function resolveColumns(sectionConfig, count) {
  return (
    sectionConfig.columns ||
    Math.min(Math.max(sectionConfig.min_columns || 1, count || 0), sectionConfig.max_columns || 1)
  );
}

export function createGrid(cardsArray, sectionConfig) {
  return {
    type: 'grid',
    columns: resolveColumns(sectionConfig, cardsArray?.length),
    square: false,
    cards: cardsArray,
  };
}
