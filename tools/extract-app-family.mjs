#!/usr/bin/env node
/**
 * Extract the app family's brand palettes and the role contract from the
 * desktop app's repository (`local-operator-ui`) at a PINNED ref, and write
 * them to `./app-family.json`.
 *
 *     node tools/extract-app-family.mjs                # (re)write app-family.json
 *     node tools/extract-app-family.mjs --check        # fail if the committed
 *                                                      # file no longer matches
 *                                                      # the pinned refs
 *     node tools/extract-app-family.mjs --ui <path>    # which UI checkout to read
 *
 * Why this file exists. `app-family.json` is a PUBLISHED artefact (this kit is
 * public), so two constraints bind every value in it:
 *
 *   1. The values must be the ones actually in use. They are therefore read by
 *      EXECUTING the palette module — never re-typed into JSON, and never
 *      re-parsed from hex literals. A later syntax change in the source cannot
 *      silently fool this script into publishing stale values; it either keeps
 *      producing the same runtime values or fails loudly.
 *   2. The provenance must be mechanical. `--check` re-runs the extraction
 *      against the same pinned refs and fails on any difference, so CI (or a
 *      maintainer) can prove the committed file byte-for-byte against its
 *      sources. This is what lets a consumer quote values from this file with a
 *      pin, instead of trusting a transcription.
 *
 * How it reads the sources:
 *
 *   - `git show <ref>:<path>` — objects at the pinned commit, never a working
 *     tree (sibling checkouts sit on feature branches; the ADR that commissioned
 *     this repository was written after exactly that drift fooled a first
 *     reading — see the ADR's "Provenance" note).
 *   - The palette module is imported under Node's native TypeScript type
 *     stripping (Node >= 23.6 has it on by default; 22.6 via
 *     --experimental-strip-types). The module uses only erasable syntax
 *     (`import type`, type annotations on values), so stripping is exact and
 *     the import yields the real exported objects.
 *   - The role list is read from the `ThemePalette` type in
 *     palette-contract.ts. That file is type-only by design (it shares no
 *     runtime code with the app's registry), so there is no runtime value to
 *     import; the script scans its source with a comment/string-aware brace
 *     scanner instead. If the type ever stops being a plain object type — or
 *     gains a member this scanner cannot see — the cross-check below fails
 *     rather than silently truncating the contract.
 *
 * The extraction cross-checks itself: every member of `ThemePalette` must be
 * present in BOTH palettes, and both palettes must carry no member the type
 * does not declare. A mismatch is an error, not a warning — an incomplete
 * `app-family.json` that looks valid is worse than a failed run.
 *
 * Requires Node >= 23.6 and a `local-operator-ui` checkout that contains the
 * pinned ref (a plain `git clone https://github.com/damianvtran/local-operator-ui`
 * has it). No dependencies. No network: everything is read from the checkout.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/* ---- the pin ------------------------------------------------------------
   One ref for both files. The ref is a commit on the UI repository's main
   line; moving it is a deliberate act that re-issues the extraction and
   updates every downstream check (and the divergence register's assertions). */
const PIN = {
	repo: "damianvtran/local-operator-ui",
	ref: "574fe4840bef2ac5866eca36a14ea40631a802ea",
	palette: "src/renderer/src/shared/themes/palettes/local-operator.ts",
	contract: "src/renderer/src/shared/themes/palette-contract.ts",
};

/* ---- the checkout this runs against -------------------------------------
   Resolution order: --ui <path>, then $LOCAL_OPERATOR_UI_DIR, then a sibling
   `../local-operator-ui` (the layout this kit is maintained in). The default
   is a convenience for the maintainer's machine and CI-less local runs; the
   pin, not the checkout's branch, decides what is read. */
const args = process.argv.slice(2);
const flagIndex = (name) => args.indexOf(name);
function argValue(name) {
	const i = flagIndex(name);
	return i >= 0 ? args[i + 1] : null;
}
const checkMode = args.includes("--check");
const uiDir = (() => {
	const fromArg = argValue("--ui");
	if (fromArg) return resolve(fromArg);
	if (process.env.LOCAL_OPERATOR_UI_DIR) return resolve(process.env.LOCAL_OPERATOR_UI_DIR);
	return resolve(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "local-operator-ui"));
})();

