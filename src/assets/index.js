/**
 * Assets index: declares and exports a manifest of loadable assets for the app.
 *
 * - Uses Vite's `import.meta.glob` to eagerly collect file URLs for textures, models, and fonts
 * - Derives human-friendly asset names from file paths (file name without extension)
 * - Optionally normalizes names (fonts replace dots with underscores) to produce stable keys
 * - Exports `assetsPlan` with arrays of `{ name, url }` entries per asset kind
 */

// Eagerly import asset file URLs from the filesystem using Vite glob imports
// Note: `as: "url"` makes each import resolve to a URL string at build time
// Map of texture file path -> URL (images)
const textureModules = import.meta.glob('./textures/**/*.{jpg,jpeg,png,webp}', { eager: true, as: 'url' });
// Map of 3D model file path -> URL (GLTF/GLB)
const modelModules = import.meta.glob('./models/**/*.{glb,gltf}', { eager: true, as: 'url' });
// Map of font file path -> URL (three.js JSON font)
const fontModules = import.meta.glob('./fonts/**/*.json', { eager: true, as: 'url' });

/**
 * Convert a glob result map (path -> url) to an array of entries.
 * Each entry contains a derived `name` (file name without extension) and the `url`.
 *
 * @param {Record<string, string>} globResult - Map of file path to URL
 * @param {{ normalizeName?: (name: string) => string }} [options]
 * @returns {{ name: string, url: string }[]}
 */
function toEntries(globResult, { normalizeName } = {}) {
  return Object.entries(globResult).map(([path, url]) => {
    let name = path.split('/').pop().replace(/\.[^.]+$/, '');
    if (normalizeName) {
      name = normalizeName(name);
    }
    return { name, url };
  });
}

// Public asset manifest consumed by the runtime/loader
export const assetsPlan = {
  models: toEntries(modelModules),
  textures: toEntries(textureModules),
  // For fonts, replace dots in file names with underscores to ensure stable keys
  fonts: toEntries(fontModules, { normalizeName: (value) => value.replace(/\./g, '_') }),
};
