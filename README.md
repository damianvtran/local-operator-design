# Local Operator design kit

A portable distillation of the Local Operator visual and verbal system: colour,
type, space, components, motion and voice, written so that a team on a
**different stack, in a different repository, with none of this repo's context**
can rebuild the register faithfully.

It was written for the port of the Electron desktop app
(`damianvtran/local-operator-ui`, React + MUI 6 + Emotion), but nothing in files
1–7 is specific to that target. Only
[`handoff-local-operator-ui.md`](./handoff-local-operator-ui.md) is.

Plain Markdown, one JSON file, one CSS file, and one 380-line script with no
dependencies. No build step, no install. Read it on GitHub, in an editor, or with
`cat`; the one thing you run is
[`contrast-contract.mjs`](./contrast-contract.mjs), and it is a `node` command
with no arguments.

---

## This repository: the home of record

This kit was extracted from the marketing site's repository (where it lived at
`docs/design-kit/`, split from `local-operator-site` at `b936429d` with its
history followed) into **`damianvtran/local-operator-design`** — the public home
of record for the shared brand register. Two additions come with the move:

- **[`app-family.json`](./app-family.json)** — the desktop app's two brand
  palettes and the palette role contract as data, extracted from
  `damianvtran/local-operator-ui` at a pinned ref by
  [`tools/extract-app-family.mjs`](./tools/extract-app-family.mjs). Values are
  read by executing the palette module (never re-typed); `--check` re-runs the
  extraction and fails on any drift from the pin. The contract section names all
  39 `ThemePalette` members in declaration order — `mode`, plus the 38 colour
  roles the contract's own header counts.
- **[`divergences.json`](./divergences.json)** — every sanctioned difference
  between surfaces in one checked list: the light accent, the light ground ramp,
  the `info` role, and the light-mode `success` / `on-accent` values that had no
  recorded home before. Each entry pins its recorded values against
  `tokens.json` and `app-family.json` via
  [`tools/check-divergences.mjs`](./tools/check-divergences.mjs), so a
  divergence cannot outlive the values it describes.

Two mechanical edits to the ten kit files came with the move, both scripted and
reviewable as their own change: run commands that named `docs/design-kit/<file>`
now name the file at this repository's root, and `tokens.css` is now generated
from `tokens.json` (`node tools/generate-tokens.mjs`), with the committed bytes
verified byte-identical to the split commit's. Nothing else changed;
[`digests.json`](./digests.json) records the SHA-256 of every published file.

### Version and releases

`tokens.json` `$meta.version` continues the kit's own lineage: **1.1.0** was
the version inherited from the site, and this repository materialises **1.2.0**
— the first release, carrying the app-family file and the divergence register.
The **v1.2.0** tag is cut after an independent review round; until it exists,
consumers pin a commit. Consumers track **tags**; a pin bump (tag or commit) is
a deliberate change in the consumer, with its reason recorded — never a
floating fetch.

### Consuming this kit: pin and lock

Consumption is a **pinned slice plus a parity gate**, never a build-time import.
A consumer commits the kit files it uses as byte copies under its own tree,
together with a lock naming the kit version, the git ref, and a SHA-256 per
consumed file — the hashes come from [`digests.json`](./digests.json). The
lock's shape, as consumers write it:

```json
{
  "kit": "damianvtran/local-operator-design",
  "version": "1.2.0",
  "ref": "v1.2.0",
  "files": { "tokens.json": "<sha256>", "app-family.json": "<sha256>" }
}
```

A consumer's CI then proves two things: the slice equals the kit at the locked
ref (a public→public fetch; no credentials belong in it), and the consumer's own
token file derives from the slice (local and cheap). A pin that goes stale *with
a recorded reason is a settled state, not drift; one that goes stale without one
is the failure this repository exists to make visible.

### The editorial flow

**Register changes start here.** A colour or role change lands in the kit first
— with its measurement, and with the divergence register updated if it adds a
sanctioned difference — and the site and every other consumer follow in the same
wave, each behind its own parity check. A sanctioned difference that lands in a
consumer without a register entry is the failure mode this repository exists to
prevent: if a surface genuinely needs a new one, it is recorded in
[`divergences.json`](./divergences.json) first.

