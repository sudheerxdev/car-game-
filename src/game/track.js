(function(ns) {
  var ROAD = {
    LENGTH: { NONE: 0, SHORT: 25, MEDIUM: 50, LONG: 100 },
    HILL: { NONE: 0, LOW: 20, MEDIUM: 40, HIGH: 60 },
    CURVE: { NONE: 0, EASY: 2, MEDIUM: 4, HARD: 6 }
  };

  function wrappedIndex(state, n) {
    var len = state.segments.length;
    if (!len) {
      return 0;
    }
    return ((n % len) + len) % len;
  }

  function findSegment(state, z) {
    return state.segments[Math.floor(z / state.segmentLength) % state.segments.length];
  }

  function lastY(state) {
    return (state.segments.length === 0) ? 0 : state.segments[state.segments.length - 1].p2.world.y;
  }

  function addSegment(state, curve, y) {
    var n = state.segments.length;
    state.segments.push({
      index: n,
      p1: { world: { y: lastY(state), z: n * state.segmentLength }, camera: {}, screen: {} },
      p2: { world: { y: y, z: (n + 1) * state.segmentLength }, camera: {}, screen: {} },
      curve: curve,
      sprites: [],
      cars: [],
      color: Math.floor(n / state.rumbleLength) % 2 ? COLORS.DARK : COLORS.LIGHT
    });
  }

  function addSprite(state, n, sprite, offset) {
    if (!state.segments.length) {
      return;
    }
    state.segments[wrappedIndex(state, n)].sprites.push({ source: sprite, offset: offset });
  }

  function addRoad(state, enter, hold, leave, curve, y) {
    var startY = lastY(state);
    var endY = startY + (Util.toInt(y, 0) * state.segmentLength);
    var total = enter + hold + leave;
    var n;

    for (n = 0; n < enter; n++) {
      addSegment(
        state,
        Util.easeIn(0, curve, n / enter),
        Util.easeInOut(startY, endY, n / total)
      );
    }
    for (n = 0; n < hold; n++) {
      addSegment(
        state,
        curve,
        Util.easeInOut(startY, endY, (enter + n) / total)
      );
    }
    for (n = 0; n < leave; n++) {
      addSegment(
        state,
        Util.easeInOut(curve, 0, n / leave),
        Util.easeInOut(startY, endY, (enter + hold + n) / total)
      );
    }
  }

  function addStraight(state, num) {
    num = num || ROAD.LENGTH.MEDIUM;
    addRoad(state, num, num, num, 0, 0);
  }

  function addHill(state, num, height) {
    num = num || ROAD.LENGTH.MEDIUM;
    height = height || ROAD.HILL.MEDIUM;
    addRoad(state, num, num, num, 0, height);
  }

  function addCurve(state, num, curve, height) {
    num = num || ROAD.LENGTH.MEDIUM;
    curve = curve || ROAD.CURVE.MEDIUM;
    height = height || ROAD.HILL.NONE;
    addRoad(state, num, num, num, curve, height);
  }

  function addLowRollingHills(state, num, height) {
    num = num || ROAD.LENGTH.SHORT;
    height = height || ROAD.HILL.LOW;
    addRoad(state, num, num, num, 0, height / 2);
    addRoad(state, num, num, num, 0, -height);
    addRoad(state, num, num, num, ROAD.CURVE.EASY, height);
    addRoad(state, num, num, num, 0, 0);
    addRoad(state, num, num, num, -ROAD.CURVE.EASY, height / 2);
    addRoad(state, num, num, num, 0, 0);
  }

  function addSCurves(state) {
    addRoad(state, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.EASY, ROAD.HILL.NONE);
    addRoad(state, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
    addRoad(state, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.CURVE.EASY, -ROAD.HILL.LOW);
    addRoad(state, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.EASY, ROAD.HILL.MEDIUM);
    addRoad(state, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.MEDIUM, -ROAD.HILL.MEDIUM);
  }

  function addBumps(state) {
    addRoad(state, 10, 10, 10, 0, 5);
    addRoad(state, 10, 10, 10, 0, -2);
    addRoad(state, 10, 10, 10, 0, -5);
    addRoad(state, 10, 10, 10, 0, 8);
    addRoad(state, 10, 10, 10, 0, 5);
    addRoad(state, 10, 10, 10, 0, -7);
    addRoad(state, 10, 10, 10, 0, 5);
    addRoad(state, 10, 10, 10, 0, -2);
  }

  function addDownhillToEnd(state, num) {
    num = num || 200;
    addRoad(state, num, num, num, -ROAD.CURVE.EASY, -lastY(state) / state.segmentLength);
  }

  function decorateRoad(state) {
    var n;
    var i;
    var side;
    var sprite;
    var offset;

    addSprite(state, 20, SPRITES.BILLBOARD07, -1);
    addSprite(state, 40, SPRITES.BILLBOARD06, -1);
    addSprite(state, 60, SPRITES.BILLBOARD08, -1);
    addSprite(state, 80, SPRITES.BILLBOARD09, -1);
    addSprite(state, 100, SPRITES.BILLBOARD01, -1);
    addSprite(state, 120, SPRITES.BILLBOARD02, -1);
    addSprite(state, 140, SPRITES.BILLBOARD03, -1);
    addSprite(state, 160, SPRITES.BILLBOARD04, -1);
    addSprite(state, 180, SPRITES.BILLBOARD05, -1);

    addSprite(state, 240, SPRITES.BILLBOARD07, -1.2);
    addSprite(state, 240, SPRITES.BILLBOARD06, 1.2);
    addSprite(state, state.segments.length - 25, SPRITES.BILLBOARD07, -1.2);
    addSprite(state, state.segments.length - 25, SPRITES.BILLBOARD06, 1.2);

    for (n = 10; n < 220; n += 4 + Math.floor(n / 100)) {
      addSprite(state, n, SPRITES.PALM_TREE, 0.5 + Math.random() * 0.5);
      addSprite(state, n, SPRITES.PALM_TREE, 1 + Math.random() * 2);
    }

    for (n = 250; n < 1000; n += 5) {
      addSprite(state, n, SPRITES.COLUMN, 1.1);
      addSprite(state, n + Util.randomInt(0, 5), SPRITES.TREE1, -1 - (Math.random() * 2));
      addSprite(state, n + Util.randomInt(0, 5), SPRITES.TREE2, -1 - (Math.random() * 2));
    }

    for (n = 200; n < state.segments.length; n += 3) {
      addSprite(state, n, Util.randomChoice(SPRITES.PLANTS), Util.randomChoice([1, -1]) * (2 + Math.random() * 5));
    }

    for (n = 1000; n < (state.segments.length - 50); n += 100) {
      side = Util.randomChoice([1, -1]);
      addSprite(state, n + Util.randomInt(0, 50), Util.randomChoice(SPRITES.BILLBOARDS), -side);
      for (i = 0; i < 20; i++) {
        sprite = Util.randomChoice(SPRITES.PLANTS);
        offset = side * (1.5 + Math.random());
        addSprite(state, n + Util.randomInt(0, 50), sprite, offset);
      }
    }
  }

  function resetRoad(state) {
    var n;
    var startLineIndex;

    state.segments = [];

    addStraight(state, ROAD.LENGTH.SHORT);
    addLowRollingHills(state);
    addSCurves(state);
    addCurve(state, ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.LOW);
    addBumps(state);
    addLowRollingHills(state);
    addCurve(state, ROAD.LENGTH.LONG * 2, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
    addStraight(state);
    addHill(state, ROAD.LENGTH.MEDIUM, ROAD.HILL.HIGH);
    addSCurves(state);
    addCurve(state, ROAD.LENGTH.LONG, -ROAD.CURVE.MEDIUM, ROAD.HILL.NONE);
    addHill(state, ROAD.LENGTH.LONG, ROAD.HILL.HIGH);
    addCurve(state, ROAD.LENGTH.LONG, ROAD.CURVE.MEDIUM, -ROAD.HILL.LOW);
    addBumps(state);
    addHill(state, ROAD.LENGTH.LONG, -ROAD.HILL.MEDIUM);
    addStraight(state);
    addSCurves(state);
    addDownhillToEnd(state);

    decorateRoad(state);
    state.trackLength = state.segments.length * state.segmentLength;

    startLineIndex = findSegment(state, state.playerZ).index + 2;
    state.segments[wrappedIndex(state, startLineIndex)].color = COLORS.START;
    state.segments[wrappedIndex(state, startLineIndex + 1)].color = COLORS.START;

    for (n = 0; n < state.rumbleLength; n++) {
      state.segments[state.segments.length - 1 - n].color = COLORS.FINISH;
    }
  }

  ns.Track = {
    ROAD: ROAD,
    findSegment: findSegment,
    resetRoad: resetRoad
  };
})(window.ApexRacer = window.ApexRacer || {});
