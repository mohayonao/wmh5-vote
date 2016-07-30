"use strict";

const events = require("events");
const firebase = require("firebase");

class Store extends events.EventEmitter {
  constructor(dispatcher, config) {
    super();

    firebase.initializeApp(config);

    this.dispatcher = dispatcher;
    this.db = firebase.database();

    this._setupDatabase();
    this._setupDispatcher();
  }

  _setupDatabase() {
    const flag = {};

    this.db.ref("vote").on("value", (e) => {
      if (flag.vote) {
        this.emit("vote", e.val()|0);
      }
      flag.vote = true;
    });
    this.db.ref("ctrl").on("value", (e) => {
      if (flag.ctrl) {
        this.emit("ctrl", e.val());
        flag.ctrl = true;
      } else {
        this.emit("ctrl:init", e.val());
      }
    });
  }

  _setupDispatcher() {
    this.dispatcher.on("vote", (data) => {
      this.db.ref("vote").set(data + Math.random());
    });
    this.dispatcher.on("mode", (data) => {
      this.emit("mode", data);
    });
    this.dispatcher.on("ctrl", (data) => {
      this.db.ref("ctrl").set(data);
    });
  }
}

module.exports = Store;
