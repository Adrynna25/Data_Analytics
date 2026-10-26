# Build prompt: Analytics Hub (Tripket + Beetzee Play)

Copy everything below the line into your coding LLM (Claude Code, Cursor, v0, Lovable, etc.).

---

## Role and goal

You are a senior front-end engineer. Build a production-quality web app called **Analytics Hub**. It hosts two separate analytics dashboards, **Tripket** (a ferry-booking platform in the Philippines) and **Beetzee Play** (a short-drama streaming app). A **platform switcher** lives in the top-left business logo of each dashboard. The user can switch between Beetzee Play and Tripket. Switching swaps the active session/token cleanly and re-renders the dashboard for that platform.

Match the spec below exactly: layout, colors, typography, copy, interactions and sample data. All numbers are sample data. Keep them in typed data modules so a real API can replace them later.

## Tech stack

- React 18 + TypeScript + Vite. Use CSS Modules or Tailwind. Each platform's styles must be fully isolated so the two themes never leak into each other.
- No chart library is needed. Draw charts as inline SVG (line and area paths, gridlines, hover crosshair, tooltip).
- Icons: inline SVG, 24×24 viewBox, `stroke="currentColor"`, stroke-width 1.8, round caps and joins (Lucide-style). Lucide React is fine.
- Fonts (Google Fonts): **Inter** (400–700) and **Manrope** (600–800) for Tripket. **Montserrat** (400–800) for Beetzee Play.
- Currency is Philippine peso (₱). Use tabular numbers for all figures.

## Architecture

```
src/
  app/
    PlatformShell.tsx        // owns session + which platform is mounted
    PlatformSwitcher.tsx     // logo button + dropdown (used inside each dashboard)
    session.ts               // token issue/exchange (mock), persistence
    platforms.ts             // registry: id, name, subtitle, logo, accent, bg, component
  platforms/
    tripket/  (TripketApp.tsx, data.ts, components/…, tripket.module.css)
    beetzee/  (BeetzeeApp.tsx, data.ts, components/…, beetzee.module.css)
  shared/ (Icon.tsx, useOutsideClick.ts, useEscape.ts, format.ts)
```

### Platform registry

| id | name | subtitle | accent | page bg | logo |
|---|---|---|---|---|---|
| `beetzee` | Beetzee Play | Short-drama streaming analytics | `#a457ff` | `#0f0617` | white "BeetzeePLAY" wordmark (play-button icon in a rounded square, then "Beetzee" regular + "PLAY" bold). Square icon = the play-button tile only |
| `tripket` | Tripket | Ferry booking analytics | `#f97316` | `#0d0c0b` | orange ship/wave mark (33×33), then the text "Tripket" plus "PH" in orange |

Default platform: `tripket`. Persist the last-used platform in `localStorage` key `pf-platform`. Wrap every storage access in try/catch.

### Session and switching logic (required)

```ts
type Session = { platform: PlatformId; token: string };
```

When the user picks a platform:

1. If it is already the active one, just close the menu.
2. Increment a `switchSeq` counter so that only the latest switch wins.
3. **Unmount the current dashboard completely**: its DOM, its global listeners and its timers (toasts, animation timeouts). Its state must not survive.
4. Issue a **new token** (`${platformId}_${random}` via `crypto.getRandomValues`) and store it in the session before any data request. Any in-flight request that still carries the old token must be rejected or ignored.
5. Show a full-screen loading state: a spinner in the target accent color with the text "Opening {Platform name}…".
6. `await exchangeToken(token)`, which is mocked as a ~380 ms delay. It resolves only if the token is still `session.token`. If `switchSeq` changed meanwhile, abort.
7. Mount the new dashboard with **fresh default state** (it gets `{ token, platformId }` via context). Set the page background to the platform bg, scroll to top, and move focus to the switcher trigger.
8. Persist `pf-platform`.

Expose `exchangeToken` and the data loaders as small async functions, so a real backend (OAuth/token exchange + per-platform API) can replace the mocks without touching the UI.

### PlatformSwitcher component

