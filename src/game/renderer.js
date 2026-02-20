(function(ns) {
  function renderWorld(state) {
    if (!state.background || !state.sprites || !state.segments.length) {
      return;
    }

    var width = state.width;
    var height = state.height;
    var ctx = state.ctx;

    var baseSegment = ns.Track.findSegment(state, state.position);
    var basePercent = Util.percentRemaining(state.position, state.segmentLength);
    var playerSegment = ns.Track.findSegment(state, state.position + state.playerZ);
    var playerPercent = Util.percentRemaining(state.position + state.playerZ, state.segmentLength);
    var playerY = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
    var maxy = height;
    var x = 0;
    var dx = -(baseSegment.curve * basePercent);
    var n;
    var i;
    var segment;
    var car;
    var sprite;
    var spriteScale;
    var spriteX;
    var spriteY;

    ctx.clearRect(0, 0, width, height);

    Render.background(ctx, state.background, width, height, BACKGROUND.SKY, state.skyOffset, state.resolution * state.skySpeed * playerY);
    Render.background(ctx, state.background, width, height, BACKGROUND.HILLS, state.hillOffset, state.resolution * state.hillSpeed * playerY);
    Render.background(ctx, state.background, width, height, BACKGROUND.TREES, state.treeOffset, state.resolution * state.treeSpeed * playerY);

    for (n = 0; n < state.drawDistance; n++) {
      segment = state.segments[(baseSegment.index + n) % state.segments.length];
      segment.looped = segment.index < baseSegment.index;
      segment.fog = Util.exponentialFog(n / state.drawDistance, state.fogDensity);
      segment.clip = maxy;

      Util.project(
        segment.p1,
        (state.playerX * state.roadWidth) - x,
        playerY + state.cameraHeight,
        state.position - (segment.looped ? state.trackLength : 0),
        state.cameraDepth,
        width,
        height,
        state.roadWidth
      );

      Util.project(
        segment.p2,
        (state.playerX * state.roadWidth) - x - dx,
        playerY + state.cameraHeight,
        state.position - (segment.looped ? state.trackLength : 0),
        state.cameraDepth,
        width,
        height,
        state.roadWidth
      );

      x = x + dx;
      dx = dx + segment.curve;

      if (
        (segment.p1.camera.z <= state.cameraDepth) ||
        (segment.p2.screen.y >= segment.p1.screen.y) ||
        (segment.p2.screen.y >= maxy)
      ) {
        continue;
      }

      Render.segment(
        ctx,
        width,
        state.lanes,
        segment.p1.screen.x,
        segment.p1.screen.y,
        segment.p1.screen.w,
        segment.p2.screen.x,
        segment.p2.screen.y,
        segment.p2.screen.w,
        segment.fog,
        segment.color
      );

      maxy = segment.p1.screen.y;
    }

    for (n = (state.drawDistance - 1); n > 0; n--) {
      segment = state.segments[(baseSegment.index + n) % state.segments.length];

      for (i = 0; i < segment.cars.length; i++) {
        car = segment.cars[i];
        sprite = car.sprite;
        spriteScale = Util.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent);
        spriteX = Util.interpolate(segment.p1.screen.x, segment.p2.screen.x, car.percent) + (spriteScale * car.offset * state.roadWidth * width / 2);
        spriteY = Util.interpolate(segment.p1.screen.y, segment.p2.screen.y, car.percent);

        Render.sprite(
          ctx,
          width,
          height,
          state.resolution,
          state.roadWidth,
          state.sprites,
          sprite,
          spriteScale,
          spriteX,
          spriteY,
          -0.5,
          -1,
          segment.clip
        );
      }

      for (i = 0; i < segment.sprites.length; i++) {
        sprite = segment.sprites[i];
        spriteScale = segment.p1.screen.scale;
        spriteX = segment.p1.screen.x + (spriteScale * sprite.offset * state.roadWidth * width / 2);
        spriteY = segment.p1.screen.y;
        Render.sprite(
          ctx,
          width,
          height,
          state.resolution,
          state.roadWidth,
          state.sprites,
          sprite.source,
          spriteScale,
          spriteX,
          spriteY,
          (sprite.offset < 0 ? -1 : 0),
          -1,
          segment.clip
        );
      }

      if (segment === playerSegment) {
        Render.player(
          ctx,
          width,
          height,
          state.resolution,
          state.roadWidth,
          state.sprites,
          state.speed / state.maxSpeed,
          state.cameraDepth / state.playerZ,
          width / 2,
          (height / 2) - (state.cameraDepth / state.playerZ * Util.interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * height / 2),
          state.speed * (state.input.left ? -1 : state.input.right ? 1 : 0),
          playerSegment.p2.world.y - playerSegment.p1.world.y
        );
      }
    }
  }

  function renderEffects(state) {
    var ctx = state.ctx;
    var width = state.width;
    var height = state.height;

    if (state.nitroActive) {
      ctx.fillStyle = "rgba(34, 211, 238, 0.08)";
      ctx.fillRect(0, 0, width, height);
    }

    if (state.damageFlash > 0) {
      ctx.fillStyle = "rgba(239, 68, 68, " + (state.damageFlash * 0.35).toFixed(3) + ")";
      ctx.fillRect(0, 0, width, height);
    }

    if (state.nearMissFlash > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, " + (state.nearMissFlash * 0.2).toFixed(3) + ")";
      ctx.fillRect(0, 0, width, height);
    }

    if (state.health <= 25) {
      ctx.strokeStyle = "rgba(239, 68, 68, 0.45)";
      ctx.lineWidth = 16;
      ctx.strokeRect(0, 0, width, height);
    }
  }

  ns.Renderer = {
    render: function(state) {
      renderWorld(state);
      renderEffects(state);
    }
  };
})(window.ApexRacer = window.ApexRacer || {});
