"use strict";

const nmap = require("nmap");

let slots = null;
let rIndex = 0;
let wIndex = 0;

const state = { opts: null, ctrl: null };
const recvMessage = {};

global.onmessage = (e) => {
  const data = e.data;

  if (data instanceof Float32Array) {
    slots[wIndex] = data;
    wIndex = (wIndex + 1) % slots.length;
    return;
  }

  if (recvMessage.hasOwnProperty(data.type)) {
    recvMessage[data.type](data.data);
  }
}

function init() {
  if (state.opts && state.ctrl) {
    slots = nmap(state.opts.BUFFER_SLOTS, () => new Float32Array(state.opts.BUFFER_LENGTH * 2));
    audioloop();
  }
}

function audioloop() {
  if (slots[rIndex]) {
    const buffer = slots[rIndex];

    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = 0;
    }

    global.postMessage(buffer, [ buffer.buffer ]);

    slots[rIndex] = null;
    rIndex = (rIndex + 1) % slots.length;
  }
  setTimeout(audioloop, 0);
}


recvMessage["init"] = (data) => {
  state.opts = data;
  init();
};

recvMessage["ctrl:init"] = (data) => {
  state.ctrl = data.map(values => new Float32Array(values));
  init();
};

recvMessage["ctrl"] = (data) => {
  state.ctrl = data.map(values => new Float32Array(values));
};
