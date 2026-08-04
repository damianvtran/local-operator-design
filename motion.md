# Motion

Motion in this system does one of three things: **shows a state change**,
**reveals structure**, or **confirms an action**. On a consumer surface it may
also *welcome* — entrances are slightly warmer here than on a developer tool,
12px of travel instead of 8, 320ms instead of 240. It never decorates.

Everything in this file is palette-independent and ports as-is.

*Read after [`typography.md`](./typography.md), before
[`components.md`](./components.md). Needs
[`tokens.md` § 12](./tokens.md#12-motion-tokens) for the eight durations and four
easings; `components.md` cites this file for every transition and every
reduced-motion branch, which is why it comes first.*

---

## 1. Tokens

### Durations

| Token | Value | Intended use | Why this number |
|---|---|---|---|
| `--duration-instant` | `80ms` | Colour-only micro-feedback | Below ~100ms a colour change reads as instantaneous, which is what a press should feel like |
| `--duration-fast` | `120ms` | Hover, focus, border and colour transitions | Fast enough that a pointer sweeping across a list does not leave a trail of half-finished transitions |
| `--duration-base` | `180ms` | Active indicators, tab bars, crossfades | The shortest duration in which a *position* change reads as a movement rather than a jump |
| `--duration-slow` | `240ms` | Overlays, drawers, height changes | Something covering content earns the extra 60ms; the reader needs to see where it came from |
| `--duration-reveal` | `320ms` | Scroll entrances | Long enough to feel deliberate on a first read, short enough that fast scrolling does not queue |
| `--duration-draw` | `480ms` | SVG stroke draw | A stroke that draws in under ~400ms reads as a flicker rather than a hand |
| `--duration-beat` | `700ms` | One beat of a multi-step emphasis sequence | Roughly the pace of reading one short line |
| `--duration-close` | `400ms` | The closing gesture of such a sequence | Slightly slower than a beat, so the sequence lands rather than stops |

### Easings

| Token | Value | Intended use |
|---|---|---|
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | **Default.** Every entrance, every colour transition. |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Overlays and drawers. A sharper arrival for something that covers content. |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Reversible toggles — a symmetric curve looks the same played backwards, which is what a toggle needs. |
| `--ease-linear` | `linear` | Spinners and shimmer sweeps only. Anything that loops needs a curve with no start and no end. |

**No spring. No bounce. No overshoot. No elastic. Anywhere.** Spring physics
say *this object has mass and just landed*. Nothing in this interface is an
object with mass; every animated thing is either a piece of information
appearing or a state changing, and neither of those bounces. A spring also makes
the duration non-deterministic, which means it cannot be reasoned about in a
reduced-motion budget.

**Duration budget.** A total auto-playing sequence stays under **4.4 seconds**,
which keeps it clear of WCAG SC 2.2.2's five-second threshold for auto-moving
content and therefore below the point where a pause control becomes mandatory.
Nothing loops except a status-dot pulse, which is removed entirely under reduced
motion.

---

## 2. The one canonical entrance

There is exactly one scroll entrance in the system and every revealed element
uses it:

| Property | Value |
|---|---|
| From | `opacity: 0`, `translateY(12px)` |
| To | `opacity: 1`, `translateY(0)` |
| Duration | `--duration-reveal` (320ms) |
| Easing | `--ease-out-quart` |
| Trigger | 15% of the element visible |
| Repeat | Once per page load. Never on scroll back. |
| Stagger | 40ms per sibling, **capped at 4** |

**12px, not 40.** Long travel makes a page look like it is assembling itself
under the reader, which is unsettling rather than polished. 12px is enough to
register as arrival.

**The stagger cap is the important number.** Without it, a twelve-item list
unrolls for half a second and the reader watches a progress bar made of content.
With the cap, items 4 through 12 all start together: the list *appears*, with
just enough sequencing at the front to feel intentional.

**Ship it as a component, not a utility class.** That is the only way the
reduced-motion branch cannot be forgotten at a call site. The component takes an
index for the stagger and nothing else.

**Under reduced motion it renders a plain element with no initial state at all** —
not an animation to the same value. Animating *to* the resting value still puts
`opacity: 0` in the DOM for one frame, and on a slow device that frame is
visible. This is the single most common way a reduced-motion implementation is
technically present and practically broken.

---

## 3. Scroll-linked patterns

### The layering, and why it exists

**Native CSS scroll-driven animation first; a JavaScript driver as a fallback;
never both at once.**

Native `animation-timeline: view()` is the right primary because the browser
owns the timeline: zero JavaScript on the scroll path, frame pacing the main
thread cannot ruin, and it degrades by declaration — an engine that does not
know the property ignores it and the element sits in its resting state, which is
its complete state.

The fallback exists because support is not universal on the open web. As
verified for this build: `animation-timeline` ships in Chromium 115+ and Safari
26+, and is behind a flag in Firefox. So the native path covers every current
evergreen browser except Firefox, and a JavaScript scroll driver covers the
rest.

**The gate is a capability query, in both languages, never a browser check:**

```css
@supports (animation-timeline: view()) { /* native path */ }
```

```js
CSS.supports("animation-timeline: view()")  /* the JS half of the same gate */
```

Then set a `data-scroll-driver="native" | "js"` attribute on the section so the
two paths cannot both run — double-driving the same property is how an element
ends up at an interpolated position that neither path intended.

**In an Electron app this whole layer is dead weight.** One engine, known
version, `animation-timeline` supported since Chromium 115. Ship the native path
only, and delete the fallback rather than porting it. This is the clearest case
in the kit of *a decision that was correct for the web and is wrong for the
desktop app*.

### Which effects get a fallback, and which do not

This is a judgement call, and the rule is: **does the effect carry information?**

| Effect | Carries information? | Fallback? |
|---|---|---|
| A pinned illustration whose state advances with scroll | Yes — the illustration is two thirds unreachable without it | **Yes.** JavaScript driver on the same ranges and the same values. |
| A progress rule under that illustration | No — the same information is in the step indicator's accessible state | No. Its absence costs nothing. |
| A 24px parallax drift on a hero visual | No | No. A 24px drift does not justify a scroll listener on the largest-contentful-paint region. |

State that ruling explicitly in the code, next to the effect. Otherwise the next
maintainer sees an inconsistency — "why does this one have a fallback and that
one doesn't?" — and resolves it in the wrong direction.

### Discrete state versus continuous effect

One more distinction worth carrying over. A **discrete** scroll effect — three
states, no in-between — is better implemented with an intersection observer than
with a scroll timeline: it is one observer and twenty lines, it works in every
engine today, and it needs no capability fork and no second code path to keep in
step. Reserve the declarative scroll-timeline technique for genuinely
**continuous** effects, where the value is a function of scroll position.

### Pinning

A pinned (sticky) illustration is only worth it above a comfortable width. Below
that, three problems compound: a viewport-height stage plus a text block leaves
nothing on a small screen; mobile browser chrome resizes the viewport mid-scroll
so a `vh`-sized sticky element jumps; and the section spends several screens of
scroll to deliver three sentences.

**Make the stacked form the CSS default and the pinned form the enhancement,**
not the other way round. That ordering does three things at once: a
reduced-motion reader gets the stacked form with no override needed; nobody
watches the pinned layout paint and then reflow; and the small-screen case is
handled by the same rule rather than by a second one.

One pinning detail that survives review and then breaks: an in-page link that
targets a step must land it inside the observer's active band, or the
illustration will show the *previous* state. Add scroll margin for it and leave
a comment naming the bug.

---

## 4. The `prefers-reduced-motion` contract

**Reduced motion is not a kill switch. Functional feedback survives.** The
question to ask of every animation is not "can this be removed?" but "what does
this animation *tell* the reader, and how do they learn it with the animation
off?"

### The global floor

```css
@media (prefers-reduced-motion: reduce) {
	*, *::before, *::after {
		animation-duration: 0.01ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 120ms !important;
		scroll-behavior: auto !important;
	}
}
```

This is the **floor, not the mechanism**. It catches CSS-only animation and
anything a component forgets. Every component that animates still carries its
own branch that renders the resting frame directly, for the one-frame reason in
§ 2.

Note that `transition-duration` is capped at 120ms rather than zeroed.
Instantaneous colour changes lose the affordance that a hover *is* feedback; a
120ms colour step is not motion in the vestibular sense and is what the
preference is actually asking for.

### What must still be visible with motion off

This is the part that is usually got wrong. With motion disabled the reader must
still receive **every piece of information the motion was carrying**:

| Element | Reduced behaviour | What survives |
|---|---|---|
| Canonical entrance | Render the final state, with no initial state set | The content, at full opacity, in position |
| A multi-beat emphasis sequence | The complete final frame: every rule drawn, every marker set, no sweep, no shimmer | The whole artifact it was drawing attention to — it was always complete in the markup |
| A pinned, scroll-advanced illustration | Unpinned. The final state shown. The steps read as a plain numbered list. | All three steps' text, which was never dimmed in the first place |
| SVG stroke draw | The final frame — drawn | The mark |
| Tab bar / segmented indicator | Jump to position | The indicator, at the selected item |
| Native disclosure open/close | Instant by definition; the glyph rotation is dropped | The open/closed state, via the glyph's two forms |
| Player crossfade and chrome fade | Instant swap; chrome persistent | The current tab's content |
| Skeleton pulse | Static at 0.8 opacity | The placeholder shape |
| Button spinner | Static `…` in `mono-label` plus a polite live region | That the operation is in flight — announced, not just shown |
| Status dot pulse | Removed | The dot, and its colour |
| Theme switch | Instant | The theme |

Two rules generalise from that table:

- **Never dim, grey or blur text to indicate that it is not the current step.**
  Scroll position is shown by an indicator, a numeral, or an illustration — never
  by degrading contrast. A scroll-advanced section that dims inactive text fails
  SC 1.4.3 for everyone, not just reduced-motion readers.
- **If an animation was the only way to learn something, it was a defect before
  the preference was set.** The reduced-motion branch is where that defect
  becomes visible, which makes writing it a design review in itself.

Surviving transitions are capped to `color`, `background-color`, `border-color`,
`outline-color` and `opacity`, at `--duration-fast`.

### Beyond the media query

The reference build also treats a **low-power or data-saving device** the same
way a reduced-motion preference is treated, resolving both into a single
attribute on the animated root rather than re-checking a media query in every
rule. That is worth copying: it makes "should this move?" one decision in one
place, and it means a low-end machine gets the resting figure without being a
special case anywhere.

---

## 5. Anti-patterns

Each of these is checkable by a reviewer, not a matter of taste:

1. **No spring, bounce, `backOut`, overshoot or elastic easing.** Four easing
   tokens exist; nothing else is permitted.
2. **No hover lift and no hover scale.** Press feedback is a colour step.
3. **No decorative parallax.** The one permitted scroll-linked translate is a
   24px drift with no scale and no opacity change, and it exists because a hero
   that is perfectly static as the page scrolls reads as an image rather than a
   surface. Anything with two layers moving at different rates for the look of
   it is out.
4. **Nothing shrinks into a dock, flies, tilts, or follows the cursor.**
5. **No count-up numbers.** An animated number is unreadable while it animates
   and implies the value is approximate — the exact opposite of what a figure is
   for.
6. **No scroll-scrubbed video.** It costs a decode on the scroll path and nobody
   ships it.
7. **No autoplaying media, and at most one video element mounted at a time.**
8. **No marquee, no typewriter caret, no animated gradient backgrounds.**
9. **No `background-clip: text` gradient on a heading.** The technique is
   permitted in exactly one place in this system — a sweep across a line of
   machine-generated text, where it means *this is being produced right now* —
   and it must always keep a `color` set underneath, so that if the gradient
   fails to paint (old engine, forced-colours mode, a printed page) the text is
   still there at full contrast instead of transparent. A `background-clip: text`
   rule without a colour fallback is how a headline disappears entirely.
10. **Nothing loops** except a status-dot pulse, which is removed under reduced
    motion.
11. **No element animates without a reduced-motion counterpart** in the table
    above. If it is not in the table, it does not animate.

---

*Derived from `docs/design-language.md` § Motion and the shipped
`src/index.css` scroll and reduced-motion blocks, 2026-08-03.*
