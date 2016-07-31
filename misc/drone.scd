(
var tr = Array.newClear(8);

var beep, drone, noise;

beep = {|a,b,gate,freq,out,rate|
  var trig, env;
  var op1;

  a = a.lag(0.2);
  b = b.lag(0.0125);

  trig = Dust.kr(a * 2 + 0.5);
  env = Trig1.kr(trig, b * 0.25 + 0.005) * gate;

  op1 = LFPar.ar(freq * rate);
  op1 = op1.tanh * env * 0.125;
  op1 = op1 * (ToggleFF.kr(Dust.kr(a * 8)) * 0.5 + 0.5);

  Out.ar(out, op1);
};

drone = {|a,b,gate,freq|
  var trig;
  var op1;
  var env1;

  freq = freq * (1 + Rand(-0.0125, 0.0125));
  trig = Trig1.kr(Dust.kr(0.05), Rand(2, 8)) * gate;
  env1 = EnvGen.kr(Env.asr(5, 1, 12), trig);

  op1 = SinOsc.ar(freq) * env1;
  op1 = op1 * b * 0.125;
  op1 = op1 * (ToggleFF.kr(Dust.kr(a * 4)) * 0.25 + 0.5);

  Out.ar(0, op1 ! 2);
};

noise = {|a,b,gate,freq|
  var env1;
  var op1;

  a = a.lag(0.5);

  freq = freq * 4 * (1 + Rand(-0.0125, 0.0125));

  env1 = EnvGen.kr(Env.asr(8, 1, 8), gate);
  op1 = PinkNoise.ar() * env1;
  op1 = RHPF.ar(op1, freq, 0.005);

  op1 = op1 * b * 0.125;
  op1 = op1 * (ToggleFF.kr(Dust.kr(a * 4)) * 0.25 + 0.5);

  Out.ar(0, op1 ! 2);
};


tr[0] = SynthDef("R", {|a=0,b=0,gate=0|
  beep.value(a,b,gate,52.midicps,0,0.5);
  beep.value(a,b,gate,60.midicps,1,0.5);
  beep.value(a,b,gate,67.midicps,0,0.5);
  beep.value(a,b,gate,83.midicps,1,0.5);
});
tr[1] = SynthDef("R", {|a=0,b=0,gate=0|
  beep.value(a,b,gate,52.midicps,0,4);
  beep.value(a,b,gate,60.midicps,1,4);
  beep.value(a,b,gate,67.midicps,0,4);
  beep.value(a,b,gate,83.midicps,1,4);
});
tr[2] = SynthDef("G", {|a=0,b=0,gate=0|
  drone.value(a,b,gate,52.midicps);
  drone.value(a,b,gate,67.midicps);
});
tr[3] = SynthDef("G", {|a=0,b=0,gate=0|
  drone.value(a,b,gate,60.midicps);
  drone.value(a,b,gate,83.midicps);
});
tr[4] = SynthDef("Y", {|a=0,b=0,gate=0|
  noise.value(a,b,gate,52.midicps);
});
tr[5] = SynthDef("Y", {|a=0,b=0,gate=0|
  noise.value(a,b,gate,60.midicps);
});
tr[6] = SynthDef("Y", {|a=0,b=0,gate=0|
  noise.value(a,b,gate,67.midicps);
});
tr[7] = SynthDef("Y", {|a=0,b=0,gate=0|
  noise.value(a,b,gate,83.midicps);
});

tr.do {|synthdef| synthdef.play(addAction:'addToTail') };
tr.writeDefFile("drone");

SynthDef.synthDefDir;
)
