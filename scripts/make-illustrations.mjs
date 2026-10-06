// Generates the app's flat "Corporate Memphis" style illustrations as clean, self-contained SVG files.
// Run: node scripts/make-illustrations.mjs   (writes to src/assets/illustrations)
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = new URL('../src/assets/illustrations/', import.meta.url)
mkdirSync(OUT, { recursive: true })

const C = {
  terra: '#D9663B', terraDark: '#B8512C', terraPale: '#F7D5C4', terraSoft: '#EDA27F',
  teal: '#4FA79F', tealSoft: '#9ED3CC', tealPale: '#D6EFEB',
  ink: '#2B2A2E', cream: '#FFF8EE', white: '#FFFDF8', skin: '#F3C4A8', skin2: '#E9AD8D',
}
const f = (v) => Math.round(v * 10) / 10
const P = (p) => `${f(p[0])},${f(p[1])}`
let counter = 0
const GAPS = [0.12, 0.37, 0.58, 0.81, 0.25, 0.66, 0.47, 0.9]

// A charcoal outline that deliberately does not close: one small gap per shape.
function outline(d, w = 2.5) {
  counter += 1
  const a = GAPS[counter % GAPS.length] * 100
  const g = 3.4
  return `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" pathLength="100" stroke-dasharray="${f(a)} ${g} ${f(100 - a - g)}"/>`
}
const shape = (d, fill, w) => `<path d="${d}" fill="${fill}"/>${outline(d, w)}`
const circlePath = (x, y, r) => `M${f(x - r)},${f(y)} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`
const rrect = (x, y, w, h, r) => `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`

// A limb: a long curvy tube along a bent centre line.
function tube(a, b, bend, w) {
  const dx = b[0] - a[0]; const dy = b[1] - a[1]; const len = Math.hypot(dx, dy) || 1
  const n = [-dy / len, dx / len]
  const p1 = [a[0] + dx * 0.33 + n[0] * bend, a[1] + dy * 0.33 + n[1] * bend]
  const p2 = [a[0] + dx * 0.66 - n[0] * bend * 0.6, a[1] + dy * 0.66 - n[1] * bend * 0.6]
  const norm = (u, v) => { const x = v[0] - u[0]; const y = v[1] - u[1]; const l = Math.hypot(x, y) || 1; return [-y / l, x / l] }
  const n0 = norm(a, p1); const n1 = norm(a, p2); const n2 = norm(p1, b); const n3 = norm(p2, b)
  const off = (p, nn, s) => [p[0] + nn[0] * w * s, p[1] + nn[1] * w * s]
  const L = [off(a, n0, 1), off(p1, n1, 1), off(p2, n2, 1), off(b, n3, 1)]
  const R = [off(a, n0, -1), off(p1, n1, -1), off(p2, n2, -1), off(b, n3, -1)]
  return `M${P(L[0])} C${P(L[1])} ${P(L[2])} ${P(L[3])} A${w},${w} 0 0 0 ${P(R[3])} C${P(R[2])} ${P(R[1])} ${P(R[0])} A${w},${w} 0 0 0 ${P(L[0])} Z`
}

