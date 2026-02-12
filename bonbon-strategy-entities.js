export function hasLabel(entity, label) {
  const labels = [label, `bonbon_${label}`];
  if (entity.labels?.some((l) => labels.includes(l))) return true;
  if (
    entity.device_id &&
    window._bonbon.devices?.[entity.device_id]?.labels?.some((l) =>
      labels.includes(l),
    )
  )
    return true;
  return false;
}

function isHidden(entity) {
  return entity.hidden || hasLabel(entity, 'hidden');
}

function isUserFacing(entity) {
  return !entity.entity_category;
}

function getOrderNumber(c) {
  const allLabels = [];
  if (c?.object?.bonbon_order || c?.object?.order) {
    allLabels.push(
      'order_' + parseInt(c?.object?.bonbon_order || c?.object?.order),
    );
  }
  if (c?.entity?.labels) {
    allLabels.push(...c.entity.labels);
  }
  if (
    c?.entity?.device_id &&
    window._bonbon.devices?.[c?.entity.device_id]?.labels
  ) {
    allLabels.push(...window._bonbon.devices[c?.entity.device_id].labels);
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

function getEntityDisplayName(c) {
  const name =
    c?.entity?.name ||
    window._bonbon.states?.[c?.entity?.entity_id]?.attributes?.friendly_name ||
    c?.entity?.entity_id ||
    '';
  return name;
}

export function isEntityType(c, domain, suffix) {
  if (!c?.entity?.entity_id) return false;
  const prefix = (domain || '').endsWith('.') ? domain : (domain || '') + '.';
  if (!c.entity.entity_id.startsWith(prefix)) return false;
  if (suffix) return c.entity.entity_id.endsWith(suffix);
  return true;
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
    const order = getOrderNumber(c);
    if (order !== Infinity) {
      withOrder.push(c);
    } else {
      withoutOrder.push(c);
    }
  });
  withOrder.sort((a, b) => {
    const orderA = getOrderNumber(a);
    const orderB = getOrderNumber(b);
    return orderA - orderB;
  });
  const groups = {};
  withoutOrder.forEach((c) => {
    const devId = c.entity?.device_id || '__no_device__';
    if (!groups[devId]) groups[devId] = [];
    groups[devId].push(c);
  });

  Object.keys(groups).forEach((devId) => {
    groups[devId] = sortByName(groups[devId]);
  });
  const groupEntries = Object.keys(groups).map((devId) => ({
    devId,
    device: window._bonbon.devices?.[devId] || null,
    objects: groups[devId],
  }));
  groupEntries.sort((a, b) => {
    const firstA =
      a.objects && a.objects.length ? getEntityDisplayName(a.objects[0]) : '';
    const firstB =
      b.objects && b.objects.length ? getEntityDisplayName(b.objects[0]) : '';
    return firstA.localeCompare(firstB);
  });
  const groupedObjects = groupEntries.flatMap((g) => g.objects);
  return [...withOrder, ...groupedObjects];
}

export function resolveEntities(c) {
  return sortEntities(
    (Array.isArray(c) ? c : [c])
      .map(function (c) {
        if (c) {
          const elements = [];
          if (typeof c === 'string') {
            if (c.includes('*')) {
              const esc = (s) => s.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
              const pattern = '^' + c.split('*').map(esc).join('.*') + '$';
              const re = new RegExp(pattern);
              Object.values(window._bonbon.entities || {})
                .filter((e) => re.test(e.entity_id))
                .forEach((e) => {
                  if (isUserFacing(e) && !isHidden(e)) {
                    elements.push({ entity: e });
                  }
                });
            } else {
              if (
                window._bonbon.entities?.[c] &&
                isUserFacing(window._bonbon.entities?.[c]) &&
                !isHidden(window._bonbon.entities?.[c])
              ) {
                elements.push({ entity: window._bonbon.entities?.[c] });
              }
              if (window._bonbon.devices?.[c]) {
                Object.values(window._bonbon.entities || {}).forEach((e) => {
                  if (e.device_id === c && isUserFacing(e) && !isHidden(e)) {
                    elements.push({ entity: e });
                  }
                });
              }
              if (window._bonbon.labels?.[c]) {
                window._bonbon.labels[c].forEach((e) => {
                  if (isUserFacing(e) && !isHidden(e)) {
                    elements.push({ entity: e });
                  }
                });
              }
              if (window._bonbon.labels?.['bonbon_' + c]) {
                window._bonbon.labels['bonbon_' + c].forEach((e) => {
                  if (isUserFacing(e) && !isHidden(e)) {
                    elements.push({ entity: e });
                  }
                });
              }
            }
          } else if (
            (c.entity_id || c.entity) &&
            (window._bonbon.entities[c.entity_id] ||
              window._bonbon.entities[c.entity])
          ) {
            elements.push({
              entity:
                window._bonbon.entities[c.entity_id] ||
                window._bonbon.entities[c.entity],
              object: c,
            });
          } else {
            elements.push({
              object: c,
            });
          }
          return elements;
        }
      })
      .flat()
      .filter((c) => c),
  );
}

export function resolveEntity(c) {
  return resolveEntities(c)[0];
}

export function inArea(c, area) {
  if (c && area) {
    const inArea =
      c.entity?.area_id === (area.area_id || area) ||
      c.object?.area_id === (area.area_id || area);
    const device = window._bonbon.devices[c.entity?.device_id];
    const deviceInArea = device && device.area_id === (area.area_id || area);
    return inArea || deviceInArea;
  }
  return false;
}

export function onFloor(c, floor) {
  if (c && floor) {
    const areasOnFloor = Object.values(window._bonbon.areas).filter((area) => {
      return area.floor_id == (floor.floor_id || floor);
    });
    return areasOnFloor.some((area) => inArea(c, area));
  }
  return false;
}
