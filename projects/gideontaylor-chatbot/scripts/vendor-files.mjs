// Single source of truth for which files make up the chatbot's asset chain,
// and the base URL they're mirrored from. IS_CV_PUBLIC_HOOK.js derives its
// own base path from wherever it was loaded (CURRENT_SCRIPT.src), then
// requests every other JS file at `${path}scripts/${name}.js` (except
// IS_CV_ENV_CONFIG, which lives at `${path}${name}.js`) and every CSS file
// at `${path}styles/${name}.css` — so this relative layout must be
// preserved exactly, both in vendor/ and in dist/.

export const VENDOR_BASE_URL = 'https://chatui.ida.gideontaylor.com/vccsoda/';

// Root-level files (loaded from `${path}${name}.js`, no subdirectory).
export const ROOT_FILES = [
    'IS_CV_PUBLIC_HOOK.js',
    'IS_CV_ENV_CONFIG.js',
];

// Files IS_CV_PUBLIC_HOOK.js's own config lists under `scripts/`.
export const SCRIPT_FILES = [
    'IS_CORE_CONFIG_JS.js',
    'is_core_lite.js',
    'IS_CV_OB_SETTINGS_SDK.js',
    'IS_CV_OB_WIDGET_SDK.js',
    'web-sdk.js',
    'IS_CV_OUTAGE_SETTING.js',
];

// Files IS_CV_PUBLIC_HOOK.js's own config lists under `styles/`.
export const STYLE_FILES = [
    'IS_CV_THEME_BASE.css',
    'IS_CV_OB_STYLES_SDK.css',
    'CLIENT_CV_OB_REMOTE_STYLES.css',
    'IS_IDA_DRAGGABLE.css',
];

/**
 * allVendorFiles()
 * Returns every mirrored file as { relPath, url }, where relPath is the
 * path under vendor/ (and, after build, under dist/) and url is where to
 * fetch it from the vendor.
 */
export function allVendorFiles() {
    const files = [];
    for (const name of ROOT_FILES) {
        files.push({ relPath: name, url: VENDOR_BASE_URL + name });
    }
    for (const name of SCRIPT_FILES) {
        files.push({ relPath: `scripts/${name}`, url: `${VENDOR_BASE_URL}scripts/${name}` });
    }
    for (const name of STYLE_FILES) {
        files.push({ relPath: `styles/${name}`, url: `${VENDOR_BASE_URL}styles/${name}` });
    }
    return files;
}

/**
 * Files that arrive already minified/packed (Oracle's pre-built web-sdk.js
 * bundle, and is_core_lite.js's eval-packed obfuscation). Re-minifying
 * these risks corrupting them for negligible gain (measured well under 1%
 * on both), so the build step copies them through unchanged instead.
 */
export const PRE_MINIFIED_FILES = new Set([
    'scripts/web-sdk.js',
    'scripts/is_core_lite.js',
]);
