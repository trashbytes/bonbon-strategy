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

function isEntityCategory(
  entity,
  sensors = true,
  config = false,
  diagnostic = false,
) {
  return (
    (sensors && !entity.entity_category) ||
    (config && entity.entity_category == 'config') ||
    (diagnostic && entity.entity_category == 'diagnostic')
  );
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

export function resolveEntities(
  c,
  includeSensors = true,
  includeConfig = false,
  includeDiagnostic = false,
) {
  return sortEntities(
    (Array.isArray(c) ? c : [c])
      .map(function (c) {
        if (c) {
          const elements = [];
          if (typeof c === 'string') {
            const attrFilterMatch = c.match(/(.*)\[([^\]]+)\]$/);
            let attrFilter;
            if (attrFilterMatch) {
              c = attrFilterMatch[1].trim();
              if (!c) c = '*';
              const inside = attrFilterMatch[2].trim();
              const m = inside.match(
                /^([a-zA-Z0-9_-]+)\s*(\*=|\^=|\$=|=)\s*(?:"([^"]+)"|'([^']+)'|(.+))$/,
              );
              if (m) {
                const key = m[1];
                const operator = m[2];
                const value = (m[3] || m[4] || m[5] || '').trim();
                attrFilter = { key, operator, value };
              } else {
                attrFilter = {
                  key: 'device_class',
                  operator: '*=',
                  value: inside,
                };
              }
            }

            const getAttributeValue = (entity, key) => {
              if (!entity) return undefined;
              if (key === 'name') return getEntityDisplayName({ entity });
              const attrFromEntity = entity[key];
              if (attrFromEntity !== undefined) return attrFromEntity;
              const stateAttr =
                window._bonbon.states?.[entity.entity_id]?.attributes?.[key];
              if (stateAttr !== undefined) return stateAttr;
              return entity[key];
            };

            const matchesAttribute = (entity) => {
              if (!attrFilter) return true;
              const { key, operator, value } = attrFilter;
              const attr = getAttributeValue(entity, key);
              if (attr === undefined || attr === null) return false;
              const a = String(attr).toLowerCase();
              const v = String(value).toLowerCase();
              if (operator === '=') return a === v;
              if (operator === '*=') return a.includes(v);
              if (operator === '^=') return a.startsWith(v);
              if (operator === '$=') return a.endsWith(v);
              return false;
            };

            if (c.includes('*')) {
              const esc = (s) => s.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
              const pattern = '^' + c.split('*').map(esc).join('.*') + '$';
              const re = new RegExp(pattern);
              Object.values(window._bonbon.entities || {})
                .filter((e) => re.test(e.entity_id))
                .forEach((e) => {
                  if (
                    isEntityCategory(
                      e,
                      includeSensors,
                      includeConfig,
                      includeDiagnostic,
                    ) &&
                    !isHidden(e) &&
                    matchesAttribute(e)
                  ) {
                    elements.push({ entity: e });
                  }
                });
            } else {
              if (
                window._bonbon.entities?.[c] &&
                isEntityCategory(
                  window._bonbon.entities?.[c],
                  includeSensors,
                  includeConfig,
                  includeDiagnostic,
                ) &&
                !isHidden(window._bonbon.entities?.[c]) &&
                matchesAttribute(window._bonbon.entities?.[c])
              ) {
                elements.push({ entity: window._bonbon.entities?.[c] });
              }
              if (window._bonbon.devices?.[c]) {
                Object.values(window._bonbon.entities || {}).forEach((e) => {
                  if (
                    e.device_id === c &&
                    isEntityCategory(
                      e,
                      includeSensors,
                      includeConfig,
                      includeDiagnostic,
                    ) &&
                    !isHidden(e) &&
                    matchesAttribute(e)
                  ) {
                    elements.push({ entity: e });
                  }
                });
              }
              if (window._bonbon.labels?.[c]) {
                window._bonbon.labels[c].forEach((e) => {
                  if (
                    isEntityCategory(
                      e,
                      includeSensors,
                      includeConfig,
                      includeDiagnostic,
                    ) &&
                    !isHidden(e) &&
                    matchesAttribute(e)
                  ) {
                    elements.push({ entity: e });
                  }
                });
              }
              if (window._bonbon.labels?.['bonbon_' + c]) {
                window._bonbon.labels['bonbon_' + c].forEach((e) => {
                  if (
                    isEntityCategory(
                      e,
                      includeSensors,
                      includeConfig,
                      includeDiagnostic,
                    ) &&
                    !isHidden(e) &&
                    matchesAttribute(e)
                  ) {
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
  // if (c && area) {
  //   const inArea =
  //     c.entity?.area_id === (area.area_id || area) ||
  //     c.object?.area_id === (area.area_id || area);
  //   const device = window._bonbon.devices[c.entity?.device_id];
  //   const deviceInArea = device && device.area_id === (area.area_id || area);
  //   return inArea || deviceInArea;
  // }
  return (
    c.entity?.area_id === (area?.area_id || area) ||
    c.object?.area_id === (area?.area_id || area)
  );
  return false;
}

export function onFloor(c, floor) {
  // if (c && floor) {
  //   const onFloor =
  //     c.entity?.floor_id === (floor.floor_id || floor) ||
  //     c.object?.floor_id === (floor.floor_id || floor);
  //   const areasOnFloor = Object.values(window._bonbon.areas).filter((area) => {
  //     return area.floor_id == (floor.floor_id || floor);
  //   });
  //   return onFloor || areasOnFloor.some((area) => inArea(c, area));
  // }
  return (
    c.entity?.floor_id === (floor?.floor_id || floor) ||
    c.object?.floor_id === (floor?.floor_id || floor)
  );
  return false;
}
