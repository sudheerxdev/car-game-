(function(ns) {
  function trafficTarget(state) {
    var cfg = state.config;
    var target = cfg.trafficBase + ((state.difficultyLevel - 1) * cfg.trafficStep);
    return Util.limit(Math.round(target), cfg.trafficBase, cfg.trafficMax);
  }

  function randomTrafficSpeed(state, sprite) {
    var base = state.maxSpeed / 4;
    var variance = state.maxSpeed / ((sprite === SPRITES.SEMI) ? 4 : 2.2);
    var difficultyBoost = 1 + ((state.difficultyLevel - 1) * 0.03);
    return (base + (Math.random() * variance)) * difficultyBoost;
  }

  function spawnCar(state) {
    var offset = Math.random() * Util.randomChoice([-0.85, 0.85]);
    var z = Math.floor(Math.random() * state.segments.length) * state.segmentLength;
    var sprite = Util.randomChoice(SPRITES.CARS);
    var car = {
      offset: offset,
      z: z,
      sprite: sprite,
      speed: randomTrafficSpeed(state, sprite),
      percent: 0,
      lastRelativeZ: null
    };

    var segment = ns.Track.findSegment(state, car.z);
    segment.cars.push(car);
    state.cars.push(car);
  }

  function removeCar(state, index) {
    if (index < 0 || index >= state.cars.length) {
      return;
    }

    var car = state.cars[index];
    var segment = ns.Track.findSegment(state, car.z);
    var segmentIndex = segment.cars.indexOf(car);
    if (segmentIndex >= 0) {
      segment.cars.splice(segmentIndex, 1);
    }
    state.cars.splice(index, 1);
  }

  function resetTraffic(state) {
    var n;
    for (n = 0; n < state.segments.length; n++) {
      state.segments[n].cars = [];
    }

    state.cars = [];

    var target = trafficTarget(state);
    for (n = 0; n < target; n++) {
      spawnCar(state);
    }
  }

  function ensureTrafficDensity(state) {
    var n;
    var target = trafficTarget(state);
    var missing = target - state.cars.length;

    if (missing > 0) {
      for (n = 0; n < missing; n++) {
        spawnCar(state);
      }
      return;
    }

    if (missing < 0) {
      for (n = 0; n < Math.abs(missing); n++) {
        removeCar(state, Util.randomInt(0, state.cars.length - 1));
      }
    }
  }

  function updateCarOffset(state, car, carSegment, playerSegment, playerW) {
    var lookahead = 20;
    var carW = car.sprite.w * SPRITES.SCALE;
    var i;
    var j;
    var dir;
    var segment;
    var otherCar;
    var otherCarW;

    if ((carSegment.index - playerSegment.index) > state.drawDistance) {
      return 0;
    }

    for (i = 1; i < lookahead; i++) {
      segment = state.segments[(carSegment.index + i) % state.segments.length];

      if (
        (segment === playerSegment) &&
        (car.speed > state.speed) &&
        Util.overlap(state.playerX, playerW, car.offset, carW, 1.2)
      ) {
        if (state.playerX > 0.5) {
          dir = -1;
        } else if (state.playerX < -0.5) {
          dir = 1;
        } else {
          dir = (car.offset > state.playerX) ? 1 : -1;
        }
        return dir * (1 / i) * (car.speed - state.speed) / state.maxSpeed;
      }

      for (j = 0; j < segment.cars.length; j++) {
        otherCar = segment.cars[j];
        otherCarW = otherCar.sprite.w * SPRITES.SCALE;
        if ((car.speed > otherCar.speed) && Util.overlap(car.offset, carW, otherCar.offset, otherCarW, 1.2)) {
          if (otherCar.offset > 0.5) {
            dir = -1;
          } else if (otherCar.offset < -0.5) {
            dir = 1;
          } else {
            dir = (car.offset > otherCar.offset) ? 1 : -1;
          }
          return dir * (1 / i) * (car.speed - otherCar.speed) / state.maxSpeed;
        }
      }
    }

    if (car.offset < -0.9) {
      return 0.1;
    }
    if (car.offset > 0.9) {
      return -0.1;
    }
    return 0;
  }

  function updateCars(state, dt, playerSegment, playerW) {
    var n;
    var car;
    var oldSegment;
    var newSegment;
    var index;

    for (n = 0; n < state.cars.length; n++) {
      car = state.cars[n];
      oldSegment = ns.Track.findSegment(state, car.z);
      car.offset = car.offset + updateCarOffset(state, car, oldSegment, playerSegment, playerW);
      car.z = Util.increase(car.z, dt * car.speed, state.trackLength);
      car.percent = Util.percentRemaining(car.z, state.segmentLength);
      newSegment = ns.Track.findSegment(state, car.z);

      if (oldSegment !== newSegment) {
        index = oldSegment.cars.indexOf(car);
        if (index >= 0) {
          oldSegment.cars.splice(index, 1);
        }
        newSegment.cars.push(car);
      }
    }
  }

  ns.Traffic = {
    trafficTarget: trafficTarget,
    resetTraffic: resetTraffic,
    ensureTrafficDensity: ensureTrafficDensity,
    updateCars: updateCars
  };
})(window.ApexRacer = window.ApexRacer || {});
