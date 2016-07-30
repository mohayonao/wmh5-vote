"use strict";

const synthdef = require("./synthdef");
const events = "ontouchstart" in window ? [ "touchstart" ] : [ "mousedown" ];
const R = [ 0xff, 0x52, 0x52 ];
const B = [ 0x03, 0xa9, 0xf4 ];

class View {
  constructor(dispatcher, elem) {
    this.dispatcher = dispatcher;
    this.elem = elem;
    this.state = { mode: -1, r: 0, b: 0, rRate: 0, bRate: 0, rms: 0 };

    this.$r = this._createRect(elem, 0);
    this.$b = this._createRect(elem, 1);

    this._setupDragAndDrop();

    this.changeMode(0);
    this.animate();
  }

  listen(store) {
    this.store = store;
    this.store.on("vote", (data) => {
      this.vote(data);
    });
    this.store.on("mode", (data) => {
      this.changeMode(data);
    });
    this.store.on("rms", (data) => {
      this.changeRMS(data);
    });
  }

  changeMode(mode) {
    if (mode !== this.state.mode) {
      if (mode) {
        setAttribute(this.$r, { x: " 0%", y: " 0%", width: " 50%", height: "100%" });
        setAttribute(this.$b, { x: "50%", y: " 0%", width: " 50%", height: "100%" });
      } else {
        setAttribute(this.$r, { x: " 0%", y: " 0%", width: "100%", height: " 50%" });
        setAttribute(this.$b, { x: " 0%", y: "50%", width: "100%", height: " 50%" });
      }
      this.state.mode = mode;
    }
  }
  changeRMS(rms) {
    this.state.rms = rms;
  }

  vote(value) {
    if (value === 0) {
      this.state.r += 1;
    }
    if (value === 1) {
      this.state.b += 1;
    }
  }

  animate() {
    const state = this.state;
    const rRate = clamp(state.r + rand2(state.rms * 0.15), 0.1, 1);
    const bRate = clamp(state.b + rand2(state.rms * 0.15), 0.1, 1);

    if (rRate !== state.rRate) {
      setAttribute(this.$r, { fill: toRGB(R.map(x => x * rRate)) });
      state.rRate = rRate;
    }

    if (bRate !== state.bRate) {
      setAttribute(this.$b, { fill: toRGB(B.map(x => x * bRate)) });
      state.bRate = bRate;
    }

    state.r = Math.fround(state.r * 0.75);
    state.b = Math.fround(state.b * 0.75);

    requestAnimationFrame(() => this.animate());
  }

  _createRect(elem, value) {
    const rect = document.createElementNS(elem.namespaceURI, "rect");

    events.forEach((event) => {
      rect.addEventListener(event, (e) => {
        e.preventDefault();
        this.dispatcher.emit("vote", value);
      });
    });

    elem.appendChild(rect);

    return rect;
  }

  _setupDragAndDrop() {
    const dropFile = (file) => {
      if (!/\.scsyndef/.test(file.name)) {
        return;
      }
      const reader = new FileReader();

      reader.onload = (e) => {
        const data = synthdef.decode(e.target.result);

        this.dispatcher.emit("synthDefList", data);
      };
      reader.readAsArrayBuffer(file);
    };

    window.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
    window.addEventListener("drop", (e) => {
      e.preventDefault();
      dropFile(e.dataTransfer.files[0]);
    });
  }
}

function clamp(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(value, maxValue));
}

function rand2(value) {
  return (Math.random() * 2 - 1) * value;
}

function toRGB(rgb) {
  return `rgb(${ rgb.map(x => clamp(x|0, 0, 255)).join("," ) })`;
}

function setAttribute(elem, attrs) {
  Object.keys(attrs).forEach((key) => {
    elem.setAttribute(key, attrs[key].trim());
  });
}

module.exports = View;
