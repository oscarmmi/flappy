<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  createGameState,
  flap,
  gameOver,
  stepGame,
  type GameState,
} from './game'

const WIDTH = 420
const HEIGHT = 640
const canvas = ref<HTMLCanvasElement | null>(null)
const score = ref(0)
const best = ref(Number(localStorage.getItem('sky-skip-best') ?? 0))
const status = ref<'ready' | 'playing' | 'over'>('ready')
const isNewBest = computed(() => status.value === 'over' && score.value > 0 && score.value >= best.value)

let state: GameState = createGameState()
let animationFrame = 0
let previousTime = 0
let frame = 0

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT)
  sky.addColorStop(0, '#ffc98c')
  sky.addColorStop(0.53, '#f9a779')
  sky.addColorStop(1, '#f27671')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Soft, hazy sun and distant cloud bands establish the game's warm dawn palette.
  const glow = ctx.createRadialGradient(317, 145, 18, 317, 145, 112)
  glow.addColorStop(0, 'rgba(255, 245, 190, .88)')
  glow.addColorStop(1, 'rgba(255, 245, 190, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(195, 25, 225, 230)
  ctx.fillStyle = '#ffe6ad'
  ctx.beginPath()
  ctx.arc(317, 145, 37, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255, 220, 180, .36)'
  for (const [x, y, w] of [[32, 184, 78], [178, 92, 51], [344, 256, 86]] as const) {
    roundedRect(ctx, x, y + 8, w, 13, 7)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + 17, y + 9, 14, Math.PI, Math.PI * 2)
    ctx.arc(x + 34, y + 5, 20, Math.PI, Math.PI * 2)
    ctx.arc(x + 52, y + 10, 13, Math.PI, Math.PI * 2)
    ctx.fill()
  }

  // Layered, distant hills.
  ctx.fillStyle = '#d97770'
  ctx.beginPath()
  ctx.moveTo(0, 461)
  ctx.quadraticCurveTo(76, 389, 145, 456)
  ctx.quadraticCurveTo(235, 363, 313, 451)
  ctx.quadraticCurveTo(366, 397, WIDTH, 438)
  ctx.lineTo(WIDTH, HEIGHT)
  ctx.lineTo(0, HEIGHT)
  ctx.fill()
  ctx.fillStyle = '#c86b68'
  ctx.beginPath()
  ctx.moveTo(0, 496)
  ctx.quadraticCurveTo(91, 424, 182, 496)
  ctx.quadraticCurveTo(300, 416, WIDTH, 482)
  ctx.lineTo(WIDTH, HEIGHT)
  ctx.lineTo(0, HEIGHT)
  ctx.fill()
}

function drawPipe(ctx: CanvasRenderingContext2D, x: number, gapY: number) {
  const gap = 174
  const pipeWidth = 68
  const capHeight = 22
  const topHeight = gapY - gap / 2
  const bottomY = gapY + gap / 2
  const floorY = 588

  const pipeGradient = ctx.createLinearGradient(x, 0, x + pipeWidth, 0)
  pipeGradient.addColorStop(0, '#278b77')
  pipeGradient.addColorStop(0.22, '#54b88a')
  pipeGradient.addColorStop(0.72, '#42a981')
  pipeGradient.addColorStop(1, '#237e72')
  ctx.fillStyle = pipeGradient
  ctx.strokeStyle = '#1d7066'
  ctx.lineWidth = 3

  ctx.fillRect(x + 5, 0, pipeWidth - 10, topHeight - capHeight + 3)
  ctx.strokeRect(x + 5, -3, pipeWidth - 10, topHeight - capHeight + 6)
  roundedRect(ctx, x, topHeight - capHeight, pipeWidth, capHeight, 5)
  ctx.fill()
  ctx.stroke()
  ctx.fillRect(x + 5, bottomY + capHeight - 3, pipeWidth - 10, floorY - bottomY - capHeight + 3)
  ctx.strokeRect(x + 5, bottomY + capHeight - 3, pipeWidth - 10, floorY - bottomY - capHeight + 6)
  roundedRect(ctx, x, bottomY, pipeWidth, capHeight, 5)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = 'rgba(222, 255, 212, .2)'
  ctx.fillRect(x + 12, 0, 6, Math.max(0, topHeight - capHeight))
  ctx.fillRect(x + 12, bottomY + capHeight, 6, Math.max(0, floorY - bottomY - capHeight))
}

