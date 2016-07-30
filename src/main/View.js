"use strict";

const events = "ontouchstart" in window ? [ "touchstart" ] : [ "mousedown" ];

class View {
  constructor(dispatcher, elem) {
    this.dispatcher = dispatcher;
    this.elem = elem;

    this.$r = this._createRect(elem, 0);
    this.$b = this._createRect(elem, 1);

    setAttribute(this.$r, { x: " 0%", y: " 0%", width: "100%", height: " 50%", fill: "#ff5252" });
    setAttribute(this.$b, { x: " 0%", y: "50%", width: "100%", height: " 50%", fill: "#03a9f4" });
  }

  listen(store) {
    this.store = store;
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

function setAttribute(elem, attrs) {
  Object.keys(attrs).forEach((key) => {
    elem.setAttribute(key, attrs[key].trim());
  });
}

module.exports = View;