// A stylised person: tiny head, long neck, long curvy torso and limbs, no face.
function person({ H, S, dir = 1, legs, arms, top, pants, skin = C.skin, hair = C.ink, shoes = C.ink, bun = false, id }) {
  const vx = S[0] - H[0]; const vy = S[1] - H[1]; const vl = Math.hypot(vx, vy)
  const u = [vx / vl, vy / vl]
  const neckTop = [S[0] + u[0] * 40, S[1] + u[1] * 40]
  const hc = [neckTop[0] + u[0] * 14 + dir * 3, neckTop[1] + u[1] * 14]
  const leg = ([fx, fy, bend], i) => {
    const hip = [H[0] + (i ? 5 : -5), H[1] + 2]
    return shape(tube(hip, [fx, fy], bend, 11), pants) + shape(`M${f(fx - dir * 6)},${f(fy - 4)} q${dir * 16},-6 ${dir * 26},4 q-2,8 -${dir * 24},8 q-${dir * 4},-4 -${dir * 2},-12 Z`, shoes)
  }
  const arm = ([hx, hy, bend], i) => {
    const sh = [S[0] + (i ? 6 : -6), S[1] + 6]
    return shape(tube(sh, [hx, hy], bend, 7), skin) + shape(circlePath(hx, hy, 8), skin)
  }
  const perp = [-u[1], u[0]]
  const sw = 20; const hw = 17
  const torso = `M${P([H[0] - perp[0] * hw, H[1] - perp[1] * hw])} C${P([H[0] - perp[0] * (hw + 14) + u[0] * 40, H[1] - perp[1] * (hw + 14) + u[1] * 40])} ${P([S[0] - perp[0] * (sw + 8) - u[0] * 40, S[1] - perp[1] * (sw + 8) - u[1] * 40])} ${P([S[0] - perp[0] * sw, S[1] - perp[1] * sw])} Q${P([S[0] + u[0] * 14, S[1] + u[1] * 14])} ${P([S[0] + perp[0] * sw, S[1] + perp[1] * sw])} C${P([S[0] + perp[0] * (sw + 8) - u[0] * 40, S[1] + perp[1] * (sw + 8) - u[1] * 40])} ${P([H[0] + perp[0] * (hw + 14) + u[0] * 40, H[1] + perp[1] * (hw + 14) + u[1] * 40])} ${P([H[0] + perp[0] * hw, H[1] + perp[1] * hw])} Z`
  const neck = shape(tube([S[0] + u[0] * 4, S[1] + u[1] * 4], neckTop, 2, 5), skin)
  const hx = hc[0]; const hy = hc[1]
  const head = shape(`M${f(hx - 13)},${f(hy)} C${f(hx - 13)},${f(hy - 18)} ${f(hx + 13)},${f(hy - 18)} ${f(hx + 13)},${f(hy)} C${f(hx + 13)},${f(hy + 15)} ${f(hx - 13)},${f(hy + 15)} ${f(hx - 13)},${f(hy)} Z`, skin)
  const nose = shape(`M${f(hx + dir * 12)},${f(hy - 3)} l${dir * 10},9 l${-dir * 10},3 Z`, skin)
  const hairD = `M${f(hx - dir * 13)},${f(hy + 4)} C${f(hx - dir * 17)},${f(hy - 24)} ${f(hx + dir * 11)},${f(hy - 28)} ${f(hx + dir * 13)},${f(hy - 6)} C${f(hx + dir * 3)},${f(hy - 12)} ${f(hx - dir * 5)},${f(hy - 5)} ${f(hx - dir * 8)},${f(hy + 10)} Z`
  const hairEl = `<path d="${hairD}" fill="${hair}"/>${bun ? `<circle cx="${f(hx - dir * 14)}" cy="${f(hy - 14)}" r="8" fill="${hair}"/>` : ''}`
  return `<g id="${id}">
<g id="${id}-back-arm">${arm(arms[0], 0)}</g>
<g id="${id}-back-leg">${leg(legs[0], 0)}</g>
<g id="${id}-body">${shape(torso, top)}</g>
<g id="${id}-front-leg">${leg(legs[1], 1)}</g>
<g id="${id}-front-arm">${arm(arms[1], 1)}</g>
<g id="${id}-head">${neck}${head}${nose}${hairEl}</g>
</g>`
}

// ---- confetti ----
const cross = (x, y, s, c) => `<path d="M${x - s},${y} H${x + s} M${x},${y - s} V${y + s}" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`
const dot = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`
const ring = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="3"/>`
const squig = (x, y, c, rot = 0) => `<path transform="rotate(${rot} ${x} ${y})" d="M${x},${y} q7,-9 14,0 t14,0 t14,0" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`
function confetti(items) {
  return `<g id="confetti">${items.map(([k, x, y, a, b]) => (k === 'x' ? cross(x, y, a, b) : k === 'o' ? dot(x, y, a, b) : k === 'r' ? ring(x, y, a, b) : squig(x, y, a, b))).join('')}</g>`
}

