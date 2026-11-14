/**
 * One way to scroll the page by script, whoever is in charge of scrolling. Native smooth scrolling
 * until Lenis starts (mouse and trackpad only, smooth.ts), which then registers itself here, so a
 * script scroll never fights Lenis's own animation.
 */
interface Scroller {
  /** Glide to this page offset. */
  to(y: number): void;
  /** Where the page is heading (Lenis's target), or where it is. */
  target(): number;
}

let active: Scroller = {
  to: (y) => window.scrollTo({ top: y, behavior: 'smooth' }),
  target: () => window.scrollY,
};

export const scroller: Scroller = {
  to: (y) => active.to(y),
  target: () => active.target(),
};

export function useScroller(next: Scroller): void {
  active = next;
}
