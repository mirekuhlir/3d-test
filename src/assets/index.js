const textureModules = import.meta.glob('./textures/**/*.{jpg,jpeg,png,webp}', { eager: true, as: 'url' });
const modelModules = import.meta.glob('./models/**/*.{glb,gltf}', { eager: true, as: 'url' });
const fontModules = import.meta.glob('./fonts/**/*.json', { eager: true, as: 'url' });

function toEntries(globResult) {
  return Object.entries(globResult).map(([path, url]) => {
    const name = path.split('/').pop().replace(/\.[^.]+$/, '');
    return { name, url };
  });
}

export const assetsPlan = {
  models: toEntries(modelModules),
  textures: toEntries(textureModules),
  fonts: toEntries(fontModules),
};
