import animate from 'tailwindcss-animate';

/** Channel tokens ("r g b") support opacity modifiers like bg-primary/20. */
const ch = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: ch('background'),
        foreground: ch('foreground'),
        primary: { DEFAULT: ch('primary'), foreground: ch('primary-foreground') },
        brand2: ch('brand2'),
        success: ch('success'),
        warning: ch('warning'),
        danger: ch('danger'),
        muted: { DEFAULT: 'var(--muted)', foreground: ch('muted-foreground') },
        subtle: ch('subtle'),
        faint: ch('faint'),
        dim: ch('dim'),
        'chart-1': ch('chart-1'),
        'chart-2': ch('chart-2'),
        'chart-3': ch('chart-3'),
        'chart-4': ch('chart-4'),
        'chart-5': ch('chart-5'),
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        input: 'var(--input)',
        ring: ch('ring'),
        surface: 'var(--surface)',
        soft: { DEFAULT: 'var(--soft)', hover: 'var(--soft-hover)' },
        card: { DEFAULT: 'var(--card)', foreground: ch('foreground') },
        popover: { DEFAULT: 'var(--popover)', foreground: ch('foreground') },
        accent: { DEFAULT: 'var(--accent)', foreground: ch('foreground') },
        secondary: { DEFAULT: 'var(--accent)', foreground: ch('foreground') },
        destructive: { DEFAULT: ch('danger'), foreground: ch('foreground') },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'rise-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.25' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'rise-in': 'rise-in 0.4s ease-out both',
        blink: 'blink 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [animate],
};
