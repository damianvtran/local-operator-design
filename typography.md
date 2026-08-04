# Typography

Three families, sixteen steps, and a hard rule about where monospace may
appear. The scale itself is in [`tokens.md` § 8](./tokens.md#8-type-scale) and
[`tokens.json`](./tokens.json); this file is the reasoning, the axis behaviour,
the placement rules and the licensing.

*Read after [`tokens.md`](./tokens.md), before [`motion.md`](./motion.md). Needs
[`tokens.md` § 8](./tokens.md#8-type-scale) for the step values; nothing else in
the kit depends on this file, so it is safe to skim on a first pass and return to
before you load a font.*

---

## 1. The three families

| Role | Family | Variable axes shipped | Weight range | Fallback stack |
|---|---|---|---|---|
| Display | **Fraunces Variable** | `opsz`, `wght` | 100–900 | `ui-serif, Georgia, serif` |
| UI and body | **Figtree Variable** | `wght` | 300–900 | `ui-sans-serif, system-ui, -apple-system, sans-serif` |
| Data and labels | **JetBrains Mono Variable** | `wght` | 100–800 | `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` |

### Why a serif for display

The product is a piece of software that runs on your own machine and touches
your own files. The audience for that pitch has used a chat assistant, not a
build tool. A grotesque display face reads as *software company*; a serif with
real stroke contrast reads as *a well-made thing* — closer to a book jacket than
a dashboard gauge. That is the register the whole system is aiming at, and the
display face is where the reader decides which register they are in, in about
200ms, before they read a word.

Fraunces specifically, over the obvious alternatives, for one reason that is not
taste: **it has a genuine optical-size axis.** A display face that is just a
body serif scaled up gets spindly and gappy at 60px. Fraunces redraws itself.
That is worth its file size and nothing else in the shortlist offered it.

### Why a humanist grotesque for body

Figtree has open apertures and a tall x-height, which is what makes 14px card
body and 13px fine print legible on a warm, slightly-low-contrast ground. It is
also *quiet* next to a serif: a body face with personality fights the display
face and the page ends up looking like two designs. The chrome — nav, buttons,
badges, the wordmark itself — is all Figtree, deliberately, so the serif appears
**only in headings**. That is the mitigation for the risk that a serif reads
"editorial brand" rather than "software".

### Why a mono at all

Because this product's whole claim is that it touches real things: real files,
real paths, real code, real version numbers. A filename set in the body face is
a filename you have to take on faith. A filename set in mono is evidence. The
mono is the instrumentation signal, and rationing it (§ 4) is what keeps it a
signal rather than a texture.

### What none of them may become

The display face never carries body copy. The mono never carries prose. The body
face never carries a heading above `heading-sm`. A face doing a second job is
how a three-family system quietly becomes a one-family system with extra
downloads.

---

## 2. The step table

Every step is size / line-height / weight / tracking / face. **A step never
encodes its family** — that separation is what lets the scale survive a font
swap, and it means an implementation must explicitly pair each step with a
family. Getting that wrong is visible immediately, which is the point.

| Step | Size | Line-height | Weight | Tracking | Face | Use |
|---|---|---|---|---|---|---|
| `display-lg` | 60px | 1.04 → 62.4px | 400 | `-0.028em` | display | Hero H1 at ≥ 640px |
| `display-md` | 40px | 1.08 → 43.2px | 400 | `-0.024em` | display | Hero H1 below 640px; closing H2 |
| `heading-lg` | 40px | 1.10 → 44px | 400 | `-0.024em` | display | Section H2 at ≥ 640px |
| `heading-md` | 30px | 1.15 → 34.5px | 400 | `-0.02em` | display | Section H2 below 640px |
| `heading-sm` | 20px | 1.35 → 27px | 560 | `-0.01em` | sans | Card titles, accordion triggers, tab labels, column heads |
| `subhead` | 19px | 1.55 → 29.45px | 400 | `-0.005em` | sans | Deck under a heading. Max 46ch |
| `body-lg` | 17px | 1.65 → 28.05px | 400 | `0` | sans | Section prose. Max 68ch |
| `body` | 16px | 1.65 → 26.4px | 400 | `0` | sans | Default prose, long-form, answers |
| `body-sm` | 14px | 1.60 → 22.4px | 400 | `0` | sans | Card body, captions, table cells |
| `body-xs` | 13px | 1.55 → 20.15px | 400 | `0` | sans | Footnotes, fine print |
| `label` | 15px | 1.20 → 18px | 550 | `-0.005em` | sans | Buttons md/lg, nav links, form labels |
| `label-sm` | 13px | 1.20 → 15.6px | 550 | `0` | sans | Buttons sm, tabs, segmented items |
| `eyebrow` | 12px | 1.20 → 14.4px | 560 | `+0.06em` | sans, uppercase | Section eyebrows |
| `mono-label` | 12px | 1.25 → 15px | 500 | `+0.08em` | mono, uppercase | Badges, step numbers, meta lines, table heads, versions |
| `mono-data` | 14px | 1.50 → 21px | 400 | `0` | mono | Filenames, paths, model slugs, inline code |
| `mono-code` | 13px | 1.70 → 22.1px | 400 | `0` | mono | Code blocks |

**Two things a reviewer will query.**

*Weight 550 and 560 are not typos.* They are variable-font axis positions. 500 is
limp at 20px on warm paper and 600 is shouty; the half-step is the correct
answer and a variable font is why it is available. On a non-variable fallback
they round to 500 and 600, which is the right degradation.

*Display weight is 400 and that is both the floor and the ceiling.* The
industry trend toward 300–330 display weights sits on dark grounds or in serifs
with very high stroke contrast. On a light warm ground, a 300-weight serif loses
its hairlines at 40px and reads *faded* rather than *editorial*. 400 with the
optical-size axis engaged has enough stroke to look confident.

**Tracking stops at −0.028em, not −0.035em.** The tighter values in circulation
are on grotesques. At −0.035em a serif's terminals begin to collide — the `f`/`t`
and `r`/`y` pairs go first. −0.028em at 60px is the tightest setting at which
Fraunces still has air between its serifs.

**Fluid by explicit breakpoint step, never `clamp()`.** A fixed tracking value
drifts optically under a continuously fluid size, and a clamped headline makes
screenshot review non-reproducible: the same page at 1439px and 1441px produces
different pixels and no reviewer can tell a regression from a resize.

**Numerals.** `font-variant-numeric: tabular-nums` on any table or metric
readout, set once at the base layer rather than per component. Proportional
numerals in a column of sizes make the column look broken.

**Emphasis is weight, colour, or a face switch to mono.** No italic is loaded at
all — not as an economy, but because the emphasis vocabulary is already three
items long and a fourth makes it ambiguous.

---

## 3. The optical-size axis on Fraunces

Fraunces' variable axes and their real ranges. **The default column needs two
numbers**, because the two sources disagree and only one of them is what a
renderer actually uses:

| Axis | Min | Default (registration) | Default (shipped `fvar`) | Max | Shipped? |
|---|---|---|---|---|---|
| `opsz` | 9 | 14 | **9** | 144 | **Yes** |
| `wght` | 100 | 400 | **900** | 900 | **Yes** |
| `ital` | 0 | 0 | 0 | 1 | No |
| `SOFT` | 0 | 0 | 0 | 100 | No |
| `WONK` | 0 | 0 | 0 | 1 | No |

**Which default matters, and when.** The registration values (14 / 400) are what
the distribution's own metadata advertises and what a design tool will show you.
The `fvar` table inside `fraunces-5.3.0-latin.woff2` — read with `fontTools` —
declares `opsz` default **9** and `wght` default **900**. The `wght` difference
is invisible in practice because every step in this system sets a weight
explicitly. The `opsz` one is not: **a platform that ignores
`font-optical-sizing` lands on the caption cut, not the text cut** — the 9 face,
drawn for fine print, stretched across a 60px headline. That is a very different
failure from the one you would predict from a table saying 14, and it is the
failure to look for first when a debugger says "the serif looks wrong and I
cannot say why".

The ranges and the absence of `ital`, `SOFT` and `WONK` are the same in both
sources, so those rows carry one number.

**How it is driven.** One declaration, `font-optical-sizing: auto`, on the
display steps. Per CSS Fonts 4 the user agent then sets `opsz` from the *used
font size*, so a 60px headline gets a face drawn for roughly 60 and a 30px
heading gets one drawn for roughly 30. No JavaScript, no per-step
`font-variation-settings`, and nothing to keep in sync when a step changes size.

> **Note — the kit disagrees with the spec here.** `docs/design-language.md`
> § Typography says the axis "settles at its large end (≈ 144) for display
> sizes". It does not. `auto` tracks the rendered size; 144 is only reached at a
> 144px setting, and the largest step in this system is 60px. The *effect* the
> spec describes is real and the implementation is correct — Fraunces at
> opsz ≈ 60 is visibly a display cut, with reduced x-height relative to caps and
> finer hairlines than either default cut. Only the stated axis value is wrong.
> Nobody should chase 144 by hand: forcing `font-variation-settings: "opsz" 144`
> at 60px produces a face drawn for a size it is not being used at, which is
> exactly the problem the axis exists to solve.

**Getting the build wrong is the common failure.** Fontsource ships Fraunces in
two variable builds. Only the `opsz` build carries the axis; the `wght` build
looks identical in a spec sheet and has no optical sizing at all, so
`font-optical-sizing: auto` becomes a no-op that nobody notices. Import the
`opsz` build, then verify — set a 12px and a 60px sample side by side and look
at the hairlines. If they are the same weight relative to the stems, you have
the wrong file.

**The cost is real and it is accepted.** The `opsz` latin subset is **67,304
bytes** as shipped, against roughly 37 KB for the `wght` build. That 30 KB is
the difference between a serif drawn for 60px and body copy scaled up to 60px,
on the single largest element on the page. It is the right place to spend it and
the wrong place to save it.

**SOFT and WONK are deliberately not shipped.** The wonky variant — the one with
the alternate `g` and the swashy `y` — is a costume. This product is warm, not
whimsical, and the axis is a standing invitation to make it whimsical at 2am.
Removing the temptation costs nothing because the axis is not in the `opsz`
build's default registration anyway.

---

## 4. Where mono is mandatory, and where it is forbidden

The mono is the system's instrumentation signal. Rationing it is the whole
technique: a consumer product that sets its chrome in mono reads as a terminal,
which is right for a research lab and wrong here.

### Mandatory

1. **Anything the machine produced or the machine will read.** Filenames, paths,
   file extensions, artifact names, version strings, model slugs, environment
   variable names, commands.
2. **Numeric and index labels.** Step numbers, table column heads, numeric table
   cells, timecodes, sizes.
3. **Badges and status chips**, and any short factual label — a licence name, a
   platform list.
4. **Code, in blocks and inline.**

### Forbidden

Whole elements, not runs: **headings, eyebrows, subheads, buttons, nav links,
questions and answers, body prose, legal prose.**

### The two rules that resolve the overlap

- Inside body prose, a filename or version takes a `mono-data` run at **0.9em
  relative**, not at its absolute size. At full size the mono's larger apparent
  x-height opens the line box and the paragraph's leading visibly jumps on that
  one line.
- Inside `subhead` and any display step, **no mono run at all.** The face switch
  at display scale fights the serif's metrics and the result looks like a
  rendering error rather than an emphasis.

---

## 5. Self-hosting and licensing

### Licensing

All three families are **SIL Open Font License 1.1**. That permits bundling,
embedding in an installed desktop application, subsetting, and redistribution,
including commercially, with two obligations: keep the copyright and licence
notice with the font files, and do not sell the fonts on their own.

| Family | Licence | Copyright notice to retain | Upstream version |
|---|---|---|---|
| Fraunces | OFL-1.1 | Copyright 2020 The Fraunces Project Authors (github.com/undercasetype/Fraunces) | v38 |
| Figtree | OFL-1.1 | Copyright 2022 The Figtree Project Authors (github.com/erikdkennedy/figtree) | v9 |
| JetBrains Mono | OFL-1.1 | Copyright 2020 The JetBrains Mono Project Authors (github.com/JetBrains/JetBrainsMono) | v24 |

Practically: ship a `LICENSE` or `OFL.txt` next to the font files and reference
the three notices in it. Do not rename the font families in a way that suggests
they are yours — the OFL's Reserved Font Name clause is the one people trip on.
For a desktop app, embedding the woff2 in the bundle is exactly the case the
licence anticipates.

### Self-hosting

The reference site self-hosts version-stamped `woff2` at stable paths rather
than requesting Google Fonts. Three reasons, in order of weight:

1. **No third-party connection on first paint.** For a product whose pitch is
   "your data stays on your computer", a font CDN request on the marketing page
   is an own goal.
2. **Preloading actually works.** A bundler-hashed asset referenced from inside
   a stylesheet is only discovered *after* the CSS parses, which puts the
   headline's font a full round trip behind the stylesheet on a cold load. A
   stable path can be preloaded from the document head.
3. **A year-long immutable cache header is safe** precisely because the version
   is in the filename.

Shipped files and their real sizes:

| File | Bytes | Notes |
|---|---|---|
| `fraunces-5.3.0-latin.woff2` | 67,304 | The `opsz` build. Preloaded — it renders the largest element on the page. |
| `fraunces-5.3.0-latin-ext.woff2` | 59,388 | Fetched only if a latin-ext glyph appears |
| `figtree-5.3.0-latin.woff2` | 20,156 | Preloaded — it renders everything else above the fold |
| `figtree-5.3.0-latin-ext.woff2` | 10,280 | |
| `jetbrains-mono-5.3.0-latin.woff2` | 40,404 | |
| `jetbrains-mono-5.3.0-latin-ext.woff2` | 15,196 | |

> **Note.** `docs/design-language.md` § Assumptions 6 records the Fraunces latin
> `opsz` subset as 36.6 KB. The file that actually ships is **67,304 bytes**
> (65.7 KiB); 36.6 KB is the `wght` build's size. The comment in `src/index.css`
> has the correct figure. This matters for a budget, not for a decision — the
> choice to ship `opsz` was made knowing it was the more expensive build.

Two subsets only, `latin` and `latin-ext`, split by `unicode-range` so
`latin-ext` is never fetched unless a glyph in that range appears. If your copy
is localised beyond latin, add subsets rather than dropping the ranges;
a single unsubsetted variable font is several hundred kilobytes.

`font-display: swap` on all three. The fallback stack is chosen so the swap is
survivable rather than invisible: a serif fallback for the serif, a system sans
for the sans, a system mono for the mono. A stack that falls back across
categories produces a reflow the reader watches happen.

### Reference `@font-face` shape

```css
@font-face {
	font-family: "Fraunces Variable";
	font-style: normal;
	font-display: swap;
	font-weight: 100 900;         /* the axis range, not a single weight */
	src: url("/fonts/fraunces-5.3.0-latin.woff2") format("woff2-variations");
	unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
		U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122,
		U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

The `font-weight: 100 900` range declaration is what tells the browser this is a
variable font and lets any weight in the range be requested from one file. A
single value there silently disables the axis.

**In Electron**, load fonts from a packaged resource path rather than a remote
URL, and remember that the renderer's base URL is not a web origin — a
root-relative `/fonts/…` may not resolve. Resolve font URLs the same way the app
resolves its other bundled assets.

---

*Derived from `docs/design-language.md` § Typography, `src/index.css`, and the
shipped font metadata, 2026-08-03. Sizes measured from the files on disk; the
60px heading's computed size, weight, tracking and line-height verified live in
a browser against the running build.*
