(function(ns) {
  function loadRecords() {
    var fallback = {
      bestScore: 0,
      bestDistance: 0,
      bestTime: 0,
      bestLapTime: 0
    };

    try {
      var raw = Dom.storage[ns.STORAGE_KEYS.records];
      if (!raw) {
        return fallback;
      }

      var parsed = JSON.parse(raw);
      return {
        bestScore: Util.toInt(parsed.bestScore, 0),
        bestDistance: Util.toFloat(parsed.bestDistance, 0),
        bestTime: Util.toFloat(parsed.bestTime, 0),
        bestLapTime: Util.toFloat(parsed.bestLapTime, 0)
      };
    } catch (err) {
      return fallback;
    }
  }

  function persistRecords(records) {
    Dom.storage[ns.STORAGE_KEYS.records] = JSON.stringify(records);
  }

  function deriveRank(score, config) {
    var rank = config.rankThresholds[0].label;
    for (var n = 0; n < config.rankThresholds.length; n++) {
      if (score >= config.rankThresholds[n].score) {
        rank = config.rankThresholds[n].label;
      }
    }
    return rank;
  }

  function recomputeCamera(state) {
    state.cameraDepth = 1 / Math.tan((state.fieldOfView / 2) * Math.PI / 180);
    state.playerZ = state.cameraHeight * state.cameraDepth;
    state.resolution = state.height / 480;

    state.maxSpeed = state.segmentLength / state.step;
    state.accel = state.maxSpeed / 5;
    state.braking = -state.maxSpeed;
    state.decel = -state.maxSpeed / 5;
    state.offRoadDecel = -state.maxSpeed / 2;
    state.offRoadLimit = state.maxSpeed / 4;
  }

  function clearInputFlags(state) {
    state.input.left = false;
    state.input.right = false;
    state.input.faster = false;
    state.input.slower = false;
    state.input.nitro = false;
  }

  function resetRunState(state) {
    clearInputFlags(state);

    state.phase = "menu";
    state.countdown = 0;
    state.position = 0;
    state.speed = 0;
    state.activeMaxSpeed = state.maxSpeed;
    state.playerX = 0;

    state.skyOffset = 0;
    state.hillOffset = 0;
    state.treeOffset = 0;

    state.health = state.config.maxHealth;
    state.nitro = state.config.maxNitro;
    state.nitroActive = false;

    state.score = 0;
    state.distance = 0;
    state.elapsed = 0;
    state.currentLapTime = 0;
    state.lastLapTime = 0;
    state.fastLapTime = state.records.bestLapTime;
    state.lap = 1;

    state.combo = 0;
    state.comboTimer = 0;
    state.multiplier = 1;
    state.nearMisses = 0;

    state.difficultyLevel = 1;
    state.trafficAdjustCooldown = 0;

    state.eventText = "";
    state.eventTimer = 0;
    state.damageFlash = 0;
    state.nearMissFlash = 0;

    state.rank = deriveRank(0, state.config);
  }

  function createNoopStats() {
    return {
      update: function() {}
    };
  }

  function createState(canvas) {
    var config = ns.CONFIG;
    var playerName = Dom.storage[ns.STORAGE_KEYS.player] || "sudheerxdev";
    Dom.storage[ns.STORAGE_KEYS.player] = playerName;

    var state = {
      config: config,
      canvas: canvas,
      ctx: canvas.getContext("2d"),
      width: config.width,
      height: config.height,
      step: config.step,
      roadWidth: config.roadWidth,
      segmentLength: config.segmentLength,
      rumbleLength: config.rumbleLength,
      lanes: config.lanes,
      drawDistance: config.drawDistance,
      cameraHeight: config.cameraHeight,
      fieldOfView: config.fieldOfView,
      fogDensity: config.fogDensity,
      centrifugal: config.centrifugal,
      skySpeed: config.skySpeed,
      hillSpeed: config.hillSpeed,
      treeSpeed: config.treeSpeed,
      segments: [],
      cars: [],
      trackLength: 0,
      background: null,
      sprites: null,
      input: {
        left: false,
        right: false,
        faster: false,
        slower: false,
        nitro: false
      },
      playerName: playerName,
      records: loadRecords(),
      summary: null,
      ui: null
    };

    canvas.width = state.width;
    canvas.height = state.height;

    recomputeCamera(state);
    resetRunState(state);

    return state;
  }

  ns.State = {
    createState: createState,
    createNoopStats: createNoopStats,
    clearInputFlags: clearInputFlags,
    resetRunState: resetRunState,
    recomputeCamera: recomputeCamera,
    loadRecords: loadRecords,
    persistRecords: persistRecords,
    deriveRank: deriveRank
  };
})(window.ApexRacer = window.ApexRacer || {});
