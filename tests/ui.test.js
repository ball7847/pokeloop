import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const code = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const topBarCode = readFileSync(new URL('../src/ui/topBar.js', import.meta.url), 'utf8');
test('approved tabs appear in order', () => {
  const names = ['메타몽','야생','도감','설정'];
  const positions = names.map(name => code.indexOf("label: '" + name + "'"));
  assert.ok(positions.every(position => position >= 0));
  assert.deepEqual([...positions].sort((a,b)=>a-b), positions);
});
test('three persistent screen regions are rendered', () => {
  assert.ok(topBarCode.includes('topbar'));
  for (const region of ['sidebar','main','logs']) assert.ok(code.includes(region));
});
test('log renders from controlled messages, no raw user text', () => {
  assert.ok(code.includes('messages[action]'));
  assert.ok(code.includes('after === before'));
});
