"use strict";

const bufSrcQ = [];
const events = "ontouchstart" in window ? [ "touchstart", "touchend" ] : [ "mousedown", "mouseup" ];

function tapToStartWebAudioAPI(callback) {
  const audioContext = new AudioContext();

  function ontap(e)  {
    e.preventDefault();
    chore(audioContext, () => {
      events.forEach((event) => {
        window.removeEventListener(event, ontap);
      });
      callback(audioContext);
    });
  }

  events.forEach((event) => {
    window.addEventListener(event, ontap);
  });
}

function chore(audioContext, callback) {
  const bufSrc = audioContext.createBufferSource();

  bufSrc.buffer = audioContext.createBuffer(1, 128, audioContext.sampleRate);
  bufSrc.start();
  bufSrc.connect(audioContext.destination);
  bufSrc.onended = () => {
    bufSrcQ.splice(0).forEach((bufSrc) => {
      bufSrc.disconnect();
    });
    callback();
  };

  bufSrcQ.push(bufSrc);
}

module.exports = tapToStartWebAudioAPI;
