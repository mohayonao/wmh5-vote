"use strict";

const nmap = require("nmap");
const scsynth = require("scsynth");

let context = null;
let slots = null;
let rIndex = 0;
let wIndex = 0;

const state = { opts: null, synthList: [], synthDefList: null, ctrl: null };
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

function audioloop() {
  if (slots[rIndex]) {
    const buffer = slots[rIndex];
    const blockSize = context.blockSize|0;
    const bufferLength = buffer.length >> 1;
    const imax = bufferLength / blockSize;

    for (let i = 0; i < imax; i++) {
      context.process();
      buffer.set(context.outputs[0], blockSize * i);
      buffer.set(context.outputs[1], blockSize * i + bufferLength);
    }

    global.postMessage(buffer, [ buffer.buffer ]);

    slots[rIndex] = null;
    rIndex = (rIndex + 1) % slots.length;
  }
  setTimeout(audioloop, 0);
}

function makeSynth(synthDefList, ctrl) {
  state.synthList.splice(0).forEach((synth) => {
    synth.close();
  });
  let numOfUnits = 0;

  state.synthList = synthDefList.map((synthDef, index) => {
    synthDef.paramValues = synthDef.paramValues.map((_, i) => ctrl[index][i] || 0);

    const synth = context.createSynth(synthDef);

    numOfUnits += synth.dspUnitList.length;

    return synth.appendTo(context)
  });

  global.console.log(`u: ${ numOfUnits }, avg: ${ numOfUnits / 8 }`);
}

function init() {
  if (!(state.opts && state.synthDefList && state.ctrl)) {
    return;
  }
  context = new scsynth.SCContext({ sampleRate: state.opts.sampleRate });
  slots = nmap(state.opts.BUFFER_SLOTS, () => new Float32Array(state.opts.BUFFER_LENGTH * 2));

  makeSynth(state.synthDefList, state.ctrl);
  audioloop();
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
  state.synthList.forEach((synth, index) => {
    synth.params.set(state.ctrl[index].subarray(0, synth.params.length));
  });
};

recvMessage["synthDefList:init"] = (data) => {
  state.synthDefList = data;
  init();
};

recvMessage["synthDefList"] = (data) => {
  state.synthDefList = data;
  makeSynth(state.synthDefList, state.ctrl);
};
