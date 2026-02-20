(function(ns) {
  var config = {
    fps: 60,
    step: 1 / 60,
    width: 1024,
    height: 576,
    centrifugal: 0.3,
    skySpeed: 0.001,
    hillSpeed: 0.002,
    treeSpeed: 0.003,
    roadWidth: 2000,
    segmentLength: 200,
    rumbleLength: 3,
    lanes: 3,
    fieldOfView: 100,
    cameraHeight: 1000,
    drawDistance: 300,
    fogDensity: 5,
    trafficBase: 140,
    trafficStep: 12,
    trafficMax: 280,
    maxHealth: 100,
    maxNitro: 100,
    nitroDrainPerSecond: 38,
    nitroRecoverPerSecond: 20,
    nitroBoostAccelFactor: 1.55,
    nitroTopSpeedFactor: 1.3,
    comboWindow: 2.5,
    nearMissLateralThreshold: 0.22,
    difficultyStepSeconds: 20,
    maxDifficultyLevel: 10,
    countdownSeconds: 3,
    eventFeedDuration: 1.6,
    damage: {
      carCollision: 24,
      roadsideCollision: 14,
      offRoadPerSecond: 7
    },
    rankThresholds: [
      { score: 0, label: "Rookie" },
      { score: 15000, label: "Street Scout" },
      { score: 40000, label: "Asphalt Pro" },
      { score: 80000, label: "Velocity Elite" },
      { score: 140000, label: "Apex Legend" }
    ]
  };

  var keyMap = {
    left: [KEY.LEFT, KEY.A],
    right: [KEY.RIGHT, KEY.D],
    faster: [KEY.UP, KEY.W],
    slower: [KEY.DOWN, KEY.S],
    nitro: [32],
    start: [13],
    pause: [80],
    restart: [82]
  };

  ns.CONFIG = config;
  ns.KEYMAP = keyMap;
  ns.STORAGE_KEYS = {
    records: "apex_racer_records_v1",
    player: "apex_racer_player"
  };
})(window.ApexRacer = window.ApexRacer || {});
