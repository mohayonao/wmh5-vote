"use strict";

const events = require("events");
const firebase = require("firebase");

class Store extends events.EventEmitter {
  constructor(dispatcher, config) {
    super();

    firebase.initializeApp(config);

    this.dispatcher = dispatcher;
    this.db = firebase.database();

    this.dispatcher.on("vote", (data) => {
      this.db.ref("vote").set(data + Math.random());
    });

    this.db.ref("vote").on("value", (e) => {
      this.emit("vote", e.val()|0);
    });
  }
}

module.exports = Store;
