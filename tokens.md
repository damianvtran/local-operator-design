# Tokens

Every token in the system, its value, its computed contrast ratio where it is a
foreground colour, and the reason it exists.

Machine-readable siblings: [`tokens.json`](./tokens.json),
[`tokens.css`](./tokens.css). All three are generated from the same source and
carry byte-identical values. Where this file and `src/index.css` in the
reference site ever disagree, `src/index.css` wins and this file is the bug.

**Method.** Ratios are the WCAG 2.x relative-luminance formula applied to the
sRGB hex, rounded to two decimals. `AA` = ≥ 4.5:1 for normal text, `AA-large` =
≥ 3:1 at ≥ 24px (or ≥ 18.66px bold), `AAA` = ≥ 7:1, `non-text` = ≥ 3:1 under SC
1.4.11. Hex is lowercase throughout, matching the shipped CSS; hex case is not
significant.

*Read after [`README.md`](./README.md), before
[`typography.md`](./typography.md). This is the first file, and everything else
in the kit binds to a name defined here. Machine-readable siblings:
[`tokens.json`](./tokens.json), [`tokens.css`](./tokens.css); the executable
floor check is [`contrast-contract.mjs`](./contrast-contract.mjs).*

---

## 1. Contrast floors this system holds itself to

| Floor | Value | Applies to | Enforcement |
|---|---|---|---|
| Body text | 4.5:1 | Every text token except `ink-disabled`, on every ground the system *permits* it on | [`contrast-contract.mjs`](./contrast-contract.mjs) recomputes every permitted pair and fails on a violation |
| Large text | 3:1 | Not used as a relaxation anywhere — display steps clear 4.5:1 too | The system declines the exemption it is entitled to |
| Non-text boundary | 3:1 | Any 1px rule that is the *sole* boundary of a control or of required content | A separate token, `border-control`, exists purely to guarantee it — and the script asserts it over component triples, not just pairs |
| Disabled text | none | `ink-disabled` only | Exempt under SC 1.4.3 as an inactive control |

**"On every ground the system permits it on" is doing real work in row 1**, and
an earlier draft of this file said "every shipped pair" instead, which was false.
Three foreground × ground combinations that a reader might reasonably assume are
available are **not permitted**, each because it lands just under 4.5:

| Not permitted | Ratio | What to use instead |
|---|---|---|
| `accent` on `sunken` (light) | **4.49:1** | `accent-hover` (**6.46:1**) for a link in a well — the footer, an inset panel, a segmented track — or the ink ramp. The footer of the reference site does exactly this: its links are `ink-muted` → `ink`, and no accent text sits on `sunken` anywhere |
| `success` / `warning` / `danger` on `sunken` (light) | **4.45** / 5.11 / 5.02 | Semantic *text* does not sit in a well. Put the ink ramp on the text and let the semantic colour carry the glyph, the border or the badge. `success` is the one that actually fails; the rule covers all three so it is memorable and so a palette nudge cannot quietly break the other two |
| `ink-dim` on `accent-muted` | **4.24** light / **3.67** dark | `accent-muted` is the solid tinted fill: it takes `ink`, or the accent step named for its theme in § 5. There is no dim ink on it |

Those numbers are the reason a floor claim has to be scoped rather than
universal. 0.01 of shortfall is not a perceptual problem; a false universal is,
because it is the sentence a reader relies on instead of measuring.

**Deliberately at the edge.** Seven permitted pairs sit close enough to a floor
that a future value change must re-measure rather than eyeball. The washes lead
the list on purpose: they are the values most likely to be nudged for aesthetics
and they are the ones with no headroom left to nudge into.

| Pair | Ratio | Floor | Why it is accepted |
|---|---|---|---|
| `success` on `success-wash` (light) | **4.54:1** | 4.5 | **The tightest passing pair in the system** — 0.04 of headroom. A semantic value on its own wash, which is the badge and callout pairing. Neither value moves without re-running the contract |
| `ink-dim` on `accent-wash` / `success-wash` (dark) | **4.57:1** | 4.5 | A meta line inside a callout. 0.07 of headroom |
| `ink-dim` on `sunken` (light) | 4.76:1 | 4.5 | The dimmest ink on the darkest light ground. 0.26 of headroom. Do not darken `sunken` further |
| `ink-dim` on `elevated` (dark) | 4.61:1 | 4.5 | Same shape, dark ramp. `elevated` is the highest dark surface; nothing sits above it |
| `border-control` on `sunken` (light) | 3.38:1 | 3.0 | The structural border's worst light ground. Still clears; a lighter value would not |
| `border-control` on `elevated` (dark) | 3.77:1 | 3.0 | Worst dark ground for the same token |
| `danger-border` on `elevated` (dark) | **3.00:1** | 3.0 | Exactly at the floor, with no headroom at all. See § 6 — it is why a semantic callout does not sit on `elevated` in dark |

