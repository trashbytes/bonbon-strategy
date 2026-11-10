// Card templates: an ordered map of entity selector -> full card definition.
// For every entity the last matching template wins, except for the `*` catch-all, which only applies when nothing
// else matched. A selector may carry `[view=...]` and `[section=...]` context filters, matched against the section
// a card is rendered in instead of against the entity. String values inside a template may contain placeholders,
// resolved per matched entity.

import { mergeDeep } from './bonbon-strategy-utils.js';

// Only Bubble Card may be assumed installed, every other custom card is optional.
const BUILT_IN_CUSTOM_CARDS = ['bubble-card'];

const PLACEHOLDER_PATTERN = /\bentity\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*|\barea\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*/g;

const EXACT_PLACEHOLDER_PATTERN = /^(entity|area)\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/;

// `[view=...]` and `[section=...]` are context filters, not entity attributes: they are stripped from the
// selector before it is resolved and matched against the rendering section.
const CONTEXT_FILTER_PATTERN = /\[(view|section)\s*=\s*([^\]]+)\]/gi;

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

// Splits a template selector into its entity part and its context filters, e.g.
// `sensor.*[section=bonbon_environment]` -> { base: 'sensor.*', filters: [{ key: 'section', values: [...] }] }.
export function parseTemplateSelector(selector) {
  const filters = [];
  const base = String(selector ?? '')
    .replace(CONTEXT_FILTER_PATTERN, (match, key, value) => {
      const values = value
        .split('|')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
      if (values.length) {
        filters.push({ key: key.toLowerCase(), values });
      }
      return '';
    })
    .trim();
  return { base: base || '*', filters };
}

// A `[section=...]` filter matches the section key, a `[view=...]` filter the rendered view key. Per-area views
// also answer to `bonbon_area`, custom views to the key they were configured under.
export function matchesSectionContext(filters = [], sectionConfig = {}) {
  return filters.every((filter) => {
    const raw = filter.key === 'section' ? sectionConfig?.key : sectionConfig?.view;
    if (!raw) {
      return false;
    }
    const context = String(raw).toLowerCase();
    const candidates = new Set([context]);
    if (context.startsWith('bonbon_area_')) {
      candidates.add('bonbon_area');
    }
    if (context.startsWith('custom_')) {
      candidates.add(context.slice('custom_'.length));
    }
    return filter.values.some((value) => candidates.has(value));
  });
}

// Card templates are merged by selector key in two steps:
// 1. a user template deep-merges over the shipped default with the identical key, so overriding a single key
//    (e.g. only `button_type` of `light.*`) keeps the rest of the default card (arrays are replaced, not merged);
// 2. a user selector key that no default uses is appended at the end, where it wins over every default.
export function mergeCardTemplates(defaultTemplates = {}, userTemplates = {}) {
  const merged = { ...(isPlainObject(defaultTemplates) ? defaultTemplates : {}) };
  Object.keys(isPlainObject(userTemplates) ? userTemplates : {}).forEach((key) => {
    const userTemplate = userTemplates[key];
    if (!isPlainObject(userTemplate)) {
      return;
    }
    merged[key] = isPlainObject(merged[key]) ? mergeDeep(merged[key], userTemplate) : { ...userTemplate };
  });
  return merged;
}

export function createTemplateApi(config = {}, states = {}, resolveEntityFn = null) {
  // Selector -> Set(entity_id) and selector -> parsed selector. Built once per selector per generate run, so
  // matching a card never re-resolves the whole registry and never re-parses the same selector.
  const matchCache = new Map();
  const parsedCache = new Map();

  const getTemplates = () => (isPlainObject(config?.card_templates) ? config.card_templates : {});

  const parseSelector = (selector) => {
    if (!parsedCache.has(selector)) {
      parsedCache.set(selector, parseTemplateSelector(selector));
    }
    return parsedCache.get(selector);
  };

  // Resolves an entity selector against the full registry, independent of the section's hidden/entity_category
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

  // Returns the selector of the last template matching the entity and the current section, or the last matching
  // `*` catch-all when nothing else matched, or null.
  const findTemplate = (entity, sectionConfig) => {
    if (!entity?.entity_id) {
      return null;
    }
    const templates = getTemplates();
    let matchedKey = null;
    let catchAllKey = null;
    Object.keys(templates).forEach((key) => {
      const template = templates[key];
      if (!isPlainObject(template) || !isCustomCardInstalled(template.type)) {
        return;
      }
      const { base, filters } = parseSelector(key);
      if (!matchesSectionContext(filters, sectionConfig)) {
        return;
      }
      if (base === '*') {
        catchAllKey = key;
        return;
      }
      if (getSelectorEntityIds(base).has(entity.entity_id)) {
        matchedKey = key;
      }
    });
    return matchedKey ?? catchAllKey;
  };

  // `area` is the area the card is rendered in, used to resolve `area.*` placeholders.
  const getCardTemplate = (c, sectionConfig, area = undefined) => {
    const key = findTemplate(c?.entity, sectionConfig);
    if (key === null) {
      return undefined;
    }
    return resolvePlaceholders(getTemplates()[key], c.entity, states, area);
  };

  return {
    findTemplate,
    getCardTemplate,
    getTemplates,
  };
}
