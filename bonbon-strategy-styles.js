export const css = (strings, ...values) =>
  strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');

export const getStyles = (config, isDark) => {
  const shadowOverlay = css`
    border-radius: var(--bonbon-border-radius);
    pointer-events: none;
    display: block;
    content: '';
    inset: 0;
    position: absolute;
    box-shadow: var(--bonbon-box-shadow);
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
      background: ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
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
      --bonbon-primary-text-color: ${isDark
        ? config?.card_text_color_dark || '#ddd'
        : config?.card_text_color_light || '#222'};
      --primary-text-color: var(--bonbon-primary-text-color);
      --bubble-line-background-color: rgba(0, 0, 0, 0.05);
      --bonbon-card-background: ${isDark
        ? config?.card_background_color_dark || '#222'
        : config?.card_background_color_light || '#fff'};
      --ha-card-background: var(--bonbon-card-background);
      --bubble-main-background-color: var(--bonbon-card-background);
      --bubble-media-player-main-background-color: var(
        --bonbon-card-background
      );
      --bubble-cover-main-background-color: var(--bonbon-card-background);
      --bubble-calendar-main-background-color: var(--bonbon-card-background);

      --bonbon-border-radius: 12px;
      --bubble-border-radius: var(--bonbon-border-radius);
      --bubble-icon-border-radius: 8px;
      --bubble-sub-button-border-radius: 8px;
      --bubble-button-border-radius: var(--bonbon-border-radius);
      --bonbon-box-shadow:
        0 2px 6px rgba(0, 0, 0, ${isDark ? '0.2' : '0.05'}),
        inset 0 0.5px 0 0 rgba(255, 255, 255, ${isDark ? '0.01' : '0.2'}),
        inset 0 -0.5px 0 0 rgba(0, 0, 0, ${isDark ? '0.8' : '0.10'});
      --bonbon-primary-accent-color: ${config?.primary_accent_color};
      --bubble-default-color: var(--bonbon-primary-accent-color);
      --bubble-state-climate-fan-only-color: var(--bonbon-primary-accent-color);
      --bubble-state-climate-dry-color: var(--bonbon-primary-accent-color);
      --bubble-state-climate-cool-color: var(--bonbon-primary-accent-color);
      --bubble-state-climate-heat-color: var(--bonbon-primary-accent-color);
      --bubble-state-climate-auto-color: var(--bonbon-primary-accent-color);
      --bubble-state-climate-heat-cool-color: var(
        --bonbon-primary-accent-color
      );
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
        ha-ripple {
          display: none !important;
        }
        .bubble-climate-container,
        .bubble-cover-container,
        .bubble-media-player-container,
        .bubble-button-background {
          background-color: var(--bonbon-card-background) !important;
          opacity: 1 !important;
        }
        .is-on .bubble-button-background {
          background-color: var(--bubble-default-color) !important;
        }
        ha-card {
          position: relative;
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
          background: ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
        }
        mwc-list-item[selected],
        mwc-list-item[selected] ha-icon,
        .is-on .bubble-name-container {
          color: #fff !important;
        }
        .is-on .bubble-cover-button,
        .is-on .bubble-media-button {
          background: rgba(0, 0, 0, 0.1);
          border-radius: var(
            --bubble-sub-button-border-radius,
            var(--bubble-border-radius, 18px)
          );
          --icon-primary-color: #fff;
        }
        .is-on .bubble-button-background,
        .is-on .bubble-background {
          background-color: var(--bonbon-primary-accent-color) !important;
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
      .is-on .bubble-button-background[class] {
        background-color: var(--bonbon-card-background) !important;
      }
    `,
    bubbleSeparatorSubButtonBase: css`
      .bubble-sub-button[class*='background'] {
        background-color: var(
          --ha-card-background,
          var(--card-background-color, #fff)
        );
        box-shadow: 0 2px 6px rgba(0, 0, 0, ${isDark ? '0.2' : '0.05'});
      }
      .bubble-sub-button-container:has(.background-on) .bubble-sub-button {
        color: #fff;
        background-color: var(--bubble-default-color);
      }
    `,
    bubbleSeparatorLightsSubButtonAlways: css`
      [data-group-id=\"g_main_0\"] .bubble-sub-button,
      .bubble-sub-button-container:not(:has(.background-on))
        [data-group-id=\"g_main_0\"]
        .bubble-sub-button {
        background-color: var(
          --ha-card-background,
          var(--card-background-color, #fff)
        );
        box-shadow: 0 2px 6px rgba(0, 0, 0, ${isDark ? '0.2' : '0.05'});
      }
      .bubble-sub-button-container:has(.background-on)
        [data-group-id=\"g_main_0\"]
        .bubble-sub-button {
        color: #fff;
        background-color: var(--bubble-default-color);
      }
      .bubble-sub-button-container:has(.background-on)
        [data-group-id=\"g_main_0\"]
        .bubble-sub-button:not([data-tap-action*='light.turn_off']),
      .bubble-sub-button-container:has(.background-on)
        [data-group-id=\"g_main_0\"]
        .bubble-sub-button[data-tap-action*='light.turn_off']
        ~ .bubble-sub-button[data-tap-action*='light.turn_off'] {
        display: none !important;
      }
      .bubble-sub-button-container:not(:has(.background-on))
        [data-group-id=\"g_main_0\"]
        .bubble-sub-button:not([data-tap-action*='light.turn_on']),
      .bubble-sub-button-container:not(:has(.background-on))
        [data-group-id=\"g_main_0\"]
        .bubble-sub-button[data-tap-action*='light.turn_on']
        ~ .bubble-sub-button[data-tap-action*='light.turn_on'] {
        display: none !important;
      }
    `,
    bubbleSeparatorLightsSubButtonDefault: css`
      [data-group-id=\"g_main_0\"] .bubble-sub-button {
        background-color: var(
          --ha-card-background,
          var(--card-background-color, #fff)
        );
        box-shadow: 0 2px 6px rgba(0, 0, 0, ${isDark ? '0.2' : '0.05'});
      }
      [data-group-id=\"g_main_0\"] .background-on {
        color: #fff;
        background-color: var(--bubble-default-color);
      }
      .bubble-sub-button-container
        [data-group-id=\"g_main_0\"]
        .bubble-sub-button:not(.background-on),
      .bubble-sub-button-container
        [data-group-id=\"g_main_0\"]
        .bubble-sub-button.background-on
        ~ .bubble-sub-button.background-on {
        display: none !important;
      }
    `,
    bubbleAreaSubButtonAlways: css`
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
        font-size: 16px;
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
      .bubble-sub-button-container.fixed-top .bubble-sub-button {
        background: var(--area-medium-color) !important;
      }
      .bubble-container:hover
        .bubble-sub-button-container.fixed-top
        .bubble-sub-button,
      .bubble-container:hover
        .bubble-sub-button-container.fixed-top:not(:has(.background-on))
        .bubble-sub-button {
        background: var(--area-shade-color) !important;
      }
      .bubble-sub-button-container.fixed-top .background-on {
        background: var(--area-medium-color) !important;
      }
      .bubble-container:hover
        .bubble-sub-button-container.fixed-top
        .background-on {
        background: var(--area-shade-color) !important;
      }
      .bubble-sub-button-container.fixed-top
        .bubble-sub-button:not(.background-on),
      .bubble-sub-button-container.fixed-top
        .bubble-sub-button.background-on
        ~ .bubble-sub-button.background-on {
        display: none !important;
      }
    `,
    bubbleAreaSubButtonDefault: css`
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
        font-size: 16px;
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
      .bubble-sub-button-container.fixed-top .bubble-sub-button,
      .bubble-sub-button-container.fixed-top:not(:has(.background-on))
        .bubble-sub-button {
        background: var(--area-medium-color) !important;
      }
      .bubble-container:hover
        .bubble-sub-button-container.fixed-top
        .bubble-sub-button,
      .bubble-container:hover
        .bubble-sub-button-container.fixed-top:not(:has(.background-on))
        .bubble-sub-button {
        background: var(--area-shade-color) !important;
      }
      .bubble-sub-button-container.fixed-top:has(.background-on)
        .bubble-sub-button,
      .bubble-container:hover
        .bubble-sub-button-container.fixed-top:has(.background-on)
        .bubble-sub-button {
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
          var(--bubble-icon-border-radius, var(--bonbon-border-radius, 50%))
        ) !important;
        background-color: var(
          --bubble-button-icon-background-color,
          var(
            --bubble-icon-background-color,
            var(
              --bubble-secondary-background-color,
              var(--card-background-color, var(--ha-card-background))
            )
          )
        ) !important;
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
