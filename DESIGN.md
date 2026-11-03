---
name: MHK Moto Repuestos
description: Light, table-first wholesale parts counter with a black brand band, orange action fills and silver structure.
colors:
  ground: "#f2f3f5"
  surface: "#ffffff"
  surface-2: "#e9eaed"
  band-black: "#000000"
  ink: "#111113"
  ink-muted: "#505156"
  ink-on-band: "#ffffff"
  silver: "#a0a0a2"
  rule: "#d4d5da"
  rule-strong: "#8a8b90"
  rule-on-band: "#3a3a3d"
  amber: "#f9a427"
  orange: "#f77817"
  orange-strong: "#ec6315"
  link: "#b23f00"
  link-hover: "#8a3000"
  success: "#14532d"
  success-tint: "#dcf5e4"
  warning: "#6b3a00"
  warning-tint: "#ffe9bf"
  danger: "#b42318"
  danger-strong: "#8f1d12"
  danger-tint: "#fde4e1"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.01em"
    fontVariation: "wdth 125, italic"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  body-lg:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.375
  table-head:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.33
    letterSpacing: "0.025em"
  code:
    fontFamily: "Geist Mono, ui-monospace, Cascadia Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
rounded:
  sm: "4.8px"
  md: "6.4px"
  lg: "8px"
  xl: "11.2px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.band-black}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.orange-strong}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 16px"
  button-outline-hover:
    backgroundColor: "{colors.surface-2}"
  button-inverse:
    backgroundColor: "{colors.band-black}"
    textColor: "{colors.ink-on-band}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 16px"
  button-destructive:
    backgroundColor: "{colors.danger-tint}"
    textColor: "{colors.danger-strong}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 12px"
  header-band:
    backgroundColor: "{colors.band-black}"
    textColor: "{colors.ink-on-band}"
  status-badge-pending:
    backgroundColor: "{colors.warning-tint}"
    textColor: "{colors.warning}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  status-badge-approved:
    backgroundColor: "{colors.success-tint}"
    textColor: "{colors.success}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  status-badge-rejected:
    backgroundColor: "{colors.danger-tint}"
    textColor: "{colors.danger-strong}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  count-badge-band:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.band-black}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  table-head:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.table-head}"
    padding: "12px 16px"
  form-alert:
    backgroundColor: "{colors.danger-tint}"
    textColor: "{colors.danger-strong}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
---

# Design System: MHK Moto Repuestos

Scope: light theme only, Operate mode (auth, store shell, admin). Derived from the built code (`src/app/globals.css`, `src/components/**`, `/admin/clientes`, `/login`) and the review screenshots. Brand colors are sampled from `public/mhk logo.png`.

## Overview

**Creative North Star: "The Parts Counter"**

The system is a working counter, not a storefront. Screens are dense, scannable and code-first: a cool silver-white ground, white work surfaces, and a black band that carries the brand. Orange is the action color and nothing else; silver is structure. The signature is the logo's slanted bar, reused as a cut-corner on the header underline, the active-nav and active-tab marker, and the auth panel edge.

Personality is direct and confident, closer to a tool than to retail. Density is high on desktop (44px controls on touch widths drop to 40px and 32px from `md`), and the admin table is the model surface. Brand drama is spent in two places only: the black band and the italic extra-wide display heading.

**Key Characteristics:**

