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
const row = (id, body = 'A question') => ({id, name: 'Visitor', body, created_at: '2026-11-22T12:00:00Z'});

test('comment requests isolate photomode threads, approved rows and stable pagination', async () => {
  const calls = [];
  const client = createCommentClient({url: 'https://test.supabase.co', key: 'sb_publishable_test', games: ['game-one'],
    fetchImpl: async (url, options) => {calls.push({url: new URL(url), options});return {ok: true, json: async () => Array.from({length: 21}, (_, i) => row(30 - i))};}});
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
    fetchImpl: async (_, options) => {payload = JSON.parse(options.body);return {ok: true, json: async () => [row(1)]};}});
  await client.post('game-one', {name: '  Visitor ', body: ' Question ', website: ''});
  assert.deepEqual(payload, {game_id: 'photomode:game-one', name: 'Visitor', body: 'Question', status: 'approved'});
  for (const values of [{name: '', body: 'x'}, {name: 'x'.repeat(61), body: 'x'}, {name: 'x', body: ' '.repeat(50)}, {name: 'x', body: 'x'.repeat(801)}]) {
    assert.throws(() => validateComment(values));
  }
  await assert.rejects(client.post('game-one', {name: 'Bot', body: 'Spam', website: 'example.com'}));
  assert.equal(createCommentClient({url: 'https://test.supabase.co', key: 'sb_secret_never-public', games: []}).configured, false);
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
  const select = document.querySelector('#discussion-game');let selected = '';
  Object.defineProperty(select, 'value', {get: () => selected, set: value => {selected = value;}});
  const context = vm.createContext({document, modes, language, client, validateComment, AbortController, Intl, Date, console,
    t: (message, values) => translate(message, values, language)});
  const source = read('photomode-comments.js').split('\nsetupPhotomodeComments({document, client:')[0].replace(/^import .*;\r?$/gm, '').replace(/^export /gm, '');
  vm.runInContext(source + '\nsetupPhotomodeComments({document, client});', context);
  return {document, window, select};
}
const tick = () => new Promise(resolve => setImmediate(resolve));

for (const language of ['en', 'pt-BR']) test(`${language}: comment text stays inert, replies work, failed posts retain the draft and successful posts appear`, async () => {
  let fail = true, sent;
  const client = {configured: true, list: async () => ({comments: [row(1, '<img src=x onerror=alert(1)>')], next: null}),
    post: async (game, values) => {sent = {game, values};if (fail) throw Error('offline');return {...row(2, values.body), name: values.name};}};
  const {document, window} = ui(language, client);await tick();
  assert.equal(document.querySelector('#comment-list img'), null);
  assert.match(document.querySelector('#comment-list').textContent, /<img/);
  document.querySelector('.photomode-comment button').dispatchEvent(new window.Event('click'));
  const body = document.querySelector('#comment-body'), name = document.querySelector('#comment-name');
  assert.equal(body.value, '@Visitor ');body.value += 'My question';name.value = 'Another visitor';
  const submit = () => document.querySelector('#comment-form').dispatchEvent(new window.Event('submit', {cancelable: true}));
  submit();await tick();
  assert.match(body.value, /My question/);
  assert.equal(document.querySelector('#comment-status').textContent, translate('Your comment could not be sent. Your text is still here; please try again.', {}, language));
  fail = false;submit();await tick();
  assert.equal(sent.game, modes[0].id);assert.equal(document.querySelectorAll('.photomode-comment').length, 2);
  assert.equal(body.value, '');assert.equal(document.querySelector('#comment-status').textContent, translate('Your comment is live. Thank you!', {}, language));
  assert.equal(document.querySelector('#comment-submit').disabled, false);
});

test('switching games ignores late responses and keeps drafts attached to their game', async () => {
  const pending = [];
  let posts = 0;
  const client = {configured: true, list: (game, {signal}) => new Promise(resolve => pending.push({game, signal, resolve})), post: async () => {posts++;return row(3);}};
  const {document, window, select} = ui('en', client);
  assert.equal(document.querySelector('#comment-submit').disabled, true);
  document.querySelector('#comment-name').value = 'Visitor';
  document.querySelector('#comment-body').value = 'Question for the first game';
  document.querySelector('#comment-form').dispatchEvent(new window.Event('submit', {cancelable: true}));await tick();
  assert.equal(posts, 0);
  select.value = modes[1].id;select.dispatchEvent(new window.Event('change'));
  assert.equal(pending[0].signal.aborted, true);
  pending[1].resolve({comments: [row(2, 'Correct game')], next: null});await tick();
  assert.equal(document.querySelector('#comment-submit').disabled, false);
  pending[0].resolve({comments: [row(1, 'Wrong game')], next: null});await tick();
  assert.match(document.querySelector('#comment-list').textContent, /Correct game/);
  assert.doesNotMatch(document.querySelector('#comment-list').textContent, /Wrong game/);
  select.value = modes[0].id;select.dispatchEvent(new window.Event('change'));
  assert.equal(document.querySelector('#comment-body').value, 'Question for the first game');
  pending[2].resolve({comments: [], next: null});await tick();
});
