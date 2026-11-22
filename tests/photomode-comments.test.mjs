import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import modes from '../concepts/motion-lab/photomodes-data.js';
import pt from '../concepts/motion-lab/locales/pt-BR.js';
import {translate, translateDocument} from '../concepts/motion-lab/i18n-core.mjs';
import {createCommentClient, validateComment} from '../concepts/motion-lab/photomode-comments-client.mjs';
const root = new URL('../concepts/motion-lab/', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const row = (id, body = 'A question', game = modes[0].id) => ({id, game_id: `photomode:${game}`, game, name: 'Visitor', body, created_at: '2026-11-22T12:00:00Z'});

test('comment requests isolate photomode threads, approved rows and stable pagination', async () => {
  const calls = [];
  const client = createCommentClient({url: 'https://test.supabase.co', key: 'sb_publishable_test', games: ['game-one'],
    fetchImpl: async (url, options) => {calls.push({url: new URL(url), options});return {ok: true, json: async () => Array.from({length: 21}, (_, i) => row(30 - i, 'Question', 'game-one'))};}});
  const first = await client.list('game-one');
  assert.equal(first.comments.length, 20);assert.equal(first.next, '11');
  assert.equal(calls[0].url.searchParams.get('game_id'), 'eq.photomode:game-one');
  assert.equal(calls[0].url.searchParams.get('status'), 'eq.approved');
  assert.equal(calls[0].url.searchParams.get('order'), 'id.desc');
  await client.list('game-one', {before: first.next});
  assert.equal(calls[1].url.searchParams.get('id'), 'lt.11');
  await assert.rejects(client.list('archive-game'));
  await assert.rejects(client.list('game-one', {before: '0&status=eq.rejected'}));
});

test('submissions enforce limits and use only the existing approved-comment fields', async () => {
  let payload;
  const client = createCommentClient({url: 'https://test.supabase.co', key: 'sb_publishable_test', games: ['game-one'],
    fetchImpl: async (_, options) => {payload = JSON.parse(options.body);return {ok: true, json: async () => [row(1, 'Question', 'game-one')]};}});
  await client.post('game-one', {name: '  Visitor ', body: ' Question ', website: ''});
  assert.deepEqual(payload, {game_id: 'photomode:game-one', name: 'Visitor', body: 'Question', status: 'approved'});
  for (const values of [{name: '', body: 'x'}, {name: 'x'.repeat(61), body: 'x'}, {name: 'x', body: ' '.repeat(50)}, {name: 'x', body: 'x'.repeat(801)}]) {
    assert.throws(() => validateComment(values));
  }
  await assert.rejects(client.post('game-one', {name: 'Bot', body: 'Spam', website: 'example.com'}));
  await assert.rejects(client.post('all', {name: 'Visitor', body: 'Question'}));
  assert.equal(createCommentClient({url: 'https://test.supabase.co', key: 'sb_secret_never-public', games: []}).configured, false);
});

test('the all-games feed includes only supported photomodes and paginates newest first across games', async () => {
  const calls = [], games = modes.map(mode => mode.id);
  const client = createCommentClient({url: 'https://test.supabase.co', key: 'sb_publishable_test', games,
    fetchImpl: async url => {calls.push(new URL(url));return {ok: true, json: async () => Array.from({length: 21}, (_, i) => row(30 - i, 'Question', games[i % games.length]))};}});
  const first = await client.list();
  assert.equal(calls[0].searchParams.get('game_id'), `in.(${games.map(id => `photomode:${id}`).join(',')})`);
  assert.equal(calls[0].searchParams.get('status'), 'eq.approved');
  assert.equal(calls[0].searchParams.get('order'), 'id.desc');
  assert.ok(calls[0].searchParams.get('select').split(',').includes('game_id'));
  assert.equal(first.comments.length, 20);assert.equal(first.next, '11');
  assert.deepEqual(first.comments.slice(0, 3).map(comment => comment.game), games.slice(0, 3));
  await client.list('all', {before: first.next});assert.equal(calls[1].searchParams.get('id'), 'lt.11');
});

test('archived, missing, unknown and mismatched game metadata cannot enter a discussion', async () => {
  for (const game_id of ['archive-game', 'photomode:unknown', undefined]) {
    const client = createCommentClient({url: 'https://test.supabase.co', key: 'sb_publishable_test', games: modes.map(mode => mode.id),
      fetchImpl: async () => ({ok: true, json: async () => [{...row(1), game_id}]})});
    await assert.rejects(client.list('all'));
  }
  const client = createCommentClient({url: 'https://test.supabase.co', key: 'sb_publishable_test', games: modes.map(mode => mode.id),
    fetchImpl: async () => ({ok: true, json: async () => [row(1, 'Other game', modes[1].id)]})});
  await assert.rejects(client.list(modes[0].id));
  await assert.rejects(client.post(modes[0].id, {name: 'Visitor', body: 'Question'}));
});

test('read failures and malformed responses never masquerade as an empty discussion', async () => {
  for (const response of [{ok: false}, {ok: true, json: async () => ({error: 'no'})}, {ok: true, json: async () => [{id: 1, name: 'x'}]}]) {
    const client = createCommentClient({url: 'https://test.supabase.co', key: 'sb_publishable_test', games: ['game-one'], fetchImpl: async () => response});
    await assert.rejects(client.list('game-one'));
  }
});

test('every compatibility statement, setup step and resource label has Portuguese coverage', () => {
  for (const mode of modes) for (const value of [mode.platform, mode.compatibility, mode.controls, ...mode.requirements, ...mode.installation, ...(mode.resourceLinks || []).map(link => link.label)]) {
    assert.ok(value && Object.hasOwn(pt, value), `${mode.id}: ${value}`);
  }
});

function ui(language, client) {
  const {document, window} = parseHTML(read('photomodes/index.html'));
  translateDocument(document.documentElement, language);
  for (const node of document.querySelectorAll('input,textarea')) {node.value = '';node.focus = () => {};}
  document.querySelector('#photomode-discussion').focus = () => {};
  for (const field of document.querySelectorAll('select')) {
    let selected = '';
    Object.defineProperty(field, 'value', {get: () => selected, set: value => {selected = value;}});
    field.focus = () => {};
  }
  const select = document.querySelector('#discussion-game'), postSelect = document.querySelector('#comment-game');
  const context = vm.createContext({document, modes, language, client, validateComment, AbortController, Intl, Date, console,
    t: (message, values) => translate(message, values, language)});
  const source = read('photomode-comments.js').split('\nsetupPhotomodeComments({document, client:')[0].replace(/^import .*;\r?$/gm, '').replace(/^export /gm, '');
  vm.runInContext(source + '\nsetupPhotomodeComments({document, client});', context);
  return {document, window, select, postSelect};
}
const tick = () => new Promise(resolve => setImmediate(resolve));

for (const language of ['en', 'pt-BR']) test(`${language}: comment text stays inert, replies work, failed posts retain the draft and successful posts appear`, async () => {
  let fail = true, sent;
  const client = {configured: true, list: async () => ({comments: [row(1, '<img src=x onerror=alert(1)>', modes[1].id)], next: null}),
    post: async (game, values) => {sent = {game, values};if (fail) throw Error('offline');return {...row(2, values.body, game), name: values.name};}};
  const {document, window, select, postSelect} = ui(language, client);await tick();
  assert.equal(select.value, 'all');assert.equal(postSelect.value, '');
  assert.equal(document.querySelector('#discussion-title').textContent, translate('All games · newest first', {}, language));
  assert.equal(document.querySelector('.photomode-comment-game').textContent, modes[1].game);
  assert.equal(document.querySelector('#comment-list img'), null);
  assert.match(document.querySelector('#comment-list').textContent, /<img/);
  document.querySelector('.photomode-comment button').dispatchEvent(new window.Event('click'));
  assert.equal(postSelect.value, modes[1].id);assert.equal(select.value, 'all');
  const body = document.querySelector('#comment-body'), name = document.querySelector('#comment-name');
  assert.equal(body.value, '@Visitor ');body.value += 'My question';name.value = 'Another visitor';
  const submit = () => document.querySelector('#comment-form').dispatchEvent(new window.Event('submit', {cancelable: true}));
  submit();await tick();
  assert.match(body.value, /My question/);
  assert.equal(document.querySelector('#comment-status').textContent, translate('Your comment could not be sent. Your text is still here; please try again.', {}, language));
  fail = false;submit();await tick();
  assert.equal(sent.game, modes[1].id);assert.equal(document.querySelectorAll('.photomode-comment').length, 2);
  assert.equal(body.value, '');assert.equal(document.querySelector('#comment-status').textContent, translate('Your comment is live. Thank you!', {}, language));
  assert.equal(document.querySelector('#comment-submit').disabled, false);
});

test('switching games ignores late responses and keeps drafts attached to their game', async () => {
  const pending = [];
  let posts = 0;
  const client = {configured: true, list: (game, {signal}) => new Promise(resolve => pending.push({game, signal, resolve})), post: async () => {posts++;return row(3);}};
  const {document, window, select, postSelect} = ui('en', client);
  assert.equal(pending[0].game, 'all');
  assert.equal(document.querySelector('#comment-submit').disabled, true);
  postSelect.value = modes[0].id;postSelect.dispatchEvent(new window.Event('change'));
  document.querySelector('#comment-name').value = 'Visitor';
  document.querySelector('#comment-body').value = 'Question for the first game';
  document.querySelector('#comment-form').dispatchEvent(new window.Event('submit', {cancelable: true}));await tick();
  assert.equal(posts, 0);
  select.value = modes[1].id;select.dispatchEvent(new window.Event('change'));
  assert.equal(pending[0].signal.aborted, true);
  pending[1].resolve({comments: [row(2, 'Correct game', modes[1].id)], next: null});await tick();
  assert.equal(document.querySelector('#comment-submit').disabled, false);
  pending[0].resolve({comments: [row(1, 'Wrong game')], next: null});await tick();
  assert.match(document.querySelector('#comment-list').textContent, /Correct game/);
  assert.doesNotMatch(document.querySelector('#comment-list').textContent, /Wrong game/);
  select.value = modes[0].id;select.dispatchEvent(new window.Event('change'));
  assert.equal(document.querySelector('#comment-body').value, 'Question for the first game');
  pending[2].resolve({comments: [], next: null});await tick();
});

for (const language of ['en', 'pt-BR']) test(`${language}: all-games posting requires a game and keeps the overview after submission`, async () => {
  const posts = [], loads = [];
  const client = {configured: true, list: async (game, options) => {loads.push({game, before: options.before});return {comments: [], next: null};},
    post: async (game, values) => {posts.push(game);return row(3, values.body, game);}};
  const {document, window, select, postSelect} = ui(language, client);await tick();
  document.querySelector('#comment-name').value = 'Visitor';
  const body = document.querySelector('#comment-body');body.value = 'My new question';
  const submit = () => document.querySelector('#comment-form').dispatchEvent(new window.Event('submit', {cancelable: true}));
  submit();await tick();assert.equal(posts.length, 0);
  assert.equal(document.querySelector('#comment-status').textContent, translate('Choose a game for your comment.', {}, language));
  postSelect.value = modes[2].id;postSelect.dispatchEvent(new window.Event('change'));
  assert.equal(body.value, 'My new question');assert.equal(select.value, 'all');
  submit();await tick();assert.deepEqual(posts, [modes[2].id]);
  assert.equal(select.value, 'all');assert.equal(loads.length, 1);
  assert.equal(document.querySelector('.photomode-comment-game').textContent, modes[2].game);
  assert.equal(body.value, '');
});

test('overview pagination and game filters preserve labels, ordering and the selected draft', async () => {
  const loads = [];
  const client = {configured: true, list: async (game, {before}) => {
    loads.push({game, before});
    if (game !== 'all') return {comments: [row(2, 'Filtered question', game)], next: null};
    return before ? {comments: [row(1, 'Older question', modes[2].id)], next: null}
      : {comments: [row(3, 'Newest question'), row(2, 'Second question', modes[1].id)], next: '2'};
  }};
  const {document, window, select, postSelect} = ui('en', client);await tick();
  document.querySelector('#comments-more').dispatchEvent(new window.Event('click'));await tick();
  assert.deepEqual(loads[1], {game: 'all', before: '2'});
  assert.deepEqual([...document.querySelectorAll('.photomode-comment-game')].map(node => node.textContent), modes.slice(0, 3).map(mode => mode.game));
  assert.equal(document.querySelector('#comments-more').hidden, true);
  select.value = modes[1].id;select.dispatchEvent(new window.Event('change'));await tick();
  assert.equal(postSelect.value, modes[1].id);assert.equal(document.querySelectorAll('.photomode-comment').length, 1);
  document.querySelector('#comment-body').value = 'Draft for Kingdom Hearts';
  select.value = 'all';select.dispatchEvent(new window.Event('change'));await tick();
  assert.equal(document.querySelector('#comment-body').value, 'Draft for Kingdom Hearts');assert.equal(postSelect.value, modes[1].id);
  postSelect.value = modes[2].id;postSelect.dispatchEvent(new window.Event('change'));
  assert.equal(document.querySelector('#comment-body').value, '');assert.equal(select.value, 'all');
  postSelect.value = modes[1].id;postSelect.dispatchEvent(new window.Event('change'));
  assert.equal(document.querySelector('#comment-body').value, 'Draft for Kingdom Hearts');
  select.value = modes[0].id;select.dispatchEvent(new window.Event('change'));await tick();
  postSelect.value = modes[2].id;postSelect.dispatchEvent(new window.Event('change'));await tick();
  assert.equal(select.value, modes[2].id);assert.equal(loads.at(-1).game, modes[2].id);
});
