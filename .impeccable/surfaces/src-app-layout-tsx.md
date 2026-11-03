---
version: 1
slug: "src-app-layout-tsx"
primary_target: "src/app/layout.tsx"
related_targets:
  [
    "src/app/(auth)/login/page.tsx",
    "src/app/(auth)/registro/page.tsx",
    "src/app/tienda/page.tsx",
    "src/app/admin/clientes/page.tsx",
  ]
---

# Surface brief: MHK app shells (auth, store, admin)

## Scope and mode

Operate. Login, register, pending-account page, store shell (/tienda), admin shell (/admin, /admin/clientes). Built code-first. Product truth lives in PRODUCT.md.

## Audience, job, constraints

Wholesale buyers (motorcycle workshops and parts stores) ordering by part code, often on a phone at a counter; the admin works on a desktop with dense tables. Copy is Spanish (es-AR, voseo). Brand is pinned by `public/mhk logo.png`: black ground, orange gradient (sampled #F9A427 top, #F77817 mid, #EC6315 bottom), metallic silver (#A0A0A2 mid), heavy italic wide wordmark, slanted underline bar. User chose: light interface ground with black and orange brand marks.

## Direction contract

THESIS: A parts counter, not a storefront. Dense, scannable, code-first screens; refuses the retail card-grid-and-hero template. Brand lives in a black header band, orange as the action colour, silver as structure.
OWN-WORLD: Light ground (cool silver-white), white work surfaces, black header and brand panel, orange fills carrying black text (never orange body text on white; a darker orange for links must pass 4.5:1), silver hairline rules, status in text plus shape not colour alone. Display type echoes the logo (heavy italic, wide); data in a workhorse face with tabular figures, part codes in a mono. One signature: the logo's slanted bar as a cut-corner on the header underline and active-nav marker.
STORY: The buyer knows immediately this is the MHK wholesale counter, signs in or applies in seconds, and sees the state of the account. The admin sees who is waiting for approval and decides without hunting.
FIRST VIEWPORT: Login on desktop: left black brand panel with the logo and a one-line wholesale statement; right a light panel with a compact form and the orange primary button with black label. Mobile: black top band with logo, form directly below. Admin clientes: black header, filter tabs with slanted active marker, full-width table, row actions at the right.
FORM: Operate workhorse layout (header + content, table-first admin), position n/a: brand-pinned, no roll. seed: none (unavailable)
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

Product photos, catalog layout, price display and cart are later phases and inherit this system.
