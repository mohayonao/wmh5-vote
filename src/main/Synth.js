"use strict";

const nmap = require("nmap");

const BUFFER_SLOTS = 4;
const BUFFER_LENGTH = 1024;

class Synth {
  constructor(dispatcher, audioContext) {
    this.dispatcher = dispatcher;
    this.audioContext = audioContext;
    this.worker = new Worker("worker.js?" + Date.now());

    this.worker.onmessage = (e) => {
      this.onmessage(e);
    };

    this.slots = nmap(BUFFER_SLOTS, () => null);
    this.wIndex = 0;
    this.rIndex = 0;

    this.scp = this.audioContext.createScriptProcessor(BUFFER_LENGTH, 0, 2);
    this.scp.onaudioprocess = this.onaudioprocess.bind(this);
    this.scp.connect(this.audioContext.destination);

    const sampleRate = this.audioContext.sampleRate;

    this.worker.postMessage({ type: "init", data: { sampleRate, BUFFER_SLOTS, BUFFER_LENGTH } });
  }

  listen(store) {
    this.store = store;
    this.store.on("ctrl:init", (data) => {
      this.worker.postMessage({ type: "ctrl:init", data });
    });
    this.store.on("ctrl", (data) => {
      this.worker.postMessage({ type: "ctrl", data });
    });
    this.store.on("synthDefList:init", (data) => {
      this.worker.postMessage({ type: "synthDefList:init", data });
    });
    this.store.on("synthDefList", (data) => {
      this.worker.postMessage({ type: "synthDefList", data });
    });
  }

  onmessage(e) {
    if (e.data instanceof Float32Array) {
      this.slots[this.wIndex] = e.data;
      this.wIndex = (this.wIndex + 1) % BUFFER_SLOTS;
    }
  }

  onaudioprocess(e) {
    const buffer = this.slots[this.rIndex];

    if (buffer === null) {
      return;
    }

    e.outputBuffer.getChannelData(0).set(buffer.subarray(0, BUFFER_LENGTH));
    e.outputBuffer.getChannelData(1).set(buffer.subarray(BUFFER_LENGTH));
    this.dispatcher.emit("rms", rms(buffer));

    this.worker.postMessage(buffer, [ buffer.buffer ]);

    this.slots[this.rIndex] = null;
    this.rIndex = (this.rIndex + 1) % BUFFER_SLOTS;
  }
}

function rms(signal) {
  let x = 0;

  for (let i = 0, imax = signal.length; i < imax; i++) {
    x += signal[i] * signal[i];
  }

  return Math.sqrt(x / signal.length);
}

module.exports = Synth;
