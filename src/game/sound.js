(function(ns) {
  var audioContext = null;
  var engineOscillator = null;
  var engineGain = null;
  var muted = Dom.storage.muted === "true";

  function isAvailable() {
    return window.AudioContext || window.webkitAudioContext;
  }

  function init() {
    var AudioContextConstructor = isAvailable();
    if (muted || audioContext || !AudioContextConstructor) {
      return;
    }

    audioContext = new AudioContextConstructor();
    engineOscillator = audioContext.createOscillator();
    engineGain = audioContext.createGain();
    engineOscillator.type = "sawtooth";
    engineOscillator.frequency.value = 70;
    engineGain.gain.value = 0;
    engineOscillator.connect(engineGain);
    engineGain.connect(audioContext.destination);
    engineOscillator.start();
  }

  function resume() {
    init();
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume();
    }
  }

  function updateEngine(state) {
    var speedRatio;
    if (!audioContext || !engineOscillator || !engineGain) {
      return;
    }

    speedRatio = Util.limit(state.speed / state.maxSpeed, 0, 1.3);
    engineOscillator.frequency.setTargetAtTime(
      65 + (speedRatio * 150),
      audioContext.currentTime,
      0.04
    );
    engineGain.gain.setTargetAtTime(
      state.phase === "running" ? 0.015 + (speedRatio * 0.045) : 0,
      audioContext.currentTime,
      0.08
    );
  }

  function playCrash() {
    var oscillator;
    var gain;
    if (!audioContext || muted) {
      return;
    }

    oscillator = audioContext.createOscillator();
    gain = audioContext.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(110, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(45, audioContext.currentTime + 0.18);
    gain.gain.setValueAtTime(0.12, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  }

  function setMuted(value) {
    muted = value;
    if (engineGain && audioContext) {
      engineGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.03);
    }
    if (!muted) {
      resume();
    }
  }

  ns.Sound = {
    init: resume,
    updateEngine: updateEngine,
    playCrash: playCrash,
    setMuted: setMuted
  };
})(window.ApexRacer = window.ApexRacer || {});
