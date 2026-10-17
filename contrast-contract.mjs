#!/usr/bin/env node
/**
 * The contrast contract, executable.
 *
 *     node contrast-contract.mjs
 *
 * Reads ./tokens.json, recomputes every foreground x ground pair this system
 * permits, and asserts the floors in tokens.md § 1. Exits non-zero on a
 * violation. No dependencies, no build step, plain `node` >= 18.
 *
 * Why this file exists. The rest of the kit states 131 ratios as prose, which
 * means the kit is true on the day it was written and unverifiable afterwards.
 * A hand-maintained table cannot notice that a token was nudged one step for
 * aesthetics. This can.
 *
 * The three things it does that a token-pair checker does not:
 *
 *   1. It asserts over COMPONENT TRIPLES (ground + fill + border + ink), not
 *      just token pairs. A control's boundary is legal if EITHER its fill or
 *      its border clears 3:1 against the ground behind it. That is the
 *      assertion that catches "the fill is 1.06:1 and the border is 1.20:1, so
 *      the control has no perceivable edge" — the failure that was shipped in
 *      the spec's own Button table and is corrected in components.md § 2.
 *   2. It treats a colour used as a BACKGROUND as a ground, so pointing a
 *      focus-fill token at a saturated accent fails here instead of shipping.
 *   3. Every accepted sub-floor pair is PINNED to its measured ratio. An
 *      exemption is not a mute button: change the token and the pinned value
 *      stops matching, and the exemption is re-litigated. This is the only
 *      part of the file that needs a human decision, and it is deliberately
 *      the smallest part.
 *
 * WHAT IT DOES NOT DO, because a check's scope is itself a claim. This script
 * asserts over the pairs and triples ENUMERATED BELOW. That enumeration is a
 * human judgement about what the system permits, and it is the part most likely
 * to be wrong: a pair nobody listed passes silently, which is indistinguishable
 * in the output from a pair that passes because it is legible. Two consequences
 * worth acting on rather than nodding at:
 *
 *   - Adding a component means adding a row to CONTROLS. Green output on an
 *     unlisted component is not evidence about that component.
 *   - It computes sRGB ratios from flat hexes. It cannot see an alpha
 *     composite, a gradient, text over an image, or a colour a third-party
 *     widget picked for itself. Those need a human and a screenshot.
 *
 * Do not read a clean run as "the design system is accessible". Read it as
 * "every pairing we have written down still holds".
 *
 * Porting it: handoff-local-operator-ui.md § 2 makes this the base-theme
 * refactor's first deliverable, over twelve themes. Replace `load()` with a
 * loop over your theme palettes; the tables below are the contract itself and
 * do not change.
 */

import { readFileSync } from "node:fs";

/* ---- 1. the floors, from tokens.md § 1 --------------------------------- */

const FLOOR = { text: 4.5, nonText: 3.0 };

/* `ink-disabled` is the only exempt foreground (SC 1.4.3, inactive control),
   and a disabled control's boundary is exempt under SC 1.4.11 for the same
   reason. Nothing else is exempt by category — everything else is exempt only
   by being named in EXCEPTIONS below, with a ratio and a reason. */
const EXEMPT_INK = new Set(["ink-disabled"]);

/* ---- 2. WCAG 2.x relative luminance ----------------------------------- */

