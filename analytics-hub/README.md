# Analytics Hub

Two analytics dashboards in one app: **Tripket** (ferry booking, PH) and **Beetzee Play** (short-drama streaming). The business logo in the top-left of each dashboard is a platform switcher. Switching rotates the session token, unmounts the current dashboard, and mounts the other one with fresh state.

React 18 + TypeScript + Vite, styled with Tailwind and [shadcn/ui](https://ui.shadcn.com) (Radix primitives). All figures are sample data.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # switching-logic tests (vitest)
npm run typecheck
npm run build      # typecheck + production build to dist/
```

## Layout

```
src/
  app/
    PlatformShell.tsx      owns the session; mounts exactly one dashboard
    PlatformSwitcher.tsx   logo button + menu (shadcn DropdownMenu), used inside each dashboard
    session.ts             token issue / exchange (mock), stale-response guard, pf-platform persistence
    session.test.ts        token rotation, stale-response ignore, persistence
    platforms.ts           registry: id, name, subtitle, accent, bg, Logo, Mark, load, Component
    logos.tsx, context.ts
  platforms/
    tripket/   TripketApp.tsx, data.ts (typed sample data + loader), components/
    beetzee/   BeetzeeApp.tsx, data.ts, model.ts (KPI tiles), series.ts (seeded chart series), components/
  components/ui/           shadcn components (button, dropdown-menu, dialog, sheet, popover, select, accordion, toggle-group, table, sonner…)
  shared/                  Icon.tsx, format.ts (₱, K/M), chart.ts (Catmull-Rom, nice axis), useEscape, useOutsideClick, portal.tsx…
```

`components.json` is present, so you can add more shadcn components with `npx shadcn@latest add <name>`. Components that portal (dialog, sheet, popover, select, dropdown-menu) read `usePortalContainer()` so overlays render inside the active dashboard. Keep that change if you re-add or update them.

## Theme isolation

Each dashboard root carries its own class (`.theme-tripket` / `.theme-beetzee`) that defines every CSS variable the Tailwind tokens use (`--primary`, `--border`, fonts…). Nothing is defined on `:root`. Radix portals render into the dashboard root through `PortalContainerContext`, so menus, dialogs and toasts pick up the right theme and are removed with it. Only one dashboard is mounted at a time.

## Switching flow

`PlatformShell.open()` with `sessionStore.switchTo()`:

1. Same platform → the menu just closes.
2. `switchSeq++`; only the latest switch can finish.
3. The shell renders the loading screen, which unmounts the current dashboard (its DOM, listeners, timers and toasts).
4. A new token `${platform}_${hex}` (via `crypto.getRandomValues`) becomes `session.token` before any request.
5. The loading screen shows "Opening {name}…" with a spinner in the target accent color.
6. `exchangeToken(token)` (~380 ms mock) resolves only if the token is still current. The platform's `load(token)` runs next under the same rule.
7. The dashboard mounts with a new React `key` (fresh state), the page background is set, the page scrolls to the top, and focus moves to the switcher trigger.
8. `pf-platform` is saved to localStorage (wrapped in try/catch).

## Plugging in real auth and APIs

All of this is in `src/app/session.ts` and each platform's `data.ts`. UI code doesn't change.

- **Token issue:** replace `issueToken()` with your auth flow (for example a short-lived token from your IdP), or keep it as a client nonce.
- **Token exchange:** replace the body of `exchangeToken()` with a call to your token-exchange endpoint (for example OAuth 2.0 token exchange, RFC 8693). Keep the `isCurrentToken(token)` check after the `await`.
- **Data:** replace `loadTripketData(token)` / `loadBeetzeeData(token)` with real fetches. Keep the `sessionStore.request(token, …)` wrapper, which rejects a response whose token was rotated while the request was in flight. Return the same typed shapes (`TripketData`, `BeetzeeData`), or map your API into them.
- **Further requests** from inside a dashboard (filters, drill-downs) should also go through `sessionStore.request(usePlatform().token, …)`.

## Storage keys

| Key | Purpose |
|---|---|
| `pf-platform` | last-used platform |
| `tpk-kpis-{overview,marketing,operators}` | Tripket KPI selection per workspace |
| `bz-view`, `bz-period` | Beetzee view and period |
| `bz-kpis-hidden-{core,marketing,app}` | Beetzee KPIs hidden via Customize KPIs |
| `pf-mode` | dark / light mode (shared by both platforms) |
