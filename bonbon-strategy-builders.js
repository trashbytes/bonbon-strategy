// Builders / helpers ausgelagert für Modularisierung
export function getLightRank(e) {
  if (e.labels?.includes('mainlight') || e.labels?.includes('bonbon_mainlight'))
    return 1;
  if (
    e.labels?.includes('nightlight') ||
    e.labels?.includes('bonbon_nightlight')
  )
    return 3;
  return 2;
}

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

export function getAreaColors(area, index, areas, isDark) {
  if (area.floor_id == null) {
    area.floor_id = '_areas';
  }
  const seed = area.area_id + String(index) + area.name;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash % areas.length);

  const hue = (colorIndex * (360 / areas.length)) % 360;
  const saturation = isDark ? 20 : 40;
  const lightness = isDark ? 40 : 77;

  const lightColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const reglrColor = `hsl(${hue}, ${saturation}%, ${lightness - 5}%)`;
  const shadeColor = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;

  return { lightColor, reglrColor, shadeColor };
}

export function isHiddenEntity(e) {
  return (
    e?.hidden ||
    !!(
      e?.labels &&
      (e.labels.includes('hidden') || e.labels.includes('bonbon_hidden'))
    )
  );
}

export function isUserEntity(e) {
  return !e?.entity_category;
}

export function isEntityType(e, prefix) {
  return !!(e?.entity_id && e.entity_id.startsWith(prefix));
}

export function getNightlights(entities) {
  return Object.values(entities).filter((e) => {
    return (
      isEntityType(e, 'light.') &&
      (e.labels?.includes('nightlight') ||
        e.labels?.includes('bonbon_nightlight')) &&
      isUserEntity(e) &&
      !isHiddenEntity(e)
    );
  });
}

export function getLightsOnFloor(entities, floor, areas, devices) {
  return Object.values(entities)
    .filter((e) => {
      const isLight = isEntityType(e, 'light.');
      const device = devices[e.device_id];
      const area_id = e.area_id || device?.area_id;
      const area = areas[area_id];
      const onFloor = area?.floor_id == floor.floor_id;
      return isLight && isUserEntity(e) && onFloor && !isHiddenEntity(e);
    })
    .sort((eA, eB) => {
      const rankA = getLightRank(eA);
      const rankB = getLightRank(eB);
      if (rankA !== rankB) return rankA - rankB;
      const nameA = eA.name || eA.entity_id;
      const nameB = eB.name || eB.entity_id;
      return nameA.localeCompare(nameB);
    });
}

export function sortByNameWithRank(list, states) {
  return (list || []).sort((a, b) => {
    const rankA = getLightRank(a);
    const rankB = getLightRank(b);
    if (rankA !== rankB) return rankA - rankB;
    const nameA =
      a.name || states[a.entity_id]?.attributes?.friendly_name || a.entity_id;
    const nameB =
      b.name || states[b.entity_id]?.attributes?.friendly_name || b.entity_id;
    return nameA.localeCompare(nameB);
  });
}

export function getVisiblePersons(entities) {
  return Object.values(entities).filter(
    (e) => isEntityType(e, 'person.') && !isHiddenEntity(e) && isUserEntity(e),
  );
}

export function getFavorites(entities) {
  return Object.values(entities).filter((e) => {
    const isFavorite =
      e.labels?.includes('favorite') || e.labels?.includes('bonbon_favorite');
    return isFavorite && isUserEntity(e) && !isHiddenEntity(e);
  });
}

export function filterEntitiesInArea(
  entities,
  predicate,
  area_id,
  devices,
  categorizedEntityIds,
) {
  return Object.values(entities).filter((e) => {
    const inArea = e.area_id === area_id;
    const device = devices[e.device_id];
    const deviceInArea = device && device.area_id === area_id;
    if (!predicate(e)) return false;
    if (!isUserEntity(e) || isHiddenEntity(e)) return false;
    if (!(inArea || deviceInArea)) return false;
    if (categorizedEntityIds && categorizedEntityIds.includes(e.entity_id))
      return false;
    if (categorizedEntityIds) categorizedEntityIds.push(e.entity_id);
    return true;
  });
}

export function sortByName(list, states) {
  return (list || []).sort((a, b) => {
    const nameA =
      a.name || states[a.entity_id]?.attributes?.friendly_name || a.entity_id;
    const nameB =
      b.name || states[b.entity_id]?.attributes?.friendly_name || b.entity_id;
    return nameA.localeCompare(nameB);
  });
}

export function findFirstEntityByPrefix(entities, prefix) {
  return (
    Object.values(entities).find((e) => e.entity_id.startsWith(prefix))
      ?.entity_id || false
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
