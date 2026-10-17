#!/usr/bin/env node
/**
 * Regenerate `tokens.css` from `tokens.json`, and check that `tokens.css` and
 * `tokens.md` still agree with it.
 *
 *     node tools/generate-tokens.mjs            # write tokens.css from the template
 *     node tools/generate-tokens.mjs --check    # fail if either file disagrees
 *
 * Why this file exists. `tokens.json` is the value store; `tokens.css` and
 * `tokens.md` are documents whose correctness is "every value in me is the value
 * in the JSON". The kit's header says the three files carry byte-identical
 * values — this script is that claim, executable:
 *
 *   1. CSS. `tools/tokens-css.template` is `tokens.css` with every value
 *      replaced by a `{{json.path}}` placeholder; rendering it against
 *      `tokens.json` must reproduce the committed `tokens.css` byte for byte.
 *      The template carries no values of its own — it is formatting, prose and
 *      placeholder references, so a value can only enter the CSS from the JSON.
 *      (`--check` compares bytes; a maintainer edits tokens.json, runs this
 *      script, and commits both.)
 *   2. MD. `tokens.md` states values in prose tables, which cannot be
 *      regenerated mechanically without turning the document into a template.
 *      Instead the check is a value audit: every colour value in `tokens.json`
 *      must appear in `tokens.md`, and every hex written in `tokens.md` must be
 *      a value from `tokens.json` — except a tiny, documented set of hexes the
 *      prose names only as examples of what the system does NOT use. A colour
 *      nudged in one file and not the other fails here.
 *   3. COVERAGE. Every colour leaf in `tokens.json` must be referenced by at
 *      least one placeholder in the template — a value the CSS cannot see is a
 *      value this check cannot protect.
 *
 * What it does NOT check: `tokens.md`'s non-colour values (type sizes, space,
 * radii, durations). Those are covered JSON↔CSS byte-exactly above; the MD
 * tables for them are reviewed by a human like the rest of the prose. Stated
 * here so the check's scope is a claim a reader can audit, not an assumption.
 *
 * Placeholder grammar in the template (all values must resolve from tokens.json):
 *   {{path}}            the value, as-is
 *   {{path@split0|1}}   the first/second half of an "a/b" prose value
 *   {{path@px}}         rem → px at a 16px root ("0.25rem" → "4")
 *   {{path@px*N}}       the rem value in px, multiplied by N
 *   {{path@tail:N}}     emit the value, wrapping: the last N characters go to a
 *                       continuation line indented one tab deeper, and the space
 *                       at the break is dropped (this reproduces the four
 *                       hand-wrapped declarations exactly)
 *
 * Zero dependencies. Run from anywhere; paths resolve against this file.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = JSON.parse(readFileSync(join(root, "tokens.json"), "utf8"));
const template = readFileSync(join(root, "tools", "tokens-css.template"), "utf8");
const checkMode = process.argv.includes("--check");

/* ---- resolve a json path ------------------------------------------------- */
const lookup = (path) => {
	let cur = T;
	for (const seg of path.split(".")) {
		if (cur === null || typeof cur !== "object" || !(seg in cur)) {
			throw new Error(`placeholder path does not resolve in tokens.json: ${path}`);
		}
		cur = cur[seg];
	}
	return cur;
};

const parseRem = (v) => {
	const m = /^(-?[\d.]+)rem$/.exec(v);
	if (!m) throw new Error(`@px modifier on a non-rem value: ${v}`);
	return Number.parseFloat(m[1]) * 16;
};

/* ---- render -------------------------------------------------------------- */
/* Single left-to-right pass, so `@tail` can see the true line it lands on. */
let resolvedCount = 0;
let out = "";
let i = 0;
const re = /\{\{([^}]+)\}\}/g;
let m;
while ((m = re.exec(template)) !== null) {
	out += template.slice(i, m.index);
	const inner = m[1];
	resolvedCount += 1;
	const at = inner.indexOf("@");
	const path = at === -1 ? inner : inner.slice(0, at);
	const mod = at === -1 ? "" : inner.slice(at + 1);
	const raw = lookup(path);
	let piece;
	if (mod === "") {
		piece = String(raw);
	} else if (mod === "split0" || mod === "split1") {
		const parts = String(raw).split("/");
		if (parts.length !== 2) throw new Error(`@${mod} on a non-"a/b" value: {{${inner}}}`);
		piece = parts[mod === "split0" ? 0 : 1];
	} else if (mod === "px" || mod.startsWith("px*")) {
		const mult = mod === "px" ? 1 : Number.parseFloat(mod.slice(3));
		piece = String(parseRem(raw) * mult);
	} else if (mod.startsWith("tail:")) {
		const n = Number.parseInt(mod.slice(5), 10);
		const v = String(raw);
		if (!(n > 0) || n >= v.length) throw new Error(`@tail:${n} out of range for {{${path}}}`);
		/* continuation indent: the current line's indent, plus one tab */
		const lineStart = out.lastIndexOf("\n") + 1;
		const indent = /^[\t ]*/.exec(out.slice(lineStart))[0];
		piece = `${v.slice(0, v.length - n).replace(/ $/, "")}\n${indent}\t${v.slice(v.length - n)}`;
	} else {
		throw new Error(`unknown placeholder modifier in {{${inner}}}`);
	}
	out += piece;
	i = m.index + m[0].length;
}
out += template.slice(i);
if (out.includes("{{")) throw new Error("the template still contains an unresolved `{{` after rendering");
const final = out;

