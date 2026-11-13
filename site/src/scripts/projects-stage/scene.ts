/**
 * The 3D scene for the home page's projects section (components/home/ProjectsStage.astro),
 * built with three.js from primitives: no downloaded models. A graphite laptop opens its lid; each
 * project arrives as a sheet that curls through the air and lands flat on the screen, which then
 * plays that project's walkthrough; scrolling on, the sheet peels off and falls away.
 *
 * Everything is driven by one number, the scroll progress P (0 to LID + projects): the lid opens
 * over the first LID units, then each project takes one unit (drop, rest, leave). The caller feeds
 * P in; the scene eases towards it, so it glides even when the scroll jumps.
 */
import {
  ACESFilmicToneMapping,
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Quaternion,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  Euler,
  VideoTexture,
  WebGLRenderer,
  type Texture,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { LID } from './constants';

export interface StageProject {
  poster: string;
  clip: string;
}

export interface Stage {
  /** Resolves once the posters are loaded and the first frame is drawn. */
  ready: Promise<void>;
  setProgress(p: number): void;
  /** Pointer position across the canvas, -1 to 1 on each axis. */
  setPointer(x: number, y: number): void;
  setPlaying(on: boolean): void;
  resize(): void;
}

const DROP = 0.38; // share of a project's unit spent dropping in
const LEAVE = 0.78; // from here on (all but the last project) the sheet peels away

const SCREEN_W = 3.1;
const SCREEN_H = SCREEN_W / 1.6; // the walkthroughs are 16:10
const OPEN = -0.2; // lid angle when open (leaning back a little)
const CLOSED = Math.PI / 2 - 0.03; // lid lying on the keyboard

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export function createStage(
  canvas: HTMLCanvasElement,
  projects: StageProject[],
  narrow: () => boolean,
): Stage {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new PerspectiveCamera(28, 1, 0.1, 100);

  // ---- the laptop ----
  const laptop = new Group();
  scene.add(laptop);
  const shell = new MeshStandardMaterial({ color: 0x1d1f23, metalness: 0.7, roughness: 0.36 });
  const keyMat = new MeshStandardMaterial({ color: 0x101113, metalness: 0.2, roughness: 0.65 });
  const padMat = new MeshStandardMaterial({ color: 0x24262a, metalness: 0.6, roughness: 0.25 });

  const base = new Mesh(new RoundedBoxGeometry(3.4, 0.1, 2.3, 4, 0.045), shell);
  base.position.y = 0.05;
  laptop.add(base);

  const cols = 13;
  const rows = 5;
  const keys = new InstancedMesh(new BoxGeometry(0.2, 0.024, 0.19), keyMat, cols * rows);
  const dummy = new Object3D();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dummy.position.set(-1.44 + c * 0.24, 0.107, -0.96 + r * 0.23);
      dummy.updateMatrix();
      keys.setMatrixAt(r * cols + c, dummy.matrix);
    }
  }
  laptop.add(keys);

  const pad = new Mesh(new PlaneGeometry(1.15, 0.72), padMat);
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(0, 0.1015, 0.62);
  laptop.add(pad);

  // The lid turns on a hinge along the back edge of the base.
  const hinge = new Group();
  hinge.position.set(0, 0.1, -1.12);
  laptop.add(hinge);
  const lid = new Mesh(new RoundedBoxGeometry(3.4, 2.2, 0.06, 4, 0.028), shell);
  lid.position.set(0, 1.1, 0);
  hinge.add(lid);

  const screenMat = new MeshBasicMaterial({ color: 0x07080a, toneMapped: false });
  const screen = new Mesh(new PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
  screen.position.set(0, 1.14, 0.0315);
  hinge.add(screen);
  hinge.rotation.x = CLOSED;

  // ---- one paper sheet per project ----
  const loader = new TextureLoader();
  const posters: Texture[] = [];
  const sheets = projects.map(() => {
    const geometry = new PlaneGeometry(SCREEN_W, SCREEN_H, 40, 24);
    const flat = Float32Array.from(geometry.attributes.position!.array as Float32Array);
    const material = new MeshBasicMaterial({ side: DoubleSide, toneMapped: false });
    const mesh = new Mesh(geometry, material);
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, flat, material, phase: Math.random() * Math.PI * 2 };
  });
  const loads = projects.map(
    (p, i) =>
      new Promise<void>((resolve) => {
        loader.load(
          p.poster,
          (texture) => {
            texture.colorSpace = SRGBColorSpace;
            texture.anisotropy = 4;
            posters[i] = texture;
            sheets[i]!.material.map = texture;
            sheets[i]!.material.needsUpdate = true;
            resolve();
          },
          undefined,
          () => resolve(),
        );
      }),
  );

  // ---- the walkthroughs, made on demand ----
  const videos: (HTMLVideoElement | undefined)[] = [];
  const videoTextures: (VideoTexture | undefined)[] = [];
  const videoFor = (i: number) => {
    if (!videos[i]) {
      const video = document.createElement('video');
      video.src = projects[i]!.clip;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'auto';
      videos[i] = video;
      const texture = new VideoTexture(video);
      texture.colorSpace = SRGBColorSpace;
      videoTextures[i] = texture;
    }
    return { video: videos[i]!, texture: videoTextures[i]! };
  };

  /** Bends a sheet like paper: curled from its bottom edge, with a flutter across it. */
  const bend = (sheet: (typeof sheets)[number], curl: number, flutter: number, time: number) => {
    const attr = sheet.mesh.geometry.attributes.position!;
    const pos = attr.array as Float32Array;
    const { flat } = sheet;
    for (let i = 0; i < pos.length; i += 3) {
      const x = flat[i]!;
      const y0 = flat[i + 1]!;
      let y = y0;
      let z = 0;
      if (Math.abs(curl) > 1e-3) {
        const radius = SCREEN_H / curl;
        const angle = (curl * (y0 + SCREEN_H / 2)) / SCREEN_H;
        y = -SCREEN_H / 2 + radius * Math.sin(angle);
        z = radius * (1 - Math.cos(angle));
      }
      z += flutter * 0.2 * Math.sin(x * 1.7 + time * 2.4 + sheet.phase);
      pos[i] = x;
      pos[i + 1] = y;
      pos[i + 2] = z;
    }
    attr.needsUpdate = true;
  };

  // ---- poses: where a sheet starts, lands and ends ----
  const screenPos = new Vector3();
  const screenQuat = new Quaternion();
  const offset = new Vector3();
  const from = new Vector3();
  const to = new Vector3();
  const qFrom = new Quaternion();
  const qTo = new Quaternion();
  const dropTilt = new Quaternion().setFromEuler(new Euler(-1.15, 0.4, 0.28));
  const leaveTilt = new Quaternion().setFromEuler(new Euler(1.35, -0.35, -0.25));

  let target = 0;
  let progress = 0;
  let px = 0;
  let py = 0;
  let tx = 0;
  let ty = 0;
  let playing = false;
  let raf = 0;
  let shownVideo = -1;

  const layout = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (narrow()) {
      // Far enough back that the whole laptop (about 4 units wide, with its open lid) fits the
      // screen's width, however narrow the phone.
      camera.fov = 34;
      const halfWidth = Math.tan(((camera.fov / 2) * Math.PI) / 180) * camera.aspect;
      const distance = Math.max(13.5, 2.15 / halfWidth);
      camera.position.set(0, 2.9 * (distance / 13.5), distance);
      laptop.position.x = 0;
      camera.lookAt(0, 1.0, 0);
    } else {
      // Left of centre, so the project's text (bottom right) never sits over the laptop.
      camera.fov = 28;
      camera.position.set(0, 2.6, 12.2);
      laptop.position.x = -0.55;
      camera.lookAt(0.35, 0.95, 0);
    }
    camera.updateProjectionMatrix();
  };

  const frame = (now: number) => {
    raf = playing ? requestAnimationFrame(frame) : 0;
    const time = now / 1000;
    progress += (target - progress) * 0.1;
    px += (tx - px) * 0.06;
    py += (ty - py) * 0.06;

    // The laptop floats a little, faces three-quarters on, and turns towards the pointer.
    laptop.rotation.y = -0.32 + px * 0.2;
    laptop.rotation.x = 0.06 + py * 0.06;
    laptop.position.y = Math.sin(time * 0.8) * 0.04;
    hinge.rotation.x = MathUtils.lerp(CLOSED, OPEN, ease(clamp01(progress / LID)));

    laptop.updateMatrixWorld(true);
    screen.getWorldPosition(screenPos);
    screen.getWorldQuaternion(screenQuat);

    let resting = -1;
    sheets.forEach((sheet, i) => {
      const u = progress - LID - i;
      const last = i === sheets.length - 1;
      sheet.mesh.visible = false;
      if (u < 0 || u >= 1) return;
      if (u < DROP) {
        const t = ease(u / DROP);
        offset.set(0.35, 3.8, 1.5).applyQuaternion(screenQuat);
        from.copy(screenPos).add(offset);
        to.copy(screenPos).add(offset.set(0, 0, 0.006).applyQuaternion(screenQuat));
        qFrom.copy(screenQuat).multiply(dropTilt);
        sheet.mesh.position.lerpVectors(from, to, t);
        sheet.mesh.quaternion.slerpQuaternions(qFrom, screenQuat, t);
        bend(sheet, (1 - t) * 1.35, 1 - t, time);
        sheet.mesh.visible = true;
      } else if (u < LEAVE || last) {
        resting = i;
      } else {
        const t = ease((u - LEAVE) / (1 - LEAVE));
        from.copy(screenPos).add(offset.set(0, 0, 0.006).applyQuaternion(screenQuat));
        to.copy(screenPos).add(offset.set(-0.25, -4.2, 2.8));
        qTo.copy(screenQuat).multiply(leaveTilt);
        sheet.mesh.position.lerpVectors(from, to, t);
        sheet.mesh.quaternion.slerpQuaternions(screenQuat, qTo, t);
        bend(sheet, t * 1.6, t * 0.6, time);
        sheet.mesh.visible = true;
      }
    });

    // The screen: the resting project's walkthrough (its poster until the video has a frame).
    if (resting !== shownVideo) {
      videos.forEach((v) => v?.pause());
      shownVideo = resting;
      if (resting >= 0) {
        const { video, texture } = videoFor(resting);
        video.currentTime = 0;
        void video.play().catch(() => {});
        screenMat.map = video.readyState >= 2 ? texture : (posters[resting] ?? null);
        screenMat.color = new Color(0xffffff);
      } else {
        screenMat.map = null;
        screenMat.color = new Color(0x07080a);
      }
      screenMat.needsUpdate = true;
    } else if (resting >= 0 && screenMat.map !== videoTextures[resting]) {
      const video = videos[resting];
      if (video && video.readyState >= 2) {
        screenMat.map = videoTextures[resting]!;
        screenMat.needsUpdate = true;
      }
    }

    renderer.render(scene, camera);
  };

  layout();
  const ready = Promise.all(loads).then(() => {
    renderer.render(scene, camera);
  });

  return {
    ready,
    setProgress(p) {
      target = p;
    },
    setPointer(x, y) {
      tx = x;
      ty = y;
    },
    setPlaying(on) {
      playing = on;
      if (on && !raf) raf = requestAnimationFrame(frame);
      if (!on) {
        cancelAnimationFrame(raf);
        raf = 0;
        videos.forEach((v) => v?.pause());
        shownVideo = -1;
      }
    },
    resize: layout,
  };
}
