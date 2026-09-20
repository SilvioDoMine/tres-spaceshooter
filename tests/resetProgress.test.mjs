import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clearStorage, resetAllProgress } from '../app/utils/resetProgress.js';

function fakeStorage(initial = {}, { throwOnClear = false } = {}) {
  return {
    data: { ...initial },
    clear() {
      if (throwOnClear) throw new Error('storage bloqueado');
      this.data = {};
    },
  };
}

function fakeWindow(options = {}) {
  const replaced = [];
  return {
    localStorage: options.localStorage ?? fakeStorage({ chapterProgress: '{}' }),
    sessionStorage: options.sessionStorage ?? fakeStorage({ tmp: '1' }),
    location: { replace: (url) => replaced.push(url) },
    replaced,
  };
}

test('o reset apaga os dois armazenamentos e recarrega o jogo no lobby', () => {
  const win = fakeWindow();
  assert.equal(resetAllProgress(win), true);
  assert.deepEqual(win.localStorage.data, {});
  assert.deepEqual(win.sessionStorage.data, {});
  assert.deepEqual(win.replaced, ['/']);
});

test('armazenamento bloqueado não impede o resto do reset nem o recarregamento', () => {
  const win = fakeWindow({ localStorage: fakeStorage({ playerGold: '10' }, { throwOnClear: true }) });
  assert.equal(resetAllProgress(win), false);
  // A sessão ainda é limpa e o jogo recarrega mesmo com o localStorage recusando
  assert.deepEqual(win.sessionStorage.data, {});
  assert.deepEqual(win.replaced, ['/']);
});

test('clearStorage tolera armazenamento ausente', () => {
  assert.equal(clearStorage(undefined), false);
  assert.equal(clearStorage(null), false);
});
