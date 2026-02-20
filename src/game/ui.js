(function(ns) {
  function formatInteger(value) {
    return Math.round(value).toLocaleString("en-US");
  }

  function formatDistance(worldUnits) {
    return (worldUnits / 1000).toFixed(1) + " km";
  }

  function formatClock(seconds) {
    var safe = Math.max(0, Math.floor(seconds));
    var minutes = Math.floor(safe / 60);
    var remaining = safe % 60;
    return (minutes < 10 ? "0" : "") + minutes + ":" + (remaining < 10 ? "0" : "") + remaining;
  }

  function formatLap(seconds) {
    if (!seconds) {
      return "--";
    }
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds - (mins * 60));
    var tenths = Math.floor(10 * (seconds - Math.floor(seconds)));
    if (mins > 0) {
      return mins + ":" + (secs < 10 ? "0" : "") + secs + "." + tenths;
    }
    return secs + "." + tenths;
  }

  function collectRefs() {
    return {
      playerHandle: Dom.get("player_handle"),
      playerHandleRecord: Dom.get("player_handle_record"),

      speed: Dom.get("speed_value"),
      score: Dom.get("score_value"),
      combo: Dom.get("combo_value"),
      level: Dom.get("level_value"),
      lap: Dom.get("lap_value"),
      nitroValue: Dom.get("nitro_value"),

      healthFill: Dom.get("health_fill"),
      healthText: Dom.get("health_text"),
      nitroFill: Dom.get("nitro_fill"),

      sessionScore: Dom.get("session_score"),
      sessionDistance: Dom.get("session_distance"),
      sessionTime: Dom.get("session_time"),
      sessionRank: Dom.get("session_rank"),

      bestScore: Dom.get("best_score_value"),
      bestDistance: Dom.get("best_distance_value"),
      bestTime: Dom.get("best_time_value"),
      bestLap: Dom.get("best_lap_value"),

      startButton: Dom.get("startButton"),
      restartButton: Dom.get("restartButton"),
      overlay: Dom.get("phaseOverlay"),
      overlayTitle: Dom.get("overlayTitle"),
      overlayMessage: Dom.get("overlayMessage"),
      overlayButton: Dom.get("overlayButton"),
      countdown: Dom.get("countdown"),
      eventFeed: Dom.get("eventFeed"),
      touchButtons: document.querySelectorAll("[data-input]")
    };
  }

  function setInput(state, inputName, isDown) {
    if (state.phase === "menu" || state.phase === "gameover") {
      if (inputName === "faster" || inputName === "nitro") {
        return;
      }
    }

    state.input[inputName] = isDown;
  }

  function bindTouchControls(state, refs) {
    var downHandler = function(ev) {
      var name = ev.currentTarget.getAttribute("data-input");
      ev.preventDefault();
      setInput(state, name, true);
    };

    var upHandler = function(ev) {
      var name = ev.currentTarget.getAttribute("data-input");
      ev.preventDefault();
      setInput(state, name, false);
    };

    refs.touchButtons.forEach(function(button) {
      button.addEventListener("pointerdown", downHandler);
      button.addEventListener("pointerup", upHandler);
      button.addEventListener("pointerleave", upHandler);
      button.addEventListener("pointercancel", upHandler);
    });
  }

  function bindButtons(state, refs) {
    refs.startButton.addEventListener("click", function() {
      ns.Gameplay.startRun(state);
    });

    refs.restartButton.addEventListener("click", function() {
      ns.Gameplay.restartRun(state);
    });

    refs.overlayButton.addEventListener("click", function() {
      if (state.phase === "paused") {
        ns.Gameplay.togglePause(state);
        return;
      }
      ns.Gameplay.startRun(state);
    });

    bindTouchControls(state, refs);
  }

  function renderOverlay(state) {
    var refs = state.ui;
    var summary;

    if (state.phase === "menu") {
      refs.overlay.className = "overlay";
      refs.overlayTitle.textContent = "Ready To Race";
      refs.overlayMessage.textContent = "Build your best run by balancing speed, control, and near-miss combos.";
      refs.overlayButton.textContent = "Start Run";
      return;
    }

    if (state.phase === "paused") {
      refs.overlay.className = "overlay";
      refs.overlayTitle.textContent = "Paused";
      refs.overlayMessage.textContent = "Take your time. Press P or Resume when ready.";
      refs.overlayButton.textContent = "Resume";
      return;
    }

    if (state.phase === "gameover") {
      summary = state.summary || { score: 0, distance: 0, time: 0, nearMisses: 0 };
      refs.overlay.className = "overlay";
      refs.overlayTitle.textContent = "Run Over";
      refs.overlayMessage.textContent = "Score " + formatInteger(summary.score) + " | " +
        formatDistance(summary.distance) + " | Near misses " + summary.nearMisses;
      refs.overlayButton.textContent = "Run Again";
      return;
    }

    refs.overlay.className = "overlay hidden";
  }

  function renderCountdown(state) {
    var refs = state.ui;
    if (state.phase !== "countdown") {
      refs.countdown.className = "countdown hidden";
      return;
    }

    refs.countdown.className = "countdown";
    refs.countdown.textContent = Math.max(1, Math.ceil(state.countdown));
  }

  function renderEventFeed(state) {
    var refs = state.ui;
    if (state.eventTimer <= 0 || !state.eventText) {
      refs.eventFeed.className = "event-feed";
      refs.eventFeed.textContent = "";
      return;
    }
    refs.eventFeed.className = "event-feed on";
    refs.eventFeed.textContent = state.eventText;
  }

  function renderRecords(state) {
    var refs = state.ui;
    refs.bestScore.textContent = formatInteger(state.records.bestScore);
    refs.bestDistance.textContent = formatDistance(state.records.bestDistance);
    refs.bestTime.textContent = formatClock(state.records.bestTime);
    refs.bestLap.textContent = formatLap(state.records.bestLapTime);
  }

  function renderHud(state) {
    var refs = state.ui;
    var speedKmh = Math.round((state.speed / state.maxSpeed) * 320);
    var healthPercent = Util.limit(state.health, 0, 100);
    var nitroPercent = Util.limit(state.nitro, 0, 100);

    refs.speed.textContent = String(speedKmh);
    refs.score.textContent = formatInteger(state.score);
    refs.combo.textContent = "x" + state.multiplier.toFixed(2);
    refs.level.textContent = String(state.difficultyLevel);
    refs.lap.textContent = String(state.lap);
    refs.nitroValue.textContent = String(Math.round(nitroPercent));

    refs.healthFill.style.width = healthPercent.toFixed(1) + "%";
    refs.nitroFill.style.width = nitroPercent.toFixed(1) + "%";
    refs.healthText.textContent = Math.round(healthPercent) + "%";

    refs.sessionScore.textContent = formatInteger(state.score);
    refs.sessionDistance.textContent = formatDistance(state.distance);
    refs.sessionTime.textContent = formatClock(state.elapsed);
    refs.sessionRank.textContent = state.rank;

    renderRecords(state);
    renderOverlay(state);
    renderCountdown(state);
    renderEventFeed(state);
  }

  function create(state) {
    var refs = collectRefs();
    bindButtons(state, refs);
    refs.playerHandle.textContent = state.playerName;
    refs.playerHandleRecord.textContent = state.playerName;
    state.ui = refs;
    renderHud(state);
  }

  ns.UI = {
    create: create,
    render: renderHud
  };
})(window.ApexRacer = window.ApexRacer || {});
