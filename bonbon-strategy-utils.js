export function getWeatherIcon(weatherType) {
  switch (weatherType) {
    case 'cloudy':
      return 'mdi:weather-cloudy';
    case 'partlycloudy':
      return 'mdi:weather-partly-cloudy';
    case 'rainy':
      return 'mdi:weather-rainy';
    case 'snowy':
      return 'mdi:weather-snowy';
    case 'sunny':
      return 'mdi:weather-sunny';
    case 'clear-night':
      return 'mdi:weather-night';
    case 'fog':
      return 'mdi:weather-fog';
    case 'hail':
      return 'mdi:weather-hail';
    case 'lightning':
      return 'mdi:weather-lightning';
    case 'lightning-rainy':
      return 'mdi:weather-lightning-rainy';
    case 'pouring':
      return 'mdi:weather-pouring';
    case 'windy':
      return 'mdi:weather-windy';
    case 'windy-variant':
      return 'mdi:weather-windy-variant';
    case 'exceptional':
      return 'mdi:alert-circle-outline';
    default:
      return 'mdi:weather-cloudy';
  }
}

function hexToHSL(hex) {
  let r = parseInt(hex.slice(-6, -4), 16) / 255;
  let g = parseInt(hex.slice(-4, -2), 16) / 255;
  let b = parseInt(hex.slice(-2), 16) / 255;

  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function getAreaColors(
  area,
  index,
  areas,
  isDark,
  accentColor,
  bonbon_colors,
) {
  if (area.floor_id == null) {
    area.floor_id = '_areas';
  }
  const seed = area.area_id + String(index) + area.name;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash % areas.length);

  const accentHsl = hexToHSL(accentColor);

  const hue = bonbon_colors
    ? (colorIndex * (360 / areas.length)) % 360
    : accentHsl.h;
  const saturation = bonbon_colors ? (isDark ? 20 : 40) : isDark ? 24 : 60;
  const lightness = bonbon_colors ? (isDark ? 40 : 77) : isDark ? 35 : 88;

  const lightColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const reglrColor = `hsl(${hue}, ${saturation}%, ${lightness - 5}%)`;
  const shadeColor = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;

  return { lightColor, reglrColor, shadeColor };
}

export function androidGesturesFix() {
  if (!document.querySelectorAll('.android-gestures-fix').length) {
    const androidGesturesFix = document.createElement('div');
    androidGesturesFix.classList.add('android-gestures-fix');
    Object.assign(androidGesturesFix.style, {
      display: 'block',
      position: 'absolute',
      zIndex: '1000',
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      pointerEvents: 'none',
    });
    const fixLeft = document.createElement('div');
    Object.assign(fixLeft.style, {
      display: 'block',
      position: 'absolute',
      top: 0,
      pointerEvents: 'all',
      width: '20px',
      height: '100%',
      left: 0,
      pointerEvents: 'all',
    });
    const fixRight = document.createElement('div');
    Object.assign(fixRight.style, {
      display: 'block',
      position: 'absolute',
      top: 0,
      pointerEvents: 'all',
      width: '20px',
      height: '100%',
      right: 0,
      pointerEvents: 'all',
    });
    androidGesturesFix.append(fixLeft, fixRight);
    document.body.append(androidGesturesFix);
  }
}

export function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}
