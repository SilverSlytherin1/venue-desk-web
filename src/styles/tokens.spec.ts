// @ts-expect-error TypeScript has no type for a stylesheet that the builder loads as text.
import tokensSource from './_tokens.scss' with { loader: 'text' };

/** Foreground, background and the WCAG AA minimum: 4.5 for text, 3 for control borders and focus. */
const PAIRS: [foreground: string, background: string, minimum: number][] = [
  ['--color-text', '--color-canvas', 4.5],
  ['--color-text', '--color-surface', 4.5],
  ['--color-text', '--color-surface-sunken', 4.5],
  ['--color-text-muted', '--color-canvas', 4.5],
  ['--color-text-muted', '--color-surface', 4.5],
  ['--color-text-muted', '--color-surface-sunken', 4.5],
  ['--color-link', '--color-canvas', 4.5],
  ['--color-link', '--color-surface', 4.5],
  ['--color-on-accent', '--color-accent', 4.5],
  ['--color-on-accent', '--color-accent-hover', 4.5],
  ['--color-on-danger', '--color-danger', 4.5],
  ['--color-on-danger', '--color-danger-hover', 4.5],
  ['--color-danger', '--color-surface', 4.5],
  ['--tone-neutral-fg', '--tone-neutral-bg', 4.5],
  ['--tone-info-fg', '--tone-info-bg', 4.5],
  ['--tone-success-fg', '--tone-success-bg', 4.5],
  ['--tone-warning-fg', '--tone-warning-bg', 4.5],
  ['--tone-danger-fg', '--tone-danger-bg', 4.5],
  ['--color-border-control', '--color-surface', 3],
  ['--color-border-control', '--color-canvas', 3],
  ['--color-focus', '--color-surface', 3],
  ['--color-focus', '--color-canvas', 3],
];

function declarations(css: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, name = '', value = ''] of css.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    found.set(name, value);
  }
  return found;
}

/** Follows `var(--x)` references down to a hex colour. */
function resolve(theme: Map<string, string>, name: string): string {
  const value = theme.get(name) ?? '';
  return value.startsWith('var(') ? resolve(theme, value.slice(4, -1)) : value;
}

function luminance(hex: string): number {
  const [red = 0, green = 0, blue = 0] = [1, 3, 5]
    .map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(a: string, b: string): number {
  const [lighter = 0, darker = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('design tokens', () => {
  const [base = '', darkOverrides = ''] = (tokensSource as string).split(
    'prefers-color-scheme: dark',
  );
  const light = declarations(base);
  const themes = { light, dark: new Map([...light, ...declarations(darkOverrides)]) };

  it.each(['light', 'dark'] as const)(
    'keep every colour pair at AA contrast in the %s theme',
    (name) => {
      const failing = PAIRS.map(([foreground, background, minimum]) => {
        const ratio = contrast(
          resolve(themes[name], foreground),
          resolve(themes[name], background),
        );
        return { pair: `${foreground} on ${background}`, ratio, minimum };
      }).filter(({ ratio, minimum }) => !(ratio >= minimum));

      expect(failing).toEqual([]);
    },
  );
});
