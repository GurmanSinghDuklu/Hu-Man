/**
 * /brand/ entry. The gallery and case-study switcher run at once (small); the Brand Board's code
 * (colour generator, library, uploads, mockups, sending) loads when the board nears the screen, is
 * linked to, or a "start" button is pressed.
 */
import './gallery';
import './casestudy';

let started: Promise<unknown> | null = null;
const board = () => (started ??= import('./board'));

const target = document.getElementById('board');
if (target) {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        void board();
        io.disconnect();
      }
    },
    { rootMargin: '1200px 0px' },
  );
  io.observe(target);
}
document
  .querySelectorAll<HTMLAnchorElement>('a[href$="#board"]')
  .forEach((a) => a.addEventListener('click', () => void board()));
if (location.hash === '#board') void board();
