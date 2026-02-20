(function(ns) {
  function setEvent(state, text) {
    state.eventText = text;
    state.eventTimer = state.config.eventFeedDuration;
  }

  function applyDamage(state, amount) {
    state.health = Math.max(0, state.health - amount);
    state.damageFlash = 1;
    state.combo = 0;
    state.comboTimer = 0;
    state.multiplier = 1;
  }

  function updateDifficulty(state) {
    var nextLevel = Math.min(
      state.config.maxDifficultyLevel,
      1 + Math.floor(state.elapsed / state.config.difficultyStepSeconds)
    );

    if (nextLevel > state.difficultyLevel) {
      state.difficultyLevel = nextLevel;
      state.health = Math.min(state.config.maxHealth, state.health + 8);
      state.nitro = Math.min(state.config.maxNitro, state.nitro + 12);
      setEvent(state, "Difficulty up: Level " + nextLevel);
    }
  }

  function updateNitroState(state, dt) {
    state.nitroActive = (
      state.input.nitro &&
      state.nitro > 0 &&
      state.speed > (state.maxSpeed * 0.18) &&
      state.phase === "running"
    );

    if (state.nitroActive) {
      state.nitro = Math.max(0, state.nitro - (state.config.nitroDrainPerSecond * dt));
      state.activeMaxSpeed = state.maxSpeed * state.config.nitroTopSpeedFactor;
      state.speed = Util.accelerate(state.speed, state.accel * state.config.nitroBoostAccelFactor, dt);
    } else {
      state.nitro = Math.min(state.config.maxNitro, state.nitro + (state.config.nitroRecoverPerSecond * dt));
      state.activeMaxSpeed = state.maxSpeed;
    }
  }

  function signedDistance(target, origin, trackLength) {
    var delta = target - origin;
    while (delta > trackLength / 2) {
      delta -= trackLength;
    }
    while (delta < -trackLength / 2) {
      delta += trackLength;
    }
    return delta;
  }

  function registerNearMiss(state) {
    var bonus;

    state.combo = Math.min(state.combo + 1, 20);
    state.comboTimer = state.config.comboWindow;
    state.multiplier = 1 + Math.min(state.combo * 0.15, 3);
    state.nearMisses += 1;
    bonus = Math.round(220 * state.multiplier);
    state.score += bonus;
    state.nearMissFlash = 1;
    setEvent(state, "Near miss +" + bonus + " (x" + state.multiplier.toFixed(2) + ")");
  }

  function updateNearMisses(state, playerX) {
    var playerWorldZ = Util.increase(state.position, state.playerZ, state.trackLength);
    var car;
    var relative;
    var lateral;
    var n;

    for (n = 0; n < state.cars.length; n++) {
      car = state.cars[n];
      relative = signedDistance(car.z, playerWorldZ, state.trackLength);
      lateral = Math.abs(car.offset - playerX);

      if (car.lastRelativeZ === null) {
        car.lastRelativeZ = relative;
        continue;
      }

      if (
        car.lastRelativeZ > 0 &&
        relative <= 0 &&
        lateral < state.config.nearMissLateralThreshold &&
        lateral > 0.08 &&
        state.speed > car.speed
      ) {
        registerNearMiss(state);
      }

      car.lastRelativeZ = relative;
    }
  }

  function checkGameOver(state) {
    if (state.health > 0) {
      return;
    }
    state.phase = "gameover";
    state.summary = {
      score: Math.round(state.score),
      distance: state.distance,
      time: state.elapsed,
      nearMisses: state.nearMisses
    };
    ns.State.clearInputFlags(state);
    updateRecords(state);
    setEvent(state, "Run ended");
  }

  function updateRecords(state) {
    var records = state.records;
    records.bestScore = Math.max(records.bestScore, Math.round(state.score));
    records.bestDistance = Math.max(records.bestDistance, state.distance);
    records.bestTime = Math.max(records.bestTime, state.elapsed);

    if (state.fastLapTime > 0) {
      if (!records.bestLapTime || state.fastLapTime < records.bestLapTime) {
        records.bestLapTime = state.fastLapTime;
      }
    }

    ns.State.persistRecords(records);
  }

  function updateLapStats(state, dt, previousPosition) {
    if (state.position <= state.playerZ) {
      return;
    }

    if (state.currentLapTime && (previousPosition < state.playerZ)) {
      state.lastLapTime = state.currentLapTime;
      if (!state.fastLapTime || state.lastLapTime < state.fastLapTime) {
        state.fastLapTime = state.lastLapTime;
      }
      state.currentLapTime = 0;
      state.lap += 1;
      state.health = Math.min(state.config.maxHealth, state.health + 6);
      state.nitro = Math.min(state.config.maxNitro, state.nitro + 10);
      setEvent(state, "Lap " + (state.lap - 1) + " complete");
      return;
    }

    state.currentLapTime += dt;
  }

  function updateScoring(state, dt) {
    var speedScore = state.speed * dt * 0.08;
    var flowScore = dt * 25;
    state.score += (speedScore + flowScore) * state.multiplier;
    state.distance += state.speed * dt;
    state.rank = ns.State.deriveRank(state.score, state.config);
  }

  function updateRun(state, dt) {
    var playerSegment = ns.Track.findSegment(state, state.position + state.playerZ);
    var playerW = SPRITES.PLAYER_STRAIGHT.w * SPRITES.SCALE;
    var speedPercent = state.speed / state.maxSpeed;
    var dx = dt * 2 * speedPercent;
    var startPosition = state.position;
    var n;
    var car;
    var carW;
    var sprite;
    var spriteW;

    state.elapsed += dt;
    updateDifficulty(state);

    state.trafficAdjustCooldown -= dt;
    if (state.trafficAdjustCooldown <= 0) {
      ns.Traffic.ensureTrafficDensity(state);
      state.trafficAdjustCooldown = 1;
    }

    ns.Traffic.updateCars(state, dt, playerSegment, playerW);
    state.position = Util.increase(state.position, dt * state.speed, state.trackLength);

    if (state.input.left) {
      state.playerX -= dx;
    } else if (state.input.right) {
      state.playerX += dx;
    }

    state.playerX -= (dx * speedPercent * playerSegment.curve * state.centrifugal);

    if (state.input.faster) {
      state.speed = Util.accelerate(state.speed, state.accel, dt);
    } else if (state.input.slower) {
      state.speed = Util.accelerate(state.speed, state.braking, dt);
    } else {
      state.speed = Util.accelerate(state.speed, state.decel, dt);
    }

    updateNitroState(state, dt);

    if ((state.playerX < -1) || (state.playerX > 1)) {
      if (state.speed > state.offRoadLimit) {
        state.speed = Util.accelerate(state.speed, state.offRoadDecel, dt);
        applyDamage(state, state.config.damage.offRoadPerSecond * dt);
      }

      for (n = 0; n < playerSegment.sprites.length; n++) {
        sprite = playerSegment.sprites[n];
        spriteW = sprite.source.w * SPRITES.SCALE;
        if (
          Util.overlap(
            state.playerX,
            playerW,
            sprite.offset + spriteW / 2 * (sprite.offset > 0 ? 1 : -1),
            spriteW
          )
        ) {
          state.speed = state.maxSpeed / 5;
          state.position = Util.increase(playerSegment.p1.world.z, -state.playerZ, state.trackLength);
          applyDamage(state, state.config.damage.roadsideCollision);
          break;
        }
      }
    }

    for (n = 0; n < playerSegment.cars.length; n++) {
      car = playerSegment.cars[n];
      carW = car.sprite.w * SPRITES.SCALE;
      if (state.speed > car.speed) {
        if (Util.overlap(state.playerX, playerW, car.offset, carW, 0.82)) {
          state.speed = car.speed * (car.speed / Math.max(state.speed, 1));
          state.position = Util.increase(car.z, -state.playerZ, state.trackLength);
          applyDamage(state, state.config.damage.carCollision + state.difficultyLevel);
          break;
        }
      }
    }

    updateNearMisses(state, state.playerX);

    state.playerX = Util.limit(state.playerX, -3, 3);
    state.speed = Util.limit(state.speed, 0, state.activeMaxSpeed);

    state.skyOffset = Util.increase(state.skyOffset, state.skySpeed * playerSegment.curve * (state.position - startPosition) / state.segmentLength, 1);
    state.hillOffset = Util.increase(state.hillOffset, state.hillSpeed * playerSegment.curve * (state.position - startPosition) / state.segmentLength, 1);
    state.treeOffset = Util.increase(state.treeOffset, state.treeSpeed * playerSegment.curve * (state.position - startPosition) / state.segmentLength, 1);

    updateLapStats(state, dt, startPosition);
    updateScoring(state, dt);

    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) {
        state.combo = 0;
        state.multiplier = 1;
      }
    }

    checkGameOver(state);
  }

  function updateTransitions(state, dt) {
    state.eventTimer = Math.max(0, state.eventTimer - dt);
    state.damageFlash = Math.max(0, state.damageFlash - (dt * 3.5));
    state.nearMissFlash = Math.max(0, state.nearMissFlash - (dt * 3.8));

    if (state.phase === "countdown") {
      state.countdown -= dt;
      if (state.countdown <= 0) {
        state.phase = "running";
        state.countdown = 0;
        setEvent(state, "Go");
      }
    }
  }

  function startRun(state) {
    ns.State.resetRunState(state);
    ns.Track.resetRoad(state);
    ns.Traffic.resetTraffic(state);
    state.phase = "countdown";
    state.countdown = state.config.countdownSeconds;
    state.rank = ns.State.deriveRank(state.score, state.config);
    state.summary = null;
    setEvent(state, "Run started");
  }

  function restartRun(state) {
    startRun(state);
  }

  function togglePause(state) {
    if (state.phase === "running") {
      state.phase = "paused";
      ns.State.clearInputFlags(state);
      setEvent(state, "Paused");
      return;
    }

    if (state.phase === "paused") {
      state.phase = "running";
      setEvent(state, "Resumed");
    }
  }

  function update(state, dt) {
    updateTransitions(state, dt);
    if (state.phase === "running") {
      updateRun(state, dt);
    }
  }

  ns.Gameplay = {
    update: update,
    startRun: startRun,
    restartRun: restartRun,
    togglePause: togglePause
  };
})(window.ApexRacer = window.ApexRacer || {});
