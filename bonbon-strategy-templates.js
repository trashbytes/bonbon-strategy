// Card templates: an ordered map of entity selector -> full card definition.
// For every entity the last matching template wins, except for the `*` fallback which is always matched last.
// String values inside a template may contain placeholders, resolved per matched entity.

import { mergeDeep } from './bonbon-strategy-utils.js';

// Only Bubble Card may be assumed installed, every other custom card is optional.
const BUILT_IN_CUSTOM_CARDS = ['bubble-card'];

const PLACEHOLDER_PATTERN = /\bentity\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*|\barea\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*/g;

const EXACT_PLACEHOLDER_PATTERN = /^(entity|area)\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/;

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getPathValue(source, path) {
  if (!source || !path) {
    return undefined;
  }
  return path.split('.').reduce((current, key) => {
    if (current === undefined || current === null) {
      return undefined;
    }
    return current[key];
  }, source);
}

function getPlaceholderValue(token, entity, states, area) {
  const [scope, ...rest] = token.split('.');
  const path = rest.join('.');
  if (!path) {
    return undefined;
  }

  if (scope === 'entity') {
    // Prepared entity values win, everything else is read from the live state.
    if (entity && Object.prototype.hasOwnProperty.call(entity, path) && getPathValue(entity, path) !== undefined) {
      return getPathValue(entity, path);
    }
    const state = states?.[entity?.entity_id];
    const stateValue = getPathValue(state, path);
    if (stateValue !== undefined) {
      return stateValue;
    }
    const attributeValue = getPathValue(state?.attributes, path);
    if (attributeValue !== undefined) {
      return attributeValue;
    }
    // `entity.attributes.*` always resolves (to null when the attribute is missing), any other path is dropped.
    return path.startsWith('attributes.') ? null : undefined;
  }

  if (scope === 'area') {
    // `area.<attribute>` always comes from the area the card is rendered in, never from the entity.
    // Without an area (e.g. cards outside area views) the placeholder stays unresolved and the key is dropped.
    return getPathValue(area, path);
  }

  return undefined;
}

function stringifyValue(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

// Resolves placeholders recursively. A value consisting of a single placeholder keeps the resolved type,
// a placeholder inside a longer string is interpolated. Unresolvable placeholders resolve to `undefined`.
function resolvePlaceholders(value, entity, states, area) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (EXACT_PLACEHOLDER_PATTERN.test(trimmed)) {
      return getPlaceholderValue(trimmed, entity, states, area);
    }
    let unresolved = false;
    const interpolated = value.replace(PLACEHOLDER_PATTERN, (token) => {
      const resolved = stringifyValue(getPlaceholderValue(token, entity, states, area));
      if (resolved === undefined) {
        unresolved = true;
        return '';
      }
      return resolved;
    });
    return unresolved ? undefined : interpolated;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => resolvePlaceholders(item, entity, states, area))
      .filter((item) => item !== undefined && item !== null);
  }
  if (isPlainObject(value)) {
    return Object.keys(value).reduce((acc, key) => {
      const resolvedValue = resolvePlaceholders(value[key], entity, states, area);
      if (resolvedValue === undefined) {
        return acc;
      }
      acc[key] = resolvedValue;
      return acc;
    }, {});
  }
  return value;
}

export function isCustomCardInstalled(type) {
  if (typeof type !== 'string' || !type.startsWith('custom:')) {
    return true;
  }
  const customCardType = type.slice('custom:'.length);
  if (BUILT_IN_CUSTOM_CARDS.includes(customCardType)) {
    return true;
  }
  const customCards = typeof window === 'undefined' ? undefined : window.customCards;
  if (!Array.isArray(customCards)) {
    return false;
  }
  return customCards.some((cc) => {
    if (typeof cc === 'string') {
      return cc === customCardType || cc === 'custom:' + customCardType;
    }
    return cc?.type === customCardType || cc?.type === 'custom:' + customCardType;
  });
}

// Card templates are merged by selector key in two steps:
// 1. a user template deep-merges over the shipped default with the identical key, so overriding a single key
//    (e.g. only `button_type` of `light.*`) keeps the rest of the default card (arrays are replaced, not merged);
// 2. a user selector key that no default uses is appended at the end, where it wins over every default.
export function mergeCards(defaultCards = {}, userCards = {}) {
  const merged = { ...(isPlainObject(defaultCards) ? defaultCards : {}) };
  Object.keys(isPlainObject(userCards) ? userCards : {}).forEach((key) => {
    const userTemplate = userCards[key];
    if (!isPlainObject(userTemplate)) {
      return;
    }
    merged[key] = isPlainObject(merged[key]) ? mergeDeep(merged[key], userTemplate) : { ...userTemplate };
  });
  return merged;
}

