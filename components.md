# Components

Anatomy, variants, sizes and the eight interaction states for every primitive
the system ships.

Each component is described as a **slot table**: the named parts it is made of
and the token each part binds to. Nothing here is expressed as a utility class,
because the target of this kit is not on the same styling stack. If you can bind
a slot to a token, you can rebuild the component.

Token names refer to [`tokens.md`](./tokens.md). Motion values refer to
[`motion.md`](./motion.md).

*Read after [`motion.md`](./motion.md), before [`voice.md`](./voice.md). Leans
on [`tokens.md`](./tokens.md) for every value and on `motion.md` for every
duration; nothing here depends on the handoff.*

---

## 0. The eight states, defined once

Every interactive primitive is specified against the same eight. Where a
component genuinely has no such state, this document says **n/a** and says why,
rather than inventing one.

| State | Definition | System-wide default |
|---|---|---|
| **rest** | Idle, pointer elsewhere | The variant's base binding |
| **hover** | Pointer over, not pressed | A colour and/or border step. **Never** a transform. |
| **active** | Pressed, pointer down | A further colour step. **Never** a scale. |
| **focus-visible** | Keyboard focus | The one focus ring (§ 1). Never `:focus`, only `:focus-visible`. |
| **disabled** | Present, not operable | A colour change, **never** an opacity change; `cursor: not-allowed` retained |
| **loading** | Operation in flight | Label persists, width pinned, `aria-busy="true"` |
| **error** | The operation failed | Surfaced in adjacent text, never in colour alone |
| **selected** | One of a set, currently chosen | Tinted fill plus a colour change, never colour alone |

Two of these are load-bearing decisions rather than descriptions.

**Disabled changes colour, not opacity.** An opacity-faded control fades its
*background* too, so a disabled control on `surface` and the same control on
`sunken` end up two different colours and neither is the one you specified.
Colour tokens are also the only way to keep a disabled state predictable across
themes.

**Disabled keeps `cursor: not-allowed` and does not set `pointer-events: none`.**
`pointer-events: none` removes the cursor feedback, so the control becomes a
thing that looks like a button and reports nothing at all when you point at it.

---

## 1. The focus ring

**One treatment for the whole system, defined once at the base layer, never
per-component:**

```css
:focus-visible {
	outline: 2px solid var(--color-accent);
	outline-offset: 2px;
	border-radius: inherit;
}
```

Four decisions inside four lines:

- **`outline`, not `box-shadow`.** An outline is not clipped by an ancestor's
  `overflow: hidden`. A box-shadow ring is, and the bug appears only for keyboard
  users inside scroll containers — which is to say it appears in production, not
  in review.
- **`:focus-visible`, not `:focus`.** A ring on every mouse click is the reason
  teams remove focus rings entirely.
- **`border-radius: inherit`** so the ring follows the control's own corner
  instead of drawing a rectangle around a 10px card.
- **`outline-offset: 2px`** so the ring never touches the control's own border
  and become ambiguous with it.

Contrast: the ring is `--color-accent`, which is 4.84:1 on paper and 8.58:1 on
canvas. It clears the 3:1 non-text floor on every ground in the system with
margin.

### The two documented exceptions

**The first is a photographic ground.**

A control sitting over an **arbitrary photographic ground** — a video poster, a
screenshot, a user-supplied image — cannot use a single-stroke ring, because the
ground's luminance is unknown and may be anywhere. The play button therefore
uses a **two-tone ring of opposed luminance**:

| Stroke | Value | Purpose |
|---|---|---|
| Inner | `outline: 2px solid #fffefb; outline-offset: 2px` | Clears 3:1 against any dark region |
| Outer | `box-shadow: 0 0 0 4px #14110c` | Clears 3:1 against any light region |

Both values are **theme-independent literals**, deliberately: the ring's job is
to be legible against the *poster*, which does not change with the theme. A
poster cannot be both near-white and near-black in the same place, so at least
one stroke always resolves.

This is the only place in the system where a component defines its own focus
treatment, and the only sanctioned use of `box-shadow` outside the two shadow
tokens. Both facts are worth encoding as a lint exemption with a named reason
rather than a blanket allowance.

**The second is a form control.** An input keeps the ring's colour and width and
moves its offset to **1px**, because a field's own 1px border sits exactly where
the ring would be and at 2px the two strokes read as two borders rather than as
one focused control. Full reasoning, and the rest of the input anatomy, in § 3.

There are exactly two. A third would mean the ring is not a system rule but a
per-component decision, which is the state § 1 exists to prevent.

---

## 2. Button

The one action affordance. Anything that **navigates** is a link and belongs in
§ 5 — a `<button>` that navigates loses middle-click, modifier-click, and the
browser's own status-bar preview of the destination.

### Anatomy