// ---- props ----
const coin = (x, y, r, fill = C.terraPale) => `<g>${shape(circlePath(x, y, r), fill)}${outline(circlePath(x, y, r * 0.58), 2)}<path d="M${f(x - r * 0.25)},${f(y - r * 0.12)} q${f(r * 0.25)},${f(-r * 0.25)} ${f(r * 0.5)},0" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/></g>`
const checkBadge = (x, y, r, fill = C.teal) => `<g>${shape(circlePath(x, y, r), fill)}<path d="M${f(x - r * 0.4)},${f(y + r * 0.02)} l${f(r * 0.28)},${f(r * 0.3)} l${f(r * 0.55)},${f(-r * 0.6)}" fill="none" stroke="${C.white}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`
const plusBadge = (x, y, r, fill = C.terra) => `<g>${shape(circlePath(x, y, r), fill)}<path d="M${x - r * 0.45},${y} H${x + r * 0.45} M${x},${y - r * 0.45} V${y + r * 0.45}" fill="none" stroke="${C.white}" stroke-width="5" stroke-linecap="round"/></g>`
const star = (x, y, r, fill = C.terra) => {
  const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r * 0.45 : r; return [x + rr * Math.cos(a), y + rr * Math.sin(a)] })
  return shape(`M${pts.map(P).join(' L')} Z`, fill)
}
function phone(x, y, w, h, rot, screen = C.tealPale) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">${shape(rrect(0, 0, w, h, 26), C.cream)}${shape(rrect(14, 28, w - 28, h - 52, 14), screen, 2)}<path d="M${w / 2 - 16},14 h32" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/></g>`
}
const bars = (x, y, w, hs, colors) => hs.map((h, i) => shape(rrect(x + i * (w + 10), y - h, w, h, 6), colors[i % colors.length], 2.2)).join('')
const lineChart = (pts, color = C.terra) => `<path d="M${pts.map(P).join(' L')}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`
const arrowHead = (x, y, rot, c = C.ink) => `<path transform="rotate(${rot} ${x} ${y})" d="M${x - 12},${y - 9} L${x},${y} L${x - 12},${y + 9}" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
const card = (x, y, w, h, rot, fill, stripe) => `<g transform="translate(${x} ${y}) rotate(${rot})">${shape(rrect(0, 0, w, h, 12), fill)}<path d="M0,${h * 0.3} H${w}" stroke="${C.ink}" stroke-width="${h * 0.16}"/><path d="M14,${h * 0.78} h${w * 0.3}" stroke="${stripe}" stroke-width="5" stroke-linecap="round"/></g>`

const svg = (label, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="${label}" fill="none">\n${body}\n</svg>\n`
const write = (name, label, body) => { counter = 0; writeFileSync(new URL(`${name}.svg`, OUT), svg(label, body)) }

// ===== 1. welcome: reaching for a coin beside a giant phone =====
write('welcome', 'A person leaping up to catch a coin beside a giant phone showing growth', `
${confetti([['x', 90, 120, 9, C.terra], ['o', 150, 230, 7, C.teal], ['q', 60, 330, C.terra, -10], ['x', 250, 70, 8, C.teal], ['o', 330, 130, 6, C.terra], ['r', 120, 470, 9, C.teal], ['x', 520, 90, 9, C.terra], ['o', 740, 120, 8, C.teal], ['q', 650, 70, C.teal, 8], ['x', 760, 300, 9, C.terra], ['o', 700, 520, 7, C.terra], ['x', 80, 560, 8, C.terra], ['r', 560, 540, 8, C.teal], ['o', 40, 220, 6, C.teal], ['q', 380, 560, C.terra, -6]])}
${phone(520, 170, 190, 320, 7)}
<g id="phone-screen" transform="translate(520 170) rotate(7)">
${lineChart([[34, 215], [66, 190], [92, 200], [124, 150], [150, 120]])}
${bars(36, 280, 24, [30, 50, 70], [C.tealSoft, C.teal, C.terraSoft])}
</g>
${checkBadge(702, 196, 28)}
<g transform="rotate(-8 520 360)">${shape(rrect(430, 340, 150, 56, 14), C.white)}<path d="M474,368 h70 M474,382 h44" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" opacity=".5"/></g>
${checkBadge(446, 368, 16, C.terra)}
<g id="coins">${coin(450, 80, 32)}${coin(580, 60, 18, C.tealPale)}${coin(160, 170, 22, C.tealPale)}</g>
${person({ id: 'person', H: [300, 372], S: [322, 238], dir: 1, top: C.teal, pants: C.terra, legs: [[236, 548, 22], [414, 458, -26]], arms: [[214, 236, -18], [408, 118, 20]] })}
`)

