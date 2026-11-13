/**
 * The home page's projects section (components/home/ProjectsStage.astro). The one place on the
 * site where scrolling switches content (Gurman, 2026-11-12): the section pins while each project
 * drops onto a 3D laptop (scene.ts). The numbered buttons jump straight to a project.
 *
 * Small and loaded with the page: it only decides between the 3D stage and the plain cards, and
 * sets the runway's height at once so nothing shifts later. three.js (scene.ts) loads only when the
 * section is near the screen. Plain cards stay for reduced motion, Data Saver, low-memory devices
 * and browsers without WebGL.
 */
import { LID } from './constants';

const section = document.querySelector<HTMLElement>('[data-ps]');

function webgl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
const eligible =
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
  !nav.connection?.saveData &&
  (nav.deviceMemory ?? 8) >= 4 &&
  webgl();

if (section && eligible) start(section);

function start(section: HTMLElement): void {
  const runway = section.querySelector<HTMLElement>('[data-ps-runway]')!;
  const canvas = section.querySelector<HTMLCanvasElement>('[data-ps-canvas]')!;
  const items = [...section.querySelectorAll<HTMLElement>('[data-ps-item]')];
  const jumps = [...section.querySelectorAll<HTMLButtonElement>('[data-ps-go]')];
  const count = items.length;
  const total = LID + count;
  const narrow = window.matchMedia('(max-width: 63.99rem)');

  section.classList.add('ps--3d');
  section.style.setProperty('--ps-units', String(total));

  /** Scroll progress through the runway, 0 to `total`. */
  const progressNow = () => {
    const r = runway.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) * total : 0;
  };

  let active = -1;
  const show = (p: number) => {
    const i = Math.min(count - 1, Math.max(0, Math.floor(p - LID + 0.15)));
    if (i === active) return;
    active = i;
    items.forEach((el, n) => el.classList.toggle('is-active', n === i));
    jumps.forEach((b, n) => b.setAttribute('aria-current', n === i ? 'true' : 'false'));
  };
  show(progressNow());

  // A numbered button (or keyboard focus landing in a project's text) scrolls to that project.
  const scrollToProject = (i: number) => {
    const r = runway.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    const y = window.scrollY + r.top + ((LID + i + 0.55) / total) * span;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };
  jumps.forEach((b, i) => b.addEventListener('click', () => scrollToProject(i)));
  items.forEach((el, i) =>
    el.addEventListener('focusin', () => {
      if (i !== active) scrollToProject(i);
    }),
  );

  let stage: import('./scene').Stage | null = null;
  let inView = false;
  const update = () => {
    const p = progressNow();
    show(p);
    stage?.setProgress(p);
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => {
    update();
    stage?.resize();
  });
  narrow.addEventListener('change', () => stage?.resize());

  section.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    stage?.setPointer(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      ((e.clientY - r.top) / r.height) * 2 - 1,
    );
  });

  // Load three.js once the section is near, then draw only while it is on screen.
  let loading = false;
  const load = async () => {
    if (loading) return;
    loading = true;
    const { createStage } = await import('./scene');
    const projects = items.map((el) => ({
      poster: el.dataset.poster ?? '',
      clip: el.dataset.clip ?? '',
    }));
    stage = createStage(canvas, projects, () => narrow.matches);
    stage.setProgress(progressNow());
    await stage.ready;
    section.classList.add('ps--ready');
    stage.setPlaying(inView);
  };
  new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) void load();
    },
    { rootMargin: '1200px 0px' },
  ).observe(section);
  new IntersectionObserver(([entry]) => {
    inView = Boolean(entry?.isIntersecting);
    stage?.setPlaying(inView);
  }).observe(section);
}
