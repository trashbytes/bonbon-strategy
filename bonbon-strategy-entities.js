function getLightRank(e) {
  if (e.labels?.includes('mainlight') || e.labels?.includes('bonbon_mainlight'))
    return 1;
  if (
    e.labels?.includes('nightlight') ||
    e.labels?.includes('bonbon_nightlight')
  )
    return 3;
  return 2;
}

function isHiddenEntity(e) {
  return (
    e?.hidden ||
    !!(
      e?.labels &&
      (e.labels.includes('hidden') || e.labels.includes('bonbon_hidden'))
    )
  );
}

function isUserEntity(e) {
  return !e?.entity_category;
}

function getOrderLabelNumber(entity) {
  const labels = entity.labels || [];
  const orderLabel = labels.find((label) =>
    /^bonbon_order_\d+$|^order_\d+$/.test(label),
  );
  if (orderLabel) {
    const match = orderLabel.match(/order_(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  return Infinity;
}

function getEntityDisplayName(entity, states) {
  return (
    entity?.name ||
    states?.[entity?.entity_id]?.attributes?.friendly_name ||
    entity?.entity_id
  );
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
  const lights = Object.values(entities).filter((e) => {
    const isLight = isEntityType(e, 'light.');
    const device = devices[e.device_id];
    const area_id = e.area_id || device?.area_id;
    const area = areas[area_id];
    const onFloor = area?.floor_id == floor.floor_id;
    return isLight && isUserEntity(e) && onFloor && !isHiddenEntity(e);
  });
  let result = sortLights(lights, {});
  result = sortEntities(result, {});
  return result;
}

export function sortLights(list, states) {
  return (list || []).sort((a, b) => {
    const rankA = getLightRank(a);
    const rankB = getLightRank(b);
    return rankA - rankB;
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
    const nameA = getEntityDisplayName(a, states);
    const nameB = getEntityDisplayName(b, states);
    return nameA.localeCompare(nameB);
  });
}

export function sortEntities(list, states) {
  const ordered = [];
  const unordered = [];

  (list || []).forEach((entity) => {
    if (getOrderLabelNumber(entity) !== Infinity) {
      ordered.push(entity);
    } else {
      unordered.push(entity);
    }
  });

  ordered.sort((a, b) => {
    return getOrderLabelNumber(a) - getOrderLabelNumber(b);
  });

  sortByName(unordered, states);

  return [...ordered, ...unordered];
}

export function findFirstEntityByPrefix(entities, prefix) {
  return (
    Object.values(entities).find((e) => e.entity_id.startsWith(prefix))
      ?.entity_id || false
  );
}
