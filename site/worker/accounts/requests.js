/**
 * Portfolio requests from the form on /portfolio/start/ ("Fill in details now"). Always for a
 * logged-in account. Three steps, so the CV can go to private storage before sending:
 *   POST /api/account/request             { answers, concept, projectId? } → draft project
 *   POST /api/account/files?p=&field=cv   (files.js) the CV, if there is one
 *   POST /api/account/request/send?p=     { answers } → checked, in /admin/, emails sent
 *   POST /api/account/request/update?p=   { answers } → changes within 3 hours of sending
 *   GET  /api/account/request?p=          the answers, and until when they can be changed
 * A person replies within 48 hours; nothing is built automatically (the team can build a preview
 * from the chosen design in /admin/: instant.js, buildFromDesign).
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

const ROUTES = {
  details: 'Fill in details now',
  instant: 'Built from a design',
  custom: 'Custom made portfolio',
};
/** After sending, details can be added or changed from the dashboard for this long. */
export const EDIT_WINDOW_MS = 3 * 60 * 60 * 1000;
/** When a sent request stops taking changes (ms), or null if it isn't sent. */
export const editableUntil = (brief) =>
  brief?.state === 'sent' && brief.sent_at ? Number(brief.sent_at) + EDIT_WINDOW_MS : null;
const briefOf = (env, projectId) =>
  env.DB.prepare('SELECT state, sent_at FROM briefs WHERE project_id = ?').bind(projectId).first();

/** "14:32 on Tuesday 24 November", in UK time. */
export function ukTime(ms) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).formatToParts(new Date(ms));
  const get = (type) => parts.find((x) => x.type === type)?.value ?? '';
  return `${get('hour')}:${get('minute')} on ${get('weekday')} ${get('day')} ${get('month')}`;
}
const conceptName = (value) => portfolioConcepts.find((c) => c.name === value)?.name ?? null;

async function ownRequest(env, user, id) {
  const project = await projectFor(env, user, id);
  return project && project.user_id === user.id && project.kind === 'request' ? project : null;
}

/** POST /api/account/request : creates (or updates) the draft. */
export async function saveRequest(request, env, user, now = Date.now()) {
  const body = await readJson(request);
  if (!body) return fail(413, 'That’s too much to save in one go.');
  const concept = conceptName(body.concept);
  const { answers } = validateRequest(body.answers);
  const name =
    [answers.firstName, answers.surname].filter(Boolean).join(' ') || user.name || 'Your portfolio';

  let project = body.projectId ? await ownRequest(env, user, body.projectId) : null;
  if (project) {
    const until = editableUntil(await briefOf(env, project.id));
    if (until !== null && now > until) return fail(409, LOCKED);
    await env.DB.batch([
      env.DB.prepare('UPDATE projects SET name = ?, concept = ? WHERE id = ?').bind(
        `${name}’s portfolio`,
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
      ).bind(id, user.id, `${name}’s portfolio`, concept, 'details', now),
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
  const row = await env.DB.prepare(
    'SELECT answers, state, sent_at FROM briefs WHERE project_id = ?',
  )
    .bind(project.id)
    .first();
  return json({
    ok: true,
    projectId: project.id,
    route: project.route,
    concept: project.concept,
    state: row?.state ?? 'draft',
    editableUntil: editableUntil(row),
    answers: row ? JSON.parse(row.answers) : {},
  });
}

const LOCKED =
  'This request can no longer be changed here (changes are open for 3 hours after sending). Reply to our email and we’ll add it for you.';

/** The studio's copy: every answer, and where to read it. */
function summary(user, project, answers, files, origin, updated = false) {
  const lines = [
    `${user.name} (${user.email}) has ${updated ? 'changed their' : 'sent a'} portfolio request.`,
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
    `[Portfolio request] ${project.concept ? `${project.concept}: ` : ''}${user.name}`,
    summary(user, project, answers, files, url.origin),
  );
  const until = now + EDIT_WINDOW_MS;
  await sendToPerson(env, {
    to: user.email,
    subject: 'We’ve got your portfolio request',
    text: [
      `Thanks${answers.firstName ? `, ${answers.firstName}` : ''}. We've got your portfolio request${project.concept ? `, starting from the ${project.concept} design` : ''}.`,
      'A real person will read it and reply by email within 48 hours.',
      `Want to add something? You can add or change details from your dashboard until ${ukTime(until)} (3 hours after sending): ${url.origin}/account/`,
      'After that, just reply to this email.',
    ].join('\n\n'),
  });
  return json({ ok: true, projectId: project.id, editableUntil: until });
}

/** POST /api/account/request/update?p= { answers } : changes within 3 hours of sending. */
export async function updateRequest(request, url, env, user, now = Date.now()) {
  const project = await ownRequest(env, user, url.searchParams.get('p'));
  if (!project) return notFound();
  const until = editableUntil(await briefOf(env, project.id));
  if (until === null) return fail(409, 'This request hasn’t been sent yet.');
  if (now > until) return fail(409, LOCKED);
  const body = (await readJson(request)) ?? {};
  const { answers, errors } = validateRequest(body.answers, { sending: true });
  if (Object.keys(errors).length)
    return fail(400, 'A few things need filling in first.', { errors });
  const concept = body.concept === undefined ? project.concept : conceptName(body.concept);
  await env.DB.batch([
    env.DB.prepare('UPDATE briefs SET answers = ?, updated_at = ? WHERE project_id = ?').bind(
      JSON.stringify(answers),
      now,
      project.id,
    ),
    env.DB.prepare('UPDATE projects SET concept = ? WHERE id = ?').bind(concept, project.id),
  ]);
  const { results: files } = await env.DB.prepare('SELECT name FROM files WHERE project_id = ?')
    .bind(project.id)
    .all();
  await tellStudio(
    env,
    `[Portfolio request changed] ${concept ? `${concept}: ` : ''}${user.name}`,
    summary(user, { ...project, concept }, answers, files, url.origin, true),
  );
  return json({ ok: true, projectId: project.id, editableUntil: until });
}
