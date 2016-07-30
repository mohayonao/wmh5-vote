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
      } else {
        this.emit("ctrl:init", e.val());
        flag.ctrl = true;
      }
    });
    this.db.ref("synthDefList").on("value", (e) => {
      if (flag.synthDefList) {
        this.emit("synthDefList", JSON.parse(e.val()));
      } else {
        this.emit("synthDefList:init", JSON.parse(e.val()));
        flag.synthDefList = true;
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
    this.dispatcher.on("synthDefList", (data) => {
      this.db.ref("synthDefList").set(JSON.stringify(data));
    });
    this.dispatcher.on("rms", (data) => {
      this.emit("rms", data);
    });
  }
}

module.exports = Store;
