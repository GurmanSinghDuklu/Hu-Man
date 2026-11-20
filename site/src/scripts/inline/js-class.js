// Runs inline in every page's <head> (layouts/BaseLayout.astro), before first paint: marks the page
// as running JavaScript so scroll reveals can start hidden without hiding content from no-JS visitors.
// Its hash is added to the CSP in astro.config.mjs (inlineHash), since Astro doesn't hash is:inline.
document.documentElement.classList.add('js');
