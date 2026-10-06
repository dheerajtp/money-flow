// Simple line icons (24x24, drawn with the current text colour). No icon library needed.
const ICONS = {
  home: [['path', { d: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z' }]],
  wallet: [
    ['path', { d: 'M3 7h15a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7z' }],
    ['path', { d: 'M3 7V6a2 2 0 0 1 2-2h11' }],
    ['path', { d: 'M16 14h2' }],
  ],
  list: [['path', { d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' }]],
  clipboard: [
    ['path', { d: 'M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z' }],
    ['path', { d: 'M8 6H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2' }],
    ['path', { d: 'M9 13h6M9 17h4' }],
  ],
  target: [
    ['circle', { cx: 12, cy: 12, r: 9 }],
    ['circle', { cx: 12, cy: 12, r: 5 }],
    ['circle', { cx: 12, cy: 12, r: 1 }],
  ],
  chart: [['path', { d: 'M4 20V10M10 20V4M16 20v-7M22 20H2' }]],
  repeat: [['path', { d: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3' }]],
  flag: [['path', { d: 'M4 22V4M4 4h13l-2 4 2 4H4' }]],
  user: [
    ['circle', { cx: 12, cy: 8, r: 4 }],
    ['path', { d: 'M4 21a8 8 0 0 1 16 0' }],
  ],
  logout: [['path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9' }]],
  more: [['path', { d: 'M5 12h.01M12 12h.01M19 12h.01' }]],
  bank: [['path', { d: 'M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18' }]],
  card: [
    ['rect', { x: 2, y: 5, width: 20, height: 14, rx: 2 }],
    ['path', { d: 'M2 10h20' }],
  ],
  loan: [['path', { d: 'M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' }]],
  trending: [['path', { d: 'M3 17l6-6 4 4 8-8M15 7h6v6' }]],
  shield: [['path', { d: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z' }]],
  arrowUp: [['path', { d: 'M7 17L17 7M8 7h9v9' }]],
  arrowDown: [['path', { d: 'M17 7L7 17M16 17H7V8' }]],
  swap: [['path', { d: 'M7 7h13l-4-4M17 17H4l4 4' }]],
  plus: [['path', { d: 'M12 5v14M5 12h14' }]],
  search: [
    ['circle', { cx: 11, cy: 11, r: 7 }],
    ['path', { d: 'M20 20l-3.5-3.5' }],
  ],
  sidebar: [
    ['rect', { x: 3, y: 4, width: 18, height: 16, rx: 3 }],
    ['path', { d: 'M9 4v16' }],
  ],
  chevronDown: [['path', { d: 'M6 9l6 6 6-6' }]],
  settings: [
    ['circle', { cx: 12, cy: 12, r: 3 }],
    ['path', { d: 'M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1' }],
  ],
  check: [['path', { d: 'M5 12.5l4.5 4.5L19 7.5' }]],
  bell: [['path', { d: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0' }]],
  calendar: [
    ['rect', { x: 3, y: 5, width: 18, height: 16, rx: 2 }],
    ['path', { d: 'M3 10h18M8 3v4M16 3v4' }],
  ],
  grid: [['path', { d: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' }]],
  chevron: [['path', { d: 'M9 6l6 6-6 6' }]],
  clock: [
    ['circle', { cx: 12, cy: 12, r: 9 }],
    ['path', { d: 'M12 7v5l3 2' }],
  ],
  arrowRight: [['path', { d: 'M5 12h14M13 6l6 6-6 6' }]],
  eye: [
    ['path', { d: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z' }],
    ['circle', { cx: 12, cy: 12, r: 3 }],
  ],
  eyeOff: [['path', { d: 'M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.2A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 4.1-.9' }]],
  sparkle: [['path', { d: 'M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z' }]],
}

export default function Icon({ name, size = 20 }) {
  const shapes = ICONS[name] || ICONS.sparkle
  return (
    <svg
      className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"
    >
      {shapes.map(([tag, props], i) => {
        const Tag = tag
        return <Tag key={i} {...props} />
      })}
    </svg>
  )
}