This ranking is complete for the pairs the system permits, because the script
enumerates them rather than a human remembering to. Before this file said
"four pairs" and the genuinely tightest one — `success` on `success-wash` — was
not among them.

And three pairs that are **below** a floor and are fine because the floor does
not apply. All three are a static box's border against its *own* fill, which is
not what a reader resolves the box by:

| Pair | Ratio | Why the floor does not bind |
|---|---|---|
| `accent-border` on `accent-muted` (dark) | **2.73:1** | The badge's border against its own fill. A badge is not an interactive component, so SC 1.4.11 does not bind, and what a reader resolves is the badge against the *page* — `accent-border` on canvas, **4.06:1**. Make a badge interactive and this becomes a violation |
| `success-border` on `success-wash` (dark) | **2.88:1** | Same argument, same shape: against canvas it is **3.45:1** |
| `success-border` on `elevated` (dark) | **2.91:1** | Not an exemption so much as a *restriction*: it is the reason § 6 says a semantic callout does not sit on `elevated` in dark |

All three are pinned to those exact ratios inside
[`contrast-contract.mjs`](./contrast-contract.mjs). An exemption there is not a
mute button: change the token and the pinned value stops matching, the script
fails, and the argument above has to be made again on the new number.

**The floors are executable.** `node docs/design-kit/contrast-contract.mjs`
recomputes every permitted pair and every component triple in both themes — 669
assertions — and exits non-zero on a violation. Run it after changing one hex.
That is the mechanism; this table is only its documentation.

---

## 2. Surface ramp

Elevation is a **step up in lightness**, not a shadow. That single decision is
why the system has two shadow tokens instead of a five-rung ladder, and it is
the first thing to port because everything else assumes it.

| Token | Light | Dark | Why it exists |
|---|---|---|---|
| `--color-paper` | `#f7f4ee` | `#16130e` | The page ground. Warm, never `#fff` and never `#000` — a neutral with a yellow-brown tint is what stops the page reading as a lab. |
| `--color-surface` | `#fcfbf7` | `#1e1a14` | One step raised: cards, panels, inputs, the header once it has a ground. |
| `--color-elevated` | `#fffefb` | `#282318` | Two steps raised: popover, drawer, tooltip, hovered row. In light this is the near-white step, and it is *tinted* near-white on purpose. |
| `--color-sunken` | `#efece3` | `#0f0c08` | One step recessed: footer, inset wells, segmented-control track. The only ramp member that goes the other way. |
| `--color-band` | `#eff4ee` | `#191f17` | A green-tinted ground for at most two bands per page. It is how a section changes register without a rule or a shadow. |

Warmth check, portable to any palette: in the light ramp every neutral has
**R > G > B**; in the dark ramp **R ≥ G > B**. A neutral that fails that test is
cool grey and does not belong in this system.

---

## 3. Ink ramp

Four steps, and four is the whole budget. A fifth "slightly dimmer" grey is how
a hierarchy stops being readable as a hierarchy.

**Light ink on light grounds:**

| Token | Hex | on paper | on surface | on sunken | on band | on elevated | Why it exists |
|---|---|---|---|---|---|---|---|
| `--color-ink` | `#211e18` | 15.14 AAA | 16.05 AAA | 14.07 AAA | 14.91 AAA | 16.48 AAA | Headings and body prose. Brown-black, not black: `#000` on warm paper reads as a hole. |
| `--color-ink-muted` | `#565147` | 7.18 AAA | 7.61 AAA | 6.67 AA | 7.07 AAA | 7.82 AAA | Secondary body, subheads, card body. Clears AAA on four of five grounds, so it can carry real prose, not just labels. |
| `--color-ink-dim` | `#6c675c` | 5.13 AA | 5.43 AA | 4.76 AA | 5.05 AA | 5.58 AA | Eyebrows, captions, meta lines, placeholders. The dimmest value still allowed to carry text. |
| `--color-ink-disabled` | `#9a9488` | 2.75 | 2.91 | 2.55 | 2.71 | 2.99 | Disabled control text **only**. Fails AA by design and is exempt under SC 1.4.3. Never use it for de-emphasis. |

**Dark ink on dark grounds:**

