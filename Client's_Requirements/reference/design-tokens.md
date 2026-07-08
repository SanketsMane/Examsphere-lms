# Design Tokens (from the client's reference CSS)

Use these everywhere so the whole site reads as one brand. Values are taken directly from the
CSS the client pasted. Map them into Tailwind theme / CSS variables in `app/globals.css`.

## Colours

| Token | Hex | Use |
|---|---|---|
| `--navy-950` | `#0A1B3D` | Headings, primary dark, footer bg |
| `--navy-900` | `#0F2557` | Primary buttons, logo circle |
| `--navy-700` | `#16336F` | Accents |
| `--navy-500` | `#274B8C` | Secondary accents |
| `--orange-500` | `#FF7A1A` | **Primary brand accent** (highlights, "Success", CTAs) |
| `--orange-600` | `#F0630A` | Orange hover |
| `--green-600` | `#1D9A6C` | MBBS / medical accents, checkmarks |
| `--green-700` | `#157A56` | Green hover |
| `--bg` | `#FFFFFF` | Page background |
| `--bg-soft` | `#F4F7FC` | Section backgrounds ("Why Choose", Foundation) |
| `--bg-soft-2` | `#EEF2FA` | Tiles |
| `--ink-900` | `#0C1730` | Body strong text |
| `--ink-700` | `#3A4560` | Body text |
| `--ink-500` | `#6B7690` | Muted text |
| `--line` | `#E4E9F5` | Borders / dividers |

**Brand meaning of colours (keep consistent):**
- **Navy** = Competitive Exams (JEE) + primary UI
- **Orange** = Foundation + main highlight accent
- **Green** = MBBS / medical

## Typography

- **Headings:** `Sora` (weights 600–800), letter-spacing `-0.02em`
- **Body:** `Inter` (weights 400–700)
- Google Fonts import (already in the reference). In Next.js prefer `next/font/google` for
  `Sora` and `Inter` instead of a `<link>`.

## Radii

| Token | Value |
|---|---|
| `--radius-lg` | `24px` |
| `--radius-md` | `16px` |
| `--radius-sm` | `10px` |
| pills / buttons | `100px` (fully rounded) |

## Shadows

| Token | Value |
|---|---|
| `--shadow-sm` | `0 2px 10px rgba(15,37,87,0.06)` |
| `--shadow-md` | `0 10px 30px rgba(15,37,87,0.10)` |
| `--shadow-lg` | `0 24px 60px rgba(15,37,87,0.16)` |

## Layout

- Container max-width: **1240px**, side padding **24px**.
- Section vertical padding: **80–90px** desktop.
- Header height: **82px**, sticky, translucent white with `backdrop-blur`.

## Buttons (variants from reference)

| Variant | Fill | Text |
|---|---|---|
| `.btn-primary` | navy-900 → navy-950 on hover | white |
| `.btn-outline` | white, border `--line` | navy-900 |
| `.btn-orange` | orange-500 → orange-600 | white |
| `.btn-green` | green-600 → green-700 | white |

All buttons: `border-radius:100px`, hover lifts `translateY(-2px)`.
