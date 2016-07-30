"use strict";

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const Dispatcher = require("./dispatcher");
const Store = require("./Store");
const View = require("./View");
const config = require("../config");
const tapToWebAudioAPI = require("./tapToWebAudioAPI");

function main() {
  const $message = document.getElementById("message");

  if (!AudioContext) {
    $message.textContent = "NOT SUPPORTED";
    return;
  }
  $message.textContent = "TAP TO HACK";

  tapToWebAudioAPI((audioContext) => {
    document.body.removeChild($message);

    const dispatcher = new Dispatcher();
    const store = new Store(dispatcher, config);
    const view = new View(dispatcher, document.getElementById("canvas"));

    view.listen(store);

    window.audioContext = audioContext;
  });
}

window.addEventListener("DOMContentLoaded", main);
