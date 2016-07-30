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
      console.log("vote", data);
    });
  }
}

module.exports = Store;
