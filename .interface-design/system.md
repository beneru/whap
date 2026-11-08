# Interface Design System: whap

## Intent
- **Who:** Short-form video editors on mobile/laptop connections (often unstable cellular/Wi-Fi in PH/global markets) and high-volume page owners ("Account Holders") reviewing dozens of vertical 9:16 clips daily.
- **Verb:** Editors sign up and submit a clip in under 2 minutes; Account Holders triage clips one-at-a-time in a frame-accurate review bay, unlock clean master files upon selection, log 7-day view snapshots, and settle cent-accurate payouts.
- **Feel:** Frame.io meets Linear and Whop Content Rewards. High-contrast studio editing bay dark mode, zero marketing fluff inside the workspace, tactile status chips, and instant tabular-numeral payout transparency.

## Domain & Signature Elements
1. **9:16 Vertical Review Bay with Live Anti-Theft Watermark:** Before a clip is selected, the Account Holder views a short-lived signed stream overlaid with a dynamic diagonal editor watermark (`@username · PREVIEW ONLY`) and disabled download controls. Selecting the clip locks the editor's rate and unlocks the clean master file download.
2. **Real-Time Payout Formula & Campaign Budget Meter:** Every campaign and submission surfaces the exact cent-accurate formula `earnings = base_fee + min(views / 1000 * rate_per_1k, max_payout_per_clip)` bounded by the campaign's remaining budget cap.
3. **72h Post Countdown & 7-Day View Snapshot Ledger:** Selected clips display a live countdown to the 72h posting deadline, and posted clips track verified view snapshots with proof screenshots and 1-click dispute filing.

## Color & Surface Hierarchy (Studio Dark)
- `--bg-canvas`: `#09090B` (Base editing bay floor)
- `--bg-surface`: `#111318` (Track cards & panels, +4% lightness)
- `--bg-elevated`: `#181B22` (Modals, popovers, active review deck)
- `--bg-inset`: `#060709` (Form inputs & code/formula wells)
- `--border-subtle`: `rgba(255, 255, 255, 0.08)`
- `--border-strong`: `rgba(255, 255, 255, 0.16)`
- `--accent-emerald`: `#10B981` (Tally-light green: active campaigns, verified views, payouts)
- `--accent-amber`: `#F59E0B` (Timecode amber: revision requests, 72h post timers)
- `--accent-crimson`: `#EF4444` (Record red: disputes, missed deadlines, rejections)

## Typography & Spacing
- **UI Sans:** `Plus Jakarta Sans`, system-ui
- **Data / Timecode / Money Mono:** `JetBrains Mono`, monospace with `font-variant-numeric: tabular-nums`
- **Spacing scale:** 4pt base (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`)
- **Touch targets:** Minimum `44px-48px` height on mobile controls and review queue actions.
