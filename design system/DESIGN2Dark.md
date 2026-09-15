---
name: Nocturne Vermillion Haute Horlogerie
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#1f1f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#e4beb9'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#303032'
  outline: '#ab8985'
  outline-variant: '#5b403d'
  surface-tint: '#ffb4ab'
  primary: '#ffb4ab'
  on-primary: '#690005'
  primary-container: '#b91c1c'
  on-primary-container: '#ffcdc7'
  inverse-primary: '#b91c1c'
  secondary: '#ffb4ab'
  on-secondary: '#690005'
  secondary-container: '#bb0112'
  on-secondary-container: '#ffc8c1'
  tertiary: '#ffb3b1'
  on-tertiary: '#680011'
  tertiary-container: '#bb142c'
  on-tertiary-container: '#ffccca'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000b'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb4ab'
  on-secondary-fixed: '#410002'
  on-secondary-fixed-variant: '#93000b'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b1'
  on-tertiary-fixed: '#410007'
  on-tertiary-fixed-variant: '#92001c'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  headline-lg:
    fontFamily: EB Garamond
    fontSize: 52px
    fontWeight: '400'
    lineHeight: 60px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
---

## Brand & Style

The design system establishes an ultra-refined, high-contrast night-viewing gallery experience tuned for premier heritage artifacts, masterworks, and haute-horlogerie level curation. The brand personality is uncompromisingly prestigious, theatrical, and precise. It strips away warm gilded tones in favor of an unapologetic chromatic dialogue: abyssal carbon surfaces paired with searing Himalayan crimson, deep mineral vermillion, and luminous crystalline white typography.

Targeted at international connoisseurs, master collectors, and institutional curators, the emotional response evokes stepping into a hyper-controlled vault illuminated by razor-sharp spotlights. Classical poise merges with contemporary discipline through razor-sharp lines, deliberate negative space, and incandescent red chromatic accents that charge the dark environment with tension and kinetic focus.

## Colors

The color architecture is rooted in deep, light-absorbing basalt and carbon tones preserved directly from classic vault settings, systematically stripped of bronze and gold patinas, and electrified with high-contrast mineral vermillions.

### Core Chromatic Roles
- **Primary (`#B91C1C` / Deep Vermillion):** Anchors core interactive targets, primary action surfaces, and critical validation indicators. It represents profound authority and weight.
- **Secondary (`#DC2626` / Vibrant Vermillion):** Applied to active states, focused outlines, interactive hover transitions, and progressive loaders.
- **Tertiary (`#E63946` / Himalayan Crimson):** Reserved for high-alert moments, rarity flags, auction hammer indicators, and illuminated badge treatments.
- **Surface Foundations:** 
  - Canvas base rests at `#131315`.
  - Recessed backgrounds and deep foundational backing drop to `#0E0E10`.
  - Elevated containment panels, cards, and structural rails rest at `#1B1B1D` and `#18181B`.

### Typography & Content Color
- **Pure White (`#FFFFFF`):** High-luminance editorial displays, headings, prices, and high-priority metrics.
- **Radiant Silver (`#F1F1F1`):** Primary body prose and key interface values, maximizing readability across OLED and high-gamut displays.
- **Balanced Gray (`#D1D5DB` & `#9CA3AF`):** Secondary metadata, specifications, column labels, and timestamp indicators.

## Typography

The typographical cadence marries the classical grandeur of **EB Garamond** with the technical clarity of **Manrope**.

- **EB Garamond (Editorial & Curatorial Display):** Leveraged for exhibit titles, provenance accounts, collector essays, and structural headers. The natural, historic proportions provide an uncompromising institutional atmosphere.
- **Manrope (Interface, Data, & Figures):** Brings geometric balance, crisp vertical alignment, and open counters. Manrope delivers effortless readability for dense technical specifications, valuation displays, inventory status indicators, and micro-controls against pitch-dark canvas planes.
- **Uppercase Metadata & Micro-Labels:** `label-caps` employs wide tracking (`0.1em`) to prevent visual bleed on OLED matrices, guaranteeing that classification tags, lot numbers, and catalog IDs remain crisp and instantly scanable.

## Layout & Spacing

The layout is built upon a 12-column architectural grid engineered around high aesthetic restraint, dramatic asymmetry, and deliberate macro-spacing.

- **Desktop (1280px+):** 12-column configuration restricted to a maximum container width of `84rem` (1344px) with 24px gutters and 64px horizontal canvas margins. Grid partitions support 3-column gallery specimen cards, 6-column contextual essays, and 8-column wide focal exhibits.
- **Tablet (768px - 1023px):** 8-column grid with 20px gutters and 32px safe margins. Secondary metadata wraps below thumbnail showcases.
- **Mobile (<768px):** 4-column framework featuring 16px gutters and 20px lateral margins. Carousel arrays enforce edge-bleeding with an intentional 12% peek margin to signify horizontal gestures.
- **Vertical Rhythm:** Generous vertical sections leverage `space-3xl` (64px) and `space-4xl` (96px) to emulate physical negative space within an international museum gallery, isolating critical masterworks without distraction.

