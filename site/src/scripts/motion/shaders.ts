/**
 * Moving mesh gradients (Paper Shaders) behind up to three panels per page, each marked with
 * <span class="shader-layer" data-shader="ideas|talk|arch" aria-hidden="true">. The panel's own
 * CSS gradient shows until the canvas is ready and stays when shaders are skipped: no WebGL,
 * Data Saver on, or a low-memory device. ShaderMount pauses itself off screen; we also pause it
 * while the tab is hidden. Colours: palettes.ts (contrast-tested).
 */
import {
  ShaderMount,
  ShaderFitOptions,
  getShaderColorFromString,
  meshGradientFragmentShader,
} from '@paper-design/shaders';
import { palettes, type ShaderKey } from './palettes';

const MAX_PER_PAGE = 3;

function canRun(): boolean {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

const sizing = {
  u_fit: ShaderFitOptions.cover,
  u_rotation: 0,
  u_scale: 1,
  u_offsetX: 0,
  u_offsetY: 0,
  u_originX: 0.5,
  u_originY: 0.5,
  u_worldWidth: 0,
  u_worldHeight: 0,
};

export function startShaders(): void {
  if (!canRun()) return;
  const layers = [...document.querySelectorAll<HTMLElement>('[data-shader]')].slice(
    0,
    MAX_PER_PAGE,
  );
  const mounts: { mount: ShaderMount; speed: number }[] = [];
  for (const layer of layers) {
    const palette = palettes[layer.dataset.shader as ShaderKey];
    if (!palette) continue;
    const colors = palette.colors.map(getShaderColorFromString);
    try {
      const mount = new ShaderMount(
        layer,
        meshGradientFragmentShader,
        {
          ...sizing,
          u_colors: colors,
          u_colorsCount: colors.length,
          u_distortion: 0.8,
          u_swirl: 0.3,
          u_grainMixer: 0,
          u_grainOverlay: 0,
        },
        undefined,
        palette.speed,
        0,
        1, // minPixelRatio: don't upscale a soft gradient
        1920 * 1080, // maxPixelCount: caps work on large/high-DPR screens
      );
      mounts.push({ mount, speed: palette.speed });
      requestAnimationFrame(() => layer.classList.add('is-live'));
    } catch {
      // Leave the CSS gradient in place.
    }
  }
  document.addEventListener('visibilitychange', () => {
    for (const { mount, speed } of mounts) mount.setSpeed(document.hidden ? 0 : speed);
  });
}
