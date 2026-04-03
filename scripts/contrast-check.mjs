const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3;

const TOKENS = {
  light: {
    'text-primary': '#0f172a',
    'text-secondary': '#334155',
    'surface-muted': '#e2e8f0',
    'border-subtle': '#cbd5e1',
    'surface-base': '#ffffff',
    'surface-dark-card': '#1e293b',
    'brand-primary': '#2b83c6',
    'button-fg': '#f8fafc',
    'button-bg': '#0f172a',
  },
  dark: {
    'text-primary': '#f8fafc',
    'text-secondary': '#cbd5e1',
    'surface-muted': '#1e293b',
    'border-subtle': '#475569',
    'surface-base': '#0f172a',
    'surface-dark-card': '#1e293b',
    'brand-primary': '#2b83c6',
    'button-fg': '#020617',
    'button-bg': '#f8fafc',
  },
  dimMobile: {
    'text-primary': '#020617',
    'text-secondary': '#1e293b',
    'surface-muted': '#e2e8f0',
    'border-subtle': '#94a3b8',
    'surface-base': '#ffffff',
    'surface-dark-card': '#0f172a',
    'brand-primary': '#2b83c6',
    'button-fg': '#f8fafc',
    'button-bg': '#0f172a',
  },
};

const CHECKS = [
  { component: 'NavItem', context: 'default label/icon', fg: 'text-secondary', bg: 'surface-base', type: 'normal' },
  { component: 'NavItem', context: 'hover label/icon', fg: 'text-primary', bg: 'surface-muted', type: 'normal' },
  { component: 'Card', context: 'title text', fg: 'text-primary', bg: 'surface-base', type: 'normal' },
  { component: 'Card', context: 'body text', fg: 'text-secondary', bg: 'surface-base', type: 'normal' },
  { component: 'Stat', context: 'value text (large)', fg: 'text-primary', bg: { light: 'surface-base', dark: 'surface-dark-card', dimMobile: 'surface-base' }, type: 'large' },
  { component: 'Stat', context: 'label text', fg: 'text-secondary', bg: { light: 'surface-base', dark: 'surface-dark-card', dimMobile: 'surface-base' }, type: 'normal' },
  { component: 'Button', context: 'primary button label/icon', fg: 'button-fg', bg: 'button-bg', type: 'normal' },
];

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const value = Number.parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function linearize(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

let hasFailure = false;

for (const [theme, values] of Object.entries(TOKENS)) {
  console.log(`\n=== ${theme} ===`);
  for (const check of CHECKS) {
    const fg = values[check.fg];
    const bgToken = typeof check.bg === 'string' ? check.bg : check.bg[theme];
    const bg = values[bgToken];
    const ratio = contrastRatio(fg, bg);
    const threshold = check.type === 'large' ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
    const pass = ratio >= threshold;
    if (!pass) hasFailure = true;
    const status = pass ? 'PASS' : 'FAIL';
    console.log(`${status.padEnd(4)} ${check.component.padEnd(8)} ${check.context.padEnd(28)} ${ratio.toFixed(2)}:1 (min ${threshold}:1)`);
  }
}

if (hasFailure) {
  process.exitCode = 1;
  console.error('\nContrast audit failed: at least one pair is below WCAG 2.2 AA.');
} else {
  console.log('\nContrast audit passed for NavItem/Card/Stat/Button across light, dark, and dimMobile contexts.');
}
