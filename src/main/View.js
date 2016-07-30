"use strict";

class View {
  constructor(dispatcher, elem) {
    this.dispatcher = dispatcher;
    this.elem = elem;
  }

  listen(store) {
    this.store = store;
  }
}

module.exports = View;
