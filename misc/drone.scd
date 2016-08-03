(
var tr = Array.newClear(8);

var beep, drone, noise, autoamp;

beep = {|a,b,gate,freq,out,rate|
  var trig, env;
  var op1;

  a = a.lag(0.2);
  b = b.lag(0.0125);

  trig = Dust.kr(a * 2 + 0.5);
  env = Trig1.kr(trig, b * 0.25 + 0.005) * gate;

  op1 = LFPar.ar(freq * rate);
  op1 = op1.tanh * env * 0.0125;

  Out.ar(out, op1);
};

drone = {|a,b,gate,freq|
  var trig;
  var op1;
  var env1;

  freq = freq * (1 + Rand(-0.015, 0.015));
  freq = [ 0.9975, 1.0025 ] * freq;
  trig = Trig1.kr(Dust.kr(0.05), Rand(2, 8)) * gate;
  env1 = EnvGen.kr(Env.asr(5, 1, 12), trig);

  op1 = SinOscFB.ar(freq, 0.25).mean * env1;
  op1 = op1 * b * 0.25;
  op1 = op1 * (ToggleFF.kr(Dust.kr(a * 12)) * 0.25 + 0.5);

  Out.ar(0, op1 ! 2);
};

noise = {|a,b,gate,freq|
  var env1;
  var op1;
  var c;

  a = a.lag(0.5);
  b = b.lag(0.25);
  c = 0.125001 - (a * 0.125);

  freq = freq * 4 * (1 + Rand(-0.0125, 0.0125));

  env1 = EnvGen.kr(Env.asr(8, 1, 8), gate);
  op1 = PinkNoise.ar() * env1;
  op1 = RHPF.ar(op1, freq * 0.995, c);
  op1 = RLPF.ar(op1, freq * 1.025, c);

  op1 = op1 * b * 0.005;

  Out.ar(2, op1);
};

autoamp = {|a,b,gate|
  var op1, amp;

  a = a.lag(0.25);
  b = b.lag(0.25);

  amp = ToggleFF.kr(Dust.kr(a * 32)) - 1;
  amp = 0.5 + (amp * b);

  op1 = In.ar(2) * amp;

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
  noise.value(a,b,gate,60.midicps);
});
tr[5] = SynthDef("Y", {|a=0,b=0,gate=0|
  noise.value(a,b,gate,67.midicps);
});
tr[6] = SynthDef("Y", {|a=0,b=0,gate=0|
  noise.value(a,b,gate,83.midicps);
});
tr[7] = SynthDef("Y", {|a=0,b=0,gate=0|
  autoamp.value(a,b,gate);
});

tr.do {|synthdef| synthdef.play(addAction:'addToTail') };
tr.writeDefFile("drone");

SynthDef.synthDefDir;
)
