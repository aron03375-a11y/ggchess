// Web Worker that boots chess.com's Komodo TEP (explanation-engine) wasm.
// Parent posts UCI text lines; worker posts UCI text lines back.
//
// The parent passes a JSON-encoded candidate list in the worker hash. The
// captured Emscripten loader auto-starts from self.location.hash, so this worker
// evaluates a tiny patched copy that reads self.__KOMODO_WASM_URL instead. That
// lets us verify/fallback before the loader tries to compile an HTML/404 body.

// Wayback Machine wombat shim guard — the loader we captured references these.
self.__WB_pmw = self.__WB_pmw || function (o) { this.__WB_source = o; return this; };

function parseWasmCandidates() {
  var raw = self.location.hash.slice(1);
  if (!raw) return [];

  var decoded = decodeURIComponent(raw);
  try {
    var parsed = JSON.parse(decoded);
    if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
  } catch (_) {
    // Older callers passed a single URL directly.
  }

  return [decoded];
}

function startsWithWasmMagic(url) {
  try {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.responseType = 'arraybuffer';
    try { xhr.setRequestHeader('Range', 'bytes=0-3'); } catch (_) {}
    xhr.send(null);

    if (!(xhr.status === 200 || xhr.status === 206 || xhr.status === 0)) return false;
    var bytes = new Uint8Array(xhr.response || new ArrayBuffer(0));
    return bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] === 0x61 && bytes[2] === 0x73 && bytes[3] === 0x6d;
  } catch (_) {
    return false;
  }
}

var wasmCandidates = parseWasmCandidates();
var wasmURL = wasmCandidates.find(startsWithWasmMagic) || wasmCandidates[0] || '';
self.__KOMODO_WASM_URL = wasmURL;

if (!wasmURL) {
  postMessage({ error: 'Komodo WASM URL missing' });
}

// Pre-set Module hints in case the factory reads them (Emscripten MODULARIZE).
self.Module = {
  wasmBinaryFile: wasmURL,
  locateFile: function (path) { return path.endsWith('.wasm') ? wasmURL : path; },
  print: function (line) { postMessage(line); },
  printErr: function (line) { postMessage(line); },
};

var loaderRequest = new XMLHttpRequest();
loaderRequest.open('GET', '/komodo/explanation-engine.js', false);
loaderRequest.send(null);

if (loaderRequest.status !== 200 && loaderRequest.status !== 0) {
  postMessage({ error: 'Failed to load Komodo JS loader' });
} else {
  var loaderSource = loaderRequest.responseText.replace(
    'KOMODO_TEP(self.location.hash.substr(1))',
    'KOMODO_TEP(self.__KOMODO_WASM_URL||self.location.hash.substr(1))'
  );
  (0, eval)(loaderSource);
}
