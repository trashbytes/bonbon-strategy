const metaScheme = document.querySelector('meta[name="color-scheme"]');

export const css = (strings, ...values) => strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');

export const getBonbonVarName = (panelUrl, suffix) => `--bonbon-${panelUrl}-${suffix}`;

export const getBonbonVarValue = (panelUrl, suffix, fallback) => {
  const variableName = getBonbonVarName(panelUrl, suffix);
  return fallback ? `var(${variableName}, ${fallback})` : `var(${variableName})`;
};

export const isDark = () => {
  return metaScheme?.getAttribute('content') === 'dark';
};

export const observeDarkMode = (callback) => {
  callback = typeof callback == 'function' ? callback : () => {};
  const observer = new MutationObserver(() => {
    callback(isDark());
  });
  observer.observe(metaScheme, { attributes: true });
  callback(isDark());
};

export const getVariables = (config, panelUrl) => ({
  light: {
    [getBonbonVarName(panelUrl, 'background-image')]: config?.background_image_light
      ? 'top / cover no-repeat fixed url("' + config?.background_image_light + '")'
      : 'none',
    [getBonbonVarName(panelUrl, 'primary-text-color')]: config?.card_text_color_light || '#222',
    [getBonbonVarName(panelUrl, 'card-background')]: config?.card_background_color_light || '#fff',
    [getBonbonVarName(panelUrl, 'hover-overlay-background')]: 'rgba(0,0,0,0.02)',
    [getBonbonVarName(panelUrl, 'sub-button-shadow-opacity')]: '0.05',
    [getBonbonVarName(panelUrl, 'icon-color-off')]: getBonbonVarValue(panelUrl, 'primary-text-color'),
    [getBonbonVarName(panelUrl, 'icon-background-off')]: 'rgba(0,0,0,0.03)',
    [getBonbonVarName(panelUrl, 'icon-color-on')]: '#fff',
    [getBonbonVarName(panelUrl, 'icon-background-on')]: 'rgba(0,0,0,0.03)',
    [getBonbonVarName(panelUrl, 'border-radius')]: '12px',
    [getBonbonVarName(panelUrl, 'box-shadow')]: `0 2px 6px rgba(0, 0, 0, 0.05),
      inset 0 0.5px 0 0 rgba(255, 255, 255, 0.2),
      inset 0 -0.5px 0 0 rgba(0, 0, 0, 0.10)`,
    [getBonbonVarName(panelUrl, 'primary-accent-color')]: config?.primary_accent_color_light,
  },
  dark: {
    [getBonbonVarName(panelUrl, 'background-image')]: config?.background_image_dark
      ? 'top / cover no-repeat fixed url("' + config?.background_image_dark + '")'
      : 'none',
    [getBonbonVarName(panelUrl, 'primary-text-color')]: config?.card_text_color_dark || '#ddd',
    [getBonbonVarName(panelUrl, 'card-background')]: config?.card_background_color_dark || '#222',
    [getBonbonVarName(panelUrl, 'hover-overlay-background')]: 'rgba(255,255,255,0.02)',
    [getBonbonVarName(panelUrl, 'sub-button-shadow-opacity')]: '0.2',
    [getBonbonVarName(panelUrl, 'icon-color-off')]: getBonbonVarValue(panelUrl, 'primary-text-color'),
    [getBonbonVarName(panelUrl, 'icon-background-off')]: 'rgba(0,0,0,0.1)',
    [getBonbonVarName(panelUrl, 'icon-color-on')]: '#fff',
    [getBonbonVarName(panelUrl, 'icon-background-on')]: 'rgba(0,0,0,0.1)',
    [getBonbonVarName(panelUrl, 'border-radius')]: '12px',
    [getBonbonVarName(panelUrl, 'box-shadow')]: `0 2px 6px rgba(0, 0, 0, 0.2),
      inset 0 0.5px 0 0 rgba(255, 255, 255, 0.01),
      inset 0 -0.5px 0 0 rgba(0, 0, 0, 0.8)`,
    [getBonbonVarName(panelUrl, 'primary-accent-color')]: config?.primary_accent_color_dark,
  },
});

