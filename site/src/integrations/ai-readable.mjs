/**
 * After the build, makes every page fully readable to AI tools and crawlers that don't run
 * JavaScript or parse layouts:
 *
 * 1. A clean Markdown copy of each page's <main> at <page>/index.html.md (the llms.txt convention:
 *    "the same URL with .md appended"). Each page links to its copy with rel="alternate".
 * 2. The full wording of every page appended to llms-full.txt, so one file holds everything a
 *    visitor can read on the site, not just the structured facts.
 * 3. Every meaningful image (non-empty alt) added to the sitemap as <image:image>.
 *
 * It reads the built HTML, so it can never miss or misquote anything on the pages. Decorative
 * parts (aria-hidden, empty alt) are left out, exactly as a screen reader would.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);
const SKIP = new Set(['script', 'style', 'template', 'noscript', 'form', 'svg', 'button']);
const BLOCK = new Set([
  'p',
  'div',
  'section',
  'article',
  'header',
  'footer',
  'figure',
  'figcaption',
  'ul',
  'ol',
  'details',
  'summary',
  'table',
  'blockquote',
  'nav',
  'aside',
]);

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const attr = (attrs, name) => {
  const m = attrs.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`));
  return m ? decode(m[1]) : undefined;
};

/** Converts the (compiler-generated, well-formed) HTML of one <main> into Markdown. */
export function htmlToMarkdown(html, pageUrl) {
  const abs = (href) => new URL(href, pageUrl).toString();
  const out = [];
  const links = []; // stack of { start, href } for open <a> tags
  let skipDepth = 0;
  const skipStack = []; // tag names that opened a skipped subtree
  let row = null; // cells of the current table row
  let rows = 0;
  let cell = null;
  let liDepth = 0; // inside a list item, headings and blocks stay inline so the item stays whole

  const emit = (text) => (cell !== null ? (cell += text) : out.push(text));

  const tokens = html.matchAll(
    /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*?)(\/?)>|([^<]+)/g,
  );
  for (const [, closing, rawTag, attrs = '', selfClose, text] of tokens) {
    if (text !== undefined) {
      if (skipDepth === 0) emit(decode(text).replace(/\s+/g, ' '));
      continue;
    }
    if (!rawTag) continue; // comment
    const tag = rawTag.toLowerCase();

    if (skipDepth > 0) {
      if (VOID.has(tag) || selfClose) continue;
      if (!closing) skipStack.push(tag);
      else if (skipStack.at(-1) === tag) {
        skipStack.pop();
        if (skipStack.length === 0) skipDepth = 0;
      }
      continue;
    }

    if (!closing) {
      const hidden = attr(attrs, 'aria-hidden') === 'true';
      if (tag === 'svg' && !hidden && attr(attrs, 'role') === 'img' && attr(attrs, 'aria-label')) {
        emit(`\n\n${attr(attrs, 'aria-label')}.\n\n`);
      }
      if ((SKIP.has(tag) && tag !== 'button') || hidden) {
        if (!VOID.has(tag) && !selfClose) {
          skipDepth = 1;
          skipStack.push(tag);
        }
        continue;
      }
    }

    const level = /^h([1-6])$/.exec(tag)?.[1];
    if (level && liDepth > 0) {
      emit(closing ? '**: ' : ' **');
    } else if (level) {
      emit(closing ? '\n\n' : `\n\n${'#'.repeat(Number(level))} `);
    } else if (tag === 'br') {
      emit(' ');
    } else if (tag === 'li') {
      if (!closing) {
        liDepth += 1;
        emit('\n- ');
      } else liDepth = Math.max(0, liDepth - 1);
    } else if (tag === 'img' && !closing) {
      const alt = attr(attrs, 'alt');
      const img = alt ? `![${alt}](${abs(attr(attrs, 'src'))})` : '';
      if (img) emit(liDepth > 0 ? ` ${img} ` : `\n\n${img}\n\n`);
    } else if (tag === 'a') {
      if (!closing) links.push({ start: out.length, href: attr(attrs, 'href') });
      else {
        const open = links.pop();
        if (open?.href && cell === null) {
          const inner = out.splice(open.start).join('').replace(/\s+/g, ' ').trim();
          const href = /^(mailto:|tel:)/.test(open.href) ? open.href : abs(open.href);
          out.push(inner ? `[${inner}](${href})` : '');
        }
      }
    } else if (tag === 'tr') {
      if (!closing) row = [];
      else if (row) {
        out.push(`\n| ${row.join(' | ')} |`);
        if (rows === 0) out.push(`\n|${row.map(() => ' --- ').join('|')}|`);
        rows += 1;
        row = null;
      }
    } else if (tag === 'th' || tag === 'td') {
      if (!closing) cell = '';
      else if (row) {
        row.push(cell.replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|'));
        cell = null;
      }
    } else if (tag === 'table') {
      if (!closing) rows = 0;
      emit('\n\n');
    } else if (BLOCK.has(tag)) {
      emit(liDepth > 0 && !['ul', 'ol'].includes(tag) ? ' ' : '\n\n');
    }
  }

  return out
    .join('')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/^(- )\s*/gm, '$1')
    .replace(/ \*\*\s+/g, ' **')
    .replace(/\s+\*\*:/g, '**:')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function aiReadable() {
  return {
    name: 'ai-readable',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const distDir = fileURLToPath(dir);
        const sitemapPath = `${distDir}sitemap-0.xml`;
        let sitemap;
        try {
          sitemap = await readFile(sitemapPath, 'utf8');
        } catch {
          return; // a throwaway build (e.g. the social cards) has no sitemap: nothing to do
        }
        const pageUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
        const fullText = [];

        for (const url of pageUrls) {
          const base = new URL(url);
          const rel = base.pathname.replace(/^\//, '');
          // Strip a base path (GitHub Pages preview) by finding the file relative to dist.
          const candidates = [rel, rel.split('/').slice(1).join('/')];
          let file;
          let html;
          for (const c of candidates) {
            try {
              html = await readFile(`${distDir}${c}index.html`, 'utf8');
              file = `${c}index.html`;
              break;
            } catch {
              /* try the next */
            }
          }
          if (!html) continue;

          const title = decode((html.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? '');
          const description = decode(
            (html.match(/<meta name="description" content="([^"]*)"/) ?? [])[1] ?? '',
          );
          const main = html.slice(html.indexOf('<main'), html.indexOf('</main>') + 7);
          const body = htmlToMarkdown(main, url);
          const md = `# ${title}\n\n> ${description}\n\nSource: ${url}\n\n${body}\n`;
          await writeFile(`${distDir}${file}.md`, md);
          fullText.push(
            `## Page: ${title}\n\nSource: ${url}\n\n${body.replace(/^(#{1,4}) /gm, '#$1 ').replace(/^#{5,} /gm, '###### ')}\n`,
          );

          // Image sitemap entries for this page.
          const images = [...main.matchAll(/<img\s[^>]*>/g)]
            .map(([tag]) => ({ src: attr(tag, 'src'), alt: attr(tag, 'alt') }))
            .filter((img) => img.src && img.alt);
          if (images.length) {
            const entries = [...new Set(images.map((img) => new URL(img.src, url).toString()))]
              .map((loc) => `<image:image><image:loc>${loc}</image:loc></image:image>`)
              .join('');
            sitemap = sitemap.replace(`<loc>${url}</loc>`, `<loc>${url}</loc>${entries}`);
          }
        }

        await writeFile(sitemapPath, sitemap);
        const llmsFull = `${distDir}llms-full.txt`;
        const curated = await readFile(llmsFull, 'utf8');
        await writeFile(
          llmsFull,
          `${curated.trimEnd()}\n\n# Every page, word for word\n\nThe complete visible text of each page, for tools that want all of it.\n\n${fullText.join('\n')}`,
        );
        logger.info(
          `Markdown copies for ${fullText.length} pages, llms-full.txt and image sitemap written.`,
        );
      },
    },
  };
}
