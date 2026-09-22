/**
 * Standalone WCAG contrast checker for the redesign token pairs. Not part of
 * the build; run manually after any tokens.css change. See
 * docs/superpowers/specs/2026-09-22-light-redesign-design.md for the pairs
 * this must satisfy.
 */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function luminance([r, g, b]) {
  const chan = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

function contrast(hex1, hex2) {
  const l1 = luminance(hexToRgb(hex1)) + 0.05;
  const l2 = luminance(hexToRgb(hex2)) + 0.05;
  return Math.max(l1, l2) / Math.min(l1, l2);
}

const pairs = [
  // [label, foreground, background, minimum required]
  ['light: ink on chalk', '#14120f', '#faf9f6', 4.5],
  ['light: muted on chalk', '#5c574e', '#faf9f6', 4.5],
  ['light: terracotta on chalk', '#c4471f', '#faf9f6', 4.5],
  ['light: white on terracotta (button/tag text)', '#ffffff', '#c4471f', 4.5],
  ['light: ink on sage (tag text)', '#14120f', '#7a8b5c', 4.5],
  ['light: ink on surface', '#14120f', '#f1efea', 4.5],
  ['light: muted on surface', '#5c574e', '#f1efea', 4.5],
  ['dark: text on bg', '#f2eee6', '#1a1713', 4.5],
  ['dark: muted on bg', '#b8afa0', '#1a1713', 4.5],
  ['dark: terracotta on bg', '#e37b4c', '#1a1713', 4.5],
  ['dark: bg on terracotta (button/tag text)', '#1a1713', '#e37b4c', 4.5],
  ['dark: bg on sage (tag text)', '#1a1713', '#a8bb86', 4.5],
  ['dark: text on surface', '#f2eee6', '#242019', 4.5],
];

let failed = false;
for (const [label, fg, bg, min] of pairs) {
  const ratio = contrast(fg, bg);
  const pass = ratio >= min;
  if (!pass) failed = true;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${ratio.toFixed(2)} (need ${min})`);
}

if (failed) {
  console.error('\nOne or more pairs failed AA contrast.');
  process.exit(1);
}
console.log('\nAll pairs pass AA.');
