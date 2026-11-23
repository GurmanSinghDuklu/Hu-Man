/**
 * Portfolio requests from the form on /contact/ (spec:
 * docs/superpowers/specs/2026-11-23-self-serve-portfolios-design.md). Always for a logged-in
 * account. Three steps, so the CV can go to private storage before sending:
 *   POST /api/account/request            { answers, route, concept, projectId? } → draft project
 *   POST /api/account/files?p=&field=cv  (files.js) the CV, if there is one
 *   POST /api/account/request/send?p=    { answers } → checked, locked, in /admin/, emails sent
 *   GET  /api/account/request?p=         the answers (to edit and rebuild, phase C)
 */
import { json, fail, notFound, readJson, line } from './http.js';
import { projectFor } from './account.js';
import {
  validateRequest,
  requestFields,
  requestAnswerText,
} from '../../src/data/portfolioRequest.ts';
import { portfolioConcepts } from '../../src/data/portfolioConcepts.ts';
import { saveEnquiry } from './enquiries.js';
import { tellStudio } from './mail.js';
import { sendToPerson } from './send.js';

const ROUTES = { instant: 'Choose design + upload CV', custom: 'Custom made portfolio' };
const conceptName = (value) => portfolioConcepts.find((c) => c.name === value)?.name ?? null;

async function ownRequest(env, user, id) {
  const project = await projectFor(env, user, id);
  return project && project.user_id === user.id && project.kind === 'request' ? project : null;
}

/** POST /api/account/request : creates (or updates) the draft. */
export async function saveRequest(request, env, user, now = Date.now()) {
  const body = await readJson(request);
  if (!body) return fail(413, 'That’s too much to save in one go.');
  const route = body.route === 'instant' ? 'instant' : 'custom';
  const concept = conceptName(body.concept);
  if (route === 'instant' && !concept) {
    return fail(400, 'Choose a design for us to build from.', {
      errors: { concept: 'Choose a design.' },
    });
  }
  const { answers } = validateRequest(body.answers);
  const name =
    [answers.firstName, answers.surname].filter(Boolean).join(' ') || user.name || 'Your portfolio';

  let project = body.projectId ? await ownRequest(env, user, body.projectId) : null;
  if (project) {
    const sent = await env.DB.prepare('SELECT state FROM briefs WHERE project_id = ?')
      .bind(project.id)
      .first('state');
    if (sent === 'sent' && project.route !== 'instant')
      return fail(409, 'This request has been sent.');
    await env.DB.batch([
      env.DB.prepare('UPDATE projects SET name = ?, route = ?, concept = ? WHERE id = ?').bind(
        `${name}’s portfolio`,
        route,
        concept,
        project.id,
      ),
      env.DB.prepare('UPDATE briefs SET answers = ?, updated_at = ? WHERE project_id = ?').bind(
        JSON.stringify(answers),
        now,
        project.id,
      ),
    ]);
  } else {
    const id = crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO projects (id, user_id, name, type, concept, kind, route, created_at) VALUES (?, ?, ?, 'portfolio', ?, 'request', ?, ?)",
      ).bind(id, user.id, `${name}’s portfolio`, concept, route, now),
      env.DB.prepare('INSERT INTO briefs (project_id, answers, updated_at) VALUES (?, ?, ?)').bind(
        id,
        JSON.stringify(answers),
        now,
      ),
    ]);
    project = { id };
  }
  return json({ ok: true, projectId: project.id });
}

/** GET /api/account/request?p= */
export async function getRequest(url, env, user) {
  const project = await projectFor(env, user, url.searchParams.get('p'));
  if (!project || project.kind !== 'request') return notFound();
  const row = await env.DB.prepare('SELECT answers, state FROM briefs WHERE project_id = ?')
    .bind(project.id)
    .first();
  return json({
    ok: true,
    projectId: project.id,
    route: project.route,
    concept: project.concept,
    state: row?.state ?? 'draft',
    answers: row ? JSON.parse(row.answers) : {},
  });
}

/** The studio's copy: every answer, and where to read it. */
function summary(user, project, answers, files, origin) {
  const lines = [
    `${user.name} (${user.email}) has sent a portfolio request.`,
    `Route: ${ROUTES[project.route] ?? project.route}${project.concept ? ` · Design: ${project.concept}` : ''}`,
    '',
  ];
  for (const field of requestFields) {
    if (field.kind === 'consent') continue;
    const text = requestAnswerText(field, answers[field.id]);
    if (text) lines.push(`${field.label}: ${text}`);
  }
  if (files.length) lines.push('', `CV: ${files.map((f) => f.name).join(', ')}`);
  lines.push('', `Read it and download the CV: ${origin}/admin/client/?id=${user.id}`);
  return lines.join('\n');
}

/** POST /api/account/request/send?p= { answers } */
export async function sendRequest(request, url, env, user, now = Date.now()) {
  const project = await ownRequest(env, user, url.searchParams.get('p'));
  if (!project) return notFound();
  const state = await env.DB.prepare('SELECT state FROM briefs WHERE project_id = ?')
    .bind(project.id)
    .first('state');
  if (state === 'sent') return fail(409, 'This request has already been sent.');
  const body = (await readJson(request)) ?? {};
  const { answers, errors } = validateRequest(body.answers, { sending: true });
  await env.DB.prepare('UPDATE briefs SET answers = ?, updated_at = ? WHERE project_id = ?')
    .bind(JSON.stringify(answers), now, project.id)
    .run();
  if (Object.keys(errors).length)
    return fail(400, 'A few things need filling in before you send.', { errors });

  await env.DB.prepare(
    "UPDATE briefs SET state = 'sent', consent_at = ?, sent_at = ? WHERE project_id = ?",
  )
    .bind(now, now, project.id)
    .run();
  const { results: files } = await env.DB.prepare('SELECT name FROM files WHERE project_id = ?')
    .bind(project.id)
    .all();

  // In the Enquiries list, already linked to their account.
  const enquiryId = await saveEnquiry(
    env,
    {
      name: line(`${answers.firstName ?? ''} ${answers.surname ?? ''}`, 100) || user.name,
      email: user.email,
      phone: answers.phone,
      concept: project.concept,
      service: ROUTES[project.route],
      via: 'Portfolio request',
      message: answers.summary || answers.jobTitle,
      topic: 'website',
    },
    '/contact/',
    now,
  );
  await env.DB.prepare('UPDATE enquiries SET user_id = ? WHERE id = ?')
    .bind(user.id, enquiryId)
    .run();

  await tellStudio(
    env,
    `[Portfolio request] ${ROUTES[project.route]}${project.concept ? `: ${project.concept}` : ''} from ${user.name}`,
    summary(user, project, answers, files, url.origin),
  );
  await sendToPerson(env, {
    to: user.email,
    subject: 'We’ve got your portfolio request',
    text:
      project.route === 'instant'
        ? `Thanks${answers.firstName ? `, ${answers.firstName}` : ''}. We've got your details${project.concept ? ` and your chosen design (${project.concept})` : ''}.\n\nYour portfolio is in your account: ${url.origin}/account/\n\nA person at Hu/man also reads every request. Reply to this email any time.`
        : `Thanks${answers.firstName ? `, ${answers.firstName}` : ''}. We've got your request for a custom made portfolio${project.concept ? `, starting from the ${project.concept} design` : ''}.\n\nA real person will read it and reply by email within 48 hours. You can see what you sent in your account: ${url.origin}/account/`,
  });
  return json({ ok: true, projectId: project.id, route: project.route });
}
