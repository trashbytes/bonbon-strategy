export function createEntityApi(ctx = {}) {
  const context = {
    entities: ctx.entities || {},
    devices: ctx.devices || {},
    states: ctx.states || {},
    labels: ctx.labels || {},
  };

  function getOrderNumber(c, sectionConfig = {}, viewScope = '') {
    const allLabels = [];
    if (c?.object) {
      Object.keys(c.object).forEach((key) => {
        if (key == 'order' || key == 'bonbon_order' || key.startsWith('order_') || key.startsWith('bonbon_order')) {
          allLabels.push(key + '_' + c.object[key]);
        }
      });
    }
    if (c?.entity?.labels) {
      allLabels.push(...c.entity.labels);
    }
    if (c?.entity?.device_id && context.devices?.[c?.entity.device_id]?.labels) {
      allLabels.push(...context.devices[c?.entity.device_id].labels);
    }

    const scopes = ['']
      .concat(
        [
          viewScope ? viewScope + '_' : '',
          sectionConfig?.key ? sectionConfig?.key + '_' : '',
          viewScope && sectionConfig?.key ? viewScope + '_' + sectionConfig?.key + '_' : '',
        ].filter(Boolean),
      )
      .map((scope) => {
        return ['order_' + scope, 'bonbon_order_' + scope];
      })
      .flat();

    let orderLabel = '';

    scopes.forEach((scope) => {
      allLabels.forEach((label) => {
        const suffix = label.slice(scope.length);
        if (label.startsWith(scope) && /^\d+(?:\.\d+)?$/.test(suffix)) {
          orderLabel = label;
        }
      });
    });

    if (orderLabel) {
      const match = orderLabel.match(/(\d+(?:\.\d+)?)$/);
      if (match) return parseFloat(match[1]);
    }
    return Infinity;
  }

  function getEntityDisplayName(c) {
    const name =
      context.states?.[c?.entity?.entity_id]?.attributes?.friendly_name ||
      c?.entity?.name ||
      c?.entity?.entity_id ||
      '';
    return name;
  }

  function sortByName(list) {
    return (list || []).sort((a, b) => {
      const nameA = getEntityDisplayName(a);
      const nameB = getEntityDisplayName(b);
      return nameA.localeCompare(nameB);
    });
  }

  function isHiddenInScope(c, sectionConfig = {}, viewScope = '') {
    const scopes = [
      viewScope ? 'hidden_' + viewScope : '',
      sectionConfig?.key ? 'hidden_' + sectionConfig?.key : '',
      viewScope && sectionConfig?.key ? 'hidden_' + viewScope + '_' + sectionConfig?.key : '',
    ].filter(Boolean);
    return scopes.some((scope) => c?.entity?.hasLabel(scope));
  }

  function sortEntities(list, sectionConfig = {}, viewScope = '') {
    const withOrder = [];
    const withoutOrder = [];

    (list || []).forEach((c) => {
      const order = getOrderNumber(c, sectionConfig, viewScope);
      if (order !== Infinity) {
        withOrder.push(c);
      } else {
        withoutOrder.push(c);
      }
    });
    withOrder.sort((a, b) => {
      const orderA = getOrderNumber(a, sectionConfig, viewScope);
      const orderB = getOrderNumber(b, sectionConfig, viewScope);
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
      device: context.devices?.[devId] || null,
      objects: groups[devId],
    }));
    groupEntries.sort((a, b) => {
      const firstA = a.objects && a.objects.length ? getEntityDisplayName(a.objects[0]) : '';
      const firstB = b.objects && b.objects.length ? getEntityDisplayName(b.objects[0]) : '';
      return firstA.localeCompare(firstB);
    });
    const groupedObjects = groupEntries.flatMap((g) => g.objects);
    return [...withOrder, ...groupedObjects];
  }

  function resolveEntities(c, sectionConfig = {}, viewScope = '', states = null) {
    return sortEntities(
      (Array.isArray(c) ? c : [c])
        .map(function (c) {
          if (c) {
            const elements = [];
            if (typeof c === 'string') {
              const selector = c;
              const hideMatch = c.match(/:hide\(([^)]*)\)/);
              let hide = hideMatch ? hideMatch[1].trim() : '';
              c = c.replace(/:hide\([^)]*\)/g, '').trim();

              let excludedEntity_ids = new Set();

              if (c.includes(':not(')) {
                const notMatch = c.match(/^(.*):not\(([^)]+)\)$/);
                if (notMatch) {
                  c = notMatch[1].trim();
                  const notSelector = notMatch[2];
                  const excludedElements = resolveEntities(notSelector, sectionConfig, viewScope);
                  excludedEntity_ids = new Set(excludedElements.map((e) => e.entity?.entity_id).filter(Boolean));
                }
              }

              const attrFilters = [];
              const attrFilterMatches = c.match(/\[([^\]]+)\]/g);
              if (attrFilterMatches) {
                c = c.replace(/\[([^\]]+)\]/g, '').trim();
                if (!c) c = '*';
                const hideAttrFilters = [];
                attrFilterMatches.forEach((match) => {
                  const inside = match.slice(1, -1).trim();
                  const m = inside.match(
                    /^([a-zA-Z0-9_-]+)\s*(>=|<=|>|<|\*=|\^=|\$=|=)\s*(?:"([^"]+)"|'([^']+)'|(\*)|(.*))$/,
                  );
                  if (m) {
                    const key = m[1];
                    const operator = m[2];
                    const valueStr = (m[3] || m[4] || m[5] || m[6] || '').trim();
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
                    if (key === 'entity_category' || key === 'hidden') {
                      hideAttrFilters.push(match);
                    }
                  } else if (/^[a-zA-Z0-9_-]+$/.test(inside)) {
                    attrFilters.push({
                      key: inside,
                      operator: 'exists-truthy',
                      values: [],
                    });
                    if (inside === 'entity_category' || inside === 'hidden') {
                      hideAttrFilters.push(match);
                    }
                  }
                });
                if (hideAttrFilters.length) {
                  hide += hideAttrFilters.join('');
                }
              }

              const getAttributeValue = (entity, key) => {
                if (!entity) return undefined;
                if (key === 'name' || key === 'friendly_name') return getEntityDisplayName({ entity });
                const attrFromEntity = entity[key];
                if (attrFromEntity !== undefined) return attrFromEntity;
                const stateVal = (states || context.states)?.[entity.entity_id]?.[key];
                if (stateVal !== undefined) return stateVal;
                const stateAttr = (states || context.states)?.[entity.entity_id]?.attributes?.[key];
                if (stateAttr !== undefined) return stateAttr;
                return entity[key];
              };

              const hasAttribute = (entity, key) => {
                if (!entity) return false;
                if (key === 'name' || key === 'friendly_name') return true;
                if (Object.prototype.hasOwnProperty.call(entity, key)) return true;
                const stateVals = (states || context.states)?.[entity.entity_id];
                if (stateVals && Object.prototype.hasOwnProperty.call(stateVals, key)) return true;
                const stateAttrs = (states || context.states)?.[entity.entity_id]?.attributes;
                if (stateAttrs && Object.prototype.hasOwnProperty.call(stateAttrs, key)) return true;
                return false;
              };

              const matchValue = (actualValue, operator, allowedValues) => {
                const a = String(actualValue).toLowerCase();
                return allowedValues.some((v) => {
                  const val = String(v).toLowerCase();
                  if (val === '*') return true;
                  if (operator === '=') return a === val;
                  if (operator === '*=') return a.includes(val);
                  if (operator === '^=') return a.startsWith(val);
                  if (operator === '$=') return a.endsWith(val);
                  if (operator === '>' || operator === '>=' || operator === '<' || operator === '<=') {
                    const cmp = a.localeCompare(val);
                    if (operator === '>') return cmp > 0;
                    if (operator === '>=') return cmp >= 0;
                    if (operator === '<') return cmp < 0;
                    if (operator === '<=') return cmp <= 0;
                  }
                  return false;
                });
              };

              const isTruthy = (value) => {
                if (Array.isArray(value)) {
                  return value.length > 0;
                }
                return !!value;
              };

              const checkEntityCategory = (entity) => {
                const hasEntityCategoryFilter = attrFilters.some((f) => f.key === 'entity_category');
                if (!hasEntityCategoryFilter) {
                  return !entity.entity_category;
                }

                const entityCategory = entity.entity_category;

                return attrFilters
                  .filter((f) => f.key === 'entity_category')
                  .every((f) => {
                    const { values } = f;
                    if (values.some((v) => v === '*')) return true;
                    if (values.some((v) => v === 'sensor') && !entityCategory) {
                      return true;
                    }
                    return values.some((v) => v === entityCategory);
                  });
              };

              const checkHidden = (entity) => {
                const hasHiddenFilter = attrFilters.some((f) => f.key === 'hidden');
                if (!hasHiddenFilter)
                  return !entity?.isHidden() && !isHiddenInScope({ entity: entity }, sectionConfig, viewScope);

                return attrFilters
                  .filter((f) => f.key === 'hidden')
                  .every((f) => {
                    if (f.operator === 'exists-truthy')
                      return entity?.isHidden() || isHiddenInScope({ entity: entity }, sectionConfig, viewScope);
                    if (f.operator === 'exists-any') return true;
                    return matchValue(
                      String(entity?.isHidden() || isHiddenInScope({ entity: entity }, sectionConfig, viewScope)),
                      f.operator,
                      f.values,
                    );
                  });
              };

              const getOtherFilters = () =>
                attrFilters.filter((f) => f.key !== 'entity_category' && f.key !== 'hidden');

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
                    if (operator === 'exists-any') return hasAttribute(entity, key);
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
                Object.values(context.entities || {})
                  .filter((e) => re.test(e.entity_id))
                  .forEach((e) => {
                    if (
                      !excludedEntity_ids.has(e.entity_id) &&
                      checkEntityCategory(e) &&
                      checkHidden(e) &&
                      checkOtherAttributes(e)
                    ) {
                      elements.push({ selector: selector, hide: hide, entity: e });
                    }
                  });
              } else {
                if (context.entities?.[c]) {
                  const e = context.entities?.[c];
                  if (
                    !excludedEntity_ids.has(c) &&
                    checkEntityCategory(e) &&
                    checkHidden(e) &&
                    checkOtherAttributes(e)
                  ) {
                    elements.push({ selector: selector, hide: hide, entity: e });
                  }
                }
                if (context.devices?.[c]) {
                  Object.values(context.entities || {}).forEach((e) => {
                    if (
                      e.device_id === c &&
                      !excludedEntity_ids.has(e.entity_id) &&
                      checkEntityCategory(e) &&
                      checkHidden(e) &&
                      checkOtherAttributes(e)
                    ) {
                      elements.push({ selector: selector, hide: hide, entity: e });
                    }
                  });
                }
                if (context.labels?.[c]) {
                  context.labels[c].forEach((e) => {
                    if (
                      !excludedEntity_ids.has(e.entity_id) &&
                      checkEntityCategory(e) &&
                      checkHidden(e) &&
                      checkOtherAttributes(e)
                    ) {
                      elements.push({ selector: selector, hide: hide, entity: e });
                    }
                  });
                }
                if (context.labels?.['bonbon_' + c]) {
                  context.labels['bonbon_' + c].forEach((e) => {
                    if (
                      !excludedEntity_ids.has(e.entity_id) &&
                      checkEntityCategory(e) &&
                      checkHidden(e) &&
                      checkOtherAttributes(e)
                    ) {
                      elements.push({ selector: selector, hide: hide, entity: e });
                    }
                  });
                }
              }
            } else if ((c.entity_id || c.entity) && (context.entities[c.entity_id] || context.entities[c.entity])) {
              elements.push({
                bonbon_card: true,
                entity: context.entities[c.entity_id] || context.entities[c.entity],
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
      sectionConfig,
      viewScope,
    );
  }

  function resolveEntity(c, sectionConfig = {}, viewScope = '', states = null) {
    return resolveEntities(c, sectionConfig, viewScope, states)[0];
  }

  function inArea(c, area) {
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

  function onFloor(c, floor) {
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

  return {
    sortByName,
    sortEntities,
    resolveEntities,
    resolveEntity,
    inArea,
    onFloor,
  };
}
