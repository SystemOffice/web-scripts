// Builds dist/ from vendor/: minifies the vendor's own hand-authored JS/CSS
// (terser / csso), copies the already-minified/packed files through
// unchanged (re-minifying them risks corrupting them for negligible gain —
// see PRE_MINIFIED_FILES), and applies the welcome-bubble transform patch
// to styles/IS_CV_OB_STYLES_SDK.css before minifying it.
//
// dist/ preserves the same scripts/ and styles/ layout as vendor/ — this
// is required, not cosmetic: IS_CV_PUBLIC_HOOK.js derives its own base path
// from wherever it was loaded and requests every other file relative to
// that path (see vendor-files.mjs), so dist/ must mirror that layout for
// hosting to work once it's served via jsDelivr.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify as terserMinify } from 'terser';
import { minify as cssoMinify } from 'csso';
import { allVendorFiles, PRE_MINIFIED_FILES } from './vendor-files.mjs';
import { applyWelcomeBubbleAnimationPatch } from '../patches/welcome-bubble-animation.mjs';

const PROJECT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const VENDOR_DIR = path.join(PROJECT_ROOT, 'vendor');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');

const PATCHED_CSS_FILE = 'styles/IS_CV_OB_STYLES_SDK.css';

async function buildJs(relPath, source) {
    if (PRE_MINIFIED_FILES.has(relPath)) {
        return { output: source, note: 'copied as-is (already minified/packed)' };
    }
    const result = await terserMinify(source, { compress: true, mangle: true, format: { comments: false } });
    if (!result.code) {
        throw new Error(`terser produced no output for ${relPath}`);
    }
    return { output: result.code, note: 'minified' };
}

function buildCss(relPath, source) {
    let working = source;
    let note = 'minified';
    if (relPath === PATCHED_CSS_FILE) {
        working = applyWelcomeBubbleAnimationPatch(working);
        note = 'patched (welcome-bubble animation) + minified';
    }
    const result = cssoMinify(working);
    return { output: result.css, note };
}

async function main() {
    const summary = [];

    for (const file of allVendorFiles()) {
        const srcPath = path.join(VENDOR_DIR, file.relPath);
        const source = await readFile(srcPath, 'utf8');
        const isCss = file.relPath.endsWith('.css');

        const { output, note } = isCss
            ? buildCss(file.relPath, source)
            : await buildJs(file.relPath, source);

        const destPath = path.join(DIST_DIR, file.relPath);
        await mkdir(path.dirname(destPath), { recursive: true });
        await writeFile(destPath, output);

        summary.push({
            path: file.relPath,
            before: Buffer.byteLength(source, 'utf8'),
            after: Buffer.byteLength(output, 'utf8'),
            note,
        });
    }

    console.log('Built dist/:\n');
    let totalBefore = 0;
    let totalAfter = 0;
    for (const row of summary) {
        totalBefore += row.before;
        totalAfter += row.after;
        const pct = row.before ? Math.round((1 - row.after / row.before) * 100) : 0;
        console.log(`  ${row.path.padEnd(32)} ${String(row.before).padStart(7)} -> ${String(row.after).padStart(7)} bytes (${pct}%)  [${row.note}]`);
    }
    console.log(`\n  TOTAL${' '.repeat(28)} ${String(totalBefore).padStart(7)} -> ${String(totalAfter).padStart(7)} bytes`
        + ` (${Math.round((1 - totalAfter / totalBefore) * 100)}% smaller)`);
}

main().catch((err) => {
    console.error('build failed:', err);
    process.exitCode = 1;
});