/* ---- 1. CSS bytes -------------------------------------------------------- */
const cssPath = join(root, "tokens.css");
const committedCss = readFileSync(cssPath, "utf8");
const cssOk = final === committedCss;

/* ---- 2. MD value audit --------------------------------------------------- */
const md = readFileSync(join(root, "tokens.md"), "utf8");
const PROSE_ONLY_HEX = new Set(["#000", "#fff"]);
/* The two 3-digit forms the prose uses to say what NOT to use ("never #fff
   and never #000"). If the kit ever needs a third, adding it here is a visible,
   reviewable change — the intent of keeping this list tiny. */
const mdHexes = [...md.matchAll(/#[0-9a-f]{3,8}/gi)].map((x) => x[0].toLowerCase());
const jsonValues = new Set();
const collect = (o) => {
	if (o && typeof o === "object") {
		for (const v of Object.values(o)) collect(v);
	} else if (typeof o === "string" && /^#[0-9a-f]{3,8}$/i.test(o)) {
		jsonValues.add(o.toLowerCase());
	}
};
collect(T.color);
const mdSet = new Set(mdHexes);
const missingFromMd = [...jsonValues].filter((v) => !mdSet.has(v));
const strayInMd = [...mdSet].filter((v) => !jsonValues.has(v) && !PROSE_ONLY_HEX.has(v));

/* ---- 3. coverage: every colour leaf is visible to the template ----------- */
const leafPaths = [];
const walk = (o, prefix) => {
	if (o && typeof o === "object") {
		for (const [k, v] of Object.entries(o)) walk(v, prefix ? `${prefix}.${k}` : k);
	} else if (typeof o === "string" && /^#[0-9a-f]{3,8}$/i.test(o)) {
		leafPaths.push(prefix);
	}
};
walk(T.color, "");
const uncovered = leafPaths.filter((p) => !template.includes("{{color." + p));

/* ---- report -------------------------------------------------------------- */
if (checkMode) {
	let bad = false;
	if (cssOk) {
		console.log(`tokens.css is byte-current with tokens.json (${resolvedCount} values, ${final.length} bytes).`);
	} else {
		bad = true;
		const a = committedCss.split("\n");
		const b = final.split("\n");
		for (let k = 0; k < Math.max(a.length, b.length); k++) {
			if (a[k] !== b[k]) {
				console.error(`tokens.css line ${k + 1} disagrees:`);
				console.error(`  committed: ${JSON.stringify(a[k])}`);
				console.error(`  generated: ${JSON.stringify(b[k])}`);
				break;
			}
		}
		console.error("Run `node tools/generate-tokens.mjs` and commit tokens.css.");
	}
	if (missingFromMd.length || strayInMd.length) {
		bad = true;
		for (const v of missingFromMd) console.error(`tokens.md is missing a value from tokens.json: ${v}`);
		for (const v of strayInMd) console.error(`tokens.md contains a hex that is not in tokens.json: ${v}`);
	} else {
		console.log(`tokens.md agrees on all colours: ${jsonValues.size} values present, ${mdHexes.length} hex occurrences accounted for.`);
	}
	if (uncovered.length) {
		bad = true;
		for (const p of uncovered) console.error(`tokens.json colour leaf not referenced by the template: color.${p}`);
	}
	if (bad) process.exit(1);
	console.log("tokens.json, tokens.css and tokens.md agree.");
	process.exit(0);
}

if (!cssOk) {
	writeFileSync(cssPath, final);
	console.log(`tokens.css written from tokens.json (${resolvedCount} values, ${final.length} bytes).`);
} else {
	console.log("tokens.css already byte-current; nothing to write.");
}
