# Handoff: porting this system to `local-operator-ui`

A porting guide for the Electron desktop app, written for a team that has this
kit and not the website's source tree.

*Read last, after all seven palette-independent files. Everything here assumes
[`tokens.md`](./tokens.md), [`components.md`](./components.md) and
[`motion.md`](./motion.md); this is the only file in the kit that is specific to
one target, and the only one an implementer on another stack should skip
entirely.*

---

## 0. What I inspected, and what I did not

**Inspected, first-hand, on `damianvtran/local-operator-ui` `main`:**

- `package.json` — full dependency list, scripts, build config.
- `src/renderer/src/shared/themes/` — the directory listing, `index.ts`,
  `theme-interfaces.ts`, and `light-theme.ts` in full.
- `src/renderer/src/shared/types/theme.ts`.

**Not inspected:** any screen, component, layout, route or store. I have not run
the app or seen a screenshot of it.

Everything in this document about *what the app looks like or how its screens
are built* is therefore marked **`[INFERENCE]`** and should be checked before
being acted on. Everything about its **theme system** is first-hand.

### Facts worth correcting up front

| Claim commonly made | What is actually there |
|---|---|
| "eight user-selectable themes" | **Twelve**: `localOperatorDark`, `localOperatorLight`, `dracula`, `dune`, `sage`, `monokai`, `tokyoNight`, `iceberg`, `radient`, `neon`, `obsidian`, `synth`. Default is `localOperatorDark`. |
| "MUI 6 + Emotion" | Correct — `@mui/material` ^6.4.2 with `@emotion/react` and `@emotion/styled` ^11.14.0. **And also `styled-components` ^6.1.14**, i.e. two CSS-in-JS runtimes in one bundle. |
| "one icon library" | **Two**: `lucide-react` ^0.507.0 *and* the four `@fortawesome/*` packages. |

Each theme file is a standalone `createTheme({ breakpoints, palette,
typography, components })` call of 4.4–5.7 KB. **There is no shared base
factory.** Every theme repeats the breakpoints, the typography block, and the
`MuiAppBar` / `MuiListItemButton` / `MuiIconButton` / `MuiButton` / `MuiCard` /
`MuiContainer` overrides. That single fact determines most of what follows.

---

## 1. The split: what ports as-is, and what becomes a rule

The app cannot adopt this system's palette, because users pick their own theme.
It can adopt everything else. Sorting the system into those two buckets is the
whole job, and doing it before writing code is what stops the port from
degenerating into "make the app green".

### Palette-independent — port the values directly