| Slot | Binding | Notes |
|---|---|---|
| Root | `display: inline-flex`, centred both axes, `flex-shrink: 0`, `user-select: none`, `white-space: nowrap` | Never wraps; a two-line button is a sign the label is wrong |
| Corner | `--radius-sm` (6px) on **every** variant | Not the dominant 10px. See [`tokens.md` § 10](./tokens.md#10-radii) |
| Border | 1px solid, `transparent` when the variant has none | Always present so a variant switch never changes the box size |
| Leading / trailing icon | Size per size table; `pointer-events: none`; `flex-shrink: 0` | Icons never receive the pointer, so a click always lands on the button |
| Label | `label` step (`label-sm` at `sm`) | No uppercase, no tracking change |
| Gap | Per size table | |
| Transition | `background-color`, `border-color`, `color` only, at `--duration-fast` with `--ease-out-quart` | Nothing else transitions |

### Sizes

| Size | Height | Padding X | Icon | Gap | Type step | Use |
|---|---|---|---|---|---|---|
| `sm` | 32px | 12px | 14px | 6px | `label-sm` | Dense chrome only |
| `md` | 38px | 16px | 16px | 8px | `label` | Default |
| `lg` | 48px | 24px | 18px | 10px | `label` | Hero and closing calls to action |
| `icon-sm` | 32px square | 0 | 16px | n/a | — | Dense icon-only control |
| `icon` | 38px square | 0 | 20px | n/a | — | Standard icon-only control |

**Target size.** 48px is comfortably past the 44px guidance rather than exactly
at it. 32px is the floor and is for dense chrome only; nothing in the system goes
below 24px, which is WCAG 2.2 SC 2.5.8's minimum.

> **Note.** `docs/design-language.md` § Components → Button gives the icon size
> for both `icon-sm` and `icon` as 16px, but its § Components → Theme toggle
> specifies a 20px glyph in an `icon`-size button. The build resolves the
> contradiction in favour of the toggle: `icon-sm` carries 16px, `icon` carries
> 20px. This kit follows the build. A 16px glyph centred in a 38px box reads as
> a mistake.

### Variants and their states

`text-white` below means the literal `#ffffff`; `on-accent` in the dark ramp is
the canvas colour `#16130e`.

| Variant | rest | hover | active | disabled |
|---|---|---|---|---|
| `primary` | fill `accent`, ink white (L) / `paper` (D), no border | fill `accent-hover` | fill `accent-active` | fill `sunken`, ink `ink-disabled` |
| `secondary` | fill `surface`, ink `ink`, border `border-control` | fill `elevated`, border `ink-muted` | fill `surface`, border `ink-muted` | fill `surface`, ink `ink-disabled`, border `hairline` |
| `outline` | transparent, ink `ink`, border `border-control` | fill `sunken`, border `ink-muted` | fill `sunken`, border `ink-muted` | ink `ink-disabled`, border `hairline` |
| `ghost` | transparent, ink `ink-muted`, no border | fill `sunken`, ink `ink` | fill `sunken` | transparent, ink `ink-disabled` |
| `link` | transparent, no padding, auto height, ink `accent`, 1px underline at 3px offset | ink `accent-hover` | ink `accent-active` | ink `ink-disabled`, underline removed |

Ink contrast on the `primary` fill is tabulated in
[`tokens.md` § 5](./tokens.md#5-accent): 5.31 / 7.64 / 10.22 in light, 8.58 /
9.96 in dark. **White ink never touches the dark ramp's accent** — that pairing
is 2.16:1 and is the most common contrast bug in green systems.

> **Note — the spec's Button table was wrong, and has been corrected.**
> `docs/design-language.md` § Components → Button gave `secondary` a `hairline`
> rest border and `outline` a `hairline-strong` one. Measured, those are
> **1.20:1** and **1.41:1** against paper — and the fill behind them,
> `surface` on `paper`, is **1.06:1**, with `outline` having no fill at all. The
> border was therefore the control's *sole* boundary at a third of the required
> contrast, which is exactly what
> [`tokens.md` § 4](./tokens.md#4-lines-two-decorative-weights-and-one-structural)
> forbids and what the spec's own anti-pattern 17 forbids again. Both rest
> borders are now `border-control` (**3.63:1** light, **4.47:1** dark), and
> `hairline` survives on the **disabled** row only, where the control is
> inoperable and SC 1.4.11 does not bind. This is the system's position rather
> than a kit divergence: the shipped `button.tsx` and the spec's § Button table
> have both been corrected to agree with the § Borders rule they contradicted.
> [`contrast-contract.mjs`](./contrast-contract.mjs) asserts it, for every
> variant on every ground.
>
> **The counter-argument, because it is not open-and-shut.** SC 1.4.11 covers
> the visual information required to *identify* a component, and a
> `secondary` button's label is 16.05:1 — a reader can identify the control by
> its text without resolving its edge at all. Read narrowly, the old table may
> not have violated 1.4.11. The decisive objection is internal rather than
> regulatory: the system's own structural-hairline rule says any 1px rule that
> is the *sole* boundary of a control takes `border-control`, and on these two
> variants the border was exactly that. **The system was failing its own rule
> before it was failing anyone's standard**, and that is the version of the
> criticism to carry into a port, because it survives whichever way a reader
> construes the success criterion.

> **Note — the hover *fill* is not the hover.** The `ghost` and `outline` hover
> fill is `sunken` in both themes with no dark override, while the spec calls for
> `sunken` in light and `elevated` in dark. What is worth knowing is that **the
> choice is free**, because neither option is perceptible: `sunken` against
> `paper` is **1.08:1** in light and **1.05:1** in dark, and the spec's dark
> alternative is **1.19:1** — all three at or below the point where a flat fill
> change registers as a change at all. The hover is carried by the **border
> step** (`border-control` → `ink-muted`: 3.63 → 7.18 light, 4.47 → 8.48 dark)
> and, on `ghost`, by the **ink step** (`ink-muted` → `ink`: 7.18 → 15.14
> light). Spend the argument there. If a port prefers "hover raises" in dark for
> convention's sake, take it — it costs nothing and communicates nothing either
> way.

### The remaining four states

| State | Contract |
|---|---|
| **focus-visible** | The system ring (§ 1). The Button defines nothing of its own. |
| **loading** | Label stays visible, width pinned to the resting width, a 14px spinner rotates at 800ms linear, `aria-busy="true"` on the root. Under reduced motion the spinner is replaced by a static `…` in `mono-label` plus a polite live region. A button that swaps its label for a spinner changes width and moves everything after it. |
| **error** | **Not a button state.** The failure is surfaced in an adjacent alert (§ 9) and the button returns to rest, because the reader needs to know *what* failed, and a red button cannot say that. |
| **selected** | Not a button state either — a button that stays chosen is a segmented item or a tab. See § 10. |

### Hierarchy rules

- **At most one `primary` per band.** If two things are both the most important
  action, neither is.
- Where a free path and a paid path sit side by side, the free path is `primary`
  and the paid path is `outline`, so the visual hierarchy itself carries the
  recommendation.
- **No transform on hover, no scale on press, ever.** The press feedback is the
  colour step alone. A `translateY(-2px)` hover is the single clearest
  2021-template tell there is.

---

## 3. Form controls

Five components: text input, textarea, select, checkbox, radio.
[`tokens.md` § 4](./tokens.md#4-lines-two-decorative-weights-and-one-structural)
calls `border-control` **mandatory** on all five, which is a rule about
components nothing else in this kit describes — and if the target is an
application rather than a page, this is the section to read straight after
Button, because an application is mostly a form.

### Anatomy — text input

| Slot | Binding | Notes |
|---|---|---|
| Root | Fill `surface`, 1px `border-control`, `--radius-sm` (6px) | The border is the control's *only* boundary — `surface` on `paper` is 1.06:1 — so it is structural by definition, and a hairline here is a defect |
| Height | **38px**; **48px** at size `lg` | The same two numbers as Button `md` and `lg`, so a field and its submit button align in a row with no per-case nudge |
| Padding inline | 12px | |
| Value | `body` step, ink `ink` | Never `body-sm`: text the reader types is not a caption |
| Placeholder | `ink-dim` | The dimmest ink still allowed to carry text. A placeholder never substitutes for the label — it disappears exactly when the reader needs it |
| Label | `label` step, `ink-muted`, **6px** above the field | A real `<label for>`, always |
| Helper | `body-xs`, `ink-dim`, below the field | Reserve its line if a message can appear later, or the layout jumps on the first validation error |
| Transition | `border-color` only, at `--duration-fast` / `--ease-out-quart` | |

`textarea` is the same control with `min-height: 96px` and vertical resize only;
the label and helper geometry are unchanged. `select` is the same box plus a
16px chevron in `ink-dim` 12px from the trailing edge, with its menu specified
in § 13.

### The eight states

| State | Contract |
|---|---|
| **rest** | The anatomy above |
| **hover** | Border `border-control` → `ink-muted`: **3.63 → 7.18** in light, **4.47 → 8.48** in dark. The fill does not change |
| **active** | **n/a.** A text field has no pressed state; the caret arriving is the feedback |
| **focus-visible** | The system ring at **`outline-offset: 1px`**, not 2px — the second and last exception to § 1, explained below |
| **disabled** | Fill `sunken`, border `hairline`, ink `ink-disabled`. Inoperable, so SC 1.4.11 does not bind, and this is the one place in the system where a control legitimately wears the decorative hairline |
| **loading** | The field stays operable; `aria-busy="true"` on its wrapper and the reason on the helper line. A field that goes inert while something checks it loses whatever the reader was typing |
| **error** | Border `danger`, helper text `danger`, a 14px alert glyph before the helper, and `aria-invalid="true"`. Four cues, because colour alone is banned in § 0 and because the helper text is the only one that says *what* is wrong |
| **selected** | n/a for a text field. For `select`, the chosen option carries `accent` ink plus a 14px check glyph |

### Inputs are the second exception to the one-ring rule

§ 1 says the ring is one treatment, defined once. Inputs keep its colour, its
2px width and its `border-radius: inherit`, and change **only the offset, to
1px**. The reason is geometric rather than decorative: a text field is a wide,
short box whose own 1px border is the thing the reader is already looking at,
and a 2px gap between that border and the ring resolves as *two borders* rather
than as one focused control. At 1px the two strokes read as a single emphasised
edge.

That is the entire exception, and it is worth encoding as a named lint exemption
for the same reason the photographic ring is: an unnamed exception becomes a
licence to invent a third.

### Checkbox and radio

| Slot | Checkbox | Radio |
|---|---|---|
| Box | 16px square, `--radius-xs` (2px), 1px `border-control`, fill `surface` | 16px circle, 1px `border-control`, fill `surface` |
| Checked | Fill `accent`, border `accent`, 12px check glyph in `on-accent` | Border `accent`, 8px centred dot in `accent` |
| Indeterminate | Fill `accent`, 10px bar in `on-accent` | n/a — an exclusive choice has no partial state |
| Hit target | 24px minimum, taken as padding on the label; the box itself stays 16px | Same |
| Label | `body`, ink `ink`, 8px to the trailing side, and part of the hit target | Same |
| Disabled | Fill `sunken`, border `hairline`, glyph `ink-disabled` | Same |

**The radio is a fourth round thing, and the allowlist has to say so.**
[`tokens.md` § 10](./tokens.md#10-radii) permits `border-radius: 9999px` on
exactly three elements. A radio is round because roundness is the platform's own
long-standing signal for an *exclusive* choice, against a checkbox's
*independent* one, and overriding that to satisfy a house rule costs real
comprehension for no gain. The reference site ships no radio, so this is a **kit
addition**: if you ship one, add it to the allowlist as a named fourth item with
this reason, rather than quietly widening the rule to "round where it feels
right".

---

## 4. Badge

A small factual label: a version, a source, a status, a licence name. Mono and
uppercase because this is where the system spends its instrumentation signal.

### Anatomy

| Slot | Binding |
|---|---|
| Root | `inline-flex`, centred, `flex-shrink: 0`, `white-space: nowrap` |
| Height | 22px, fixed |
| Padding X | 8px |
| Gap | 6px (for an optional 12px leading dot or glyph) |
| Corner | `--radius-xs` (2px) |
| Border | 1px solid, per variant |
| Type | `mono-label` + mono family + `text-transform: uppercase` |

### Variants

| Variant | Fill | Ink | Border |
|---|---|---|---|
| `neutral` | `surface` | `ink-dim` | `hairline` |
| `accent` | `accent-muted` | `accent-active` (L, 7.69:1) / `accent-hover` (D, 6.69:1) | `accent-border` |
| `success` | `success-wash` | `success` | `success-border` |
| `warning` | `warning-wash` | `warning` | `warning-border` |
| `danger` | `danger-wash` | `danger` | `danger-border` |

The `accent` variant is the one place in the system where a token binding
differs by theme rather than the token's value doing the work: no single step of
the accent ramp clears AA on `accent-muted` in *both* themes, so light takes the
darkest step and dark takes the lightest. Note it, because it is the kind of
detail a port silently flattens.

### States

**A badge is never interactive.** rest is the only state it has; hover, active,
focus-visible, disabled, loading and selected are all **n/a**. If it needs a
click it is a Button, and if it needs to be dismissed it is a chip, which this
system does not have. Adding interactivity also breaks the contrast argument in
[`tokens.md` § 1](./tokens.md#1-contrast-floors-this-system-holds-itself-to):
`accent-border` on `accent-muted` in dark is 2.73:1, which is fine for a static
label and a violation for a control.

`error` is n/a as a state, but the `danger` variant is how a badge *reports* an
error condition.

**Radius is 2px, not full.** Pill badges are banned system-wide.

---

## 5. Link button and text link

Three components because the element genuinely differs, and choosing wrong costs
a full page reload or a broken target.

| Component | Element | When |
|---|---|---|
| `InternalLinkButton` | The router's link component | Navigates within the app; button chrome |
| `ExternalLinkButton` | `<a target="_blank" rel="noopener noreferrer">` | Leaves the app; button chrome |
| `ExternalLink` | `<a>` inline | Leaves the app; inline in prose |

The first two reuse the Button's variant and size recipes exactly — same slots,
same states, same tokens. They exist so the chrome can be worn by an anchor
*directly*, rather than by nesting a button inside a link, which produces two
interactive elements where the reader sees one.

`rel="noopener noreferrer"` is not boilerplate. `noopener` is the security one
and is implied by `target="_blank"` in current browsers, but stays explicit
because the implication is not true of older ones. `noreferrer` is a deliberate
privacy choice: the destination does not need to be told where the reader came
from.

### `ExternalLink` anatomy

| Slot | Binding |
|---|---|
| Root | `inline-flex`, `align-items: baseline`, gap 4px |
| Ink | `accent`, hover `accent-hover` |
| Underline | 1px, offset 3px |
| Transition | `color` at `--duration-fast` / `--ease-out-quart` |
| Trailing glyph | 14px up-right arrow, vertically centred, `aria-hidden` |
| Screen-reader suffix | Visually hidden `" (opens in a new tab)"` |

**The glyph and the hidden suffix are not decoration and not redundant.** A link
that opens a new tab changes the browsing context without warning, which is WCAG
3.2.5. The icon warns a sighted reader; the hidden text warns everyone else.
Shipping only one of them covers half the audience.

### States

| State | Contract |
|---|---|
| rest / hover / active | As the Button `link` variant, or the anatomy above for inline |
| focus-visible | The system ring |
| disabled | **n/a.** A disabled link is not a link — remove the href and render text, or keep the link. |
| loading | n/a |
| error | n/a — a broken destination is a routing problem, not a visual state |
| selected | For a nav link representing the current route: ink steps `ink-muted` → `ink`, plus a 1px `accent` underline at 6px offset, plus `aria-current="page"`. Colour alone is never the indicator. |

---

## 6. Theme toggle

One icon button, no travelling knob.

### Anatomy

| Slot | Binding |
|---|---|
| Root | Button, variant `ghost`, size `icon` (38px square) |
| Glyph | 20px moon in the light theme, sun in the dark theme, stroke width 1.75, `aria-hidden` |
| Accessible name | **State-specific**: "Switch to dark theme" / "Switch to light theme" |
| Transition on theme change | `color`, `background-color`, `border-color` at 180ms. No full-page fade, no icon rotation. |

**The accessible name is the whole accessibility story here.** A static "Toggle
theme" leaves a screen-reader user unable to know what pressing it will do,
which is WCAG 4.1.2. The name must say the destination state, and it must change
when the state does.

**Why a button and not a switch.** A knobbed switch is wider than the nav can
spare, and a three-way control (system / light / dark) costs more attention than
a preference this small returns. One button that flips to the opposite of what
is currently shown is the honest reduction. If a settings surface has room, a
segmented three-way control there is the right place for the full choice.

**Server-rendering and first paint.** The visual theme must be applied to the
root element *before first paint*, by a mechanism the UI framework does not
render — otherwise a dark-mode reader gets a full-page flash of the light theme
on every navigation. The consequence is that the toggle's own *label* may be
one frame behind on hydration, which is one attribute on one button and cannot
mismatch visually.

### States

| State | Contract |
|---|---|
| rest / hover / active / focus-visible | As Button `ghost` + the system ring |
| disabled | n/a — the toggle is always operable |
| loading | n/a — the switch is synchronous |
| error | n/a; if persistence fails (private-mode storage), the theme still applies for the session and nothing is reported |
| selected | n/a — the *current* theme is conveyed by which glyph is shown and by the accessible name |

---

## 7. Capture frame

The motif that makes a screenshot of a dark application sit correctly on a warm
light page. This is the most transferable idea in the whole kit for anyone
embedding product imagery.

**The problem, stated plainly:** a near-black rectangle dropped onto a light
ground reads as a hole punched in the page. It is the single most common way a
light marketing surface with a dark product looks unfinished, and no amount of
border radius fixes it.

**The fix is to mount it rather than paste it.** Three layers — the capture, a
mat ring around it, and a 1px frame around the mat — read as a *framed
photograph*, which is a thing a page is allowed to contain. The capture's own
dark edge never touches the page.

### Anatomy

| Slot | Binding | Notes |
|---|---|---|
| Figure root | Vertical stack, gap 12px | |
| Frame | 1px `hairline-strong`, `--radius-lg` (14px), `--shadow-frame` | The one sanctioned use of `shadow-frame` |
| Mat | Three branches, below | The only theme-dependent geometry in the system |
| Image | `--radius-md` (10px), full width, block | |
| Per-theme source | Optional second image for the dark theme | See the caveat below: whichever mechanism selects the image must be the same one that selects the mat |
| Caption | `mono-label`, uppercase, `ink-dim`, below the frame, aligned to the frame's start edge | |

**The mat answers two questions, and they take different signals.** This is the
most transferable detail in the whole motif and the easiest one to collapse by
mistake:

> **Colour is the capture's question and must track the capture. Thickness is the
> page's question and must track the page.** A capture may mismatch the *page* —
> that is what the motif is for. It may never mismatch its own *mat*.

Those two mismatches are different things, and conflating them is how a frame
ends up serving one image and mounting it on the other image's mat.

For a **single, fixed capture** both questions have the same answer, because the
file does not change with the theme:

| `capture` | Light page | Dark page |
|---|---|---|
| `dark` | Fill `sunken`, inset **14px** | Fill `elevated`, inset **8px** |
| `light` | Fill `surface`, inset **14px** | Fill `surface`, inset **8px** |

For a **theme-paired capture** — a light file and a dark file of the same screen —
they do not, because the browser chooses the file from the OS preference while
the page's theme is whatever the reader pinned. So the two halves are keyed
separately: thickness to the theme, colour to the same signal that picked the
image.

| Page theme | Served file | Mat fill | Inset |
|---|---|---|---|
| light | light | `surface` | 14px |
| light | **dark** | `sunken` — the mounting board | 14px |
| dark | light | `surface` (the dark ramp's) | 8px |
| dark | dark | `elevated` — the lip | 8px |

`capture` is not consulted at all in that case: a pair answers the colour
question by construction, light file light and dark file dark.

**Why one signal for the whole mat is the wrong fix**, which is worth stating
because it is the plausible answer: putting thickness on the OS preference too
would give the light-file-on-a-dark-page cell 14px of mediating mat, when what
that cell needs is the 8px lip. Collapsing the two questions fixes one cell of
the matrix by breaking another. Row two above is the cell that proves the split
was necessary — with it, all four combinations are internally consistent and the
only thing that varies is the frame's relationship to the page, which is exactly
what the motif is documented to handle.

One measured failure mode worth naming in a review, because it is the one that
does not look like a bug: a **light capture with no dark source, on a dark page**
puts mat, capture and page within about 2.7 luminance units of each other
(mat/canvas 1.07, capture/mat 1.09). That is not a wrong mat — it is **the frame
ceasing to exist**, and it is indistinguishable from having shipped no motif at
all. A light-only capture needs a dark counterpart or a different treatment.

**The class of bug this is an instance of**, which is the part worth carrying
past this component: *two independent signals that usually agree.* OS preference
and pinned theme agree for almost every reader almost all of the time, and that
is exactly why nobody exercises the disagreement and why it survives review. The
same shape turns up as class against media query, locale against layout
direction, and — in an application with user-selectable themes — every theme
crossed with the OS preference. Wherever two inputs drive one decision, the cells
where they disagree are where the bug lives.

And the same discipline applies to the **fix**: a proposed remedy deserves the
full matrix, not just the cell that was reported. Both plausible single-signal
fixes for the mat repair the observed cell and break a different one — keying
everything to the OS puts 14px of mediating board on a dark canvas, keying
everything to the class puts the 8px near-black lip around a dark capture on
light paper, merging lip and capture into one black rectangle behind a hairline.
Both were reasoned from three observed cells and a plausible story about the
fourth. Enumerate the fourth.

A pair of sources also needs their aspect ratios reconciled — two captures of
the same screen are rarely the same pixel height — with a fixed ratio and
`object-fit: cover` on the image, rather than letting the frame change height
with the theme.

**The mat is the system's only theme-dependent geometry.** In a dark theme the
problem inverts: a dark capture on a dark page needs *separation*, not
mediation. So the 14px mounting board becomes an 8px lip. Every other theme
difference in the system is a colour swap; this one is not, and that is why it
has to be stated explicitly rather than left to a token.

**Judge `capture` by the content, not the filename.** The reference repo has
shipped a `*-light.png` containing a dark capture, and its spec called a
screenshot named `capability-files` a light capture when the file measures 95%
near-black — both directions of the same mistake, both producing the wrong mat,
which is exactly the defect this motif exists to prevent. Open the image. If you
want a number rather than an eye: downsample to 16px wide and take the mean
relative luminance — above ~140 is a light capture, below ~80 is a dark one, and
anything between needs a human. (Both instances above are now corrected in the
reference repo and its spec; the technique is the part that ports.)

**Loading.** An above-the-fold capture must be eagerly fetched at high priority
with synchronous decoding. A lazily-loaded largest-contentful-paint image is a
well-known way to lose a second for nothing. Everything else is lazy and async.

**Intrinsic dimensions are required**, not optional: without them the frame has
no height until the image arrives and the whole page below it jumps.

### States

| State | Contract |
|---|---|
| rest | The anatomy above |
| hover | Optional: frame border may step `hairline-strong` → `border-control`. **No lift, no scale, no shadow change.** |
| active / focus-visible | n/a unless the frame is wrapped in a link, in which case the wrapper takes the system ring |
| disabled / loading / error | n/a. A missing image is an `alt` text problem, not a component state. |
| selected | n/a |

**Rules that survive the port:** no capture ever sits directly on the page
ground; no capture bleeds to a section edge; no capture appears without its
caption. A bare image of a product screenshot is a defect.

---

## 8. Logo mark

### Anatomy

| Property | Value |
|---|---|
| Form | Inline SVG, `viewBox="285 253 520 520"` |
| Default size | 24px square |
| Colour | `currentColor`, inheriting `ink` — one mark for both themes |
| Fill | none; `stroke: currentColor`, round caps and joins |
| Geometry | Three circles — `(490,355) r78 stroke35`, `(720,326) r42 stroke29`, `(368,686) r41 stroke29` — plus three stroke-33 paths: left limb and shoulders, torso, raised arm |
| Accessibility | `aria-hidden="true"`, `focusable="false"` by default |
| Sizes in use | 20px (footer), 24px (header), 28px (drawer) |

**Why vector rather than a light/dark PNG pair.** The mark is monochrome, so as
an SVG it inherits `currentColor` and needs no second asset, no `filter: invert`
trick, and no kilobytes for a 24px glyph. It is also the only form that stays
crisp at 20px.

**Why the viewBox is cropped.** The source artwork occupies about 45% of its
canvas. Rendering it uncropped would make every call site pass a size twice as
large as the visible mark and then fight the whitespace.

**Why it is `aria-hidden`.** In every current placement the mark is paired with
either a wordmark or a link that already carries an accessible name. A `<title>`
here would be announced twice. If you place it somewhere it is the *only*
content of a control, that placement must supply the name — on the control, not
on the SVG.

### States

All eight are **n/a**: the mark is decorative content, never a control. When it
is inside a link, the *link* carries the states.

---

## 9. Inline alert

Not in the six named primitives, but it is the system's answer to the `error`
state and therefore belongs here.

| Slot | Binding (error) | Binding (notice) |
|---|---|---|
| Box | Fill `danger-wash`, 1px `danger-border` | Fill `surface`, 1px `hairline-strong` |
| Glyph | Alert circle, `danger`, `aria-hidden` | Info, `ink-dim`, `aria-hidden` |
| Message | Body step, carries **all** the meaning | |
| Liveness | Assertive for an error that just happened | None for a notice present on first paint |

Two rules worth carrying over. **The icon is `aria-hidden` and carries no
meaning of its own** — an alert whose meaning is in a glyph is an alert half the
audience cannot read. And **an alert box with no message renders nothing**,
because an empty alert is worse than no alert.

The liveness default matters: a box that is in the served markup on first paint
must *not* be announced as an alert, because an alert role there announces a
condition that did not just happen.

---

## 10. Selection patterns

The system's `selected` state lives in three places, and all three follow the
same shape: **a tinted fill plus a colour change plus a non-colour cue.**

| Pattern | Selected treatment | Non-colour cue |
|---|---|---|
| Tabs (underline style) | Ink `ink-dim` → `ink`, plus a 2px `accent` bar over the list's bottom border | The bar's position |
| Segmented control | Fill `surface` (L) / `accent-muted` (D), ink steps to `accent-active` / `accent-hover` | The raised fill |
| Selected card or row | Border `accent-border`, fill `accent-wash` | The border weight change |

Colour is never the only indicator of selection, and the accessible state
(`aria-selected`, `aria-current`, `aria-pressed` as appropriate) is always set —
that is the third cue, and it is the one that works for the readers the first
two miss.

---

## 11. Tables and data density

An application is largely lists of things: files, jobs, agents, versions,
permissions. The reference site ships exactly one table, and the register it
establishes is worth more than one table, because row height and numeric
alignment are most of what makes a data surface look designed or not.

| Slot | Binding |
|---|---|
| Container | 1px `hairline`, `--radius-md` (10px), `overflow: hidden` |
| Header row | Height **40px**, fill `sunken` (light) / `surface` (dark), cells `mono-label` + uppercase + `ink-dim` |
| Body row | Height **52px**, 1px `border-control` bottom rule; the last row has none |
| Row hover | Fill `sunken` (light) / `elevated` (dark) at `--duration-fast`. **No zebra striping** |
| Text cell | `body-sm`, ink `ink` |
| Data cell | `mono-data` — filenames, paths, sizes, versions, hashes |
| Numeric cell | Right-aligned, `font-variant-numeric: tabular-nums`, the unit in `ink-dim` |
| Inapplicable cell | The literal `n/a` in `mono-label`, `ink-dim` |

Four of those are the ones nobody re-derives from first principles:

- **The row rule is `border-control` while the container's own border is
  `hairline`.** That looks like an inconsistency and is the opposite of one: a
  row rule is the *only* boundary between two rows of required content, so SC
  1.4.11 binds it at 3:1, while the container's border encloses content that is
  fully legible without it and may therefore be decorative. This is the
  cleanest worked example of
  [`tokens.md` § 4](./tokens.md#4-lines-two-decorative-weights-and-one-structural)
  anywhere in the system, and the shipped table gets it right.
- **No zebra.** Striping is a workaround for rows too short to track across. At
  52px with a rule between them, a stripe adds a second grouping signal that
  disagrees with the first, and in a warm palette it costs a tint that then
  fights the hover step.
- **Tabular numerals, right-aligned, unit dim.** `221 MB` and `1.4 GB` only
  compare at a glance when the digits sit in a column and the unit is visibly
  not part of the number. Proportional numerals in a size column are the single
  most common reason a table looks amateur, and the fix is one CSS property.
- **`n/a` is a literal — never a dash, never empty.** An empty cell is
  indistinguishable from a rendering failure, and a screen reader announces
  nothing at all for it, so the reader cannot tell "does not apply" from "we
  lost your data". Two characters, in the dim mono step so the column still
  scans as a column.

Below the `md` breakpoint a table collapses to two-line entries **inside the
same container** — name and primary value on line one, secondary attributes on
line two — rather than scrolling horizontally. A horizontally-scrolling table on
a phone hides whichever column the reader came for.

---

## 12. Empty, loading and skeleton states

These appear on nearly every screen of an application and on almost none of a
marketing page, which is exactly why a system derived from a marketing page
arrives without them. [`voice.md` § 3](./voice.md#3-patterns) has the words;
this is the geometry.

### Skeleton

| Slot | Binding |
|---|---|
| Block fill | `sunken` |
| Corner | `--radius-xs` (2px), including for a block standing in for a 10px card |
| Block height | The **line-height of the step it replaces** — 26px for a `body` line, 27px for `heading-sm`, 22px for `body-sm` — never an arbitrary bar height |
| Text block width | Vary the last line of a paragraph block to 40–70%. Identical widths read as a table, not as prose |
| Animation | One shimmer sweep at `--ease-linear`, and nothing else. Never a pulse and a shimmer together |
| Reduced motion | Static at 0.8 opacity — [`motion.md` § 4](./motion.md#4-the-prefers-reduced-motion-contract) |
| Accessibility | `aria-busy="true"` on the region; the blocks themselves `aria-hidden` |

**Snapping block heights to the line-height they replace** is the whole
technique. A skeleton whose blocks are a different height from the content that
arrives makes the page jump on load, which is a worse experience than the
spinner it replaced. Measure the step; do not pick a height that looks about
right.

**A skeleton is for content arriving in under about a second.** Past that, the
honest control is a labelled progress indication: a shimmer that runs for eight
seconds reads as a broken page, and the reader starts clicking things.

### Empty state

| Slot | Binding |
|---|---|
| Ground | `surface`, inside whatever container the populated state uses — the frame does not disappear with the content |
| Alignment | **Left**, not centred |
| Illustration | **None.** No icon, no spot graphic, no tinted tile |
| Heading | `heading-sm`, `ink` |
| Body | Exactly one line, `body-sm`, `ink-muted` |
| Action | One `primary` button: the one thing to do next |
| Spacing | 8px heading → body, 16px body → action, 24px inside the container |

**Left-aligned and icon-free, both deliberately.** A centred empty state with a
grey illustration is the most recognisable template tell in application design,
and it puts the reader's eye off the axis that every populated row in that
container will sit on — so the surface visibly re-flows when the first item
arrives. And an empty state is a *sentence*, not a picture: the one line has to
say what goes here and how to put something here. If the words are doing that,
an icon adds nothing; if they are not, an icon does not rescue them.

One distinction worth keeping, because the two get built as one component and
should not be: **empty because nothing exists yet** gets the create action;
**empty because a filter matched nothing** gets a way to clear the filter and
never the create action, because making a new thing is not what the reader
asked for. Same slots, different sentence.

---

## 13. Overlays and focus management

Five overlays and one behaviour contract. The behaviour block is the more
valuable half: a dialog with the wrong fill looks wrong, while a dialog that
does not return focus is unusable by a keyboard reader — who cannot see that it
closed, only that nothing responds any more.

| Overlay | Ground | Border | Corner | Shadow | Geometry |
|---|---|---|---|---|---|
| Dialog | `elevated` | 1px `hairline` | `--radius-lg` (14px) | `--shadow-overlay` | Max width 480px for a message, 640px for a form; 24px padding. Scrim `rgb(20 17 12 / 0.4)` light, `rgb(0 0 0 / 0.6)` dark, **no blur** |
| Drawer | `paper` | 1px `hairline` on the entering edge | `--radius-lg` on the entering corners only | `--shadow-overlay` | `min(88vw, 380px)`; rows 52px, hairline-separated; the primary action pinned above a hairline with `padding-bottom: max(20px, env(safe-area-inset-bottom))` |
| Popover | `elevated` | 1px `hairline` | `--radius-md` (10px) | `--shadow-overlay` | 8px offset from its trigger, 16px padding, no arrow |
| Menu / select | `elevated` | 1px `hairline` | `--radius-md` | `--shadow-overlay` | Items **32px**, padding 0 12px, `body-sm`; hovered item fill `accent-wash` (light) / `elevated` (dark); selected item ink `accent` plus a 14px check glyph |
| Tooltip | `elevated` | 1px `hairline` | `--radius-sm` (6px) | none | `body-xs`, 6px offset, one line of at most about 40 characters. **Never the only place a piece of information appears** |

Motion: dialog and drawer enter at `--duration-slow` with `--ease-out-expo`;
popover, menu and tooltip at `--duration-fast`, opacity only; the scrim fades at
`--duration-base`. Under reduced motion all five appear instantly and the scrim
does not fade — [`motion.md` § 4](./motion.md#4-the-prefers-reduced-motion-contract).

The tooltip takes no shadow on purpose. It is small, it is already `elevated`
over a lower ground, and a drop shadow under a 24px-tall box reads as grime
rather than as height.

### Overlay behaviour — five rules, none of them optional

1. **Focus moves in.** On open, focus goes to the first interactive element, or
   to the panel itself when there is none. Not to the close button: that offers
   the reader the exit before the content.
2. **Focus is trapped** while a *modal* overlay is open — dialog and drawer.
   `Tab` from the last stop returns to the first. A popover or a menu does not
   trap; it closes when focus leaves it.
3. **Focus returns on close**, to the element that opened it, every time. This
   is the most commonly omitted accessibility behaviour in application UI, and
   it is invisible to anyone testing with a mouse: focus falls back to `<body>`
   and the keyboard reader is silently returned to the top of the page.
4. **`Escape` closes**, innermost first. A select inside a dialog takes the
   first `Escape`; the dialog takes the second.
5. **Scroll is locked** behind a modal overlay, and the lock compensates for the
   scrollbar's width so the page does not shift sideways as it engages.

### One layer order, five rungs

Named constants in one file, and nothing else in the codebase sets a `z-index`:

| Rung | Value | What lives there |
|---|---|---|
| base | `0` | Page content. A section's background motif sits at `-1` *inside that section's own stacking context* — § 14 |
| sticky | `50` | The header |
| modal | `100` | Dialog and drawer: scrim and panel |
| popover | `200` | Popover, menu, select |
| tooltip | `300` | Tooltip |

The order is forced by composition rather than by preference: a select opened
inside a dialog must paint above the dialog, and a tooltip on that select's item
above that again. The gaps of 50 exist so a sixth thing can be inserted without
renumbering, and the rungs are named so that an ad-hoc `z-index: 9999` is
visible in a diff.

**Kit addition.** The reference site names only the sticky rung (`50`) — a
marketing page has one overlay and needs no ladder. The five rungs are this
kit's, derived from the composition rule above.

### Disclosure

Not an overlay — it is in the flow and it moves the content below it — but it
lives here because it shares the `Escape` and focus contract, and because it is
the pattern most often built as a popover by mistake. Use it for a question and
its answer, or for a text alternative beside a media element: content the reader
may want and should not have to visit another surface for.

| Slot | Binding |
|---|---|
| Root | A native `<details>`. No JavaScript, no `aria-expanded` bookkeeping, and it works before hydration |
| Trigger | `<summary>`, `min-height: 44px`, `heading-sm`, ink `ink`, cursor pointer, the native marker removed |
| Trigger glyph | 14px plus, `ink-dim`, rotating **45°** to a cross and taking `accent` when open, at `--duration-fast` |
| Rule | 1px `border-control` between consecutive rows — the row rule is their only boundary, exactly as in § 11 |
| Panel | `body`, `ink-muted`, capped at the 68ch measure, 12px below the trigger |
| Height change | `--duration-slow` / `--ease-out-quart`, or instant. Under reduced motion, instant |

**The glyph rotates rather than swapping.** A plus becoming a cross through 45°
is the same stroke pair in two positions, so there is nothing to reflow and no
second icon to load; a plus swapped for a chevron is two glyphs pretending to be
one control. It also degrades correctly: with motion off it is a plus in one
state and a cross in the other, which is still the full information.

**One appearance for every disclosure on a surface.** Two disclosures that look
different teach a reader that they behave differently. The reference site has two
— the question list and a media element's text alternative — and they are
deliberately identical.

---

## 14. Layout primitives

Four small components carry the entire page rhythm. They are worth porting
before any visual component, because they are what stops fifteen surfaces from
drifting.

### Section

| Prop | Values | Effect |
|---|---|---|
| `width` | `measure` / `narrow` / `default` / `wide` | Picks one of the four container tokens. There is no fifth. |
| `density` | `hero` / `default` / `tight` / `bar` | Picks a row from the rhythm ladder in [`tokens.md` § 9](./tokens.md#9-space) |
| `rule` | boolean | Draws the 1px `hairline` band separator, on the section itself so it bleeds past the gutters |
| `tone` | `paper` / `band` / `sunken` | Band ground |
| `bleed` | boolean | Drops the width container so a child can run edge to edge |

Three structural details that are easy to lose in a port and expensive to
rediscover:

- **Every section is a fragment target**, which needs both halves: root-level
  `scroll-padding-top` so an anchored heading is not clipped by the sticky
  header, *and* `tabIndex={-1}` on the section so focus can move there on a hash
  navigation without adding a tab stop. Without the padding the heading arrives
  under the header; without the tabindex a screen-reader user's focus stays
  behind on whatever they clicked.
- **Every section needs an accessible name** — either pointing at its heading's
  id, or an explicit label when the heading is visually hidden.
- **Each section establishes its own stacking context.** Background motifs sit at
  a negative z-index inside it; without an isolated context that negative index
  escapes to the root and paints behind the page background, so the motif simply
  disappears.

### Heading

Level and type step are **separate props**. Heading order is an accessibility
contract — one `h1` per view, no level skipped — while the type step is a visual
decision. Coupling them is what produces the `h1 → h4 → h5` ladders that this
rebuild existed to fix.

`text-wrap: balance` is on by default for headings. The exception is a heading
carrying a deliberate manual line break: balance and a manual break fight each
other, and the manual break loses in a way that looks like a rendering bug.
Those headings opt out explicitly.

### Eyebrow and Deck

The eyebrow takes its string in **natural case** and uppercases in CSS. A
pre-uppercased string is read letter-by-letter by some screen readers, and the
transform keeps the string reusable. The eyebrow is **never the accent colour** —
the accent gets about three spends per screen and an eyebrow is not worth one.

The deck is capped at the 46ch subhead measure and sits at `ink-muted`.

### Reveal

The single scroll entrance, as a **component rather than a utility**, so its
reduced-motion branch cannot be forgotten at a call site. Full behaviour in
[`motion.md`](./motion.md).

---

## 15. Direction and forced colours

Neither is in the reference site's scope. Both are cheap to author now and
expensive to retrofit across every component, which is why they are here rather
than in a follow-up ticket that never lands.

**Author with logical properties.** `padding-inline`, `margin-inline`,
`inset-inline-start`, `border-inline-start`, `text-align: start`. Every physical
side named in this file — the callout's edge rule, the drawer's entering edge,
the tabs indicator's travel, the table's numeric alignment — is logical in a
correct implementation. A codebase written in `padding-left` cannot be made RTL
by a stylesheet, only by a sweep of every component in it.

**Four things mirror, three never do**, and which is which is a design decision
per element rather than a mechanical flip:

| Mirrors | Why |
|---|---|
| The capture frame's mat, frame and caption alignment | The caption aligns to the frame's *start* edge, and start moves |
| A callout's semantic edge rule | It marks where a block begins |
| The hand-drawn heading underline | It is a gesture that follows the writing hand; drawn left-to-right under an RTL headline it reads backwards |
| The tabs indicator and the direction it travels | It tracks reading order |

| Never mirrors | Why |
|---|---|
| Monospace runs: code, commands, log lines | Code is left-to-right in every locale. Mirroring it makes it wrong, not localised |
| Filenames and paths | `/usr/local/bin` reversed is a different string |
| Version strings and other identifiers | `v0.12.8` is a name, not a quantity |

Wrap those three in `dir="ltr"` explicitly rather than trusting the bidi
algorithm to infer it — a run beginning with a slash or a digit gives it no
strong character to infer from.

**The focus ring and both shadows are direction-neutral.** The ring is a uniform
outline, and both shadow tokens are vertical-only (`0 12px …`, `0 1px …` and
`0 24px …`) with no horizontal offset to mirror. That is a property worth
keeping the next time someone proposes an offset shadow.

**Forced colours.** Under `forced-colors: active` the operating system replaces
every colour in the page, so anything this system expresses *only* in colour
stops existing. Three consequences — and the useful part is that the system
already satisfies all three for other reasons, so the constraint costs nothing:

- The focus ring is an `outline`, which forced-colours mode keeps, rather than a
  `box-shadow`, which it drops. § 1 argues that on clipping grounds; this is the
  second reason for the same decision.
- Every `selected` state in § 10 carries a non-colour cue, so a tinted fill
  disappearing is survivable.
- No heading uses `background-clip: text`, which renders as invisible text under
  forced colours. § 16 anti-pattern 10 bans it on register grounds; this is the
  accessibility one.

Test it once per surface. It is one media query, and it catches colour-only
signalling that no contrast checker can see.

---

## 16. Component-level anti-patterns

A reviewer can catch each of these by looking:

1. A card with a drop shadow.
2. A pill-shaped button or badge.
3. A hover that lifts, scales, or grows a shadow.
4. An icon inside a rounded tinted tile.
5. A disabled state expressed as opacity.
6. A focus ring implemented per-component, or with `box-shadow`, or on `:focus`.
7. Colour as the sole indicator of selection, error, or the current item.
8. A radius that is not 2, 6, 10, 14, 16 or full-on-the-allowlist.
9. Monospace in a heading, button, nav link or question.
10. A gradient on any heading.
11. A second accent hue: every chroma on the surface is the accent ramp or a
    semantic state.
12. A screenshot without a mat, a frame and a caption.
13. A table cell left empty, or filled with a dash, where the value does not
    apply.
14. An overlay that does not return focus to the element that opened it.
15. A centred empty state with an illustration in it.
16. A physical-side property — `padding-left`, `margin-right`, `left` — where a
    logical one exists.

---

*Derived from `docs/design-language.md` § Components, and the shipped primitives
in `src/components/ui/` and `src/components/section/section.tsx`, 2026-08-03.*
