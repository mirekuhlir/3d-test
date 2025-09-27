import { addEnvironmentLights } from './lights.js';
import { addGround } from './ground.js';
import { addScatterDecor } from './decor.js';
import { addMainRoute, addAlternateRoute } from './routes.js';
import { addSlopeTestArea } from './slopes.js';
import { addSceneLabel } from './text.js';

export async function addEnvironment(scene, assets = {}) {
  addEnvironmentLights(scene);
  addGround(scene);
  addScatterDecor(scene);
  addMainRoute(scene);
  addAlternateRoute(scene);
  addSlopeTestArea(scene);
  const fontData = assets.fonts?.helvetiker_regular_typeface || assets.fonts?.helvetiker_regular || null;
  if (fontData) {
    addSceneLabel(scene, fontData);
  }
}