export const getStyles = (config, panelUrl) => {
  const shadowOverlay = css`
    border-radius: ${getBonbonVarValue(panelUrl, 'border-radius')};
    pointer-events: none;
    display: block;
    content: '';
    inset: 0;
    position: absolute;
    box-shadow: ${getBonbonVarValue(panelUrl, 'box-shadow')};
  `;
  const haCardBase = css`
    :host * {
      transition: none !important;
    }
    ha-card {
      overflow: visible !important;
      border: none !important;
    }
    ha-card:after {
      ${shadowOverlay}
    }
    ha-card:before {
      pointer-events: none;
      content: '';
      display: block;
      inset: 0;
      position: absolute;
      border-radius: var(--bubble-button-border-radius);
      background: ${getBonbonVarValue(panelUrl, 'hover-overlay-background')};
      opacity: 0;
    }
    ha-card:hover:before {
      opacity: 1;
    }
  `;
  const globalStyles = css`
    *,
    *:before,
    *:after,
    :host {
      --primary-text-color: ${getBonbonVarValue(panelUrl, 'primary-text-color')};
      --bubble-line-background-color: rgba(0, 0, 0, 0.05);
      --ha-card-background: ${getBonbonVarValue(panelUrl, 'card-background')};
      --card-background-color: ${getBonbonVarValue(panelUrl, 'card-background')};
      --bubble-main-background-color: ${getBonbonVarValue(panelUrl, 'card-background')};
      --bubble-media-player-main-background-color: ${getBonbonVarValue(panelUrl, 'card-background')};
      --bubble-cover-main-background-color: ${getBonbonVarValue(panelUrl, 'card-background')};
      --bubble-calendar-main-background-color: ${getBonbonVarValue(panelUrl, 'card-background')};
      --bubble-border-radius: ${getBonbonVarValue(panelUrl, 'border-radius')};
      --bubble-icon-border-radius: 8px;
      --bubble-sub-button-border-radius: 8px;
      --bubble-media-player-buttons-border-radius: 8px;
      --bubble-cover-buttons-border-radius: 8px;
      --bubble-button-border-radius: ${getBonbonVarValue(panelUrl, 'border-radius')};
      --bubble-default-color: ${getBonbonVarValue(panelUrl, 'primary-accent-color')};
      --bubble-state-climate-fan-only-color: ${getBonbonVarValue(panelUrl, 'primary-accent-color')};
      --bubble-state-climate-dry-color: ${getBonbonVarValue(panelUrl, 'primary-accent-color')};
      --bubble-state-climate-cool-color: ${getBonbonVarValue(panelUrl, 'primary-accent-color')};
      --bubble-state-climate-heat-color: ${getBonbonVarValue(panelUrl, 'primary-accent-color')};
      --bubble-state-climate-auto-color: ${getBonbonVarValue(panelUrl, 'primary-accent-color')};
    }
  `;
  const areaSubButtonBase = css`
    .fixed-top .bubble-sub-button-container {
      margin-top: 8px;
    }
    ha-ripple {
      display: none;
    }
    .bubble-button {
      background: var(--area-light-color);
      overflow: hidden;
    }
    .bubble-button-background {
      opacity: 1 !important;
      background: var(--area-light-color) !important;
    }
    .bubble-main-icon-container {
      background: transparent;
      margin: 0;
      position: absolute;
      top: 50%;
      left: -4px;
      transform: translateY(-50%);
      overflow: visible;
    }
    .bubble-main-icon-container:before {
      display: block;
      width: 1000%;
      height: 1000%;
      content: '';
      background: var(--area-medium-color);
      position: absolute;
      top: 50%;
      right: -4px;
      transform: translateY(-50%);
      border-radius: 50%;
    }
    .bubble-container:hover .bubble-button-background {
      background: var(--area-medium-color) !important;
    }
    .bubble-container:hover .bubble-main-icon-container:before {
      background: var(--area-shade-color) !important;
    }
    .bubble-name-container {
      margin-left: 62px !important;
    }
    .bubble-name {
      font-size: 15px;
      padding-top: 3px;
    }
    .bubble-sub-button-bottom-container,
    .bubble-sub-button-bottom-container * {
      pointer-events: none !important;
    }
    .bubble-sub-button-bottom-container .bubble-sub-button:first-child {
      margin-left: 42px !important;
    }
    .bubble-sub-button-bottom-container .bubble-sub-button {
      padding-right: 0;
    }
    .bubble-sub-button-bottom-container .icon-with-state {
      margin-right: 2px;
    }
    .bubble-sub-button-group {
      gap: 0;
    }
  `;
  const separatorLightsSubButtonBase = css`
    [data-group-id='g_main_0'] .bubble-sub-button {
      background-color: var(--ha-card-background, var(--card-background-color, #fff));
      box-shadow: 0 2px 6px rgba(0, 0, 0, ${getBonbonVarValue(panelUrl, 'sub-button-shadow-opacity')});
    }
  `;
  const styles = {
    cardmodGlobal: globalStyles,
    bubbleGlobal:
      globalStyles +
      css`
        *,
        *:before,
        *:after {
          transition: none !important;
        }
        .bubble-sub-button-name-container {
          white-space: nowrap !important;
        }
        .is-off .bubble-main-icon {
          opacity: 1;
        }
        .bubble-icon-container {
          --icon-primary-color: ${getBonbonVarValue(panelUrl, 'icon-color-off')};
          background-color: ${getBonbonVarValue(panelUrl, 'icon-background-off')};
        }
        ha-ripple {
          display: none !important;
        }
        .bubble-climate-container,
        .bubble-cover-container,
        .bubble-media-player-container,
        .bubble-button-background {
          background-color: ${getBonbonVarValue(panelUrl, 'card-background')} !important;
          opacity: 1 !important;
        }
        ha-card {
          position: relative;
        }
        ha-card.footer-mode .bubble-container::before {
          display: none;
        }
        .bubble-main-icon-container {
          pointer-events: none;
        }
        .bubble-container,
        .bubble-button-container {
          overflow: visible;
        }
        .bubble-sub-buttons-container .bubble-sub-button,
        .bubble-button-container:not(.bubble-buttons-container),
        .bubble-climate-container,
        .bubble-cover-container,
        .bubble-media-player-container {
          border-radius: var(--bubble-button-border-radius);
        }
        .bubble-sub-buttons-container .bubble-sub-button:after,
        .bubble-button-container:not(.bubble-buttons-container):after,
        .bubble-climate-container:after,
        .bubble-cover-container:after,
        .bubble-media-player-container:after {
          ${shadowOverlay}
        }
        .bubble-sub-buttons-container .bubble-sub-button:hover:after,
        .bubble-button-container:not(.bubble-buttons-container):hover:after,
        .bubble-climate-container:hover:after,
        .bubble-cover-container:hover:after,
        .bubble-media-player-container:hover:after {
          background: ${getBonbonVarValue(panelUrl, 'hover-overlay-background')};
        }
        mwc-list-item[selected],
        mwc-list-item[selected],
        .is-on .bubble-name-container {
          --icon-primary-color: #fff;
          color: #fff !important;
        }
        mwc-list-item:not([selected]) {
          --icon-primary-color: ${getBonbonVarValue(panelUrl, 'primary-text-color')};
        }
        .is-on .bubble-icon-container {
          --icon-primary-color: ${getBonbonVarValue(panelUrl, 'icon-color-on')};
          background-color: ${getBonbonVarValue(panelUrl, 'icon-background-on')};
        }
        .bubble-climate .bubble-sub-button.background-off,
        .bubble-climate .bubble-temperature-container {
          background: ${getBonbonVarValue(panelUrl, 'icon-background-off')};
        }
        .is-on .bubble-climate .bubble-temperature-container {
          color: #fff;
          --icon-primary-color: #fff;
        }
        .bubble-cover-button,
        .bubble-media-button {
          background: ${getBonbonVarValue(panelUrl, 'icon-background-off')};
          --icon-primary-color: ${getBonbonVarValue(panelUrl, 'primary-text-color')};
        }
        .is-on .bubble-cover-button,
        .is-on .bubble-media-button,
        .is-on .bubble-climate {
          --icon-primary-color: #fff;
        }
        .is-on .bubble-button-background,
        .is-on .bubble-background {
          background-color: ${getBonbonVarValue(panelUrl, 'primary-accent-color')} !important;
          filter: none !important;
          opacity: 1 !important;
        }
        .bubble-dropdown-inner-border {
          display: none !important;
        }
        .bubble-separator .bubble-sub-button-container {
          right: 0;
        }
        .bubble-separator .bubble-sub-button {
          border-radius: 10px;
        }
      `,
    bubbleButtonNonBinary: css`
      .is-on .bubble-name-container[class] {
        color: var(--primary-text-color) !important;
      }
      .is-on .bubble-icon-container[class] {
        --icon-primary-color: ${getBonbonVarValue(panelUrl, 'primary-text-color')};
        background-color: ${getBonbonVarValue(panelUrl, 'icon-background-off')};
      }
      .is-on .bubble-button-background[class] {
        background-color: ${getBonbonVarValue(panelUrl, 'card-background')} !important;
      }
    `,
    bubbleSeparatorSubButtonBase: css`
      .bubble-sub-button[class*='background'] {
        background-color: var(--ha-card-background, var(--card-background-color, #fff));
        box-shadow: 0 2px 6px rgba(0, 0, 0, ${getBonbonVarValue(panelUrl, 'sub-button-shadow-opacity')});
      }
      .bubble-sub-button-container:has(.background-on) .bubble-sub-button {
        color: #fff;
        background-color: var(--bubble-default-color);
      }
    `,
    bubbleSeparatorLightsSubButtonAlways:
      separatorLightsSubButtonBase +
      css`
        .bubble-sub-button-container:has(.background-on) [data-group-id='g_main_0'] .bubble-sub-button {
          color: #fff;
          background-color: var(--bubble-default-color);
        }
        .bubble-sub-button-container:has(.background-on)
          [data-group-id='g_main_0']
          .bubble-sub-button:not([data-tap-action*='light.turn_off']),
        .bubble-sub-button-container:has(.background-on)
          [data-group-id='g_main_0']
          .bubble-sub-button[data-tap-action*='light.turn_off']
          ~ .bubble-sub-button[data-tap-action*='light.turn_off'] {
          display: none !important;
        }
        .bubble-sub-button-container:not(:has(.background-on))
          [data-group-id='g_main_0']
          .bubble-sub-button:not([data-tap-action*='light.turn_on']),
        .bubble-sub-button-container:not(:has(.background-on))
          [data-group-id='g_main_0']
          .bubble-sub-button[data-tap-action*='light.turn_on']
          ~ .bubble-sub-button[data-tap-action*='light.turn_on'] {
          display: none !important;
        }
      `,
    bubbleSeparatorLightsSubButtonDefault:
      separatorLightsSubButtonBase +
      css`
        [data-group-id='g_main_0'] .background-on {
          color: #fff;
          background-color: var(--bubble-default-color);
        }
        .bubble-sub-button-container [data-group-id='g_main_0'] .bubble-sub-button:not(.background-on),
        .bubble-sub-button-container
          [data-group-id='g_main_0']
          .bubble-sub-button.background-on
          ~ .bubble-sub-button.background-on {
          display: none !important;
        }
      `,
    bubbleAreaSubButtonAlways:
      areaSubButtonBase +
      css`
        .bubble-sub-button-container.fixed-top .bubble-sub-button {
          background: var(--area-medium-color) !important;
        }
        .bubble-container:hover .bubble-sub-button-container.fixed-top .bubble-sub-button,
        .bubble-container:hover .bubble-sub-button-container.fixed-top:not(:has(.background-on)) .bubble-sub-button {
          background: var(--area-shade-color) !important;
        }
        .bubble-sub-button-container.fixed-top .background-on {
          background: var(--area-medium-color) !important;
        }
        .bubble-container:hover .bubble-sub-button-container.fixed-top .background-on {
          background: var(--area-shade-color) !important;
        }
        .bubble-sub-button-container.fixed-top .bubble-sub-button:not(.background-on),
        .bubble-sub-button-container.fixed-top .bubble-sub-button.background-on ~ .bubble-sub-button.background-on {
          display: none !important;
        }
      `,
    bubbleAreaSubButtonDefault:
      areaSubButtonBase +
      css`
        .bubble-sub-button-container.fixed-top .bubble-sub-button,
        .bubble-sub-button-container.fixed-top:not(:has(.background-on)) .bubble-sub-button {
          background: var(--area-medium-color) !important;
        }
        .bubble-container:hover .bubble-sub-button-container.fixed-top .bubble-sub-button,
        .bubble-container:hover .bubble-sub-button-container.fixed-top:not(:has(.background-on)) .bubble-sub-button {
          background: var(--area-shade-color) !important;
        }
        .bubble-sub-button-container.fixed-top:has(.background-on) .bubble-sub-button,
        .bubble-container:hover .bubble-sub-button-container.fixed-top:has(.background-on) .bubble-sub-button {
          background: var(--bubble-default-color) !important;
          color: #fff !important;
        }
        .bubble-sub-button-container.fixed-top:has(.background-on)
          .bubble-sub-button:not([data-tap-action*='light.turn_off']),
        .bubble-sub-button-container.fixed-top:has(.background-on)
          .bubble-sub-button[data-tap-action*='light.turn_off']
          ~ .bubble-sub-button[data-tap-action*='light.turn_off'] {
          display: none !important;
        }
        .bubble-sub-button-container.fixed-top:not(:has(.background-on))
          .bubble-sub-button:not([data-tap-action*='light.turn_on']),
        .bubble-sub-button-container.fixed-top:not(:has(.background-on))
          .bubble-sub-button[data-tap-action*='light.turn_on']
          ~ .bubble-sub-button[data-tap-action*='light.turn_on'] {
          display: none !important;
        }
      `,
    environmentGraphCard: css`
      ${haCardBase}
      :host {
        min-height: 56px;
      }
      ha-card {
        padding: 0 !important;
      }
      .header {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        padding: 0 !important;
        height: 100% !important;
        justify-content: center !important;
        align-items: center !important;
        width: 56px !important;
        z-index: 1;
      }
      .icon {
        color: var(--primary-text-color) !important;
        border-radius: var(
          --bubble-button-icon-border-radius,
          var(--bubble-icon-border-radius, ${getBonbonVarValue(panelUrl, 'border-radius', '50%')})
        ) !important;
        background-color: ${getBonbonVarValue(panelUrl, 'icon-background-off')};
        padding: 9px !important;
      }
      .name {
        padding: 0 !important;
        position: absolute !important;
        bottom: 50%;
        left: 60px !important;
      }
      .states {
        padding: 0 !important;
        position: absolute !important;
        top: 50% !important;
        left: 60px !important;
      }
      .name .ellipsis,
      .state span {
        display: block;
        font-size: 13px !important;
        font-weight: 600 !important;
        line-height: 18px !important;
        margin-top: 0 !important;
        margin-bottom: 0 !important;
        opacity: 1 !important;
        min-height: 0 !important;
        max-height: none !important;
      }
      .state span {
        font-size: 12px !important;
        font-weight: normal !important;
        opacity: 0.85 !important;
      }
      .graph {
        overflow: hidden;
        pointer-events: none !important;
        opacity: 1 !important;
        border-bottom-left-radius: var(--bubble-button-border-radius);
        border-bottom-right-radius: var(--bubble-button-border-radius);
        z-index: 2;
        container-type: inline-size;
      }
      @supports (width: 1cqw) {
        .graph__container {
          height: 56px !important;
          width: 500px !important;
          transform-origin: left;
          transform: scaleX(calc(100cqw / 500px));
        }
      }
    `,
    haCardBase: css`
      ${haCardBase}
    `,
  };
  return styles;
};
