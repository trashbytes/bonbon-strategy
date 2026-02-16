export function hasLabel(entity, label) {
  const labels = [label, `bonbon_${label}`];
  if (entity.labels?.some((l) => labels.includes(l))) return true;
  if (
    entity.device_id &&
    window.__bonbon.devices?.[entity.device_id]?.labels?.some((l) =>
      labels.includes(l),
    )
  )
    return true;
  return false;
}

function isHidden(entity) {
  return entity.hidden || hasLabel(entity, 'hidden');
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
    window.__bonbon.devices?.[c?.entity.device_id]?.labels
  ) {
    allLabels.push(...window.__bonbon.devices[c?.entity.device_id].labels);
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
    window.__bonbon.states?.[c?.entity?.entity_id]?.attributes?.friendly_name ||
    c?.entity?.name ||
    c?.entity?.entity_id ||
    '';
  return name;
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
    device: window.__bonbon.devices?.[devId] || null,
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
            const selector = c;
            let excludedEntity_ids = new Set();

            if (c.includes(':not(')) {
              const notMatch = c.match(/^(.*):not\(([^)]+)\)$/);
              if (notMatch) {
                c = notMatch[1].trim();
                const notSelector = notMatch[2];
                const excludedElements = resolveEntities(notSelector);
                excludedEntity_ids = new Set(
                  excludedElements
                    .map((e) => e.entity?.entity_id)
                    .filter(Boolean),
                );
              }
            }

            const attrFilters = [];
            const attrFilterMatches = c.match(/\[([^\]]+)\]/g);
            if (attrFilterMatches) {
              c = c.replace(/\[([^\]]+)\]/g, '').trim();
              if (!c) c = '*';
              attrFilterMatches.forEach((match) => {
                const inside = match.slice(1, -1).trim();
                const m = inside.match(
                  /^([a-zA-Z0-9_-]+)\s*(\*=|\^=|\$=|=)\s*(?:"([^"]+)"|'([^']+)'|\*|(.+))$/,
                );
                if (m) {
                  const key = m[1];
                  const operator = m[2];
                  const valueStr = (m[3] || m[4] || m[5] || '').trim();
                  if (operator === '=' && !valueStr) {
                    attrFilters.push({
                      key,
                      operator: 'exists-any',
                      values: [],
                    });
                  } else {
                    const values = valueStr.split('|').map((v) => v.trim());
                    attrFilters.push({ key, operator, values });
                  }
                } else if (/^[a-zA-Z0-9_-]+$/.test(inside)) {
                  attrFilters.push({
                    key: inside,
                    operator: 'exists-truthy',
                    values: [],
                  });
                }
              });
            }

            const getAttributeValue = (entity, key) => {
              if (!entity) return undefined;
              if (key === 'name' || key === 'friendly_name')
                return getEntityDisplayName({ entity });
              const attrFromEntity = entity[key];
              if (attrFromEntity !== undefined) return attrFromEntity;
              const stateAttr =
                window.__bonbon.states?.[entity.entity_id]?.attributes?.[key];
              if (stateAttr !== undefined) return stateAttr;
              return entity[key];
            };

            const hasAttribute = (entity, key) => {
              if (!entity) return false;
              if (key === 'name' || key === 'friendly_name') return true;
              if (Object.prototype.hasOwnProperty.call(entity, key))
                return true;
              const stateAttrs =
                window.__bonbon.states?.[entity.entity_id]?.attributes;
              if (
                stateAttrs &&
                Object.prototype.hasOwnProperty.call(stateAttrs, key)
              )
                return true;
              return false;
            };

            const matchValue = (actualValue, operator, allowedValues) => {
              const a = String(actualValue).toLowerCase();
              return allowedValues.some((v) => {
                const val = String(v).toLowerCase();
                if (operator === '=') return a === val;
                if (operator === '*=') return a.includes(val);
                if (operator === '^=') return a.startsWith(val);
                if (operator === '$=') return a.endsWith(val);
                return false;
              });
            };

            const isTruthy = (value) => {
              if (Array.isArray(value)) {
                return value.length > 0;
              }
              return !!value;
            };

            const matchesAttributes = (entity) => {
              return attrFilters.every((attrFilter) => {
                const { key, operator, values } = attrFilter;
                if (operator === 'exists-truthy') {
                  const attr = getAttributeValue(entity, key);
                  return isTruthy(attr);
                }
                if (operator === 'exists-any') {
                  return hasAttribute(entity, key);
                }
                const attr = getAttributeValue(entity, key);
                if (attr === undefined || attr === null) return false;
                return matchValue(attr, operator, values);
              });
            };

            const checkEntityCategory = (entity) => {
              const hasEntityCategoryFilter = attrFilters.some(
                (f) => f.key === 'entity_category',
              );
              if (!hasEntityCategoryFilter) return !entity.entity_category;

              const entityCategory = entity.entity_category || 'sensor';
              return attrFilters
                .filter((f) => f.key === 'entity_category')
                .every((f) => matchValue(entityCategory, f.operator, f.values));
            };

            const checkHidden = (entity) => {
              const hasHiddenFilter = attrFilters.some(
                (f) => f.key === 'hidden',
              );
              if (!hasHiddenFilter) return !isHidden(entity);

              return attrFilters
                .filter((f) => f.key === 'hidden')
                .every((f) => {
                  if (f.operator === 'exists-truthy') return isHidden(entity);
                  if (f.operator === 'exists-any') return true;
                  return matchValue(
                    String(isHidden(entity)),
                    f.operator,
                    f.values,
                  );
                });
            };

            const getOtherFilters = () =>
              attrFilters.filter(
                (f) => f.key !== 'entity_category' && f.key !== 'hidden',
              );

            const checkOtherAttributes = (entity) => {
              const otherFilters = getOtherFilters();
              return (
                otherFilters.length === 0 ||
                otherFilters.every((f) => {
                  const { key, operator, values } = f;
                  if (operator === 'exists-truthy') {
                    const attr = getAttributeValue(entity, key);
                    return isTruthy(attr);
                  }
                  if (operator === 'exists-any')
                    return hasAttribute(entity, key);
                  const attr = getAttributeValue(entity, key);
                  if (attr === undefined || attr === null) return false;
                  return matchValue(attr, operator, values);
                })
              );
            };

            if (c.includes('*')) {
              const esc = (s) => s.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
              const pattern = '^' + c.split('*').map(esc).join('.*') + '$';
              const re = new RegExp(pattern);
              Object.values(window.__bonbon.entities || {})
                .filter((e) => re.test(e.entity_id))
                .forEach((e) => {
                  if (
                    !excludedEntity_ids.has(e.entity_id) &&
                    checkEntityCategory(e) &&
                    checkHidden(e) &&
                    checkOtherAttributes(e)
                  ) {
                    elements.push({ selector: selector, entity: e });
                  }
                });
            } else {
              if (window.__bonbon.entities?.[c]) {
                const e = window.__bonbon.entities?.[c];
                if (
                  !excludedEntity_ids.has(c) &&
                  checkEntityCategory(e) &&
                  checkHidden(e) &&
                  checkOtherAttributes(e)
                ) {
                  elements.push({ selector: selector, entity: e });
                }
              }
              if (window.__bonbon.devices?.[c]) {
                Object.values(window.__bonbon.entities || {}).forEach((e) => {
                  if (
                    e.device_id === c &&
                    !excludedEntity_ids.has(e.entity_id) &&
                    checkEntityCategory(e) &&
                    checkHidden(e) &&
                    checkOtherAttributes(e)
                  ) {
                    elements.push({ selector: selector, entity: e });
                  }
                });
              }
              if (window.__bonbon.labels?.[c]) {
                window.__bonbon.labels[c].forEach((e) => {
                  if (
                    !excludedEntity_ids.has(e.entity_id) &&
                    checkEntityCategory(e) &&
                    checkHidden(e) &&
                    checkOtherAttributes(e)
                  ) {
                    elements.push({ selector: selector, entity: e });
                  }
                });
              }
              if (window.__bonbon.labels?.['bonbon_' + c]) {
                window.__bonbon.labels['bonbon_' + c].forEach((e) => {
                  if (
                    !excludedEntity_ids.has(e.entity_id) &&
                    checkEntityCategory(e) &&
                    checkHidden(e) &&
                    checkOtherAttributes(e)
                  ) {
                    elements.push({ selector: selector, entity: e });
                  }
                });
              }
            }
          } else if (
            (c.entity_id || c.entity) &&
            (window.__bonbon.entities[c.entity_id] ||
              window.__bonbon.entities[c.entity])
          ) {
            elements.push({
              entity:
                window.__bonbon.entities[c.entity_id] ||
                window.__bonbon.entities[c.entity],
              object: c,
            });
          } else {
            elements.push({ object: c });
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
  const areaId = area?.area_id || area;

  const entityAreaIds = Array.isArray(c.entity?.area_id)
    ? c.entity.area_id
    : c.entity?.area_id
      ? [c.entity.area_id]
      : [];
  if (entityAreaIds.includes(areaId)) return true;

  const objectBonbonAreaIds = Array.isArray(c.object?.bonbon_area_id)
    ? c.object.bonbon_area_id
    : c.object?.bonbon_area_id
      ? [c.object.bonbon_area_id]
      : [];
  if (objectBonbonAreaIds.includes(areaId)) return true;

  const objectAreaIds = Array.isArray(c.object?.area_id)
    ? c.object.area_id
    : c.object?.area_id
      ? [c.object.area_id]
      : [];
  if (objectAreaIds.includes(areaId)) return true;

  return false;
}

export function onFloor(c, floor) {
  const floorId = floor?.floor_id || floor;

  const entityFloorIds = Array.isArray(c.entity?.floor_id)
    ? c.entity.floor_id
    : c.entity?.floor_id
      ? [c.entity.floor_id]
      : [];
  if (entityFloorIds.includes(floorId)) return true;

  const objectBonbonFloorIds = Array.isArray(c.object?.bonbon_floor_id)
    ? c.object.bonbon_floor_id
    : c.object?.bonbon_floor_id
      ? [c.object.bonbon_floor_id]
      : [];
  if (objectBonbonFloorIds.includes(floorId)) return true;

  const objectFloorIds = Array.isArray(c.object?.floor_id)
    ? c.object.floor_id
    : c.object?.floor_id
      ? [c.object.floor_id]
      : [];
  if (objectFloorIds.includes(floorId)) return true;

  return false;
}