| Token | Hex | on paper | on surface | on elevated | on band | on sunken |
|---|---|---|---|---|---|---|
| `--color-ink` | `#f1eee6` | 15.98 AAA | 14.93 AAA | 13.48 AAA | 14.49 AAA | 16.83 AAA |
| `--color-ink-muted` | `#b5afa2` | 8.48 AAA | 7.93 AAA | 7.16 AAA | 7.70 AAA | 8.94 AAA |
| `--color-ink-dim` | `#918b7d` | 5.46 AA | 5.11 AA | 4.61 AA | 4.96 AA | 5.75 AA |
| `--color-ink-disabled` | `#5f5a4e` | 2.70 | 2.52 | 2.28 | 2.45 | 2.84 |

> **Note — the kit disagrees with the spec on two cells.** `docs/design-language.md`
> § Dark ramp records `fg-dim` on canvas as 5.18 and `fg-disabled` on band as
> 2.70. Recomputed from the shipped hexes they are **5.46** and **2.45**. Both
> are arithmetic slips in the table, not value bugs: the direction of every
> judgement the spec makes on them is unchanged, and `ink-dim` on canvas passing
> by *more* than claimed is not a risk. The values above are the recomputed ones.
> Same for `ink-disabled` on band in light: the spec says 2.75, it is **2.71**.
> All three are recorded in [README.md](./README.md) § Where this kit disagrees.

> **Note — the spec names the dark ink ramp differently from the shipped code.**
> `docs/design-language.md` § Dark ramp writes the dark tokens as `--color-canvas`,
> `--color-fg`, `--color-fg-muted`, `--color-fg-dim`, `--color-fg-disabled`.
> Those token names do not exist. The shipped CSS re-points the *light* names —
> `paper` becomes the warm near-black, `ink` becomes the near-white — which is
> what lets components carry no `dark:` colour variants at all. The spec's own
> Appendix A ships the re-pointing form, so this is an inconsistency inside the
> spec rather than a build deviation. **This kit uses the shipped names.** When
> reading the spec's dark tables, substitute: canvas → `paper`, fg → `ink`,
> fg-muted → `ink-muted`, fg-dim → `ink-dim`, fg-disabled → `ink-disabled`.

---

## 4. Lines: two decorative weights and one structural

This is the most portable idea in the palette and the easiest to get wrong.

