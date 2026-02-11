export const css = (strings, ...values) =>
  strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');

export const getStyles = (isDark) => {
  const shadowOverlay = css`
    border-radius: var(--bubble-button-border-radius);
    pointer-events: none;
    display: block;
    content: '';
    inset: 0;
    position: absolute;
    box-shadow: var(--bonbon-box-shadow);
  `;
  const globalStyles = css`
    :host {
      --primary-text-color: ${isDark ? '#eee' : '#111'};
      --bubble-line-background-color: rgba(0, 0, 0, 0.05);
      --bubble-main-background-color: var(
        --ha-card-background,
        var(--card-background-color, #fff)
      );
      --bubble-border-radius: var(--ha-card-border-radius, 12px);
      --bubble-icon-border-radius: 8px;
      --bubble-sub-button-border-radius: 8px;
      --bubble-button-border-radius: var(--bubble-border-radius);
      --bonbon-box-shadow:
        0 2px 6px rgba(0, 0, 0, ${isDark ? '0.2' : '0.05'}),
        inset 0 0.5px 0 0 rgba(255, 255, 255, ${isDark ? '0.01' : '0.2'}),
        inset 0 -0.5px 0 0 rgba(0, 0, 0, ${isDark ? '0.8' : '0.10'});
    }
    *,
    *:before,
    *:after {
      --bubble-default-color: #9373c9;
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
          transition: all 0.3s ease-out !important;
        }
        .bubble-sub-button-name-container {
          white-space: nowrap !important;
        }
        .is-off .bubble-main-icon {
          opacity: 1;
        }
        .bubble-button-background {
          background-color: var(
            --ha-card-background,
            var(--card-background-color, #fff)
          );
        }
        .is-on .bubble-button-background {
          background-color: var(--bubble-default-color) !important;
          opacity: 1 !important;
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
        mwc-list-item[selected],
        mwc-list-item[selected] ha-icon,
        .is-on
          :not(.bubble-media-player)
          > .bubble-content-container
          .bubble-name-container {
          color: #fff !important;
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
      .is-on
        :not(.bubble-media-player)
        > .bubble-content-container
        .bubble-name-container[class] {
        color: var(--primary-text-color) !important;
      }
      .is-on .bubble-button-background[class] {
        background-color: var(
          --ha-card-background,
          var(--card-background-color, #fff)
        ) !important;
        opacity: 1 !important;
      }
    `,
    bubbleSubButtonAlternate: css`
      .bubble-sub-button,
      .bubble-sub-button-container:not(:has(.background-on))
        .bubble-sub-button {
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
      .bubble-sub-button-container:has(.background-on)
        .bubble-sub-button:not([data-tap-action*='light.turn_off']),
      .bubble-sub-button-container:has(.background-on)
        .bubble-sub-button[data-tap-action*='light.turn_off']
        ~ .bubble-sub-button[data-tap-action*='light.turn_off'] {
        display: none !important;
      }
      .bubble-sub-button-container:not(:has(.background-on))
        .bubble-sub-button:not([data-tap-action*='light.turn_on']),
      .bubble-sub-button-container:not(:has(.background-on))
        .bubble-sub-button[data-tap-action*='light.turn_on']
        ~ .bubble-sub-button[data-tap-action*='light.turn_on'] {
        display: none !important;
      }
    `,
    bubbleSubButtonRegular: css`
      .bubble-sub-button {
        background-color: var(
          --ha-card-background,
          var(--card-background-color, #fff)
        );
        box-shadow: 0 2px 6px rgba(0, 0, 0, ${isDark ? '0.2' : '0.05'});
      }
      .background-on {
        color: #fff;
        background-color: var(--bubble-default-color);
      }
      .bubble-sub-button-container .bubble-sub-button:not(.background-on),
      .bubble-sub-button-container
        .bubble-sub-button.background-on
        ~ .bubble-sub-button.background-on {
        display: none !important;
      }
    `,
    bubbleAreaSubButtonAlternate: css`
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
        background: var(--area-reglr-color);
        position: absolute;
        top: 50%;
        right: -4px;
        transform: translateY(-50%);
        border-radius: 50%;
      }
      .bubble-container:hover .bubble-button-background {
        background: var(--area-reglr-color) !important;
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
        background: var(--area-reglr-color) !important;
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
        background: var(--area-reglr-color) !important;
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
    bubbleAreaSubButtonRegular: css`
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
        background: var(--area-reglr-color);
        position: absolute;
        top: 50%;
        right: -4px;
        transform: translateY(-50%);
        border-radius: 50%;
      }
      .bubble-container:hover .bubble-button-background {
        background: var(--area-reglr-color) !important;
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
        background: var(--area-reglr-color) !important;
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
      :host * {
        transition: none !important;
      }
      ha-card {
        padding: 0 !important;
        min-height: 56px !important;
        overflow: visible !important;
        border: none !important;
      }
      ha-card:after {
        ${shadowOverlay}
      }
      ha-card:hover:before {
        content: '';
        display: block;
        inset: 0;
        position: absolute;
        background-color: var(
          --md-ripple-hover-color,
          var(--md-sys-color-on-surface, #5e5e5e)
        );
        opacity: var(--md-ripple-hover-opacity, 0.04);
        border-radius: var(--bubble-button-border-radius);
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
          var(--bubble-icon-border-radius, var(--bubble-border-radius, 50%))
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
    weatherCard: css`
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
      ha-card:hover:before {
        content: '';
        display: block;
        inset: 0;
        position: absolute;
        background-color: var(
          --md-ripple-hover-color,
          var(--md-sys-color-on-surface, #5e5e5e)
        );
        opacity: var(--md-ripple-hover-opacity, 0.04);
        border-radius: var(--bubble-button-border-radius);
      }
    `,
  };
  return styles;
};
