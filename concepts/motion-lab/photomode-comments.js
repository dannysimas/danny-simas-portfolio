import {t, language} from './i18n.js';
import modes from './photomodes-data.js';
import {createCommentClient, validateComment} from './photomode-comments-client.mjs';
import './photomode-comments.css';

export function setupPhotomodeComments({document, client}) {
  const section = document.querySelector('#photomode-discussion');
  if (!section) return;
  const $ = selector => section.querySelector(selector);
  const select = $('#discussion-game'), commentGame = $('#comment-game'), form = $('#comment-form'), list = $('#comment-list');
  const name = $('#comment-name'), body = $('#comment-body'), status = $('#comment-status');
  const loadStatus = $('#comments-load-status'), more = $('#comments-more'), retry = $('#comments-retry'), submit = $('#comment-submit');
  let view = 'all', postingGame = '', comments = [], cursor = null, loading = false, submitting = false, requestId = 0, controller;
  const drafts = new Map(), postedAt = new Map();
  const gameNames = new Map(modes.map(mode => [mode.id, mode.game]));
  const all = document.createElement('option');all.value = 'all';all.textContent = t('All games');select.append(all);
  const placeholder = document.createElement('option');placeholder.value = '';placeholder.textContent = t('Choose a game');placeholder.disabled = true;commentGame.append(placeholder);
  for (const mode of modes) {
    for (const field of [select, commentGame]) {
      const option = document.createElement('option');option.value = mode.id;option.textContent = mode.game;field.append(option);
    }
  }
  select.value = view;commentGame.value = postingGame;
  function updateTitle() {
    $('#discussion-title').textContent = view === 'all' ? t('All games · newest first') : t('{game} discussion', {game: gameNames.get(view)});
    $('#comment-length').textContent = t('{count} / 800 characters', {count: body.value.length});
  }
  function render() {
    list.replaceChildren();
    if (!comments.length) {
      const empty = document.createElement('p');empty.className = 'comments-empty';empty.textContent = t('No comments yet. Ask the first question.');list.append(empty);
    }
    for (const comment of comments) {
      const article = document.createElement('article'), heading = document.createElement('div'), author = document.createElement('strong');
      const date = document.createElement('time'), text = document.createElement('p'), reply = document.createElement('button'), gameLabel = document.createElement('span');
      article.className = 'photomode-comment';author.textContent = comment.name;
      gameLabel.className = 'photomode-comment-game';gameLabel.textContent = gameNames.get(comment.game);
      date.dateTime = comment.created_at;date.textContent = new Intl.DateTimeFormat(language, {dateStyle: 'medium'}).format(new Date(comment.created_at));
      text.textContent = comment.body;
      reply.type = 'button';reply.textContent = t('Reply');reply.setAttribute('aria-label', t('Reply to {name}', {name: comment.name}));
      reply.addEventListener('click', () => {
        if (submitting) return;
        setPostingGame(comment.game);
        const prefix = `@${comment.name} `;
        if (!body.value.startsWith(prefix)) body.value = (prefix + body.value).slice(0, 800);
        updateTitle();body.focus();
      });
      heading.append(author, date);article.append(gameLabel, heading, text, reply);list.append(article);
    }
    more.hidden = !cursor;
  }
  async function load(append = false) {
    controller?.abort();controller = new AbortController();const token = ++requestId;
    loading = true;list.setAttribute('aria-busy', 'true');retry.hidden = true;more.disabled = true;submit.disabled = true;
    loadStatus.textContent = t('Loading comments…');
    try {
      const result = await client.list(view, {before: append ? cursor : null, signal: controller.signal});
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
  function setPostingGame(next) {
    if (submitting || !gameNames.has(next) || next === postingGame) return;
    drafts.set(postingGame, {name: name.value, body: body.value});
    const draft = drafts.get(next) || (postingGame === '' ? drafts.get('') : null);
    postingGame = next;commentGame.value = next;
    name.value = draft?.name || name.value;body.value = draft?.body || '';
    status.textContent = '';updateTitle();
  }
  function switchView(next) {
    if (submitting || !client.configured || (next !== 'all' && !gameNames.has(next))) return;
    view = next;select.value = next;comments = [];cursor = null;
    if (next !== 'all') setPostingGame(next);
    status.textContent = '';list.replaceChildren();more.hidden = true;updateTitle();load();
  }
  select.addEventListener('change', () => switchView(select.value));
  commentGame.addEventListener('change', () => {
    setPostingGame(commentGame.value);
    if (view !== 'all' && view !== postingGame) switchView(postingGame);
  });
  document.querySelectorAll('[data-discussion-game]').forEach(link => link.addEventListener('click', event => {
    if (submitting) {event.preventDefault();return;}
    if (view !== link.dataset.discussionGame) switchView(link.dataset.discussionGame);
    section.focus({preventScroll: true});
  }));
  more.addEventListener('click', () => {if (!loading) load(true);});
  retry.addEventListener('click', () => {if (!loading) load(Boolean(comments.length));});
  body.addEventListener('input', updateTitle);
  form.addEventListener('submit', async event => {
    event.preventDefault();if (submitting || loading || !client.configured || $('#comment-website').value) return;
    if (!gameNames.has(postingGame)) {status.textContent = t('Choose a game for your comment.');commentGame.focus();return;}
    try {validateComment({name: name.value, body: body.value});}
    catch {status.textContent = t('Add your name and a comment of up to 800 characters.');return;}
    if (Date.now() - (postedAt.get(postingGame) || 0) < 30000) {status.textContent = t('Please wait a moment before posting another comment.');return;}
    // Cancel a stale read so it cannot overwrite a successfully submitted comment.
    controller?.abort();++requestId;loading = false;list.setAttribute('aria-busy', 'false');loadStatus.textContent = '';
    submitting = true;submit.disabled = true;select.disabled = true;commentGame.disabled = true;more.disabled = true;retry.disabled = true;
    name.disabled = true;body.disabled = true;submit.textContent = t('Posting…');status.textContent = '';
    try {
      const comment = await client.post(postingGame, {name: name.value, body: body.value, website: ''});
      comments = [comment, ...comments.filter(item => item.id !== comment.id)];render();postedAt.set(postingGame, Date.now());
      body.value = '';drafts.delete(postingGame);updateTitle();status.textContent = t('Your comment is live. Thank you!');
    } catch {status.textContent = t('Your comment could not be sent. Your text is still here; please try again.');}
    finally {
      submitting = false;submit.disabled = false;select.disabled = false;commentGame.disabled = false;more.disabled = false;retry.disabled = false;
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
