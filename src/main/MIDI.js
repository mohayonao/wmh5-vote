"use strict";

const WebMIDIEmitter = require("web-midi-emitter");
const DEVICE_MATCHER = "Launch Control";
const KNOB1_MAP  = [ 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c ];
const KNOB2_MAP  = [ 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f, 0x30 ];
const PAD_MAP    = [ 0x09, 0x0a, 0x0b, 0x0c, 0x19, 0x1a, 0x1b, 0x1c ];
const CURSOR_MAP = [ 0x72, 0x73, 0x74, 0x75 ];
const LED_COLORS = {
  "R": [ 0x01, 0x02, 0x03 ],
  "G": [ 0x10, 0x30, 0x30 ],
  "Y": [ 0x11, 0x22, 0x33 ]
};
const KNOB1 = 0, KNOB2 = 1, PAD = 2;
const UP = 0, DOWN = 1, LEFT = 2, RIGHT = 3;

class MIDI {
  constructor(dispatcher, access) {
    this.dispatcher = dispatcher;
    this.device = null;
    this.ctrl = null;
    this.state = { hold: 0, cursor: [ 0, 0, 0, 0 ], led: [], ledColor: [] };

    this.device = new WebMIDIEmitter(access, DEVICE_MATCHER);
    this.device.on("statechange", (e) => {
      this.onstatechange(e);
    });
    this.device.on("midimessage", (e) => {
      if (this.ctrl) {
        this.onmidimessage(e);
      }
    });
    this.device.send([ 0xb8, 0x00, 0x00 ]);
  }

  listen(store) {
    this.store = store;
    this.store.on("ctrl:init", (data) => {
      this.ctrl = data;
    });
    this.store.on("synthDefList:init", (data) => {
      data.forEach((synthDef, index) => {
        this.state.ledColor[index] = this.toLEDColor(synthDef);
      });
      this.updateLED();
    });
    this.store.on("synthDefList", (data) => {
      data.forEach((synthDef, index) => {
        this.state.ledColor[index] = this.toLEDColor(synthDef);
      });
      this.updateLED();
    });
  }

  onstatechange(e) {
    const isConnected = e.port.state === "connected";

    this.dispatcher.emit("mode", isConnected ? 1 : 0);
  }

  onmidimessage(e) {
    const [ st, d1, d2 ] = e.data;

    if (st === 0xb8 && KNOB1_MAP.includes(d1)) {
      this.updateCtrl(KNOB1_MAP.indexOf(d1), KNOB1, Math.fround(d2 / 128));
    }
    if (st === 0xb8 && KNOB2_MAP.includes(d1)) {
      this.updateCtrl(KNOB2_MAP.indexOf(d1), KNOB2, Math.fround(d2 / 128));
    }
    if (st === 0xb8 && CURSOR_MAP.includes(d1)) {
      this.updateCursor(CURSOR_MAP.indexOf(d1), d2 ? 1 : 0);
    }
    if (st === 0x98 && PAD_MAP.includes(d1)) {
      this.padOn(PAD_MAP.indexOf(d1));
    }
    if (st === 0x88 && PAD_MAP.includes(d1)) {
      this.padOff(PAD_MAP.indexOf(d1));
    }
  }

  updateCursor(cursor, value) {
    const state = this.state;

    state.cursor[cursor] = value;

    if (cursor === UP) {
      state.hold = 0;
    }
    if (cursor === DOWN) {
      state.hold = 1;
    }
    if (cursor === LEFT) {
      if (value) {
        this.checkLED();
      } else {
        this.updateLED();
      }
    }
    if (state.cursor[LEFT] && state.cursor[RIGHT]) {
      this.resetAllCtrl();
      this.updateLED();
    }
  }

  resetAllCtrl() {
    this.ctrl.forEach((ctrl) => {
      ctrl.fill(0);
    });
    this.dispatcher.emit("ctrl", this.ctrl);
  }

  updateCtrl(index, ctrlType, value) {
    if (this.ctrl[index][ctrlType] !== value) {
      this.ctrl[index][ctrlType] = value;
      this.dispatcher.emit("ctrl", this.ctrl);
      this.updateLED();
    }
  }

  padOn(index) {
    this.updateCtrl(index, PAD, 1);
  }

  padOff(index) {
    this.updateCtrl(index, PAD, 0);
  }

  updateLED() {
    if (this.ctrl && this.state.ledColor.length) {
      PAD_MAP.forEach((pad, index) => {
        const st = 0x98;
        const d1 = pad;
        const d2 = this.computeLEDValue(index);

        if (d2 !== this.state.led[index]) {
          this.device.send([ st, d1, d2 ]);
          this.state.led[index] = d2;
        }
      });
    }
  }

  checkLED() {
    if (this.ctrl && this.state.ledColor.length) {
      PAD_MAP.forEach((pad, index) => {
        const st = 0x98;
        const d1 = pad;
        const d2 = this.state.ledColor[index][2];

        if (d2 !== this.state.led[index]) {
          this.device.send([ st, d1, d2 ]);
          this.state.led[index] = d2;
        }
      });
    }
  }

  toLEDColor(synthDef) {
    if (/^R/.test(synthDef.name)) {
      return LED_COLORS["R"];
    }
    if (/^G/.test(synthDef.name)) {
      return LED_COLORS["G"];
    }
    return LED_COLORS["Y"];
  }

  computeLEDValue(index) {
    const ctrl = this.ctrl;
    const ledColor = this.state.ledColor[index];

    return rateAt(ledColor, ctrl[index][KNOB2]) * ctrl[index][PAD];
  }
}

function rateAt(list, rate) {
  return list[Math.max(0, Math.min((list.length * rate)|0, list.length - 1))];
}

module.exports = MIDI;
