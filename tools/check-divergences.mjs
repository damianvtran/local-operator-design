#!/usr/bin/env node
/**
 * Validate the divergence register (`divergences.json`).
 *
 *     node tools/check-divergences.mjs
 *
 * Why this file exists. `divergences.json` records the brand register's
 * SANCTIONED differences between surfaces — the accent, the ground ramps, the
 * `info` role, and two light-mode values that had no recorded home until this
 * register. Prose that records differences drifts silently (this is the exact
 * failure the whole kit repository exists to stop: five hand-written copies of
 * the register, nothing checking a hop). So the register is data, and this
 * script makes it checkable:
 *
 *   1. STRUCTURE — required fields, unique ids, at least two surfaces named,
 *      hex-valued fields actually hex. A malformed entry is an error, not a
 *      skipped line.
 *   2. ASSERTIONS — every entry carries assertions that pin its recorded values
 *      against the files IN THIS REPOSITORY (`tokens.json` for the page/island
 *      family, `app-family.json` for the app family). The checker resolves
 *      each assertion against the committed JSON, so a register entry cannot
 *      outlive the values it describes: change `tokens.json`'s accent and the
 *      register fails until the divergence is re-read and re-recorded.
 *
 * What it explicitly does NOT do: judge whether a divergence is acceptable.
 * That is the brand decision the register records; this script only keeps the
 * record honest and complete. Nothing here is a hand list — the assertions live
 * in the register itself, and this tool is generic over them.
 *
 * Assertion forms (JSON Pointer paths, `/a/b/c`):
 *   { "file": "tokens.json", "path": "/color/accent/accent/light", "value": "#177b45" }
 *       — the pointer must resolve and equal the value, case-insensitively for
 *         hex strings (hex case is not significant, per the kit's own rule).
 *   { "file": "tokens.json", "path": "/color/info", "absent": true }
 *       — the pointer must NOT resolve (used for roles a surface lacks).
 *   { "file": "app-family.json", "path": "/contract/members", "contains": "info" }
 *       — the resolved value must be an array containing the entry.
 *
 * Zero dependencies. Run from anywhere; paths resolve against this file.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (name) => JSON.parse(readFileSync(join(root, name), "utf8"));

const register = readJson("divergences.json");
const cache = new Map();
const fileJson = (name) => {
	if (!cache.has(name)) cache.set(name, readJson(name));
	return cache.get(name);
};

let failures = 0;
const fail = (msg) => {
	failures += 1;
	console.error(`FAIL  ${msg}`);
};

/** Resolve a JSON Pointer. Returns { found, value }. */
const resolvePointer = (doc, pointer) => {
	const parts = pointer.split("/").filter(Boolean);
	let cur = doc;
	for (const p of parts) {
		if (cur === null || typeof cur !== "object" || !(p in cur)) {
			return { found: false, value: undefined };
		}
		cur = cur[p];
	}
	return { found: true, value: cur };
};

const hex = /^#[0-9a-f]{3,8}$/i;

/* ---- 1. structure ------------------------------------------------------ */

if (!Array.isArray(register.divergences) || register.divergences.length === 0) {
	console.error("divergences.json has no `divergences` array.");
	process.exit(1);
}

const seen = new Set();
let assertionCount = 0;

for (const entry of register.divergences) {
	const id = entry.id;
	if (typeof id !== "string" || !id) fail("an entry has no `id`");
	else if (seen.has(id)) fail(`duplicate id \`${id}\``);
	else seen.add(id);
	for (const field of ["kind", "summary", "why"]) {
		if (typeof entry[field] !== "string" || !entry[field].trim())
			fail(`${id}: missing \`${field}\``);
	}
	if (!Array.isArray(entry.sources) || entry.sources.length === 0)
		fail(`${id}: needs at least one \`sources\` entry`);
	const surfaces = entry.surfaces;
	if (surfaces === null || typeof surfaces !== "object") {
		fail(`${id}: missing \`surfaces\``);
	} else if (Object.keys(surfaces).length < 2) {
		fail(`${id}: a divergence names at least two surfaces (found ${Object.keys(surfaces).length})`);
	}
	for (const [name, s] of Object.entries(surfaces ?? {})) {
		const values = s.value !== undefined ? [s.value] : s.values ? Object.values(s.values) : [];
		for (const v of values)
			if (typeof v === "string" && v.startsWith("#") && !hex.test(v))
				fail(`${id}: surface \`${name}\` value \`${v}\` is not a hex colour`);
	}
	if (!Array.isArray(entry.assertions) || entry.assertions.length === 0)
		fail(`${id}: needs at least one assertion (the register is checked, not prose)`);
}

/* ---- 2. assertions ----------------------------------------------------- */

for (const entry of register.divergences) {
	for (const a of entry.assertions ?? []) {
		assertionCount += 1;
		const where = `${entry.id}  ${a.file}${a.path}`;
		let doc;
		try {
			doc = fileJson(a.file);
		} catch {
			fail(`${where}: cannot read \`${a.file}\``);
			continue;
		}
		const { found, value } = resolvePointer(doc, a.path);
		if (a.absent === true) {
			if (found) fail(`${where}: expected the pointer to be ABSENT, but it resolves to ${JSON.stringify(value)}`);
			continue;
		}
		if (!found) {
			fail(`${where}: pointer does not resolve`);
			continue;
		}
		if (a.contains !== undefined) {
			if (!Array.isArray(value) || !value.includes(a.contains))
				fail(`${where}: expected the array to contain \`${a.contains}\``);
			continue;
		}
		if (a.value !== undefined) {
			const eq =
				typeof a.value === "string" && typeof value === "string" && a.value.startsWith("#") && value.startsWith("#")
					? a.value.toLowerCase() === value.toLowerCase()
					: a.value === value;
			if (!eq) fail(`${where}: register says ${JSON.stringify(a.value)}, the file holds ${JSON.stringify(value)}`);
		}
	}
}

if (failures) {
	console.error(`\n${failures} problem(s) in the divergence register.`);
	process.exit(1);
}
console.log(
	`Divergence register holds: ${register.divergences.length} sanctioned divergences, ${assertionCount} assertions against tokens.json and app-family.json.`,
);