- It renders inside each dashboard **in the top-left logo slot**: the sidebar header on desktop, and also the Beetzee mobile top bar.
- **Trigger button:** the active platform's logo and name, plus a chevron that rotates 90° closed / −90° open and turns the accent color when open. Hover and open state: background `#ffffff0d`, border `#ffffff1a`, radius 10px. `aria-haspopup="menu"`, `aria-expanded`, `aria-label="Current platform: {name}. Switch platform"`.
- **Dropdown:** absolute, 8px below the trigger, left-aligned, width 288px (max `100vw − 32px`). Background `#17131b`, border `1px #ffffff1f`, radius 12px, padding 6px, shadow `0 18px 50px #000a`, short fade/slide-in animation.
  - Header label: "SWITCH PLATFORM" (10.5px, 700, letter-spacing 1.2px, `#8d8494`).
  - One row per platform: a 34×34 logo tile (radius 9px, background = that platform's accent at 20% over `#0b090d`, inset 1px ring at 45%, logo 22px), then the name (13px, 700) and subtitle (11px, `#8d8494`). The active row gets an accent-tinted background (16%) and a check icon. Use `role="menuitemradio"` and `aria-checked`.
  - Footer: "Each platform opens with its own session and data." (10.5px, `#6f6776`, top border).
- **Behavior:** click toggles the menu and focuses the active item. ArrowUp/ArrowDown move focus with wrap-around. Escape closes and returns focus to the trigger, and must not also trigger the dashboard's own Escape handling. A click outside closes it. Selecting an item runs the switching logic.

---

## Platform 1: Tripket (ferry booking analytics)

### Design tokens

- Page background `#0d0c0b`. App background: `radial-gradient(circle at 89% 22%, #f9731617, transparent 25rem), linear-gradient(145deg, #100e0d, #15100c 58%, #0e0d0c)`.
- Text `#f8f7f5`. Muted text `#aaa39e`, `#807a76`, `#716b67`, `#625d59`.
- Accent `#f97316`, light accent `#fb923c`, success `#34d399`, warning `#fbbf24`.
- Borders `#ffffff14`–`#ffffff17`. Card fill `linear-gradient(145deg, #ffffff0e, #ffffff06)`, radius 12px.
- Fonts: Inter for body, Manrope 800 for headings and numbers. Single dark theme.

### Layout

- **Fixed sidebar**, 248px wide, background `#0a0908f5`, blur 18px, right border.
  - Top: the PlatformSwitcher (Tripket logo).
  - Label "WORKSPACE", then nav buttons: Analytics Overview (grid icon), Marketing & Customer (megaphone icon), Operators & Support (anchor icon). The active item has an orange gradient fill, an orange border and a glowing orange dot on the right.
  - Bottom: a status card ("All systems operational" / "Updated 2 minutes ago", green glowing dot), then a profile row ("JM" orange avatar, "Jamie Mendoza", "Analytics admin", chevron).
- **Sticky header**, 70px tall, background `#0d0c0bcc` with blur.
  - Left: breadcrumb "Tripket PH › {page title}".
  - Right: a bell icon button with an orange dot, and a date button (calendar icon + range label + chevron) that opens a popover "Filter date range" with From/To date inputs (from ≤ to), the hint "Sets the reporting range for this report" and an "Apply" button.
- **Content** (max width 1480px, padding 30px 34px):
  - Heading block: orange uppercase eyebrow, H1 (25px Manrope), description. On the right: a "Customize KPIs" ghost button (sliders icon; only when the page has more KPIs than defaults) and an "Export report" orange button (download icon) that shows the toast "{title} report is ready".
  - Period bar: segmented tabs Daily / Weekly / Monthly (active one solid orange). On Overview the right side shows "● Live data" (blinking green dot). On the other pages it shows a "REPORT FILTER" select.
  - Optional customize panel (dashed orange border): "Choose the KPIs on this page", "{n} of {total} shown · saved in this browser", "Reset to default" and "Done" buttons, and pill chips (check icon when on, plus icon when off). At least one KPI must stay on; otherwise toast "Keep at least one KPI on the page". Save the selection per workspace in localStorage `tpk-kpis-{view}`.
  - KPI grid: 4 columns (2 below 1100px, 1 below 560px). Each card has an icon tile, a "Breakdown ›" link, the label, the value (24px Manrope 800), a delta pill (green "up" or orange "down" with a rotated arrow) plus "vs. previous {day|week|month}", and the detail line. Cards fade/slide in staggered by 45ms. The whole card is clickable and keyboard-accessible, and opens the **breakdown modal**.
  - Below the KPIs: an accordion (see each page).
- **Breakdown modal** (max 600px wide; becomes a bottom sheet on mobile):
  - Icon, eyebrow "{date range} · {period}", the KPI title, a close button.
  - Summary box: Overall value, detail, delta pill.
  - Table "Breakdown / Result" with four rows. Each row has a bar whose width is 100%, 86%, 72%, 58% (orange → `#fbad52` gradient).
  - Footer: "Takeaway: {row 1 label} leads this breakdown at {row 1 value}. The KPI is {up|down} {change} vs. the previous {unit}." and a "Done" button.
  - Clicking the backdrop or pressing Escape closes it.
- **Mobile (≤780px):** the sidebar becomes an off-canvas drawer (270px) opened by a hamburger in the header, with a blurred scrim. The breadcrumb text is hidden and the date label collapses to the icon only.
- Escape priority: date popover → modal → drawer → customize panel.
- Period presets: Daily = 2025‑05‑31; Weekly = 2025‑05‑25 → 05‑31; Monthly = 2025‑05‑01 → 05‑31 (default).

### Tripket data

KPI format: label | value | change | direction | detail | icon. The first four of each pool are the defaults.

**Overview**: eyebrow "Executive overview", title "Tripket Analytics", description "Top-line business results, platform health, and the status of each workspace."

- Monthly recurring revenue | ₱2.84M | 6.3% | up | ARR run-rate ₱34.1M | trend
- Gross booking value | ₱68.4M | 9.8% | up | 212.6K transactions processed | coins
- Monthly active bookers | 48.2K | 10.7% | up | Unique paying passengers | users
- Booking conversion | 62.8% | 4.1% | up | Search to confirmed booking | ticket
- Platform uptime | 99.97% | 0.08% | up | 30-day service availability | server
- Gateway success rate | 96.4% | 1.8% | up | GCash, Maya, cards & OTC | card
- Booking failure rate | 2.7% | 0.8% | down | Payment, seat, and search errors | ticket
- Average API latency | 238ms | 14.3% | down | Operator and payment APIs | api
- Cart abandonment rate | 21.3% | 3.6% | down | Checkout exits before payment | cart
- Application crash rate | 0.42% | 0.11% | down | Android, iOS, and web | mobile
- Fraud alerts reviewed | 124 | 9.6% | down | Chargebacks and bot activity | shield

**Marketing** ("Marketing & customer" / "Passenger Growth" / "How efficiently Tripket wins passengers and where demand is strongest."):

- Customer acquisition cost | ₱184 | 8.2% | down | Blended cost per paying user
- Customer lifetime value | ₱4,860 | 12.4% | up | Expected revenue per passenger
- Top acquisition channel | Organic | 36.8% | up | Share of confirmed bookings
- Highest-demand route | CEB → TAG | 18.6% | up | Cebu to Tagbilaran
- Promo redemption rate | 28.6% | 6.9% | up | Active seasonal campaigns
- Peak booking window | 6–9 PM | 31.4% | up | Share of daily bookings

**Operators** ("Operators & support" / "Operator Performance" / "Operator monetization, fleet use, and service quality at a glance."):

- Take rate | 4.2% | 0.3% | up | Platform fee share of bookings
- Capacity utilization | 78.4% | 5.1% | up | Average load factor across fleets
- Operator feature adoption | 71.5% | 8.2% | up | Operators using 3+ core modules
- Support SLA compliance | 94.6% | 2.3% | up | Operator and passenger tickets
- Weather-disrupted trips | 3.8% | 1.4% | down | Peaks in Jul–Oct typhoon season
- Refund & modification requests | 1,842 | 7.5% | down | Rebookings, refunds & corrections

**Breakdowns** (four rows each):

- Customer acquisition cost: Organic search ₱82; Social media ads ₱216; Referral partners ₱148; Direct / app stores ₱171
- Customer lifetime value: Daily commuters ₱7,240; Leisure travelers ₱4,180; Student passengers ₱2,760; Vehicle & cargo ₱8,920
- Monthly active bookers: New passengers 14.8K; Repeat passengers 25.6K; Returning after 90 days 5.1K; Business accounts 2.7K
- Booking conversion: Search to trip selection 82.0%; Trip to passenger details 86.6%; Details to payment 90.1%; Payment to confirmation 98.1%
- Gateway success rate: GCash 98.2%; Maya 97.1%; Credit / debit cards 94.8%; Over-the-counter 91.6%
- Cart abandonment rate: Trip selection 8.4%; Passenger details 6.9%; Payment method 4.7%; Payment confirmation 1.3%
- Average API latency: Operator search API 214ms; Seat inventory API 246ms; Payment API 281ms; Ticket issuance API 208ms
- Platform uptime: Booking services 99.99%; Payment services 99.96%; Passenger app & web 99.98%; Operator integrations 99.94%
- Top acquisition channel: Organic search 36.8%; Social media ads 28.4%; Referral links 19.6%; Direct / app stores 15.2%
- Highest-demand route: Cebu → Tagbilaran 12.8K; Batangas → Calapan 10.4K; Cebu → Ormoc 8.7K; Manila → Coron 6.2K
- Promo redemption rate: Summer Sail 34.2%; Student Saver 29.8%; Partner Rewards 26.1%; First Trip 24.3%
- Peak booking window: 6–9 PM 31.4%; 12–3 PM 24.8%; 9 AM–12 PM 22.1%; 3–6 PM 14.6%
- Booking failure rate: Payment timeouts 1.2%; Seat selection conflicts 0.8%; Search errors 0.4%; Ticket issuance 0.3%
- Application crash rate: Android 0.51%; iOS 0.31%; Mobile web 0.22%; Desktop web 0.08%
- Fraud alerts reviewed: Suspicious payment spikes 48; Chargeback alerts 31; Bot search activity 27; Account anomalies 18
- Monthly recurring revenue: Enterprise ferry lines ₱1.42M; Mid-size operators ₱0.88M; Small boat operators ₱0.36M; Add-on modules ₱0.18M
- Take rate: Small boat operators 5.2%; Fast craft operators 4.6%; Vehicle & cargo 4.4%; Large ferry lines 3.8%
- Capacity utilization: RoRo vessels 84.2%; Fast craft 81.7%; Conventional ferries 72.5%; Small boats / bangka 63.9%
- Weather-disrupted trips: Typhoon / storm signals 2.1%; Gale & small-craft advisories 1.0%; Low visibility 0.4%; Seasonal tide restrictions 0.3%
- Operator feature adoption: Online booking & e-ticketing 96.0%; Dispatch & passenger manifest 82.4%; Dynamic pricing 58.3%; Fleet scheduling 49.7%
- Support SLA compliance: Operator (B2B) tickets in SLA 97.1%; Passenger (B2C) tickets in SLA 93.8%; Median first response 4m 12s; Median resolution time 3.6 hrs
- Refund & modification requests: Rebooking / date change 884; Weather-related refunds 512; Passenger-initiated refunds 318; Name / detail corrections 128
- Gross booking value: Large ferry lines ₱38.2M; Fast craft operators ₱18.6M; Small boat operators ₱7.4M; Vehicle & cargo add-ons ₱4.2M

**Scope filter options**:

- Marketing: All passengers & channels, Daily commuters, Leisure travelers, Vehicle & cargo
- Operators: All operators & vessels, Large ferry lines, Fast craft operators, Small boat operators

**Workspace summaries**:

- Marketing: status **Positive** (good), line "Acquisition is cheaper and passenger value is rising.", copy "Passenger growth is positive. Acquisition costs are falling while lifetime value climbs, and demand is concentrated on a few high-volume routes.", signals Acquisition efficiency = Improving, Passenger demand = Strong, Promotion impact = Positive.
- Operators: status **Watch** (warn), line "Fleets are fuller; typhoon season is driving refunds.", copy "Operators are using more of the platform and running fuller trips. Typhoon-season disruption is the main risk, but support is staying within SLA.", signals Operator monetization = Growing, Fleet utilization = Improving, Weather disruption = Watch.
- Platform: status **Healthy** (good), line "Core services are within target, no critical incidents.", copy "The platform is stable. Booking and payment services are within target ranges, and there were no critical availability or security events."

**Overview accordion** (all sections collapsed by default; the header has a kicker, title, right-side meta and a chevron that rotates when open):

1. "Booking performance / Confirmed bookings". Meta: "{last}K on May 31 · +{growth}% vs. previous". Body: a smooth (Catmull-Rom) line chart of daily confirmed bookings for May 2025, an orange line with an area gradient, previous period as a dashed grey line, y-axis 0/5K/10K/15K, x labels May 1/8/15/22/31. On hover: a vertical crosshair and a tooltip "May {d} · {n} bookings · ±x% vs. previous".
   - This month: 3100,3600,4200,3900,4600,5200,4800,5400,6100,5600,5900,6700,7300,6900,6500,7400,8200,7800,8600,9400,8900,9200,10300,9800,10800,11600,11100,12300,12900,12600,13800
   - Previous: 2400,2900,2700,3300,3700,3400,3900,4300,4100,4600,4400,5000,5500,5200,5600,6100,5900,6400,7000,6600,7200,7700,7400,8100,8700,8300,9000,9600,9300,10300,11000
2. "Workspace status / How each area is doing". Meta: status pills. Body: a button per workspace (icon, title, summary line, status pill, chevron) that navigates to that workspace.
3. "Platform health / Service reliability". Meta: the Healthy pill. Body: the platform summary copy plus 4 clickable mini stats (Platform uptime, Gateway success rate, Booking failure rate, Average API latency) that open the breakdown modal.

**Marketing and Operators pages**: one accordion item, "High-level reporting / {Period} executive summary", with meta "Overall outlook" plus a status pill. Body: summary copy, a green chip with the selected scope label, and the signal list with pills ("Watch" = amber, others green).

---

## Platform 2: Beetzee Play (short-drama streaming analytics)

### Design tokens (single dark theme)

```
--ink #f9f9f9; --muted #b5a9c5; --muted-soft #8d7f9e;
--canvas #0f0617; --surface #171020; --line #31203e; --line-strong #4e3a66;
--nav #090211; --nav-soft #271439;
--gold #a457ff; --gold-deep #c04cfd; --gold-soft #2d0044;
--orange #e167ff; --orange-soft #31114f; --violet #7a2dff; --violet-soft #2c0f42;
--teal #30f4a0; --teal-soft #0d3c2d; --coral #ff4e71; --coral-soft #401426; --blue #6a47ff;
```

Font: Montserrat. Cards use `linear-gradient(145deg, surface+white tint, surface+gold-soft tint)`, a 1px `--line` border and radius 13px. Primary buttons use the gradient `--gold → --gold-deep`. App background: a radial purple glow at the bottom right over a `canvas → gold-soft` diagonal gradient.

### Layout

- **Sticky sidebar**, 250px: the PlatformSwitcher (Beetzee wordmark, 150px). Label "WORKSPACE", then nav: Core Metrics Engine (grid), Marketing Ads (megaphone), Application & Users (pulse). Active item: gradient fill and a glowing `--orange` dot. A "Data sources" card (Ad platforms / App analytics / Payment records, each "● Synced" in teal). Profile at the bottom: "JM", Jamie Mendoza, Analytics admin.
- **Sticky top bar**, 66px: breadcrumb "Beetzee Play › {title}". On the right: a dashed "Sample data" chip, a bell with a coral dot (toast "No new alerts. All data sources synced."), and a date pill showing the period range.
- **Content**: eyebrow, H1, description, and a "Copy summary" button that copies "{title} — {range}" plus one line per KPI ("{label}: {value} (+{trend} {comparison})") and shows the toast "Summary copied to clipboard". If copying fails, the toast says "Copy isn't available here. Select the figures to copy them."
- **Filters bar**: "Reporting period" + range, and a segmented control Daily / Monthly / Yearly (default Monthly). On Marketing only, a campaign picker on the right ("CAMPAIGNS / {label} · {status}") opens a menu table: name + status, Spend, Impressions, CTR.
- **KPI tiles**: accent stripe on the left, a soft accent circle top-right, label, value (27px, 800), a trend pill (teal good / coral bad), comparison text, and an optional sparkline. A tile is clickable (chevron rotates when selected) and toggles a **breakdown card** below the grid. The card has a title, subtitle, Close, a 4-metric grid (left color stripe gold/pink/green) and a 3-column method row: What it shows / Calculation / Data source.
- **"DETAILED REPORTS"** header with an "Expand all / Collapse all" button. Below it, collapsible accordion cards (`<details>`; all closed by default; open state survives period changes; chevron rotates; a legend is shown only when open).
- **Mobile (≤800px):** the sidebar is hidden. The top bar shows a compact switcher (112px wordmark) and sticky horizontal tabs below the top bar. Grids become 2 columns. Escape closes the campaign menu or the breakdown.
- Remember the view and period in localStorage (`bz-view`, `bz-period`).

### Beetzee data

Periods: Daily "May 31, 2025" (vs. previous day), Monthly "May 1 – May 31, 2025" (vs. previous month), Yearly "Jan 1 – Dec 31, 2025" (vs. previous year).

| | Daily | Monthly | Yearly |
|---|---|---|---|
| Budget | ₱21.0K | ₱650K | ₱7.80M |
| Ad spend | ₱16.0K | ₱496K | ₱5.95M |
| Impressions / Rewarded ads | 201.3K | 6.24M | 74.88M |
| Clicks | 7.7K | 239.6K | 2.88M |
| Active users | 78.4K | 842.6K | 1.42M |
| Attributed sales | ₱155.5K | ₱4.82M | ₱57.84M |
| Gross platform sales | ₱49.0K | ₱1.52M | ₱18.25M |
| Sign-ups | 3.2K | 98.4K | 1.18M |
| Purchases | 587 | 18.2K | 218.4K |
| Paying users | 560 | 17.3K | 208.1K |
| Reward coin value | ₱2.01K | ₱62.4K | ₱748.8K |
| Remaining budget | ₱5.0K | ₱154K | ₱1.85M |
| Watched hrs / runtime | 309 / 419 hrs | 9,568 / 13,000 hrs | 114.8K / 156K hrs |
| Peak impressions | 9.2K (8 PM) | 238K (May 28, 2025) | 7.1M (October 2025) |

Fixed figures:

- Episode completion 73.6% (+4.1%)
- CAC ₱28.60 (6.8%, shown with a down arrow)
- ROAS 9.72×
- Budget utilization 76.3%
- CPC ₱2.07
- CPM ₱79.49
- Store/payment conversion 17.6%
- Avg. revenue per payer ₱87.86
- CTR 3.84%
- Ads per ₱1.00 = 100
- Uptime 99.98%

Trends:

- Investment +8.2%
- Sales +12.4%
- Users +10.7%
- Sign-ups +9.8%
- Paying +8.6%
- Ads +14.3%
- Budget +4.0%
- Clicks +9.8%

Campaigns (spend share / ROAS / CTR; spend, impressions and clicks shown as daily | monthly | yearly):

- Drama Rush · Meta · 33.5% · 10.4× · 4.20%
  - Spend ₱5.4K | ₱166K | ₱1.99M
  - Impressions 70.3K | 2.18M | 26.16M
  - Clicks 3.0K | 91.6K | 1.10M
- Love Stories · TikTok · 25.0% · 9.9× · 3.70%
  - Spend ₱4.0K | ₱124K | ₱1.49M
  - Impressions 50.3K | 1.56M | 18.72M
  - Clicks 1.9K | 57.7K | 692.4K
- New User Acquisition · Google · 22.6% · 9.1× · 3.60%
  - Spend ₱3.6K | ₱112K | ₱1.34M
  - Impressions 46.1K | 1.43M | 17.16M
  - Clicks 1.7K | 51.5K | 618K
- Viewer Retargeting · YouTube · 18.9% · 8.7× · 3.63%
  - Spend ₱3.0K | ₱94K | ₱1.13M
  - Impressions 34.5K | 1.07M | 12.84M
  - Clicks 1.3K | 38.8K | 465.6K
- "All campaigns · 4 active" = the totals.

### Beetzee pages

**Core Metrics Engine** ("Executive overview"; "A consolidated quick view of marketing, audience, engagement, and revenue performance.")

- 8 KPIs: Marketing investment, Attributed sales, Active users, New sign-ups, Paying users, Episode completion, Rewarded ads served, Customer acquisition cost.
- Accordion sections:
  1. **Sales vs. ad spend**: a 2-line chart (teal area = sales, orange = spend) with a note "ROAS 9.72× · Every ₱1 of ad spend returned ₱9.72 in attributed sales".
  2. **Acquisition funnel**: Impressions → Clicks (3.8%) → Sign-ups (41.1% of clicks) → Paying (17.6% of sign-ups). Bar widths are step conversion rates. Ends with a CAC callout.
  3. **Campaign performance** table: Campaign, Status, Spend, Share of spend (bar), Impressions, Clicks, CTR, ROAS.

**Marketing Ads Performance** ("Source 01"; "High-level media investment, delivery, and acquisition outcomes.")

- 6 KPIs: Marketing budget, Ad spend, Impressions, Ad clicks, Active app users, CAC. Spend, impressions and clicks follow the selected campaign.
- Accordion: **Impressions trend** (peak note), **Spend by channel** donut (Meta 34%, TikTok 25%, Google 22%, YouTube 19%), **Campaigns** table (the selected campaign row is highlighted).

**Application & User Platform Performance** ("Source 03"; "High-level audience, engagement, monetization, and platform health.")

- 5 KPIs: Gross sales, Active users, Episode completion, Rewarded ads served, New sign-ups.
- Accordion:
  - **Active users** trend.
  - **Top shows by completion**:
    - The Boss's Secret Bride, Romance · 80 eps, 81.2%, +5.4%
    - Love in Ten Episodes, Romance · 10 eps, 78.9%, +3.1%
    - Sarah's Second Chance, Drama · 64 eps, 72.4%, +2.2%
    - The CEO's Hidden Heir, Drama · 92 eps, 66.0%, −1.8%
  - **Users by platform** donut: Android 58%, iOS 27%, Web & partners 15%.
  - **E-wallet payment mix** bars: GCash 48.2% (+3.2%), Maya 27.5% (+1.8%), GlobeOne 14.1% (−0.6%), Palawan Pay 10.2% (+0.9%).
  - **Service health**: 99.98% gauge, "All systems operational", then Streaming CDN 42 ms, Payments API 118 ms, Ad delivery 64 ms.

**Breakdown cards**: each KPI opens 4 related metrics plus the method row. Examples:

- Attributed sales → Attributed sales / Direct purchases / ROAS 9.72× / Store conversion 17.6%. Method: "Sales connected to users acquired through paid campaigns." · "Sum of attributed completed purchases" · "Marketing + payment data".
- CAC → Acquisition cost ₱28.60 / Marketing spend / Paying users / CPC ₱2.07. Method: "Average paid media cost required to gain one paying user." · "Marketing spend ÷ new paying users" · "Marketing + payment data".

Build the rest the same way from the table above.

**Chart series**: generate them deterministically per period (12 points for daily = every 2 h, 31 for monthly, 12 for yearly) with a seeded random. The points must sum to the period total, with a gentle upward trend, weekend bumps for monthly and an October peak for yearly. The y-axis uses "nice" max values with ticks at 0, 25, 50, 75 and 100%. Hover shows the nearest point with a crosshair and tooltip. The last point has an endpoint dot.

---

## Quality bar

- Accessibility: visible focus rings, ARIA roles on menus, tabs and dialogs, keyboard support for every interactive card, and `prefers-reduced-motion` respected.
- Responsive down to 360px with no horizontal page scroll. Wide tables scroll inside their own container.
- No style or listener leakage between platforms. Verify this: switch back and forth 10 times, and confirm there are no duplicated listeners, no console errors, and that each mount starts from default state.
- Keep sample data in `data.ts`, fully typed, and keep formatting helpers (₱, K/M) in `shared/format.ts`.
- Deliver: the full source, a `README.md` (run, build, where to plug in the real auth/API), and short tests for the switching logic (token rotation, stale-response ignore, persistence).
