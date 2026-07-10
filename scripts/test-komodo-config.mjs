import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const hook = readFileSync('src/hooks/useKomodo.ts', 'utf8');
const worker = readFileSync('public/komodo/komodo-worker.js', 'utf8');
const asset = JSON.parse(readFileSync('src/assets/explanation-engine.wasm.asset.json', 'utf8'));

assert.match(hook, /setoption name UCI LimitStrength value true/);
assert.match(hook, /setoption name Use UCI_Elo value true/);
assert.match(hook, /setoption name Auto Skill value true/);
assert.match(hook, /setoption name UCI Elo value/);
assert.doesNotMatch(hook, /setoption name UCI_Elo value/);
assert.match(hook, /ggchess\.lovable\.app/);
assert.match(hook, /JSON\.stringify\(orderedWasmCandidates\)/);
assert.match(hook, /new Worker\(`\/komodo\/komodo-worker\.js#\$\{workerPayload\}`\)/);
assert.match(worker, /decodeURIComponent\(raw\)/);
assert.match(worker, /startsWithWasmMagic/);
assert.match(worker, /self\.__KOMODO_WASM_URL/);
assert.match(worker, /wasmBinaryFile: wasmURL/);
assert.match(hook, /TEP build exposes classic Skill as 1–35/);
assert.equal(asset.content_type, 'application/wasm');
assert.equal(asset.size, 13_986_847);

console.log('Komodo config test passed');