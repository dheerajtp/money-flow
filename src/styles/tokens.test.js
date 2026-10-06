// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')
const token = (name) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1]

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('design tokens', () => {
  it('uses the warm off-white canvas with white cards and a near-black accent', () => {
    expect(token('color-bg').toLowerCase()).toBe('#f8f7f7')
    expect(token('color-surface').toLowerCase()).toBe('#ffffff')
    expect(token('color-text').toLowerCase()).toBe('#1a1a1a')
    expect(token('color-accent').toLowerCase()).toBe('#1a1a1a')
    expect(luminance(token('color-bg'))).toBeGreaterThan(0.9)
  })
  const pairs = [
    ['color-text', 'color-bg'], ['color-muted', 'color-bg'], ['color-accent', 'color-bg'],
    ['color-on-accent', 'color-accent'], ['color-on-accent', 'color-accent-hover'],
    ['color-danger', 'color-bg'], ['color-danger', 'color-danger-bg'],
    ['color-success', 'color-success-bg'], ['color-success', 'color-bg'],
    ['color-info', 'color-info-bg'], ['color-warning', 'color-warning-bg'],
    ['color-accent-ink', 'color-accent-soft'], ['color-accent', 'color-accent-soft'], ['color-text', 'color-bg'], ['color-muted', 'color-panel'], ['color-info', 'color-info-bg'], ['color-danger', 'color-bg'], ['color-text', 'color-subtle'], ['color-muted', 'color-subtle'], ['color-accent', 'color-info-bg'],
    ['color-border-strong', 'color-bg'],
  ]
  it.each(pairs)('%s on %s meets WCAG AA', (fg, bg) => {
    const min = fg === 'color-border-strong' ? 3 : 4.5
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(min)
  })
})
