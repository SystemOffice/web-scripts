// Checks whether the vendor (chatui.ida.gideontaylor.com) has shipped
// changes since vendor/manifest.json was last written, WITHOUT touching
// vendor/ itself — that only happens when you deliberately re-run
// fetch-vendor.mjs. Two kinds of drift are detected:
//
//  1. Content drift: any of our known 12 files' bytes no longer match the
//     hash recorded in the manifest.
//  2. Structural drift: IS_CV_PUBLIC_HOOK.js's own jsIncludes/cssIncludes
//     config (in the freshly-fetched copy) lists a different set of files
//     than SCRIPT_FILES/STYLE_FILES in vendor-files.mjs — i.e. the vendor
//     added or removed a file from the chain.
//
// Exits non-zero if anything changed, so this can be wired into a
// scheduled check; run manually otherwise.

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allVendorFiles, ROOT_FILES, SCRIPT_FILES, STYLE_FILES } from './vendor-files.mjs';

// IS_IDA_DRAGGABLE.css is loaded via its own hardcoded
// `this.createStylesheet('IS_IDA_DRAGGABLE', path)` call in
// IS_CV_PUBLIC_HOOK.js, not through the generic cssIncludes config list —
// so it's checked separately (as a literal source snippet) rather than
// via extractIncludeList().
const DRAGGABLE_CSS_NAME = 'IS_IDA_DRAGGABLE';
const DRAGGABLE_LOAD_CALL = `createStylesheet('${DRAGGABLE_CSS_NAME}'`;

const PROJECT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MANIFEST_PATH = path.join(PROJECT_ROOT, 'vendor', 'manifest.json');

function sha256(buffer) {
    return createHash('sha256').update(buffer).digest('hex');
}

/**
 * extractIncludeList(hookScriptSource, key)
 * Pulls the string entries out of IS_CV_PUBLIC_HOOK.js's
 * `IS.PubCV.Config = { ..., jsIncludes: [...], cssIncludes: [...] }`
 * literal. Returns null (rather than throwing) if the expected shape isn't
 * found, so a vendor restructuring is reported as "couldn't verify"
 * instead of silently treated as "no files".
 */
function extractIncludeList(source, key) {
    const match = source.match(new RegExp(`${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`));
    if (!match) return null;
    return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
}

async function main() {
    const manifestRaw = await readFile(MANIFEST_PATH, 'utf8').catch(() => null);
    if (!manifestRaw) {
        console.error('No vendor/manifest.json found — run `npm run fetch-vendor` first.');
        process.exitCode = 1;
        return;
    }
    const manifest = JSON.parse(manifestRaw);
    const knownByPath = new Map(manifest.files.map((f) => [f.path, f]));

    let changed = false;
    let hookSource = null;

    console.log(`Comparing live vendor files against manifest from ${manifest.fetchedAt}...\n`);

    for (const file of allVendorFiles()) {
        const res = await fetch(file.url);
        if (!res.ok) {
            console.log(`  ! ${file.relPath}: fetch failed (${res.status})`);
            changed = true;
            continue;
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        if (file.relPath === 'IS_CV_PUBLIC_HOOK.js') {
            hookSource = buffer.toString('utf8');
        }

        const known = knownByPath.get(file.relPath);
        const liveHash = sha256(buffer);
        if (!known) {
            console.log(`  + ${file.relPath}: new file, not in manifest`);
            changed = true;
        } else if (known.sha256 !== liveHash) {
            console.log(`  ~ ${file.relPath}: changed (${known.bytes} -> ${buffer.length} bytes)`);
            changed = true;
        } else {
            console.log(`    ${file.relPath}: unchanged`);
        }
    }

    console.log('\nChecking IS_CV_PUBLIC_HOOK.js\'s own include list for structural drift...');
    if (hookSource) {
        const liveJs = extractIncludeList(hookSource, 'jsIncludes');
        const liveCss = extractIncludeList(hookSource, 'cssIncludes');
        // jsIncludes covers every JS file except the hook itself (which
        // doesn't self-list), including IS_CV_ENV_CONFIG even though it's
        // actually fetched from the root path, not scripts/.
        const expectedJs = [...ROOT_FILES.filter((f) => f !== 'IS_CV_PUBLIC_HOOK.js'), ...SCRIPT_FILES]
            .map((f) => f.replace(/\.js$/, ''));
        // cssIncludes only covers the generically-loaded stylesheets —
        // IS_IDA_DRAGGABLE.css is deliberately excluded; see DRAGGABLE_LOAD_CALL below.
        const expectedCss = STYLE_FILES
            .filter((f) => f !== `${DRAGGABLE_CSS_NAME}.css`)
            .map((f) => f.replace(/\.css$/, ''));

        if (liveJs === null || liveCss === null) {
            console.log('  ! could not locate jsIncludes/cssIncludes in the current hook script — it may have been restructured. Check manually.');
            changed = true;
        } else {
            const jsDiff = diffLists(expectedJs, liveJs);
            const cssDiff = diffLists(expectedCss, liveCss);
            if (jsDiff.added.length || jsDiff.removed.length) {
                console.log(`  ~ jsIncludes changed: +[${jsDiff.added}] -[${jsDiff.removed}]`);
                changed = true;
            }
            if (cssDiff.added.length || cssDiff.removed.length) {
                console.log(`  ~ cssIncludes changed: +[${cssDiff.added}] -[${cssDiff.removed}]`);
                changed = true;
            }
            if (!jsDiff.added.length && !jsDiff.removed.length && !cssDiff.added.length && !cssDiff.removed.length) {
                console.log('    include list unchanged');
            }
        }

        if (hookSource.includes(DRAGGABLE_LOAD_CALL)) {
            console.log(`    ${DRAGGABLE_CSS_NAME}.css: still loaded via its dedicated createStylesheet() call`);
        } else {
            console.log(`  ~ ${DRAGGABLE_CSS_NAME}.css: its dedicated createStylesheet() call is gone or was rewritten — check manually`);
            changed = true;
        }
    } else {
        console.log('  ! IS_CV_PUBLIC_HOOK.js could not be fetched — skipped structural check.');
        changed = true;
    }

    if (changed) {
        console.log('\nVendor has changes. Review them, then run `npm run fetch-vendor` and `npm run build` to pull them in.');
        process.exitCode = 1;
    } else {
        console.log('\nNo changes detected.');
    }
}

function diffLists(expected, live) {
    const expectedSet = new Set(expected);
    const liveSet = new Set(live);
    return {
        added: live.filter((f) => !expectedSet.has(f)),
        removed: expected.filter((f) => !liveSet.has(f)),
    };
}

main().catch((err) => {
    console.error('check-updates failed:', err);
    process.exitCode = 1;
});
