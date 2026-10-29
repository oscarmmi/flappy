Build a Flappy-style flyer in THIS folder: C:\xampp\htdocs\flappy

A recruiter-ready browser flyer. Playable, polished, no backend.

## Game
- Canvas 2D. A bird falls with gravity; tap/click/space flaps upward.
- Pipes with a gap scroll left. Score +1 when passing a pipe pair.
- Collision with pipe or ground is game over. R or tap restarts.
- Keyboard: Space / click flap. Touch: tap anywhere.
- Local best in localStorage. Call it "Sky Skip". Original bird, no licensed names.

## UI
- Dawn sky gradient, bold pipes, round bird, large score. Not a default Vite page. No Vue logo.
- 390px phone and 1280px desktop.

## Tests
- Vitest (pure logic): a flap sets upward velocity; passing a pipe increments score; overlapping a pipe is game over.
- `npm test` and `npm run build` must pass.

## GitHub
- Repo: https://github.com/oscarmmi/flappy
- Pages: https://oscarmmi.github.io/flappy/
- vite base `/flappy/`
- Commit: feat: add flappy
- gh repo edit --description "Flappy-style flyer in Vue 3 + TypeScript canvas, playable on GitHub Pages." --add-topic vue --add-topic typescript --add-topic game --add-topic flappy --add-topic canvas
- Stop. Print the repo URL and Pages URL.