// ===== 2. accounts: opening a wallet =====
write('accounts', 'A person holding open a wallet while a plus sign floats above', `
${confetti([['x', 100, 110, 9, C.terra], ['o', 190, 200, 7, C.teal], ['q', 70, 300, C.teal, -8], ['x', 640, 80, 9, C.teal], ['o', 710, 170, 7, C.terra], ['r', 740, 330, 9, C.terra], ['x', 600, 540, 8, C.teal], ['o', 90, 500, 7, C.terra], ['q', 380, 70, C.terra, 6], ['o', 460, 130, 6, C.teal], ['r', 250, 520, 8, C.teal]])}
${plusBadge(560, 150, 38)}
${card(500, 245, 130, 84, -10, C.terraPale, C.terra)}
<g id="wallet">${shape(rrect(430, 320, 230, 150, 26), C.teal)}${shape('M430,352 Q430,326 456,326 H634 Q660,326 660,352 V372 H430 Z', C.tealSoft)}${shape(circlePath(626, 410, 18), C.cream)}</g>
${person({ id: 'person', H: [270, 378], S: [284, 236], dir: 1, top: C.terra, pants: C.ink, hair: C.ink, bun: true, skin: C.skin2, legs: [[222, 552, 20], [330, 548, -18]], arms: [[432, 378, -26], [462, 330, 24]] })}
`)

// ===== 3. entries: a long receipt roll =====
write('entries', 'A person unrolling a long receipt while writing in the air', `
${confetti([['x', 90, 100, 9, C.teal], ['o', 180, 180, 7, C.terra], ['q', 60, 400, C.terra, -6], ['x', 640, 90, 9, C.terra], ['o', 720, 200, 7, C.teal], ['r', 740, 420, 9, C.teal], ['x', 660, 540, 8, C.terra], ['o', 130, 520, 7, C.teal], ['q', 560, 60, C.teal, 4]])}
<g id="receipt">${shape('M470,40 H650 V520 l-18,-14 l-18,14 l-18,-14 l-18,14 l-18,-14 l-18,14 l-18,-14 l-18,14 l-18,-14 l-18,14 Z', C.white)}
${Array.from({ length: 9 }, (_, i) => `<path d="M492,${96 + i * 44} h${70 + (i % 3) * 20} M606,${96 + i * 44} h22" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`).join('')}
${shape(circlePath(500, 470, 14), C.terraPale)}${shape(circlePath(500, 140, 12), C.tealPale)}</g>
${person({ id: 'person', H: [250, 380], S: [266, 240], dir: 1, top: C.teal, pants: C.terra, hair: C.ink, legs: [[205, 552, 20], [318, 540, -22]], arms: [[468, 150, -16], [372, 132, 22]] })}
${shape('M372,118 l34,-30 l8,8 l-34,30 Z', C.terraSoft)}
`)

// ===== 4. paste: a message flies into a clipboard =====
write('paste', 'A person sending a message bubble from a phone into a clipboard', `
${confetti([['x', 80, 120, 9, C.terra], ['o', 170, 70, 7, C.teal], ['q', 60, 330, C.teal, -10], ['x', 520, 70, 9, C.teal], ['o', 600, 140, 7, C.terra], ['r', 740, 120, 9, C.terra], ['x', 740, 420, 8, C.teal], ['o', 690, 540, 7, C.terra], ['q', 340, 540, C.terra, 4], ['r', 90, 520, 8, C.teal]])}
<g id="clipboard">${shape(rrect(500, 150, 210, 300, 22), C.cream)}${shape(rrect(560, 128, 90, 40, 12), C.terra)}
${[0, 1, 2].map((i) => `${checkBadge(540, 230 + i * 70, 16, i === 1 ? C.terra : C.teal)}<path d="M572,${230 + i * 70} h96" stroke="${C.ink}" stroke-width="4" stroke-linecap="round" opacity=".5"/>`).join('')}</g>
<g id="message">${shape('M352,120 H462 Q484,120 484,142 V178 Q484,200 462,200 H400 L372,224 V200 H352 Q330,200 330,178 V142 Q330,120 352,120 Z', C.tealPale)}<path d="M352,150 h100 M352,172 h64" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" opacity=".5"/></g>
<path d="M486,160 Q510,120 540,150" stroke="${C.ink}" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>
${arrowHead(542, 152, 40)}
${person({ id: 'person', H: [250, 382], S: [262, 244], dir: 1, top: C.terra, pants: C.ink, hair: C.ink, skin: C.skin2, legs: [[210, 552, 20], [312, 548, -16]], arms: [[216, 300, -20], [354, 228, 22]] })}
${phone(190, 262, 42, 78, -18, C.tealSoft)}
`)

