import type { APIRoute } from 'astro';
import { llmsFullTxt } from '../lib/llms';

/** /llms-full.txt: see src/lib/llms.ts. Served as text so any tool can read it. */
export const GET: APIRoute = () =>
  new Response(llmsFullTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