const lum = (hex) => {
	const [r, g, b] = [1, 3, 5].map((i) => {
		const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
	const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
	return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
};

/* ---- 3. load the palette for one theme -------------------------------- */

const TOKENS = JSON.parse(
	readFileSync(new URL("./tokens.json", import.meta.url), "utf8"),
);

/** Flatten color groups to `name -> hex` for one theme. Theme-invariant
    tokens (the islands, the photographic ring) carry `value`, not light/dark. */
const load = (theme) => {
	const out = {};
	for (const group of Object.values(TOKENS.color))
		for (const [name, t] of Object.entries(group))
			if (!name.startsWith("$")) out[name] = t.value ?? t[theme];
	return out;
};

/* ---- 4. the permitted text pairs -------------------------------------- */

/* The five grounds any text may sit on. `sunken` is in the list; the pairs
   that may not use it are named in FORBIDDEN below. */
const GROUNDS = ["paper", "surface", "elevated", "sunken", "band"];

/** Every foreground x ground pair the system permits, as [ink, ground][]. */
const textPairs = () => {
	const p = [];
	const on = (fg, grounds) => grounds.forEach((g) => p.push([fg, g]));

	/* The ink ramp carries prose on every ground. */
	on("ink", GROUNDS);
	on("ink-muted", GROUNDS);
	on("ink-dim", GROUNDS);

	/* Accent is the link colour. Not on `sunken` — see FORBIDDEN. */
	on("accent", ["paper", "surface", "elevated", "band"]);
	on("accent-hover", ["paper", "surface", "elevated", "band", "sunken"]);

	/* Semantic text on a page ground, and on its own wash. Not on `sunken`. */
	for (const s of ["success", "warning", "danger"]) {
		on(s, ["paper", "surface", "elevated", "band"]);
		p.push([s, `${s}-wash`]);
	}

	/* Ink on the tinted fills. `ink-dim` is permitted on the washes only: on
	   the solid `accent-muted` it measures 4.24 (light) / 3.67 (dark), which is
	   why tokens.md § 5 gives that fill `ink` or an accent step and nothing
	   dimmer. This distinction was found by running this script. */
	for (const fill of [
		"accent-wash",
		"success-wash",
		"warning-wash",
		"danger-wash",
	]) {
		p.push(["ink", fill]);
		p.push(["ink-dim", fill]);
	}
	p.push(["ink", "accent-muted"]);
	p.push(["accent-active", "accent-muted"]); // light badge ink
	p.push(["accent-hover", "accent-muted"]); // dark badge ink

	/* The primary button's ink on all three accent fills. */
	for (const fill of ["accent", "accent-hover", "accent-active"])
		p.push(["on-accent", fill]);

	/* The always-dark islands, in both themes. Syntax roles are text. */
	for (const fg of [
		"island-fg",
		"island-muted",
		"island-dim",
		"island-keyword",
		"island-string",
		"island-number",
	])
		p.push([fg, "island"]);

	return p;
};

/* Pairs the system explicitly does NOT permit, each pinned to the ratio that
   is the reason. Asserted as a negative: if a token change makes one of these
   legal, the prohibition should be reconsidered, so the script says so. A
   `"#hex"` foreground is a literal rather than a token — the white-on-dark-green
   prohibition is about a colour the dark ramp does not contain. */
const FORBIDDEN = [
	["accent", "sunken", "light", 4.49, "the link colour in a well; use accent-hover (6.46) or the ink ramp"],
	["success", "sunken", "light", 4.45, "semantic text in a well; the well takes the ink ramp and the semantic colour goes on the glyph"],
	["ink-dim", "accent-muted", "light", 4.24, "the solid tinted fill takes `ink` or an accent step, never the dim ink"],
	["ink-dim", "accent-muted", "dark", 3.67, "as above"],
	["#ffffff", "accent", "dark", 2.16, "white ink on the lit dark green — the one hard prohibition in the system"],
];

/* ---- 5. component triples --------------------------------------------- */

/* A control is legal on a ground when its ink clears 4.5:1 against its own
   fill AND its boundary — fill-vs-ground OR border-vs-ground, whichever is
   stronger — clears 3:1. `fill: null` means transparent, so the ground itself
   is the fill. `interactive: false` drops the boundary assertion (SC 1.4.11
   binds components and required content, not decorative labels); those rows
   still assert their ink.

   Values come from components.md §§ 2, 3, 4, 9, 10, 11 and 13, and are the
   shipped ones — this table and that document fail together or pass together. */
const CONTROLS = [
	/* Button, § 2. Every variant on every ground it can legally sit on. */
	{ id: "button/primary rest", fill: "accent", border: null, ink: "on-accent" },
	{ id: "button/primary hover", fill: "accent-hover", border: null, ink: "on-accent" },
	{ id: "button/primary active", fill: "accent-active", border: null, ink: "on-accent" },
	{ id: "button/secondary rest", fill: "surface", border: "border-control", ink: "ink" },
	{ id: "button/secondary hover", fill: "elevated", border: "ink-muted", ink: "ink" },
	{ id: "button/secondary active", fill: "surface", border: "ink-muted", ink: "ink" },
	{ id: "button/outline rest", fill: null, border: "border-control", ink: "ink" },
	{ id: "button/outline hover", fill: "sunken", border: "ink-muted", ink: "ink" },
	{ id: "button/ghost rest", fill: null, border: null, ink: "ink-muted", boundary: false },
	{ id: "button/ghost hover", fill: "sunken", border: null, ink: "ink", boundary: false },
	/* The `link` variant carries the accent, which is 4.49 on `sunken` in
	   light. In a well it steps to `accent-hover` (6.46). Two rows, because
	   that step is a rule and not a preference. */
	{ id: "button/link rest", fill: null, border: null, ink: "accent", boundary: false, grounds: ["paper", "surface", "elevated", "band"] },
	{ id: "button/link rest (in a well)", fill: null, border: null, ink: "accent-hover", boundary: false, grounds: ["sunken"] },

	/* Input, § 4a. The five components tokens.md § 4 calls mandatory. */
	{ id: "input/rest", fill: "surface", border: "border-control", ink: "ink" },
	{ id: "input/placeholder", fill: "surface", border: "border-control", ink: "ink-dim" },
	{ id: "input/hover", fill: "surface", border: "ink-muted", ink: "ink" },
	{ id: "input/invalid", fill: "surface", border: "danger", ink: "ink" },

	/* Selection patterns, § 9. */
	{ id: "segmented/selected", fill: "surface", border: "border-control", ink: "accent-active", themes: ["light"] },
	{ id: "segmented/selected", fill: "accent-muted", border: "border-control", ink: "accent-hover", themes: ["dark"] },
	{ id: "row/selected", fill: "accent-wash", border: "accent-border", ink: "ink" },

	/* Overlays and lists, § 13. The focus-visible row is here specifically so
	   that pointing a focus FILL at the solid accent fails this script instead
	   of shipping: `ink` on `accent` is 3.13 (light) and 1.86 (dark). Focus is
	   expressed by the ring, and the row's fill only ever steps to a wash. */
	{ id: "list/row rest", fill: "surface", border: null, ink: "ink", boundary: false },
	{ id: "list/row hover", fill: "elevated", border: null, ink: "ink", boundary: false },
	{ id: "list/row focus-visible", fill: "accent-wash", border: null, ink: "ink", boundary: false },
	{ id: "menu/item", fill: "elevated", border: null, ink: "ink", grounds: ["paper", "surface"], boundary: false },
	{ id: "tooltip", fill: "elevated", border: "hairline", ink: "ink", grounds: ["paper", "surface"], boundary: false },

	/* Table, § 12. The header row and the body row are both required content,
	   and the row rule is their only boundary. */
	{ id: "table/header", fill: "sunken", border: "border-control", ink: "ink-dim" },
	{ id: "table/row", fill: "surface", border: "border-control", ink: "ink" },
	{ id: "table/row hover", fill: "elevated", border: "border-control", ink: "ink" },

	/* Badge, § 3. Never interactive — the boundary assertion is dropped and
	   the sub-floor border-vs-own-fill pairs are pinned in EXCEPTIONS. */
	{ id: "badge/neutral", fill: "surface", border: "hairline", ink: "ink-dim", boundary: false },
	{ id: "badge/accent", fill: "accent-muted", border: "accent-border", ink: "accent-active", boundary: false, themes: ["light"] },
	{ id: "badge/accent", fill: "accent-muted", border: "accent-border", ink: "accent-hover", boundary: false, themes: ["dark"] },
	{ id: "badge/success", fill: "success-wash", border: "success-border", ink: "success", boundary: false },
	{ id: "badge/warning", fill: "warning-wash", border: "warning-border", ink: "warning", boundary: false },
	{ id: "badge/danger", fill: "danger-wash", border: "danger-border", ink: "danger", boundary: false },

	/* Inline alert, § 8. A wash fill never carries a boundary (1.01-1.19:1),
	   so the semantic border is the box's sole boundary and 1.4.11 binds it.
	   `grounds` is why: the semantic borders do not clear 3:1 on `elevated`
	   in dark, so an alert does not sit there. See tokens.md § 6. */
	{ id: "alert/error", fill: "danger-wash", border: "danger-border", ink: "ink", grounds: ["paper", "surface", "sunken", "band"] },
	{ id: "alert/notice", fill: "surface", border: "hairline-strong", ink: "ink", grounds: ["paper", "sunken", "band"], boundary: false },
	{ id: "alert/success", fill: "success-wash", border: "success-border", ink: "ink", grounds: ["paper", "surface", "sunken", "band"] },

	/* Disabled rows. Both assertions are exempt; listed so the exemption is
	   visible in the output rather than absent from it. */
	{ id: "button/primary disabled", fill: "sunken", border: null, ink: "ink-disabled", boundary: false },
	{ id: "button/secondary disabled", fill: "surface", border: "hairline", ink: "ink-disabled", boundary: false },
	{ id: "input/disabled", fill: "sunken", border: "hairline", ink: "ink-disabled", boundary: false },
];

/* ---- 6. accepted sub-floor pairs, each pinned to its ratio ------------- */

const EXCEPTIONS = [
	{ pair: ["ink-disabled", "paper"], theme: "light", ratio: 2.75, why: "SC 1.4.3 exempts an inactive control's text" },
	{ pair: ["ink-disabled", "surface"], theme: "light", ratio: 2.91, why: "as above" },
	{ pair: ["ink-disabled", "sunken"], theme: "light", ratio: 2.55, why: "as above" },
	{ pair: ["ink-disabled", "band"], theme: "light", ratio: 2.71, why: "as above" },
	{ pair: ["ink-disabled", "elevated"], theme: "light", ratio: 2.99, why: "as above" },
	{ pair: ["ink-disabled", "paper"], theme: "dark", ratio: 2.70, why: "as above" },
	{ pair: ["ink-disabled", "surface"], theme: "dark", ratio: 2.52, why: "as above" },
	{ pair: ["ink-disabled", "elevated"], theme: "dark", ratio: 2.28, why: "as above" },
	{ pair: ["ink-disabled", "band"], theme: "dark", ratio: 2.45, why: "as above" },
	{ pair: ["ink-disabled", "sunken"], theme: "dark", ratio: 2.84, why: "as above" },
	{
		pair: ["accent-border", "accent-muted"],
		theme: "dark",
		ratio: 2.73,
		why: "badge border against its own fill. A badge is not a control, and what a reader resolves is the badge against the page: accent-border on canvas is 4.06. Making a badge interactive makes this a violation.",
	},
	{
		pair: ["success-border", "success-wash"],
		theme: "dark",
		ratio: 2.88,
		why: "same argument as accent-border/accent-muted: success-border on canvas is 3.45. Static callouts and badges only.",
	},
	{
		pair: ["success-border", "elevated"],
		theme: "dark",
		ratio: 2.91,
		why: "the reason an alert does not sit on `elevated` in dark. Inside a popover or menu the box takes `border-control` and keeps the semantic colour on the glyph and the helper text. tokens.md § 6.",
	},
];

/* ---- 7. run ----------------------------------------------------------- */

let failures = 0;
let checks = 0;
const log = [];

const fail = (msg) => {
	failures += 1;
	log.push(`FAIL  ${msg}`);
};

/** An exception matches when the pair, theme and measured ratio all agree.
    A drifted ratio is a failure, not a silent pass. */
const exception = (fg, bg, theme, got) =>
	EXCEPTIONS.find(
		(e) =>
			e.pair[0] === fg &&
			e.pair[1] === bg &&
			e.theme === theme &&
			e.ratio === got,
	);

const assertPair = (fg, bg, floor, theme, P, label) => {
	checks += 1;
	const got = ratio(P[fg], P[bg]);
	if (got >= floor) return got;
	if (exception(fg, bg, theme, got)) return got;
	const drift = EXCEPTIONS.find(
		(e) => e.pair[0] === fg && e.pair[1] === bg && e.theme === theme,
	);
	fail(
		`${theme}  ${label}: ${fg} on ${bg} = ${got.toFixed(2)} < ${floor}` +
			(drift
				? `  (an exception is documented at ${drift.ratio} — the value moved, re-read the reason)`
				: ""),
	);
	return got;
};

for (const theme of ["light", "dark"]) {
	const P = load(theme);

	/* text pairs */
	for (const [fg, bg] of textPairs())
		assertPair(fg, bg, FLOOR.text, theme, P, "text");

	/* the structural border on every ground it can sit on */
	for (const g of GROUNDS)
		assertPair("border-control", g, FLOOR.nonText, theme, P, "structural border");

	/* the focus ring against every ground and every fill it can appear over */
	for (const g of [...GROUNDS, "accent-wash", "accent-muted", "island"])
		assertPair("accent", g, FLOOR.nonText, theme, P, "focus ring");

	/* semantic borders on the grounds tokens.md § 6 claims for them */
	for (const s of ["success", "warning", "danger"])
		for (const g of ["paper", "surface", "sunken", "band"])
			assertPair(`${s}-border`, g, FLOOR.nonText, theme, P, "semantic border");

	/* component triples */
	for (const c of CONTROLS) {
		if (c.themes && !c.themes.includes(theme)) continue;
		for (const ground of c.grounds ?? GROUNDS) {
			const fill = c.fill ?? ground;
			const label = `${c.id} on ${ground}`;

			/* ink against its own fill */
			if (!EXEMPT_INK.has(c.ink))
				assertPair(c.ink, fill, FLOOR.text, theme, P, label);

			/* the boundary: fill OR border, whichever is stronger */
			if (c.boundary === false) continue;
			checks += 1;
			const byFill = c.fill ? ratio(P[fill], P[ground]) : 0;
			const byBorder = c.border ? ratio(P[c.border], P[ground]) : 0;
			if (Math.max(byFill, byBorder) < FLOOR.nonText)
				fail(
					`${theme}  ${label}: no boundary clears ${FLOOR.nonText} — ` +
						`fill ${byFill.toFixed(2)}, border ${byBorder.toFixed(2)}. ` +
						`The control has no edge a low-vision reader can resolve.`,
				);
		}
	}

	/* the negative assertions */
	for (const [fg, bg, t, pinned, why] of FORBIDDEN) {
		if (t !== theme) continue;
		checks += 1;
		const got = ratio(fg.startsWith("#") ? fg : P[fg], P[bg]);
		if (got !== pinned)
			fail(
				`${theme}  forbidden pair ${fg} on ${bg} was pinned at ${pinned} and is now ` +
					`${got.toFixed(2)} — the prohibition (${why}) needs re-reading.`,
			);
	}
}

/* ---- 8. report -------------------------------------------------------- */

for (const line of log) console.log(line);

console.log(`\n${checks} assertions over 2 themes.`);
console.log(`${EXCEPTIONS.length} accepted sub-floor pairs, each pinned to its ratio:`);
for (const e of EXCEPTIONS)
	console.log(
		`  ${e.ratio.toFixed(2)}  ${e.theme.padEnd(5)} ${e.pair[0]} on ${e.pair[1]}` +
			(e.why === "as above" ? "" : `\n         ${e.why}`),
	);
console.log(
	`${FORBIDDEN.length} pairs prohibited outright, pinned so a token change re-opens them:`,
);
for (const [fg, bg, t, pinned, why] of FORBIDDEN)
	console.log(`  ${pinned.toFixed(2)}  ${t.padEnd(5)} ${fg} on ${bg} — ${why}`);

if (failures) {
	console.error(`\n${failures} violation(s). See tokens.md § 1 for the floors.`);
	process.exit(1);
}
console.log("\nContrast contract holds.");
