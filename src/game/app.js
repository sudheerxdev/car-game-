(function(ns) {
  function createKeyBindings(state) {
    var bindings = [];
    var map = ns.KEYMAP;

    function addHoldKeys(codes, inputName) {
      bindings.push({
        keys: codes,
        mode: "down",
        action: function() {
          state.input[inputName] = true;
        }
      });
      bindings.push({
        keys: codes,
        mode: "up",
        action: function() {
          state.input[inputName] = false;
        }
      });
    }

    addHoldKeys(map.left, "left");
    addHoldKeys(map.right, "right");
    addHoldKeys(map.faster, "faster");
    addHoldKeys(map.slower, "slower");
    addHoldKeys(map.nitro, "nitro");

    bindings.push({
      keys: map.pause,
      mode: "up",
      action: function() {
        ns.Gameplay.togglePause(state);
      }
    });

    bindings.push({
      keys: map.restart,
      mode: "up",
      action: function() {
        ns.Gameplay.restartRun(state);
      }
    });

    bindings.push({
      keys: map.start,
      mode: "up",
      action: function() {
        if (state.phase === "paused") {
          ns.Gameplay.togglePause(state);
          return;
        }
        ns.Gameplay.startRun(state);
      }
    });

    return bindings;
  }

  function bootstrap() {
    var canvas = Dom.get("canvas");
    var state = ns.State.createState(canvas);

    ns.Track.resetRoad(state);
    ns.Traffic.resetTraffic(state);
    ns.UI.create(state);

    window.addEventListener("blur", function() {
      if (state.phase === "running") {
        ns.Gameplay.togglePause(state);
      }
      ns.State.clearInputFlags(state);
    });

    Game.run({
      canvas: canvas,
      update: function(dt) { ns.Gameplay.update(state, dt); },
      render: function() {
        ns.Renderer.render(state);
        ns.UI.render(state);
      },
      step: state.step,
      stats: ns.State.createNoopStats(),
      images: ["background", "sprites"],
      keys: createKeyBindings(state),
      ready: function(images) {
        state.background = images[0];
        state.sprites = images[1];
      }
    });
  }

  bootstrap();
})(window.ApexRacer = window.ApexRacer || {});
