function hasLabel(entity, labelToCheck) {
  const labels = [labelToCheck, `bonbon_${labelToCheck}`];
  if (entity?.labels?.some((l) => labels.includes(l))) return true;
  if (
    entity?.device_id &&
    window._bonbon.devices?.[entity.device_id]?.labels?.some((l) =>
      labels.includes(l),
    )
  )
    return true;
  return false;
}

function getLightRank(e) {
  if (hasLabel(e, 'mainlight')) return 1;
  if (hasLabel(e, 'nightlight')) return 3;
  return 2;
}

function isHiddenEntity(e) {
  return e?.hidden || hasLabel(e, 'hidden');
}

function isUserEntity(e) {
  return !e?.entity_category;
}

function getOrderLabelNumber(entity) {
  const allLabels = [];
  if (entity?.labels) allLabels.push(...entity.labels);
  if (entity?.device_id && window._bonbon.devices?.[entity.device_id]?.labels) {
    allLabels.push(...window._bonbon.devices[entity.device_id].labels);
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

function getEntityDisplayName(entity) {
  return (
    entity?.name ||
    window._bonbon.states?.[entity?.entity_id]?.attributes?.friendly_name ||
    entity?.entity_id ||
    ''
  );
}

export function isEntityType(e, prefix) {
  return !!(e?.entity_id && e.entity_id.startsWith(prefix));
}

export function getNightlights() {
  return Object.values(window._bonbon.entities || {}).filter((e) => {
    return (
      isEntityType(e, 'light.') &&
      hasLabel(e, 'nightlight') &&
      isUserEntity(e) &&
      !isHiddenEntity(e)
    );
  });
}

export function getLightsOnFloor(floor) {
  const lights = Object.values(window._bonbon.entities || {}).filter((e) => {
    const isLight = isEntityType(e, 'light.');
    const device = window._bonbon.devices?.[e.device_id];
    const area_id = e.area_id || device?.area_id;
    const area = window._bonbon.areas[area_id];
    const onFloor = area?.floor_id == floor.floor_id;
    return isLight && isUserEntity(e) && onFloor && !isHiddenEntity(e);
  });
  let result = sortByName(lights, {});
  result = sortLights(result);
  result = sortEntities(result);
  return result;
}

export function sortLights(list) {
  return (list || []).sort((a, b) => {
    const rankA = getLightRank(a);
    const rankB = getLightRank(b);
    return rankA - rankB;
  });
}

export function getVisiblePersons() {
  return Object.values(window._bonbon.entities || {}).filter(
    (e) => isEntityType(e, 'person.') && !isHiddenEntity(e) && isUserEntity(e),
  );
}

export function getFavorites() {
  return Object.values(window._bonbon.entities || {}).filter((e) => {
    const isFavorite = hasLabel(e, 'favorite');
    return isFavorite && isUserEntity(e) && !isHiddenEntity(e);
  });
}

export function filterEntitiesInArea(predicate, area) {
  const area_id = area?.area_id;
  const categorizedEntityIds = area?.categorizedEntityIds;
  return Object.values(window._bonbon.entities || {}).filter((e) => {
    const inArea = e.area_id === area_id;
    const device = window._bonbon.devices?.[e.device_id];
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

export function sortByName(list) {
  return (list || []).sort((a, b) => {
    const nameA = getEntityDisplayName(a);
    const nameB = getEntityDisplayName(b);
    return nameA.localeCompare(nameB);
  });
}

export function sortEntities(list) {
  const withOrder = [];
  const withoutOrder = [];

  (list || []).forEach((c) => {
    const order = c.bonbon_order || c.order || getOrderLabelNumber(c);
    if (order !== Infinity) {
      withOrder.push(c);
    } else {
      withoutOrder.push(c);
    }
  });
  withOrder.sort((a, b) => {
    const orderA = a.bonbon_order || a.order || getOrderLabelNumber(a);
    const orderB = b.bonbon_order || b.order || getOrderLabelNumber(b);
    return orderA - orderB;
  });
  const groups = {};
  withoutOrder.forEach((c) => {
    const devId = c.device_id || '__no_device__';
    if (!groups[devId]) groups[devId] = [];
    groups[devId].push(c);
  });

  Object.keys(groups).forEach((devId) => {
    groups[devId] = sortByName(groups[devId]);
  });
  const groupEntries = Object.keys(groups).map((devId) => ({
    devId,
    device: window._bonbon.devices?.[devId] || null,
    entities: groups[devId],
  }));
  groupEntries.sort((a, b) => {
    const firstA =
      a.entities && a.entities.length
        ? getEntityDisplayName(a.entities[0])
        : '';
    const firstB =
      b.entities && b.entities.length
        ? getEntityDisplayName(b.entities[0])
        : '';
    return firstA.localeCompare(firstB);
  });
  const groupedEntities = groupEntries.flatMap((g) => g.entities);
  return [...withOrder, ...groupedEntities];
}

export function findFirstEntityByPrefix(prefix) {
  return (
    Object.values(window._bonbon.entities || {}).find((e) =>
      e.entity_id.startsWith(prefix),
    )?.entity_id || false
  );
}

export function getEntitiesByDeviceId(device_id) {
  return Object.values(window._bonbon.entities || {}).filter(
    (e) => e.device_id === device_id && isUserEntity(e) && !isHiddenEntity(e),
  );
}

export function resolveEntities(c) {
  return (Array.isArray(c) ? c : [c])
    .map(function (c) {
      if (c !== null && typeof c === 'object') {
        return c;
      }
      if (typeof c === 'string') {
        if (c.includes('*')) {
          const esc = (s) => s.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
          const pattern = '^' + c.split('*').map(esc).join('.*') + '$';
          const re = new RegExp(pattern);
          return Object.values(window._bonbon.entities || {}).filter((e) =>
            re.test(e.entity_id),
          );
        }
        if (window._bonbon.entities?.[c]) return window._bonbon.entities[c];
        if (window._bonbon.devices?.[c]) return getEntitiesByDeviceId(c);
        if (window._bonbon.labels?.[c]) return window._bonbon.labels[c];
      }
      return false;
    })
    .flat()
    .filter((c) => c);
}
