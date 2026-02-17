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

function hexToRGB(hex) {
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  const r = parseInt(hex.slice(-6, -4), 16);
  const g = parseInt(hex.slice(-4, -2), 16);
  const b = parseInt(hex.slice(-2), 16);
  return { r: r / 255, g: g / 255, b: b / 255 };
}

function rgbToLAB(rgb) {
  let r =
    rgb.r > 0.04045 ? Math.pow((rgb.r + 0.055) / 1.055, 2.4) : rgb.r / 12.92;
  let g =
    rgb.g > 0.04045 ? Math.pow((rgb.g + 0.055) / 1.055, 2.4) : rgb.g / 12.92;
  let b =
    rgb.b > 0.04045 ? Math.pow((rgb.b + 0.055) / 1.055, 2.4) : rgb.b / 12.92;

  let x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  let z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  x /= 0.95047;
  y /= 1.0;
  z /= 1.08883;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const lab_b = 200 * (y - z);

  return { l, a, b: lab_b };
}

function labToRGB(lab) {
  let y = (lab.l + 16) / 116;
  let x = lab.a / 500 + y;
  let z = y - lab.b / 200;

  x = Math.pow(x, 3) > 0.008856 ? Math.pow(x, 3) : (x - 16 / 116) / 7.787;
  y = Math.pow(y, 3) > 0.008856 ? Math.pow(y, 3) : (y - 16 / 116) / 7.787;
  z = Math.pow(z, 3) > 0.008856 ? Math.pow(z, 3) : (z - 16 / 116) / 7.787;

  x *= 0.95047;
  y *= 1.0;
  z *= 1.08883;

  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let b = x * 0.0557 + y * -0.204 + z * 1.057;

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

  return {
    r: Math.max(0, Math.min(1, r)),
    g: Math.max(0, Math.min(1, g)),
    b: Math.max(0, Math.min(1, b)),
  };
}

function rgbToHSL(rgb) {
  const r = rgb.r;
  const g = rgb.g;
  const b = rgb.b;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
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

function hexToHSL(hex) {
  const rgb = hexToRGB(hex);
  return rgbToHSL(rgb);
}

export function getColorsFromColor(color, isDark) {
  const step = 3;

  const rgb = hexToRGB(color);
  const lab = rgbToLAB(rgb);

  const minLightness = 75;
  const maxLightness = 100;

  const minLightnessDark = 0;
  const maxLightnessDark = 25;

  const minLightnessActive = 50;
  const maxLightnessActive = 60;

  const activeL = Math.min(
    Math.max(lab.l, minLightnessActive),
    maxLightnessActive,
  );

  if (!isDark) {
    lab.l = Math.min(Math.max(lab.l, minLightness), maxLightness);
  } else {
    lab.l = Math.min(Math.max(lab.l, minLightnessDark), maxLightnessDark);
  }

  if (lab.l > 100 - step) {
    lab.l = 100 - step;
  }
  if (lab.l < step) {
    lab.l = step;
  }

  const lightL = Math.round(Math.min(100, lab.l * (1 + step / 100)));
  const mediumL = lab.l;
  const shadeL = Math.round(Math.max(0, lab.l * (1 - step / 100)));

  const lightRgb = labToRGB({ l: lightL, a: lab.a, b: lab.b });
  const mediumRgb = labToRGB({ l: mediumL, a: lab.a, b: lab.b });
  const shadeRgb = labToRGB({ l: shadeL, a: lab.a, b: lab.b });
  const activeRgb = labToRGB({ l: activeL, a: lab.a, b: lab.b });

  const lightHsl = rgbToHSL(lightRgb);
  const mediumHsl = rgbToHSL(mediumRgb);
  const shadeHsl = rgbToHSL(shadeRgb);
  const activeHsl = rgbToHSL(activeRgb);

  return {
    activeColor: `hsl(${activeHsl.h}, ${activeHsl.s}%, ${activeHsl.l}%)`,
    lightColor: `hsl(${lightHsl.h}, ${lightHsl.s}%, ${lightHsl.l}%)`,
    mediumColor: `hsl(${mediumHsl.h}, ${mediumHsl.s}%, ${mediumHsl.l}%)`,
    shadeColor: `hsl(${shadeHsl.h}, ${shadeHsl.s}%, ${shadeHsl.l}%)`,
  };
}

export function getAreaColors(area, index, areas, isDark, styles) {
  if (area.floor_id == null) {
    area.floor_id = '_areas';
  }
  const step = 3;

  if (area.label) {
    const hexMatch = area.label.match(
      /^(bonbon_)?color_([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    );
    if (hexMatch) {
      const hexCode = `#${hexMatch[2]}`;
      return getColorsFromColor(hexCode, isDark);
    }
  }

  if (!styles.use_bonbon_colors) {
    const baseColor = isDark
      ? styles.card_background_color_dark
      : styles.card_background_color_light;

    return getColorsFromColor(baseColor, isDark);
  }

  const seed = area.area_id + String(index) + area.name;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash % areas.length);

  const hue = (colorIndex * (360 / areas.length)) % 360;
  const saturation = isDark ? 20 : 40;
  let labLightness = isDark ? 35 : 75;

  const hslForLab = { h: hue, s: saturation, l: labLightness };

  const hh = hslForLab.h / 60;
  const c = (1 - Math.abs((2 * labLightness) / 100 - 1)) * (hslForLab.s / 100);
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r, g, b;

  if (hh < 1) [r, g, b] = [c, x, 0];
  else if (hh < 2) [r, g, b] = [x, c, 0];
  else if (hh < 3) [r, g, b] = [0, c, x];
  else if (hh < 4) [r, g, b] = [0, x, c];
  else if (hh < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const m = labLightness / 100 - c / 2;
  const hslRgb = {
    r: Math.round((r + m) * 255) / 255,
    g: Math.round((g + m) * 255) / 255,
    b: Math.round((b + m) * 255) / 255,
  };

  const lab = rgbToLAB(hslRgb);

  const minLightness = 75;
  const maxLightness = 100;
  const minLightnessDark = 0;
  const maxLightnessDark = 25;

  if (!isDark) {
    lab.l = Math.min(Math.max(lab.l, minLightness), maxLightness);
  } else {
    lab.l = Math.min(Math.max(lab.l, minLightnessDark), maxLightnessDark);
  }

  if (lab.l > 100 - step) {
    lab.l = 100 - step;
  }
  if (lab.l < step) {
    lab.l = step;
  }

  const lightL = Math.round(Math.min(100, lab.l * (1 + step / 100)));
  const mediumL = lab.l;
  const shadeL = Math.round(Math.max(0, lab.l * (1 - step / 100)));

  const lightRgb = labToRGB({ l: lightL, a: lab.a, b: lab.b });
  const mediumRgb = labToRGB({ l: mediumL, a: lab.a, b: lab.b });
  const shadeRgb = labToRGB({ l: shadeL, a: lab.a, b: lab.b });

  const lightHsl = rgbToHSL(lightRgb);
  const mediumHsl = rgbToHSL(mediumRgb);
  const shadeHsl = rgbToHSL(shadeRgb);

  return {
    lightColor: `hsl(${lightHsl.h}, ${lightHsl.s}%, ${lightHsl.l}%)`,
    mediumColor: `hsl(${mediumHsl.h}, ${mediumHsl.s}%, ${mediumHsl.l}%)`,
    shadeColor: `hsl(${shadeHsl.h}, ${shadeHsl.s}%, ${shadeHsl.l}%)`,
  };
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
        if (!isObject(target[key])) {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
  }

  return mergeDeep(target, ...sources);
}
