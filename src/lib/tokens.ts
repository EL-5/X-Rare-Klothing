/**
 * JS-side mirror of the CSS custom properties in src/index.css.
 * Kept in sync manually — this is the single source Framer Motion variants
 * and any other JS-driven styling should read from, instead of re-declaring
 * duration/easing values inline all over the component tree.
 */

export const motionTokens = {
  duration: {
    fast: 0.15,
    base: 0.25,
    slow: 0.4,
  },
  ease: {
    standard: [0.4, 0, 0.2, 1] as const,
  },
} as const;

export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1068,
  xl: 1200,
  '2xl': 1440,
} as const;

export type Breakpoint = keyof typeof breakpoints;
