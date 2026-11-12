// Runs inline, straight after the /contact/ intro's <template> (components/landing/ContactIntro.astro),
// before first paint. Stamps the cover into the page and locks scrolling, but only on the first
// contact visit in this browser session and never under reduced motion. Its hash is added to the
// CSP in astro.config.mjs from this same file, so editing it never breaks the policy.
(function () {
  var template = document.currentScript && document.currentScript.previousElementSibling;
  var root = document.documentElement;
  if (!template || !template.content) return;
  try {
    if (sessionStorage.getItem('hm-contact-intro')) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    sessionStorage.setItem('hm-contact-intro', '1');
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
