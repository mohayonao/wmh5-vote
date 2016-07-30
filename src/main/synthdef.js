"use strict";

const nmap = require("nmap");
const decoder = require("synthdef-decoder");
const validator = require("synthdef-json-validator");

function decode(buffer) {
  const synthDefList = decoder.decode(buffer);

  synthDefList.forEach((synthDef) => {
    synthDef.consts = synthDef.consts.map((x) => {
      return (x === Infinity || x === -Infinity) ? "Infinity" : x;
    });
  });

  if (synthDefList.length === 8 && validator.validate(synthDefList)) {
    return synthDefList;
  }

  return nmap(8, empty);
}

function empty() {
  return { name: "", consts: [], paramValues: [], paramIndices: {}, units: [] };
}

module.exports = { decode, empty };
