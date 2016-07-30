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
    this.dispatcher.on("mode", (data) => {
      this.emit("mode", data);
    });

    this.db.ref("vote").on("value", (e) => {
      this.emit("vote", e.val()|0);
    });
    this.dispatcher.on("ctrl", (data) => {
      this.db.ref("ctrl").set(data);
    });
  }
}

module.exports = Store;
