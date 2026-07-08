// Web Worker that boots chess.com's Komodo TEP (explanation-engine) wasm.
// Parent posts UCI text lines; worker posts UCI text lines back.
//
// The .wasm URL is passed via the worker URL hash:
//   new Worker('/komodo/komodo-worker.js#<wasmURL>')
//
// The Emscripten loader (explanation-engine.js) auto-inits in a worker
// environment: it calls KOMODO_TEP(self.location.hash.substr(1)) which
// treats the hash as the wasm path, then wires
// self.onmessage -> komodoTep.postMessage and komodoTep.onmessage -> postMessage.

// Wayback Machine wombat shim guard — the loader we captured references these.
self.__WB_pmw = self.__WB_pmw || function (o) { this.__WB_source = o; return this; };

// Pre-set Module hints in case the factory reads them (Emscripten MODULARIZE).
var wasmURL = self.location.hash.slice(1);
self.Module = {
  wasmBinaryFile: wasmURL,
  locateFile: function (path) { return path.endsWith('.wasm') ? wasmURL : path; },
  print: function (line) { postMessage(line); },
  printErr: function (line) { postMessage(line); },
};

importScripts('/komodo/explanation-engine.js');