| Token | Light | vs paper | Dark | vs canvas | Rule |
|---|---|---|---|---|---|
| `--color-hairline` | `#e5e0d5` | 1.20:1 | `#2b2619` | 1.23:1 | **Decorative only.** Section separators, internal card rules, footer column rules. Never the sole boundary of a control or of required content. |
| `--color-hairline-strong` | `#d5cfc2` | 1.41:1 | `#3b3527` | 1.52:1 | Band separators (the section rule, the footer's top edge), hover borders, active card borders, the capture frame's edge, the player stage edge, the dot-field dot. Still decorative — and no longer any control's rest border, see [`components.md` § 2](./components.md#2-button). |
| `--color-border-control` | `#857f70` | 3.63:1 | `#837c6d` | 4.47:1 | **Structural, mandatory.** Input/textarea/select/checkbox/radio borders, and every 1px rule that is the *only* boundary of required content. |

`border-control` on every ground it can legally sit on:

| Ground | Light | Dark |
|---|---|---|
| paper / canvas | 3.63 | 4.47 |
| surface | 3.85 | 4.18 |
| elevated | 3.95 | 3.77 |
| sunken | 3.38 | 4.71 |
| band | 3.58 | 4.06 |

Every cell clears 3:1. That is the entire reason the token exists as a third
value rather than "just use the strong hairline": `hairline-strong` is 1.41:1
and a control drawn in it is, to a low-vision reader, a control with no edge.

**The portable rule, stated without the hexes:** a design system needs two
border weights whose *difference is legal, not aesthetic*. One that may be
invisible because something else (a background step, a fill) is carrying the
boundary, and one that clears 3:1 on every surface in the system because it is
carrying the boundary alone. Name them so that reaching for the wrong one looks
wrong in a diff.

---

## 5. Accent

One brand green, at two light levels. Not two brand colours.

**The problem it solves.** The incumbent app green `#38c96a` measures **2.16:1
on white** and **1.97:1 on this ramp's paper**. It fails 1.4.3 as text on any
light ground and fails 1.4.11 as a sole indicator. It only ever worked as a glow
on a near-black canvas, where it is **8.58:1**. So the light value is the same
hue with the lights turned down — OKLCH lightness 0.74 → 0.52, chroma 0.18 →
0.12, hue nudged ~4° — and the dark value is the incumbent, kept, because
re-solving a value that already clears AAA would dim the one place the brand
currently works.

| Token | Light | Dark | Ratios | Why it exists |
|---|---|---|---|---|
| `--color-accent` | `#177b45` | `#38c96a` | L: 4.84 paper · 5.13 surface · 5.26 elevated · 4.76 band · 4.49 sunken. D: 8.58 canvas · 8.02 surface · 7.24 elevated · 7.79 band · 9.04 sunken | Links, active states, focus ring, selected state, primary fill. |
| `--color-accent-hover` | `#116036` | `#5ad584` | L: 6.96 paper · 7.37 surface. D: 9.96 canvas | Hover for accent text and for the primary fill. |
| `--color-accent-active` | `#0c4b2a` | `#2bb25c` | L: 9.31 paper · 8.83 on wash · 7.69 on muted. D: 6.73 canvas | Pressed fill; and in light, the text colour that sits on `accent-muted`. |
| `--color-accent-border` | `#47795b` | `#4a8160` | L: 4.61 paper · 4.88 surface · 4.37 on wash · 3.81 on muted. D: 4.06 canvas · 3.39 on wash · 2.73 on muted | 1px border on tinted chips, callout left rules, selected card border. |
| `--color-accent-wash` | `#e7f1e8` | `#16281d` | 1.05 vs paper / 1.20 vs canvas. `ink` on it 14.36 AAA (L); `accent` on it 4.59 AA (L), 7.18 AAA (D) | The faintest tint. A ground, never a foreground. |
| `--color-accent-muted` | `#cfe5d4` | `#1d3a28` | 1.21 vs paper / 1.49 vs canvas. `ink` on it 12.51 AAA (L), 10.73 AAA (D); `accent-active` on it 7.69 (L); `accent-hover` on it 6.69 (D) | The solid tinted fill: badges, active segmented item, selected row. |

**Button ink on the accent fill** — the pairing the old green could never make:

| Theme | Fill | Ink | Ratio |
|---|---|---|---|
| Light | `accent` `#177b45` | `#ffffff` | **5.31 AA** |
| Light | `accent-hover` `#116036` | `#ffffff` | **7.64 AAA** |
| Light | `accent-active` `#0c4b2a` | `#ffffff` | **10.22 AAA** |
| Dark | `accent` `#38c96a` | canvas `#16130e` | **8.58 AAA** |
| Dark | `accent-hover` `#5ad584` | canvas `#16130e` | **9.96 AAA** |

White ink on the *dark* accent is 2.16:1 and never ships. This is the single
most common contrast bug in green design systems and it is worth a lint rule.

**Two grounds the accent may not sit on as text**, both from § 1 and both
repeated here because this is the table a reader is looking at when they choose
a link colour:

- **`accent` on `sunken` is 4.49:1** — printed in the `--color-accent` row above,
  and 0.01 short. A link in a well takes `accent-hover` (**6.46:1**), which is
  also the value the ramp already has for exactly this shape of problem.
- **`ink-dim` on `accent-muted` is 4.24 light / 3.67 dark.** The solid tinted
  fill takes `ink` (12.51 / 10.73) or the theme's badge step — `accent-active` in
  light, `accent-hover` in dark. Nothing dimmer. `accent-wash` is the tint that
  *can* carry dim text, at 4.57 in dark, and that is its own edge case in § 1.

**Accent budget.** About three spends per screen: the primary action, the active
state, and one emphasised element. An eyebrow is not worth a spend. A heading
never takes the accent.

### Fixed literals

Three values are committed to as literals rather than being part of either
ramp. They are exposed in [`tokens.css`](./tokens.css) under these names so no
component has to hard-code a hex.

| Name | Light | Dark | Why it is a literal |
|---|---|---|---|
| `--color-on-accent` | `#ffffff` | `#16130e` | The ink on the accent fill. It is the one value that must flip with the ramp *against* the pattern — the accent gets lighter in dark, so its ink gets darker. |
| `--color-focus-ring-photo-inner` | `#fffefb` | `#fffefb` | Inner stroke of the two-tone focus ring over photographic grounds |
| `--color-focus-ring-photo-outer` | `#14110c` | `#14110c` | Outer stroke of the same ring |

The two ring values are **theme-independent on purpose**: the ring's job is to
be legible against an arbitrary image, and the image does not change with the
theme. Full rule in [`components.md` § 1](./components.md#1-the-focus-ring).

---

## 6. Semantic

Three hues, matched in warmth to the neutrals, built identically: a text/icon
value, a 1px border, a wash to sit on.

**Light:**

| Role | Text/icon | vs paper | Border | vs paper | Wash | Text on wash |
|---|---|---|---|---|---|---|
| Success | `--color-success` `#1e7b4e` | 4.78 AA | `--color-success-border` `#3e6b4e` | 5.60 | `--color-success-wash` `#e6f1ea` | 4.54 AA |
| Warning | `--color-warning` `#8a5800` | 5.50 AA | `--color-warning-border` `#7a5a1e` | 5.78 | `--color-warning-wash` `#f5ecd9` | 5.14 AA |
| Danger | `--color-danger` `#b23a31` | 5.40 AA | `--color-danger-border` `#96544c` | 5.21 | `--color-danger-wash` `#f7e7e4` | 4.94 AA |

White ink on the light semantic fills, should one ever be a filled button:
success 5.25 AA, warning 6.04 AA, danger 5.93 AA.

**Dark:**

| Role | Text/icon | vs canvas | Border | vs canvas | Wash | Text on wash |
|---|---|---|---|---|---|---|
| Success | `#57c785` | 8.74 AAA | `#417557` | 3.45 | `#16281d` | 7.31 AAA |
| Warning | `#e0b04b` | 9.25 AAA | `#857036` | 3.85 | `#2a2213` | 7.84 AAA |
| Danger | `#ef8078` | 7.08 AAA | `#9e5a51` | 3.56 | `#2e1b18` | 6.24 AA |

> **Note — the dark semantic borders, precisely.** The spec records the dark
> warning border as 3.27:1 against canvas; recomputed it is **3.85:1**, a slip in
> the safe direction. But an earlier draft of this file then claimed that "all
> three dark semantic borders clear the 3:1 non-text floor", which is true only
> against **canvas, surface, sunken and band**. On `elevated` and on their own
> washes:
>
> | Pair (dark) | Ratio |
> |---|---|
> | `success-border` on `elevated` | **2.91** |
> | `success-border` on `success-wash` | **2.88** |
> | `danger-border` on `elevated` | **3.00** — exactly at the floor |
> | `danger-border` on `danger-wash` | 3.14 |
> | `warning-border` on `elevated` | 3.25 |
> | `warning-border` on `warning-wash` | 3.27 |
>
> Two consequences, and both are rules rather than caveats.
>
> **Against its own wash, the floor does not bind.** A callout's wash fill is
> 1.01–1.19:1 against every ground, so the box is never resolved by its fill: the
> reader resolves the *border against the page*, where `success-border` is 3.45
> on canvas. This is the badge argument from § 1, applied explicitly rather than
> assumed — and it holds only while the callout is not interactive.
>
> **A semantic callout does not sit on `elevated` in dark.** There the border is
> the box's sole boundary against the page and it does not clear 3:1, so alerts
> live in the flow — on `paper`, `surface`, `sunken` or `band`. If a validation
> message must appear inside a popover or a menu, the box takes `border-control`
> (3.77 on dark `elevated`) and the semantic colour moves to the glyph and the
> helper text, where it is carrying meaning rather than a boundary. Raising
> `success-border` would also fix it and would change a shipped token in twelve
> places; the rule is cheaper and it is the one the contract script asserts.

Semantic colour is never decorative. Success means confirmed or ready. Warning
means a real caveat a reader must act on. Danger means validation failure or a
failed operation. A green tick because green is nice is a defect.

**Semantic text does not sit on `sunken`.** `success` on `sunken` in light is
**4.45:1** and the other two clear only by 0.5, which is not enough margin for a
colour whose whole job is to be noticed. In a well — a footer, an inset panel, a
segmented track — the message takes the ink ramp and the semantic colour goes on
the glyph, the border or a badge, where it is a non-text element at a 3:1 floor
rather than prose at 4.5. That also happens to be better design: a status line is
easier to read as ink with a coloured mark than as coloured prose.

---

## 7. The always-dark islands

Two surfaces are dark in **both** themes because they quote the product's own
night: a code block, and the video/demo stage. Defining these once and never
re-pointing them makes that true by construction instead of by discipline.

| Token | Value | on `#14110c` | Role |
|---|---|---|---|
| `--color-island` | `#14110c` | — | The island ground itself |
| `--color-island-fg` | `#e9e5db` | 14.97 AAA | Code text, player labels |
| `--color-island-muted` | `#b5afa2` | 8.62 AAA | Secondary island text; plain syntax role |
| `--color-island-dim` | `#837c6d` | 4.55 AA | Comments, timestamps, idle controls |
| `--color-island-edge` | `#3b3527` | 1.55 | The island's 1px outer edge in both themes |
| `--color-island-keyword` | `#38c96a` | 8.73 AAA | Syntax keyword, progress fill |
| `--color-island-string` | `#57c785` | 8.89 AAA | Syntax string |
| `--color-island-number` | `#e0b04b` | 9.40 AAA | Syntax numeral |

Four syntax roles is the whole highlighter: plain, keyword, string, number, plus
a comment colour. No italics. A twelve-role theme on a marketing page is
decoration pretending to be information.

> **Note.** The spec's Appendix A omits `--color-island-edge`,
> `--color-island-keyword`, `--color-island-string` and `--color-island-number`
> while naming those values inline in prose. The shipped CSS defines all four as
> real tokens, which is better, and this kit follows the shipped CSS.

---

## 8. Type scale

Sixteen steps. Each is four values, and **a step never encodes a face** — pair
it with the family named in the `face` column. That separation is what lets the
whole scale survive a font swap.

Rationale, the optical-size axis, and the mono rules: [`typography.md`](./typography.md).

| Token | Size | Line-height | Weight | Tracking | Face | Use |
|---|---|---|---|---|---|---|
| `--text-display-lg` | `3.75rem` / 60px | 1.04 / 62.4px | 400 | `-0.028em` | display | Hero H1 at ≥ 640px |
| `--text-display-md` | `2.5rem` / 40px | 1.08 / 43.2px | 400 | `-0.024em` | display | Hero H1 below 640px; closing H2 |
| `--text-heading-lg` | `2.5rem` / 40px | 1.10 / 44px | 400 | `-0.024em` | display | Section H2 at ≥ 640px |
| `--text-heading-md` | `1.875rem` / 30px | 1.15 / 34.5px | 400 | `-0.02em` | display | Section H2 below 640px |
| `--text-heading-sm` | `1.25rem` / 20px | 1.35 / 27px | 560 | `-0.01em` | sans | Card titles, accordion triggers, tab labels, column heads. **On an `h1`/`h2`/`h3` this step needs an explicit sans family**, or the base layer's `h1, h2, h3 { font-family: var(--font-display) }` wins and the text silently renders in the display serif |
| `--text-subhead` | `1.1875rem` / 19px | 1.55 / 29.45px | 400 | `-0.005em` | sans | Hero subhead, section deck. Max 46ch |
| `--text-body-lg` | `1.0625rem` / 17px | 1.65 / 28.05px | 400 | `0` | sans | Section body prose. Max 68ch |
| `--text-body` | `1rem` / 16px | 1.65 / 26.4px | 400 | `0` | sans | Default prose, long-form, answers |
| `--text-body-sm` | `0.875rem` / 14px | 1.60 / 22.4px | 400 | `0` | sans | Card body, captions, table cells |
| `--text-body-xs` | `0.8125rem` / 13px | 1.55 / 20.15px | 400 | `0` | sans | Footnotes, fine print |
| `--text-label` | `0.9375rem` / 15px | 1.20 / 18px | 550 | `-0.005em` | sans | Buttons md/lg, nav links, form labels |
| `--text-label-sm` | `0.8125rem` / 13px | 1.20 / 15.6px | 550 | `0` | sans | Buttons sm, tabs, segmented items |
| `--text-eyebrow` | `0.75rem` / 12px | 1.20 / 14.4px | 560 | `+0.06em` | sans, uppercase | Section eyebrows. Always dim, never accent |
| `--text-mono-label` | `0.75rem` / 12px | 1.25 / 15px | 500 | `+0.08em` | mono, uppercase | Badges, step numbers, platform lines, table heads, versions |
| `--text-mono-data` | `0.875rem` / 14px | 1.50 / 21px | 400 | `0` | mono | Filenames, paths, model slugs, inline code |
| `--text-mono-code` | `0.8125rem` / 13px | 1.70 / 22.1px | 400 | `0` | mono | Code blocks |

Weights `550` and `560` are not typos. They are variable-font axis positions,
and they exist because 500 is limp at those sizes and 600 is shouty. On a
non-variable fallback they round to 500 and 600 respectively, which is the
correct degradation.

**Fluid by breakpoint step, never `clamp()`.** Two reasons, both practical: a
fixed tracking value drifts optically under a continuously fluid size, and a
clamped headline makes screenshot review non-reproducible — the same page at
1439px and 1441px produces different pixels and no reviewer can tell a
regression from a resize.

### Reading measures

| Name | Value | Use |
|---|---|---|
| `--measure` | `68ch` | Body prose |
| `--measure-tight` | `62ch` | Dense answer panels |
| `--measure-subhead` | `46ch` | Decks and subheads |

**These three are kit additions, not shipped tokens** — the same status as the
three fixed literals in § 5. The reference site implements all three as static
utility classes, and `getPropertyValue('--measure')` returns empty on the running
build; this kit exposes them as custom properties in
[`tokens.css`](./tokens.css) so a consumer on any stack has one name for the
idea. The *values* are the site's.

Applied to the **text element**, not to a container: `ch` resolves against that
element's own font size, so the measure follows the step automatically. Do not
name this `prose` if your framework ships a `max-w-prose`; two definitions of
the same idea means the wrong one silently wins.

---

## 9. Space

Base unit **4px**. There are two ramps, because one list cannot express both
scales and an earlier draft of this file prohibited values that the section
ladder two paragraphs below requires.

| Ramp | Multipliers | Where it applies |
|---|---|---|
| **Component-internal** | `1 2 3 4 5 6 8 10 12 16 20 24 32 40` | Padding, gaps, insets and offsets *inside* a component, and the gutter ramp. This is the list a lint rule should enforce |
| **Section scale** | `14 18 22 24 28 32 36` | Vertical section padding only — exactly the ladder below, and nothing else. Some of these are not on the component list, deliberately |

Arbitrary values are prohibited on both — not because 13px is ugly, but because
the thirteenth arbitrary value is what makes the rhythm unreadable.

**Why two ramps rather than one longer list.** The section ladder needs 14, 18,
22, 28 and 36 (its 56/72/96/112 and 40/48/64/72 rows, in 4px multiples), and the
shipped build uses all of them. A single permitted list either omits them — in
which case the mandated ladder is unexpressible and anyone who turns the list
into a lint rule immediately has to grant five exceptions — or includes them, in
which case the component ramp gains five steps nothing inside a component should
ever use. Two named ramps is the honest shape: the rule stays lintable and the
ladder stays legal.

**The rhythm is deliberately uneven, and the unevenness is the hierarchy:**

| Tier | Range | Meaning |
|---|---|---|
| Inside a component | 8–16px | These things are one thing |
| Between components in a group | 24–32px | These things are siblings |
| Between sections | 64–128px | This is a different subject |

A uniform 16px everywhere produces a page where nothing groups. The jump between
tiers is doing the work that a border or a heading would otherwise have to do.

### Section rhythm ladder (vertical padding, px)

| Density | base | ≥ 640px | ≥ 1024px | ≥ 1280px | Use |
|---|---|---|---|---|---|
| `hero` | 72 / 48 | 96 / 64 | 128 / 88 | 144 / 96 | Opening and closing bands (top/bottom differ) |
| `default` | 56 | 72 | 96 | 112 | Every ordinary band |
| `tight` | 40 | 48 | 64 | 72 | Fact strips, paired bands |
| `bar` | 16 | 16 | 16 | 16 | Pinned control bars |

### Gutters and containers

Horizontal padding on the container: **20px** base, **24px** at 640, **32px** at
1024, **40px** at 1280+. Chrome (header, footer) must use the *same* ramp — when
it hard-codes its own, the logo and the headline beneath it stop sharing a left
edge at the widest breakpoint, and the result reads as sloppiness that nobody
can name.

| Token | Width | Use |
|---|---|---|
| `--container-measure` | `36rem` / 576px | Long-form legal or documentation body |
| `--container-narrow` | `56rem` / 896px | Question lists, section-header bands |
| `--container-default` | `72rem` / 1152px | Default for every section |
| `--container-wide` | `84rem` / 1344px | Players, wide captures, data tables |

Column grid: 12 columns, gap 16px below 768px and 24px above. Standard spans are
12; 6/6; 4/4/4; 5/7 and 7/5 for text-plus-visual; 8-of-12 offset for editorial
asymmetry. The grid itself is invisible — no vertical column rules.

---

## 10. Radii

| Token | Value | Applies to |
|---|---|---|
| `--radius-xs` | `2px` | Badges, chips, checkbox, inline code, skeletons |
| `--radius-sm` | `6px` | Buttons, inputs, select, segmented items, tabs |
| `--radius-md` | `10px` | **Dominant.** Cards, panels, code block, player, accordion container |
| `--radius-lg` | `14px` | Capture frame, dialog, mobile drawer |
| `--radius-frame` | `16px` | Outer frame of a large capture. The ceiling. |

**Why 10.** A 4px corner on a warm card reads as an engineering drawing; a
16px-everywhere card reads as an untouched component-library default and drifts
toward the bubbled consumer cliché. 10px is warm and still made of straight
lines.

**Why buttons are 6 and not 10.** A 38px-tall control at 10px radius is a
quarter-round lozenge — the corner eats a fifth of the height and the shape stops
reading as a button.

**Round is a three-item allowlist.** `border-radius: 9999px` may appear on the
status dot, the play button, and the toggle knob. Nothing else. A pill button is
the exact consumer-AI cliché this register steers away from, and it arrives one
component at a time.

The one sanctioned way to extend that list is the argument in
[`components.md` § 3](./components.md#3-form-controls): a **radio input** is
round because roundness is the platform's own signal for an exclusive choice, so
shipping one adds a named fourth item with a stated reason. Widening the rule to
"round where it feels right" is how the list stops being a list.

> **Note.** The spec's Appendix A lists `--radius-full: 9999px` as a token. The
> shipped CSS does not define it — verified live: `getPropertyValue('--radius-full')`
> returns empty on the running site. Roundness is expressed by the framework's
> built-in full-round utility instead. If you are porting, define the constant or
> don't, but do not go looking for a token that is not there. The reference
> implementation instead removes the *larger* radius steps (`xl` and above) from
> the namespace so an out-of-scale class compiles to nothing and renders a square
> corner — a deliberate loud failure.

---

## 11. Shadows

There are exactly two, and neither is an elevation ladder.

| Token | Light | Dark | Scope |
|---|---|---|---|
| `--shadow-overlay` | `0 12px 32px -12px rgb(20 17 12 / 0.25)` | `0 12px 32px -12px rgb(0 0 0 / 0.6)` | Drawer, dialog, popover, select menu — things that leave the flow |
| `--shadow-frame` | `0 1px 2px rgb(20 17 12 / 0.06), 0 24px 48px -24px rgb(20 17 12 / 0.28)` | `0 1px 2px rgb(0 0 0 / 0.4), 0 24px 48px -24px rgb(0 0 0 / 0.55)` | The matted capture frame only |

Everything else separates with a hairline or a background step. **A card with a
shadow is a defect.** There is no glow, no coloured spread, no `filter: blur()`,
no hover lift and no hover scale anywhere in the system.

The light shadows are tinted with the island colour (`20 17 12`) rather than
neutral black, because a pure-black shadow on warm paper reads grey-blue and
reintroduces the cool cast the ramp exists to avoid.

---

## 12. Motion tokens

Full patterns, the reduced-motion contract and the anti-patterns:
[`motion.md`](./motion.md).

| Token | Value | Intended use |
|---|---|---|
| `--duration-instant` | `80ms` | Colour-only micro-feedback |
| `--duration-fast` | `120ms` | Hover, focus, border and colour transitions |
| `--duration-base` | `180ms` | Active indicators, tab bars, crossfades |
| `--duration-slow` | `240ms` | Overlays, drawers, height changes |
| `--duration-reveal` | `320ms` | Scroll entrances |
| `--duration-draw` | `480ms` | SVG stroke draw |
| `--duration-beat` | `700ms` | One beat of a multi-step emphasis sequence |
| `--duration-close` | `400ms` | The closing gesture of such a sequence |

| Token | Value | Intended use |
|---|---|---|
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | Default. Every entrance. |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Overlays and drawers — a sharper arrival for something that covers content |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Reversible toggles, where the curve must look the same played backwards |
| `--ease-linear` | `linear` | Spinners and shimmer sweeps only |

No spring, no bounce, no overshoot, no elastic. Anywhere.

---

## 13. Layout tokens

| Token | Value | Why |
|---|---|---|
| `--header-h` | `56px`, `64px` at ≥ 768px | Read by scroll padding and by anything that pins under the header. One variable instead of the same magic number in six files. |

---

## 14. Appendix: the site's component-library compatibility layer

The reference site ships a second set of variable names — `--background`,
`--foreground`, `--primary`, `--muted`, `--border`, `--ring` and so on — because
its component library generates code against those exact names. Each is wired to
a token above, so there is one source of colour truth despite two sets of names.

**This layer does not port.** It exists only to satisfy one specific
component-library contract. It is recorded here so that a reader looking at
`src/index.css` knows why there appear to be two palettes, and so nobody ports
the wrong one.

Two collisions in that layer are worth knowing about as a general lesson: that
library's `--accent` means "subtle hover surface", while this system's accent is
the brand green, so the two meanings had to be kept in separate namespaces; and
its `--muted` is a *surface* while this system's `ink-muted` is a *text colour*.
When you adopt a third-party component library into a design system with its own
vocabulary, budget for exactly this and resolve it in writing before the first
component lands.

---

*Derived from `docs/design-language.md` and `src/index.css`, 2026-08-03.*