Everything above is gated by this repository's CI — the contrast contract, the
`tokens.json` ↔ `tokens.css` ↔ `tokens.md` consistency check, the divergence
register and the digests — all plain `node` commands with no dependencies (see
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml)).

---

## What this is not

- **Not the website's specification.** That is `../design-language.md`,
  `../ux-architecture.md` and `../copy.md` — three documents totalling several
  thousand lines that own the site's routes, section blueprints, per-slot copy
  and per-band art direction. This kit *derives* from them and deliberately
  drops everything site-specific. Where the two disagree, the spec wins for the
  website and this kit says so out loud (see § Where this kit disagrees).
- **Not a component library.** There is nothing to install. Every component is
  described as a table of slots and the token each slot binds to, precisely so
  that an implementer on MUI, SwiftUI, Compose or plain CSS can rebuild it
  without reading anyone else's utility classes.
- **Not a brand book.** No logo lock-ups, no clear-space diagrams, no
  photography direction. It covers the parts of the system that an interface
  is built out of.
- **Not a set of suggestions.** Every number here is measured or computed and
  carries the reason it is that number. Change them knowingly.

---

## Who it is for

Anyone implementing a Local Operator surface outside this repository:
the desktop app, a future web app, documentation, a demo, an internal tool.
Human or agent — the files are written to be read cold, in order, by either.

---

## The files, in the order they read cold

The table is the dependency order, and each file repeats its own place in it as a
one-line ribbon under the title. Read top to bottom and you never hit a forward
reference; read in any other order and `components.md` will cite a duration you
have not met. The **How to adopt** sequence below is deliberately different — it
is the order you *build* in, which is not the order you *read* in, and the two
being confused for each other is why this table now says which is which.

| # | File | Reach for it when |
|---|---|---|
| — | **this file** | You want the map, the disagreements with the specs, and the provenance. |
| 1 | [`tokens.md`](./tokens.md) | You need a value, or you need to know why a value is what it is. Every token, its computed contrast ratio, and the contrast floors the system holds. **Everything else binds to a name defined here.** |
| 1a | [`tokens.json`](./tokens.json) | You are generating theme code or a lint rule. Machine-readable, same values. A sibling of `tokens.md`, not a step of its own. |
| 1b | [`tokens.css`](./tokens.css) | You want the tokens working in five minutes on any stack. Framework-neutral custom properties, the space scale, and the light/dark switching contract. |
| 1c | [`contrast-contract.mjs`](./contrast-contract.mjs) | You changed a colour, or you want the floors as something you can run rather than something you have to trust. `node contrast-contract.mjs`. |
| 2 | [`typography.md`](./typography.md) | You are setting type: the step table, the three families and why each, the optical-size axis, where monospace is mandatory and where it is forbidden, self-hosting and OFL licensing. |
| 3 | [`motion.md`](./motion.md) | Anything moves. Durations, easings, scroll-linked patterns, the `prefers-reduced-motion` contract, and the anti-patterns. **Before `components.md`**, which cites it on every transition. |
| 4 | [`components.md`](./components.md) | You are building a control. Anatomy, variants, sizes and all eight interaction states for every primitive; the focus ring and its two exceptions; form controls, tables, empty and loading states, overlays and focus management, direction and forced colours. |
| 5 | [`voice.md`](./voice.md) | You are writing a string a user will read. Principles, the banned-word list with a reason for each, and worked before/after pairs. |
| 6 | [`handoff-local-operator-ui.md`](./handoff-local-operator-ui.md) | You are porting to the Electron app specifically. MUI 6 theme skeleton, token→theme-key mapping, the multi-theme problem, what to convert first, and what does not port. **Skip it entirely on any other stack.** |

---

## How to adopt this in a new codebase

**This is the build order, not the reading order** — see the note above the file
table. Roughly a day for steps 1–4 on a small surface; the rest is per-component
work.