- Cool light ground (#f2f3f5) with white surfaces and hairline silver rules; no shadows anywhere.
- Black header band and auth brand panel, with a 4px orange gradient rule beneath the header.
- Orange fills always carry black text; orange is never body text on a light ground.
- Heavy italic extra-wide display type for headings; a plain-width workhorse for data; mono for part codes and CUIT.
- Status and errors are always text plus an icon shape, never color alone.

## Colors

A black-and-orange brand on a silver-white working ground. Neutrals do the structural work; the warm accent is held for actions and the signature mark.

### Primary

- **Counter Orange** (#f77817): the primary action fill (`button-primary`), active-nav and active-tab slanted marker, text selection background. Always carries black text (7.65:1).
- **Pressed Orange** (#ec6315): hover and active state of the primary button, caret and accent-color of form controls, end stop of the brand rule (black on it 6.36:1).
- **Signal Amber** (#f9a427): top of the brand rule gradient, the count badge on the black band, and the focus ring inside black bands (10.37:1 on black).

### Secondary

- **Brand Link Rust** (#b23f00): body links on light grounds, underlined with a 3px offset (5.83:1 on white, 5.25:1 on ground). Hover is **Deep Rust** (#8a3000, 8.39:1 on white).

### Neutral

- **Cool Silver-White Ground** (#f2f3f5): page background.
- **Work Surface White** (#ffffff): cards, tables, inputs, outline buttons.
- **Raised Silver** (#e9eaed): table header, secondary and ghost hover, disabled input fill.
- **Band Black** (#000000): header band, auth brand panel; also the label color on orange fills.
- **Ink** (#111113): body text (16.99:1 on ground, 18.86:1 on white). Also the focus ring on light grounds.
- **Ink Muted** (#505156): secondary text, placeholders, hints (7.13:1 on ground, 7.92:1 on white, 6.58:1 on Raised Silver).
- **Logo Silver** (#a0a0a2): secondary text on black (8.04:1), such as the wholesale statement and the signed-in email.
- **Hairline** (#d4d5da): dividers, card and table borders (1.47:1, decoration only, never the sole boundary of a control).
- **Control Edge** (#8a8b90): input and outline-button borders (3.40:1 on white, 3.06:1 on ground).
- **Band Rule** (#3a3a3d): borders of inverse buttons on black.

### Status (text + tint pairs)

- **Pending**: #6b3a00 on #ffe9bf (7.92:1).
- **Approved**: #14532d on #dcf5e4 (7.91:1).
- **Rejected / alert**: #8f1d12 on #fde4e1 (7.38:1). Field error text is #b42318 (6.57:1 on white, 5.44:1 on the tint).

### Named Rules

**The Black-On-Orange Rule.** Orange is a fill, never a text color on white or ground (orange on ground is 2.47:1). Any label on an orange fill is black.

**The Link Rust Rule.** Inline links use #b23f00, not the brand orange. It is the only orange-family value allowed to color text on light grounds.

**The Not-Color-Alone Rule.** Status, counts and errors always combine text with an icon or shape. Color only reinforces.

## Typography

**Display Font:** Archivo variable, width axis (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Archivo variable, normal width (same stack)
**Mono Font:** Geist Mono (with ui-monospace, Cascadia Mono, monospace), for part codes and CUIT

**Character:** The display face echoes the logo lettering: heavy, italic and extra-expanded. Beneath it, the same family at normal width keeps data compact and readable. The document language is `es-AR`.

### Hierarchy

- **Display** (800, italic, `font-stretch: 125%`, 1.875rem, 1.05, -0.01em): page `h1` (Ingresar, Clientes). Utility: `font-display-wide`.
- **Body** (400, 0.875rem, ~1.43): table cells, hints, descriptions in dense views. Descriptions use 1rem capped at 65ch.
- **Body large** (400, 1rem): form inputs on touch widths (drops to 0.875rem from `md`), page descriptions.
- **Label** (600, 0.875rem, 1.375): field labels, button text, nav links, tab links, status badges.
- **Table head** (700, 0.75rem, 0.025em tracking, uppercase, Ink Muted): column headers only.
- **Code** (Geist Mono, 0.875rem): CUIT and part codes.

Tabular numerals are enabled globally (`font-variant-numeric: tabular-nums`) so columns of figures align.

### Named Rules

**The Wide Heading Rule.** Only page-level headings use the wide italic display style. Data, labels and table text stay at normal width.

**The Mono For Codes Rule.** Identifiers a buyer reads or types (CUIT, part codes) use the mono face, never the proportional one.

## Layout

A header-plus-content workhorse. Content sits in `PageContainer`: centered, `max-w-6xl` (72rem) wide or `max-w-3xl` narrow, with 16px gutters (24px from `md`) and 32px (40px from `md`) top and bottom. Sections stack with a 24px gap. Spacing follows the Tailwind 4px step; the values used repeatedly are 4, 8, 12, 16, 24 and 32px.

Breakpoints are Tailwind defaults: `md` 768px and `lg` 1024px. At `md` the auth shell becomes two panels (black brand panel 5fr, minimum 20rem, form panel 7fr); below it the brand panel is a top band with a 128px logo, the statement and the brand rule, and the form sits directly beneath. Forms cap at `max-w-sm` (24rem) for login and `max-w-xl` (36rem) for registration. Data tables render as a dense table from `lg` and as stacked, bordered rows below, carrying the same fields and actions. Touch targets are 44px high on small screens and tighten from `md`.

## Elevation & Depth

Flat. No shadows exist in the system. Depth comes from tonal layering: white surfaces on the silver-white ground, Raised Silver for table headers, 1px Hairline borders, and the black band as the only heavy plane. The one dimensional device is the clipped slant edge of the auth brand panel and the brand rule.

### Named Rules

**The Flat-By-Default Rule.** Do not add box-shadows. Separate planes with surface tone and a hairline border. State changes use color and border shifts only.

## Shapes

Softly squared, not pill-shaped. The base radius is 0.5rem (8px); buttons and inputs use 6.4px, badges and count chips 4.8px, tables and list cards 8px. Borders are 1px. The signature silhouette is the slanted cut: a 4px-high parallelogram (`slant-bar`, cut inset 0.5rem) under the active nav item or tab, a 4px orange gradient `brand-rule` with a diagonal right end under the header, and a diagonal right edge (2rem) on the desktop auth brand panel.

### Named Rules

**The Slant Signature Rule.** The slanted bar marks "you are here" and the header underline. Do not use it as decoration elsewhere.

## Components

### Buttons

Compact, bold and square-ish. Text is 14px semibold with a 6.4px radius, 44px high on touch widths, 40px (default) or 32px (`sm`) from `md`, and 48px for `lg`.

- **Primary (default):** Counter Orange fill, black label. Hover and active: Pressed Orange.
- **Outline:** white fill, Control Edge border, ink label; hover Raised Silver. Used for the secondary action (Rechazar).
- **Secondary / Ghost:** Raised Silver fill or no fill with ink label; hover darkens to Hairline or Raised Silver.
- **Inverse:** transparent with a Band Rule border and white label, for use inside the black band only (Cerrar sesión); hover adds a 10% white wash.
- **Destructive:** danger tint fill, #8f1d12 label.
- **Disabled / loading:** 50% opacity and no pointer events; loading shows a spinner and `aria-busy`.
- **Focus:** 2px outline with 2px offset, ink on light grounds and amber inside black bands.

### Inputs / Fields

White fill, 1px Control Edge border (3.40:1), 6.4px radius, 44px high (40px from `md`), text 16px on touch and 14px from `md`. Placeholder Ink Muted. Hover and focus-visible turn the border to ink. Invalid turns the border to #b42318 and shows an icon-led message line beneath (live region, always mounted so layout does not shift). Disabled uses Raised Silver fill and muted text. Labels sit above in 14px semibold, with a 6px gap. Selects share the same control class and keep the native picker.

### Header band and navigation

Black band with a 128px logo, the area navigation, the signed-in label in Logo Silver and an inverse Logout button, closed by the 4px brand rule. Nav links are 44px high, 14px semibold, Logo Silver at rest and white when active or hovered. The active link gets the orange slanted bar along its bottom edge plus `aria-current="page"`. Pending counts appear as an Amber chip with black text. A lone nav destination is hidden on mobile.

### Tabs (filter nav)

Same anatomy on the light ground: 44px links on a Hairline baseline, Ink Muted at rest, ink when active, with the orange slant bar. Counts use the light count badge (warning tint pair).

### Data table

White container, 1px Hairline border, 8px radius. Sticky header row in Raised Silver, with uppercase 12px bold Ink Muted headers. Cells use 16px by 12px padding, 14px text, row dividers in Hairline, and row hover shifts to the ground color. Company name is semibold; CUIT is mono and non-wrapping; actions are right-aligned. Below `lg` rows stack into bordered list items with a label/value grid.

### Status and count badges

Status: 4.8px radius, 14px semibold, a 16px icon (Clock, CircleCheck, CircleX) plus text on the matching tint. Count: bold tabular number, with an accessible "N pendientes" name; hidden at zero.

### Form alert

Rounded tint panel (danger tint, #8f1d12 text) with a TriangleAlert icon, in an always-mounted `role="alert"` region; optional reserved height above submit buttons.

### Auth shell

Black brand panel with the large logo and one statement in Logo Silver 18px, a clipped diagonal edge on desktop; a compact black top band with the brand rule on mobile.

## Do's and Don'ts

### Do:

- **Do** put black text on every orange fill and keep orange text off light grounds.
- **Do** use Link Rust (#b23f00) for inline links, underlined with a 3px offset.
- **Do** pair every status, count or error with text and an icon shape.
- **Do** use the mono face for CUIT and part codes, and tabular numerals for figures.
- **Do** keep surfaces flat: white on silver-white, Raised Silver for table headers, 1px Hairline borders.
- **Do** keep touch targets at 44px on small screens and ensure a visible 2px focus ring (ink on light, amber on black).
- **Do** render dense data as a table from `lg` and as stacked rows below it.
- **Do** write UI copy in Spanish (es-AR, voseo): "Ingresar", "Aprobar", "Recargá e intentá de nuevo".

### Don't:

- **Don't** add box-shadows or glow effects.
- **Don't** use the wide italic display style for body, data or labels.
- **Don't** use the slant bar as a decorative divider; it marks active state and the header underline.
- **Don't** introduce a retail hero, card grid or promotional banner; the system is a counter, not a storefront.
- **Don't** use Hairline (#d4d5da) as the only edge of an input or control; use Control Edge (#8a8b90).
- **Don't** rely on the orange slant bar alone to show the active item; keep text weight/color and `aria-current`.

## Gaps and known drift

- No dark theme; tokens are semantic on `:root` so a `[data-theme]` override can be added later.
- No data-visualization palette, shadow tokens or motion tokens exist. Transitions are a flat 150ms on color and border; `prefers-reduced-motion` collapses animation and transition durations.
- No custom spacing scale or product-card, price, cart or catalog components exist yet; those inherit this system.
- Active-marker orange on the light ground (tabs) is 2.47:1, below the 3:1 non-text guideline. It is backed by text weight, ink color and `aria-current`, but it is a build weakness, not a recorded standard.
- The contrast comment in `globals.css` is stale for three black-band pairs: recomputed values are silver on black 8.04 (comment says 7.58), white on black 21.00 (19.79) and amber on black 10.37 (9.77). All other listed ratios reproduce.
