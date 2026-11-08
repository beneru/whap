# whap Visual Design System: Sticker Sheet / Flat Cartoon (White & Green)

## 1. Vibe & Core Aesthetic
Friendly, cartoony, white and green. Think **sticker sheet / flat cartoon**: thick `2px` ink outlines, flat solid colors, hard offset shadows with zero blur, chunky rounded shapes (`12px` buttons/inputs, `20px` cards, full pills for chips/avatars). Playful and welcoming for video editors; structured and calm for account holders and money screens.

## 2. Hard Bans (Zero Tolerance)
- No glassmorphism (`backdrop-blur`, frosted panels, or translucent `rgba`/`/10` fills).
- No gradients, glows, or neon effects.
- No soft blurry drop shadows (only hard offset `4px 4px 0 #13261B` or `3px 3px 0 #13261B`).
- No purple or indigo anywhere. Light mode only for MVP.
- No stock photos or 3D renders.
- No banned fonts (`Inter`, `Roboto`, `Poppins`, `Montserrat`, `Open Sans`, `Nunito`, `DM Sans`, `Plus Jakarta Sans`, `Manrope`, `Outfit`, `Space Grotesk`, `Geist`, `system-ui`).
- No Lucide icons (Phosphor Icons `weight="bold"` only).
- No banned copy words (`seamless`, `unlock`, `empower`, `elevate`, `revolutionize`, `leverage`, `effortless`).

## 3. Typography (`next/font/google` only)
- **Display (`Bagel Fat One`)**: Used for H1, H2, hero lines, sticker rate badges, and big earnings/view numbers. **Never below 20px.**
- **UI & Body (`Gabarito`)**:
  - Buttons: `700` (`font-bold`)
  - H3 and smaller headings / labels: `800` (`font-extrabold`)
  - Body copy: `400` (`font-normal`)
  - Ledgers & tables: `Gabarito` with `font-variant-numeric: tabular-nums` (`tabular-nums`)

## 4. Color Tokens (`:root` + Tailwind)
| Token | Hex | Role | Text Rule |
|---|---|---|---|
| `--paper` | `#FFFFFF` | Page and card background (70% ratio) | `--ink` (`#13261B`) |
| `--mint` | `#EEF9F1` | Section backgrounds, hovered rows | `--ink` (`#13261B`) |
| `--sprout` | `#3DDC84` | Primary buttons, highlights, selected state | `--ink` (`#13261B`) ONLY (never white) |
| `--forest` | `#0F7D43` | Links, active nav, `posted` badge, accent text on white | `#FFFFFF` (`--paper`) allowed on `--forest` fill |
| `--ink` | `#13261B` | All text, `2px` borders, hard offset shadows | Never pure `#000000` |
| `--muted` | `#5B6B61` | Secondary text | WCAG AA on `--paper` and `--mint` |
| `--sun` | `#FFD23F` | In review / revision requested | `--ink` (`#13261B`) |
| `--sky` | `#8ED1FC` | Submitted state | `--ink` (`#13261B`) |
| `--coral` | `#FF7A6B` | Rejected state, danger buttons, errors | `--ink` (`#13261B`) ONLY |

## 5. Shape, Borders, Shadows & Motion
- **Borders**: `2px solid var(--ink)` (`#13261B`) on all cards, buttons, inputs, chips, and progress bars.
- **Radius**: `12px` for buttons and inputs, `20px` for cards, `9999px` for chips and avatars.
- **Hard Shadows**:
  - Cards: `4px 4px 0 #13261B`
  - Buttons: `3px 3px 0 #13261B`
  - Hover (desktop): `transform: translate(-1px, -1px)` and shadow grows to `4px 4px 0 #13261B`
  - Active press: `transform: translate(3px, 3px)` and shadow drops to `0 0 0 #13261B`
- **Spring Easing**: `150ms` to `250ms` with `cubic-bezier(.34,1.56,.64,1)`. Respects `prefers-reduced-motion`.
- **Money Screens**: Calm layout (no wiggle, no confetti on tables) with clear `Bagel Fat One` totals (`>= 20px`) and `Gabarito` `tabular-nums` rows.