// ===== 5. goals: climbing steps to a flag =====
write('goals', 'A person striding up steps toward a flag and a star', `
${confetti([['x', 90, 100, 9, C.teal], ['o', 160, 200, 7, C.terra], ['q', 60, 360, C.terra, -8], ['x', 470, 60, 9, C.terra], ['o', 700, 80, 7, C.teal], ['r', 740, 260, 9, C.teal], ['x', 90, 500, 8, C.terra], ['o', 700, 400, 7, C.terra], ['q', 400, 520, C.teal, 6]])}
<g id="steps">${shape('M300,540 H720 V500 H300 Z', C.terraPale)}${shape('M430,500 H720 V440 H430 Z', C.tealPale)}${shape('M560,440 H720 V370 H560 Z', C.terraPale)}${shape('M650,370 H720 V290 H650 Z', C.tealPale)}</g>
<g id="flag"><path d="M684,290 V150" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>${shape('M684,150 L752,176 L684,204 Z', C.terra)}</g>
${star(560, 150, 26)}${star(430, 90, 14, C.teal)}
${person({ id: 'person', H: [400, 372], S: [428, 240], dir: 1, top: C.terra, pants: C.teal, hair: C.ink, bun: true, skin: C.skin, legs: [[360, 546, 18], [500, 446, -26]], arms: [[352, 250, -16], [556, 168, 18]] })}
`)

// ===== 6. calm: nothing coming up, a calm calendar =====
write('calm', 'A person carrying a big calendar with circular arrows and tick marks floating around', `
${confetti([['x', 90, 130, 9, C.terra], ['o', 170, 70, 7, C.teal], ['q', 60, 340, C.teal, -8], ['x', 700, 110, 9, C.teal], ['o', 750, 230, 7, C.terra], ['r', 720, 430, 9, C.terra], ['x', 640, 540, 8, C.teal], ['o', 120, 500, 7, C.terra], ['q', 380, 60, C.terra, 5]])}
<g id="calendar" transform="rotate(-6 560 300)">${shape(rrect(440, 150, 250, 250, 24), C.white)}${shape('M440,174 Q440,150 464,150 H666 Q690,150 690,174 V214 H440 Z', C.terra)}
<path d="M500,134 v34 M630,134 v34" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
${Array.from({ length: 12 }, (_, i) => dot(476 + (i % 4) * 58, 250 + Math.floor(i / 4) * 50, 9, i === 5 ? C.terra : i === 6 ? C.teal : C.tealPale)).join('')}</g>
${checkBadge(700, 150, 26)}
<g id="cycle" transform="translate(-170 -10)"><path d="M330,110 a40,40 0 1,1 -34,64" stroke="${C.teal}" stroke-width="5" stroke-linecap="round"/>${arrowHead(296, 176, 120, C.teal)}</g>
${person({ id: 'person', H: [270, 378], S: [286, 238], dir: 1, top: C.teal, pants: C.terra, hair: C.ink, skin: C.skin2, legs: [[226, 552, 20], [338, 520, -26]], arms: [[220, 330, -18], [440, 262, 22]] })}
`)

// ===== 7. chart: pointing at rising bars =====
write('chart', 'A person pointing at a bar chart with a rising arrow', `
${confetti([['x', 90, 110, 9, C.teal], ['o', 170, 200, 7, C.terra], ['q', 60, 380, C.terra, -8], ['x', 480, 70, 9, C.terra], ['o', 700, 90, 7, C.teal], ['r', 750, 250, 9, C.teal], ['x', 90, 520, 8, C.terra], ['o', 740, 520, 7, C.terra], ['q', 380, 540, C.teal, 4]])}
<g id="chart">${bars(450, 500, 56, [90, 150, 210, 290], [C.tealSoft, C.terraSoft, C.teal, C.terra])}
<path d="M450,300 Q560,260 640,190 T730,110" stroke="${C.ink}" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>${arrowHead(732, 108, -40)}</g>
${person({ id: 'person', H: [260, 378], S: [276, 238], dir: 1, top: C.terra, pants: C.ink, hair: C.ink, bun: true, legs: [[216, 552, 20], [324, 546, -18]], arms: [[222, 312, -20], [470, 240, 24]] })}
`)
console.log('illustrations written')
