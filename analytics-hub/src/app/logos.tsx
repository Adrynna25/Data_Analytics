/** Brand marks. Each platform has a full lockup (`Logo`) and a square icon (`Mark`). */

export function TripketMark({ size = 33 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 33 33" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="32" height="32" rx="9" fill="#f973161a" stroke="#f9731652" />
      <path d="M16.5 7.5v6.2" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16.5 8l4.2 2.1-4.2 1.6" fill="#fb923c" />
      <path
        d="M11.6 18.4v-3.1a1.2 1.2 0 0 1 1.2-1.2h7.4a1.2 1.2 0 0 1 1.2 1.2v3.1"
        stroke="#f97316"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M7.8 18.6h17.4l-2.6 3.9H10.4z" fill="#f97316" />
      <path
        d="M6.8 25.6c1.6 0 1.6-1.3 3.2-1.3s1.6 1.3 3.2 1.3 1.6-1.3 3.2-1.3 1.6 1.3 3.2 1.3 1.6-1.3 3.2-1.3 1.6 1.3 3.2 1.3"
        stroke="#fb923c"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TripketLogo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <TripketMark />
      <span className="font-display text-[19px] font-extrabold tracking-tight text-foreground">
        Tripket <span className="text-[#f97316]">PH</span>
      </span>
    </span>
  );
}

/** Beetzee mark colors: white wordmark in dark mode, deep purple in light mode (set in index.css). */
const LOGO_FG = 'var(--bz-logo-fg, #ffffff)';
const LOGO_CUT = 'var(--bz-logo-cut, #0f0617)';

/** Play-button tile: the Beetzee square icon. */
export function BeetzeeMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
      <rect width="28" height="28" rx="8" style={{ fill: LOGO_FG }} />
      <path d="M11 8.6v10.8a.8.8 0 0 0 1.2.7l8.6-5.4a.8.8 0 0 0 0-1.4l-8.6-5.4a.8.8 0 0 0-1.2.7z" style={{ fill: LOGO_CUT }} />
    </svg>
  );
}

/** "BeetzeePLAY" wordmark (white in dark mode). Width scales the whole lockup (150px sidebar, 112px mobile). */
export function BeetzeeLogo({ width = 150 }: { width?: number }) {
  return (
    <svg width={width} height={(width * 30) / 150} viewBox="0 0 150 30" role="img" aria-label="Beetzee Play">
      <rect x="0" y="1" width="28" height="28" rx="8" style={{ fill: LOGO_FG }} />
      <path d="M11 9.6v10.8a.8.8 0 0 0 1.2.7l8.6-5.4a.8.8 0 0 0 0-1.4l-8.6-5.4a.8.8 0 0 0-1.2.7z" style={{ fill: LOGO_CUT }} />
      <text
        x="35"
        y="21"
        style={{ fill: LOGO_FG }}
        fontFamily="Montserrat, system-ui, sans-serif"
        fontSize="16.5"
        letterSpacing="-0.2"
      >
        <tspan fontWeight="400">Beetzee</tspan>
        <tspan fontWeight="800">PLAY</tspan>
      </text>
    </svg>
  );
}
