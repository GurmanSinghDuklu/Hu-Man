// Runs inline, straight after the /contact/ intro's <template> (components/landing/ContactIntro.astro),
// before first paint. Stamps the cover into the page and locks scrolling on every visit by link or
// typed address, but not on a refresh or Back/Forward, and never under reduced motion. Nothing is
// stored in the browser (see /cookies/): the browser's own record of how the page was opened says
// which it was, the same rule as introWanted() in scripts/hero-intro.ts. Its hash is added to the
// CSP in astro.config.mjs from this same file, so editing it never breaks the policy.
(function () {
  var template = document.currentScript && document.currentScript.previousElementSibling;
  var root = document.documentElement;
  if (!template || !template.content) return;
  try {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (nav && (nav.type === 'reload' || nav.type === 'back_forward')) return;
  } catch {
    return;
  }
  root.classList.add('contact-intro');
  template.replaceWith(template.content.cloneNode(true));
  // Failsafe: if the animation script never starts (blocked, offline), uncover the page.
  setTimeout(function () {
    if (root.hasAttribute('data-intro-running') || !root.classList.contains('contact-intro'))
      return;
    var cover = document.querySelector('[data-intro]');
    if (cover) cover.remove();
    root.classList.remove('contact-intro');
    dispatchEvent(new Event('hm:intro-done'));
  }, 6000);
})();