## Elevation & Depth

Visual hierarchy is constructed through calibrated dark tonal surfaces, laser-fine borders, and incandescent crimson back-glows, completely discarding heavy mud-brown dropshadows.

- **Level 0 (Floor - `#0E0E10`):** Recessed canvas plane that absorbs environmental illumination. Used for primary underlays, side drawer wells, and full-bleed image backgrounds.
- **Level 1 (Card & Rail - `#131315` & `#1B1B1D`):** Primary interactive cards, filter bars, and header panels. Framed with a 1px boundary of `rgba(255, 255, 255, 0.09)`.
- **Level 2 (Hover & Elevated Deck - `#18181B`):** Hovered artifact cards, popovers, and contextual drawers. Features a subtle crimson-tinted highlight: border becomes `rgba(220, 38, 38, 0.35)` with an ambient back-glow of `0 8px 24px rgba(185, 28, 28, 0.12)`.
- **Level 3 (Modal & Precision Zoom - `#222225`):** Dialog overlays, full-screen artifact inspection suites, and transaction workflows. Elevated with a pure obsidian drop shadow `0 24px 48px rgba(0, 0, 0, 0.85)` framed by a crisp border `rgba(255, 255, 255, 0.18)` and an active backdrop-blur filter of `20px`.

## Shapes

The design system adheres to a generous rounded geometry (`roundedness: 2`), softening horological sapphire glass cases and stone-cut curation frames with approachable curves.

- **Base Radius (8px / 0.5rem):** Form inputs, buttons, chips, and micro-interactive elements. Ensures architectural elegance while maintaining a welcoming touch target.
- **Containers & Framing (16px / 1rem - `rounded-lg`):** Gallery cards, modular sheets, modal dialogs, and image framing viewports.
- **Specialized Seals & Pills (`rounded-full`):** Reserved exclusively for provenance status indicators, authentication seals, and live bidding status badges to provide instant distinction from structural layout elements.

## Components

### Buttons
- **Primary Action:** Solid vibrant vermillion fill (`#B91C1C`) with pure white text (`#FFFFFF`) in `Manrope SemiBold` (`label-caps`). On hover, transitions cleanly to `#DC2626` with an accompanying crimson halo (`0 0 16px rgba(220, 38, 38, 0.4)`). Active click state engages `#991B1B`.
- **Secondary Action:** Transparent dark surface (`#1B1B1D`) bounded by a 1px subtle neutral outline (`rgba(255, 255, 255, 0.18)`) with `#FFFFFF` text. On hover, the outline illuminates to `rgba(220, 38, 38, 0.6)` with light silver text (`#F1F1F1`).
- **Ghost / Curatorial Link:** Transparent background with pure white text accompanied by a fine crimson underline accent (`#E63946`) that expands from the center outward upon interaction.

### Cards & Gallery Displays
- Backing sits on `#18181B` enclosed within a 16px border radius (`rounded-lg`) and a 1px crisp neutral border (`rgba(255, 255, 255, 0.09)`).
- Artwork and artifact viewports sit in a fixed 4:5 or 16:10 ratio over `#0E0E10`. Hovering over the card initiates an ultra-smooth 1.015x zoom over 350ms, while the enclosing border activates with a crimson hairline boundary (`rgba(220, 38, 38, 0.4)`).
- Titles are typeset in `EB Garamond` (`title-md`) in pure white (`#FFFFFF`), while valuation amounts utilize `price-display` in crisp silver (`#F1F1F1`).

### Chips & Filter Tags
- Inactive tags utilize `#1B1B1D` background with 1px neutral border (`rgba(255, 255, 255, 0.09)`) and `#D1D5DB` text in `label-sm`.
- Active/Selected tags illuminate with a dark crimson tint (`rgba(185, 28, 28, 0.2)`), bordered by `#DC2626` with pure white text (`#FFFFFF`).

### Form Inputs & Fields
- Field base is set to `#131315` wrapped in a 1px border of `rgba(255, 255, 255, 0.12)` with an 8px corner radius.
- Placeholder text in `#9CA3AF`; active input text renders in `#FFFFFF`.
- On focus, border snaps to `#DC2626` coupled with an exterior glow ring of `0 0 0 3px rgba(220, 38, 38, 0.18)`.

### Authentication Badges & Verification Seals
- **Master Provenance Seal:** Pill-shaped container filled with `rgba(230, 57, 70, 0.12)`, edged with a 1px boundary of `#E63946`, featuring a pulsating crimson focal dot and pure white `label-caps` text.
- **Vault Status / Limited Edition:** Enclosed in `#1B1B1D` with a subtle silver hairline border (`rgba(255, 255, 255, 0.15)`) and silver typography (`#F1F1F1`).

### Lists & Key-Value Spec Rows
- Separated by razor-thin horizontal rules (`rgba(255, 255, 255, 0.06)`).
- Spec label configured in `Manrope` (`body-sm`) in `#9CA3AF`; spec value aligned right in `Manrope Medium` in `#FFFFFF`.