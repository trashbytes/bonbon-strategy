// Builders / helpers ausgelagert für Modularisierung
export function createButton(e, entities, states, styles) {
  if (typeof e === 'string' && entities[e]) {
    e = entities[e];
  }
  const isMeasurement =
    states[e.entity_id]?.attributes?.unit_of_measurement != null;
  const isToggle =
    e.entity_id.startsWith('light.') || e.entity_id.startsWith('switch.');
  const isBinary = e.entity_id.startsWith('binary_sensor.');
  const opts = {
    card_type: 'button',
    entity: e.entity_id,
    show_state: true,
    show_last_changed: isToggle,
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
  sub_button = false,
  styles = undefined,
) {
  const card = {
    type: 'custom:bubble-card',
    card_type: 'separator',
    name: name,
    icon: icon,
    sub_button: sub_button,
  };
  if (styles) card.styles = styles;
  return card;
}

export function resolveColumns(sectionConfig, count) {
  return (
    sectionConfig.columns ||
    Math.min(
      Math.max(sectionConfig.min_columns || 1, count),
      sectionConfig.max_columns || 1,
    )
  );
}

export function createGrid(cardsArray, sectionConfig, count, square = false) {
  return {
    type: 'grid',
    columns: resolveColumns(sectionConfig, count),
    square: square,
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
