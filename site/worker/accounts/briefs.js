/**
 * The project brief: read it, save a draft as the client goes, and send it. Questions and checks
 * come from src/data/brief.ts (shared with the page). Only the project's own client may write;
 * admins may read. Sending locks the brief and emails the studio inbox a plain-text summary.
 */
import { json, fail, notFound, readJson } from './http.js';
import { projectFor } from './account.js';
import { validateBrief, stepsFor, answerText, projectTypeLabels } from '../../src/data/brief.ts';
import { tellStudio } from './mail.js';

async function briefRow(env, projectId) {
  return env.DB.prepare(
    'SELECT answers, state, updated_at, sent_at FROM briefs WHERE project_id = ?',
  )
    .bind(projectId)
    .first();
}

/** The project when this user owns it (writes), or may read it (admins). */
async function load(env, user, url, { write = false } = {}) {
  const project = await projectFor(env, user, url.searchParams.get('p'));
  if (!project || (write && project.user_id !== user.id)) return null;
  return project;
}

/** GET /api/account/brief?p= */
export async function getBrief(url, env, user) {
  const project = await load(env, user, url);
  if (!project) return notFound();
  const row = await briefRow(env, project.id);
  const { results: files } = await env.DB.prepare(
    'SELECT id, field, name, type, size FROM files WHERE project_id = ? ORDER BY created_at',
  )
    .bind(project.id)
    .all();
  return json({
    ok: true,
    project: {
      id: project.id,
      name: project.name,
      type: project.type,
      tier: project.tier,
      concept: project.concept,
    },
    state: row?.state ?? 'draft',
    answers: row ? JSON.parse(row.answers) : {},
    updatedAt: row?.updated_at ?? null,
    files,
  });
}

async function save(env, projectId, answers, now) {
  await env.DB.prepare(
    `INSERT INTO briefs (project_id, answers, updated_at) VALUES (?, ?, ?)
     ON CONFLICT (project_id) DO UPDATE SET answers = excluded.answers, updated_at = excluded.updated_at`,
  )
    .bind(projectId, JSON.stringify(answers), now)
    .run();
}

/** PUT /api/account/brief?p= { answers } : saves whatever is valid so far. */
export async function putBrief(request, url, env, user, now = Date.now()) {
  const project = await load(env, user, url, { write: true });
  if (!project) return notFound();
  const row = await briefRow(env, project.id);
  if (row?.state === 'sent')
    return fail(409, 'This brief has been sent. Ask us if you need to change it.');
  const body = await readJson(request);
  if (!body) return fail(413, 'That’s too much text to save in one go.');
  const { answers, errors } = validateBrief(project.type, body.answers);
  await save(env, project.id, answers, now);
  return json({ ok: true, savedAt: now, errors });
}

/** The studio's copy: every answered question, step by step, and where to read it. */
function summary(project, user, answers, files, origin) {
  const lines = [
    `${user.name} (${user.email}) has sent the brief for ${project.name}.`,
    `Type: ${projectTypeLabels[project.type]}${project.tier ? ` · Tier: ${project.tier}` : ''}`,
    '',
  ];
  for (const step of stepsFor(project.type)) {
    const answered = step.fields
      .map((field) => {
        if (field.kind === 'files') {
          const names = files.filter((f) => f.field === field.id).map((f) => f.name);
          return names.length ? `${field.label}: ${names.join(', ')}` : '';
        }
        if (field.kind === 'consent') return '';
        const text = answerText(field, answers[field.id]);
        return text ? `${field.label}: ${text}` : '';
      })
      .filter(Boolean);
    if (answered.length) lines.push(`## ${step.title}`, ...answered, '');
  }
  lines.push(`Read it and download the files: ${origin}/admin/client/?id=${user.id}`);
  return lines.join('\n');
}

/** POST /api/account/brief/send?p= { answers } */
export async function sendBrief(request, url, env, user, now = Date.now()) {
  const project = await load(env, user, url, { write: true });
  if (!project) return notFound();
  const row = await briefRow(env, project.id);
  if (row?.state === 'sent') return fail(409, 'This brief has already been sent.');
  const body = await readJson(request);
  if (!body) return fail(413, 'That’s too much text to send in one go.');
  const { answers, errors } = validateBrief(project.type, body.answers, { sending: true });
  await save(env, project.id, answers, now);
  if (Object.keys(errors).length) {
    return fail(400, 'A few things need filling in before you send.', { errors });
  }
  await env.DB.prepare(
    "UPDATE briefs SET state = 'sent', consent_at = ?, sent_at = ? WHERE project_id = ?",
  )
    .bind(now, now, project.id)
    .run();
  const { results: files } = await env.DB.prepare(
    'SELECT field, name FROM files WHERE project_id = ? ORDER BY created_at',
  )
    .bind(project.id)
    .all();
  await tellStudio(
    env,
    `[Client brief] ${project.name} from ${user.name}`,
    summary(project, user, answers, files, url.origin),
  );
  return json({ ok: true, sentAt: now });
}
