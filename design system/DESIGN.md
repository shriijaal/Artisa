---
name: Heritage Contemporary
colors:
  surface: '#faf9f7'
  surface-dim: '#dadad8'
  surface-bright: '#faf9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeec'
  surface-container-high: '#e9e8e6'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1b'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#9c4327'
  on-secondary: '#ffffff'
  secondary-container: '#fc8d6b'
  on-secondary-container: '#73250c'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2c1700'
  on-tertiary-container: '#ba7417'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffdbd1'
  secondary-fixed-dim: '#ffb59f'
  on-secondary-fixed: '#3a0a00'
  on-secondary-fixed-variant: '#7d2c12'
  tertiary-fixed: '#ffdcbc'
  tertiary-fixed-dim: '#ffb86a'
  on-tertiary-fixed: '#2c1700'
  on-tertiary-fixed-variant: '#683d00'
  background: '#faf9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e3e2e0'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-sm:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  price-display:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  container-max: 1280px
  gutter-desktop: 24px
  gutter-mobile: 16px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

The design system embodies a **Corporate Modern** aesthetic infused with **Minimalist** editorial sensibilities. It is designed to bridge the gap between a high-end art gallery and a functional multi-vendor marketplace. The visual narrative centers on "The Frame"—using ample white space and structured layouts to treat every product listing as a curated masterpiece.

The personality is **Authentic, Culturally Rich, and Trustworthy**. By utilizing a sophisticated serif for storytelling and a rigorous sans-serif for commerce, the system establishes an institutional authority that respects the traditional Nepali crafts it hosts while providing a frictionless, global-standard e-commerce experience.

## Colors

This design system utilizes a palette rooted in natural materials and professional stability. 

- **Primary (Charcoal):** Used for typography, navigation backgrounds, and primary action buttons to convey maximum authority and "Institutional Trust."
- **Secondary (Terracotta):** Inspired by Malla-era bricks and pottery, used for accenting craft-specific elements, active states, and price highlights.
- **Tertiary (Ochre):** Used sparingly for "Limited Edition" or "Featured" markers to suggest value and rarity.
- **Neutral (Bone/Off-white):** The canvas of the application. We avoid pure #FFFFFF to reduce eye strain and provide a more "paper-like" editorial feel.
- **Verified Emerald:** A deep, prestigious green reserved exclusively for the "Verified Artist" badge and success states.

## Typography

The typographic strategy relies on a "High-Low" pairing. **Source Serif 4** provides the "High" notes—used for artist names, artwork titles, and section headings to evoke the feeling of a printed exhibition catalog. **Inter** provides the "Low" notes—the workhorse for utilitarian e-commerce tasks like filtering, pricing, descriptions, and dashboard data.

For localized currency (NPR), always use the `price-display` role to ensure the "Rs." prefix remains legible and prominent. All uppercase labels should use `label-caps` with increased letter spacing to maintain readability at small sizes.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy on desktop to ensure that high-resolution artwork does not become overly distorted on wide screens, while utilizing a **Fluid Grid** for mobile devices. 

- **Desktop (1280px+):** A 12-column grid with 24px gutters. Artwork cards typically span 3 or 4 columns.
- **Tablet:** An 8-column grid with 20px margins.
- **Mobile:** A 4-column fluid grid.

The vertical rhythm is based on an **8px scale**. Recommendation carousels should use "peek" behavior on mobile (showing 10% of the next card) to encourage horizontal scrolling without explicit scrollbars.

## Elevation & Depth

To maintain a premium feel, this design system avoids heavy drop shadows. Instead, it uses **Tonal Layering** and **Low-Contrast Outlines**.

- **Level 0 (Background):** Neutral Bone (#F9F8F6).
- **Level 1 (Cards/Surface):** Pure White (#FFFFFF) with a 1px border in `surface-taupe`. No shadow.
- **Level 2 (Hover/Active):** An extremely diffused "Ambient Shadow" (4% opacity, 12px blur) to suggest the card is lifting off the gallery wall.
- **Modals/Toasts:** Use a Backdrop Blur (8px) to maintain context of the underlying art while focusing the user on the action.

## Shapes

The shape language is **Rounded (0.5rem)**. This pronounced rounding provides a friendly, modern touch that makes the gallery experience feel approachable and contemporary. 

- **Standard Buttons & Inputs:** 8px (rounded).
- **Artwork Thumbnails:** 8px (rounded) to create a soft frame for the visual content.
- **Status Badges:** Pill-shaped (rounded-full) to distinguish them from interactive buttons or square-ish image containers.

## Components

### Verified Artist Badge
The most critical trust asset. It consists of a `verified-emerald` checkmark icon paired with the text "Verified Artist" in `label-caps`. On artwork cards, this sits adjacent to the Artist Name.

### Artwork Cards
A vertical stack:
1. **Image:** 4:5 aspect ratio for vertical/traditional art or 1:1 for contemporary.
2. **Badges:** Overlaid on top-left of image (e.g., "New", "Limited Edition").
3. **Details:** Title (Serif), Artist (Sans + Badge), Price (Bold Sans).

### Buttons
- **Primary:** Solid Charcoal background, White text. Rectangular with 8px radius.
- **Secondary:** Transparent background, Charcoal border, Charcoal text.
- **Tertiary (Artistic):** Underlined text with no border, used for "View Profile" or "Read Bio."

### Role-Based Navigation
- **Customer View:** Focuses on Discovery (Categories, Search, Cart).
- **Artist Dashboard:** Swaps the primary navigation to focus on "Art Manager," "Analytics," and "Order Fulfillment." The background of the Artist Dashboard uses a slightly cooler gray to mentally signal the shift from "Shopping" to "Working."

### Status Indicators
Use pill-shaped badges for lifecycle states:
- **Pending:** Terracotta-tinted background with `status-pending` text.
- **Published:** Emerald-tinted background with `verified-emerald` text.
- **Rejected:** Soft red background with `status-error` text.