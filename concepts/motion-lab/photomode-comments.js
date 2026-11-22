import {t, language} from './i18n.js';
import modes from './photomodes-data.js';
import {createCommentClient, validateComment} from './photomode-comments-client.mjs';
import './photomode-comments.css';

export function setupPhotomodeComments({document, client}) {
  const section = document.querySelector('#photomode-discussion');
  if (!section) return;
  const $ = selector => section.querySelector(selector);
  const select = $('#discussion-game'), form = $('#comment-form'), list = $('#comment-list');
  const name = $('#comment-name'), body = $('#comment-body'), status = $('#comment-status');
  const loadStatus = $('#comments-load-status'), more = $('#comments-more'), retry = $('#comments-retry'), submit = $('#comment-submit');
  let game = modes[0].id, comments = [], cursor = null, loading = false, submitting = false, requestId = 0, controller;
  const drafts = new Map(), postedAt = new Map();
  for (const mode of modes) {
    const option = document.createElement('option');option.value = mode.id;option.textContent = mode.game;select.append(option);
  }
  select.value = game;
  function updateTitle() {
    $('#discussion-title').textContent = t('{game} discussion', {game: modes.find(mode => mode.id === game).game});
    $('#comment-length').textContent = t('{count} / 800 characters', {count: body.value.length});
  }
  function render() {
    list.replaceChildren();
    if (!comments.length) {
      const empty = document.createElement('p');empty.className = 'comments-empty';empty.textContent = t('No comments yet. Ask the first question.');list.append(empty);
    }
    for (const comment of comments) {
      const article = document.createElement('article'), heading = document.createElement('div'), author = document.createElement('strong');
      const date = document.createElement('time'), text = document.createElement('p'), reply = document.createElement('button');
      article.className = 'photomode-comment';author.textContent = comment.name;
      date.dateTime = comment.created_at;date.textContent = new Intl.DateTimeFormat(language, {dateStyle: 'medium'}).format(new Date(comment.created_at));
      text.textContent = comment.body;
      reply.type = 'button';reply.textContent = t('Reply');reply.setAttribute('aria-label', t('Reply to {name}', {name: comment.name}));
      reply.addEventListener('click', () => {
        if (submitting) return;
        const prefix = `@${comment.name} `;
        if (!body.value.startsWith(prefix)) body.value = (prefix + body.value).slice(0, 800);
        updateTitle();body.focus();
      });
      heading.append(author, date);article.append(heading, text, reply);list.append(article);
    }
    more.hidden = !cursor;
  }
  async function load(append = false) {
    controller?.abort();controller = new AbortController();const token = ++requestId;
    loading = true;list.setAttribute('aria-busy', 'true');retry.hidden = true;more.disabled = true;submit.disabled = true;
    loadStatus.textContent = t('Loading comments…');
    try {
      const result = await client.list(game, {before: append ? cursor : null, signal: controller.signal});
      if (token !== requestId) return;
      const combined = append ? [...comments, ...result.comments] : result.comments;
      comments = [...new Map(combined.map(comment => [comment.id, comment])).values()];cursor = result.next;
      loadStatus.textContent = '';render();
    } catch {
      if (token !== requestId) return;
      loadStatus.textContent = t('Comments could not be loaded. Please try again.');retry.hidden = false;
    } finally {
      if (token === requestId) {loading = false;list.setAttribute('aria-busy', 'false');more.disabled = false;submit.disabled = submitting || !client.configured;}
    }
  }
  function switchGame(next) {
    if (submitting || !modes.some(mode => mode.id === next)) return;
    drafts.set(game, {name: name.value, body: body.value});
    game = next;select.value = next;comments = [];cursor = null;
    const draft = drafts.get(game);name.value = draft?.name || name.value;body.value = draft?.body || '';
    status.textContent = '';list.replaceChildren();more.hidden = true;updateTitle();load();
  }
  select.addEventListener('change', () => switchGame(select.value));
  document.querySelectorAll('[data-discussion-game]').forEach(link => link.addEventListener('click', event => {
    if (submitting) {event.preventDefault();return;}
    if (game !== link.dataset.discussionGame) switchGame(link.dataset.discussionGame);
    section.focus({preventScroll: true});
  }));
  more.addEventListener('click', () => {if (!loading) load(true);});
  retry.addEventListener('click', () => {if (!loading) load(Boolean(comments.length));});
  body.addEventListener('input', updateTitle);
  form.addEventListener('submit', async event => {
    event.preventDefault();if (submitting || loading || !client.configured || $('#comment-website').value) return;
    try {validateComment({name: name.value, body: body.value});}
    catch {status.textContent = t('Add your name and a comment of up to 800 characters.');return;}
    if (Date.now() - (postedAt.get(game) || 0) < 30000) {status.textContent = t('Please wait a moment before posting another comment.');return;}
    // Cancel a stale read so it cannot overwrite a successfully submitted comment.
    controller?.abort();++requestId;loading = false;list.setAttribute('aria-busy', 'false');loadStatus.textContent = '';
    submitting = true;submit.disabled = true;select.disabled = true;more.disabled = true;retry.disabled = true;
    name.disabled = true;body.disabled = true;submit.textContent = t('Posting…');status.textContent = '';
    try {
      const comment = await client.post(game, {name: name.value, body: body.value, website: ''});
      comments = [comment, ...comments.filter(item => item.id !== comment.id)];render();postedAt.set(game, Date.now());
      body.value = '';drafts.delete(game);updateTitle();status.textContent = t('Your comment is live. Thank you!');
    } catch {status.textContent = t('Your comment could not be sent. Your text is still here; please try again.');}
    finally {
      submitting = false;submit.disabled = false;select.disabled = false;more.disabled = false;retry.disabled = false;
      name.disabled = false;body.disabled = false;submit.textContent = t('Post comment');
    }
  });
  updateTitle();
  if (client.configured) load();
  else {
    form.hidden = true;select.disabled = true;loadStatus.textContent = t('Comments are temporarily unavailable. Please try again later.');
  }
}

setupPhotomodeComments({document, client: createCommentClient({url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_ANON_KEY, games: modes.map(mode => mode.id)})});
