import { describe, expect, it } from 'vitest'
import { createGameState, flap, stepGame } from './game'

describe('Sky Skip game logic', () => {
  it('sets upward velocity when the bird flaps', () => {
    const state = createGameState()
    flap(state)
    expect(state.bird.velocity).toBeLessThan(0)
  })

  it('increments score when a pipe pair passes the bird', () => {
    const state = createGameState()
    state.bird.y = 300
    state.pipes[0]!.x = 50
    stepGame(state, 0.05)
    expect(state.score).toBe(1)
    expect(state.pipes[0]!.passed).toBe(true)
  })

  it('ends the game when the bird overlaps a pipe', () => {
    const state = createGameState()
    state.bird.y = 190
    state.bird.velocity = 0
    state.pipes[0]!.x = 110
    state.pipes[0]!.gapY = 320
    stepGame(state, 0.01)
    expect(state.over).toBe(true)
  })
})
