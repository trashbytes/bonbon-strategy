function hasLabel(entity, devices, labelToCheck) {
  const labels = [labelToCheck, `bonbon_${labelToCheck}`];
  if (entity?.labels?.some((l) => labels.includes(l))) return true;
  if (
    entity?.device_id &&
    devices?.[entity.device_id]?.labels?.some((l) => labels.includes(l))
  )
    return true;
  return false;
}

function getLightRank(e, devices) {
  if (hasLabel(e, devices, 'mainlight')) return 1;
  if (hasLabel(e, devices, 'nightlight')) return 3;
  return 2;
}

function isHiddenEntity(e, devices) {
  return e?.hidden || hasLabel(e, devices, 'hidden');
}

function isUserEntity(e) {
  return !e?.entity_category;
}

function getOrderLabelNumber(entity, devices) {
  const allLabels = [];
  if (entity?.labels) allLabels.push(...entity.labels);
  if (entity?.device_id && devices?.[entity.device_id]?.labels) {
    allLabels.push(...devices[entity.device_id].labels);
  }

  const orderLabel = allLabels.find((label) =>
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

export function getNightlights(entities, devices) {
  return Object.values(entities).filter((e) => {
    return (
      isEntityType(e, 'light.') &&
      hasLabel(e, devices, 'nightlight') &&
      isUserEntity(e) &&
      !isHiddenEntity(e, devices)
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
    return isLight && isUserEntity(e) && onFloor && !isHiddenEntity(e, devices);
  });
  let result = sortByName(lights, {});
  result = sortLights(result, devices);
  result = sortEntities(result, devices);
  return result;
}

export function sortLights(list, devices) {
  return (list || []).sort((a, b) => {
    const rankA = getLightRank(a, devices);
    const rankB = getLightRank(b, devices);
    return rankA - rankB;
  });
}

export function getVisiblePersons(entities, devices) {
  return Object.values(entities).filter(
    (e) =>
      isEntityType(e, 'person.') &&
      !isHiddenEntity(e, devices) &&
      isUserEntity(e),
  );
}

export function getFavorites(entities, devices) {
  return Object.values(entities).filter((e) => {
    const isFavorite = hasLabel(e, devices, 'favorite');
    return isFavorite && isUserEntity(e) && !isHiddenEntity(e, devices);
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
    if (!isUserEntity(e) || isHiddenEntity(e, devices)) return false;
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

export function sortEntities(list, devices, states) {
  const groups = {};
  (list || []).forEach((entity) => {
    const devId = entity.device_id || '__no_device__';
    if (!groups[devId]) groups[devId] = [];
    groups[devId].push(entity);
  });
  Object.keys(groups).forEach((devId) => {
    groups[devId] = sortByName(groups[devId], states || {});
  });
  const groupEntries = Object.keys(groups).map((devId) => ({
    devId,
    device: devices?.[devId] || null,
    entities: groups[devId],
  }));

  groupEntries.sort((a, b) => {
    const orderA = getOrderLabelNumber(a.device, devices);
    const orderB = getOrderLabelNumber(b.device, devices);
    if (orderA !== orderB) return orderA - orderB;
    const firstA =
      a.entities && a.entities.length
        ? getEntityDisplayName(a.entities[0], states || {})
        : '';
    const firstB =
      b.entities && b.entities.length
        ? getEntityDisplayName(b.entities[0], states || {})
        : '';
    return firstA.localeCompare(firstB);
  });

  return groupEntries.flatMap((g) => g.entities);
}

export function findFirstEntityByPrefix(entities, prefix) {
  return (
    Object.values(entities).find((e) => e.entity_id.startsWith(prefix))
      ?.entity_id || false
  );
}

export function getEntitiesByDeviceId(entities, device_id, devices) {
  return Object.values(entities).filter(
    (e) =>
      e.device_id === device_id &&
      isUserEntity(e) &&
      !isHiddenEntity(e, devices),
  );
}