**1. Decide what the palette is before you write any code.**
If your target has one theme, take the two ramps in
[`tokens.md`](./tokens.md) directly. If it has *user-selectable* themes, the
ramps do not port — read
[`handoff-local-operator-ui.md` § 3](./handoff-local-operator-ui.md#3-the-theme-contract),
which turns them into a set of required roles and contrast floors instead. This
decision shapes everything after it.

**2. Land the tokens, then prove they switch.**
Copy [`tokens.css`](./tokens.css) in as-is, or feed
[`tokens.json`](./tokens.json) to whatever generates your theme. Then verify the
light/dark switch on one element before building anything on top of it — a
token layer that silently does not re-point is a day lost later.

**3. Land the three base rules before any component.**
The focus ring, the default border colour, and the reduced-motion floor are all
at the bottom of [`tokens.css`](./tokens.css). They apply globally, they are
about ten lines, and they are the single biggest accessibility return available.

**3a. Wire the contrast contract into CI in the same commit.**
[`contrast-contract.mjs`](./contrast-contract.mjs) runs under plain `node` with
no dependencies and exits non-zero on a violation. Doing it now costs ten minutes
and means every colour decision after this point is checked instead of reviewed;
doing it after the components are built means arguing with a failing build about
values that already shipped. If your palette differs from the site's, replace the
script's `load()` and keep its tables — they are the contract, not the data.

**4. Load the fonts and set the type scale.**
[`typography.md` § 5](./typography.md#5-self-hosting-and-licensing) has the
`@font-face` shape and the licensing obligations. Set all sixteen steps at once,
not as you need them; a partially-landed scale is how a seventeenth step gets
invented.

**5. Build the primitives from their slot tables.**
Button first — it is the most repeated element and it establishes the register.
Then whatever your surface actually uses. Work from
[`components.md`](./components.md) and implement **all eight states** for each,
including the ones that feel unlikely. The disabled and focus-visible states are
the ones that get skipped and the ones that get reported.

**6. Compose layout with the rhythm, not with ad-hoc spacing.**
[`tokens.md` § 9](./tokens.md#9-space), and the `--space-*`, `--gutter` and
`--section-*` properties [`tokens.css`](./tokens.css) emits. The three-tier
grouping rule — 8–16 inside, 24–32 between, 64–128 across — is doing hierarchy
work that a uniform value cannot.

**7. Add motion last, and add the reduced-motion branch in the same commit.**
[`motion.md`](./motion.md). If the branch is a follow-up ticket, it is a
permanent one.

**8. Do a voice pass over every string.**
[`voice.md` § 4](./voice.md#4-how-to-check-a-string) is five questions. Buttons,
empty states and error messages first — they are read under load.

### The five-minute version

Copy [`tokens.css`](./tokens.css). Set `font-family: var(--font-sans)` and
`background: var(--color-paper); color: var(--color-ink)` on the root. You now
have the ramp, the focus ring and the reduced-motion floor. Everything else is
refinement.

---

## Where this kit disagrees with the specs

The kit's rule is: **never silently diverge.** Every place it departs from
`../design-language.md` is listed here and flagged again at the point of use.
None of these is a defect in the shipped site.

| # | Spec says | Kit says | Kind |
|---|---|---|---|
| 1 | Dark ramp tokens are `--color-canvas`, `--color-fg`, `--color-fg-muted`, `--color-fg-dim`, `--color-fg-disabled` | Those names do not exist. The build re-points the light names (`paper`, `ink`, `ink-muted`, `ink-dim`, `ink-disabled`), which is what lets components carry no dark colour variants. The spec's own Appendix A ships the re-pointing form, so this is an internal inconsistency in the spec. | Naming |
| 2 | `ink-dim` on dark **canvas** is 5.18:1 | Recomputed: **5.46:1**. A genuine miscalculation — no other cell in the table holds 5.18, so it is not a copy from somewhere else. | Arithmetic |
| 3 | `ink-disabled` on dark **band** is 2.70:1 | Recomputed: **2.45:1**. 2.70 is that row's own **canvas** cell — a value duplicated one column across, not a slip in the arithmetic. | Duplicated cell |
| 4 | `ink-disabled` on light **band** is 2.75:1 | Recomputed: **2.71:1**. 2.75 is that row's own **paper** cell. Same failure mode as 3, in the light table. | Duplicated cell |
| 5 | Dark `warning-border` on **canvas** is 3.27:1 | Recomputed: **3.85:1**. 3.27 is exactly the correct figure for `warning-border` on its own **wash** — the right number against the wrong ground. | Wrong pair |
| 6 | Dark `fg-dim` on **sunken** is 5.46:1 | Recomputed: **5.75:1**. 5.46 is that row's **canvas** figure, i.e. the value row 2 should have carried, duplicated into the sunken column. The kit's own § 3 table has 5.75, so only the spec is wrong. **Not previously listed here.** | Duplicated cell |
| 7 | Appendix A defines `--radius-full: 9999px` | The shipped CSS does not define it — verified live in a browser against the running build. Roundness comes from a static utility instead. | Missing token |
| 8 | Appendix A defines `--shadow-ring-dark` | Not shipped. The two-tone focus ring's outer stroke is applied as a literal at the one call site. | Missing token |
| 9 | Appendix A omits `island-edge`, `island-keyword`, `island-string`, `island-number` | The shipped CSS defines all four as real tokens, which is better. The kit follows the shipped CSS. | Extra tokens |
| 10 | Fraunces' `opsz` axis "settles at its large end (≈ 144)" for display sizes | `font-optical-sizing: auto` tracks the *used font size*. At the largest step, 60px, the axis lands near 60, not 144. The effect the spec describes is real; the stated value is not. | Mechanism |
| 11 | The Fraunces latin `opsz` subset is 36.6 KB | The shipped file is **67,304 bytes**. 36.6 KB is the `wght` build. The comment in `src/index.css` has it right. | Measurement |
| 12 | Button `icon-sm` and `icon` both carry a 16px glyph | The spec's own theme-toggle entry specifies 20px in an `icon`-size button. The build resolves it as 16px for `icon-sm` and 20px for `icon`; the kit follows the build. | Internal conflict |
| 13 | Ghost and outline hover fill is `sunken` in light and `elevated` in dark | The build ships `sunken` in both. The kit documents the build and adds the measurement that settles it: **all three candidate fills are below perceptual threshold** (1.05–1.19:1), so the fill choice is free and the border and ink steps are the hover. [`components.md` § 2](./components.md#2-button) | Build deviation |
| 14 | `secondary` takes a `hairline` rest border and `outline` a `hairline-strong` one | Those are **1.20:1** and **1.41:1**, over a fill that is 1.06:1 against the page — the border is the control's sole boundary at a third of the 3:1 floor, which the spec's own § Borders rule forbids. Both are now `border-control`. **Fixed upstream 2026-08-03** in `button.tsx` and in the spec's § Button table; recorded here because the kit found it. | Factual error, fixed upstream |
| 15 | `capability-files.webp` is "a light-UI capture" and the `files` band takes `capture="light"` | Measured: mean relative luminance **27.2**, **95.3%** of pixels below 64 — a dark capture, confirmed by looking at it. Under `capture="light"` it takes the lighter mat, so the capture mismatches its own mat. **Fixed upstream 2026-08-03** in four places in the spec and at the call site. | Factual error, fixed upstream |

**Rows 3–6 are one failure mode, not four slips**, and the distinction is what
the spec's maintainer needs: a duplicated cell is a *transcription* error, so its
prior probability of recurring elsewhere in the same table is high, and "a slip in
the safe direction" — which an earlier version of this table claimed — is not
generally true of a value copied from the neighbouring column. It is safe here by
luck. Anyone re-verifying that spec should diff every cell against a recomputation
rather than spot-checking the ones that look wrong, because a duplicated cell
always looks plausible.

One further note, recorded as a recommendation rather than a disagreement: the
kit argues in
[`handoff-local-operator-ui.md` § 3](./handoff-local-operator-ui.md#3-the-theme-contract)
that the always-dark code island — correct on a marketing page — is probably
wrong inside an application with user-selected themes.

---

## Provenance

Derived on **2026-08-03** from:

| Source | What was taken |
|---|---|
| `../design-language.md` | The authoritative visual system: palette with ratios, type scale, space, radii, borders, elevation, component appearance, motion, iconography, anti-patterns |
| `../copy.md` §§ 0–1 | Voice principles, the banned-word list, the "what we do not claim" list |
| `src/index.css` | The shipped `@theme` block — the real source of truth for every value |
| `src/components/ui/*.tsx` | The shipped primitives: button, badge, link-button, theme-toggle, capture-frame, logo-mark |
| `src/components/section/section.tsx` | The layout primitives and the container ladder |
| `package.json` and font package metadata of `damianvtran/local-operator-ui` | Target stack; font versions, axes and licences |

**Verification.** Every hex, ratio and type step in this kit was checked against
`src/index.css`, and re-checked after this revision: zero value mismatches across
35 light colour tokens, 27 dark ones, all 16 type steps × four properties, and
every radius, duration, easing, container and shadow. Contrast ratios were
recomputed from the shipped hexes with the WCAG relative-luminance formula rather
than copied from the spec — which is how the errors above were found, and which
is now [`contrast-contract.mjs`](./contrast-contract.mjs) rather than a one-off.
Font sizes were measured from the files on disk, and the Fraunces axis defaults
read from the shipped file's own `fvar` table. The 60px heading's computed size,
weight, tracking and line-height, and the absence of `--radius-full`, were
verified live in a browser against the running build. The MUI skeleton in the
handoff was type-checked under `tsc --strict` against `@mui/material@6.4.2` **and
executed**, with the resulting theme object inspected — that is where its
breakpoint, `action.focus` and `augmentColor` corrections came from.

**Maintenance.** If a register value changes anywhere in the family, this kit
moves first (or follows in the same wave — see **This repository: the home of
record** above). Update [`tokens.json`](./tokens.json), run
`node tools/generate-tokens.mjs` to regenerate [`tokens.css`](./tokens.css)
from it, update [`tokens.md`](./tokens.md) where it states the value — and then
**run the contract**:

```
node contrast-contract.mjs
```

It reads `tokens.json`, recomputes every foreground × ground pair the system
permits and every component triple in both themes, and exits non-zero on a
violation. Three things about it are worth knowing before you rely on it:

- **It asserts over component triples, not just token pairs.** A control's
  boundary is legal if *either* its fill or its border clears 3:1 against the
  ground behind it, so the script can catch "the fill is 1.06:1 and the border is
  1.20:1, therefore this control has no edge" — which is a defect no
  pair-by-pair checker sees, and which is the one this kit shipped in its first
  draft.
- **Every accepted sub-floor pair is pinned to its measured ratio.** An exemption
  is not a mute button: change the token and the pinned value stops matching, the
  script fails, and the argument for the exemption has to be made again on the new
  number.
- **It treats a colour used as a background as a ground.** Pointing a focus
  *fill* at a saturated accent fails here rather than shipping.

That is what converts this kit's central promise from "trust me, I measured the
pairs by hand" into something the next maintainer re-runs after changing one hex.
The hand-maintained part is now the three files agreeing with each other; the
part that actually matters — that the colours are legible — is a command.

**Reading `tokens.json` from your own tooling.** It is deliberately not DTCG (see
`$meta.notDtcg` and `$meta.shape` inside the file), so a Style Dictionary build
needs a loader. This is the whole loader:

```js
import { readFileSync } from "node:fs";

const T = JSON.parse(readFileSync("tokens.json", "utf8"));

/** Every colour token flattened to `name -> hex` for one theme. */
export const colors = (theme /* "light" | "dark" */) =>
	Object.fromEntries(
		Object.values(T.color).flatMap((group) =>
			Object.entries(group)
				.filter(([name]) => !name.startsWith("$"))
				// `value` = theme-invariant (the islands, the photographic ring);
				// otherwise pick the theme's side of the pair.
				.map(([name, t]) => [name, t.value ?? t[theme]]),
		),
	);

/** Every type step as a ready-to-emit rule. `px` is precomputed at a 16px root. */
export const typeSteps = () =>
	Object.entries(T.type)
		.filter(([name]) => !name.startsWith("$"))
		.map(([name, s]) => ({
			name,
			fontSize: s.size,
			lineHeight: s.lineHeight,
			fontWeight: s.weight,
			letterSpacing: s.letterSpacing,
			fontFamily: `var(--font-${s.face})`,
			textTransform: s.transform ?? "none",
		}));
```

Two rules cover the rest of the file: **any key beginning with `$` is metadata,
never a token**, and a handful of values are prose rather than data —
`space.rhythm.*`, `space.sectionDensity.hero.*` (`"72/48"` is top/bottom) and
`radius.$cap`/`$round`. Nothing generated should depend on those.
[`contrast-contract.mjs`](./contrast-contract.mjs) is a second working consumer of
the same shape if you would rather read code than a spec.