const git = (...gitArgs) =>
	execFileSync("git", ["-C", uiDir, ...gitArgs], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

if (!existsSync(uiDir)) {
	console.error(`No local-operator-ui checkout at: ${uiDir}`);
	console.error("Pass --ui <path>, set LOCAL_OPERATOR_UI_DIR, or place the checkout beside this repository.");
	process.exit(2);
}
try {
	git("cat-file", "-e", `${PIN.ref}^{commit}`);
} catch {
	console.error(`The checkout at ${uiDir} does not contain the pinned ref ${PIN.ref}.`);
	console.error("Fetch it first: git -C <checkout> fetch origin");
	process.exit(2);
}

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/* ---- read the two sources at the pin ------------------------------------ */
const paletteSource = git("show", `${PIN.ref}:${PIN.palette}`);
const contractSource = git("show", `${PIN.ref}:${PIN.contract}`);
const commitDate = git("show", "-s", "--format=%cs", PIN.ref).trim();

/* ---- the role contract: top-level members of `export type ThemePalette` --
   Scanner contract (shared shape with tools/check-divergences.mjs's JSON
   reading: plain, no dependencies):
     - Skip comments and string literals while walking, so braces or colons
       inside prose cannot offset the structure.
     - The type body is the text between its opening `{` and its matching `}`.
     - A top-level member is a line segment `name:` or `name?:` at depth 0.
   The three patterns are asserted; anything else fails the run. */
function bodyOf(source, marker) {
	const mi = source.search(marker);
	if (mi < 0) throw new Error(`marker not found: ${marker}`);
	const open = source.indexOf("{", mi);
	let depth = 0;
	let inLine = false;
	let inBlock = false;
	let inStr = null;
	for (let j = open; j < source.length; j++) {
		const c = source[j];
		const two = source.slice(j, j + 2);
		if (inLine) {
			if (c === "\n") inLine = false;
			continue;
		}
		if (inBlock) {
			if (two === "*/") {
				inBlock = false;
				j++;
			}
			continue;
		}
		if (inStr) {
			if (c === "\\") j++;
			else if (c === inStr) inStr = null;
			continue;
		}
		if (two === "//") {
			inLine = true;
			j++;
			continue;
		}
		if (two === "/*") {
			inBlock = true;
			j++;
			continue;
		}
		if (c === '"' || c === "'" || c === "`") {
			inStr = c;
			continue;
		}
		if (c === "{") depth++;
		else if (c === "}") {
			depth--;
			if (depth === 0) return source.slice(open + 1, j);
		}
	}
	throw new Error("unbalanced braces: the type body never closed");
}

function topLevelMembers(body) {
	const out = [];
	let depth = 0;
	let inLine = false;
	let inBlock = false;
	let inStr = null;
	let lineStart = 0;
	for (let k = 0; k < body.length; k++) {
		const c = body[k];
		const two = body.slice(k, k + 2);
		if (inLine) {
			if (c === "\n") {
				inLine = false;
				lineStart = k + 1;
			}
			continue;
		}
		if (inBlock) {
			if (two === "*/") {
				inBlock = false;
				k++;
			}
			continue;
		}
		if (inStr) {
			if (c === "\\") k++;
			else if (c === inStr) inStr = null;
			continue;
		}
		if (two === "//") {
			inLine = true;
			k++;
			continue;
		}
		if (two === "/*") {
			inBlock = true;
			k++;
			continue;
		}
		if (c === '"' || c === "'" || c === "`") {
			inStr = c;
			continue;
		}
		if (c === "{") depth++;
		else if (c === "}") depth--;
		else if (c === "\n") lineStart = k + 1;
		else if (depth === 0 && c === ":" && k > 0) {
			const segment = body.slice(lineStart, k);
			const m = /^\s*([A-Za-z][A-Za-z0-9]*)\??\s*$/.exec(segment);
			if (m) out.push(m[1]);
		}
	}
	return out;
}

const contractMembers = topLevelMembers(bodyOf(contractSource, /export type ThemePalette = \{/));
if (contractMembers.length < 30) {
	throw new Error(
		`only ${contractMembers.length} members found in ThemePalette — the type shape changed and this scanner no longer sees it`,
	);
}

/* ---- the palettes: import the module, read the real objects -------------
   Written to a .mts path so Node parses it as an ES module without the
   MODULE_TYPELESS_PACKAGE_JSON warning; the module's only import is
   `import type`, which stripping erases, so nothing else needs to exist. */
const tmp = mkdtempSync(join(tmpdir(), "app-family-"));
try {
	const palettePath = join(tmp, "local-operator.mts");
	writeFileSync(palettePath, paletteSource);
	const mod = await import(pathToFileURL(palettePath).href);
	const exports = ["localOperatorDark", "localOperatorLight"];
	for (const e of exports) {
		if (!mod[e]) throw new Error(`palette module did not export ${e}`);
	}

	const paletteJson = (def) => {
		const { id, name, description, palette } = def;
		const { mode, ...values } = palette;
		return { id, name, description, mode, values };
	};
	const dark = paletteJson(mod.localOperatorDark);
	const light = paletteJson(mod.localOperatorLight);

	/* Cross-check: the contract defines the members; the palettes must
	   implement exactly them. Both sides are ordered; compare as sets and
	   report the deltas by name so a failure is actionable. */
	const contractSet = new Set(contractMembers);
	for (const [which, p] of [
		["localOperatorDark", dark],
		["localOperatorLight", light],
	]) {
		const keys = ["mode", ...Object.keys(p.values)];
		const missing = contractMembers.filter((m) => !keys.includes(m));
		const extra = keys.filter((m) => !contractSet.has(m));
		if (missing.length || extra.length) {
			throw new Error(
				`${which} does not match the contract — missing: [${missing}] extra: [${extra}]`,
			);
		}
	}

	/* ---- assemble the file ---------------------------------------------- */
	const out = {
		$meta: {
			name: "Local Operator app family — brand palettes and role contract",
			role: "The desktop app's two brand palettes (localOperatorDark, localOperatorLight) and the palette role contract, as data. This is the app-family half of the register; the page/island half is tokens.json.",
			derivedFrom: [
				{
					repo: PIN.repo,
					ref: PIN.ref,
					commitDate,
					path: PIN.palette,
					sha256: sha256(paletteSource),
				},
				{
					repo: PIN.repo,
					ref: PIN.ref,
					commitDate,
					path: PIN.contract,
					sha256: sha256(contractSource),
				},
			],
			method:
				"tools/extract-app-family.mjs — palette values are read by importing the module under Node's TypeScript type stripping (never re-typed); the contract is read from the ThemePalette type source. Re-run with --check to verify this file against the pinned refs.",
			hexCase: "as shipped in the source; hex case is not significant",
			checkedBy: "node tools/extract-app-family.mjs --check",
		},
		contract: {
			source: PIN.contract,
			memberCount: contractMembers.length,
			note: "All ThemePalette members in declaration order. `mode` selects the light or dark side of a theme and is not a colour role; the contract's header counts 38 colour roles (accentAlt/accentAltWash are the second-hue pair it calls out).",
			members: contractMembers,
		},
		palettes: {
			localOperatorDark: dark,
			localOperatorLight: light,
		},
	};

	const rendered = JSON.stringify(out, null, 2) + "\n";
	const target = resolve(dirname(fileURLToPath(import.meta.url)), "..", "app-family.json");

	if (checkMode) {
		let current;
		try {
			current = readFileSync(target, "utf8");
		} catch {
			console.error(`${target} does not exist — run without --check to write it first.`);
			process.exit(1);
		}
		if (current === rendered) {
			console.log(
				`app-family.json matches the pinned refs (${PIN.ref.slice(0, 9)}: ${contractMembers.length} contract members, 2 palettes).`,
			);
			process.exit(0);
		}
		const a = JSON.parse(current);
		const b = out;
		const firstDiff = (x, y, path = "") => {
			if (x === null || y === null || typeof x !== "object" || typeof y !== "object") {
				return x === y ? null : { path, current: x, expected: y };
			}
			const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
			for (const k of keys) {
				const d = firstDiff(x[k], y[k], `${path}/${k}`);
				if (d) return d;
			}
			return null;
		};
		const d = firstDiff(a, b);
		console.error("app-family.json does NOT match the pinned refs.");
		if (d) console.error(`  first difference at ${d.path}: committed=${JSON.stringify(d.current)} extracted=${JSON.stringify(d.expected)}`);
		process.exit(1);
	}

	writeFileSync(target, rendered);
	console.log(
		`app-family.json written from ${PIN.ref.slice(0, 9)}: ${contractMembers.length} contract members, 2 palettes, ${Object.keys(dark.values).length} values each.`,
	);
} finally {
	rmSync(tmp, { recursive: true, force: true });
}
