#!/usr/bin/env node
/**
 * Regenerate `digests.json` — the SHA-256 of every published file — and check
 * that it is current.
 *
 *     node tools/digests.mjs            # write digests.json
 *     node tools/digests.mjs --check    # verify the committed digests
 *
 * Why this file exists. Consumers of this kit commit a vendored slice plus a
 * lock file naming the kit ref and a SHA-256 per consumed file; `digests.json`
 * is where those per-file hashes come from, so "the slice equals the kit at the
 * locked ref" (and "this value is the one the kit published") is a one-command
 * claim on the consumer side: fetch the kit at the locked ref, hash the files,
 * compare. The alternative — trusting a transcription — is the hand-porting
 * failure the kit repository exists to end.
 *
 * Scope: every file tracked by git in this repository, except `digests.json`
 * itself (a file cannot carry its own digest). The list comes from
 * `git ls-files`, so nothing untracked sneaks in and nothing tracked is
 * forgotten. The output is deterministic — sorted paths, fixed formatting, no
 * timestamps — so regenerating twice produces identical bytes and CI can
 * compare strictly.
 *
 * Zero dependencies beyond a git checkout.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const checkMode = process.argv.includes("--check");
const SELF = "digests.json";

let listed;
try {
	listed = execFileSync("git", ["-C", root, "ls-files", "-z"], { encoding: "utf8" })
		.split("\u0000")
		.filter(Boolean);
} catch {
	console.error("digests.mjs needs a git checkout — it hashes every tracked file.");
	process.exit(2);
}

const files = listed.filter((f) => f !== SELF).sort();
const T = JSON.parse(readFileSync(join(root, "tokens.json"), "utf8"));
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

const out = {
	kit: "damianvtran/local-operator-design",
	version: T.$meta.version,
	algorithm: "sha256",
	scope:
		"every file tracked by git except digests.json itself; a consumer's lock records the kit ref plus the per-file hashes below",
	files: Object.fromEntries(files.map((f) => [f, sha256(readFileSync(join(root, f)))])),
};
const rendered = JSON.stringify(out, null, 2) + "\n";
const target = join(root, SELF);

if (checkMode) {
	let current;
	try {
		current = readFileSync(target, "utf8");
	} catch {
		console.error("digests.json is missing — run `node tools/digests.mjs`.");
		process.exit(1);
	}
	if (current === rendered) {
		console.log(`digests.json is current: ${files.length} files, sha256.`);
		process.exit(0);
	}
	const a = JSON.parse(current);
	const stale = [];
	for (const f of files) {
		if (a.files?.[f] !== out.files[f]) stale.push(`  ${f}: committed ${a.files?.[f] ?? "(absent)"} now ${out.files[f]}`);
	}
	for (const f of Object.keys(a.files ?? {})) if (!files.includes(f)) stale.push(`  ${f}: in digests.json but not tracked any more`);
	console.error("digests.json does NOT match the working tree:");
	for (const line of stale) console.error(line);
	console.error("Run `node tools/digests.mjs` and commit digests.json.");
	process.exit(1);
}

let existing = null;
try {
	existing = readFileSync(target, "utf8");
} catch {
	/* not written yet — first run */
}
if (existing === rendered) {
	console.log("digests.json already current; nothing to write.");
} else {
	writeFileSync(target, rendered);
	console.log(`digests.json written: ${files.length} files, sha256.`);
}
