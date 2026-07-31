// Downloads every file in the chatbot's asset chain from the vendor
// (chatui.ida.gideontaylor.com) into vendor/, preserving the scripts/ and
// styles/ layout the hook script expects, and writes vendor/manifest.json
// recording each file's source URL, size, and content hash. That manifest
// is the baseline check-updates.mjs diffs future vendor fetches against.
//
// Run this to do the initial mirror, and again (deliberately, as a
// release step) whenever the vendor's source has changed and you want to
// pull those changes in.

import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allVendorFiles, VENDOR_BASE_URL } from './vendor-files.mjs';

const PROJECT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const VENDOR_DIR = path.join(PROJECT_ROOT, 'vendor');

function sha256(buffer) {
    return createHash('sha256').update(buffer).digest('hex');
}

async function fetchVendorFile({ relPath, url }) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const destPath = path.join(VENDOR_DIR, relPath);
    await mkdir(path.dirname(destPath), { recursive: true });
    await writeFile(destPath, buffer);
    return {
        path: relPath,
        url,
        bytes: buffer.length,
        sha256: sha256(buffer),
    };
}

async function main() {
    const files = allVendorFiles();
    const results = [];
    for (const file of files) {
        const result = await fetchVendorFile(file);
        results.push(result);
        console.log(`  ${result.path} (${result.bytes} bytes)`);
    }

    const manifest = {
        baseUrl: VENDOR_BASE_URL,
        fetchedAt: new Date().toISOString(),
        files: results,
    };
    await writeFile(
        path.join(VENDOR_DIR, 'manifest.json'),
        JSON.stringify(manifest, null, 2) + '\n',
    );

    console.log(`\nFetched ${results.length} files into vendor/. Wrote vendor/manifest.json.`);
}

main().catch((err) => {
    console.error('fetch-vendor failed:', err);
    process.exitCode = 1;
});
