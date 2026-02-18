function isTogglableEntity(c) {
  return (
    c.entity?.entity_id?.startsWith('light.') ||
    c.entity?.entity_id?.startsWith('switch.')
  );
}

function hasBinaryState(c, options) {
  return (
    c.entity?.entity_id?.startsWith('binary_sensor.') ||
    c.entity?.entity_id?.startsWith('person.')
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
    bonbon_styles: [],
  };
  if (c?.entity) {
    const isToggle = isTogglableEntity(c);
    const isBinary =
      hasBinaryState(c) ||
      (options?.card_type && options?.card_type != 'button');

    base.button_type = 'state';
    base.entity = c.entity?.entity_id;
    base.show_last_changed = isToggle || isBinary;
    base.button_action.tap_action.action = isToggle ? 'toggle' : 'more-info';

    if (!isToggle && !isBinary) {
      base.bonbon_styles = base.bonbon_styles.concat(['bubbleButtonNonBinary']);
    }
  }
  base.bonbon_styles = base.bonbon_styles.concat(options?.bonbon_styles || []);
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
    bonbon_styles: [],
  };
  if (c?.entity) {
    const isToggle = isTogglableEntity(c);
    base.entity = c.entity.entity_id;
    base.show_state = !isToggle;
    base.show_background = isToggle && !options.show_attribute;
  }
  base.bonbon_styles = base.bonbon_styles.concat(options?.bonbon_styles || []);
  const merged = { ...base, ...(options || {}) };
  return merged;
}

export function resolveColumns(sectionConfig, count) {
  return (
    sectionConfig.columns ||
    Math.min(
      Math.max(sectionConfig.min_columns || 1, count || 0),
      sectionConfig.max_columns || 1,
    )
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
