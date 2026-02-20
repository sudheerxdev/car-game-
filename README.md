# Apex Rush - Car Racing Game

Portfolio-focused 2D arcade racing game built with plain HTML, CSS, and JavaScript.

The repository now includes:
- `game.html`: enhanced and structured version for production/portfolio usage
- `v1` to `v4`: original progressive versions kept for reference

Author: `sudheerxdev`

## Live Demo

If this repository is deployed with GitHub Pages, open:

`https://sudheerxdev.github.io/car-game-/game.html`

## What Was Upgraded

- Refactored monolithic script into modular runtime files under `src/game/`
- Added a proper game state flow: `menu -> countdown -> running -> paused -> gameover`
- Added nitro system with drain/recovery behavior
- Added car integrity (health) and damage handling
- Added combo and near-miss scoring mechanics
- Added dynamic difficulty progression over time
- Added persistent local records (best score, distance, time, lap)
- Added modern responsive layout and touch controls
- Kept legacy versions available for comparison

## Controls

- Move: `Left/Right Arrow` or `A/D`
- Accelerate: `Up Arrow` or `W`
- Brake: `Down Arrow` or `S`
- Nitro: `Space`
- Pause/Resume: `P`
- Restart run: `R`
- Start run: `Enter` or on-screen button

## Project Structure

```text
car-game-/
|- game.html
|- index.html
|- common.js
|- common.css
|- styles/
|  |- game.css
|- src/
|  |- game/
|     |- config.js
|     |- state.js
|     |- track.js
|     |- traffic.js
|     |- renderer.js
|     |- gameplay.js
|     |- ui.js
|     |- app.js
|- images/
|- music/
|- v1.straight.html
|- v2.curves.html
|- v3.hills.html
|- v4.final.html
```

## Local Run

1. Clone repository:
   `git clone https://github.com/sudheerxdev/car-game-.git`
2. Open `index.html` or directly open `game.html` in your browser.

No build tools or frameworks are required.

## License

MIT License. See `LICENSE`.
