import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const hook = readFileSync('src/hooks/useKomodo.ts', 'utf8');
const worker = readFileSync('public/komodo/komodo-worker.js', 'utf8');
const asset = JSON.parse(readFileSync('src/assets/explanation-engine.wasm.asset.json', 'utf8'));

assert.match(hook, /setoption name UCI LimitStrength value true/);
assert.match(hook, /setoption name UCI Elo value/);
assert.doesNotMatch(hook, /setoption name UCI_Elo value/);
assert.match(hook, /ggchess\.lovable\.app/);
assert.match(hook, /new Worker\(`\/komodo\/komodo-worker\.js#\$\{wasmUrl\}`\)/);
assert.doesNotMatch(hook, /encodeURIComponent\(wasmUrl\)/);
assert.match(worker, /decodeURIComponent\(self\.location\.hash\.slice\(1\)\)/);
assert.match(worker, /wasmBinaryFile: wasmURL/);
assert.match(hook, /TEP build reports classic Skill as/);
assert.equal(asset.content_type, 'application/wasm');
assert.equal(asset.size, 13_986_847);

console.log('Komodo config test passed');