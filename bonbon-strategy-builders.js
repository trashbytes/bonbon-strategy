export function createButton(e, styles) {
  if (typeof e === 'string' && window.__bonbon.entities[e]) {
    e = window.__bonbon.entities[e];
  }
  const isMeasurement =
    window.__bonbon.states[e?.entity_id]?.attributes?.unit_of_measurement !=
    null;
  const isToggle =
    e?.entity_id?.startsWith('light.') || e?.entity_id?.startsWith('switch.');
  const isBinary = e?.entity_id?.startsWith('binary_sensor.');
  const opts = {
    card_type: 'button',
    entity: e?.entity_id,
    show_state: true,
    show_last_changed: isToggle || isBinary,
    use_accent_color: true,
    tap_action: { action: 'none' },
    button_action: {
      tap_action: { action: isToggle ? 'toggle' : 'more-info' },
    },
  };
  const mergedStyles = isToggle || isBinary ? '' : styles.bubbleButtonNonBinary;
  return createBubbleCard(opts, mergedStyles);
}

export function createSeparatorCard(
  name,
  icon,
  groups = false,
  styles = undefined,
) {
  const card = {
    type: 'custom:bubble-card',
    card_type: 'separator',
    name: name,
    icon: icon,
    sub_button: { main: groups.map((g) => ({ group: g })) },
  };
  if (styles) card.styles = styles;
  return card;
}

export function createSubButton(c, attribute = false, icon = false) {
  if (c.object) {
    return c.object;
  }
  const isToggle =
    c?.entity?.entity_id.startsWith('light.') ||
    c?.entity?.entity_id.startsWith('switch.');
  return {
    entity: c?.entity.entity_id,
    show_background: isToggle,
    show_state: !isToggle && !attribute,
    ...(attribute && { show_attribute: true, attribute: attribute }),
    ...(icon && { icon: icon }),
    tap_action: { action: isToggle ? 'toggle' : 'more-info' },
  };
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

export function createBubbleCard(options = {}, styles = {}) {
  const base = {
    type: 'custom:bubble-card',
    card_type: options.card_type || 'button',
    entity: options.entity,
    show_state: options.show_state ?? true,
    show_last_changed: options.show_last_changed ?? false,
    use_accent_color: options.use_accent_color ?? true,
    tap_action: options.tap_action ?? { action: 'none' },
  };
  const merged = { ...base, ...options };
  if (merged.styles === undefined && styles) merged.styles = styles;
  return merged;
}