| Layer | Where | Notes |
|---|---|---|
| Type scale | [`typography.md`](./typography.md) | 16 steps, sizes/line-heights/weights/tracking. Faces are a separate decision (§ 8). |
| Spacing rhythm | [`tokens.md` § 9](./tokens.md#9-space) | 4px base, the permitted ramp, and the three-tier grouping rule |
| Container ladder | [`tokens.md` § 9](./tokens.md#9-space) | Four widths, and reading measures in `ch` |
| Radii | [`tokens.md` § 10](./tokens.md#10-radii) | 2 / 6 / 10 / 14 / 16, round on a three-item allowlist |
| Elevation strategy | [`tokens.md` § 11](./tokens.md#11-shadows) | Background step, not shadow. Two shadows total. |
| Border strategy | [`tokens.md` § 4](./tokens.md#4-lines-two-decorative-weights-and-one-structural) | The decorative/structural split. The *hexes* are palette-bound; the **rule** is not. |
| Motion tokens and patterns | [`motion.md`](./motion.md) | Durations, easings, the one entrance, the reduced-motion contract |
| Component anatomy and the eight states | [`components.md`](./components.md) | Slot tables are stack-neutral for exactly this reason |
| Focus-ring rule | [`components.md` § 1](./components.md#1-the-focus-ring) | Outline not box-shadow, `:focus-visible` only, `border-radius: inherit`. The *colour* comes from the theme's accent. |
| Iconography | § 8 below | One library, four sizes, one stroke weight, no icon tiles |
| Voice | [`voice.md`](./voice.md) | Every user-visible string in the app |

### Palette-bound — becomes a contract each theme must satisfy

The specific greens, the paper/canvas ramp, the semantic hues and the three
line values do **not** port as values. They port as **roles with contrast
floors**, in § 3.

---

## 2. The multi-theme problem, and a recommendation

### The problem, stated precisely

Twelve themes, each a standalone `createTheme`, each redefining the same
breakpoints, typography and component overrides. So:

1. **Every non-colour decision in this kit would have to be pasted twelve
   times.** A type-scale change is a twelve-file diff, and the twelfth file is
   the one that gets missed.
2. **Nothing enforces a contrast floor.** Verified against `light-theme.ts` as
   shipped:

   | Pair | Ratio | Verdict |
   |---|---|---|
   | `primary.main` `#2BA458` as text on `background.paper` `#FFFFFF` | **3.20:1** | Fails AA for normal text |
   | `primary.contrastText` `#ffffff` on `primary.main` `#2BA458` | **3.20:1** | A contained button's own label fails AA |
   | `sidebar.itemActiveText` `#2BA458` on `sidebar.background` `#E8EEF2` | **2.74:1** | Fails even the 3:1 non-text floor |
   | `inputField.border` `rgba(0,0,0,0.1)` on `#FFFFFF` | **1.25:1** | A control's only boundary, at 1.25:1 |

   Those are not adversarial cases; they are the default light theme's own
   values. With twelve palettes and no floor, this is not an oversight, it is
   the expected outcome.
3. **A "Dracula" theme is a promise to a user.** Any resolution that quietly
   overrides community palettes with brand green breaks that promise, and the
   users who chose Dracula are exactly the users who will notice.

### The recommendation

**Extract a palette-independent base theme; make each of the twelve themes
contribute a palette only; enforce a role-and-floor contract on that palette.**

Concretely, in three steps:

1. **`createBaseTheme(palette)`** owns everything in the palette-independent
   list: breakpoints, typography, shape, spacing, shadows, transitions, and all
   `components` overrides. It is written once.
2. Each theme file shrinks to a **palette object plus a name**. `dracula-theme.ts`
   becomes ~40 lines of colour and one call.
3. A **contract test** — a plain script, not a lint rule — iterates all twelve
   themes and asserts the floors in § 3. It fails the build on a theme that
   cannot be read.

   **This one is already written.** [`contrast-contract.mjs`](./contrast-contract.mjs)
   in this kit is that script, running against the site's own palette: no
   dependencies, plain `node`, 669 assertions across two themes, exit non-zero on
   a violation. Porting it is replacing its `load()` with a loop over your twelve
   palettes; the floors, the component triples and the pinned exceptions are the
   contract itself and do not change. It asserts over **component triples**
   (ground + fill + border + ink), not just token pairs, which is what catches
   "the fill is invisible and so is the border" — the defect that produced most
   of the corrections in this kit.

**The tradeoff, stated honestly.** This costs a real refactor of twelve files
and, more importantly, it removes each theme's ability to make bespoke component
tweaks. Today a theme *can* give `MuiCard` a different radius; after this, it
cannot. That is the point — it is also a genuine loss of expressiveness, and if
a theme has a legitimate reason to differ structurally (**`[INFERENCE]`** — I do
not know whether any does; `sage-theme.ts` is the largest file at 5.7 KB and is
worth reading first), the base needs a narrow, named escape hatch rather than
being abandoned.

**A weaker alternative, if the refactor cannot be funded now:** keep the twelve
files, add the base theme as a spread (`createTheme(deepmerge(base, { palette }))`)
and land the contract test first. The test is the part with the highest value
per hour: it converts an invisible accessibility debt into a failing build, and
it works whether or not the refactor ever happens.

**What I would not do:** ship the site's two ramps as two more themes and call
it done. That adds thirteen and fourteen to a list of twelve and changes nothing
about the other twelve, which is where the users are.

---

## 3. The theme contract

The rules each of the twelve palettes must satisfy. These replace the site's
hexes, and they are the deliverable that makes a multi-theme app coherent.

### Required roles

Every theme must supply, at minimum:

| Role | Meaning | Site's equivalent |
|---|---|---|
| `canvas` | The page ground | `paper` |
| `surface` | One step raised: cards, panels, inputs | `surface` |
| `elevated` | Two steps raised: menus, popovers, hovered rows | `elevated` |
| `sunken` | One step recessed: wells, tracks, footers | `sunken` |
| `ink` | Primary text | `ink` |
| `ink-muted` | Secondary text | `ink-muted` |
| `ink-dim` | Tertiary text: captions, meta, placeholder | `ink-dim` |
| `ink-disabled` | Inactive control text | `ink-disabled` |
| `hairline` | Decorative 1px rule | `hairline` |
| `border-control` | **Structural** 1px boundary | `border-control` |
| `accent` | Primary action, active state, focus ring | `accent` |
| `on-accent` | Ink that sits on the accent fill | white / canvas |
| `success` / `warning` / `danger` | Semantic state | as named |

The **`border-control` role is the one most likely to be missing** from an
existing theme, because most palettes have exactly one border colour. Adding a
second, legally-distinct border value to twelve palettes is the single highest
accessibility return in this port.

### Required floors

| Assertion | Floor |
|---|---|
| `ink` on each of canvas / surface / elevated / sunken | ≥ 7:1 |
| `ink-muted` on each of the four | ≥ 4.5:1 |
| `ink-dim` on each of the four | ≥ 4.5:1 |
| `accent` as **text** on canvas and surface | ≥ 4.5:1 |
| `on-accent` on the `accent` fill | ≥ 4.5:1 |
| `border-control` on each of the four | ≥ 3:1 |
| Each semantic colour on canvas and on its own wash | ≥ 4.5:1 |
| Focus ring colour against every surface it can appear over | ≥ 3:1 |

`ink-disabled` is exempt, and is the only exemption.

### Required structural properties

- **Elevation is a lightness step, not a shadow.** A theme provides four surface
  values that are distinguishable from each other; it does not provide a shadow
  ladder.
- **Neutrals are consistently tinted.** The site's warm ramp holds `R > G > B`
  in light and `R ≥ G > B` in dark. A theme does not have to be warm — Iceberg
  is presumably cool **`[INFERENCE]`** — but its neutrals must be *consistently*
  tinted in one direction. Mixed-temperature neutrals are what make a palette
  look accidental.
- **One accent, spent about three times per screen.** A theme supplies one
  accent ramp, not a second decorative hue.

### The one thing that does not vary

The always-dark island (`#14110c` and its seven companions,
[`tokens.md` § 7](./tokens.md#7-the-always-dark-islands)) is theme-invariant on
the website because code and video quote the product's own night.

**In the app this is probably the wrong call. `[INFERENCE]`** A desktop app with
a light theme selected and a permanently-dark code block is a marketing device
applied to a working surface. The app already ships a `code-mirror-theme.ts`
alongside the palettes, which suggests code colour is meant to follow the theme
— that is the right instinct and it should win. Port the *syntax role structure*
(four roles plus a comment colour, no italics) and let the ground follow the
theme.

---

## 4. MUI 6 base theme skeleton

Every key below is a real MUI 6 theme key. The palette is a parameter; nothing
in this function knows what colour anything is.

```ts
import { createTheme, type Theme } from "@mui/material/styles";

/** The role contract from § 3. Each theme file supplies one of these. */
export type ThemePalette = {
	mode: "light" | "dark";
	canvas: string;
	surface: string;
	elevated: string;
	sunken: string;
	ink: string;
	inkMuted: string;
	inkDim: string;
	inkDisabled: string;
	hairline: string;
	borderControl: string;
	accent: string;
	accentHover: string;
	accentActive: string;
	accentWash: string;
	onAccent: string;
	success: string;
	successWash: string;
	successBorder: string;
	warning: string;
	warningWash: string;
	warningBorder: string;
	danger: string;
	dangerWash: string;
	dangerBorder: string;
};

/* Nine roles beyond the § 3 minimum, and each one is load-bearing rather than
   decorative: `accentWash` is the focus and hover tint (see `action.focus`), and
   the three wash/border pairs are what stop MUI's `augmentColor` from inventing
   an Alert's appearance. A theme that cannot supply them can derive them — the
   wash is the accent or semantic hue at the ramp's faintest tint, the border is
   the value that clears 3:1 against the theme's own canvas — but it must supply
   something, because the alternative is twelve themes of MUI arithmetic. */

/* ---- palette-independent constants, from this kit ---------------------- */

const RADIUS = { xs: 2, sm: 6, md: 10, lg: 14, frame: 16 } as const;

const DURATION = {
	instant: 80,
	fast: 120,
	base: 180,
	slow: 240,
	reveal: 320,
	draw: 480,
} as const;

const EASING = {
	outQuart: "cubic-bezier(0.25, 1, 0.5, 1)",
	outExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
	inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
} as const;

/**
 * MUI 6 applies `action.disabledOpacity` for the disabled state in eight
 * components — AccordionSummary, Autocomplete, Chip, ListItemButton, MenuItem,
 * PaginationItem, Rating, Tab — and `components.md` § 0 makes "disabled changes
 * colour, never opacity" a system rule, because an opacity-faded control fades
 * its own background too and ends up a different colour on `surface` than on
 * `sunken`. All eight are neutralised below with the same style object. The
 * list is written out so it can be checked against a future MUI version rather
 * than remembered.
 */
export const OPACITY_DISABLED_SLOTS = [
	"MuiAccordionSummary",
	"MuiAutocomplete",
	"MuiChip",
	"MuiListItemButton",
	"MuiMenuItem",
	"MuiPaginationItem",
	"MuiRating",
	"MuiTab",
] as const;

/**
 * MUI's `shadows` is a fixed 25-entry array indexed by the `elevation` prop.
 * The system has no elevation ladder, so almost every entry is `none`. The
 * four that are not are the default elevations MUI's own overlay components
 * ask for: AppBar 4, Menu/Popover 8, Drawer 16, Dialog 24. Filling exactly
 * those means an overlay gets the overlay shadow and an arbitrary
 * `<Paper elevation={6}>` gets nothing, which is the intent.
 */
const buildShadows = (overlay: string): Theme["shadows"] => {
	const s = Array.from({ length: 25 }, () => "none");
	for (const i of [4, 8, 16, 24]) s[i] = overlay;
	return s as unknown as Theme["shadows"];
};

export const createBaseTheme = (p: ThemePalette, overlayShadow: string) => {
	/* Colour-based disabled state, for the eight slots where MUI 6 applies
	   `action.disabledOpacity`. Spread into each of their `root` overrides. */
	const disabled = {
		"&.Mui-disabled": {
			opacity: 1,
			color: p.inkDisabled,
			cursor: "not-allowed",
			pointerEvents: "auto" as const,
		},
	};

	/* The only three properties this system transitions, ever. */
	const colourTransition = [
		`background-color ${DURATION.fast}ms ${EASING.outQuart}`,
		`border-color ${DURATION.fast}ms ${EASING.outQuart}`,
		`color ${DURATION.fast}ms ${EASING.outQuart}`,
	].join(", ");

	return createTheme({
		/* MUI 6 emits the palette as CSS custom properties, reachable as
		   `theme.vars.palette.*`. Turn it on: it is the only way a plain
		   stylesheet or a third-party widget can read theme colours. Note what
		   it does *not* buy you as written — see the paragraph after this
		   block. */
		cssVariables: true,

		spacing: 4, // the 4px base unit; theme.spacing(4) === 16px

		/* **The app's breakpoints, deliberately not the site's.** The site uses
		   640/768/1024/1280; the app uses these, and they are tuned to a desktop
		   window. Omitting the key entirely — which an earlier draft of this
		   skeleton did — silently moves `lg` from 1300 to MUI's default 1200 and
		   `xl` from 1800 to 1536, i.e. it relayouts every wide surface in the
		   app, inside the one commit whose stated property is that nothing
		   visual changes on the day it lands. */
		breakpoints: {
			values: { xs: 0, sm: 600, md: 900, lg: 1300, xl: 1800 },
		},

		shape: { borderRadius: RADIUS.md }, // the dominant 10px

		shadows: buildShadows(overlayShadow),

		transitions: {
			duration: {
				shortest: DURATION.instant,
				shorter: DURATION.fast,
				short: DURATION.base,
				standard: DURATION.base,
				complex: DURATION.slow,
				enteringScreen: DURATION.slow,
				leavingScreen: DURATION.base,
			},
			easing: {
				easeInOut: EASING.inOut,
				easeOut: EASING.outQuart,
				easeIn: EASING.outQuart,
				sharp: EASING.outExpo,
			},
		},

		palette: {
			mode: p.mode,
			primary: {
				main: p.accent,
				/* `dark` is MUI's *lightness* ramp, not this system's
				   hover/active ramp. `accentActive` happens to be darker than
				   `accent` in both themes, so it is a correct `dark`. There is
				   deliberately no `light`: in the light ramp this system's hover
				   is DARKER than main (`#116036` < `#177b45`), so mapping
				   `accentHover` to `primary.light` would invert the meaning of
				   every value MUI derives from it — Alert fills, `emphasize()`
				   on Chip, the LinearProgress track — and invert it differently
				   per theme. Hover and active are expressed as explicit
				   component `:hover` / `:active` overrides instead. Let MUI
				   lighten `main` for its own `light`, and do not read it. */
				dark: p.accentActive,
				contrastText: p.onAccent,
			},
			/* Semantic entries supply `main` and `contrastText` only. This
			   system's `*-wash` and `*-border` are ROLES, not a lightness ramp —
			   in the dark ramp the wash is darker than main and the border is
			   darker still, so there is no honest candidate for `.light`. MUI's
			   `augmentColor` will invent `.light`/`.dark` (verified: it produces
			   `success.light: rgb(75,149,113)`); the rule is simply **never read
			   `palette.<sev>.light` or `.dark` in app code** — if you want those
			   colours you want the wash or the border token, and `MuiAlert`
			   below binds them where MUI would otherwise have guessed. */
			success: { main: p.success, contrastText: p.onAccent },
			warning: { main: p.warning, contrastText: p.onAccent },
			error: { main: p.danger, contrastText: p.onAccent },
			background: { default: p.canvas, paper: p.surface },
			text: {
				primary: p.ink,
				secondary: p.inkMuted,
				disabled: p.inkDisabled,
			},
			divider: p.hairline,
			action: {
				// Explicit values, not MUI's alpha defaults: an opacity-based
				// hover produces a different colour on every surface.
				hover: p.elevated,
				selected: p.elevated,
				disabled: p.inkDisabled,
				disabledBackground: p.sunken,
				/* `action.focus` is consumed as a **backgroundColor** under
				   `.Mui-focusVisible` by MenuItem, ListItemButton,
				   AccordionSummary, Chip, Autocomplete options and
				   PaginationItem. Pointing it at the solid accent fills the
				   focused row with saturated green: `text.primary` on that fill
				   is 3.13:1 in the site's light ramp and 1.86:1 in its dark one,
				   and arbitrary in the other ten themes — on the densest
				   keyboard surface in a sidebar-and-list app. The focus ring in
				   `MuiCssBaseline` already expresses focus completely; nothing
				   needs a focus *fill*. The faint wash is the most this should
				   ever be. */
				focus: p.accentWash,
			},
		},

		typography: {
			fontFamily: "var(--font-sans)",
			fontSize: 16,
			htmlFontSize: 16,
			fontWeightRegular: 400,
			fontWeightMedium: 550,
			fontWeightBold: 600,

			// display-lg
			h1: {
				fontFamily: "var(--font-display)",
				fontSize: "3.75rem",
				lineHeight: 1.04,
				fontWeight: 400,
				letterSpacing: "-0.028em",
				fontOpticalSizing: "auto",
			},
			// heading-lg
			h2: {
				fontFamily: "var(--font-display)",
				fontSize: "2.5rem",
				lineHeight: 1.1,
				fontWeight: 400,
				letterSpacing: "-0.024em",
				fontOpticalSizing: "auto",
			},
			// heading-md
			h3: {
				fontFamily: "var(--font-display)",
				fontSize: "1.875rem",
				lineHeight: 1.15,
				fontWeight: 400,
				letterSpacing: "-0.02em",
				fontOpticalSizing: "auto",
			},
			// heading-sm
			h4: {
				fontSize: "1.25rem",
				lineHeight: 1.35,
				fontWeight: 560,
				letterSpacing: "-0.01em",
			},
			// subhead
			subtitle1: {
				fontSize: "1.1875rem",
				lineHeight: 1.55,
				fontWeight: 400,
				letterSpacing: "-0.005em",
			},
			// label
			subtitle2: {
				fontSize: "0.9375rem",
				lineHeight: 1.2,
				fontWeight: 550,
				letterSpacing: "-0.005em",
			},
			body1: { fontSize: "1rem", lineHeight: 1.65, fontWeight: 400 },
			body2: { fontSize: "0.875rem", lineHeight: 1.6, fontWeight: 400 },
			// button — MUI applies this to every Button label
			button: {
				fontSize: "0.9375rem",
				lineHeight: 1.2,
				fontWeight: 550,
				letterSpacing: "-0.005em",
				textTransform: "none",
			},
			// body-xs
			caption: { fontSize: "0.8125rem", lineHeight: 1.55, fontWeight: 400 },
			// eyebrow
			overline: {
				fontSize: "0.75rem",
				lineHeight: 1.2,
				fontWeight: 560,
				letterSpacing: "0.06em",
				textTransform: "uppercase",
			},
			// The remaining steps — body-lg, label-sm, mono-label, mono-data,
			// mono-code, display-md — have no built-in MUI slot. Declare them as
			// custom variants via module augmentation of `TypographyVariants` and
			// `TypographyPropsVariantOverrides`. The repo already does exactly
			// this for `gradientTitle` in shared/themes/theme-interfaces.ts, so
			// the pattern is established.
		},

		components: {
			MuiCssBaseline: {
				styleOverrides: {
					/* The three font families the `typography` block above
					   references. Without these the `var(--font-*)` lookups
					   fail, the whole declaration becomes invalid at
					   computed-value time, and every string in the app renders
					   in the UA default serif. The target defines no `--font-*`
					   properties today, so this block is not optional — and the
					   font files have to be packaged first: § 6 item 6, step 0.
					   `<CssBaseline/>` is mounted in the app, so this applies. */
					":root": {
						"--font-display":
							'"Fraunces Variable", ui-serif, Georgia, serif',
						"--font-sans":
							'"Figtree Variable", ui-sans-serif, system-ui, -apple-system, sans-serif',
						"--font-mono":
							'"JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
					},
					":focus-visible": {
						outline: `2px solid ${p.accent}`,
						outlineOffset: 2,
						borderRadius: "inherit",
					},
					/* The form-control exception to the one-ring rule. */
					"input:focus-visible, textarea:focus-visible, select:focus-visible":
						{ outlineOffset: 1 },
					"@media (prefers-reduced-motion: reduce)": {
						"*, *::before, *::after": {
							animationDuration: "0.01ms !important",
							animationIterationCount: "1 !important",
							transitionDuration: "120ms !important",
							scrollBehavior: "auto !important",
						},
					},
				},
			},

			MuiButtonBase: {
				// The ripple is decorative motion originating at the pointer.
				// This system's press feedback is a colour step. See motion.md.
				defaultProps: { disableRipple: true },
			},

			MuiButton: {
				defaultProps: { disableElevation: true },
				styleOverrides: {
					root: {
						borderRadius: RADIUS.sm, // 6px, not the dominant 10
						textTransform: "none",
						transition: colourTransition,
						"&:hover": { transform: "none", boxShadow: "none" },
						"&.Mui-disabled": {
							color: p.inkDisabled,
							cursor: "not-allowed",
							pointerEvents: "auto",
							opacity: 1, // colour, never opacity
						},
					},
					sizeSmall: { height: 32, paddingInline: 12 },
					sizeMedium: { height: 38, paddingInline: 16 },
					sizeLarge: { height: 48, paddingInline: 24 },
					contained: {
						backgroundColor: p.accent,
						color: p.onAccent,
						"&:hover": { backgroundColor: p.accentHover },
						"&:active": { backgroundColor: p.accentActive },
						"&.Mui-disabled": { backgroundColor: p.sunken },
					},
					outlined: {
						/* **`borderControl`, not `hairline`.** The fill is
						   transparent, so this border is the control's sole
						   boundary; `hairline` is 1.20:1 and `borderControl` is
						   3.63/4.47. It is the same defect as the 1.25:1 input
						   border that § 6 item 3 calls the app's worst
						   accessibility bug — prescribing it here while
						   condemning it there is the one contradiction this
						   document must not ship. components.md § 2. */
						borderColor: p.borderControl,
						color: p.ink,
						"&:hover": { borderColor: p.inkMuted, backgroundColor: p.elevated },
						"&:active": { borderColor: p.inkMuted, backgroundColor: p.sunken },
						"&.Mui-disabled": { borderColor: p.hairline },
					},
					text: {
						color: p.inkMuted,
						"&:hover": { backgroundColor: p.elevated, color: p.ink },
					},
				},
			},

			MuiPaper: {
				defaultProps: { elevation: 0 },
				styleOverrides: {
					root: {
						backgroundImage: "none", // MUI's dark-mode overlay tint
						borderRadius: RADIUS.md,
					},
					outlined: { border: `1px solid ${p.hairline}` },
				},
			},

			MuiCard: {
				defaultProps: { elevation: 0, variant: "outlined" },
				styleOverrides: {
					root: {
						backgroundColor: p.surface,
						border: `1px solid ${p.hairline}`,
						borderRadius: RADIUS.md,
						boxShadow: "none", // elevation is a background step
					},
				},
			},

			MuiOutlinedInput: {
				styleOverrides: {
					root: {
						borderRadius: RADIUS.sm,
						height: 38, // components.md § 3; 48 at size lg
						backgroundColor: p.surface,
						"&:hover .MuiOutlinedInput-notchedOutline": {
							borderColor: p.inkMuted,
						},
						/* Inputs are the second exception to the one-ring rule:
						   same colour, same width, offset 1px. components.md § 3. */
						"&.Mui-focused": { outlineOffset: 1 },
						"&.Mui-disabled": {
							backgroundColor: p.sunken,
							"& .MuiOutlinedInput-notchedOutline": { borderColor: p.hairline },
						},
					},
					// The structural border. This is the single most important
					// override in the file: it is the one that clears SC 1.4.11.
					notchedOutline: { borderColor: p.borderControl, borderWidth: 1 },
					input: { "&::placeholder": { color: p.inkDim, opacity: 1 } },
				},
			},

			MuiInputLabel: {
				/* Above the field, 6px clear, `label` step, muted — never a
				   floating label inside the box, which is a placeholder wearing
				   a label's job. components.md § 3. */
				defaultProps: { shrink: true },
				styleOverrides: {
					root: {
						position: "static",
						transform: "none",
						marginBottom: 6,
						fontSize: "0.9375rem",
						fontWeight: 550,
						color: p.inkMuted,
						"&.Mui-focused": { color: p.inkMuted },
					},
				},
			},

			MuiFormHelperText: {
				styleOverrides: {
					root: {
						marginLeft: 0,
						fontSize: "0.8125rem",
						color: p.inkDim,
						"&.Mui-error": { color: p.danger },
					},
				},
			},

			MuiChip: {
				styleOverrides: {
					root: {
						...disabled,
						borderRadius: RADIUS.xs, // 2px. Chips are not pills here.
						height: 22,
						fontFamily: "var(--font-mono)",
						fontSize: "0.75rem",
						letterSpacing: "0.08em",
						textTransform: "uppercase",
					},
				},
			},

			MuiTooltip: {
				styleOverrides: {
					tooltip: {
						backgroundColor: p.elevated,
						color: p.ink,
						border: `1px solid ${p.hairline}`,
						borderRadius: RADIUS.sm,
						fontSize: "0.8125rem",
					},
				},
			},

			MuiDialog: {
				styleOverrides: { paper: { borderRadius: RADIUS.lg } },
			},

			MuiDrawer: {
				styleOverrides: { paper: { backgroundColor: p.canvas } },
			},

			MuiTabs: {
				styleOverrides: {
					indicator: { height: 2, backgroundColor: p.accent },
				},
			},

			MuiTab: {
				styleOverrides: {
					root: {
						...disabled,
						textTransform: "none",
						minHeight: 44,
						color: p.inkDim,
						"&.Mui-selected": { color: p.ink },
					},
				},
			},

			/* MUI's own internal glyphs only — the Select chevron, the Alert
			   severity icons, the Autocomplete clear button. It has no effect on
			   `lucide-react`, which § 8 makes the app's icon library; lucide's
			   defaults are set by a props context, shown after this block. */
			MuiSvgIcon: {
				defaultProps: { fontSize: "small" },
			},

			MuiLink: {
				defaultProps: { underline: "always" },
				styleOverrides: {
					root: {
						color: p.accent,
						textDecorationThickness: 1,
						textUnderlineOffset: 3,
						"&:hover": { color: p.accentHover },
					},
				},
			},

			/* ---- the four slots every theme file currently repeats ---------
			   § 0 records that all twelve themes define MuiAppBar,
			   MuiListItemButton, MuiIconButton, MuiButton, MuiCard and
			   MuiContainer. Four of the six were missing from this skeleton,
			   which would have made the extraction a deletion rather than a
			   merge. Read each theme's existing block before replacing it: what
			   is below is the system's answer, not necessarily the app's
			   current behaviour. */

			MuiAppBar: {
				defaultProps: { elevation: 0, color: "transparent" },
				styleOverrides: {
					root: {
						/* The header is a background step plus a hairline, never
						   a shadow — tokens.md § 11. Must absorb: whatever each
						   theme's AppBar currently sets for background and
						   border, plus the app's own scrolled/unscrolled logic
						   if it has one. */
						backgroundColor: p.canvas,
						borderBottom: `1px solid ${p.hairline}`,
						boxShadow: "none",
						backgroundImage: "none",
					},
				},
			},

			MuiListItemButton: {
				styleOverrides: {
					root: {
						...disabled,
						borderRadius: RADIUS.sm,
						/* Not `transition: all` — § 8 item 2. Transitioning
						   `all` animates layout properties by accident and
						   costs a frame budget on a long list. */
						transition: colourTransition,
						"&:hover": { backgroundColor: p.elevated },
						"&.Mui-selected": {
							backgroundColor: p.accentWash,
							color: p.ink,
							"&:hover": { backgroundColor: p.accentWash },
						},
						/* The `divider` prop draws a row rule that is the only
						   boundary between two rows of content — structural, not
						   decorative. See § 5 on `divider`. */
						"&.MuiListItemButton-divider": {
							borderBottomColor: p.borderControl,
						},
					},
				},
			},

			MuiIconButton: {
				styleOverrides: {
					/* The only home for the kit's two icon-only sizes:
					   `icon-sm` is 32px with a 16px glyph, `icon` is 38px with
					   a 20px glyph. components.md § 2. MUI's own `small` and
					   `medium` are 34px and 40px, so both need setting. */
					root: { ...disabled, borderRadius: RADIUS.sm, color: p.inkMuted },
					sizeSmall: { width: 32, height: 32, "& svg": { width: 16, height: 16 } },
					sizeMedium: { width: 38, height: 38, "& svg": { width: 20, height: 20 } },
				},
			},

			MuiContainer: {
				styleOverrides: {
					/* The container ladder, tokens.md § 9. MUI's maxWidth props
					   map onto the four widths; there is no fifth. The gutter
					   ramp is the app's own responsibility because it is tied to
					   the app's breakpoints, not the site's. */
					maxWidthSm: { maxWidth: "36rem !important" }, // measure
					maxWidthMd: { maxWidth: "56rem !important" }, // narrow
					maxWidthLg: { maxWidth: "72rem !important" }, // default
					maxWidthXl: { maxWidth: "84rem !important" }, // wide
				},
			},

			/* ---- the divider carve-out (§ 5) ------------------------------- */

			MuiDivider: {
				styleOverrides: {
					/* Decorative by default, which is what `divider` means. */
					root: { borderColor: p.hairline },
				},
			},

			MuiTableCell: {
				styleOverrides: {
					/* A row rule IS the only boundary between two rows of
					   required content, so it is structural: `border-control`,
					   not `divider`. components.md § 11. */
					root: { borderBottomColor: p.borderControl },
					head: {
						height: 40,
						backgroundColor: p.sunken,
						color: p.inkDim,
						fontFamily: "var(--font-mono)",
						fontSize: "0.75rem",
						letterSpacing: "0.08em",
						textTransform: "uppercase",
					},
					body: { height: 52 },
				},
			},

			/* ---- the remaining opacity-disabled slots (see `disabled`) ----- */

			MuiAccordionSummary: { styleOverrides: { root: disabled } },
			MuiAutocomplete: { styleOverrides: { option: disabled } },
			MuiPaginationItem: { styleOverrides: { root: disabled } },
			MuiRating: { styleOverrides: { root: disabled } },

			MuiMenuItem: {
				styleOverrides: {
					root: {
						...disabled,
						minHeight: 32,
						paddingLeft: 12,
						paddingRight: 12,
						"&:hover": { backgroundColor: p.accentWash },
						"&.Mui-selected": { color: p.accent, backgroundColor: "transparent" },
					},
				},
			},

			/* ---- the alert, so the wash tokens actually reach one ---------- */

			MuiAlert: {
				styleOverrides: {
					/* MUI derives a standard Alert's fill from
					   `palette.<sev>.light`, which this system does not supply
					   (see the palette block). Binding the three washes and
					   three borders here is what makes an Alert look like
					   components.md § 9 instead of like MUI. */
					standardSuccess: { backgroundColor: p.successWash, border: `1px solid ${p.successBorder}`, color: p.ink },
					standardWarning: { backgroundColor: p.warningWash, border: `1px solid ${p.warningBorder}`, color: p.ink },
					standardError: { backgroundColor: p.dangerWash, border: `1px solid ${p.dangerBorder}`, color: p.ink },
					root: { borderRadius: RADIUS.sm },
					icon: { color: "inherit" },
				},
			},
		},
	});
};
```

Then, outside the theme, the icon default — because the icon library is not MUI:

```tsx
import { IconContext } from "lucide-react";

/* § 8 makes lucide the single icon library, at 14/16/20/24 and stroke 1.75.
   `MuiSvgIcon.defaultProps` has no effect on lucide: they are unrelated
   component trees. lucide reads its defaults from this context, which is the
   mechanism the reference site uses, and it is the only place the stroke weight
   should ever be written. */
export const IconDefaults = ({ children }: { children: React.ReactNode }) => (
	<IconContext.Provider value={{ size: 16, strokeWidth: 1.75 }}>
		{children}
	</IconContext.Provider>
);
```

Mount it once, inside `ThemeProvider`. The `MuiSvgIcon` default in the theme
stays, but its only job now is MUI's *own* internal glyphs — the Select chevron,
the Alert severity icons, the Autocomplete clear button — which is a much smaller
claim than the one the skeleton used to make.

Two MUI 6 features worth using deliberately:

- **`cssVariables: true`** emits the palette as custom properties and gives you
  `theme.vars.palette.*`. Its real value here is that non-MUI surfaces in the app
  (CodeMirror, ag-grid, Recharts, plain stylesheets) can read the current theme's
  colours without a prop drill. **It does not, by itself, avoid re-rendering on a
  theme switch** — an earlier draft of this file claimed it did. Every override
  above interpolates closure values (`p.hairline`, `p.accent`), so switching
  themes swaps the theme object and re-renders the tree regardless. To get the
  re-render property you have to write the colour-bearing overrides in function
  form and read the variables instead of the closure:

  ```ts
  MuiCard: {
  	styleOverrides: {
  		root: ({ theme }) => ({
  			backgroundColor: theme.vars.palette.background.paper,
  			border: `1px solid ${theme.vars.palette.divider}`,
  		}),
  	},
  },
  ```

  That is a real refactor across every colour-bearing slot, and it is worth doing
  only if a theme switch measurably janks. Decide it deliberately; do not assume
  the flag bought it.

- **`colorSchemes: { light, dark }`** plus **`theme.applyStyles("dark", {...})`**
  is MUI 6's supported way to express a light/dark pair inside one theme.
  **`[INFERENCE]`** Whether it fits here depends on whether the twelve themes are
  conceptually twelve independent palettes or six light/dark pairs; from the
  names they look independent, in which case a plain per-theme palette is simpler
  and `colorSchemes` adds a concept for nothing.

  **If you do enable it, set `colorSchemeSelector: "class"`.** MUI's default is
  `"media"`, which attaches the light/dark decision to `prefers-color-scheme` —
  a *second* theme signal beside the preferences store, arriving silently as a
  side effect of following the recommendation above. The app has exactly one theme
  signal today and that is worth keeping; see § 9 item 7 for why, and for the
  four-line check that keeps it true.

### This skeleton was compiled and run

Not just type-checked. Against `@mui/material@6.4.2` under `tsc --strict`: exit
0, no errors. Then executed with the site's light palette, and the produced theme
object inspected, because four of the corrections above are things a type checker
cannot see:

| Checked | Result |
|---|---|
| `breakpoints.values` | `{xs:0, sm:600, md:900, lg:1300, xl:1800}` — the app's. Omitting the key, as an earlier draft did, yields MUI's `lg:1200, xl:1536` |
| `palette.action.focus` | `#e7f1e8` — the wash, not the accent |
| `MuiButton.styleOverrides.outlined.borderColor` | `#857f70` — `border-control`, not the hairline |
| `palette.primary` | `main`/`dark`/`contrastText` as supplied; `light` auto-derived to `rgb(69,149,106)`, which is why the rule is *do not read it* |
| `palette.success` | `light` auto-derived to `rgb(75,149,113)` and `dark` to `rgb(21,86,54)` — neither is the kit's wash or border, which is why `MuiAlert` binds those directly |
| `shadows[8]` / `shadows[6]` | The overlay shadow / `"none"` — an overlay gets a shadow, an arbitrary `elevation={6}` does not |
| `theme.vars` | Present, so `cssVariables: true` took effect |

Run the same check after any edit to the skeleton. A theme object is easy to get
wrong in ways that compile.

---

## 5. Token → MUI theme-key mapping

Every key below exists in MUI 6.

### Colour

| Kit token | MUI key |
|---|---|
| `paper` / canvas role | `palette.background.default` |
| `surface` | `palette.background.paper` |
| `elevated` | `palette.action.hover`, `palette.action.selected`; menu/popover `Paper` via `components.MuiPaper` |
| `sunken` | `palette.action.disabledBackground`; wells via component overrides |
| `band` | **No MUI slot.** Custom palette key via module augmentation. |
| `ink` | `palette.text.primary` |
| `ink-muted` | `palette.text.secondary` |
| `ink-dim` | **No MUI slot** (MUI has no third text step). Custom key — the repo already augments `Palette` with a `caption: string`, which is the natural home. |
| `ink-disabled` | `palette.text.disabled`, `palette.action.disabled` |
| `hairline` | `palette.divider` — **with a carve-out**, below |
| `hairline-strong` | **No MUI slot.** Custom key. |
| `border-control` | **No MUI slot.** Custom key, *and* `components.MuiOutlinedInput.styleOverrides.notchedOutline.borderColor` |
| `accent` | `palette.primary.main` |
| `accent-hover` | **Not `palette.primary.light`** — that inverts in the light ramp. Explicit `:hover` overrides on the components that need it (§ 4) |
| `accent-active` | `palette.primary.dark`, which is a correct *lightness* claim in both themes, **and** explicit `:active` overrides |
| `on-accent` | `palette.primary.contrastText` |
| `accent-wash` | **No MUI slot.** Custom key. |
| `accent-muted` | **No MUI slot.** Custom key. |
| `success` / `warning` / `danger` | `palette.success.main` / `palette.warning.main` / `palette.error.main` |
| `*-wash` | **Not `palette.<sev>.light`.** Custom keys, plus `components.MuiAlert.styleOverrides.standard<Sev>` — see § 4 for why the wash is not a lightness step |
| `*-border` | Custom keys, plus the same `MuiAlert` slots |
| Focus ring colour | The explicit `:focus-visible` rule in `MuiCssBaseline`. **`palette.action.focus` is a background**, not a ring colour — six components fill with it. Point it at `accent-wash` or leave MUI's alpha default; never at the accent itself (§ 4) |
| `island*` | Custom keys, or better: follow the theme (§ 3) |

**The `divider` carve-out**, which is the sole-boundary defect arriving through a
mapping table rather than through a component. `palette.divider = hairline` is
right for what `divider` *means* —
decorative separation. But MUI spends `divider` on three things that are not
decorative: `<Divider>` used as a real content separator, `<TableCell>` borders,
and the `divider` prop on `ListItemButton`. Each of those is a 1px rule that is
the **only** boundary between two blocks of required content, which
[`tokens.md` § 4](./tokens.md#4-lines-two-decorative-weights-and-one-structural)
makes mandatory `border-control`. In a data-dense desktop app that is the 1.2:1
rule reintroduced at scale, in the same port whose flagship fix is a structural
border.

So: keep `divider = hairline`, and override the three places it becomes
structural — `MuiTableCell.root.borderBottomColor`,
`MuiListItemButton` `&.MuiListItemButton-divider`, and any `<Divider>` that
separates content rather than decorating a gap, via a variant or a wrapper. The
skeleton in § 4 does the first two. The third needs a judgement per call site,
which is the honest answer: MUI cannot tell a rule that groups from a rule that
bounds, and neither can a token.

**Do not use `palette.grey`.** MUI's grey ramp is cool and is a fallback for
components you have not styled. Style the components.

**Supply `contrastText` explicitly on every palette entry.** MUI has no switch
that turns off automatic contrast text — `palette.contrastThreshold` only moves
the black/white decision point, and `getContrastText` still answers when asked.
So the rule is three concrete things rather than a setting:

1. Give every palette entry an explicit `contrastText` from the theme's
   `on-accent` role, as the skeleton does.
2. Assert `on-accent` on the `accent` fill at ≥ 4.5:1 in the contract test. That
   assertion is what actually prevents the 3.20:1 white-on-green this document
   opens with.
3. Never call `getContrastText` in app code. Confirmed against 6.4.2:
   `getContrastText('#38c96a')` returns `rgba(0,0,0,0.87)` at the default
   threshold — a plausible-looking answer that has nothing to do with the
   theme's own ink.

### Everything else

| Kit token | MUI key |
|---|---|
| `--spacing` 4px | `spacing: 4` — then `theme.spacing(n)` is the ramp |
| `--radius-md` (dominant) | `shape.borderRadius` |
| `--radius-xs/sm/lg/frame` | Not theme keys — constants applied in `components` overrides |
| `--shadow-overlay` | `shadows[4]`, `[8]`, `[16]`, `[24]`; everything else `"none"` |
| `--shadow-frame` | Not a theme key — applied directly by the capture component |
| `--duration-instant` | `transitions.duration.shortest` |
| `--duration-fast` | `transitions.duration.shorter` |
| `--duration-base` | `transitions.duration.short` and `.standard` |
| `--duration-slow` | `transitions.duration.complex`, `.enteringScreen` |
| `--ease-out-quart` | `transitions.easing.easeOut` (and `easeIn`) |
| `--ease-out-expo` | `transitions.easing.sharp` |
| `--ease-in-out` | `transitions.easing.easeInOut` |
| Type steps | `typography.h1`…`overline` where a slot fits; custom variants otherwise |
| `--font-display/sans/mono` | `typography.fontFamily` and per-variant `fontFamily` |
| Container widths | `components.MuiContainer.styleOverrides.maxWidth*` |
| Breakpoints | `breakpoints.values` |

> **Breakpoints do not port.** The site uses 640 / 768 / 1024 / 1280; the app
> uses **600 / 900 / 1300 / 1800**. Keep the app's — they are tuned to a desktop
> window, and changing them would move every existing layout. But the type
> scale's *step-up points* are expressed against the site's breakpoints and must
> be re-expressed: the display step-up at 640 becomes 600, and the section
> rhythm ladder's four columns map to `xs / sm / lg / xl` in the app's values.

---

## 6. Highest-leverage surfaces, in order

Ordered by *change per unit of risk*, not by visual prominence. Each item says
what it buys.

**`[INFERENCE]` on which screens contain these** — the ordering is by system
layer, which I can see, not by app screen, which I cannot.

1. **The base theme extraction and the contrast contract test (§ 2, § 3).**
   Nothing visual changes on the day it lands. It is first because every
   subsequent item is twelve times cheaper afterwards, and because the test
   converts an invisible accessibility debt into a failing build.

2. **`MuiCssBaseline`: the focus ring and the reduced-motion floor.** Two rules,
   applies to every control in the app at once, and it is the single largest
   accessibility improvement available for the effort. MUI's default focus
   treatment varies by component; this makes it one thing.

3. **`MuiOutlinedInput.notchedOutline` → the structural border.** Verified: the
   current light theme's input border is `rgba(0,0,0,0.1)`, **1.25:1** on white.
   Every text field, select and search box in the app is currently a control
   whose only boundary is invisible to a low-vision user. One override, twelve
   themes, whole-app effect.

4. **`MuiButton`: radius 6, `disableRipple`, `disableElevation`, colour-only
   transitions, colour-not-opacity disabled.** Buttons are the most repeated
   interactive element; getting them right propagates the register everywhere.
   The ripple is also the most visible piece of motion in the app that this
   system does not permit.

5. **`MuiPaper` / `MuiCard`: `backgroundImage: none`, `boxShadow: none`,
   `variant: outlined` by default.** This is the elevation-strategy switch, and
   it is the change that most visibly converts "MUI app" into "this system".
   MUI's dark-mode `backgroundImage` overlay in particular is a white-alpha
   gradient that fights any tinted neutral ramp. The current `MuiCard` override
   ships `boxShadow: "0 2px 8px rgba(0,0,0,0.05)"` and `borderRadius: 12`; both
   change.

6. **Typography: the scale and the two faces.** Currently
   `"system-ui, Inter, -apple-system, BlinkMacSystemFont, sans-serif"` at
   `fontSize: 16`.

   **Step 0, and it is not optional: package the fonts.** The app ships only
   Roboto Mono and Geist Mono today and defines no `--font-*` properties. Add
   Figtree (and Fraunces, if the § 7 open question resolves in its favour) as
   packaged assets with the woff2 and subset treatment in
   [`typography.md` § 5](./typography.md#5-self-hosting-and-licensing), load them
   from a packaged resource path rather than a remote URL, and only then land the
   `:root` font declarations in `MuiCssBaseline` (§ 4). Skipping this makes the
   most visible step in the port fail for a reason invisible in the theme file:
   an unresolved `var(--font-sans)` is an invalid declaration, so every string in
   the app falls back to the UA default serif.

   Then land the body face and the full step scale together; the display serif
   is a separate, more debatable decision (§ 8).

7. **The chat/message surface. `[INFERENCE]`** Named as a guess from
   `palette.userMessage` and `palette.messagesView` in `theme-interfaces.ts`. If
   the app is a chat interface, this is where a user spends their time, it is
   the densest text on screen, and the current light theme gives message grounds
   as `rgba(66,133,244,0.12)` and `rgba(54,81,124,0.12)` — a **blue** cast in a
   green-accented product, which is a second accent hue by accident.

8. **The sidebar. `[INFERENCE]`** From `palette.sidebar`, which is the largest
   custom palette group. Verified problem: `itemActiveText` `#2BA458` on
   `background` `#E8EEF2` is **2.74:1** — the *active* item is the least legible
   text in the group.

9. **Icon unification.** Pick one library. `lucide-react` is already installed,
   matches the site, and is a tree-shaken SVG set; the four FontAwesome packages
   are a second icon language and a second bundle. Then fix sizes to 14 / 16 /
   20 / 24 and stroke width to 1.75.

10. **Voice pass over user-visible strings.** Cheap, high-visibility, no
    rendering risk. Start with buttons, empty states and error messages, which
    are read under load. See [`voice.md`](./voice.md).

**Deliberately last:** anything that is a full component rewrite, and anything
that touches CodeMirror, ag-grid, Recharts or the Markdown renderer. Those read
theme colours through their own APIs, and they are much easier once
`cssVariables: true` gives them `theme.vars.palette.*` to read.

---

## 7. What does NOT port

Be explicit about this, because a kit derived from a marketing site invites
over-application.

| Does not port | Why |
|---|---|
| **The two colour ramps** | Users pick a theme. The ramps become the role-and-floor contract in § 3, not values. |
| **The specific greens** | `#177b45` and `#38c96a` are *this site's* accent. A theme's accent is its own; it must merely satisfy the floors. |
| **The always-dark island** | A permanently-dark code block inside a user-selected light theme is a marketing device on a working surface. Port the four-role syntax structure, not the fixed ground. |
| **The component-library compatibility layer** | The site's second set of variable names exists for one specific component library. It is not a design decision. |
| **The site's breakpoints** | 640/768/1024/1280 vs the app's 600/900/1300/1800. Keep the app's; re-express the step-up points against them. |
| **The scroll-driven-animation fallback layer** | One engine, known version. Ship the native path and delete the fallback. See [`motion.md` § 3](./motion.md#3-scroll-linked-patterns). |
| **Scroll-linked entrances themselves, mostly** | A marketing page reveals content as you scroll because the reader is browsing. An application surface a user visits fifty times a day must not animate its content in on every visit. Keep the entrance for genuinely new content arriving; delete it everywhere else. |
| **The capture-frame motif** | It solves "a screenshot of a dark app on a warm light page". An app does not contain screenshots of itself. The *underlying* rule — an embedded image of unknown ground gets a mat, a frame and a caption — does port, for user-supplied images and previews. |
| **The hand-drawn underline, the delegation orbit, the dot field** | Brand marks with a per-page budget. In an app they would be seen thousands of times and become wallpaper. |
| **The section rhythm ladder's largest steps** | 128px of vertical padding between bands is right for a scrolling narrative and wrong for a dense working surface. Port the 4px base, the permitted ramp and the three-tier grouping rule; re-derive the section values for app density. |
| **`text-wrap: balance` on every heading** | Correct for a marketing headline that must rag well. On dynamic content of unpredictable length it costs layout work for no benefit. |
| **The container ladder as-is** | Four fixed max-widths suit a document. An app window is resizable and often split. Port the **reading measures** (68 / 62 / 46 ch), which matter more, and keep the app's own container logic. |
| **The `#38c96a`-on-white pairing, in any form** | 2.16:1. It is the one hard prohibition in this document. |

### An open question, stated rather than decided

**The display serif.** Fraunces is a marketing-register choice: it says "a
well-made thing" to someone deciding whether to download. An app the user is
inside for hours has different priorities, and a serif in a dense tool can read
as costume. **Recommendation:** adopt **Figtree for everything** in the app,
port the full type scale unchanged (it does not encode a face), and treat the
display serif as a separate proposal evaluated on a real screen — the onboarding
and empty states are where it would plausibly earn its place. This is a
recommendation, not a ruling; whoever owns the app's identity should make it,
and the scale survives either answer.

---

## 8. Iconography and the other cross-cutting rules

| Rule | Value |
|---|---|
| Library | One. `lucide-react` is installed and matches the site. |
| Sizes | 14, 16, 20, 24. Nothing else. |
| Stroke width | 1.75, set once via lucide's props context (§ 4), never per call site. `MuiSvgIcon.defaultProps` cannot do this — it is a different component tree. |
| Colour | `ink-dim` at rest; `ink` when interactive or hovered; semantic only when carrying state; accent only when marking selected or active. |
| Containers | **None.** No rounded tinted tile behind an icon, ever. |
| Density | One icon per card, maximum. |
| Placement | Inline before text at 16px on the baseline, or alone in a 20px control slot. Never on its own line above a heading. |
| Accessibility | `aria-hidden` unless the icon is the sole content of a control, in which case the *control* carries the name. |

### Three existing patterns this system prohibits

Found while reading `theme-interfaces.ts` and `light-theme.ts`:

1. **The `gradientTitle` typography variant** is a `background-clip: text`
   gradient with a `textShadow`. This system permits no gradient on any heading.
   Retire the variant; do not re-point it.
2. **`transition: "all 0.2s ease-in-out"`** on `MuiListItemButton`. Transitioning
   `all` includes layout properties, so a width or padding change animates by
   accident and costs a frame budget on a list. Transition
   `background-color, border-color, color` and nothing else.
3. **`palette.icon.background`** — a tinted ground behind an icon — is the icon
   tile this system bans. Remove the role rather than re-colour it.

---

## 9. Verification, before calling any of this done

Not unit tests. These are the checks that catch what unit tests miss.

1. **Run the contrast contract across all twelve themes.** It is the
   deliverable, not a formality. Start from
   [`contrast-contract.mjs`](./contrast-contract.mjs) in this kit: it already
   holds against the site's own palette (669 assertions, exit 0), so porting it
   is replacing its `load()` with a loop over your twelve palettes and keeping
   the tables. Anything it reports as an exception must be re-argued for your
   palettes, not inherited.
2. **Tab through every changed surface** with the pointer untouched, in the
   default theme and in one light theme. The focus ring must be visible on every
   stop, never clipped, and never a rectangle around a rounded control.
3. **Turn on Reduce Motion at the OS level** and re-walk the changed surfaces.
   Check the table in [`motion.md` § 4](./motion.md#4-the-prefers-reduced-motion-contract):
   every piece of information the motion carried must still be there.
4. **Screenshot each changed surface in the two most-used themes** and in one
   community theme, before and after. A theme-level regression is invisible in
   the theme you developed in.
5. **Zoom to 200%** on the densest surface. The container and measure changes
   are the ones that break here.
6. **Check the disabled states** by colour, not opacity: a disabled control on
   `surface` and the same control on `sunken` must be the same colour. Walk all
   eight slots in `OPACITY_DISABLED_SLOTS` (§ 4) — a missed one is invisible
   until someone disables that specific component.
7. **Enforce, in the port's design-system check, that every themed property
   derives from one signal.** The bug class worth guarding against is *two
   independent inputs that usually agree* — OS colour preference against a pinned
   theme, a class against a media query, locale against layout direction. They
   agree for almost every user almost all of the time, which is exactly why the
   disagreement is never exercised and why it survives review: the cells you hit
   by accident are the ones where the two agree.

   In this app the property is checkable in about four lines, because it is a
   count rather than a matrix. Verified in the target: `theme-provider.tsx` reads
   a single `themeName` from the preferences store and passes
   `getTheme(themeName)` to `MuiThemeProvider`; `ThemeName` is twelve explicit
   names with **no "system" option**; and `prefers-color-scheme` has **zero
   consumers** in application source. So the rule is *`prefers-color-scheme`
   appears zero times outside documentation*, failing the build if it does. Write
   it as a lint rule, not as a paragraph — a property stated in a handoff decays
   the first time somebody adds a `dark:` variant or a `<source media>` in good
   faith, and a property nobody can violate beats a property everybody agrees
   with.

   **Scope the grep to the whole repository, excluding dependencies and build
   output — not to `src/`.** This check is vulnerable to the exact failure it
   guards against, and it failed that way once already while this kit was being
   written: a correct query, honestly reported, scoped to the source directory,
   which missed the entry HTML's pre-paint script — the single most load-bearing
   consumer of the signal on the reference site. In an Electron app the entry
   HTML, the preload and main-process files and the packaging templates all sit
   outside `src/` and all can carry a media query.

   > **A check's scope is itself a claim.** Everything else in this kit's review
   > looked like a mistake. That one looked like evidence. It is the same failure
   > as the item above at a different level: one is two inputs nobody crossed,
   > the other is one query nobody bounded.

   **The first thing that rule will catch is this kit.**
   [`tokens.css`](./tokens.css) ships a third dark-theme mechanism —
   `@media (prefers-color-scheme: dark)` — and pasting the file in unedited
   imports exactly the second signal this item exists to prevent. Delete that
   block when you adopt the file. It is labelled in place, twice, and it is
   correct on the marketing site for the reason above: the site offers a system
   theme choice and this app does not.

   > **State the rule causally, because the causes are what make it portable.**
   > The app may hold `prefers-color-scheme` to zero consumers for two reasons
   > and only those two: it has **no system theme option** (twelve explicit
   > names, one store), and it has **no theme-paired image element** (a
   > `<picture>` cannot read a class, so a `<source media>` has no other selector
   > available to it). If the app ever gains either, the rule inverts on its own
   > logic instead of needing to be re-argued.
   >
   > **The reference website has both, which is why the same check must never be
   > pointed at it.** It offers a system theme choice *and* ships a theme-paired
   > capture, so `prefers-color-scheme` is a legitimate source of truth there
   > with **five** application call sites: the pre-paint inline script that
   > resolves the system choice before first paint, the same query in the theme
   > hook keeping the resolved theme in step, the `<source media>` that picks the
   > paired file, and the two `@media` blocks that match the mat's colour to
   > whichever file that forced choice served
   > ([`components.md` § 7](./components.md#7-capture-frame)). Those last three
   > would exist even with no system option at all. A zero-consumers rule aimed
   > at that repo fails on five pieces of correct code.

   **The specific way a second signal would enter this app** comes in through a
   recommendation in this very document: if you adopt `colorSchemes: { light,
   dark }` alongside `cssVariables: true`, MUI's default `colorSchemeSelector` is
   **`"media"`** — it attaches to `prefers-color-scheme`. That adds a second theme
   signal beside the preferences store, silently. Set
   **`colorSchemeSelector: "class"`** (or a data attribute) driven by the same
   store that drives the theme, or do not enable `colorSchemes` at all.

   Enumerate a matrix only to *find* a disagreement you already suspect; once
   found, fix the wiring and then enforce the axis. Twelve themes crossed with an
   OS preference is 24 cells, which is a check that passes once and is skipped
   forever.

   The same discipline applies to a **fix**: a proposed remedy deserves the same
   scrutiny as the defect. The characteristic failure is to reason from three
   observed cells and a plausible story about the fourth, repair the reported
   cell, and break the one nobody looked at.

---

*Derived from this kit, and from first-hand inspection of `package.json`,
`shared/themes/index.ts`, `shared/themes/theme-interfaces.ts`,
`shared/themes/light-theme.ts` and `shared/types/theme.ts` on
`damianvtran/local-operator-ui`, 2026-08-03. Contrast figures for the app's own
theme were computed from the hexes in `light-theme.ts` using the WCAG
relative-luminance formula. Every MUI theme key and component style-override
slot named in § 4 and § 5 was checked against the published type definitions of
`@mui/material@6.4.2` and `@mui/system@6.4.2`. Everything about the app's
screens is marked `[INFERENCE]`.*
