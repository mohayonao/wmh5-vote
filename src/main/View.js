"use strict";

const events = "ontouchstart" in window ? [ "touchstart" ] : [ "mousedown" ];
const R = [ 0xff, 0x52, 0x52 ];
const B = [ 0x03, 0xa9, 0xf4 ];

class View {
  constructor(dispatcher, elem) {
    this.dispatcher = dispatcher;
    this.elem = elem;

    this.$r = this._createRect(elem, 0);
    this.$b = this._createRect(elem, 1);
    this.state = { mode: 0, r: 0, b: 0, rRate: 0, bRate: 0 };

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
    const rRate = clamp(state.r, 0.1, 1);
    const bRate = clamp(state.b, 0.1, 1);

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
}

function clamp(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(value, maxValue));
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