function drawBird(ctx: CanvasRenderingContext2D) {
  const { x, y, velocity } = state.bird
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.max(-0.35, Math.min(0.65, velocity / 850)))

  // Tail flick.
  ctx.fillStyle = '#e77c4d'
  ctx.beginPath()
  ctx.moveTo(-18, 3)
  ctx.lineTo(-31, -5)
  ctx.lineTo(-28, 9)
  ctx.closePath()
  ctx.fill()

  // Round, original little sunbird.
  ctx.fillStyle = '#f7c84f'
  ctx.strokeStyle = '#db9244'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(0, 0, 21, 18, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#efa944'
  ctx.beginPath()
  ctx.ellipse(-7, 6 + Math.sin(frame / 90) * 2, 9, 6, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff5d8'
  ctx.beginPath()
  ctx.arc(8, -6, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#293a4b'
  ctx.beginPath()
  ctx.arc(10, -6, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e97851'
  ctx.beginPath()
  ctx.moveTo(17, 1)
  ctx.lineTo(31, 5)
  ctx.lineTo(17, 10)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawGround(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#e6c67e'
  ctx.fillRect(0, 588, WIDTH, 52)
  ctx.fillStyle = '#f7df9e'
  ctx.fillRect(0, 588, WIDTH, 9)
  ctx.fillStyle = '#bd9c61'
  for (let x = -(state.groundOffset % 28); x < WIDTH; x += 28) {
    ctx.beginPath()
    ctx.moveTo(x, 597)
    ctx.lineTo(x + 13, 597)
    ctx.lineTo(x + 5, 604)
    ctx.closePath()
    ctx.fill()
  }
  ctx.fillStyle = '#d7b56f'
  ctx.fillRect(0, 634, WIDTH, 6)
}

function render() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return
  drawBackground(ctx)
  for (const pipe of state.pipes) drawPipe(ctx, pipe.x, pipe.gapY)
  drawGround(ctx)
  drawBird(ctx)
}

function finishIfNeeded() {
  if (gameOver(state)) {
    status.value = 'over'
    if (score.value > best.value) {
      best.value = score.value
      localStorage.setItem('sky-skip-best', String(best.value))
    }
  }
}

function resetGame(start = true) {
  state = createGameState()
  score.value = 0
  status.value = start ? 'playing' : 'ready'
  previousTime = 0
  if (start) flap(state)
  render()
}

function handleFlap() {
  if (status.value === 'over') {
    resetGame(true)
    return
  }
  if (status.value === 'ready') status.value = 'playing'
  flap(state)
  render()
}

function onKeydown(event: KeyboardEvent) {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault()
    handleFlap()
  } else if (event.key.toLowerCase() === 'r') {
    resetGame(true)
  }
}

function onPointerDown(event: PointerEvent) {
  event.preventDefault()
  handleFlap()
}

function animate(time: number) {
  const delta = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.032)
  previousTime = time
  frame += 1
  if (status.value === 'playing') {
    const before = state.score
    stepGame(state, delta)
    score.value = state.score
    state.groundOffset = (state.groundOffset + 92 * delta) % 28
    if (score.value > before) finishIfNeeded()
    finishIfNeeded()
  } else if (status.value === 'ready') {
    state.bird.y = 300 + Math.sin(time / 420) * 7
  }
  render()
  animationFrame = requestAnimationFrame(animate)
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  render()
  animationFrame = requestAnimationFrame(animate)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  cancelAnimationFrame(animationFrame)
})
</script>

<template>
  <main class="page-shell">
    <header class="topbar">
      <a class="brand" href="#top" aria-label="Sky Skip home">
        <span class="brand-mark" aria-hidden="true"><span></span></span>
        <span>SKY<span class="brand-light">SKIP</span></span>
      </a>
      <div class="topbar-note"><span class="live-dot"></span> A little flight of fancy</div>
      <a class="about-link" href="https://github.com/oscarmmi/flappy" target="_blank" rel="noreferrer">
        <span>MADE TO PLAY</span><span aria-hidden="true">↗</span>
      </a>
    </header>

    <section id="top" class="game-layout" aria-label="Sky Skip game">
      <div class="intro-column">
        <p class="eyebrow"><span>01</span> / THE MORNING FLIGHT</p>
        <h1>Catch the<br /><em>updraft.</em></h1>
        <p class="intro-copy">One little bird. A sky full of almosts. How far can you fly before the ground says hello?</p>

        <div class="score-card">
          <div class="score-card-top"><span>YOUR FLIGHT</span><span class="score-spark">✳</span></div>
          <strong>{{ String(score).padStart(2, '0') }}</strong>
          <div class="score-card-bottom"><span>BEST DISTANCE</span><b>{{ String(best).padStart(2, '0') }}</b></div>
        </div>

        <div class="controls-card">
          <span class="controls-label">FLIGHT SCHOOL</span>
          <div class="control-row"><span class="keycap">SPACE</span><span>or tap to flap</span></div>
          <div class="control-row"><span class="keycap keycap-round">↻</span><span>R to start fresh</span></div>
        </div>

        <p class="footer-note"><span>✦</span> Built for the joy of one more try.</p>
      </div>

      <div class="play-column">
        <div class="play-heading"><div><span class="eyebrow">TODAY'S SKY</span><h2>Golden hour</h2></div><div class="weather"><span>☀</span> 22° <i>·</i> clear</div></div>
        <div class="game-frame" :class="`game-frame--${status}`">
          <canvas
            ref="canvas"
            class="game-canvas"
            width="420"
            height="640"
            aria-label="Sky Skip flying game. Tap, click, or press space to flap."
            @pointerdown="onPointerDown"
          ></canvas>
          <div v-if="status !== 'playing'" class="game-overlay">
            <div class="overlay-content">
              <template v-if="status === 'ready'">
                <span class="overlay-kicker">YOUR WINGS ARE READY</span>
                <h3>Ready,<br /><em>sunbird?</em></h3>
                <button class="start-button" type="button" @pointerdown.stop @click="handleFlap">Let's fly <span>→</span></button>
                <span class="overlay-hint">TAP · CLICK · SPACE</span>
              </template>
              <template v-else>
                <span class="overlay-kicker">A LOVELY LITTLE FLIGHT</span>
                <h3>{{ isNewBest ? 'New best!' : 'Touchdown.' }}</h3>
                <p class="result-score">{{ score }} <span>{{ score === 1 ? 'pipe' : 'pipes' }} cleared</span></p>
                <button class="start-button" type="button" @pointerdown.stop @click="resetGame(true)">Fly again <span>↻</span></button>
                <span class="overlay-hint">OR PRESS R</span>
              </template>
            </div>
          </div>
          <div class="canvas-score" aria-hidden="true">{{ score }}</div>
          <div class="frame-stamp"><span>SS</span><span>NO. 001</span></div>
        </div>
        <div class="play-footer"><span><i></i> WIND AT YOUR BACK</span><span>FLIGHT {{ String(score + (status === 'playing' ? 1 : 0)).padStart(2, '0') }}</span></div>
      </div>
    </section>
  </main>
</template>
