# whap Visual Design System: Modern Professional White & Green

## 1. Vibe & Core Aesthetic
High-craft, modern, and professional white-and-green creator marketplace aesthetic (inspired by Linear, Whop, and Figma). Clean 1px structural borders, crisp white canvas, subtle mint wells, vibrant emerald highlights, and refined typography. Professional and trustworthy for account holders; clean and welcoming for video editors.

## 2. Design Guardrails
- Light mode first: 70% crisp white (#FFFFFF), 20% emerald and mint tones, 10% status accents.
- 1px structural borders (`border-border` / `border-border-hover`) replacing comic-book 2px black outlines.
- Subtle ambient elevation shadows replacing cartoon 4px black offset drop shadows.
- No blurry glassmorphism or distracting neon glows.
- Clean vector creator emblem graphics (film slate, playback wave, verified check) replacing cartoon mascots with goofy eyes and boots.
- Icons: Phosphor Icons (`weight="bold"`).
- Copy: Direct, human, clear. Banned words: seamless, unlock, empower, elevate, revolutionize, leverage, effortless.

## 3. Typography (Loaded via `next/font/google`)
- **Display (`Bricolage Grotesque`)**:
  - Weights: `600` (SemiBold), `700` (Bold), `800` (ExtraBold)
  - Used for H1, H2, hero headlines, rates, and financial metrics.
- **UI & Body (`Gabarito`)**:
  - Weights: `400` (Regular), `500` (Medium), `700` (Bold), `800` (ExtraBold)
  - Buttons: `700`
  - Body copy: `400` and `500`
  - Ledgers and tables: `Gabarito` with `font-variant-numeric: tabular-nums`

## 4. Color Hierarchy
| Token | Hex | Role | Text Rule |
|---|---|---|---|
| `--paper` | `#FFFFFF` | Page and card background (70% ratio) | `--ink` (`#0F1E15`) |
| `--mint` | `#F4FAF5` | Section backgrounds, subtle wells, hovered rows | `--ink` (`#0F1E15`) |
| `--sprout` | `#34D399` | Primary button accents, highlights, selected states | `--ink` (`#0F1E15`) (high contrast) |
| `--forest` | `#0D5A32` | Primary brand authority, links, active state accents | `#FFFFFF` (`--paper`) on forest fill |
| `--ink` | `#0F1E15` | Body text, headings, dark borders | Never pure `#000000` |
| `--muted` | `#52665A` | Secondary text and helper copy | Accessible contrast ratio |
| `--sun` | `#F59E0B` | In review / revision requested | Deep amber text |
| `--sky` | `#0284C7` | Submitted status chip | Deep sky text |
| `--coral` | `#EF4444` | Rejected state, danger buttons, error alerts | High-contrast text |

## 5. Shape, Borders, Shadows & Motion
- **Borders**: Refined 1px solid structural borders (`#E2ECE5` default, `#C6DCCE` hover/card).
- **Radius**: `12px` for buttons and inputs, `16px` for cards, `9999px` for chips and badges.
- **Elevation**:
  - Default card shadow: `0 1px 3px rgba(15, 30, 21, 0.04), 0 4px 12px rgba(15, 30, 21, 0.03)`
  - Hover elevation: `0 6px 18px rgba(15, 30, 21, 0.06)` with smooth translateY(-1px)
  - Active button press: translateY(1px) with tactile response
- **Easing**: 150ms to 200ms smooth cubic-bezier transitions. Respects `prefers-reduced-motion`.
- **Financial Screens**: Calm layout with clear `Bricolage Grotesque` totals and `Gabarito` tabular numbers.
