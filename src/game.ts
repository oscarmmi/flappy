export interface Bird {
  x: number
  y: number
  velocity: number
  radius: number
}

export interface Pipe {
  x: number
  gapY: number
  passed: boolean
}

export interface GameState {
  bird: Bird
  pipes: Pipe[]
  score: number
  elapsed: number
  groundOffset: number
  over: boolean
}

export const GAME_WIDTH = 420
export const GROUND_Y = 588
export const PIPE_WIDTH = 68
export const PIPE_GAP = 174
export const BIRD_X = 120
export const GRAVITY = 1450
export const FLAP_VELOCITY = -450
export const PIPE_SPEED = 145

export function createGameState(): GameState {
  return {
    bird: { x: BIRD_X, y: 300, velocity: 0, radius: 15 },
    pipes: [{ x: GAME_WIDTH + 35, gapY: 322, passed: false }],
    score: 0,
    elapsed: 0,
    groundOffset: 0,
    over: false,
  }
}

export function flap(state: GameState): void {
  if (!state.over) state.bird.velocity = FLAP_VELOCITY
}

export function overlapsPipe(bird: Bird, pipe: Pipe): boolean {
  const halfGap = PIPE_GAP / 2
  const overlapsHorizontally = bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + PIPE_WIDTH
  if (!overlapsHorizontally) return false
  return bird.y - bird.radius < pipe.gapY - halfGap || bird.y + bird.radius > pipe.gapY + halfGap
}

export function gameOver(state: GameState): boolean {
  return state.over
}

export function stepGame(state: GameState, deltaSeconds: number): GameState {
  if (state.over || deltaSeconds <= 0) return state
  const delta = Math.min(deltaSeconds, 0.05)
  state.elapsed += delta
  state.bird.velocity += GRAVITY * delta
  state.bird.y += state.bird.velocity * delta

  for (const pipe of state.pipes) {
    pipe.x -= PIPE_SPEED * delta
    if (!pipe.passed && pipe.x + PIPE_WIDTH < state.bird.x) {
      pipe.passed = true
      state.score += 1
    }
    if (overlapsPipe(state.bird, pipe)) state.over = true
  }
  state.pipes = state.pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -8)

  const lastPipe = state.pipes[state.pipes.length - 1]
  if (!lastPipe || lastPipe.x < GAME_WIDTH - 230) {
    const previousGap = lastPipe?.gapY ?? 322
    const variation = Math.random() * 130 - 65
    state.pipes.push({
      x: GAME_WIDTH + 18,
      gapY: Math.min(410, Math.max(205, previousGap + variation)),
      passed: false,
    })
  }

  if (state.bird.y - state.bird.radius < 0 || state.bird.y + state.bird.radius >= GROUND_Y) {
    state.over = true
  }
  return state
}