export function createTemplateApi(config = {}, states = {}, resolveEntityFn = null) {
  // Selector -> Set(entity_id). Built once per selector per generate run, so matching a card does not re-resolve
  // the whole registry for every template.
  const matchCache = new Map();
  // Template map cache, section templates are identified by their own `card_templates` object.
  const templateMapCache = new Map();

  const getSectionTemplates = (sectionConfig) =>
    isPlainObject(sectionConfig?.card_templates) ? sectionConfig.card_templates : {};

  // Global templates first, section templates after them so a section-scoped template always wins.
  // Insertion order is kept as authored: the last matching template wins.
  const getTemplateMap = (sectionConfig) => {
    const sectionTemplates = getSectionTemplates(sectionConfig);
    const cached = templateMapCache.get(sectionTemplates);
    if (cached) {
      return cached;
    }
    const globalTemplates = isPlainObject(config?.cards) ? config.cards : {};
    const merged = {};
    // A section key replaces the global template with the identical key, but moves to the end so it also
    // beats more specific global selectors (e.g. a section `light.*` must win over the dimmable `light.*[...]`).
    Object.keys(globalTemplates).forEach((key) => {
      if (!isPlainObject(globalTemplates[key])) {
        return;
      }
      if (isPlainObject(sectionTemplates) && Object.prototype.hasOwnProperty.call(sectionTemplates, key)) {
        return;
      }
      merged[key] = globalTemplates[key];
    });
    Object.keys(sectionTemplates).forEach((key) => {
      if (!isPlainObject(sectionTemplates[key])) {
        return;
      }
      // Same key as a global template: deep-merge so a section only overrides the keys it names.
      merged[key] = isPlainObject(globalTemplates[key])
        ? mergeDeep(globalTemplates[key], sectionTemplates[key])
        : sectionTemplates[key];
    });
    templateMapCache.set(sectionTemplates, merged);
    return merged;
  };

  // Resolves a selector against the full registry, independent of the section's hidden/entity_category
  // filtering. The second argument is a section config, not an entity.
  const getSelectorEntityIds = (selector) => {
    if (matchCache.has(selector)) {
      return matchCache.get(selector);
    }
    let entityIds = new Set();
    if (typeof resolveEntityFn === 'function') {
      try {
        const resolved = resolveEntityFn(selector, {});
        entityIds = new Set([resolved].flat().map((entry) => entry?.entity?.entity_id).filter(Boolean));
      } catch (e) {
        console.warn(`Bonbon: could not match card template "${selector}"`, e);
      }
    }
    matchCache.set(selector, entityIds);
    return entityIds;
  };

  const matchesTemplate = (selector, entity) =>
    !!entity?.entity_id && getSelectorEntityIds(selector).has(entity.entity_id);

  // Returns the selector of the last template matching the entity, or `*` as the fallback, or null.
  // The `*` catch-all always matches every entity, so it is only used when nothing else matched.
  const findTemplate = (entity, sectionConfig) => {
    if (!entity?.entity_id) {
      return null;
    }
    const templateMap = getTemplateMap(sectionConfig);
    let matchedKey = null;
    Object.keys(templateMap).forEach((key) => {
      if (key === '*' || !isCustomCardInstalled(templateMap[key]?.type)) {
        return;
      }
      if (matchesTemplate(key, entity)) {
        matchedKey = key;
      }
    });
    if (matchedKey === null && templateMap['*'] && isCustomCardInstalled(templateMap['*']?.type)) {
      matchedKey = '*';
    }
    return matchedKey;
  };

  // `area` is the area the card is rendered in, used to resolve `area.*` placeholders.
  const getCardTemplate = (c, sectionConfig, area = undefined) => {
    const key = findTemplate(c?.entity, sectionConfig);
    if (key === null) {
      return undefined;
    }
    return resolvePlaceholders(getTemplateMap(sectionConfig)[key], c.entity, states, area);
  };

  return {
    findTemplate,
    getCardTemplate,
    getTemplateMap,
    getSectionTemplates,
  };
}
