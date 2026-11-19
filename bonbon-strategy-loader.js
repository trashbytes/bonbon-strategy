// Local dev loader. Only the dev instance registers this file as a dashboard resource — a HACS
// install loads bonbon-strategy.js directly and never sees it (see AGENTS.md, "Versioning & release log").
const timestamp = new Date().getTime();
const scriptUrl = '/local/bonbon-strategy.js';

// Fallback for the update date when the server answers without a Last-Modified header. The real
// date comes from the served file, so this only needs a bump when the loader itself is touched.
const fallbackUpdated = '2026-11-19';

const readUpdated = async () => {
  try {
    const response = await fetch(`${scriptUrl}?hacstag=${timestamp}`, {
      method: 'HEAD',
      cache: 'no-store',
    });
    const header = response.headers.get('last-modified');
    return header ? new Date(header).toLocaleString() : fallbackUpdated;
  } catch {
    return fallbackUpdated;
  }
};

import(`${scriptUrl}?hacstag=${timestamp}`)
  .then(async (module) => {
    const updated = await readUpdated();
    console.info(
      `Bonbon Strategy v${module.VERSION ?? '?'} geladen — Dateien vom ${updated} (hacstag=${timestamp})`,
    );
  })
  .catch((err) => {
    console.error('Fehler beim Laden von Bonbon Strategy Script:', err);
  });
