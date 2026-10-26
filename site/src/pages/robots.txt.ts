import type { APIRoute } from 'astro';
import { site } from '../config/site';
import { withBase } from '../config/paths';

/**
 * Generated (not a static public/ file) so the sitemap URL can never drift from site.url.
 *
 * Everyone may crawl everything. The AI crawlers are also named one by one: some site owners block
 * them by default, and we sell being found in AI answers, so our own site says plainly that search,
 * answer and training crawlers are all welcome. To opt out of model training later, add
 * `Disallow: /` under the training-only agents (GPTBot, ClaudeBot, Google-Extended,
 * Applebot-Extended, CCBot, meta-externalagent) and keep the search and user agents allowed.
 */
const aiAgents = [
  // OpenAI: search index, user-triggered fetches, training.
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  // Anthropic: search index, user-triggered fetches, training.
  'Claude-SearchBot',
  'Claude-User',
  'ClaudeBot',
  // Perplexity: index and user-triggered fetches.
  'PerplexityBot',
  'Perplexity-User',
  // Google Gemini and AI training (Googlebot itself covers AI Overviews and AI Mode).
  'Google-Extended',
  // Apple Intelligence and Siri.
  'Applebot',
  'Applebot-Extended',
  // Microsoft Copilot runs on Bing's index.
  'Bingbot',
  // Others that feed AI answers.
  'DuckAssistBot',
  'MistralAI-User',
  'meta-externalagent',
  'Amazonbot',
  'CCBot',
];

export const GET: APIRoute = () => {
  const abs = (path: string) => new URL(withBase(path), site.url).toString();
  const body = [
    `# ${site.fullName}: ${abs('/')}`,
    `# A plain-text guide for AI tools: ${abs('/llms.txt')} (full version: ${abs('/llms-full.txt')})`,
    '',
    'User-agent: *',
    'Allow: /',
    '',
    '# AI search, answer and training crawlers: all welcome.',
    ...aiAgents.map((agent) => `User-agent: ${agent}`),
    'Allow: /',
    '',
    `Sitemap: ${abs('/sitemap-index.xml')}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
