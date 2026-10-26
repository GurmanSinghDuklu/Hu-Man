import type { APIRoute } from 'astro';
import { llmsTxt } from '../lib/llms';

/** /llms.txt: see src/lib/llms.ts. Served as text so any tool can read it. */
export const GET: APIRoute = () =>
  new Response(llmsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
